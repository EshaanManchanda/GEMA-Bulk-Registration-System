const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requireSchool, requireAdmin } = require('../middleware/role.middleware');
const { uploadReceipt } = require('../middleware/upload.middleware');
const { validate, validationSchemas } = require('../middleware/validate.middleware');
const paymentController = require('../controllers/payment/payment.controller');

/**
 * Payment Routes
 * Base path: /api/v1/payments
 */

// Initiate online payment
router.post(
  '/initiate',
  verifyToken,
  requireSchool,
  paymentController.initiatePayment
);

// Verify Stripe payment
router.post(
  '/verify/stripe',
  verifyToken,
  requireSchool,
  paymentController.verifyStripePayment
);

// Initiate offline payment with receipt upload
router.post(
  '/offline',
  verifyToken,
  requireSchool,
  uploadReceipt,
  paymentController.initiateOfflinePayment
);

// Get school's own payments
router.get(
  '/school/my-payments',
  verifyToken,
  requireSchool,
  paymentController.getMyPayments
);

// Get payment details
router.get(
  '/:paymentId',
  verifyToken,
  paymentController.getPayment
);

// Download payment receipt
router.get(
  '/:paymentId/receipt',
  verifyToken,
  paymentController.downloadReceipt
);

// Admin verify offline payment
router.put(
  '/:paymentId/verify',
  verifyToken,
  requireAdmin,
  paymentController.verifyOfflinePayment
);

// Admin reject offline payment
router.put(
  '/:paymentId/reject',
  verifyToken,
  requireAdmin,
  paymentController.rejectOfflinePayment
);

module.exports = router;
