const crypto = require('crypto');
const School = require('../../models/School');
const CountryCurrency = require('../../models/CountryCurrency');
const { AppError } = require('../../middleware/errorHandler.middleware');
const { asyncHandler } = require('../../utils/helpers');
const { generateSchoolCode } = require('../../utils/helpers');
const { createTokenResponse } = require('../../middleware/auth.middleware');
const logger = require('../../utils/logger');
const emailService = require('../../services/email.service');

/**
 * @desc    Register a new school
 * @route   POST /api/v1/auth/school/register
 * @access  Public
 */
const register = asyncHandler(async (req, res, next) => {
  const {
    name,
    country,
    contact_person,
    address,
    password,
    external_docs_link
  } = req.body;

  // Check if school with this email already exists
  const existingSchool = await School.findByEmail(contact_person.email);
  if (existingSchool) {
    return next(new AppError('A school with this email already exists', 400));
  }

  // Resolve currency based on country
  const currency = await CountryCurrency.getCurrencyForCountry(country);

  // Generate unique school code
  let schoolCode;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    schoolCode = generateSchoolCode();
    const existing = await School.findOne({ school_code: schoolCode });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    return next(new AppError('Failed to generate unique school code. Please try again.', 500));
  }

  // Create school
  const school = await School.create({
    school_code: schoolCode,
    name,
    country,
    currency_pref: currency,
    contact_person,
    address,
    password_hash: password, // Will be hashed by pre-save middleware
    external_docs_link,
    is_verified: false
  });

  // Generate verification token
  const verificationToken = school.createVerificationToken();
  await school.save({ validateBeforeSave: false });

  // Send verification email and admin notifications (non-blocking)
  setImmediate(async () => {
    try {
      // Send welcome email to school
      await emailService.sendWelcomeEmail(school, verificationToken);
      logger.info(`Welcome email sent to: ${school.contact_person.email}`);

      // Notify admins about new school registration
      const Admin = require('../../models/Admin');
      const activeAdmins = await Admin.find({ is_active: true }).select('email');
      const adminEmails = activeAdmins.map(admin => admin.email);

      if (adminEmails.length > 0) {
        await emailService.sendNewSchoolRegistrationAlert({
          school,
          adminEmails
        });
        logger.info(`Admin notification sent for new school: ${school.school_code}`);
      }
    } catch (error) {
      logger.error('Failed to send emails:', error);
    }
  });

  logger.info(`New school registered: ${school.school_code} - ${school.name}`);

  // Generate tokens
  const tokens = createTokenResponse(school, 'school');

  res.status(201).json({
    status: 'success',
    message: 'School registered successfully. Please wait for admin verification.',
    data: {
      school: {
        id: school._id,
        school_code: school.school_code,
        name: school.name,
        country: school.country,
        currency: school.currency_pref,
        contact_email: school.contact_person.email,
        is_verified: school.is_verified
      },
      tokens
    }
  });
});

/**
 * @desc    Login school
 * @route   POST /api/v1/auth/school/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find school by email and include password
  const school = await School.findByEmail(email).select('+password_hash');

  if (!school) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check password
  const isPasswordValid = await school.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if school is active
  if (!school.is_active) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 403));
  }

  // Update last login
  school.last_login = new Date();
  await school.save({ validateBeforeSave: false });

  logger.info(`School login: ${school.school_code} - ${school.name}`);

  // Generate tokens
  const tokens = createTokenResponse(school, 'school');

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      school: {
        id: school._id,
        school_code: school.school_code,
        name: school.name,
        country: school.country,
        currency: school.currency_pref,
        contact_email: school.contact_person.email,
        is_verified: school.is_verified,
        is_active: school.is_active
      },
      tokens
    }
  });
});

/**
 * @desc    Get current school profile
 * @route   GET /api/v1/auth/school/me
 * @access  Private (School)
 */
const getMe = asyncHandler(async (req, res, next) => {
  const school = await School.findById(req.user.id);

  if (!school) {
    return next(new AppError('School not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      school: school.toSafeObject()
    }
  });
});

