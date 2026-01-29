import * as yup from 'yup';
import { VALIDATION_PATTERNS } from './constants';

/**
 * Validation Schemas using Yup
 * Reusable validation schemas for forms
 */

// ===================================
// COMMON FIELD VALIDATORS
// ===================================

export const emailValidator = yup
  .string()
  .email('Invalid email address')
  .matches(VALIDATION_PATTERNS.EMAIL, 'Invalid email format')
  .required('Email is required');

export const passwordValidator = yup
  .string()
  .min(8, 'Password must be at least 8 characters')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  )
  .required('Password is required');

export const phoneValidator = yup
  .string()
  .matches(VALIDATION_PATTERNS.PHONE, 'Invalid phone number')
  .required('Phone number is required');

export const urlValidator = yup
  .string()
  .matches(VALIDATION_PATTERNS.URL, 'Invalid URL format')
  .required('URL is required');

export const schoolCodeValidator = yup
  .string()
  .matches(VALIDATION_PATTERNS.SCHOOL_CODE, 'School code must be 6 alphanumeric characters')
  .required('School code is required');

export const postalCodeValidator = yup
  .string()
  .matches(VALIDATION_PATTERNS.POSTAL_CODE, 'Invalid postal code')
  .required('Postal code is required');

// ===================================
// AUTHENTICATION SCHEMAS
// ===================================

// School Login Schema
export const schoolLoginSchema = yup.object({
  email: emailValidator,
  password: yup.string().required('Password is required'),
  remember: yup.boolean(),
});

