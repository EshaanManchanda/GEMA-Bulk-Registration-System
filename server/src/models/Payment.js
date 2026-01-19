const mongoose = require('mongoose');
const { PAYMENT_STATUS, PAYMENT_GATEWAYS, CURRENCIES } = require('../utils/constants');

/**
 * Refund Data Schema
 */
const refundDataSchema = new mongoose.Schema({
  refund_id: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    min: [0, 'Refund amount cannot be negative']
  },
  reason: {
    type: String,
    trim: true
  },
  refunded_at: {
    type: Date,
    default: Date.now
  },
  processed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { _id: false });

/**
 * Payment Schema
 * Tracks all payment transactions
 */
const paymentSchema = new mongoose.Schema({
  payment_reference: {
    type: String,
    required: false, // Auto-generated in pre-save hook
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch ID is required'],
    index: true
  },
  school_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required'],
    index: true
  },
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    enum: {
      values: Object.values(CURRENCIES),
      message: '{VALUE} is not a valid currency'
    },
    required: [true, 'Currency is required']
  },
  payment_gateway: {
    type: String,
    enum: {
      values: Object.values(PAYMENT_GATEWAYS),
      message: '{VALUE} is not a valid payment gateway'
    },
    required: false // Not required for offline payments
  },
  gateway_payment_id: {
    type: String,
    trim: true
  },
  gateway_order_id: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: Object.values(PAYMENT_STATUS),
      message: '{VALUE} is not a valid payment status'
    },
    default: PAYMENT_STATUS.PENDING,
    index: true
  },
  payment_mode: {
    type: String,
    enum: {
      values: ['ONLINE', 'OFFLINE'],
      message: '{VALUE} is not a valid payment mode'
    },
    required: [true, 'Payment mode is required'],
    index: true
  },
  payment_method: {
    type: String, // card, upi, netbanking, wallet, etc.
    trim: true
  },
  offline_payment_details: {
    transaction_reference: {
      type: String,
      trim: true
    },
    transaction_date: {
      type: Date
    },
    receipt_url: {
      type: String,
      trim: true
    },
    bank_name: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    verified_at: {
      type: Date
    }
  },
  paid_at: {
    type: Date,
    index: true
  },
  gateway_response: {
    type: mongoose.Schema.Types.Mixed
  },
  error_code: {
    type: String,
    trim: true
  },
  error_description: {
    type: String,
    trim: true,
    maxlength: [500, 'Error description cannot exceed 500 characters']
  },
  webhook_data: {
    type: mongoose.Schema.Types.Mixed
  },
  refund_data: {
    type: refundDataSchema,
    default: undefined
  },
  metadata: {
    type: Map,
    of: String,
    default: new Map()
  },
  ip_address: {
    type: String,
    trim: true
  },
  user_agent: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===============================================
// INDEXES
// ===============================================

paymentSchema.index({ gateway_payment_id: 1 });
paymentSchema.index({ gateway_order_id: 1 });
paymentSchema.index({ status: 1, created_at: -1 });
paymentSchema.index({ payment_gateway: 1, status: 1 });
paymentSchema.index({ created_at: -1 });
paymentSchema.index({ event_id: 1, status: 1 });
paymentSchema.index({ payment_mode: 1, status: 1 });
paymentSchema.index({ paid_at: -1 });

// ===============================================
// VIRTUAL FIELDS
// ===============================================

/**
 * Check if payment is successful
 */
paymentSchema.virtual('is_successful').get(function() {
  return this.status === PAYMENT_STATUS.COMPLETED;
});

/**
 * Check if payment failed
 */
paymentSchema.virtual('is_failed').get(function() {
  return this.status === PAYMENT_STATUS.FAILED;
});

/**
 * Check if payment is refunded
 */
paymentSchema.virtual('is_refunded').get(function() {
  return this.status === PAYMENT_STATUS.REFUNDED;
});

/**
 * Alias for status field (backward compatibility)
 */
paymentSchema.virtual('payment_status').get(function() {
  return this.status;
});

// ===============================================
// MIDDLEWARE
// ===============================================

// Pre-save: Generate payment reference if not exists
paymentSchema.pre('save', function(next) {
  if (!this.payment_reference) {
    const { generatePaymentReference } = require('../utils/helpers');
    this.payment_reference = generatePaymentReference();
  }
  next();
});

