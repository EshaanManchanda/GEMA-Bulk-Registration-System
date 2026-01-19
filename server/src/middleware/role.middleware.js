const { AppError } = require('./errorHandler.middleware');
const { ROLES } = require('../utils/constants');

/**
 * Require user to be a school
 */
const requireSchool = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.user_type !== 'school') {
    return next(new AppError('Access denied. School account required.', 403));
  }

  next();
};

/**
 * Require user to be an admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.user_type !== 'admin') {
    return next(new AppError('Access denied. Admin account required.', 403));
  }

  next();
};

/**
 * Require user to be a super admin
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.user_type !== 'admin' || req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new AppError('Access denied. Super admin privileges required.', 403));
  }

  next();
};

/**
 * Require specific admin permission
 * @param {string} permission - Permission name (e.g., 'can_verify_schools')
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (req.user.user_type !== 'admin') {
      return next(new AppError('Access denied. Admin account required.', 403));
    }

    // Super admin has all permissions
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    // Check if admin object is attached
    if (!req.admin) {
      return next(new AppError('Admin profile not loaded', 500));
    }

    // Check specific permission
    if (!req.admin.permissions || !req.admin.permissions[permission]) {
      return next(new AppError(`Access denied. Permission '${permission}' required.`, 403));
    }

    next();
  };
};

/**
 * Require admin to have one of the specified roles
 * @param {Array<string>} roles - Array of allowed roles
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (req.user.user_type !== 'admin') {
      return next(new AppError('Access denied. Admin account required.', 403));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Access denied. Required roles: ${roles.join(', ')}`, 403));
    }

    next();
  };
};

/**
 * Allow access to own resources only (for schools)
 * Checks if the resource belongs to the authenticated school
 */
const requireOwnResource = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Admins can access any resource
    if (req.user.user_type === 'admin') {
      return next();
    }

    // Schools can only access their own resources
    if (req.user.user_type === 'school') {
      const resourceId = req.params[resourceIdParam] || req.body.school_id;

      if (!resourceId) {
        return next(new AppError('Resource ID not provided', 400));
      }

      // Check if resource belongs to the authenticated school
      if (resourceId !== req.user.id) {
        return next(new AppError('Access denied. You can only access your own resources.', 403));
      }

      return next();
    }

    next();
  };
};

/**
 * Require verified school account
 */
const requireVerifiedSchool = (req, res, next) => {
  if (!req.user || req.user.user_type !== 'school') {
    return next(new AppError('Access denied. School account required.', 403));
  }

  if (!req.school) {
    return next(new AppError('School profile not loaded', 500));
  }

  if (!req.school.is_verified) {
    return next(new AppError('Your account is not verified yet. Please wait for admin approval.', 403));
  }

  next();
};

/**
 * Require active account (school or admin)
 */
const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.user_type === 'school' && req.school) {
    if (!req.school.is_active) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }
  }

  if (req.user.user_type === 'admin' && req.admin) {
    if (!req.admin.is_active) {
      return next(new AppError('Your account has been deactivated.', 403));
    }
  }

  next();
};

module.exports = {
  requireSchool,
  requireAdmin,
  requireSuperAdmin,
  requirePermission,
  requireRole,
  requireOwnResource,
  requireVerifiedSchool,
  requireActiveAccount
};