/**
 * @desc    Update school profile
 * @route   PUT /api/v1/auth/school/profile
 * @access  Private (School)
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const school = await School.findById(req.user.id);

  if (!school) {
    return next(new AppError('School not found', 404));
  }

  // Fields allowed to update
  const allowedFields = [
    'contact_person.name',
    'contact_person.designation',
    'contact_person.phone',
    'address',
    'external_docs_link'
  ];

  // Update allowed fields
  if (req.body.contact_person) {
    if (req.body.contact_person.name) {
      school.contact_person.name = req.body.contact_person.name;
    }
    if (req.body.contact_person.designation) {
      school.contact_person.designation = req.body.contact_person.designation;
    }
    if (req.body.contact_person.phone) {
      school.contact_person.phone = req.body.contact_person.phone;
    }
  }

  if (req.body.address) {
    school.address = { ...school.address, ...req.body.address };
  }

  if (req.body.external_docs_link !== undefined) {
    school.external_docs_link = req.body.external_docs_link;
  }

  await school.save();

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      school: school.toSafeObject()
    }
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/v1/auth/school/change-password
 * @access  Private (School)
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const { current_password, new_password } = req.body;

  // Get school with password
  const school = await School.findById(req.user.id).select('+password_hash');

  if (!school) {
    return next(new AppError('School not found', 404));
  }

  // Check current password
  const isPasswordValid = await school.comparePassword(current_password);
  if (!isPasswordValid) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  school.password_hash = new_password;
  await school.save();

  logger.info(`Password changed for school: ${school.school_code}`);

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully'
  });
});

/**
 * @desc    Request password reset
 * @route   POST /api/v1/auth/school/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const school = await School.findByEmail(email);

  if (!school) {
    // Don't reveal if email exists or not for security
    return res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // Generate reset token
  const resetToken = school.createPasswordResetToken();
  await school.save({ validateBeforeSave: false });

  // Send reset email (non-blocking)
  setImmediate(async () => {
    try {
      await emailService.sendPasswordResetEmail(
        school.contact_person.email,
        school.name,
        resetToken
      );
      logger.info(`Password reset email sent to: ${school.contact_person.email}`);
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
    }
  });

  logger.info(`Password reset requested for school: ${school.school_code}`);

  res.status(200).json({
    status: 'success',
    message: 'If an account with that email exists, a password reset link has been sent.',
    // In development, return token (remove in production)
    ...(process.env.NODE_ENV === 'development' && { resetToken })
  });
});

/**
 * @desc    Reset password
 * @route   POST /api/v1/auth/school/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  // Hash the token from URL
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find school with valid token
  const school = await School.findOne({
    password_reset_token: hashedToken,
    password_reset_expires: { $gt: Date.now() }
  });

  if (!school) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  // Update password
  school.password_hash = password;
  school.password_reset_token = undefined;
  school.password_reset_expires = undefined;
  await school.save();

  logger.info(`Password reset successful for school: ${school.school_code}`);

  res.status(200).json({
    status: 'success',
    message: 'Password reset successful. You can now login with your new password.'
  });
});

/**
 * @desc    Verify email
 * @route   POST /api/v1/auth/school/verify-email
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  // Hash the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find school with valid token
  const school = await School.findOne({
    verification_token: hashedToken,
    verification_token_expires: { $gt: Date.now() }
  });

  if (!school) {
    return next(new AppError('Invalid or expired verification token', 400));
  }

  // Mark as verified
  school.is_verified = true;
  school.verification_token = undefined;
  school.verification_token_expires = undefined;
  await school.save({ validateBeforeSave: false });

  logger.info(`Email verified for school: ${school.school_code}`);

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully. You can now login.'
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/school/refresh-token
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

  // Get school
  const school = await School.findById(decoded.id);

  if (!school || !school.is_active) {
    return next(new AppError('Invalid refresh token', 401));
  }

  // Generate new tokens
  const tokens = createTokenResponse(school, 'school');

  res.status(200).json({
    status: 'success',
    data: {
      tokens
    }
  });
});

/**
 * @desc    Send Email Verification OTP
 * @route   POST /api/v1/auth/school/send-otp
 * @access  Private (School)
 */
const sendOtp = asyncHandler(async (req, res, next) => {
  const school = await School.findById(req.user.id);

  if (!school) {
    return next(new AppError('School not found', 404));
  }

  if (school.is_verified) {
    return next(new AppError('Email is already verified', 400));
  }

  // Generate OTP
  const otp = school.createVerificationOtp();
  await school.save({ validateBeforeSave: false });

  // Send OTP email (non-blocking)
  setImmediate(async () => {
    try {
      await emailService.sendOtpEmail(school, otp);
      logger.info(`OTP sent to: ${school.contact_person.email}`);
    } catch (error) {
      logger.error('Failed to send OTP email:', error);
    }
  });

  res.status(200).json({
    status: 'success',
    message: 'OTP sent successfully to your registered email.'
  });
});

/**
 * @desc    Verify Email OTP
 * @route   POST /api/v1/auth/school/verify-otp
 * @access  Private (School)
 */
const verifyOtp = asyncHandler(async (req, res, next) => {
  const { otp } = req.body;

  if (!otp) {
    return next(new AppError('OTP is required', 400));
  }

  const school = await School.findById(req.user.id).select('+email_verification_otp +email_verification_otp_expires');

  if (!school) {
    return next(new AppError('School not found', 404));
  }

  if (school.is_verified) {
    return next(new AppError('Email is already verified', 400));
  }

  if (
    !school.email_verification_otp ||
    school.email_verification_otp !== otp ||
    school.email_verification_otp_expires < Date.now()
  ) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  // Mark as verified
  school.is_verified = true;
  school.email_verification_otp = undefined;
  school.email_verification_otp_expires = undefined;
  school.verification_token = undefined; // Clear legacy token if exists
  await school.save({ validateBeforeSave: false });

  logger.info(`Email verified via OTP for school: ${school.school_code}`);

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully.'
  });
});

/**
 * @desc    Resend Verification Email
 * @route   POST /api/v1/auth/school/resend-verification
 * @access  Private (School)
 */
const resendVerificationEmail = asyncHandler(async (req, res, next) => {
  const school = await School.findById(req.user.id);

  if (!school) {
    return next(new AppError('School not found', 404));
  }

  if (school.is_verified) {
    return next(new AppError('Email is already verified', 400));
  }

  // Generate new verification token
  const verificationToken = school.createVerificationToken();
  await school.save({ validateBeforeSave: false });

  // Send verification email (non-blocking)
  setImmediate(async () => {
    try {
      await emailService.sendVerificationReminder(school, verificationToken);
      logger.info(`Verification reminder sent to: ${school.contact_person.email}`);
    } catch (error) {
      logger.error('Failed to send verification reminder:', error);
    }
  });

  res.status(200).json({
    status: 'success',
    message: 'Verification email sent successfully.'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  refreshToken,
  sendOtp,
  verifyOtp,
  resendVerificationEmail
};
