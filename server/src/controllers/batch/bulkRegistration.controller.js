const asyncHandler = require('../../middleware/async.middleware');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');
const mongoose = require('mongoose');
const { startTransaction, commitTransaction, abortTransaction } = require('../../utils/transactionHelper');
const Event = require('../../models/Event');
const Batch = require('../../models/Batch');
const Registration = require('../../models/Registration');
const Payment = require('../../models/Payment');
const School = require('../../models/School');
const csvGenerator = require('../../services/csvGenerator.service');
const csvParser = require('../../services/csvParser.service');
const csvExport = require('../../services/csvExport.service');
const currencyResolver = require('../../services/currencyResolver.service');
const storageService = require('../../services/storage.service');
const validationCache = require('../../services/validationCache.service');
const { calculateDiscount, calculateTotalAmount, generateBatchReference } = require('../../utils/helpers');
const { BATCH_STATUS, PAYMENT_STATUS } = require('../../utils/constants');

/**
 * @desc    Download CSV template for an event
 * @route   GET /api/v1/batches/template/:eventSlug
 * @access  Private (School)
 */
exports.downloadTemplate = asyncHandler(async (req, res, next) => {
  const { eventSlug } = req.params;

  // Find event
  const event = await Event.findOne({ event_slug: eventSlug });
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Check if form schema is configured
  if (!event.form_schema || event.form_schema.length === 0) {
    return next(new AppError('Event form schema not configured. Please contact administrator.', 400));
  }

  // Check if event is active
  if (event.status !== 'active') {
    return next(new AppError('This event is not currently accepting registrations', 400));
  }

  // Check if registration is still open
  const now = new Date();
  if (event.registration_start_date && now < event.registration_start_date) {
    return next(new AppError('Registration has not yet started', 400));
  }
  if (event.registration_deadline && now > event.registration_deadline) {
    return next(new AppError('Registration period has ended', 400));
  }

  // Generate CSV template
  try {
    const buffer = csvGenerator.generateTemplate(event);
    const filename = csvGenerator.generateFilename(event);

    if (!buffer || buffer.length === 0) {
      throw new Error('Generated template is empty');
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send buffer
    res.send(buffer);

    logger.info(`CSV template downloaded for event: ${event.title} by school: ${req.user.id}`);
  } catch (error) {
    logger.error(`Template generation failed for event ${event.event_slug}:`, error);
    return next(new AppError(`Failed to generate template: ${error.message}`, 500));
  }
});

/**
 * @desc    Validate CSV file without creating batch
 * @route   POST /api/v1/batches/validate
 * @access  Private (School)
 */
exports.validateCSV = asyncHandler(async (req, res, next) => {
  const { eventSlug } = req.body;

  // Check if file uploaded
  if (!req.file) {
    return next(new AppError('Please upload a CSV file', 400));
  }

  // Find school
  const school = await School.findById(req.user.id);
  if (!school) {
    return next(new AppError('School not found', 404));
  }

  // Find event
  const event = await Event.findOne({ event_slug: eventSlug });
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Parse and validate CSV
  const result = await csvParser.parseAndValidate(req.file.buffer, event);

  // Cache validation result for later use in upload endpoint
  const validationId = await validationCache.set(school._id, eventSlug, {
    success: result.success,
    data: result.data,
    summary: result.summary,
    errors: result.errors,
    currency: school.currency_pref || 'INR'
  });

  // Return validation result with validation ID
  res.status(200).json({
    status: 'success',
    data: {
      valid: result.success,
      students: result.data,
      currency: school.currency_pref || 'INR',
      summary: result.summary,
      errors: result.errors,
      error_report: result.errors.length > 0 ? csvParser.generateErrorReport(result.errors) : null,
      validation_id: validationId
    }
  });
});

/**
 * @desc    Upload CSV and create batch registration
 * @route   POST /api/v1/batches/upload
 * @access  Private (School)
 */
exports.uploadBatch = asyncHandler(async (req, res, next) => {
  const { eventSlug, validationId } = req.body;

  // Check if file uploaded
  if (!req.file) {
    return next(new AppError('Please upload a CSV file', 400));
  }

  // Find school
  const school = await School.findById(req.user.id);
  if (!school) {
    return next(new AppError('School not found', 404));
  }

  // Check if school is verified
  if (!school.is_verified) {
    return next(new AppError('Please verify your email before creating registrations', 403));
  }

  // Find event
  const event = await Event.findOne({ event_slug: eventSlug });
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Check if event is active and accepting registrations
  if (event.status !== 'active') {
    return next(new AppError('This event is not currently accepting registrations', 400));
  }

  const now = new Date();
  if (event.registration_start_date && now < event.registration_start_date) {
    return next(new AppError('Registration has not yet started', 400));
  }
  if (event.registration_deadline && now > event.registration_deadline) {
    return next(new AppError('Registration period has ended', 400));
  }

  // Try to use cached validation result first (performance optimization)
  let parseResult;
  if (validationId) {
    const cachedData = await validationCache.get(validationId, school._id, eventSlug);
    if (cachedData && cachedData.success) {
      logger.info(`Using cached validation for batch upload: ${validationId}`);
      parseResult = cachedData;
      // Delete cache entry after successful retrieval
      await validationCache.delete(validationId);
    }
  }

  // Fallback: Parse and validate CSV if cache miss or no validationId provided
  if (!parseResult) {
    logger.info('Cache miss or no validationId - parsing CSV file');
    parseResult = await csvParser.parseAndValidate(req.file.buffer, event);
  }

  // If validation failed, return errors
  if (!parseResult.success) {
    return res.status(400).json({
      status: 'fail',
      message: 'CSV validation failed',
      data: {
        summary: parseResult.summary,
        errors: parseResult.errors.slice(0, 50), // Limit errors
        error_report: csvParser.generateErrorReport(parseResult.errors)
      }
    });
  }

  // Check if minimum students requirement is met
  const studentCount = parseResult.data.length;
  if (studentCount === 0) {
    return next(new AppError('No student data found in the CSV file', 400));
  }

  // Calculate pricing based on school's currency
  const currency = school.currency_pref;
  const baseFee = currency === 'INR' ? event.base_fee_inr : event.base_fee_usd;

  // Calculate total amount with discount
  const { baseAmount, discountPercentage, discountAmount, totalAmount } = calculateTotalAmount(
    baseFee,
    studentCount,
    event.bulk_discount_rules
  );

  // Generate batch reference
  const batchReference = generateBatchReference(school.school_code);

  // Upload CSV to storage (Cloudinary or local)
  const originalFilename = req.file.originalname || `batch_${batchReference}.csv`;
  let csvFileUrl = null;

  try {
    const uploadResult = await storageService.uploadCSV(
      req.file.buffer,
      originalFilename,
      batchReference
    );
    csvFileUrl = uploadResult.secure_url;
    logger.info(`CSV uploaded to ${storageService.getProvider()}: ${uploadResult.public_id}`);
  } catch (uploadError) {
    logger.warn(`Failed to upload CSV to ${storageService.getProvider()}:`, uploadError);
    // Continue without CSV URL - non-critical error
  }

  // Start transaction for atomic batch + registrations creation
  const { session, useTransaction } = await startTransaction();

  try {
    // Create batch
    let batch;
    if (useTransaction) {
      const batchArray = await Batch.create([{
        batch_reference: batchReference,
        school_id: school._id,
        event_id: event._id,
        total_students: studentCount,
        student_count: studentCount,
        currency,
        base_amount: baseAmount,
        base_fee_per_student: baseFee,
        discount_percentage: discountPercentage,
        subtotal_amount: baseAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_status: PAYMENT_STATUS.PENDING,
        status: BATCH_STATUS.DRAFT,
        excel_file_url: csvFileUrl
      }], { session });
      batch = batchArray[0];
    } else {
      batch = await Batch.create({
        batch_reference: batchReference,
        school_id: school._id,
        event_id: event._id,
        total_students: studentCount,
        student_count: studentCount,
        currency,
        base_amount: baseAmount,
        base_fee_per_student: baseFee,
        discount_percentage: discountPercentage,
        subtotal_amount: baseAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_status: PAYMENT_STATUS.PENDING,
        status: BATCH_STATUS.DRAFT,
        excel_file_url: csvFileUrl
      });
    }

    // Create individual registrations
    const registrations = [];
    for (const studentData of parseResult.data) {
      let registration;
      if (useTransaction) {
        const regArray = await Registration.create([{
          batch_id: batch._id,
          school_id: school._id,
          event_id: event._id,
          student_name: studentData.student_name,
          grade: studentData.grade,
          section: studentData.section,
          dynamic_data: studentData.dynamic_data
        }], { session });
        registration = regArray[0];
      } else {
        registration = await Registration.create({
          batch_id: batch._id,
          school_id: school._id,
          event_id: event._id,
          student_name: studentData.student_name,
          grade: studentData.grade,
          section: studentData.section,
          dynamic_data: studentData.dynamic_data
        });
      }
      registrations.push(registration);
    }

    // Update batch with registration IDs
    batch.registration_ids = registrations.map(r => r._id);
    if (useTransaction) {
      await batch.save({ session });
    } else {
      await batch.save();
    }

    // Commit transaction if used
    await commitTransaction(session, useTransaction);

    logger.info(`Batch created: ${batchReference} for school: ${school.school_code}, event: ${event.event_slug}, students: ${studentCount}`);

    res.status(201).json({
      status: 'success',
      message: 'Batch registration created successfully',
      data: {
        batch: {
          batch_reference: batch.batch_reference,
          event_title: event.title,
          student_count: batch.student_count,
          currency: batch.currency,
          pricing: {
            base_fee: baseFee,
            subtotal: baseAmount,
            discount_percentage: discountPercentage,
            discount_amount: discountAmount,
            total_amount: totalAmount
          },
          payment_status: batch.payment_status,
          status: batch.status
        },
        registrations: registrations.map(r => ({
          registration_id: r.registration_id,
          student_name: r.student_name,
          grade: r.grade,
          section: r.section
        }))
      }
    });

  } catch (error) {
    // Rollback transaction on error if it was used
    await abortTransaction(session, useTransaction);
    logger.error('Batch creation failed:', error);

    // Pass actual error message for debugging
    const errorMessage = error.message || 'Failed to create batch registration. Please try again.';
    throw new AppError(errorMessage, 500);
  }
});

/**
 * @desc    Get batch details
 * @route   GET /api/v1/batches/:batchReference
 * @access  Private (School - own batches, Admin - all)
 */
exports.getBatch = asyncHandler(async (req, res, next) => {
  const { batchReference } = req.params;

  // Build query
  const query = { batch_reference: batchReference };

  // If school user, restrict to own batches
  if (req.user.user_type === 'school') {
    query.school_id = req.user.id;
  }

  // Find batch with populated data
  const batch = await Batch.findOne(query)
    .populate('school_id', 'name school_code country')
    .populate('event_id', 'title event_slug category base_fee_inr base_fee_usd')
    .populate('registration_ids', 'registration_id student_name grade section dynamic_data');

  if (!batch) {
    return next(new AppError('Batch not found', 404));
  }

  // Fetch payment record for this batch
  const payment = await Payment.findOne({ batch_id: batch._id })
    .select('payment_reference status payment_mode payment_gateway amount currency paid_at offline_payment_details gateway_payment_id');

  res.status(200).json({
    status: 'success',
    data: {
      batch,
      payment
    }
  });
});

/**
 * @desc    Get all batches for a school
 * @route   GET /api/v1/batches/school/my-batches
 * @access  Private (School)
 */
exports.getMyBatches = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, status, event_slug } = req.query;

  // Build query
  const query = { school_id: req.user.id };

  if (status) {
    query.status = status;
  }

  if (event_slug) {
    const event = await Event.findOne({ event_slug });
    if (event) {
      query.event_id = event._id;
    }
  }

  // Execute query with pagination
  const batches = await Batch.find(query)
    .populate('event_id', 'title event_slug category')
    .sort({ created_at: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Batch.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      batches,
      pagination: {
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Delete batch (only drafts)
 * @route   DELETE /api/v1/batches/:batchReference
 * @access  Private (School - own batches)
 */
exports.deleteBatch = asyncHandler(async (req, res, next) => {
  const { batchReference } = req.params;

  // Find batch
  const batch = await Batch.findOne({
    batch_reference: batchReference,
    school_id: req.user.id
  });

  if (!batch) {
    return next(new AppError('Batch not found', 404));
  }

  // Only allow deletion of draft batches
  if (batch.status !== BATCH_STATUS.DRAFT) {
    return next(new AppError('Only draft batches can be deleted', 400));
  }

  // Check if payment exists for this batch
  const existingPayment = await Payment.findOne({ batch_id: batch._id });
  if (existingPayment) {
    return next(new AppError(
      'Cannot delete batch with associated payment records. Please contact support.',
      400
    ));
  }

  // Start transaction for atomic deletion
  const { session, useTransaction } = await startTransaction();

  try {
    // Delete all registrations in this batch
    if (useTransaction) {
      await Registration.deleteMany({ batch_id: batch._id }, { session });
      await batch.deleteOne({ session });
    } else {
      await Registration.deleteMany({ batch_id: batch._id });
      await batch.deleteOne();
    }

    // Commit transaction
    await commitTransaction(session, useTransaction);

    logger.info(`Batch deleted: ${batchReference} by school: ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      message: 'Batch deleted successfully'
    });

  } catch (error) {
    // Rollback transaction on error
    await abortTransaction(session, useTransaction);
    logger.error('Batch deletion failed:', error);
    const errorMessage = error.message || 'Failed to delete batch. Please try again.';
    throw new AppError(errorMessage, 500);
  }
});

/**
 * @desc    Get batch statistics for school
 * @route   GET /api/v1/batches/school/statistics
 * @access  Private (School)
 */
exports.getMyStatistics = asyncHandler(async (req, res, next) => {
  const schoolId = req.user.id;

  // Get all batches for school
  const batches = await Batch.find({ school_id: schoolId });

  // Calculate statistics
  const stats = {
    total_batches: batches.length,
    total_students: batches.reduce((sum, batch) => sum + batch.student_count, 0),
    by_status: {
      draft: batches.filter(b => b.status === BATCH_STATUS.DRAFT).length,
      submitted: batches.filter(b => b.status === BATCH_STATUS.SUBMITTED).length,
      confirmed: batches.filter(b => b.status === BATCH_STATUS.CONFIRMED).length,
      cancelled: batches.filter(b => b.status === BATCH_STATUS.CANCELLED).length
    },
    by_payment_status: {
      pending: batches.filter(b => b.payment_status === PAYMENT_STATUS.PENDING).length,
      processing: batches.filter(b => b.payment_status === PAYMENT_STATUS.PROCESSING).length,
      completed: batches.filter(b => b.payment_status === PAYMENT_STATUS.COMPLETED).length,
      failed: batches.filter(b => b.payment_status === PAYMENT_STATUS.FAILED).length
    },
    total_amount_paid: batches
      .filter(b => b.payment_status === PAYMENT_STATUS.COMPLETED)
      .reduce((sum, batch) => sum + batch.total_amount, 0),
    recent_batches: batches
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 5)
      .map(b => ({
        batch_reference: b.batch_reference,
        student_count: b.student_count,
        total_amount: b.total_amount,
        payment_status: b.payment_status,
        created_at: b.created_at
      }))
  };

  res.status(200).json({
    status: 'success',
    data: { statistics: stats }
  });
});

/**
 * @desc    Download batch data as CSV file
 * @route   GET /api/v1/batches/:batchReference/download
 * @access  Private (School)
 */
exports.downloadBatchCSV = asyncHandler(async (req, res, next) => {
  const { batchReference } = req.params;

  // Build query
  const query = { batch_reference: batchReference };

  // If school user, restrict to own batches
  if (req.user.user_type === 'school') {
    query.school_id = req.user.id;
  }

  // Find batch with populated data
  const batch = await Batch.findOne(query)
    .populate('school_id', 'name school_code')
    .populate('event_id', 'title event_slug form_schema')
    .populate('registration_ids');

  if (!batch) {
    return next(new AppError('Batch not found', 404));
  }

  // Generate CSV using csvExport service
  const buffer = csvExport.generateBatchCSV(
    batch,
    batch.registration_ids,
    batch.event_id.form_schema
  );
  const filename = csvExport.generateBatchFilename(batch.batch_reference);

  // Set headers for file download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);

  // Send buffer
  res.send(buffer);

  logger.info(`Batch CSV downloaded: ${batchReference} by ${req.user.user_type}: ${req.user.id}`);
});
