const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

/**
 * Admin Permissions Schema
 */
const permissionsSchema = new mongoose.Schema({
  can_create_events: {
    type: Boolean,
    default: true
  },
  can_verify_schools: {
    type: Boolean,
    default: true
  },
  can_verify_payments: {
    type: Boolean,
    default: true
  },
  can_manage_admins: {
    type: Boolean,
    default: false
  },
  can_delete_events: {
    type: Boolean,
    default: false
  },
  can_refund_payments: {
    type: Boolean,
    default: false
  },
  can_export_data: {
    type: Boolean,
    default: true
  },
  can_send_emails: {
    type: Boolean,
    default: true
  }
}, { _id: false });

/**
 * Admin Schema
 * Stores admin user information and permissions
 */
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password_hash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: {
      values: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MODERATOR],
      message: '{VALUE} is not a valid role'
    },
    default: ROLES.ADMIN,
    index: true
  },
  permissions: {
    type: permissionsSchema,
    default: () => ({})
  },
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar_url: {
    type: String,
    trim: true
  },
  last_login: {
    type: Date
  },
  last_login_ip: {
    type: String
  },
  password_reset_token: {
    type: String,
    select: false
  },
  password_reset_expires: {
    type: Date,
    select: false
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
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

adminSchema.index({ email: 1 });
adminSchema.index({ role: 1, is_active: 1 });
adminSchema.index({ created_at: -1 });

// ===============================================
// VIRTUAL FIELDS
// ===============================================

/**
 * Check if admin is super admin
 */
adminSchema.virtual('is_super_admin').get(function() {
  return this.role === ROLES.SUPER_ADMIN;
});

/**
 * Check if admin can manage other admins
 */
adminSchema.virtual('can_manage_admins_check').get(function() {
  return this.role === ROLES.SUPER_ADMIN || this.permissions?.can_manage_admins === true;
});

// ===============================================
// MIDDLEWARE
// ===============================================

// Pre-save: Hash password if modified
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save: Set permissions based on role
adminSchema.pre('save', function(next) {
  // Initialize permissions if role changed OR permissions are empty/undefined
  const needsPermissions = this.isModified('role') ||
                          !this.permissions ||
                          Object.keys(this.permissions || {}).length === 0;

  if (needsPermissions) {
    if (this.role === ROLES.SUPER_ADMIN) {
      // Super admin gets all permissions
      this.permissions = {
        can_create_events: true,
        can_verify_schools: true,
        can_verify_payments: true,
        can_manage_admins: true,
        can_delete_events: true,
        can_refund_payments: true,
        can_export_data: true,
        can_send_emails: true
      };
    } else if (this.role === ROLES.MODERATOR) {
      // Moderator gets limited permissions
      this.permissions = {
        can_create_events: false,
        can_verify_schools: false,
        can_verify_payments: false,
        can_manage_admins: false,
        can_delete_events: false,
        can_refund_payments: false,
        can_export_data: true,
        can_send_emails: false
      };
    } else {
      // Default ADMIN role gets base permissions
      this.permissions = {
        can_create_events: true,
        can_verify_schools: true,
        can_verify_payments: true,
        can_manage_admins: false,
        can_delete_events: false,
        can_refund_payments: false,
        can_export_data: false,
        can_send_emails: false
      };
    }
  }
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
adminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password_hash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Update last login
 * @param {string} ipAddress - Login IP address
 */
adminSchema.methods.updateLastLogin = async function(ipAddress) {
  this.last_login = new Date();
  this.last_login_ip = ipAddress;
  await this.save();
};

/**
 * Generate password reset token
 * @returns {string} - Reset token
 */
adminSchema.methods.createPasswordResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.password_reset_token = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.password_reset_expires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

/**
 * Check if admin has specific permission
 * @param {string} permission - Permission name
 * @returns {boolean} - True if admin has permission
 */
adminSchema.methods.hasPermission = function(permission) {
  // Super admin has all permissions
  if (this.role === ROLES.SUPER_ADMIN) {
    return true;
  }

  // Check specific permission
  return this.permissions && this.permissions[permission] === true;
};

/**
 * Convert to safe object (remove sensitive fields)
 * @returns {Object} - Safe admin object
 */
adminSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.password_reset_token;
  delete obj.password_reset_expires;
  delete obj.__v;
  return obj;
};

// ===============================================
// STATIC METHODS
// ===============================================

/**
 * Find admin by email
 * @param {string} email - Email address
 * @returns {Promise<Admin>} - Admin document
 */
adminSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find active admins
 * @returns {Promise<Admin[]>} - Array of active admins
 */
adminSchema.statics.findActive = function() {
  return this.find({ is_active: true }).sort({ name: 1 });
};

/**
 * Find admins by role
 * @param {string} role - Role name
 * @returns {Promise<Admin[]>} - Array of admins
 */
adminSchema.statics.findByRole = function(role) {
  return this.find({ role, is_active: true }).sort({ name: 1 });
};

/**
 * Count active admins
 * @returns {Promise<number>} - Count of active admins
 */
adminSchema.statics.countActive = function() {
  return this.countDocuments({ is_active: true });
};

// ===============================================
// MODEL
// ===============================================

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
