const express = require('express');
const router = express.Router();

// Controllers
const schoolAuthController = require('../controllers/auth/schoolAuth.controller');
const adminAuthController = require('../controllers/auth/adminAuth.controller');

// Middleware
const { requireAuth, checkUserStatus } = require('../middleware/auth.middleware');
const { requireSchool, requireAdmin, requireSuperAdmin } = require('../middleware/role.middleware');
const {
  validate,
  schoolRegistrationSchema,
  schoolLoginSchema,
  adminLoginSchema,
  passwordResetRequestSchema,
  passwordResetSchema
} = require('../middleware/validate.middleware');

// ===============================================
// SCHOOL AUTHENTICATION ROUTES
// ===============================================

/**
 * @route   POST /api/v1/auth/school/register
 * @desc    Register a new school
 * @access  Public
 */
router.post(
  '/school/register',
  validate(schoolRegistrationSchema),
  schoolAuthController.register
);

/**
 * @route   POST /api/v1/auth/school/login
 * @desc    Login school
 * @access  Public
 */
router.post(
  '/school/login',
  validate(schoolLoginSchema),
  schoolAuthController.login
);

/**
 * @route   GET /api/v1/auth/school/me
 * @desc    Get current school profile
 * @access  Private (School)
 */
router.get(
  '/school/me',
  requireAuth,
  checkUserStatus,
  requireSchool,
  schoolAuthController.getMe
);

/**
 * @route   PUT /api/v1/auth/school/profile
 * @desc    Update school profile
 * @access  Private (School)
 */
router.put(
  '/school/profile',
  requireAuth,
  checkUserStatus,
  requireSchool,
  schoolAuthController.updateProfile
);

/**
 * @route   PUT /api/v1/auth/school/change-password
 * @desc    Change password
 * @access  Private (School)
 */
router.put(
  '/school/change-password',
  requireAuth,
  requireSchool,
  schoolAuthController.changePassword
);

/**
 * @route   POST /api/v1/auth/school/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/school/forgot-password',
  validate(passwordResetRequestSchema),
  schoolAuthController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/school/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post(
  '/school/reset-password',
  validate(passwordResetSchema),
  schoolAuthController.resetPassword
);

/**
 * @route   POST /api/v1/auth/school/verify-email
 * @desc    Verify email
 * @access  Public
 */
router.post(
  '/school/verify-email',
  schoolAuthController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/school/resend-verification
 * @desc    Resend verification email
 * @access  Private (School)
 */
router.post(
  '/school/resend-verification',
  requireAuth,
  checkUserStatus,
  requireSchool,
  schoolAuthController.resendVerificationEmail
);

/**
 * @route   POST /api/v1/auth/school/send-otp
 * @desc    Send email verification OTP
 * @access  Private (School)
 */
router.post(
  '/school/send-otp',
  requireAuth,
  checkUserStatus,
  requireSchool,
  schoolAuthController.sendOtp
);

/**
 * @route   POST /api/v1/auth/school/verify-otp
 * @desc    Verify email OTP
 * @access  Private (School)
 */
router.post(
  '/school/verify-otp',
  requireAuth,
  checkUserStatus,
  requireSchool,
  schoolAuthController.verifyOtp
);

/**
 * @route   POST /api/v1/auth/school/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/school/refresh-token',
  schoolAuthController.refreshToken
);

// ===============================================
// ADMIN AUTHENTICATION ROUTES
// ===============================================

/**
 * @route   POST /api/v1/auth/admin/login
 * @desc    Login admin
 * @access  Public
 */
router.post(
  '/admin/login',
  validate(adminLoginSchema),
  adminAuthController.login
);

/**
 * @route   GET /api/v1/auth/admin/me
 * @desc    Get current admin profile
 * @access  Private (Admin)
 */
router.get(
  '/admin/me',
  requireAuth,
  checkUserStatus,
  requireAdmin,
  adminAuthController.getMe
);

/**
 * @route   PUT /api/v1/auth/admin/profile
 * @desc    Update admin profile
 * @access  Private (Admin)
 */
router.put(
  '/admin/profile',
  requireAuth,
  checkUserStatus,
  requireAdmin,
  adminAuthController.updateProfile
);

/**
 * @route   PUT /api/v1/auth/admin/change-password
 * @desc    Change password
 * @access  Private (Admin)
 */
router.put(
  '/admin/change-password',
  requireAuth,
  requireAdmin,
  adminAuthController.changePassword
);

/**
 * @route   POST /api/v1/auth/admin/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/admin/forgot-password',
  validate(passwordResetRequestSchema),
  adminAuthController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/admin/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post(
  '/admin/reset-password',
  validate(passwordResetSchema),
  adminAuthController.resetPassword
);

/**
 * @route   POST /api/v1/auth/admin/create
 * @desc    Create new admin (Super Admin only)
 * @access  Private (Super Admin)
 */
router.post(
  '/admin/create',
  requireAuth,
  checkUserStatus,
  requireSuperAdmin,
  adminAuthController.createAdmin
);

/**
 * @route   POST /api/v1/auth/admin/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/admin/refresh-token',
  adminAuthController.refreshToken
);

/**
 * @route   POST /api/v1/auth/admin/logout
 * @desc    Logout admin
 * @access  Private (Admin)
 */
router.post(
  '/admin/logout',
  requireAuth,
  requireAdmin,
  adminAuthController.logout
);

module.exports = router;
