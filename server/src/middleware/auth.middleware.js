const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler.middleware');
const { asyncHandler } = require('../utils/helpers');
const School = require('../models/School');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');

/**
 * Verify JWT Token and attach user to request
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return next(new AppError('Access denied. No token provided.', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      user_type: decoded.user_type, // 'school' or 'admin'
      role: decoded.role, // For admin users
      school_code: decoded.school_code, // For school users
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please login again.', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please login again.', 401));
    }
    return next(new AppError('Authentication failed.', 401));
  }
});

/**
 * Require authenticated user (school or admin)
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  await verifyToken(req, res, next);
});

/**
 * Optional authentication - continues without auth if no token
 * Used for chatbot and public endpoints that work better with user context
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token, continue without auth
  if (!token) {
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      user_type: decoded.user_type,
      role: decoded.role,
      school_code: decoded.school_code,
      email: decoded.email
    };

    next();
  } catch (error) {
    // On error, continue without auth (don't block the request)
    logger.warn('Optional auth failed, continuing without authentication:', error.message);
    next();
  }
});

/**
 * Verify user still exists and is active
 */
const checkUserStatus = asyncHandler(async (req, res, next) => {
  if (req.user.user_type === 'school') {
    const school = await School.findById(req.user.id);

    if (!school) {
      return next(new AppError('School account no longer exists.', 401));
    }

    if (!school.is_active) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }

    // Removed is_verified check to allow unverified users to access /me and /send-otp
    // Specific routes should use requireVerifiedSchool from role.middleware.js if verification is required
    // if (!school.is_verified) {
    //   return next(new AppError('Your account is not verified. Please wait for admin approval.', 403));
    // }

    // Attach full school object to request
    req.school = school;
  }
  else if (req.user.user_type === 'admin') {
    const admin = await Admin.findById(req.user.id);

    if (!admin) {
      return next(new AppError('Admin account no longer exists.', 401));
    }

    if (!admin.is_active) {
      return next(new AppError('Your account has been deactivated.', 403));
    }

    // Attach full admin object to request
    req.admin = admin;
  }

  next();
});

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Expiration time
 * @returns {string} - JWT token
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRE || '15m') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {Object} - Decoded token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
};

/**
 * Create token response object
 * @param {Object} user - User object (school or admin)
 * @param {string} userType - 'school' or 'admin'
 * @returns {Object} - Token response
 */
const createTokenResponse = (user, userType) => {
  const payload = {
    id: user._id.toString(),
    user_type: userType,
    email: userType === 'school' ? user.contact_person.email : user.email
  };

  // Add type-specific fields
  if (userType === 'school') {
    payload.school_code = user.school_code;
  } else if (userType === 'admin') {
    payload.role = user.role;
  }

  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken({ id: user._id.toString(), user_type: userType });

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: process.env.JWT_EXPIRE || '15m'
  };
};

module.exports = {
  verifyToken,
  requireAuth,
  optionalAuth,
  checkUserStatus,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  createTokenResponse
};
