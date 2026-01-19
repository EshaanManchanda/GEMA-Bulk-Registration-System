const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requireAdmin, requireSchool } = require('../middleware/role.middleware');
const formBuilderController = require('../controllers/formBuilder/formBuilder.controller');

/**
 * Form Builder Routes
 * Base path: /api/v1/form-builder
 */

// ===============================================
// PUBLIC ROUTES
// ===============================================

// Get event form schema by slug (public - for schools)
router.get(
  '/events/slug/:eventSlug/schema',
  formBuilderController.getEventFormSchemaBySlug
);

// ===============================================
// ADMIN ROUTES
// ===============================================

// Get default form template
router.get(
  '/templates/default',
  verifyToken,
  requireAdmin,
  formBuilderController.getDefaultFormTemplate
);

// Update event form schema
router.put(
  '/events/:eventId/schema',
  verifyToken,
  requireAdmin,
  formBuilderController.updateEventFormSchema
);

// ===============================================
// AUTHENTICATED ROUTES (Admin or School)
// ===============================================

// Get event form schema by ID
router.get(
  '/events/:eventId/schema',
  verifyToken,
  formBuilderController.getEventFormSchema
);

// Validate form data against schema
router.post(
  '/validate',
  verifyToken,
  requireSchool,
  formBuilderController.validateFormData
);

module.exports = router;
