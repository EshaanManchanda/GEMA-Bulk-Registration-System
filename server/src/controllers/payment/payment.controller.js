const asyncHandler = require('../../middleware/async.middleware');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');
const mongoose = require('mongoose');
const { startTransaction, commitTransaction, abortTransaction } = require('../../utils/transactionHelper');
const Batch = require('../../models/Batch');
const Payment = require('../../models/Payment');
const Registration = require('../../models/Registration');
const School = require('../../models/School');
const Event = require('../../models/Event');
const stripeService = require('../../services/stripe.service');
const storageService = require('../../services/storage.service');
const invoiceService = require('../../services/invoice.service');
const { PAYMENT_STATUS, PAYMENT_MODE, BATCH_STATUS } = require('../../utils/constants');

/**
 * @desc    Initiate online payment for batch
 * @route   POST /api/v1/payments/initiate
 * @access  Private (School)
 */
exports.initiatePayment = asyncHandler(async (req, res, next) => {
  const { batch_reference, batchReference } = req.body;
  const batchRef = batch_reference || batchReference; // Support both formats

  // Find batch
  const batch = await Batch.findOne({
    batch_reference: batchRef,
    school_id: req.user.id
  }).populate('school_id', 'name school_code contact_person').populate('event_id', 'title event_slug');

  if (!batch) {
    return next(new AppError('Batch not found', 404));
  }

  // Check if batch is in draft status
  if (batch.status !== BATCH_STATUS.DRAFT) {
    return next(new AppError('Batch has already been submitted', 400));
  }

  // Check if payment already exists and is completed (allow PENDING, FAILED, and PROCESSING)
  if (batch.payment_status === PAYMENT_STATUS.COMPLETED) {
    return next(new AppError('Payment already completed for this batch', 400));
  }

  // Always use Stripe for all currencies
  const gateway = 'stripe';

  let paymentData;
  let gatewayOrderId;
  let gatewayPaymentData;

  try {
    // Create Stripe payment intent
    const intentData = await stripeService.createPaymentIntent({
      amount: batch.total_amount,
      currency: batch.currency,
      customer_email: batch.school_id.contact_person.email,
      description: `[${batch.school_id.school_code}] Registration for ${batch.event_id.title} - ${batch.student_count} students`,
      metadata: {
        batch_reference: batch.batch_reference,
        school_code: batch.school_id.school_code,
        event_slug: batch.event_id.event_slug,
        student_count: batch.student_count.toString()
      }
    });

    gatewayOrderId = intentData.payment_intent_id;
    gatewayPaymentData = {
      payment_intent_id: intentData.payment_intent_id,
      client_secret: intentData.client_secret,
      publishable_key: process.env.STRIPE_PUBLISHABLE_KEY
    };

    // Create payment record
    paymentData = await Payment.create({
      batch_id: batch._id,
      school_id: batch.school_id._id,
      event_id: batch.event_id._id,
      amount: batch.total_amount,
      currency: batch.currency,
      payment_mode: PAYMENT_MODE.ONLINE,
      payment_gateway: gateway,
      gateway_order_id: gatewayOrderId,
      payment_status: PAYMENT_STATUS.PENDING
    });

    // Update batch
    batch.payment_status = PAYMENT_STATUS.PROCESSING;
    batch.payment_mode = PAYMENT_MODE.ONLINE;
    batch.payment_gateway = gateway;
    await batch.save();

    logger.info(`Payment initiated: ${paymentData._id} for batch: ${batch.batch_reference} via ${gateway}`);

    res.status(200).json({
      status: 'success',
      data: {
        payment_id: paymentData._id,
        batch_reference: batch.batch_reference,
        amount: batch.total_amount,
        currency: batch.currency,
        gateway: gateway,
        gateway_data: gatewayPaymentData
      }
    });

  } catch (error) {
    logger.error('Payment initiation error:', error);

    // Update batch status to failed
    batch.payment_status = PAYMENT_STATUS.FAILED;
    await batch.save();

    throw new AppError('Failed to initiate payment. Please try again.', 500);
  }
});

