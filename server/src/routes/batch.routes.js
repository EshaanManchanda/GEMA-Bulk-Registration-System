const express = require('express');
const router = express.Router();
const { verifyToken, checkUserStatus } = require('../middleware/auth.middleware');
const { requireSchool, requireVerifiedSchool } = require('../middleware/role.middleware');
const { uploadSpreadsheet } = require('../middleware/upload.middleware');
const { validate, validationSchemas } = require('../middleware/validate.middleware');
const bulkRegistrationController = require('../controllers/batch/bulkRegistration.controller');

/**
 * School Batch Registration Routes
 * Base path: /api/v1/batches
 */

// Download CSV template for event
router.get(
  '/template/:eventSlug',
  verifyToken,
  requireSchool,
  bulkRegistrationController.downloadTemplate
);

// Validate CSV file without creating batch
router.post(
  '/validate',
  verifyToken,
  checkUserStatus,
  requireSchool,
  uploadSpreadsheet,
  validate(validationSchemas.validateExcel),
  bulkRegistrationController.validateCSV
);

// Upload CSV and create batch registration
router.post(
  '/upload',
  verifyToken,
  checkUserStatus,
  requireSchool,
  requireVerifiedSchool,
  uploadSpreadsheet,
  validate(validationSchemas.uploadBatch),
  bulkRegistrationController.uploadBatch
);

// Get school's own batches
router.get(
  '/school/my-batches',
  verifyToken,
  requireSchool,
  bulkRegistrationController.getMyBatches
);

// Get school's batch statistics
router.get(
  '/school/statistics',
  verifyToken,
  requireSchool,
  bulkRegistrationController.getMyStatistics
);

// Get batch details
router.get(
  '/:batchReference',
  verifyToken,
  bulkRegistrationController.getBatch
);

// Delete batch (only drafts)
router.delete(
  '/:batchReference',
  verifyToken,
  requireSchool,
  bulkRegistrationController.deleteBatch
);

// Download batch CSV
router.get(
  '/:batchReference/download',
  verifyToken,
  requireSchool,
  bulkRegistrationController.downloadBatchCSV
);

module.exports = router;
