const mongoose = require('mongoose');
const { EVENT_STATUS, FIELD_TYPES, EVENT_TYPES, GRADE_LEVELS } = require('../utils/constants');

/**
 * Form Field Schema
 * Defines the structure of dynamic form fields
 */
const fieldSchema = new mongoose.Schema({
  field_id: {
    type: String,
    required: [true, 'Field ID is required'],
    trim: true
  },
  field_label: {
    type: String,
    required: [true, 'Field label is required'],
    trim: true,
    maxlength: [100, 'Field label cannot exceed 100 characters']
  },
  field_type: {
    type: String,
    required: [true, 'Field type is required'],
    enum: {
      values: Object.values(FIELD_TYPES),
      message: '{VALUE} is not a valid field type'
    }
  },
  field_options: {
    type: [String],
    default: undefined,
    validate: {
      validator: function (v) {
        // Options required for select fields
        if (this.field_type === FIELD_TYPES.SELECT) {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Field options are required for select fields'
    }
  },
  is_required: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    trim: true,
    maxlength: [200, 'Placeholder cannot exceed 200 characters']
  },
  help_text: {
    type: String,
    trim: true,
    maxlength: [500, 'Help text cannot exceed 500 characters']
  },
  validation_rules: {
    min: {
      type: Number
    },
    max: {
      type: Number
    },
    pattern: {
      type: String
    },
    minLength: {
      type: Number
    },
    maxLength: {
      type: Number
    }
  },
  order: {
    type: Number,
    required: [true, 'Field order is required'],
    min: [0, 'Field order cannot be negative']
  }
}, { _id: false });

/**
 * Discount Rule Schema
 * Defines bulk discount rules for events
 */
const discountRuleSchema = new mongoose.Schema({
  min_students: {
    type: Number,
    required: [true, 'Minimum students count is required'],
    min: [1, 'Minimum students must be at least 1']
  },
  discount_percentage: {
    type: Number,
    required: [true, 'Discount percentage is required'],
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  }
}, { _id: false });

/**
 * Event Schema
 * Stores information about events/olympiads with dynamic form schemas
 */
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true
  },
  event_slug: {
    type: String,
    required: [true, 'Event slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    ]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  short_description: {
    type: String,
    trim: true,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: {
      values: Object.values(EVENT_STATUS),
      message: '{VALUE} is not a valid status'
    },
    default: EVENT_STATUS.DRAFT,
    index: true
  },
  base_fee_inr: {
    type: Number,
    required: [true, 'Base fee in INR is required'],
    min: [0, 'Fee cannot be negative']
  },
  base_fee_usd: {
    type: Number,
    required: [true, 'Base fee in USD is required'],
    min: [0, 'Fee cannot be negative']
  },
  form_schema: {
    type: [fieldSchema],
    required: [true, 'Form schema is required'],
    validate: {
      validator: function (v) {
        return v && v.length > 0;
      },
      message: 'Form schema must have at least one field'
    }
  },
  bulk_discount_rules: {
    type: [discountRuleSchema],
    default: []
  },
  event_start_date: {
    type: Date,
    required: [true, 'Event start date is required']
  },
  event_end_date: {
    type: Date,
    required: [true, 'Event end date is required'],
    validate: {
      validator: function (v) {
        return v >= this.event_start_date;
      },
      message: 'Event end date must be after or on start date'
    }
  },
  registration_start_date: {
    type: Date
  },
  registration_deadline: {
    type: Date,
    required: [true, 'Registration deadline is required'],
    validate: {
      validator: function (v) {
        return v <= this.event_start_date;
      },
      message: 'Registration deadline must be before or on event start date'
    }
  },
  result_announced_date: {
    type: Date,
    validate: {
      validator: function (v) {
        if (!v) return true; // Optional field
        return v >= this.event_end_date;
      },
      message: 'Result announcement date must be on or after event end date'
    }
  },
  max_participants: {
    type: Number,
    min: [1, 'Maximum participants must be at least 1']
  },
  category: {
    type: String,
    trim: true,
    enum: {
      values: ['olympiad', 'championship', 'competition', 'workshop', 'other'],
      message: '{VALUE} is not a valid category'
    },
    default: 'olympiad'
  },
  event_type: {
    type: String,
    enum: {
      values: Object.values(EVENT_TYPES),
      message: '{VALUE} is not a valid event type'
    },
    default: 'olympiad',
    index: true
  },
  schedule_type: {
    type: String,
    enum: ['single_date', 'date_range', 'multiple_dates'],
    default: 'date_range'
  },
  schedule: {
    registration_start: { type: Date },
    registration_deadline: { type: Date },
    event_date: { type: Date },
    event_dates: [{
      label: { type: String, trim: true },
      date: { type: Date }
    }],
    date_range: {
      start: { type: Date },
      end: { type: Date }
    },
    result_date: { type: Date }
  },
  metrics: {
    wishlist_count: { type: Number, default: 0 },
    share_count: { type: Number, default: 0 },
    conversion_rate: { type: Number, default: 0 }
  },
  grade_levels: {
    type: [String],
    default: []
  },
  banner_image_url: {
    type: String,
    trim: true
  },
  rules_document_url: {
    type: String,
    trim: true
  },
  posters: {
    type: [String],
    default: []
  },
  brochures: {
    type: [String],
    default: []
  },
  notice_url: {
    type: String,
    trim: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Creator is required'],
    index: true
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  view_count: {
    type: Number,
    default: 0
  },
  registration_count: {
    type: Number,
    default: 0
  },
  certificate_config_india: {
    enabled: {
      type: Boolean,
      default: false
    },
    website_url: {
      type: String,
      trim: true
    },
    certificate_issuance_url: {
      type: String,
      trim: true
    },
    health_check_url: {
      type: String,
      trim: true
    },
    key_validation_url: {
      type: String,
      trim: true
    },
    api_key: {
      type: String,
      trim: true
    },
    template_id: {
      type: String,
      trim: true
    },
    auto_generate: {
      type: Boolean,
      default: false
    }
  },
  certificate_config_international: {
    enabled: {
      type: Boolean,
      default: false
    },
    website_url: {
      type: String,
      trim: true
    },
    certificate_issuance_url: {
      type: String,
      trim: true
    },
    health_check_url: {
      type: String,
      trim: true
    },
    key_validation_url: {
      type: String,
      trim: true
    },
    api_key: {
      type: String,
      trim: true
    },
    template_id: {
      type: String,
      trim: true
    },
    auto_generate: {
      type: Boolean,
      default: false
    }
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

eventSchema.index({ status: 1, event_start_date: 1 });
eventSchema.index({ status: 1, registration_deadline: 1 });
eventSchema.index({ created_at: -1 });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ is_featured: 1, status: 1 });

// ===============================================
// VIRTUAL FIELDS
// ===============================================

/**
 * Check if registration is currently open
 * Uses fallback logic for backward compatibility with legacy fields
 */
eventSchema.virtual('is_registration_open').get(function () {
  const now = new Date();
  // Use new schedule fields with fallback to legacy fields
  const regStart = this.schedule?.registration_start || this.registration_start_date;
  const regDeadline = this.schedule?.registration_deadline || this.registration_deadline;

  const registrationStarted = !regStart || now >= regStart;
  const registrationNotEnded = !regDeadline || now <= regDeadline;
  const eventActive = this.status === EVENT_STATUS.ACTIVE;

  return eventActive && registrationStarted && registrationNotEnded;
});

/**
 * Check if event is upcoming
 */
eventSchema.virtual('is_upcoming').get(function () {
  return this.event_start_date > new Date();
});

/**
 * Check if event is ongoing
 */
eventSchema.virtual('is_ongoing').get(function () {
  const now = new Date();
  return now >= this.event_start_date && now <= this.event_end_date;
});

/**
 * Check if event is completed
 */
eventSchema.virtual('is_completed').get(function () {
  return this.event_end_date < new Date();
});

/**
 * Days until event starts
 */
eventSchema.virtual('days_until_event').get(function () {
  const now = new Date();
  if (this.event_start_date <= now) return 0;

  const diffTime = Math.abs(this.event_start_date - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

/**
 * Days until registration closes
 */
eventSchema.virtual('days_until_registration_closes').get(function () {
  if (!this.registration_deadline) return null;

  const now = new Date();
  if (this.registration_deadline <= now) return 0;

  const diffTime = Math.abs(this.registration_deadline - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// ===============================================
// MIDDLEWARE
// ===============================================

// Pre-save: Ensure form schema fields have unique IDs
eventSchema.pre('save', function (next) {
  if (this.isModified('form_schema')) {
    const fieldIds = this.form_schema.map(field => field.field_id);
    const uniqueIds = new Set(fieldIds);

    if (fieldIds.length !== uniqueIds.size) {
      return next(new Error('Form schema fields must have unique IDs'));
    }

    // Sort fields by order
    this.form_schema.sort((a, b) => a.order - b.order);
  }

  next();
});

// Pre-save: Ensure discount rules are sorted and have unique min_students
eventSchema.pre('save', function (next) {
  if (this.isModified('bulk_discount_rules') && this.bulk_discount_rules.length > 0) {
    // Validate unique min_students values
    const minStudentsValues = this.bulk_discount_rules.map(r => r.min_students);
    if (new Set(minStudentsValues).size !== minStudentsValues.length) {
      return next(new Error('Discount rules must have unique minimum student values'));
    }
    // Sort by min_students ascending
    this.bulk_discount_rules.sort((a, b) => a.min_students - b.min_students);
  }
  next();
});

// ===============================================
// INSTANCE METHODS
// ===============================================

/**
 * Get fee for a specific currency
 * @param {string} currency - Currency code (INR or USD)
 * @returns {number} - Fee amount
 */
eventSchema.methods.getFee = function (currency) {
  return currency === 'INR' ? this.base_fee_inr : this.base_fee_usd;
};

/**
 * Calculate discount for a given student count
 * @param {number} studentCount - Number of students
 * @returns {Object} - Discount details
 */
eventSchema.methods.calculateDiscount = function (studentCount) {
  if (!this.bulk_discount_rules || this.bulk_discount_rules.length === 0) {
    return { percentage: 0, min_students: 0 };
  }

  // Find applicable discount rule - sort by min_students descending to get highest applicable tier
  const applicableRule = this.bulk_discount_rules
    .filter(rule => studentCount >= rule.min_students)
    .sort((a, b) => b.min_students - a.min_students)[0];

  if (!applicableRule) {
    return { percentage: 0, min_students: 0 };
  }

  return {
    percentage: applicableRule.discount_percentage,
    min_students: applicableRule.min_students
  };
};

/**
 * Calculate total amount for registration
 * @param {number} studentCount - Number of students
 * @param {string} currency - Currency code
 * @returns {Object} - Pricing breakdown
 */
eventSchema.methods.calculateTotal = function (studentCount, currency) {
  const baseFee = this.getFee(currency);
  const baseAmount = baseFee * studentCount;
  const discount = this.calculateDiscount(studentCount);
  const discountAmount = (baseAmount * discount.percentage) / 100;
  const totalAmount = baseAmount - discountAmount;

  return {
    baseFee,
    baseAmount,
    studentCount,
    discountPercentage: discount.percentage,
    discountAmount,
    totalAmount,
    currency
  };
};

/**
 * Get form field by ID
 * @param {string} fieldId - Field ID
 * @returns {Object} - Field object
 */
eventSchema.methods.getField = function (fieldId) {
  return this.form_schema.find(field => field.field_id === fieldId);
};

/**
 * Increment view count
 */
eventSchema.methods.incrementViewCount = async function () {
  this.view_count += 1;
  await this.save();
};

/**
 * Increment registration count
 */
eventSchema.methods.incrementRegistrationCount = async function () {
  this.registration_count += 1;
  await this.save();
};

/**
 * Increment share count (metrics)
 */
eventSchema.methods.incrementShareCount = async function () {
  if (!this.metrics) this.metrics = {};
  this.metrics.share_count = (this.metrics.share_count || 0) + 1;
  await this.save();
};

/**
 * Increment wishlist count (metrics)
 */
eventSchema.methods.incrementWishlistCount = async function () {
  if (!this.metrics) this.metrics = {};
  this.metrics.wishlist_count = (this.metrics.wishlist_count || 0) + 1;
  await this.save();
};

/**
 * Update conversion rate (metrics)
 */
eventSchema.methods.updateConversionRate = async function () {
  if (this.view_count > 0) {
    if (!this.metrics) this.metrics = {};
    this.metrics.conversion_rate = (this.registration_count / this.view_count) * 100;
    await this.save();
  }
};

// ===============================================
// STATIC METHODS
// ===============================================

/**
 * Find active events
 * @returns {Promise<Event[]>} - Array of active events
 */
eventSchema.statics.findActive = function () {
  return this.find({
    status: EVENT_STATUS.ACTIVE,
    registration_deadline: { $gte: new Date() }
  }).sort({ event_start_date: 1 });
};

/**
 * Find featured events
 * @returns {Promise<Event[]>} - Array of featured events
 */
eventSchema.statics.findFeatured = function () {
  return this.find({
    is_featured: true,
    status: EVENT_STATUS.ACTIVE
  }).sort({ event_start_date: 1 });
};

/**
 * Find events by category
 * @param {string} category - Category name
 * @returns {Promise<Event[]>} - Array of events
 */
eventSchema.statics.findByCategory = function (category) {
  return this.find({
    category,
    status: EVENT_STATUS.ACTIVE
  }).sort({ event_start_date: 1 });
};

/**
 * Find event by slug
 * @param {string} slug - Event slug
 * @returns {Promise<Event>} - Event document
 */
eventSchema.statics.findBySlug = function (slug) {
  return this.findOne({ event_slug: slug });
};

// ===============================================
// MODEL
// ===============================================

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
