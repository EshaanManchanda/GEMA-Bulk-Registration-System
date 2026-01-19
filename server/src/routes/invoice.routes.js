const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requireSchool, requireAdmin } = require('../middleware/role.middleware');
const invoiceController = require('../controllers/invoice/invoice.controller');

/**
 * Invoice Routes
 * Base path: /api/v1/invoices
 */

// Generate invoice for a payment (manual)
router.post(
  '/generate/:paymentId',
  verifyToken,
  invoiceController.generateInvoice
);

// Download invoice for a batch (redirects to Cloudinary)
router.get(
  '/download/:batchReference',
  verifyToken,
  invoiceController.downloadInvoice
);

// Get invoice URL for a batch
router.get(
  '/url/:batchReference',
  verifyToken,
  invoiceController.getInvoiceUrl
);

// Get all invoices for logged-in school
router.get(
  '/school/my-invoices',
  verifyToken,
  requireSchool,
  invoiceController.getMyInvoices
);

// Regenerate invoice (Admin only)
router.post(
  '/regenerate/:batchReference',
  verifyToken,
  invoiceController.regenerateInvoice
);

// Bulk generate invoices (Admin only)
router.post(
  '/bulk-generate',
  verifyToken,
  requireAdmin,
  invoiceController.bulkGenerateInvoices
);

module.exports = router;