/**
 * @desc    Verify online payment (Stripe)
 * @route   POST /api/v1/payments/verify/stripe
 * @access  Private (School)
 */
exports.verifyStripePayment = asyncHandler(async (req, res, next) => {
  const { payment_intent_id } = req.body;

  // Find payment record
  const payment = await Payment.findOne({
    gateway_order_id: payment_intent_id,
    school_id: req.user.id
  }).populate('batch_id');

  if (!payment) {
    return next(new AppError('Payment record not found', 404));
  }

  // Fetch payment intent from Stripe
  const paymentIntent = await stripeService.getPaymentIntent(payment_intent_id);

  if (paymentIntent.status !== 'succeeded') {
    return next(new AppError('Payment not completed', 400));
  }

  // Start transaction for atomic payment verification
  const { session, useTransaction } = await startTransaction();

  try {
    // Update payment record
    payment.gateway_payment_id = paymentIntent.charge_id;
    payment.status = PAYMENT_STATUS.COMPLETED;
    payment.gateway_response = paymentIntent;
    payment.paid_at = new Date();
    if (useTransaction) {
      await payment.save({ session });
    } else {
      await payment.save();
    }

    // Update all registrations in batch to CONFIRMED
    const batch = payment.batch_id;
    await Registration.bulkConfirmByBatch(batch._id, useTransaction ? { session } : {});

    // Update batch
    batch.payment_status = PAYMENT_STATUS.COMPLETED;
    batch.status = BATCH_STATUS.SUBMITTED;
    if (useTransaction) {
      await batch.save({ session });
    } else {
      await batch.save();
    }

    // Commit transaction
    await commitTransaction(session, useTransaction);

    logger.info(`Stripe payment verified: ${payment_intent_id} for batch: ${batch.batch_reference}`);

    // Generate invoice asynchronously (don't wait for it to avoid blocking response)
    setImmediate(async () => {
      try {
        const emailService = require('../../services/email.service');
        const fullPayment = await Payment.findById(payment._id)
          .populate('school_id')
          .populate('event_id')
          .populate({
            path: 'batch_id',
            populate: {
              path: 'registration_ids',
              select: 'student_name grade section'
            }
          });

        if (!fullPayment) {
          logger.error(`Payment not found for invoice generation: ${payment._id}`);
          return;
        }

        const fullBatch = fullPayment.batch_id;

        if (!fullBatch || !fullBatch.registration_ids || fullBatch.registration_ids.length === 0) {
          logger.error(`Batch or registrations not found for invoice: ${batch.batch_reference}`);
          return;
        }

        const invoiceResult = await invoiceService.generateInvoice({
          payment: fullPayment,
          batch: fullBatch,
          school: fullPayment.school_id,
          event: fullPayment.event_id,
          registrations: fullBatch.registration_ids
        });

        fullBatch.invoice_pdf_url = invoiceResult.cloudinaryUrl;
        fullBatch.invoice_number = invoiceResult.invoiceNumber;
        fullBatch.invoice_generated_at = new Date();
        await fullBatch.save();

        logger.info(`Invoice auto-generated: ${invoiceResult.invoiceNumber} for batch: ${batch.batch_reference}`);

        // Send payment confirmation email
        try {
          await emailService.sendPaymentConfirmation({
            payment: fullPayment,
            batch: fullBatch,
            school: fullPayment.school_id,
            event: fullPayment.event_id
          });
          logger.info(`Payment confirmation email sent to: ${fullPayment.school_id.contact_person.email}`);
        } catch (emailError) {
          logger.error('Failed to send payment confirmation email:', emailError);
          // Email failure should not fail the whole process
        }
      } catch (error) {
        logger.error(`Auto invoice generation failed for batch ${batch.batch_reference}:`, {
          error: error.message,
          stack: error.stack,
          batch_reference: batch.batch_reference,
          payment_id: payment._id
        });
        // Invoice can be regenerated later via admin panel
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment verified successfully',
      data: {
        payment_id: payment._id,
        batch_reference: batch.batch_reference,
        amount: payment.amount,
        currency: payment.currency,
        payment_status: payment.payment_status,
        receipt_url: paymentIntent.receipt_url
      }
    });

  } catch (error) {
    // Rollback transaction on error
    await abortTransaction(session, useTransaction);
    logger.error('Stripe payment verification failed:', error);
    return next(new AppError('Payment verification failed. Please try again.', 500));
  }
});

/**
 * @desc    Initiate offline payment (bank transfer)
 * @route   POST /api/v1/payments/offline
 * @access  Private (School)
 */
exports.initiateOfflinePayment = asyncHandler(async (req, res, next) => {
  const { batch_reference, batchReference, bank_details, transaction_reference, transaction_id } = req.body;
  const batchRef = batch_reference || batchReference; // Support both formats
  const transactionRef = transaction_reference || transaction_id; // Support both formats

  // Check if receipt uploaded
  if (!req.file) {
    return next(new AppError('Please upload payment receipt', 400));
  }

  // Find batch
  const batch = await Batch.findOne({
    batch_reference: batchRef,
    school_id: req.user.id
  }).populate('event_id', 'title');

  if (!batch) {
    return next(new AppError('Batch not found', 404));
  }

  // Check batch status
  if (batch.status !== BATCH_STATUS.DRAFT) {
    return next(new AppError('Batch has already been submitted', 400));
  }

  // Upload receipt to storage (Cloudinary or local)
  const receiptUpload = await storageService.uploadReceipt(
    req.file.buffer,
    req.file.originalname,
    batchRef,
    req.file.mimetype
  );

  // Create payment record
  const payment = await Payment.create({
    batch_id: batch._id,
    school_id: batch.school_id,
    event_id: batch.event_id._id,
    amount: batch.total_amount,
    currency: batch.currency,
    payment_mode: PAYMENT_MODE.OFFLINE,
    status: PAYMENT_STATUS.PENDING,
    offline_payment_details: {
      bank_name: bank_details?.bank_name || '',
      transaction_reference: transactionRef,
      receipt_url: receiptUpload.secure_url,
      submitted_at: new Date()
    }
  });

  // Update batch
  batch.payment_status = PAYMENT_STATUS.PENDING;
  batch.payment_mode = PAYMENT_MODE.OFFLINE;
  batch.status = BATCH_STATUS.SUBMITTED; // Submitted but pending verification
  batch.offline_payment_details = {
    transaction_reference: transactionRef,
    receipt_url: receiptUpload.secure_url,
    submitted_at: new Date()
  };
  await batch.save();

  logger.info(`Offline payment submitted: ${payment._id} for batch: ${batch.batch_reference}`);

  // Send offline payment submission email and admin alert (non-blocking)
  setImmediate(async () => {
    try {
      const emailService = require('../../services/email.service');
      const fullPayment = await Payment.findById(payment._id)
        .populate('school_id')
        .populate('event_id')
        .populate('batch_id');

      // Send confirmation to school
      await emailService.sendOfflinePaymentSubmitted({
        payment: fullPayment,
        batch: fullPayment.batch_id,
        school: fullPayment.school_id,
        event: fullPayment.event_id
      });
      logger.info(`Offline payment submission email sent to: ${fullPayment.school_id.contact_person.email}`);

      // Notify admins about pending verification
      const Admin = require('../../models/Admin');
      const activeAdmins = await Admin.find({ is_active: true }).select('email');
      const adminEmails = activeAdmins.map(admin => admin.email);

      if (adminEmails.length > 0) {
        await emailService.sendNewOfflinePaymentAlert({
          payment: fullPayment,
          batch: fullPayment.batch_id,
          school: fullPayment.school_id,
          event: fullPayment.event_id,
          adminEmails
        });
        logger.info(`Admin notification sent for offline payment: ${batch.batch_reference}`);
      }
    } catch (emailError) {
      logger.error('Failed to send offline payment emails:', emailError);
    }
  });

  res.status(201).json({
    status: 'success',
    message: 'Offline payment submitted. Awaiting admin verification.',
    data: {
      payment_id: payment._id,
      batch_reference: batch.batch_reference,
      amount: payment.amount,
      currency: payment.currency,
      payment_status: payment.payment_status,
      receipt_url: receiptUpload.secure_url
    }
  });
});

/**
 * @desc    Get payment details
 * @route   GET /api/v1/payments/:paymentId
 * @access  Private (School - own payments, Admin - all)
 */
exports.getPayment = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;

  // Build query - support both _id and payment_reference
  const isObjectId = mongoose.Types.ObjectId.isValid(paymentId);
  const query = isObjectId
    ? { _id: paymentId }
    : { payment_reference: paymentId };

  // If school user, restrict to own payments
  if (req.user.user_type === 'school') {
    query.school_id = req.user.id;
  }

  const payment = await Payment.findOne(query)
    .populate('school_id', 'name school_code contact_person')
    .populate('event_id', 'title event_slug')
    .populate('batch_id', 'batch_reference student_count invoice_pdf_url status')
    .populate('offline_payment_details.verified_by', 'name email');

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { payment }
  });
});

