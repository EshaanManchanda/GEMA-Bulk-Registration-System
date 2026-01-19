const mongoose = require('mongoose');
const { REGISTRATION_STATUS } = require('../utils/constants');

/**
 * Registration Schema
 * Represents individual student registrations with dynamic data
 */
const registrationSchema = new mongoose.Schema({
  registration_id: {
    type: String,
    required: [true, 'Registration ID is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
    default: function() {
      const { generateRegistrationId } = require('../utils/helpers');
      return generateRegistrationId();
    }
  },
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch ID is required'],
    index: true
  },
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required'],
    index: true
  },
  school_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required'],
    index: true
  },
  student_name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    maxlength: [200, 'Student name cannot exceed 200 characters']
  },
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    trim: true
  },
  section: {
    type: String,
    trim: true
  },
  dynamic_data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  status: {
    type: String,
    enum: {
      values: Object.values(REGISTRATION_STATUS),
      message: '{VALUE} is not a valid registration status'
    },
    default: REGISTRATION_STATUS.REGISTERED,
    index: true
  },
  certificate_url: {
    type: String, // Cloudinary URL (generated later)
    trim: true
  },
  certificate_generated_at: {
    type: Date
  },
  result: {
    score: Number,
    rank: Number,
    award: String,
    remarks: String
  },
  row_number: {
    type: Number, // Row number from Excel file
    min: [1, 'Row number must be positive']
  },
  attendance_marked: {
    type: Boolean,
    default: false
  },
  attended_at: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
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

registrationSchema.index({ batch_id: 1, row_number: 1 });
registrationSchema.index({ event_id: 1, school_id: 1 });
registrationSchema.index({ student_name: 'text' });
registrationSchema.index({ status: 1, created_at: -1 });
registrationSchema.index({ grade: 1 });

// ===============================================
// VIRTUAL FIELDS
// ===============================================

/**
 * Check if registration is confirmed (payment completed)
 */
registrationSchema.virtual('is_confirmed').get(function() {
  return this.status === REGISTRATION_STATUS.CONFIRMED;
});

/**
 * Check if student attended
 */
registrationSchema.virtual('did_attend').get(function() {
  return this.status === REGISTRATION_STATUS.ATTENDED || this.attendance_marked;
});

// ===============================================
// MIDDLEWARE
// ===============================================

// Pre-save: Generate registration ID if not exists
registrationSchema.pre('save', function(next) {
  if (!this.registration_id) {
    const { generateRegistrationId } = require('../utils/helpers');
    this.registration_id = generateRegistrationId();
  }
  next();
});

// Pre-save: Convert dynamic_data object to Map if needed
registrationSchema.pre('save', function(next) {
  if (this.dynamic_data && !(this.dynamic_data instanceof Map)) {
    this.dynamic_data = new Map(Object.entries(this.dynamic_data));
  }
  next();
});

// ===============================================
// INSTANCE METHODS
// ===============================================

/**
 * Get dynamic field value
 * @param {string} fieldId - Field ID
 * @returns {*} - Field value
 */
registrationSchema.methods.getFieldValue = function(fieldId) {
  return this.dynamic_data.get(fieldId);
};

/**
 * Set dynamic field value
 * @param {string} fieldId - Field ID
 * @param {*} value - Field value
 */
registrationSchema.methods.setFieldValue = function(fieldId, value) {
  if (!this.dynamic_data) {
    this.dynamic_data = new Map();
  }
  this.dynamic_data.set(fieldId, value);
};

/**
 * Get all dynamic data as object
 * @returns {Object} - Dynamic data object
 */
registrationSchema.methods.getDynamicDataObject = function() {
  if (!this.dynamic_data) return {};
  return Object.fromEntries(this.dynamic_data);
};

/**
 * Confirm registration (after payment)
 */
registrationSchema.methods.confirm = async function() {
  this.status = REGISTRATION_STATUS.CONFIRMED;
  await this.save();
};

/**
 * Cancel registration
 */
registrationSchema.methods.cancel = async function() {
  this.status = REGISTRATION_STATUS.CANCELLED;
  await this.save();
};

