/**
 * Application-wide constants
 */

module.exports = {
  // User Roles
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    SCHOOL: 'school'
  },

  // Event Status
  EVENT_STATUS: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    CLOSED: 'closed',
    ARCHIVED: 'archived'
  },

  // Event Types
  EVENT_TYPES: {
    EXAM: 'exam',
    OLYMPIAD: 'olympiad',
    CHAMPIONSHIP: 'championship',
    COMPETITION: 'competition',
    WORKSHOP: 'workshop',
    SUBMISSION_ONLY: 'submission_only',
    OTHER: 'other'
  },

  // Grade Levels (controlled enum)
  GRADE_LEVELS: ['below_1', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],

  // Batch Status
  BATCH_STATUS: {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled'
  },

  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    PENDING_VERIFICATION: 'pending_verification'
  },

  // Payment Modes
  PAYMENT_MODES: {
    ONLINE: 'ONLINE',
    OFFLINE: 'OFFLINE'
  },

  // Payment Gateways
  PAYMENT_GATEWAYS: {
    RAZORPAY: 'razorpay',
    STRIPE: 'stripe',
    BANK_TRANSFER: 'bank_transfer'
  },

  // Currencies
  CURRENCIES: {
    INR: 'INR',
    USD: 'USD'
  },

  // Registration Status
  REGISTRATION_STATUS: {
    REGISTERED: 'registered',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    ATTENDED: 'attended'
  },

  // Form Field Types
  FIELD_TYPES: {
    TEXT: 'text',
    NUMBER: 'number',
    EMAIL: 'email',
    DATE: 'date',
    SELECT: 'select',
    TEXTAREA: 'textarea',
    CHECKBOX: 'checkbox',
    FILE: 'file',
    URL: 'url'
  },

  // File Types
  FILE_TYPES: {
    CSV: 'csv',
    IMAGE: 'image',
    PDF: 'pdf'
  },

  // Allowed File Extensions
  ALLOWED_FILE_EXTENSIONS: {
    csv: ['.csv'],
    excel: ['.xlsx', '.xls'],
    spreadsheet: ['.csv', '.xlsx', '.xls'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    pdf: ['.pdf']
  },

  // Allowed MIME Types
  ALLOWED_MIME_TYPES: {
    csv: [
      'text/csv',
      'text/plain',
      'application/csv',
      'application/vnd.ms-excel' // Some systems send CSV as this
    ],
    excel: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ],
    spreadsheet: [
      'text/csv',
      'text/plain',
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    image: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
    pdf: ['application/pdf']
  },

  // File Size Limits (in bytes)
  FILE_SIZE_LIMITS: {
    csv: 20 * 1024 * 1024, // 20MB
    excel: 20 * 1024 * 1024, // 20MB
    spreadsheet: 20 * 1024 * 1024, // 20MB
    image: 20 * 1024 * 1024,  // 20MB
    pdf: 20 * 1024 * 1024     // 20MB
  },

  // Cloudinary Folders
  CLOUDINARY_FOLDERS: {
    CSV: 'gema/csv',
    RECEIPTS: 'gema/receipts',
    INVOICES: 'gema/invoices',
    BANNERS: 'gema/banners',
    CERTIFICATES: 'gema/certificates'
  },

  // Email Templates
  EMAIL_TEMPLATES: {
    WELCOME: 'welcome',
    VERIFICATION: 'verification',
    PASSWORD_RESET: 'password_reset',
    PAYMENT_CONFIRMATION: 'payment_confirmation',
    PAYMENT_RECEIVED: 'payment_received',
    PAYMENT_APPROVED: 'payment_approved',
    EVENT_REMINDER: 'event_reminder'
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },

  // Validation Rules
  VALIDATION: {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    SCHOOL_CODE_LENGTH: 6,
    PHONE_MIN_LENGTH: 10,
    PHONE_MAX_LENGTH: 15
  },

  // Default Discount Rules (can be overridden per event)
  DEFAULT_DISCOUNT_RULES: [
    { min_students: 50, discount_percentage: 10 },
    { min_students: 100, discount_percentage: 15 },
    { min_students: 200, discount_percentage: 20 }
  ],

  // Country-Currency Mapping (default mappings)
  COUNTRY_CURRENCY_MAP: {
    'India': 'INR',
    // All others default to USD
  },

  // Alias for backward compatibility
  get PAYMENT_MODE() {
    return this.PAYMENT_MODES;
  }
};
