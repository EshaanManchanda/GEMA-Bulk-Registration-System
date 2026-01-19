const asyncHandler = require('../../middleware/async.middleware');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');
const Settings = require('../../models/Settings');
const Admin = require('../../models/Admin');
const { ROLES } = require('../../utils/constants');

// ===============================================
// SETTINGS MANAGEMENT
// ===============================================

/**
 * @desc    Get system settings
 * @route   GET /api/v1/admin/settings
 * @access  Private (Admin)
 */
exports.getSettings = asyncHandler(async (req, res, next) => {
  const settings = await Settings.getInstance();

  res.status(200).json({
    status: 'success',
    data: {
      settings
    }
  });
});

/**
 * @desc    Update system settings
 * @route   PUT /api/v1/admin/settings
 * @access  Private (Admin)
 */
exports.updateSettings = asyncHandler(async (req, res, next) => {
  const { system_name, default_currency, maintenance_mode, registration_open } = req.body;

  // Validate currency if provided
  if (default_currency && !['INR', 'USD'].includes(default_currency)) {
    return next(new AppError('Invalid currency code', 400));
  }

  const settings = await Settings.getInstance();

  // Update fields
  if (system_name !== undefined) settings.system_name = system_name;
  if (default_currency !== undefined) settings.default_currency = default_currency;
  if (maintenance_mode !== undefined) settings.maintenance_mode = maintenance_mode;
  if (registration_open !== undefined) settings.registration_open = registration_open;

  await settings.save();

  logger.info(`Settings updated by admin: ${req.user.email}`);

  res.status(200).json({
    status: 'success',
    data: {
      settings
    }
  });
});

// ===============================================
// ADMIN USERS MANAGEMENT
// ===============================================

/**
 * @desc    Get all admin users
 * @route   GET /api/v1/admin/users
 * @access  Private (Admin)
 */
exports.getAdminUsers = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    role,
    is_active,
    sort = '-created_at'
  } = req.query;

  // Build query
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (role) {
    query.role = role;
  }

  if (is_active !== undefined) {
    query.is_active = is_active === 'true';
  }

  // Execute query
  const admins = await Admin.find(query)
    .select('-password_hash -password_reset_token -password_reset_expires')
    .populate('created_by', 'name email')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Admin.countDocuments(query);

  // Transform admins to include status field
  const transformedAdmins = admins.map(admin => {
    const adminObj = admin.toObject();
    adminObj.status = adminObj.is_active ? 'active' : 'inactive';
    return adminObj;
  });

  res.status(200).json({
    status: 'success',
    data: {
      admins: transformedAdmins,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Create new admin user
 * @route   POST /api/v1/admin/users
 * @access  Private (Super Admin only)
 */
exports.createAdminUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role = 'admin' } = req.body;

  // Validation
  if (!name || !email || !password) {
    return next(new AppError('Please provide name, email, and password', 400));
  }

  if (password.length < 8) {
    return next(new AppError('Password must be at least 8 characters', 400));
  }

  // Check if email already exists
  const existingAdmin = await Admin.findByEmail(email);
  if (existingAdmin) {
    return next(new AppError('Email already registered', 400));
  }

  // Validate role
  if (!['admin', 'super_admin', 'moderator'].includes(role)) {
    return next(new AppError('Invalid role', 400));
  }

  // Create admin
  const admin = await Admin.create({
    name,
    email,
    password_hash: password, // Will be hashed by pre-save middleware
    role,
    created_by: req.user._id
  });

  logger.info(`New admin user created: ${email} by ${req.user.email}`);

  res.status(201).json({
    status: 'success',
    data: {
      admin: admin.toSafeObject()
    }
  });
});

/**
 * @desc    Update admin user
 * @route   PUT /api/v1/admin/users/:userId
 * @access  Private (Super Admin only)
 */
exports.updateAdminUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { name, email, role, is_active, permissions } = req.body;

  const admin = await Admin.findById(userId);

  if (!admin) {
    return next(new AppError('Admin user not found', 404));
  }

  // Prevent non-super-admins from changing roles
  if (role && req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new AppError('Only super admins can change roles', 403));
  }

  // Update fields
  if (name) admin.name = name;
  if (email) {
    // Check email uniqueness
    const existingAdmin = await Admin.findOne({ email, _id: { $ne: userId } });
    if (existingAdmin) {
      return next(new AppError('Email already in use', 400));
    }
    admin.email = email;
  }
  if (role) admin.role = role;
  if (is_active !== undefined) admin.is_active = is_active;
  if (permissions) admin.permissions = { ...admin.permissions, ...permissions };

  await admin.save();

  logger.info(`Admin user updated: ${admin.email} by ${req.user.email}`);

  res.status(200).json({
    status: 'success',
    data: {
      admin: admin.toSafeObject()
    }
  });
});

/**
 * @desc    Delete admin user
 * @route   DELETE /api/v1/admin/users/:userId
 * @access  Private (Super Admin only)
 */
exports.deleteAdminUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  // Prevent self-deletion
  if (userId === req.user._id.toString()) {
    return next(new AppError('You cannot delete your own account', 400));
  }

  const admin = await Admin.findById(userId);

  if (!admin) {
    return next(new AppError('Admin user not found', 404));
  }

  // Prevent deleting the last super admin
  if (admin.role === ROLES.SUPER_ADMIN) {
    const superAdminCount = await Admin.countDocuments({ role: ROLES.SUPER_ADMIN, is_active: true });
    if (superAdminCount <= 1) {
      return next(new AppError('Cannot delete the last super admin', 400));
    }
  }

  // Soft delete - set is_active to false
  admin.is_active = false;
  await admin.save();

  logger.info(`Admin user deleted: ${admin.email} by ${req.user.email}`);

  res.status(200).json({
    status: 'success',
    message: 'Admin user deleted successfully'
  });
});