/**
 * Mark as attended
 */
registrationSchema.methods.markAttendance = async function() {
  this.status = REGISTRATION_STATUS.ATTENDED;
  this.attendance_marked = true;
  this.attended_at = new Date();
  await this.save();
};

/**
 * Set result
 * @param {Object} resultData - Result data
 */
registrationSchema.methods.setResult = async function(resultData) {
  this.result = {
    score: resultData.score,
    rank: resultData.rank,
    award: resultData.award,
    remarks: resultData.remarks
  };
  await this.save();
};

/**
 * Set certificate
 * @param {string} certificateUrl - Certificate PDF URL
 */
registrationSchema.methods.setCertificate = async function(certificateUrl) {
  this.certificate_url = certificateUrl;
  this.certificate_generated_at = new Date();
  await this.save();
};

/**
 * Get full student data (including dynamic fields)
 * @returns {Object} - Complete student data
 */
registrationSchema.methods.getCompleteData = function() {
  return {
    registration_id: this.registration_id,
    student_name: this.student_name,
    grade: this.grade,
    section: this.section,
    status: this.status,
    ...this.getDynamicDataObject()
  };
};

// ===============================================
// STATIC METHODS
// ===============================================

/**
 * Find registrations by batch
 * @param {string} batchId - Batch ID
 * @returns {Promise<Registration[]>} - Array of registrations
 */
registrationSchema.statics.findByBatch = function(batchId) {
  return this.find({ batch_id: batchId }).sort({ row_number: 1 });
};

/**
 * Find registrations by event
 * @param {string} eventId - Event ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Registration[]>} - Array of registrations
 */
registrationSchema.statics.findByEvent = function(eventId, filters = {}) {
  const query = { event_id: eventId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.grade) {
    query.grade = filters.grade;
  }

  if (filters.school_id) {
    query.school_id = filters.school_id;
  }

  return this.find(query).sort({ created_at: -1 });
};

/**
 * Find registrations by school
 * @param {string} schoolId - School ID
 * @returns {Promise<Registration[]>} - Array of registrations
 */
registrationSchema.statics.findBySchool = function(schoolId) {
  return this.find({ school_id: schoolId })
    .populate('event_id', 'title event_slug')
    .sort({ created_at: -1 });
};

/**
 * Search registrations by student name
 * @param {string} searchTerm - Search term
 * @param {Object} filters - Optional filters
 * @returns {Promise<Registration[]>} - Array of registrations
 */
registrationSchema.statics.searchByName = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm }
  };

  if (filters.event_id) {
    query.event_id = filters.event_id;
  }

  if (filters.school_id) {
    query.school_id = filters.school_id;
  }

  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

/**
 * Bulk confirm registrations for a batch
 * @param {string} batchId - Batch ID
 * @param {Object} options - Optional MongoDB options (e.g., { session } for transactions)
 * @returns {Promise<Object>} - Update result
 */
registrationSchema.statics.bulkConfirmByBatch = async function(batchId, options = {}) {
  return await this.updateMany(
    { batch_id: batchId, status: REGISTRATION_STATUS.REGISTERED },
    { $set: { status: REGISTRATION_STATUS.CONFIRMED } },
    options
  );
};

/**
 * Get registration statistics
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} - Statistics
 */
registrationSchema.statics.getStatistics = async function(filters = {}) {
  const matchStage = {};

  if (filters.event_id) {
    matchStage.event_id = new mongoose.Types.ObjectId(filters.event_id);
  }

  if (filters.school_id) {
    matchStage.school_id = new mongoose.Types.ObjectId(filters.school_id);
  }

  if (filters.startDate && filters.endDate) {
    matchStage.created_at = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalStats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unique_schools: { $addToSet: '$school_id' },
        unique_events: { $addToSet: '$event_id' }
      }
    }
  ]);

  return {
    by_status: stats,
    total: totalStats[0]?.total || 0,
    unique_schools_count: totalStats[0]?.unique_schools?.length || 0,
    unique_events_count: totalStats[0]?.unique_events?.length || 0
  };
};

// ===============================================
// MODEL
// ===============================================

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