/**
 * @desc    Get all payments for a school
 * @route   GET /api/v1/payments/school/my-payments
 * @access  Private (School)
 */
exports.getMyPayments = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, payment_status, payment_mode } = req.query;

  // Build query
  const query = { school_id: req.user.id };

  if (payment_status) {
    query.status = payment_status;
  }

  if (payment_mode) {
    query.payment_mode = payment_mode;
  }

  // Execute query with pagination
  const payments = await Payment.find(query)
    .populate('event_id', 'title event_slug')
    .populate('batch_id', 'batch_reference student_count')
    .sort({ created_at: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Payment.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      payments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Admin verify offline payment
 * @route   PUT /api/v1/payments/:paymentId/verify
 * @access  Private (Admin)
 */
exports.verifyOfflinePayment = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;
  const { verification_notes } = req.body;

  // Find payment
  const payment = await Payment.findById(paymentId).populate('batch_id');

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  // Check if offline payment
  if (payment.payment_mode !== PAYMENT_MODE.OFFLINE) {
    return next(new AppError('This is not an offline payment', 400));
  }

  // Check if already verified
  if (payment.payment_status === PAYMENT_STATUS.COMPLETED) {
    return next(new AppError('Payment already verified', 400));
  }

  // Start transaction for atomic payment verification
  const { session, useTransaction } = await startTransaction();

  try {
    // Update payment
    payment.status = PAYMENT_STATUS.COMPLETED;
    payment.paid_at = new Date();
    payment.offline_payment_details.verified_by = req.user.id;
    payment.offline_payment_details.verified_at = new Date();
    payment.offline_payment_details.verification_notes = verification_notes || '';
    if (useTransaction) {
      await payment.save({ session });
    } else {
      await payment.save();
    }

    // Update all registrations in batch to CONFIRMED
    const batch = payment.batch_id;
    await Registration.bulkConfirmByBatch(batch._id, useTransaction ? { session } : {});

    // Update batch
    batch.payment_status = PAYMENT_STATUS.COMPLETED;
    batch.status = BATCH_STATUS.CONFIRMED;
    batch.offline_payment_details.verified_by = req.user.id;
    batch.offline_payment_details.verified_at = new Date();
    if (useTransaction) {
      await batch.save({ session });
    } else {
      await batch.save();
    }

    // Commit transaction
    await commitTransaction(session, useTransaction);

    logger.info(`Offline payment verified: ${paymentId} by admin: ${req.user.id}`);

    // Generate invoice and send verification email (non-blocking)
    setImmediate(async () => {
      try {
        const emailService = require('../../services/email.service');
        const fullPayment = await Payment.findById(payment._id)
          .populate('school_id')
          .populate('event_id')
          .populate({
            path: 'batch_id',
            populate: {
              path: 'registration_ids',
              select: 'student_name grade section'
            }
          });

        const fullBatch = fullPayment.batch_id;

        // Generate invoice
        const invoiceResult = await invoiceService.generateInvoice({
          payment: fullPayment,
          batch: fullBatch,
          school: fullPayment.school_id,
          event: fullPayment.event_id,
          registrations: fullBatch.registration_ids
        });

        fullBatch.invoice_pdf_url = invoiceResult.cloudinaryUrl;
        await fullBatch.save();

        logger.info(`Invoice auto-generated: ${invoiceResult.invoiceNumber} for batch: ${batch.batch_reference}`);

        // Send verification email
        try {
          await emailService.sendOfflinePaymentVerified({
            payment: fullPayment,
            batch: fullBatch,
            school: fullPayment.school_id,
            event: fullPayment.event_id
          });
          logger.info(`Offline payment verification email sent to: ${fullPayment.school_id.contact_person.email}`);
        } catch (emailError) {
          logger.error('Failed to send verification email:', emailError);
        }
      } catch (error) {
        logger.error('Auto invoice generation failed for offline payment:', error);
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Offline payment verified successfully',
      data: { payment }
    });

  } catch (error) {
    // Rollback transaction on error
    await abortTransaction(session, useTransaction);
    logger.error('Offline payment verification failed:', error);
    return next(new AppError('Payment verification failed. Please try again.', 500));
  }
});

/**
 * @desc    Admin reject offline payment
 * @route   PUT /api/v1/payments/:paymentId/reject
 * @access  Private (Admin)
 */
exports.rejectOfflinePayment = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;
  const { rejection_reason } = req.body;

  if (!rejection_reason) {
    return next(new AppError('Please provide rejection reason', 400));
  }

  // Find payment
  const payment = await Payment.findById(paymentId).populate('batch_id');

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  // Check if offline payment
  if (payment.payment_mode !== PAYMENT_MODE.OFFLINE) {
    return next(new AppError('This is not an offline payment', 400));
  }

  // Update payment
  payment.payment_status = PAYMENT_STATUS.FAILED;
  payment.offline_payment_details.verified_by = req.user.id;
  payment.offline_payment_details.verified_at = new Date();
  payment.offline_payment_details.verification_notes = `REJECTED: ${rejection_reason}`;
  await payment.save();

  // Update batch
  const batch = payment.batch_id;
  batch.payment_status = PAYMENT_STATUS.FAILED;
  batch.status = BATCH_STATUS.DRAFT; // Allow resubmission
  await batch.save();

  logger.info(`Offline payment rejected: ${paymentId} by admin: ${req.user.id}`);

  // Send rejection email (non-blocking)
  setImmediate(async () => {
    try {
      const emailService = require('../../services/email.service');
      const fullPayment = await Payment.findById(payment._id)
        .populate('school_id')
        .populate('event_id')
        .populate('batch_id');

      await emailService.sendOfflinePaymentRejected({
        payment: fullPayment,
        batch: fullPayment.batch_id,
        school: fullPayment.school_id,
        event: fullPayment.event_id,
        reason: rejection_reason
      });
      logger.info(`Offline payment rejection email sent to: ${fullPayment.school_id.contact_person.email}`);
    } catch (emailError) {
      logger.error('Failed to send rejection email:', emailError);
    }
  });

  res.status(200).json({
    status: 'success',
    message: 'Offline payment rejected',
    data: { payment }
  });
});

/**
 * @desc    Download payment receipt
 * @route   GET /api/v1/payments/:paymentId/receipt
 * @access  Private (School or Admin)
 */
exports.downloadReceipt = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId)
    .populate('school_id', '_id')
    .select('receipt_url payment_status school_id offline_payment_details');

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  // Check authorization - school can only access own payments
  if (req.user.role === 'school' && payment.school_id._id.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to access this receipt', 403));
  }

  // Check if receipt exists
  const receiptUrl = payment.receipt_url || payment.offline_payment_details?.receipt_url;
  if (!receiptUrl) {
    return next(new AppError('No receipt available for this payment', 404));
  }

  // Redirect to the receipt URL (Cloudinary or other storage)
  res.redirect(receiptUrl);
});
