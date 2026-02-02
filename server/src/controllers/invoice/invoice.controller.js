const asyncHandler = require('../../middleware/async.middleware');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');
const Payment = require('../../models/Payment');
const Batch = require('../../models/Batch');
const invoiceService = require('../../services/invoice.service');

/**
 * @desc    Generate invoice for a payment
 * @route   POST /api/v1/invoices/generate/:paymentId
 * @access  Private (Admin or School - own payments)
 */
exports.generateInvoice = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;

  // Build query
  const query = { _id: paymentId };

  // If school user, restrict to own payments
  if (req.user.user_type === 'school') {
    query.school_id = req.user.id;
  }

  // Find payment with all necessary data
  const payment = await Payment.findOne(query)
    .populate('school_id')
    .populate('event_id')
    .populate({
      path: 'batch_id',
      populate: {
        path: 'registration_ids',
        select: 'student_name grade section'
      }
    });

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  // Check if payment is completed
  if (payment.status !== 'completed') {
    return next(new AppError('Invoice can only be generated for completed payments', 400));
  }

  const batch = payment.batch_id;
  const registrations = batch.registration_ids;

  // Generate invoice
  const invoiceResult = await invoiceService.generateInvoice({
    payment,
    batch,
    school: payment.school_id,
    event: payment.event_id,
    registrations
  });

  // Update batch with invoice URL
  batch.invoice_pdf_url = invoiceResult.cloudinaryUrl;
  await batch.save();

  logger.info(`Invoice generated manually: ${invoiceResult.invoiceNumber} for payment: ${paymentId}`);

  res.status(200).json({
    status: 'success',
    message: 'Invoice generated successfully',
    data: {
      invoice_number: invoiceResult.invoiceNumber,
      invoice_url: invoiceResult.cloudinaryUrl
    }
  });
});

/**
 * @desc    Download invoice for a batch
 * @route   GET /api/v1/invoices/download/:batchReference
 * @access  Private (School - own batches, Admin - all)
 */
exports.downloadInvoice = asyncHandler(async (req, res, next) => {
  const { batchReference } = req.params;

  // Build query
  const query = { batch_reference: batchReference };

  // If school user, restrict to own batches
  if (req.user.user_type === 'school') {
    query.school_id = req.user.id;
  }

  // Find batch
  const batch = await Batch.findOne(query)
    .populate('school_id')
    .populate('event_id');

  if (!batch) {
    return next(new AppError('Batch not found', 404));
  }

  // Check if invoice exists
  if (!batch.invoice_pdf_url) {
    return next(new AppError('Invoice not yet generated for this batch', 404));
  }

  // Redirect to Cloudinary URL
  res.redirect(batch.invoice_pdf_url);
});

/**
 * @desc    Get invoice URL for a batch
 * @route   GET /api/v1/invoices/url/:batchReference
 * @access  Private (School - own batches, Admin - all)
 */
exports.getInvoiceUrl = asyncHandler(async (req, res, next) => {
  const { batchReference } = req.params;

  // Build query
  const query = { batch_reference: batchReference };

  // If school user, restrict to own batches
  if (req.user.user_type === 'school') {
    query.school_id = req.user.id;
  }

  // Find batch
  const batch = await Batch.findOne(query)
    .select('batch_reference invoice_pdf_url payment_status');

  if (!batch) {
    return next(new AppError('Batch not found', 404));
  }

  // Check if invoice exists
  if (!batch.invoice_pdf_url) {
    return next(new AppError('Invoice not yet generated for this batch', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      batch_reference: batch.batch_reference,
      invoice_url: batch.invoice_pdf_url,
      payment_status: batch.payment_status
    }
  });
});

/**
 * @desc    Regenerate invoice for a batch
 * @route   POST /api/v1/invoices/regenerate/:batchReference
 * @access  Private (Admin only)
 */
