/**
 * Frontend Constants
 * Matches backend constants for consistency
 */

// ===================================
// USER ROLES
// ===================================
export const ROLES = {
  SCHOOL: 'school',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  MODERATOR: 'moderator',
};

// ===================================
// EVENT STATUS
// ===================================
export const EVENT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
};

// ===================================
// BATCH STATUS
// ===================================
export const BATCH_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

// ===================================
// PAYMENT STATUS
// ===================================
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PENDING_VERIFICATION: 'pending_verification',
};

// ===================================
// PAYMENT MODE
// ===================================
export const PAYMENT_MODE = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
};

// ===================================
// PAYMENT GATEWAYS
// ===================================
export const PAYMENT_GATEWAY = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe',
  BANK_TRANSFER: 'bank_transfer',
};

// ===================================
// COUNTRIES
// ===================================
export const COUNTRIES = {
  IN: { code: 'IN', name: 'India', currency: 'INR' },
  US: { code: 'US', name: 'United States', currency: 'USD' },
  GB: { code: 'GB', name: 'United Kingdom', currency: 'USD' },
  CA: { code: 'CA', name: 'Canada', currency: 'USD' },
  AU: { code: 'AU', name: 'Australia', currency: 'USD' },
  SG: { code: 'SG', name: 'Singapore', currency: 'USD' },
  MY: { code: 'MY', name: 'Malaysia', currency: 'USD' },
  TH: { code: 'TH', name: 'Thailand', currency: 'USD' },
  ID: { code: 'ID', name: 'Indonesia', currency: 'USD' },
  PH: { code: 'PH', name: 'Philippines', currency: 'USD' },
  VN: { code: 'VN', name: 'Vietnam', currency: 'USD' },
  BD: { code: 'BD', name: 'Bangladesh', currency: 'USD' },
  LK: { code: 'LK', name: 'Sri Lanka', currency: 'USD' },
  NP: { code: 'NP', name: 'Nepal', currency: 'USD' },
  PK: { code: 'PK', name: 'Pakistan', currency: 'USD' },
  AE: { code: 'AE', name: 'United Arab Emirates', currency: 'USD' },
  SA: { code: 'SA', name: 'Saudi Arabia', currency: 'USD' },
  QA: { code: 'QA', name: 'Qatar', currency: 'USD' },
  KW: { code: 'KW', name: 'Kuwait', currency: 'USD' },
  OM: { code: 'OM', name: 'Oman', currency: 'USD' },
  BH: { code: 'BH', name: 'Bahrain', currency: 'USD' },
};

// ===================================
// CURRENCIES
// ===================================
export const CURRENCIES = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
  },
};

export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
};

// ===================================
// SCHOOL STATUS
// ===================================
export const SCHOOL_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
};

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// ===================================
// FORM FIELD TYPES
// ===================================
export const FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  EMAIL: 'email',
  DATE: 'date',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  CHECKBOX: 'checkbox',
  FILE: 'file',
  URL: 'url',
};

// ===================================
// FILE TYPES
// ===================================
export const ALLOWED_FILE_TYPES = {
  CSV: [
    'text/csv',
    'text/plain',
    'application/csv',
  ],
  IMAGE: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
  PDF: ['application/pdf'],
};