// ===============================================
// INSTANCE METHODS
// ===============================================

/**
 * Mark payment as successful
 * @param {Object} data - Payment data from gateway
 */
paymentSchema.methods.markAsSuccessful = async function(data) {
  this.status = PAYMENT_STATUS.COMPLETED;
  this.gateway_payment_id = data.payment_id || this.gateway_payment_id;
  this.payment_method = data.payment_method;
  this.webhook_data = data.webhook_data;
  await this.save();
};

/**
 * Mark payment as failed
 * @param {Object} error - Error details
 */
paymentSchema.methods.markAsFailed = async function(error) {
  this.status = PAYMENT_STATUS.FAILED;
  this.error_code = error.code;
  this.error_description = error.description;
  await this.save();
};

/**
 * Process refund
 * @param {Object} refundData - Refund details
 */
paymentSchema.methods.processRefund = async function(refundData) {
  this.status = PAYMENT_STATUS.REFUNDED;
  this.refund_data = {
    refund_id: refundData.refund_id,
    amount: refundData.amount || this.amount,
    reason: refundData.reason,
    refunded_at: new Date(),
    processed_by: refundData.processed_by
  };
  await this.save();
};

/**
 * Add metadata
 * @param {string} key - Metadata key
 * @param {string} value - Metadata value
 */
paymentSchema.methods.addMetadata = function(key, value) {
  if (!this.metadata) {
    this.metadata = new Map();
  }
  this.metadata.set(key, value);
};

/**
 * Get payment summary
 * @returns {Object} - Payment summary
 */
paymentSchema.methods.getSummary = function() {
  return {
    payment_reference: this.payment_reference,
    amount: this.amount,
    currency: this.currency,
    payment_gateway: this.payment_gateway,
    status: this.status,
    payment_method: this.payment_method,
    created_at: this.created_at
  };
};

// ===============================================
// STATIC METHODS
// ===============================================

/**
 * Find payment by gateway ID
 * @param {string} gatewayPaymentId - Gateway payment ID
 * @returns {Promise<Payment>} - Payment document
 */
paymentSchema.statics.findByGatewayId = function(gatewayPaymentId) {
  return this.findOne({
    $or: [
      { gateway_payment_id: gatewayPaymentId },
      { gateway_order_id: gatewayPaymentId }
    ]
  });
};

/**
 * Find payments by batch
 * @param {string} batchId - Batch ID
 * @returns {Promise<Payment[]>} - Array of payments
 */
paymentSchema.statics.findByBatch = function(batchId) {
  return this.find({ batch_id: batchId }).sort({ created_at: -1 });
};

/**
 * Find payments by school
 * @param {string} schoolId - School ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Payment[]>} - Array of payments
 */
paymentSchema.statics.findBySchool = function(schoolId, filters = {}) {
  const query = { school_id: schoolId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.gateway) {
    query.payment_gateway = filters.gateway;
  }

  return this.find(query).sort({ created_at: -1 });
};

/**
 * Get payment statistics
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} - Payment statistics
 */
paymentSchema.statics.getStatistics = async function(filters = {}) {
  const matchStage = {};

  if (filters.startDate && filters.endDate) {
    matchStage.created_at = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  if (filters.status) {
    matchStage.status = filters.status;
  }

  if (filters.gateway) {
    matchStage.payment_gateway = filters.gateway;
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          status: '$status',
          currency: '$currency'
        },
        total_amount: { $sum: '$amount' },
        count: { $sum: 1 },
        avg_amount: { $avg: '$amount' }
      }
    }
  ]);

  return stats;
};

/**
 * Get failed payments report
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Payment[]>} - Array of failed payments
 */
paymentSchema.statics.getFailedPayments = function(startDate, endDate) {
  const query = {
    status: PAYMENT_STATUS.FAILED
  };

  if (startDate && endDate) {
    query.created_at = {
      $gte: startDate,
      $lte: endDate
    };
  }

  return this.find(query)
    .populate('school_id', 'name school_code contact_person')
    .populate('batch_id', 'batch_reference total_students')
    .sort({ created_at: -1 });
};

// ===============================================
// MODEL
// ===============================================

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
