const mongoose = require('mongoose');

/**
 * WebhookLog Schema
 * Stores webhook processing logs for idempotency and audit trail
 */
const webhookLogSchema = new mongoose.Schema({
  gateway: {
    type: String,
    enum: ['razorpay', 'stripe'],
    required: true,
    index: true
  },
  event_type: {
    type: String,
    required: true,
    index: true
  },
  webhook_id: {
    type: String,
    required: true,
    unique: true,  // Ensures idempotency - prevents duplicate processing
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  processed: {
    type: Boolean,
    default: false,
    index: true
  },
  processed_at: {
    type: Date
  },
  error: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 2592000  // Auto-delete after 30 days (TTL index)
  }
});

// Index for efficient queries
webhookLogSchema.index({ gateway: 1, event_type: 1, created_at: -1 });
webhookLogSchema.index({ webhook_id: 1, processed: 1 });

const WebhookLog = mongoose.model('WebhookLog', webhookLogSchema);

module.exports = WebhookLog;
