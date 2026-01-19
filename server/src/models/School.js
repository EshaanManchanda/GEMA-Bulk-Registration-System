const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { CURRENCIES } = require('../utils/constants');

/**
 * School Schema
 * Stores information about registered schools
 */
const schoolSchema = new mongoose.Schema({
  school_code: {
    type: String,
    required: [true, 'School code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [6, 'School code must be 6 characters'],
    maxlength: [6, 'School code must be 6 characters'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    maxlength: [200, 'School name cannot exceed 200 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    index: true
  },
  currency_pref: {
    type: String,
    enum: {
      values: Object.values(CURRENCIES),
      message: '{VALUE} is not a valid currency'
    },
    required: [true, 'Currency preference is required']
  },
  contact_person: {
    name: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true
    },
    designation: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
      minlength: [10, 'Phone number must be at least 10 digits'],
      maxlength: [15, 'Phone number cannot exceed 15 digits']
    }
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    postal_code: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },
  password_hash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password by default
  },
  is_verified: {
    type: Boolean,
    default: false,
    index: true
  },
  verification_token: {
    type: String,
    select: false
  },
  verification_token_expires: {
    type: Date,
    select: false
  },
  verification_token_expires: {
    type: Date,
    select: false
  },
  email_verification_otp: {
    type: String,
    select: false
  },
  email_verification_otp_expires: {
    type: Date,
    select: false
  },
  external_docs_link: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        if (!v) return true; // Optional field
        try {
          new URL(v);
          return true;
        } catch (err) {
          return false;
        }
      },
      message: 'Please provide a valid URL'
    }
  },
  is_active: {
    type: Boolean,
    default: true
  },
  password_reset_token: {
    type: String,
    select: false
  },
  password_reset_expires: {
    type: Date,
    select: false
  },
  last_login: {
    type: Date
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

schoolSchema.index({ 'contact_person.email': 1 });
schoolSchema.index({ country: 1, currency_pref: 1 });
schoolSchema.index({ is_verified: 1, is_active: 1 });
schoolSchema.index({ created_at: -1 });

// ===============================================
// VIRTUAL FIELDS
// ===============================================

// Virtual for total registrations (populated when needed)
schoolSchema.virtual('registration_count', {
  ref: 'Batch',
  localField: '_id',
  foreignField: 'school_id',
  count: true
});

// Virtual for total spent (calculated when needed)
schoolSchema.virtual('total_spent', {
  ref: 'Batch',
  localField: '_id',
  foreignField: 'school_id'
});

// ===============================================
// MIDDLEWARE
// ===============================================

// Pre-save middleware: Hash password if modified
schoolSchema.pre('save', async function (next) {
  // Only hash password if it's new or modified
  if (!this.isModified('password_hash')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware: Update timestamps
schoolSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// ===============================================
// INSTANCE METHODS
// ===============================================

/**
 * Compare password for authentication
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} - True if password matches
 */
schoolSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password_hash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Generate verification token
 * @returns {string} - Verification token
 */
schoolSchema.methods.createVerificationToken = function () {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');

  // Hash token and save to database
  this.verification_token = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Set expiration (24 hours)
  this.verification_token_expires = Date.now() + 24 * 60 * 60 * 1000;

  return token;
};

/**
 * Generate verification OTP
 * @returns {string} - 6 digit OTP
 */
schoolSchema.methods.createVerificationOtp = function () {
  // Generate 6 digit random number
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save hashed OTP (optional, but good practice) or plain for simplicity since it's short lived
  // For this implementation, we'll store plain text for simplicity and debugging, 
  // but in high security apps, hash it. Given it's 6 digits, hashing adds little value against brute force
  // without rate limiting. We rely on expiration.
  this.email_verification_otp = otp;

  // Set expiration (10 minutes)
  this.email_verification_otp_expires = Date.now() + 10 * 60 * 1000;

  return otp;
};

/**
 * Generate password reset token
 * @returns {string} - Reset token
 */
schoolSchema.methods.createPasswordResetToken = function () {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and save to database
  this.password_reset_token = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expiration (10 minutes)
  this.password_reset_expires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

/**
 * Convert to safe object (remove sensitive fields)
 * @returns {Object} - Safe school object
 */
schoolSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.verification_token;
  delete obj.email_verification_otp;
  delete obj.email_verification_otp_expires;
  delete obj.password_reset_token;
  delete obj.__v;
  return obj;
};

// ===============================================
// STATIC METHODS
// ===============================================

/**
 * Find school by email
 * @param {string} email - Email address
 * @returns {Promise<School>} - School document
 */
schoolSchema.statics.findByEmail = function (email) {
  return this.findOne({ 'contact_person.email': email.trim().toLowerCase() });
};

/**
 * Find verified schools
 * @returns {Promise<School[]>} - Array of verified schools
 */
schoolSchema.statics.findVerified = function () {
  return this.find({ is_verified: true, is_active: true });
};

/**
 * Find schools by country
 * @param {string} country - Country name
 * @returns {Promise<School[]>} - Array of schools
 */
schoolSchema.statics.findByCountry = function (country) {
  return this.find({ country, is_active: true });
};

// ===============================================
// MODEL
// ===============================================

const School = mongoose.model('School', schoolSchema);

module.exports = School;
