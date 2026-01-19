const asyncHandler = require('../../middleware/async.middleware');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');
const Event = require('../../models/Event');
const Batch = require('../../models/Batch');
const Registration = require('../../models/Registration');
const certificateService = require('../../services/certificate.service');
const { BATCH_STATUS } = require('../../utils/constants');

/**
 * @desc    Test certificate API configuration for an event (both India and International)
 * @route   POST /api/v1/admin/events/:eventId/certificates/test
 * @access  Private (Admin)
 */
exports.testCertificateConfig = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  const configIndia = event.certificate_config_india;
  const configInternational = event.certificate_config_international;

  // Validate at least one config is enabled
  if (!configIndia?.enabled && !configInternational?.enabled) {
    return next(new AppError('No certificate configuration enabled for any region', 400));
  }

  // Test both configurations
  const testResults = await certificateService.testConfiguration(configIndia, configInternational);

  logger.info(`Certificate config test for event ${event.event_slug}: India=${testResults.india ? 'TESTED' : 'DISABLED'}, International=${testResults.international ? 'TESTED' : 'DISABLED'}`);

  res.status(200).json({
    status: 'success',
    message: 'Certificate configuration test completed',
    data: {
      results: testResults
    }
  });
});

/**
 * @desc    Generate certificates for a specific batch
 * @route   POST /api/v1/admin/batches/:batchId/generate-certificates
 * @access  Private (Admin)
 */
exports.generateBatchCertificates = asyncHandler(async (req, res, next) => {
  const { batchId } = req.params;

  const batch = await Batch.findById(batchId)
    .populate('event_id')
    .populate('school_id');

  if (!batch) {
    return next(new AppError('Batch not found', 404));
  }

  const event = batch.event_id;

  // Check if at least one certificate config is enabled for the batch's region
  const isIndia = batch.currency === 'INR';
  const certificateConfig = isIndia
    ? event.certificate_config_india
    : event.certificate_config_international;

  if (!certificateConfig || !certificateConfig.enabled) {
    return next(new AppError(
      `Certificates are not enabled for ${isIndia ? 'India' : 'International'} region`,
      400
    ));
  }

  if (batch.status !== BATCH_STATUS.CONFIRMED) {
    return next(new AppError('Certificates can only be generated for confirmed batches', 400));
  }

  if (batch.certificates_generated) {
    return next(new AppError('Certificates have already been generated for this batch', 400));
  }

  // Get all registrations for this batch
  const registrations = await Registration.find({ batch_id: batch._id })
    .populate('school_id', 'school_code');

  if (!registrations || registrations.length === 0) {
    return next(new AppError('No registrations found for this batch', 404));
  }

  // Generate certificates
  logger.info(`Generating certificates for batch: ${batch.batch_reference} (${registrations.length} students)`);

  const certificateResults = await certificateService.issueBatchCertificates(
    event,
    registrations,
    batch
  );

  // Update batch with certificate results
  batch.certificates_generated = true;
  batch.certificate_generation_date = new Date();
  batch.certificate_results = certificateResults.results;
  await batch.save();

  logger.info(`Certificates generated for batch ${batch.batch_reference}: ${certificateResults.success} success, ${certificateResults.failed} failed`);

  res.status(200).json({
    status: 'success',
    message: `Generated ${certificateResults.success} certificates, ${certificateResults.failed} failed`,
    data: {
      batch_reference: batch.batch_reference,
      total: certificateResults.total,
      success: certificateResults.success,
      failed: certificateResults.failed,
      results: certificateResults.results
    }
  });
});

/**
 * @desc    Generate certificates for all confirmed batches of an event
 * @route   POST /api/v1/admin/events/:eventId/generate-certificates
 * @access  Private (Admin)
 */
exports.generateEventCertificates = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Check if at least one certificate config is enabled
  if (!event.certificate_config_india?.enabled && !event.certificate_config_international?.enabled) {
    return next(new AppError('Certificates are not enabled for any region', 400));
  }

  // Get all confirmed batches for this event that don't have certificates yet
  const batches = await Batch.find({
    event_id: event._id,
    status: BATCH_STATUS.CONFIRMED,
    certificates_generated: { $ne: true }
  }).populate('school_id');

  if (!batches || batches.length === 0) {
    return next(new AppError('No confirmed batches found for certificate generation', 404));
  }

  const allResults = {
    batches_processed: 0,
    total_students: 0,
    total_success: 0,
    total_failed: 0,
    batch_results: []
  };

  // Process each batch
  for (const batch of batches) {
    try {
      // Get registrations for this batch
      const registrations = await Registration.find({ batch_id: batch._id })
        .populate('school_id', 'school_code');

      if (!registrations || registrations.length === 0) {
        logger.warn(`No registrations found for batch: ${batch.batch_reference}`);
        continue;
      }

      // Generate certificates
      const certificateResults = await certificateService.issueBatchCertificates(
        event,
        registrations,
        batch
      );

      // Update batch
      batch.certificates_generated = true;
      batch.certificate_generation_date = new Date();
      batch.certificate_results = certificateResults.results;
      await batch.save();

      // Update overall results
      allResults.batches_processed++;
      allResults.total_students += certificateResults.total;
      allResults.total_success += certificateResults.success;
      allResults.total_failed += certificateResults.failed;
      allResults.batch_results.push({
        batch_reference: batch.batch_reference,
        total: certificateResults.total,
        success: certificateResults.success,
        failed: certificateResults.failed
      });

      logger.info(`Batch ${batch.batch_reference}: ${certificateResults.success} success, ${certificateResults.failed} failed`);
    } catch (error) {
      logger.error(`Failed to generate certificates for batch ${batch.batch_reference}:`, error);
      allResults.batch_results.push({
        batch_reference: batch.batch_reference,
        error: error.message
      });
    }
  }

  logger.info(`Event certificate generation completed: ${allResults.batches_processed} batches, ${allResults.total_success} success, ${allResults.total_failed} failed`);

  res.status(200).json({
    status: 'success',
    message: `Generated ${allResults.total_success} certificates across ${allResults.batches_processed} batches, ${allResults.total_failed} failed`,
    data: allResults
  });
});

/**
 * @desc    Get certificate results for a batch
 * @route   GET /api/v1/admin/batches/:batchId/certificates
 * @access  Private (Admin)
 */
exports.getBatchCertificates = asyncHandler(async (req, res, next) => {
  const { batchId } = req.params;

  const batch = await Batch.findById(batchId)
    .select('batch_reference certificates_generated certificate_generation_date certificate_results')
    .populate('event_id', 'title event_slug')
    .populate('school_id', 'name school_code');

  if (!batch) {
    return next(new AppError('Batch not found', 404));
  }

  if (!batch.certificates_generated) {
    return next(new AppError('Certificates have not been generated for this batch', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      batch_reference: batch.batch_reference,
      event: {
        title: batch.event_id.title,
        slug: batch.event_id.event_slug
      },
      school: {
        name: batch.school_id.name,
        code: batch.school_id.school_code
      },
      certificates_generated: batch.certificates_generated,
      generation_date: batch.certificate_generation_date,
      results: batch.certificate_results
    }
  });
});

module.exports = exports;
