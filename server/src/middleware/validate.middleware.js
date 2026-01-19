const Joi = require('joi');
const { AppError } = require('./errorHandler.middleware');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const commonSchemas = {
  // MongoDB ObjectId validation
  objectId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Invalid ID format'
  }),

  // Email validation
  email: Joi.string().email().lowercase().trim().messages({
    'string.email': 'Please provide a valid email address'
  }),

  // Password validation (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),

  // Phone validation (10-15 digits, optional + prefix)
  phone: Joi.string()
    .pattern(/^\+?[\d\s-()]{10,15}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number (10-15 digits)'
    }),

  // URL validation
  url: Joi.string().uri().messages({
    'string.uri': 'Please provide a valid URL'
  }),

  // Date validation
  date: Joi.date().iso().messages({
    'date.format': 'Please provide a valid date in ISO format'
  }),

  // Pagination
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }
};

/**
 * School registration validation schema
 */
const schoolRegistrationSchema = Joi.object({
  name: Joi.string().required().trim().max(200),
  country: Joi.string().required().trim(),
  contact_person: Joi.object({
    name: Joi.string().required().trim(),
    designation: Joi.string().trim().allow(''),
    email: commonSchemas.email.required(),
    phone: commonSchemas.phone.required()
  }).required(),
  address: Joi.object({
    street: Joi.string().trim().allow(''),
    city: Joi.string().trim().allow(''),
    state: Joi.string().trim().allow(''),
    postal_code: Joi.string().trim().allow(''),
    country: Joi.string().trim().allow('')
  }),
  password: commonSchemas.password.required(),
  confirm_password: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match'
  }),
  external_docs_link: commonSchemas.url.allow('')
});

/**
 * School login validation schema
 */
const schoolLoginSchema = Joi.object({
  email: commonSchemas.email.required(),
  password: Joi.string().required()
});

/**
 * Admin login validation schema
 */
const adminLoginSchema = Joi.object({
  email: commonSchemas.email.required(),
  password: Joi.string().required()
});

/**
 * Password reset request schema
 */
const passwordResetRequestSchema = Joi.object({
  email: commonSchemas.email.required()
});

/**
 * Password reset schema
 */
const passwordResetSchema = Joi.object({
  token: Joi.string().required(),
  password: commonSchemas.password.required(),
  confirm_password: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match'
  })
});

/**
 * Event creation validation schema
 */
const eventCreationSchema = Joi.object({
  title: Joi.string().required().trim().max(200),
  description: Joi.string().trim().max(2000).allow(''),
  short_description: Joi.string().trim().max(500).allow(''),
  base_fee_inr: Joi.number().min(0).required(),
  base_fee_usd: Joi.number().min(0).required(),
  event_start_date: commonSchemas.date.required(),
  event_end_date: commonSchemas.date.required().greater(Joi.ref('event_start_date')),
  registration_start_date: commonSchemas.date.allow(null),
  registration_deadline: commonSchemas.date.required(),
  max_participants: Joi.number().integer().min(1).allow(null),
  category: Joi.string().valid('olympiad', 'championship', 'competition', 'workshop', 'other').default('olympiad'),
  grade_levels: Joi.array().items(Joi.string()).default([]),
  form_schema: Joi.array().items(
    Joi.object({
      field_id: Joi.string().required(),
      field_label: Joi.string().required(),
      field_type: Joi.string().valid('text', 'number', 'email', 'date', 'select', 'textarea', 'checkbox', 'file', 'url').required(),
      field_options: Joi.array().items(Joi.string()),
      is_required: Joi.boolean().default(false),
      placeholder: Joi.string().allow(''),
      help_text: Joi.string().allow(''),
      validation_rules: Joi.object({
        min: Joi.number(),
        max: Joi.number(),
        pattern: Joi.string(),
        minLength: Joi.number(),
        maxLength: Joi.number()
      }),
      order: Joi.number().required()
    })
  ).min(1).required(),
  bulk_discount_rules: Joi.array().items(
    Joi.object({
      min_students: Joi.number().integer().min(1).required(),
      discount_percentage: Joi.number().min(0).max(100).required()
    })
  ).default([])
});

/**
 * Bulk upload validation schema
 */
const bulkUploadSchema = Joi.object({
  event_id: commonSchemas.objectId.required()
});

/**
 * Payment initiation schema
 */
const paymentInitiationSchema = Joi.object({
  batch_id: commonSchemas.objectId.required(),
  payment_mode: Joi.string().valid('online', 'offline').required()
});

/**
 * Validate Excel schema
 */
const validateExcelSchema = Joi.object({
  eventSlug: Joi.string().required().trim()
});

/**
 * Upload batch schema
 */
const uploadBatchSchema = Joi.object({
  eventSlug: Joi.string().required().trim()
});

/**
 * Validation schemas object for easier access
 */
const validationSchemas = {
  schoolRegistration: schoolRegistrationSchema,
  schoolLogin: schoolLoginSchema,
  adminLogin: adminLoginSchema,
  passwordResetRequest: passwordResetRequestSchema,
  passwordReset: passwordResetSchema,
  eventCreation: eventCreationSchema,
  bulkUpload: bulkUploadSchema,
  paymentInitiation: paymentInitiationSchema,
  validateExcel: validateExcelSchema,
  uploadBatch: uploadBatchSchema
};

module.exports = {
  validate,
  commonSchemas,
  validationSchemas,
  // Legacy exports for backward compatibility
  schoolRegistrationSchema,
  schoolLoginSchema,
  adminLoginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  eventCreationSchema,
  bulkUploadSchema,
  paymentInitiationSchema,
  validateExcelSchema,
  uploadBatchSchema
};
