import { format, formatDistance, formatRelative, isValid, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  CURRENCY_SYMBOLS,
  STATUS_COLORS,
  BADGE_CLASSES,
  DATE_FORMATS,
  PAYMENT_STATUS,
  BATCH_STATUS,
  EVENT_STATUS
} from './constants';

/**
 * Tailwind CSS class name merger
 * Combines clsx and tailwind-merge for proper class merging
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency with symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (INR, USD)
 * @param {boolean} showSymbol - Whether to show currency symbol
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount, currency = 'INR', showSymbol = true) {
  if (amount == null || isNaN(amount)) return '0.00';

  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const formattedAmount = Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return showSymbol ? `${symbol}${formattedAmount}` : formattedAmount;
}

/**
 * Format date using date-fns
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Format string (from DATE_FORMATS or custom)
 * @returns {string} - Formatted date string
 */
export function formatDate(date, formatStr = DATE_FORMATS.DISPLAY) {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';

    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} - Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';

    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return '';
  }
}

/**
 * Format date as relative (e.g., "today at 2:30 PM")
 * @param {string|Date} date - Date to format
 * @returns {string} - Relative date string
 */
export function formatRelativeDate(date) {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';

    return formatRelative(dateObj, new Date());
  } catch (error) {
    console.error('Relative date formatting error:', error);
    return '';
  }
}

/**
 * Download file from URL
 * @param {string} url - File URL
 * @param {string} filename - Filename to save as
 */
export function downloadFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download blob as file
 * @param {Blob} blob - Blob data
 * @param {string} filename - Filename to save as
 */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  downloadFile(url, filename);
  window.URL.revokeObjectURL(url);
}

/**
 * Get status color class
 * @param {string} status - Status value
 * @returns {string} - Tailwind color classes
 */
export function getStatusColor(status) {
  return STATUS_COLORS[status] || 'text-gray-600 bg-gray-100';
}

/**
 * Get badge class for status
 * @param {string} status - Status value
 * @returns {string} - Badge class name
 */
export function getStatusBadgeClass(status) {
  // Map status to badge class
  if (status === PAYMENT_STATUS.COMPLETED || status === BATCH_STATUS.CONFIRMED || status === EVENT_STATUS.ACTIVE) {
    return BADGE_CLASSES.SUCCESS;
  }
  if (status === PAYMENT_STATUS.FAILED || status === BATCH_STATUS.CANCELLED || status === EVENT_STATUS.CLOSED) {
    return BADGE_CLASSES.ERROR;
  }
  if (status === PAYMENT_STATUS.PENDING || status === PAYMENT_STATUS.PENDING_VERIFICATION || status === BATCH_STATUS.SUBMITTED) {
    return BADGE_CLASSES.WARNING;
  }
  return BADGE_CLASSES.INFO;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert string to title case
 * @param {string} str - String to convert
 * @returns {string} - Title case string
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => capitalizeFirst(word))
    .join(' ');
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file type
 * @param {File} file - File object
 * @param {string[]} allowedTypes - Allowed MIME types
 * @returns {boolean} - Whether file type is valid
 */
export function isValidFileType(file, allowedTypes) {
  if (!file) return false;
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 * @param {File} file - File object
 * @param {number} maxSize - Maximum size in bytes
 * @returns {boolean} - Whether file size is valid
 */
export function isValidFileSize(file, maxSize) {
  if (!file) return false;
  return file.size <= maxSize;
}

/**
 * Generate initials from name
 * @param {string} name - Full name
 * @returns {string} - Initials (max 2 characters)
 */
export function getInitials(name) {
  if (!name) return '';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} - Whether object is empty
 */
export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Generate random ID
 * @returns {string} - Random ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number} - Percentage
 */
export function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted percentage
 */
export function formatPercentage(value, decimals = 0) {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after delay
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Whether copy was successful
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  return phone;
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - Whether email is valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
}

/**
 * Get error message from error object
 * @param {Error|Object} error - Error object
 * @param {string} defaultMessage - Default message if none found
 * @returns {string} - Error message
 */
export function getErrorMessage(error, defaultMessage = 'An error occurred') {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return defaultMessage;
}

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} - Grouped object
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * Sort array by key
 * @param {Array} array - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} - Sorted array
 */
export function sortBy(array, key, order = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Remove duplicates from array
 * @param {Array} array - Array to deduplicate
 * @param {string} key - Optional key for object arrays
 * @returns {Array} - Deduplicated array
 */
export function uniqueArray(array, key) {
  if (!key) {
    return [...new Set(array)];
  }

  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

export default {
  cn,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatRelativeDate,
  downloadFile,
  downloadBlob,
  getStatusColor,
  getStatusBadgeClass,
  truncateText,
  capitalizeFirst,
  toTitleCase,
  formatFileSize,
  isValidFileType,
  isValidFileSize,
  getInitials,
  debounce,
  throttle,
  deepClone,
  isEmpty,
  generateId,
  calculatePercentage,
  formatPercentage,
  sleep,
  copyToClipboard,
  formatPhoneNumber,
  isValidEmail,
  getErrorMessage,
  groupBy,
  sortBy,
  uniqueArray,
};
