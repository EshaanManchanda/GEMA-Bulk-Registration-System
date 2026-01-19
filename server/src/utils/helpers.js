const crypto = require('crypto');

/**
 * Generate a unique school code
 * Format: ABC123 (3 letters + 3 numbers)
 */
const generateSchoolCode = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';

  let code = '';

  // Generate 3 random letters
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Generate 3 random numbers
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return code;
};

/**
 * Generate a unique batch reference
 * Format: BATCH-timestamp-random
 */
const generateBatchReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `BATCH-${timestamp}-${random}`;
};

/**
 * Generate a unique registration ID
 * Format: REG-timestamp-random
 */
const generateRegistrationId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `REG-${timestamp}-${random}`;
};

/**
 * Generate a unique payment reference
 * Format: PAY-timestamp-random
 */
const generatePaymentReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PAY-${timestamp}-${random}`;
};

/**
 * Generate invoice number
 * Format: INV-{school_code}-{sequence}
 */
const generateInvoiceNumber = (schoolCode, sequence) => {
  const paddedSequence = String(sequence).padStart(4, '0');
  return `INV-${schoolCode}-${paddedSequence}`;
};

/**
 * Generate a slug from a title
 */
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generate a random token for email verification
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Calculate discount based on student count
 */
const calculateDiscount = (studentCount, discountRules) => {
  if (!discountRules || discountRules.length === 0) {
    return { percentage: 0, amount: 0 };
  }

  // Sort rules by min_students descending
  const sortedRules = discountRules.sort((a, b) => b.min_students - a.min_students);

  // Find applicable discount rule
  const applicableRule = sortedRules.find(rule => studentCount >= rule.min_students);

  if (!applicableRule) {
    return { percentage: 0, amount: 0 };
  }

  return {
    percentage: applicableRule.discount_percentage,
    min_students: applicableRule.min_students
  };
};

/**
 * Calculate total amount after discount
 */
const calculateTotalAmount = (baseFee, studentCount, discountRules) => {
  const baseAmount = baseFee * studentCount;
  const discount = calculateDiscount(studentCount, discountRules);
  const discountAmount = (baseAmount * discount.percentage) / 100;
  const totalAmount = baseAmount - discountAmount;

  return {
    baseAmount,
    discountPercentage: discount.percentage,
    discountAmount,
    totalAmount,
    studentsCount: studentCount
  };
};

/**
 * Format currency
 */
const formatCurrency = (amount, currency) => {
  const formatters = {
    INR: new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }),
    USD: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })
  };

  return formatters[currency].format(amount);
};

/**
 * Convert currency amount to smallest unit (paise for INR, cents for USD)
 */
const toSmallestUnit = (amount, currency) => {
  if (currency === 'INR' || currency === 'USD') {
    return Math.round(amount * 100);
  }
  return amount;
};

/**
 * Convert from smallest unit to main unit
 */
const fromSmallestUnit = (amount, currency) => {
  if (currency === 'INR' || currency === 'USD') {
    return amount / 100;
  }
  return amount;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Validate phone number (basic)
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{10,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Sanitize filename for file uploads
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
};

/**
 * Get file extension from filename
 */
const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
};

/**
 * Format date to DD/MM/YYYY
 */
const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Parse DD/MM/YYYY date string to Date object
 */
const parseDate = (dateString) => {
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Check if date is valid
 */
const isValidDate = (dateString) => {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getDate() === day &&
    date.getMonth() === month - 1 &&
    date.getFullYear() === year
  );
};

/**
 * Generate a random password
 */
const generateRandomPassword = (length = 12) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Async wrapper to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  generateSchoolCode,
  generateBatchReference,
  generateRegistrationId,
  generatePaymentReference,
  generateInvoiceNumber,
  generateSlug,
  generateVerificationToken,
  calculateDiscount,
  calculateTotalAmount,
  formatCurrency,
  toSmallestUnit,
  fromSmallestUnit,
  isValidEmail,
  isValidURL,
  isValidPhone,
  sanitizeFilename,
  getFileExtension,
  formatDate,
  parseDate,
  isValidDate,
  generateRandomPassword,
  asyncHandler
};
