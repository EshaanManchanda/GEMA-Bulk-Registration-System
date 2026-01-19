const asyncHandler = require('../../middleware/async.middleware');
const { AppError } = require('../../middleware/errorHandler.middleware');
const Registration = require('../../models/Registration');
const Event = require('../../models/Event');
const resultParserService = require('../../services/resultParser.service');
const logger = require('../../utils/logger');

/**
 * @desc    Upload results via CSV
 * @route   POST /api/v1/admin/events/:eventId/results/upload
 * @access  Private (Admin)
 */
exports.uploadResults = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  // Check event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Check file uploaded
  if (!req.file) {
    return next(new AppError('Please upload a CSV file', 400));
  }

  // Parse CSV
  const parsedData = await resultParserService.parseResultsCSV(req.file.buffer);

  if (parsedData.length === 0) {
    return next(new AppError('CSV file is empty or invalid', 400));
  }

  // Validate data
  const { valid, errors } = await resultParserService.validateResultsData(parsedData, eventId);

  if (valid.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'No valid results found in CSV',
      errors
    });
  }

  // Update results in database
  const updateSummary = await resultParserService.bulkUpdateResults(eventId, valid);

  logger.info(`Results uploaded for event ${eventId}: ${updateSummary.updated} updated by admin ${req.user._id}`);

  res.status(200).json({
    status: 'success',
    message: `Results uploaded successfully`,
    data: {
      summary: updateSummary,
      errors: errors.length > 0 ? errors : undefined
    }
  });
});

/**
 * @desc    Update single registration result
 * @route   PUT /api/v1/admin/registrations/:registrationId/result
 * @access  Private (Admin)
 */
exports.updateSingleResult = asyncHandler(async (req, res, next) => {
  const { registrationId } = req.params;
  const { score, rank, award, remarks } = req.body;

  const registration = await Registration.findById(registrationId);

  if (!registration) {
    return next(new AppError('Registration not found', 404));
  }

  // Update result using model method
  await registration.setResult({ score, rank, award, remarks });

  logger.info(`Result updated for registration ${registrationId} by admin ${req.user._id}`);

  res.status(200).json({
    status: 'success',
    message: 'Result updated successfully',
    data: { registration }
  });
});

/**
 * @desc    Get all results for an event
 * @route   GET /api/v1/admin/events/:eventId/results
 * @access  Private (Admin)
 */
exports.getEventResults = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const {
    page = 1,
    limit = 50,
    sort = '-result.rank',
    hasResult,
    award,
    search
  } = req.query;

  // Check event exists
  const event = await Event.findById(eventId).select('title event_slug');
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Build query
  const query = {
    event_id: eventId,
    status: { $in: ['confirmed', 'attended'] }
  };

  // Filter by hasResult
  if (hasResult === 'true') {
    query['result.score'] = { $exists: true, $ne: null };
  } else if (hasResult === 'false') {
    query.$or = [
      { 'result.score': { $exists: false } },
      { 'result.score': null }
    ];
  }

  // Filter by award
  if (award) {
    query['result.award'] = award;
  }

  // Search by student name or registration ID
  if (search) {
    query.$or = [
      { student_name: { $regex: search, $options: 'i' } },
      { registration_id: { $regex: search, $options: 'i' } }
    ];
  }

  // Execute query
  const skip = (page - 1) * limit;
  const registrations = await Registration.find(query)
    .populate('school_id', 'name school_code')
    .populate('batch_id', 'batch_reference')
    .select('registration_id student_name grade section result school_id batch_id')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Registration.countDocuments(query);

  // Get summary stats
  const stats = await Registration.aggregate([
    { $match: { event_id: event._id, status: { $in: ['confirmed', 'attended'] } } },
    {
      $group: {
        _id: null,
        totalRegistrations: { $sum: 1 },
        withResults: {
          $sum: { $cond: [{ $ne: ['$result.score', null] }, 1, 0] }
        },
        avgScore: { $avg: '$result.score' },
        goldCount: {
          $sum: { $cond: [{ $eq: ['$result.award', 'Gold'] }, 1, 0] }
        },
        silverCount: {
          $sum: { $cond: [{ $eq: ['$result.award', 'Silver'] }, 1, 0] }
        },
        bronzeCount: {
          $sum: { $cond: [{ $eq: ['$result.award', 'Bronze'] }, 1, 0] }
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      event: { id: event._id, title: event.title, slug: event.event_slug },
      registrations,
      stats: stats[0] || {},
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Get results for a batch
 * @route   GET /api/v1/admin/batches/:batchReference/results
 * @access  Private (Admin)
 */
exports.getBatchResults = asyncHandler(async (req, res, next) => {
  const { batchReference } = req.params;
  const Batch = require('../../models/Batch');

  const batch = await Batch.findOne({ batch_reference: batchReference })
    .populate('event_id', 'title')
    .populate('school_id', 'name school_code');

  if (!batch) {
    return next(new AppError('Batch not found', 404));
  }

  const registrations = await Registration.find({ batch_id: batch._id })
    .select('registration_id student_name grade section result')
    .sort('result.rank student_name');

  res.status(200).json({
    status: 'success',
    data: {
      batch: {
        reference: batch.batch_reference,
        event: batch.event_id,
        school: batch.school_id
      },
      registrations,
      total: registrations.length
    }
  });
});

/**
 * @desc    Download results template CSV
 * @route   GET /api/v1/admin/events/:eventId/results/template
 * @access  Private (Admin)
 */
exports.downloadResultsTemplate = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  // Check event exists
  const event = await Event.findById(eventId).select('title event_slug');
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  const csvContent = await resultParserService.generateResultsTemplate(eventId);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="results-template-${event.event_slug}.csv"`);
  res.send(csvContent);
});

/**
 * @desc    Clear all results for an event
 * @route   DELETE /api/v1/admin/events/:eventId/results
 * @access  Private (Admin)
 */
exports.clearEventResults = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  // Check event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  const updateResult = await Registration.updateMany(
    { event_id: eventId },
    { $unset: { result: '' } }
  );

  logger.warn(`All results cleared for event ${eventId} by admin ${req.user._id}`);

  res.status(200).json({
    status: 'success',
    message: `Cleared results for ${updateResult.modifiedCount} registrations`,
    data: { cleared: updateResult.modifiedCount }
  });
});