export const FILE_EXTENSIONS = {
  CSV: ['.csv'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  PDF: ['.pdf'],
};

// ===================================
// FILE SIZE LIMITS (in bytes)
// ===================================
export const FILE_SIZE_LIMITS = {
  CSV: 5 * 1024 * 1024, // 5MB
  IMAGE: 10 * 1024 * 1024, // 10MB
  PDF: 5 * 1024 * 1024, // 5MB
};

// ===================================
// PAGINATION
// ===================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// ===================================
// STATUS COLORS (Tailwind classes)
// ===================================
export const STATUS_COLORS = {
  // Event Status
  [EVENT_STATUS.DRAFT]: 'text-gray-600 bg-gray-100',
  [EVENT_STATUS.ACTIVE]: 'text-green-600 bg-green-100',
  [EVENT_STATUS.CLOSED]: 'text-red-600 bg-red-100',
  [EVENT_STATUS.ARCHIVED]: 'text-gray-600 bg-gray-100',

  // Batch Status
  [BATCH_STATUS.DRAFT]: 'text-gray-600 bg-gray-100',
  [BATCH_STATUS.SUBMITTED]: 'text-blue-600 bg-blue-100',
  [BATCH_STATUS.CONFIRMED]: 'text-green-600 bg-green-100',
  [BATCH_STATUS.CANCELLED]: 'text-red-600 bg-red-100',

  // Payment Status
  [PAYMENT_STATUS.PENDING]: 'text-yellow-600 bg-yellow-100',
  [PAYMENT_STATUS.PROCESSING]: 'text-blue-600 bg-blue-100',
  [PAYMENT_STATUS.COMPLETED]: 'text-green-600 bg-green-100',
  [PAYMENT_STATUS.FAILED]: 'text-red-600 bg-red-100',
  [PAYMENT_STATUS.REFUNDED]: 'text-orange-600 bg-orange-100',
  [PAYMENT_STATUS.PENDING_VERIFICATION]: 'text-yellow-600 bg-yellow-100',

  // School Status
  [SCHOOL_STATUS.ACTIVE]: 'text-green-600 bg-green-100',
  [SCHOOL_STATUS.SUSPENDED]: 'text-red-600 bg-red-100',
  [SCHOOL_STATUS.INACTIVE]: 'text-gray-600 bg-gray-100',

  // Approval Status
  [APPROVAL_STATUS.PENDING]: 'text-yellow-600 bg-yellow-100',
  [APPROVAL_STATUS.APPROVED]: 'text-green-600 bg-green-100',
  [APPROVAL_STATUS.REJECTED]: 'text-red-600 bg-red-100',
};

// ===================================
// STATUS VARIANTS (for Badge component)
// ===================================
export const STATUS_VARIANTS = {
  // Event Status
  [EVENT_STATUS.DRAFT]: 'info',
  [EVENT_STATUS.ACTIVE]: 'success',
  [EVENT_STATUS.CLOSED]: 'error',
  [EVENT_STATUS.ARCHIVED]: 'info',

  // Batch Status
  [BATCH_STATUS.DRAFT]: 'info',
  [BATCH_STATUS.SUBMITTED]: 'warning',
  [BATCH_STATUS.CONFIRMED]: 'success',
  [BATCH_STATUS.CANCELLED]: 'error',

  // Payment Status
  [PAYMENT_STATUS.PENDING]: 'warning',
  [PAYMENT_STATUS.PROCESSING]: 'info',
  [PAYMENT_STATUS.COMPLETED]: 'success',
  [PAYMENT_STATUS.FAILED]: 'error',
  [PAYMENT_STATUS.REFUNDED]: 'warning', // Orange is usually warning/info
  [PAYMENT_STATUS.PENDING_VERIFICATION]: 'warning',

  // School Status
  [SCHOOL_STATUS.ACTIVE]: 'success',
  [SCHOOL_STATUS.SUSPENDED]: 'error',
  [SCHOOL_STATUS.INACTIVE]: 'info',

  // Approval Status
  [APPROVAL_STATUS.PENDING]: 'warning',
  [APPROVAL_STATUS.APPROVED]: 'success',
  [APPROVAL_STATUS.REJECTED]: 'error',
};

// ===================================
// BADGE CLASSES (from global.css)
// ===================================
export const BADGE_CLASSES = {
  SUCCESS: 'badge-success',
  WARNING: 'badge-warning',
  ERROR: 'badge-error',
  INFO: 'badge-info',
};

// ===================================
// DATE FORMATS
// ===================================
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy', // Jan 15, 2024
  DISPLAY_LONG: 'MMMM dd, yyyy', // January 15, 2024
  DISPLAY_WITH_TIME: 'MMM dd, yyyy hh:mm a', // Jan 15, 2024 02:30 PM
  INPUT: 'yyyy-MM-dd', // 2024-01-15 (for date inputs)
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", // ISO 8601
};

// ===================================
// VALIDATION PATTERNS
// ===================================
export const VALIDATION_PATTERNS = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE: /^[+]?[0-9]{10,15}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  SCHOOL_CODE: /^[A-Z0-9]{6}$/,
  POSTAL_CODE: /^[0-9]{5,10}$/,
};

// ===================================
// LOCAL STORAGE KEYS
// ===================================
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  AUTH_STORAGE: 'auth-storage',
};

// ===================================
// API RESPONSE CODES
// ===================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
};

// ===================================
// COUNTRY-CURRENCY MAPPING (Common)
// ===================================
export const COUNTRY_CURRENCY_MAP = {
  IN: CURRENCIES.INR,
  US: CURRENCIES.USD,
  // Add more as needed
};

// ===================================
// EXPORT ALL
// ===================================
export default {
  ROLES,
  EVENT_STATUS,
  BATCH_STATUS,
  PAYMENT_STATUS,
  PAYMENT_MODE,
  PAYMENT_GATEWAY,
  CURRENCIES,
  CURRENCY_SYMBOLS,
  SCHOOL_STATUS,
  APPROVAL_STATUS,
  FIELD_TYPES,
  ALLOWED_FILE_TYPES,
  FILE_EXTENSIONS,
  FILE_SIZE_LIMITS,
  PAGINATION,
  STATUS_COLORS,
  STATUS_VARIANTS,
  BADGE_CLASSES,
  DATE_FORMATS,
  VALIDATION_PATTERNS,
  STORAGE_KEYS,
  HTTP_STATUS,
  COUNTRY_CURRENCY_MAP,
};
