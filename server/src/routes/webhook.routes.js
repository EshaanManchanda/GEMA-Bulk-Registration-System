const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/payment/webhook.controller');

/**
 * Webhook Routes
 * Base path: /api/v1/webhooks
 *
 * Note: These routes should be mounted BEFORE JSON body parser middleware
 * to preserve raw body for signature verification
 */

// Stripe webhook
router.post('/stripe', webhookController.handleStripeWebhook);

module.exports = router;