// School Registration Schema
export const schoolRegisterSchema = yup.object({
  name: yup.string().min(3, 'School name must be at least 3 characters').required('School name is required'),
  country: yup.string().required('Country is required'),
  contact_person_name: yup.string().required('Contact person name is required'),
  email: emailValidator,
  phone: phoneValidator,
  password: passwordValidator,
  confirm_password: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  address: yup.string().required('Street address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  postal_code: postalCodeValidator,
});

// Admin Login Schema
export const adminLoginSchema = yup.object({
  email: emailValidator,
  password: yup.string().required('Password is required'),
});

// Forgot Password Schema
export const forgotPasswordSchema = yup.object({
  email: emailValidator,
});

// Reset Password Schema
export const resetPasswordSchema = yup.object({
  password: passwordValidator,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

// Change Password Schema
export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: passwordValidator,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

// ===================================
// PROFILE SCHEMAS
// ===================================

// Update School Profile Schema
export const updateSchoolProfileSchema = yup.object({
  name: yup.string().min(3, 'School name must be at least 3 characters').required('School name is required'),
  contact_person: yup.object({
    name: yup.string().required('Contact person name is required'),
    designation: yup.string().required('Designation is required'),
    email: emailValidator,
    phone: phoneValidator,
  }),
  address: yup.object({
    street: yup.string().required('Street address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    postal_code: postalCodeValidator,
    country: yup.string().required('Country is required'),
  }),
});

// Update Admin Profile Schema
export const updateAdminProfileSchema = yup.object({
  name: yup.string().min(3, 'Name must be at least 3 characters').required('Name is required'),
  email: emailValidator,
});

// ===================================
// EVENT SCHEMAS
// ===================================

// Create Event Schema (Basic Info Step)
export const createEventBasicSchema = yup.object({
  event_name: yup.string().min(3, 'Event name must be at least 3 characters').required('Event name is required'),
  description: yup.string().min(10, 'Description must be at least 10 characters').required('Description is required'),
  event_type: yup.string().required('Event type is required'),
  date: yup.date().min(new Date(), 'Event date must be in the future').required('Event date is required'),
  time: yup.string().required('Event time is required'),
  venue: yup.string().required('Venue is required'),
  total_capacity: yup.number().min(1, 'Capacity must be at least 1').required('Total capacity is required'),
});

// Create Event Registration Schema
export const createEventRegistrationSchema = yup.object({
  registration_start: yup.date().required('Registration start date is required'),
  registration_end: yup
    .date()
    .min(yup.ref('registration_start'), 'Registration end date must be after start date')
    .required('Registration end date is required'),
  base_fee_inr: yup.number().min(0, 'Fee must be positive').required('INR fee is required'),
  base_fee_usd: yup.number().min(0, 'Fee must be positive').required('USD fee is required'),
  bulk_discount_rules: yup.array().of(
    yup.object({
      min_students: yup.number().min(1, 'Minimum students must be at least 1').required('Minimum students is required'),
      max_students: yup.number().when('min_students', (minStudents, schema) => {
        return schema.min(minStudents, 'Max must be greater than or equal to min');
      }),
      discount_percentage: yup.number().min(0).max(100, 'Discount must be between 0 and 100'),
    })
  ),
});

// ===================================
// PAYMENT SCHEMAS
// ===================================

// Offline Payment Schema
export const offlinePaymentSchema = yup.object({
  transaction_reference: yup.string().required('Transaction reference is required'),
  bank_name: yup.string(),
  payment_date: yup.date().max(new Date(), 'Payment date cannot be in the future').required('Payment date is required'),
  notes: yup.string(),
});

// ===================================
// ADMIN SCHEMAS
// ===================================

// Create Admin Schema
export const createAdminSchema = yup.object({
  name: yup.string().min(3, 'Name must be at least 3 characters').required('Name is required'),
  email: emailValidator,
  password: passwordValidator,
  role: yup.string().oneOf(['admin', 'moderator'], 'Invalid role').required('Role is required'),
  permissions: yup.array().of(yup.string()),
});

// Approve/Reject School Schema
export const schoolApprovalSchema = yup.object({
  status: yup.string().oneOf(['approved', 'rejected'], 'Invalid status').required('Status is required'),
  reason: yup.string().when('status', {
    is: 'rejected',
    then: (schema) => schema.required('Reason is required for rejection'),
    otherwise: (schema) => schema,
  }),
});

// Verify/Reject Payment Schema
export const paymentVerificationSchema = yup.object({
  status: yup.string().oneOf(['verified', 'rejected'], 'Invalid status').required('Status is required'),
  admin_notes: yup.string().when('status', {
    is: 'rejected',
    then: (schema) => schema.required('Notes are required for rejection'),
    otherwise: (schema) => schema,
  }),
});

// ===================================
// BATCH UPLOAD SCHEMAS
// ===================================

// Validate Excel Upload
export const batchUploadSchema = yup.object({
  eventSlug: yup.string().required('Event selection is required'),
  file: yup
    .mixed()
    .required('Excel file is required')
    .test('fileType', 'Only Excel files (.xlsx, .xls) are allowed', (value) => {
      if (!value) return false;
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      return allowedTypes.includes(value.type);
    })
    .test('fileSize', 'File size must be less than 20MB', (value) => {
      if (!value) return false;
      return value.size <= 20 * 1024 * 1024;
    }),
});

// ===================================
// HELPER FUNCTIONS
// ===================================

/**
 * Get validation error message
 * @param {Object} errors - Yup validation errors
 * @param {string} fieldName - Field name
 * @returns {string} - Error message
 */
export function getValidationError(errors, fieldName) {
  return errors?.[fieldName]?.message || '';
}

/**
 * Check if field has error
 * @param {Object} errors - Yup validation errors
 * @param {string} fieldName - Field name
 * @returns {boolean} - Whether field has error
 */
export function hasValidationError(errors, fieldName) {
  return Boolean(errors?.[fieldName]);
}

/**
 * Validate single field
 * @param {yup.Schema} schema - Yup schema
 * @param {string} fieldName - Field name
 * @param {any} value - Field value
 * @returns {Promise<{valid: boolean, error: string}>}
 */
export async function validateField(schema, fieldName, value) {
  try {
    await schema.validateAt(fieldName, { [fieldName]: value });
    return { valid: true, error: '' };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

export default {
  // Common validators
  emailValidator,
  passwordValidator,
  phoneValidator,
  urlValidator,
  schoolCodeValidator,
  postalCodeValidator,

  // Auth schemas
  schoolLoginSchema,
  schoolRegisterSchema,
  adminLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,

  // Profile schemas
  updateSchoolProfileSchema,
  updateAdminProfileSchema,

  // Event schemas
  createEventBasicSchema,
  createEventRegistrationSchema,

  // Payment schemas
  offlinePaymentSchema,

  // Admin schemas
  createAdminSchema,
  schoolApprovalSchema,
  paymentVerificationSchema,

  // Batch schemas
  batchUploadSchema,

  // Helper functions
  getValidationError,
  hasValidationError,
  validateField,
};
