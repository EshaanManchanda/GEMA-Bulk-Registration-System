/**
 * API Endpoints
 * Centralized API endpoint constants for the GEMA application
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const ENDPOINTS = {
  // ===================================
  // AUTHENTICATION ENDPOINTS
  // ===================================
  AUTH: {
    // School Authentication
    SCHOOL_REGISTER: `${API_BASE}/auth/school/register`,
    SCHOOL_LOGIN: `${API_BASE}/auth/school/login`,
    SCHOOL_ME: `${API_BASE}/auth/school/me`,
    SCHOOL_UPDATE_PROFILE: `${API_BASE}/auth/school/profile`,
    SCHOOL_CHANGE_PASSWORD: `${API_BASE}/auth/school/change-password`,
    SCHOOL_FORGOT_PASSWORD: `${API_BASE}/auth/school/forgot-password`,
    SCHOOL_RESET_PASSWORD: `${API_BASE}/auth/school/reset-password`,
    SCHOOL_VERIFY_EMAIL: `${API_BASE}/auth/school/verify-email`,
    SCHOOL_SEND_OTP: `${API_BASE}/auth/school/send-otp`,
    SCHOOL_VERIFY_OTP: `${API_BASE}/auth/school/verify-otp`,
    SCHOOL_RESEND_VERIFICATION: `${API_BASE}/auth/school/resend-verification`,
    SCHOOL_REFRESH_TOKEN: `${API_BASE}/auth/school/refresh-token`,

    // Admin Authentication
    ADMIN_LOGIN: `${API_BASE}/auth/admin/login`,
    ADMIN_ME: `${API_BASE}/auth/admin/me`,
    ADMIN_UPDATE_PROFILE: `${API_BASE}/auth/admin/profile`,
    ADMIN_CHANGE_PASSWORD: `${API_BASE}/auth/admin/change-password`,
    ADMIN_FORGOT_PASSWORD: `${API_BASE}/auth/admin/forgot-password`,
    ADMIN_RESET_PASSWORD: `${API_BASE}/auth/admin/reset-password`,
    ADMIN_CREATE: `${API_BASE}/auth/admin/create`,
    ADMIN_REFRESH_TOKEN: `${API_BASE}/auth/admin/refresh-token`,
    ADMIN_LOGOUT: `${API_BASE}/auth/admin/logout`,
  },

  // ===================================
  // BATCH/BULK REGISTRATION ENDPOINTS
  // ===================================
  BATCHES: {
    // Template & Validation
    DOWNLOAD_TEMPLATE: (eventSlug) => `${API_BASE}/batches/template/${eventSlug}`,
    VALIDATE_EXCEL: `${API_BASE}/batches/validate`,
    UPLOAD_BATCH: `${API_BASE}/batches/upload`,

    // School Batches
    MY_BATCHES: `${API_BASE}/batches/school/my-batches`,
    MY_STATISTICS: `${API_BASE}/batches/school/statistics`,
    BATCH_DETAILS: (batchReference) => `${API_BASE}/batches/${batchReference}`,
    DELETE_BATCH: (batchReference) => `${API_BASE}/batches/${batchReference}`,
    DOWNLOAD_EXCEL: (batchReference) => `${API_BASE}/batches/${batchReference}/download`,
  },

  // ===================================
  // PAYMENT ENDPOINTS
  // ===================================
  PAYMENTS: {
    // Online Payments
    INITIATE_PAYMENT: `${API_BASE}/payments/initiate`,
    VERIFY_STRIPE: `${API_BASE}/payments/verify/stripe`,

    // Offline Payments
    SUBMIT_OFFLINE: `${API_BASE}/payments/offline`,

    // Payment History
    MY_PAYMENTS: `${API_BASE}/payments/school/my-payments`,
    PAYMENT_DETAILS: (paymentId) => `${API_BASE}/payments/${paymentId}`,
    DOWNLOAD_RECEIPT: (paymentId) => `${API_BASE}/payments/${paymentId}/receipt`,
  },

  // ===================================
  // INVOICE ENDPOINTS
  // ===================================
  INVOICES: {
    // School Invoices
    MY_INVOICES: `${API_BASE}/invoices/school/my-invoices`,
    DETAILS: (invoiceId) => `${API_BASE}/invoices/${invoiceId}`,
    DOWNLOAD: (batchReference) => `${API_BASE}/invoices/download/${batchReference}`,
    STATISTICS: `${API_BASE}/invoices/school/statistics`,

    // Invoice Generation
    GENERATE: (paymentId) => `${API_BASE}/invoices/generate/${paymentId}`,
    GET_URL: (batchReference) => `${API_BASE}/invoices/url/${batchReference}`,
    REGENERATE: (invoiceId) => `${API_BASE}/invoices/${invoiceId}/regenerate`,
    BULK_GENERATE: `${API_BASE}/invoices/bulk-generate`,

    // Admin Invoices
    ALL: `${API_BASE}/admin/invoices`,
    UPDATE_STATUS: (invoiceId) => `${API_BASE}/admin/invoices/${invoiceId}/status`,
  },

  // ===================================
  // ADMIN DASHBOARD ENDPOINTS
  // ===================================
  ADMIN: {
    // Dashboard
    DASHBOARD_STATS: `${API_BASE}/admin/dashboard/stats`,
    DASHBOARD_ACTIVITIES: `${API_BASE}/admin/dashboard/activities`,
    DASHBOARD_REVENUE: `${API_BASE}/admin/dashboard/revenue`,

    // School Management
    SCHOOLS_LIST: `${API_BASE}/admin/schools`,
    CREATE_SCHOOL: `${API_BASE}/admin/schools`,
    SCHOOL_DETAILS: (schoolId) => `${API_BASE}/admin/schools/${schoolId}`,
    APPROVE_SCHOOL: (schoolId) => `${API_BASE}/admin/schools/${schoolId}/approve`,
    REJECT_SCHOOL: (schoolId) => `${API_BASE}/admin/schools/${schoolId}/reject`,
    SUSPEND_SCHOOL: (schoolId) => `${API_BASE}/admin/schools/${schoolId}/suspend`,
    ACTIVATE_SCHOOL: (schoolId) => `${API_BASE}/admin/schools/${schoolId}/activate`,
    UPDATE_SCHOOL: (schoolId) => `${API_BASE}/admin/schools/${schoolId}`,
    SCHOOL_REGISTRATIONS: (schoolId) => `${API_BASE}/admin/schools/${schoolId}/registrations`,
    SCHOOL_PAYMENTS: (schoolId) => `${API_BASE}/admin/schools/${schoolId}/payments`,

    // Event Management
    EVENTS_LIST: `${API_BASE}/admin/events`,
    CREATE_EVENT: `${API_BASE}/admin/events`,
    EVENT_DETAILS: (eventId) => `${API_BASE}/admin/events/${eventId}`,
    UPDATE_EVENT: (eventId) => `${API_BASE}/admin/events/${eventId}`,
    DELETE_EVENT: (eventId) => `${API_BASE}/admin/events/${eventId}`,
    TOGGLE_EVENT_STATUS: (eventId) => `${API_BASE}/admin/events/${eventId}/toggle-status`,
    EVENT_BATCHES: (eventId) => `${API_BASE}/admin/events/${eventId}/batches`,
    EVENT_REGISTRATIONS: (eventId) => `${API_BASE}/admin/events/${eventId}/registrations`,
    EVENT_ANALYTICS: (eventId) => `${API_BASE}/admin/events/${eventId}/analytics`,
    EXPORT_EVENT_DATA: (eventId) => `${API_BASE}/admin/events/${eventId}/export`,

    // Payment Management
    PAYMENTS_LIST: `${API_BASE}/admin/payments`,
    PENDING_OFFLINE_PAYMENTS: `${API_BASE}/admin/payments/pending-offline`,
    PAYMENTS_ANALYTICS: `${API_BASE}/admin/payments/analytics`,
    PAYMENT_DETAILS: (paymentId) => `${API_BASE}/admin/payments/${paymentId}`,
    VERIFY_PAYMENT: (paymentId) => `${API_BASE}/admin/payments/${paymentId}/verify`,
    REJECT_PAYMENT: (paymentId) => `${API_BASE}/admin/payments/${paymentId}/reject`,

    // Analytics
    GLOBAL_ANALYTICS: `${API_BASE}/admin/analytics`,
    EXPORT_EVENT_REGISTRATIONS: (eventId) => `${API_BASE}/admin/events/${eventId}/export`,

    // Settings
    SETTINGS: `${API_BASE}/admin/settings`,
    ADMIN_USERS: `${API_BASE}/admin/users`,
    UPDATE_ADMIN_USER: (userId) => `${API_BASE}/admin/users/${userId}`,
    DELETE_ADMIN_USER: (userId) => `${API_BASE}/admin/users/${userId}`,

    // Media Library
    MEDIA_UPLOAD: `${API_BASE}/admin/media/upload`,
    MEDIA_LIST: `${API_BASE}/admin/media`,
    MEDIA_DETAILS: (mediaId) => `${API_BASE}/admin/media/${mediaId}`,
    MEDIA_UPDATE: (mediaId) => `${API_BASE}/admin/media/${mediaId}`,
    MEDIA_DELETE: (mediaId) => `${API_BASE}/admin/media/${mediaId}`,
    MEDIA_BULK_DELETE: `${API_BASE}/admin/media/bulk-delete`,
    BATCH_DETAILS: (batchReference) => `${API_BASE}/admin/batches/${batchReference}`,
    VERIFY_BATCH_PAYMENT: (batchReference) => `${API_BASE}/admin/batches/${batchReference}/verify`,
    REJECT_BATCH_PAYMENT: (batchReference) => `${API_BASE}/admin/batches/${batchReference}/reject`,
    DOWNLOAD_BATCH_DATA: (batchReference) => `${API_BASE}/admin/batches/${batchReference}/export`,

    // Registration Management
    REGISTRATION_DETAILS: (registrationId) => `${API_BASE}/admin/registrations/${registrationId}`,
  },

  // ===================================
  // FORM BUILDER ENDPOINTS
  // ===================================
  FORM_BUILDER: {
    GET_EVENT_SCHEMA_PUBLIC: (eventSlug) => `${API_BASE}/form-builder/events/slug/${eventSlug}/schema`,
    GET_DEFAULT_TEMPLATE: `${API_BASE}/form-builder/templates/default`,
    UPDATE_EVENT_SCHEMA: (eventId) => `${API_BASE}/form-builder/events/${eventId}/schema`,
    GET_EVENT_SCHEMA: (eventId) => `${API_BASE}/form-builder/events/${eventId}/schema`,
    VALIDATE_FORM: `${API_BASE}/form-builder/validate`,
  },

  // ===================================
  // PUBLIC ENDPOINTS (Events)
  // ===================================
  EVENTS: {
    LIST: `${API_BASE}/events`,
    DETAIL: (eventId) => `${API_BASE}/events/${eventId}`,
    BY_SLUG: (eventSlug) => `${API_BASE}/events/slug/${eventSlug}`,
  },

  // ===================================
  // CERTIFICATE ENDPOINTS
  // ===================================
  CERTIFICATES: {
    // Admin endpoints
    TEST_CONFIG: (eventId) => `${API_BASE}/admin/events/${eventId}/certificates/test`,
    GENERATE_EVENT: (eventId) => `${API_BASE}/admin/events/${eventId}/generate-certificates`,
    GENERATE_BATCH: (batchId) => `${API_BASE}/admin/batches/${batchId}/generate-certificates`,
    BATCH_CERTIFICATES: (batchId) => `${API_BASE}/admin/batches/${batchId}/certificates`,

    // School endpoints (via registrations with certificate_url)
    MY_CERTIFICATES: `${API_BASE}/registrations/school/results`,

    // Public verification
    VERIFY: (certificateId) => `${API_BASE}/certificates/${certificateId}/verify`,
  },

  // ===================================
  // RESULT MANAGEMENT ENDPOINTS
  // ===================================
  RESULTS: {
    // Admin endpoints
    UPLOAD: (eventId) => `${API_BASE}/admin/events/${eventId}/results/upload`,
    DOWNLOAD_TEMPLATE: (eventId) => `${API_BASE}/admin/events/${eventId}/results/template`,
    EVENT_RESULTS: (eventId) => `${API_BASE}/admin/events/${eventId}/results`,
    BATCH_RESULTS: (batchRef) => `${API_BASE}/admin/batches/${batchRef}/results`,
    UPDATE_SINGLE: (regId) => `${API_BASE}/admin/registrations/${regId}/result`,
    CLEAR_EVENT: (eventId) => `${API_BASE}/admin/events/${eventId}/results`,

    // School endpoints
    MY_RESULTS: `${API_BASE}/registrations/school/results`,
    MY_EVENT_RESULTS: (eventId) => `${API_BASE}/registrations/school/events/${eventId}/results`,

    // Public endpoint
    PUBLIC_LOOKUP: (regId) => `${API_BASE}/registrations/${regId}/result`,
  },

  // ===================================
  // WEBHOOK ENDPOINTS
  // ===================================
  WEBHOOKS: {
    STRIPE: `${API_BASE}/webhooks/stripe`,
  },

  // ===================================
  // HEALTH CHECK
  // ===================================
  HEALTH: '/health',
};

// Helper functions for dynamic endpoints
export const buildEndpoint = (template, ...params) => {
  if (typeof template === 'function') {
    return template(...params);
  }
  return template;
};

// Query parameter builders
export const buildQueryString = (params) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, v));
      } else {
        query.append(key, value);
      }
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

export default ENDPOINTS;
