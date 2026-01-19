const crypto = require('crypto');
const Admin = require('../../models/Admin');
const { AppError } = require('../../middleware/errorHandler.middleware');
const { asyncHandler } = require('../../utils/helpers');
const { createTokenResponse } = require('../../middleware/auth.middleware');
const logger = require('../../utils/logger');
const emailService = require('../../services/email.service');

/**
 * @desc    Login admin
 * @route   POST /api/v1/auth/admin/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find admin by email and include password
  const admin = await Admin.findByEmail(email).select('+password_hash');

  if (!admin) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check password
  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if admin is active
  if (!admin.is_active) {
    return next(new AppError('Your account has been deactivated', 403));
  }

  // Update last login
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  await admin.updateLastLogin(ipAddress);

  logger.info(`Admin login: ${admin.email} (${admin.role})`);

  // Generate tokens
  const tokens = createTokenResponse(admin, 'admin');

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        is_active: admin.is_active
      },
      tokens
    }
  });
});

/**
 * @desc    Get current admin profile
 * @route   GET /api/v1/auth/admin/me
 * @access  Private (Admin)
 */
const getMe = asyncHandler(async (req, res, next) => {
  const admin = await Admin.findById(req.user.id);

  if (!admin) {
    return next(new AppError('Admin not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      admin: admin.toSafeObject()
    }
  });
});

/**
 * @desc    Update admin profile
 * @route   PUT /api/v1/auth/admin/profile
 * @access  Private (Admin)
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const admin = await Admin.findById(req.user.id);

  if (!admin) {
    return next(new AppError('Admin not found', 404));
  }

  // Fields allowed to update
  const { name, phone, avatar_url } = req.body;

  if (name) admin.name = name;
  if (phone) admin.phone = phone;
  if (avatar_url !== undefined) admin.avatar_url = avatar_url;

  await admin.save();

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      admin: admin.toSafeObject()
    }
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/v1/auth/admin/change-password
 * @access  Private (Admin)
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const { current_password, new_password } = req.body;

  // Get admin with password
  const admin = await Admin.findById(req.user.id).select('+password_hash');

  if (!admin) {
    return next(new AppError('Admin not found', 404));
  }

  // Check current password
  const isPasswordValid = await admin.comparePassword(current_password);
  if (!isPasswordValid) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  admin.password_hash = new_password;
  await admin.save();

  logger.info(`Password changed for admin: ${admin.email}`);

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully'
  });
});

/**
 * @desc    Request password reset
 * @route   POST /api/v1/auth/admin/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const admin = await Admin.findByEmail(email);

  if (!admin) {
    // Don't reveal if email exists or not for security
    return res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // Generate reset token
  const resetToken = admin.createPasswordResetToken();
  await admin.save({ validateBeforeSave: false });

  // Send password reset email (non-blocking)
  setImmediate(async () => {
    try {
      await emailService.sendPasswordResetEmail(admin.email, {
        adminName: admin.name,
        resetLink: `${process.env.FRONTEND_URL}/admin/reset-password/${resetToken}`
      });
      logger.info(`Password reset email sent to: ${admin.email}`);
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
    }
  });

  logger.info(`Password reset requested for admin: ${admin.email}`);

  res.status(200).json({
    status: 'success',
    message: 'If an account with that email exists, a password reset link has been sent.',
    // In development, return token (remove in production)
    ...(process.env.NODE_ENV === 'development' && { resetToken })
  });
});

/**
 * @desc    Reset password
 * @route   POST /api/v1/auth/admin/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  // Hash the token from URL
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find admin with valid token
  const admin = await Admin.findOne({
    password_reset_token: hashedToken,
    password_reset_expires: { $gt: Date.now() }
  });

  if (!admin) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  // Update password
  admin.password_hash = password;
  admin.password_reset_token = undefined;
  admin.password_reset_expires = undefined;
  await admin.save();

  logger.info(`Password reset successful for admin: ${admin.email}`);

  res.status(200).json({
    status: 'success',
    message: 'Password reset successful. You can now login with your new password.'
  });
});

/**
 * @desc    Create new admin (Super Admin only)
 * @route   POST /api/v1/auth/admin/create
 * @access  Private (Super Admin)
 */
const createAdmin = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, permissions } = req.body;

  // Check if admin with email already exists
  const existingAdmin = await Admin.findByEmail(email);
  if (existingAdmin) {
    return next(new AppError('An admin with this email already exists', 400));
  }

  // Only super admin can create super admins
  if (role === 'super_admin' && req.user.role !== 'super_admin') {
    return next(new AppError('Only super admins can create other super admins', 403));
  }

  // Create admin
  const admin = await Admin.create({
    name,
    email,
    password_hash: password,
    role: role || 'admin',
    permissions,
    created_by: req.user.id
  });

  logger.info(`New admin created: ${admin.email} by ${req.user.email}`);

  res.status(201).json({
    status: 'success',
    message: 'Admin created successfully',
    data: {
      admin: admin.toSafeObject()
    }
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/admin/refresh-token
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res, next) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return next(new AppError('Refresh token is required', 400));
  }

  const { verifyRefreshToken } = require('../../middleware/auth.middleware');

  // Verify refresh token
  const decoded = verifyRefreshToken(refresh_token);

  // Get admin
  const admin = await Admin.findById(decoded.id);

  if (!admin || !admin.is_active) {
    return next(new AppError('Invalid refresh token', 401));
  }

  // Generate new tokens
  const tokens = createTokenResponse(admin, 'admin');

  res.status(200).json({
    status: 'success',
    data: {
      tokens
    }
  });
});

/**
 * @desc    Logout (client-side token removal)
 * @route   POST /api/v1/auth/admin/logout
 * @access  Private (Admin)
 */
const logout = asyncHandler(async (req, res, next) => {
  // JWT tokens are stateless, so logout is handled client-side
  // This endpoint is mainly for logging purposes

  logger.info(`Admin logout: ${req.user.email}`);

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

module.exports = {
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  createAdmin,
  refreshToken,
  logout
};