exports.regenerateInvoice = asyncHandler(async (req, res, next) => {
  const { batchReference } = req.params;

  // Find batch
  const batch = await Batch.findOne({ batch_reference: batchReference })
    .populate('school_id')
    .populate('event_id')
    .populate({
      path: 'registration_ids',
      select: 'student_name grade section'
    });

  if (!batch) {
    return next(new AppError('Batch not found', 404));
  }

  // Find payment
  const payment = await Payment.findOne({ batch_id: batch._id })
    .sort({ created_at: -1 });

  if (!payment) {
    return next(new AppError('Payment not found for this batch', 404));
  }

  // Check if payment is completed
  if (payment.status !== 'completed') {
    return next(new AppError('Invoice can only be generated for completed payments', 400));
  }

  const registrations = batch.registration_ids;

  // Regenerate invoice
  const invoiceResult = await invoiceService.regenerateInvoice({
    payment,
    batch,
    school: batch.school_id,
    event: batch.event_id,
    registrations
  });

  // Update batch with new invoice URL
  batch.invoice_pdf_url = invoiceResult.cloudinaryUrl;
  await batch.save();

  logger.info(`Invoice regenerated: ${invoiceResult.invoiceNumber} for batch: ${batchReference}`);

  res.status(200).json({
    status: 'success',
    message: 'Invoice regenerated successfully',
    data: {
      invoice_number: invoiceResult.invoiceNumber,
      invoice_url: invoiceResult.cloudinaryUrl
    }
  });
});

/**
 * @desc    Get all invoices for a school
 * @route   GET /api/v1/invoices/school/my-invoices
 * @access  Private (School)
 */
exports.getMyInvoices = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  // Find batches with invoices
  const batches = await Batch.find({
    school_id: req.user.id,
    invoice_pdf_url: { $ne: null }
  })
    .populate('event_id', 'title event_slug')
    .select('batch_reference invoice_pdf_url invoice_number invoice_generated_at payment_status total_amount currency created_at')
    .sort({ created_at: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Batch.countDocuments({
    school_id: req.user.id,
    invoice_pdf_url: { $ne: null }
  });

  res.status(200).json({
    status: 'success',
    data: {
      invoices: batches.map(batch => ({
        id: batch._id,
        invoice_number: batch.invoice_number,
        batch_reference: batch.batch_reference,
        event_title: batch.event_id.title,
        invoice_url: batch.invoice_pdf_url,
        payment_status: batch.payment_status,
        total_amount: batch.total_amount,
        currency: batch.currency,
        issue_date: batch.invoice_generated_at || batch.created_at,
        created_at: batch.created_at
      })),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Bulk generate invoices for pending batches
 * @route   POST /api/v1/invoices/bulk-generate
 * @access  Private (Admin only)
 */
exports.bulkGenerateInvoices = asyncHandler(async (req, res, next) => {
  // Find all completed payments without invoices
  const batches = await Batch.find({
    payment_status: 'completed',
    invoice_pdf_url: null
  })
    .populate('school_id')
    .populate('event_id')
    .populate({
      path: 'registration_ids',
      select: 'student_name grade section'
    })
    .limit(50); // Process max 50 at a time

  if (batches.length === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No pending invoices to generate',
      data: { generated: 0 }
    });
  }

  const results = {
    success: [],
    failed: []
  };

  // Generate invoices
  for (const batch of batches) {
    try {
      const payment = await Payment.findOne({ batch_id: batch._id })
        .sort({ created_at: -1 });

      if (!payment) {
        results.failed.push({
          batch_reference: batch.batch_reference,
          error: 'Payment not found'
        });
        continue;
      }

      const invoiceResult = await invoiceService.generateInvoice({
        payment,
        batch,
        school: batch.school_id,
        event: batch.event_id,
        registrations: batch.registration_ids
      });

      batch.invoice_pdf_url = invoiceResult.cloudinaryUrl;
      await batch.save();

      results.success.push({
        batch_reference: batch.batch_reference,
        invoice_number: invoiceResult.invoiceNumber,
        invoice_url: invoiceResult.cloudinaryUrl
      });

    } catch (error) {
      logger.error(`Failed to generate invoice for batch ${batch.batch_reference}:`, error);
      results.failed.push({
        batch_reference: batch.batch_reference,
        error: error.message
      });
    }
  }

  logger.info(`Bulk invoice generation: ${results.success.length} success, ${results.failed.length} failed`);

  res.status(200).json({
    status: 'success',
    message: `Generated ${results.success.length} invoices`,
    data: results
  });
});
