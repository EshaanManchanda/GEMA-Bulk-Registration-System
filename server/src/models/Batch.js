const mongoose = require('mongoose');
const { PAYMENT_STATUS, PAYMENT_MODES, PAYMENT_GATEWAYS, CURRENCIES, BATCH_STATUS } = require('../utils/constants');

/**
 * Offline Payment Details Schema
 */
const offlinePaymentDetailsSchema = new mongoose.Schema({
  transaction_reference: {
    type: String,
    trim: true
  },
  bank_name: {
    type: String,
    trim: true
  },
  receipt_url: {
    type: String, // Cloudinary URL
    trim: true
  },
  upload_date: {
    type: Date,
    default: Date.now
  },
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  verification_date: {
    type: Date
  },
  verification_notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Verification notes cannot exceed 1000 characters']
  }
}, { _id: false });

/**
 * Validation Error Schema
 */
const validationErrorSchema = new mongoose.Schema({
  row: {
    type: Number,
    required: true
  },
  field: {
    type: String,
    required: true
  },
  error: {
    type: String,
    required: true
  }
}, { _id: false });

/**
 * Batch Schema
 * Represents a bulk registration submission
 */
const batchSchema = new mongoose.Schema({
  batch_reference: {
    type: String,
    required: [true, 'Batch reference is required'],
    unique: true,
    uppercase: true,
    trim: true,
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
  registration_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration'
  }],
  total_students: {
    type: Number,
    required: [true, 'Total students count is required'],
    min: [1, 'Must have at least 1 student']
  },
  student_count: {
    type: Number,
    min: [1, 'Must have at least 1 student']
  },
  base_amount: {
    type: Number,
    required: [true, 'Base amount is required'],
    min: [0, 'Base amount cannot be negative']
  },
  base_fee_per_student: {
    type: Number,
    min: [0, 'Base fee cannot be negative']
  },
  subtotal_amount: {
    type: Number,
    min: [0, 'Subtotal cannot be negative']
  },
  discount_percentage: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  discount_amount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  total_amount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  currency: {
    type: String,
    enum: {
      values: Object.values(CURRENCIES),
      message: '{VALUE} is not a valid currency'
    },
    required: [true, 'Currency is required']
  },
  status: {
    type: String,
    enum: {
      values: Object.values(BATCH_STATUS),
      message: '{VALUE} is not a valid batch status'
    },
    default: BATCH_STATUS.DRAFT,
    index: true
  },
  payment_status: {
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
      values: Object.values(PAYMENT_MODES),
      message: '{VALUE} is not a valid payment mode'
    }
  },
  payment_gateway: {
    type: String,
    enum: {
      values: Object.values(PAYMENT_GATEWAYS),
      message: '{VALUE} is not a valid payment gateway'
    }
  },
  payment_id: {
    type: String, // Gateway payment ID
    trim: true,
    index: true
  },
  payment_date: {
    type: Date
  },
  offline_payment_details: {
    type: offlinePaymentDetailsSchema,
    default: undefined
  },
  invoice_pdf_url: {
    type: String, // Cloudinary URL
    trim: true
  },
  invoice_number: {
    type: String,
    trim: true
  },
  invoice_generated_at: {
    type: Date
  },
  excel_file_url: {
    type: String, // Original uploaded Excel (Cloudinary)
    trim: true
  },
  validation_errors: {
    type: [validationErrorSchema],
    default: []
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  is_cancelled: {
    type: Boolean,
    default: false
  },
  cancelled_at: {
    type: Date
  },
  cancellation_reason: {
    type: String,
    trim: true
  },
  certificates_generated: {
    type: Boolean,
    default: false,
    index: true
  },
  certificate_generation_date: {
    type: Date
  },
  certificate_results: {
    type: mongoose.Schema.Types.Mixed
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

batchSchema.index({ school_id: 1, event_id: 1 });
batchSchema.index({ payment_status: 1, created_at: -1 });
batchSchema.index({ invoice_number: 1 });
batchSchema.index({ created_at: -1 });
batchSchema.index({ payment_mode: 1, payment_status: 1 });

// ===============================================
// VIRTUAL FIELDS
// ===============================================

/**
 * Virtual for registrations (populated when needed)
 */
batchSchema.virtual('registrations', {
  ref: 'Registration',
  localField: '_id',
  foreignField: 'batch_id'
});

/**
 * Check if payment is pending
 */
batchSchema.virtual('is_payment_pending').get(function() {
  return this.payment_status === PAYMENT_STATUS.PENDING ||
         this.payment_status === PAYMENT_STATUS.PENDING_VERIFICATION;
});

/**
 * Check if payment is completed
 */
batchSchema.virtual('is_payment_completed').get(function() {
  return this.payment_status === PAYMENT_STATUS.COMPLETED;
});

/**
 * Check if batch needs verification (offline payment)
 */
batchSchema.virtual('needs_verification').get(function() {
  return this.payment_mode === PAYMENT_MODES.OFFLINE &&
         this.payment_status === PAYMENT_STATUS.PENDING_VERIFICATION;
});

// ===============================================
// MIDDLEWARE
// ===============================================

// Pre-save: Generate batch reference if not exists
batchSchema.pre('save', function(next) {
  if (!this.batch_reference) {
    const { generateBatchReference } = require('../utils/helpers');
    this.batch_reference = generateBatchReference();
  }
  next();
});

// Pre-save: Calculate total amount
batchSchema.pre('save', function(next) {
  if (this.isModified('base_amount') || this.isModified('discount_amount')) {
    this.total_amount = this.base_amount - this.discount_amount;
  }
  next();
});

// ===============================================
// INSTANCE METHODS
// ===============================================

/**
 * Mark payment as completed
 * @param {string} paymentId - Gateway payment ID
 */
batchSchema.methods.markPaymentCompleted = async function(paymentId) {
  this.payment_status = PAYMENT_STATUS.COMPLETED;
  this.payment_id = paymentId;
  this.payment_date = new Date();
  await this.save();
};

/**
 * Mark payment as failed
 */
batchSchema.methods.markPaymentFailed = async function() {
  this.payment_status = PAYMENT_STATUS.FAILED;
  await this.save();
};

/**
 * Set invoice details
 * @param {string} invoiceNumber - Invoice number
 * @param {string} invoiceUrl - PDF URL
 */
batchSchema.methods.setInvoiceDetails = async function(invoiceNumber, invoiceUrl) {
  this.invoice_number = invoiceNumber;
  this.invoice_pdf_url = invoiceUrl;
  this.invoice_generated_at = new Date();
  await this.save();
};

/**
 * Verify offline payment
 * @param {string} adminId - Admin who verified
 * @param {string} notes - Verification notes
 */
batchSchema.methods.verifyOfflinePayment = async function(adminId, notes) {
  if (this.payment_mode !== PAYMENT_MODES.OFFLINE) {
    throw new Error('Batch is not an offline payment');
  }

  if (!this.offline_payment_details) {
    this.offline_payment_details = {};
  }

  this.offline_payment_details.verified_by = adminId;
  this.offline_payment_details.verification_date = new Date();
  this.offline_payment_details.verification_notes = notes;
  this.payment_status = PAYMENT_STATUS.COMPLETED;
  this.payment_date = new Date();

  await this.save();
};

/**
 * Reject offline payment
 * @param {string} adminId - Admin who rejected
 * @param {string} reason - Rejection reason
 */
batchSchema.methods.rejectOfflinePayment = async function(adminId, reason) {
  if (this.payment_mode !== PAYMENT_MODES.OFFLINE) {
    throw new Error('Batch is not an offline payment');
  }

  if (!this.offline_payment_details) {
    this.offline_payment_details = {};
  }

  this.offline_payment_details.verified_by = adminId;
  this.offline_payment_details.verification_date = new Date();
  this.offline_payment_details.verification_notes = reason;
  this.payment_status = PAYMENT_STATUS.FAILED;

  await this.save();
};

/**
 * Cancel batch
 * @param {string} reason - Cancellation reason
 */
batchSchema.methods.cancel = async function(reason) {
  this.is_cancelled = true;
  this.cancelled_at = new Date();
  this.cancellation_reason = reason;
  await this.save();
};

/**
 * Get summary
 * @returns {Object} - Batch summary
 */
batchSchema.methods.getSummary = function() {
  return {
    batch_reference: this.batch_reference,
    total_students: this.total_students,
    base_amount: this.base_amount,
    discount_percentage: this.discount_percentage,
    discount_amount: this.discount_amount,
    total_amount: this.total_amount,
    currency: this.currency,
    payment_status: this.payment_status,
    payment_mode: this.payment_mode,
    created_at: this.created_at
  };
};

// ===============================================
// STATIC METHODS
// ===============================================

/**
 * Find batches by school
 * @param {string} schoolId - School ID
 * @returns {Promise<Batch[]>} - Array of batches
 */
batchSchema.statics.findBySchool = function(schoolId) {
  return this.find({ school_id: schoolId })
    .populate('event_id', 'title event_slug')
    .sort({ created_at: -1 });
};

/**
 * Find batches by event
 * @param {string} eventId - Event ID
 * @returns {Promise<Batch[]>} - Array of batches
 */
batchSchema.statics.findByEvent = function(eventId) {
  return this.find({ event_id: eventId })
    .populate('school_id', 'name school_code')
    .sort({ created_at: -1 });
};

/**
 * Find pending verifications (offline payments)
 * @returns {Promise<Batch[]>} - Array of batches
 */
batchSchema.statics.findPendingVerifications = function() {
  return this.find({
    payment_mode: PAYMENT_MODES.OFFLINE,
    payment_status: PAYMENT_STATUS.PENDING_VERIFICATION,
    is_cancelled: false
  })
    .populate('school_id', 'name school_code contact_person')
    .populate('event_id', 'title')
    .sort({ created_at: 1 });
};

/**
 * Find completed batches without invoices
 * @returns {Promise<Batch[]>} - Array of batches
 */
batchSchema.statics.findWithoutInvoices = function() {
  return this.find({
    payment_status: PAYMENT_STATUS.COMPLETED,
    invoice_number: null,
    is_cancelled: false
  }).sort({ payment_date: 1 });
};

/**
 * Get revenue statistics
 * @param {Object} filters - Optional filters (date range, currency, etc.)
 * @returns {Promise<Object>} - Revenue stats
 */
batchSchema.statics.getRevenueStats = async function(filters = {}) {
  const matchStage = {
    payment_status: PAYMENT_STATUS.COMPLETED,
    is_cancelled: false
  };

  if (filters.startDate && filters.endDate) {
    matchStage.payment_date = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  if (filters.currency) {
    matchStage.currency = filters.currency;
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$currency',
        total_revenue: { $sum: '$total_amount' },
        total_batches: { $sum: 1 },
        total_students: { $sum: '$total_students' },
        avg_batch_amount: { $avg: '$total_amount' }
      }
    }
  ]);

  return stats;
};

// ===============================================
// MIDDLEWARE
// ===============================================

/**
 * Pre-delete hook: Check for payment records
 * Prevents deletion of batches with associated payments
 */
batchSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const Payment = mongoose.model('Payment');
  const paymentCount = await Payment.countDocuments({ batch_id: this._id });

  if (paymentCount > 0) {
    throw new Error('Cannot delete batch with existing payment records');
  }
  next();
});

// ===============================================
// MODEL
// ===============================================

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch;
