const Papa = require('papaparse');
const logger = require('../utils/logger');

// Field types (matching existing constants)
const FIELD_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  NUMBER: 'number',
  EMAIL: 'email',
  DATE: 'date',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  URL: 'url',
  FILE: 'file'
};

/**
 * CSV Parser and Validation Service
 * Parses and validates CSV files for bulk registration
 */
class CsvParserService {
  /**
   * Parse and validate CSV file
   * @param {Buffer} fileBuffer - CSV file buffer
   * @param {Object} event - Event object with form_schema
   * @returns {Promise<Object>} - Validation result
   */
  async parseAndValidate(fileBuffer, event) {
    try {
      // Convert buffer to string
      const csvString = fileBuffer.toString('utf-8').replace(/^\ufeff/, ''); // Remove BOM if present

      // Parse CSV using PapaParse
      const parsed = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().replace(/\*$/, ''), // Remove asterisk from required fields
        dynamicTyping: false, // Keep all as strings for manual validation
        encoding: 'utf-8'
      });

      // Check for parsing errors
      if (parsed.errors && parsed.errors.length > 0) {
        const parsingErrors = parsed.errors.map(err => ({
          row: err.row || 0,
          field: 'CSV Parsing',
          message: err.message || 'Malformed CSV file'
        }));

        return {
          success: false,
          data: [],
          errors: parsingErrors,
          summary: {
            total: 0,
            valid: 0,
            invalid: parsingErrors.length
          }
        };
      }

      // Validate headers
      const headerErrors = this._validateHeaders(parsed.meta.fields, event.form_schema);
      if (headerErrors.length > 0) {
        return {
          success: false,
          data: [],
          errors: headerErrors,
          summary: {
            total: 0,
            valid: 0,
            invalid: headerErrors.length
          }
        };
      }

      // Parse and validate each row
      const validatedData = [];
      const errors = [];

      parsed.data.forEach((row, index) => {
        // Skipped sample row logic removed


        const rowNumber = index + 2; // +2 because: header is row 1, sample is row 2, data starts row 3
        const result = this._validateRow(row, event.form_schema, rowNumber);

        if (result.errors.length > 0) {
          errors.push(...result.errors);
        } else if (result.data) {
          validatedData.push(result.data);
        }
      });

      return {
        success: errors.length === 0,
        data: validatedData,
        errors: errors,
        summary: {
          total: parsed.data.length - 1, // Exclude sample row
          valid: validatedData.length,
          invalid: errors.length
        }
      };

    } catch (error) {
      logger.error('CSV parsing error:', error);
      return {
        success: false,
        data: [],
        errors: [{
          row: 0,
          field: 'File',
          message: `Failed to parse CSV file: ${error.message}`
        }],
        summary: {
          total: 0,
          valid: 0,
          invalid: 1
        }
      };
    }
  }

  /**
   * Validate CSV headers against form schema
   * @private
   */
  _validateHeaders(headers, formSchema) {
    const errors = [];

    // Required default headers
    const requiredHeaders = ['S.No', 'Student Name', 'Grade'];
    const normalizedHeaders = headers.map(h => h.toLowerCase());

    // Check for missing required headers
    requiredHeaders.forEach(required => {
      const found = normalizedHeaders.some(h =>
        h === required.toLowerCase() || h === required.toLowerCase().replace(/\*$/, '')
      );

      if (!found) {
        errors.push({
          row: 1,
          field: 'Headers',
          message: `Missing required column: ${required}`
        });
      }
    });

    // Check for dynamic headers from form_schema
    if (formSchema && formSchema.length > 0) {
      formSchema.forEach(field => {
        if (field.is_required) {
          const found = normalizedHeaders.some(h =>
            h === field.field_label.toLowerCase() || h === field.field_id.toLowerCase()
          );

          if (!found) {
            errors.push({
              row: 1,
              field: 'Headers',
              message: `Missing required column: ${field.field_label}`
            });
          }
        }
      });
    }

    return errors;
  }

  /**
   * Validate a single row
   * @private
   */
  _validateRow(row, formSchema, rowNumber) {
    const errors = [];

    // Get values (case-insensitive header matching)
    const studentName = this._getRowValue(row, ['Student Name', 'student name', 'Student Name*']);
    const grade = this._getRowValue(row, ['Grade', 'grade', 'Grade*']);
    const section = this._getRowValue(row, ['Section', 'section']);

    // Skip completely empty rows
    if (!studentName && !grade && !section) {
      return { data: null, errors: [] };
    }

    // Validate required fields
    if (!studentName || studentName.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'Student Name',
        message: 'Student Name is required'
      });
    } else if (studentName.length > 200) {
      errors.push({
        row: rowNumber,
        field: 'Student Name',
        message: 'Student Name cannot exceed 200 characters'
      });
    }

    if (!grade || grade.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'Grade',
        message: 'Grade is required'
      });
    }

    // Build dynamic data object
    const dynamicData = {};

    if (formSchema && formSchema.length > 0) {
      formSchema.forEach(field => {
        const value = this._getRowValue(row, [field.field_label, field.field_id, `${field.field_label}*`]);

        // Validate field
        const validation = this._validateField(field, value, rowNumber);

        if (validation.errors.length > 0) {
          errors.push(...validation.errors);
        } else if (validation.value !== null && validation.value !== undefined) {
          dynamicData[field.field_id] = validation.value;
        }
      });
    }

    // If validation failed, return errors
    if (errors.length > 0) {
      return { data: null, errors };
    }

    // Return validated data
    return {
      data: {
        student_name: studentName.trim(),
        grade: grade.trim(),
        section: section ? section.trim() : '',
        dynamic_data: dynamicData
      },
      errors: []
    };
  }

  /**
   * Get row value by multiple possible header names (case-insensitive)
   * @private
   */
  _getRowValue(row, possibleHeaders) {
    for (const header of possibleHeaders) {
      if (row[header] !== undefined && row[header] !== null) {
        return row[header];
      }
    }

    // Try case-insensitive match
    const rowKeys = Object.keys(row);
    for (const header of possibleHeaders) {
      const found = rowKeys.find(key => key.toLowerCase() === header.toLowerCase());
      if (found && row[found] !== undefined && row[found] !== null) {
        return row[found];
      }
    }

    return '';
  }

  /**
   * Validate individual field
   * @private
   */
  _validateField(field, value, rowNumber) {
    const errors = [];

    // Check if required
    if (field.is_required && (!value || value.trim() === '')) {
      errors.push({
        row: rowNumber,
        field: field.field_label,
        message: `${field.field_label} is required`
      });
      return { valid: false, errors, value: null };
    }

    // If empty and not required, skip validation
    if (!value || value.trim() === '') {
      return { valid: true, errors: [], value: null };
    }

    const trimmedValue = value.trim();

    // Type-specific validation
    switch (field.field_type.toLowerCase()) {
      case FIELD_TYPES.EMAIL:
        if (!this._isValidEmail(trimmedValue)) {
          errors.push({
            row: rowNumber,
            field: field.field_label,
            message: `Invalid email format: ${trimmedValue}`
          });
        }
        break;

      case FIELD_TYPES.NUMBER:
        if (!this._isValidNumber(trimmedValue)) {
          errors.push({
            row: rowNumber,
            field: field.field_label,
            message: `Invalid number: ${trimmedValue}`
          });
        } else {
          const numValue = parseFloat(trimmedValue);
          if (field.validation_rules) {
            if (field.validation_rules.min != null && numValue < field.validation_rules.min) {
              errors.push({
                row: rowNumber,
                field: field.field_label,
                message: `Value must be at least ${field.validation_rules.min}`
              });
            }
            if (field.validation_rules.max != null && numValue > field.validation_rules.max) {
              errors.push({
                row: rowNumber,
                field: field.field_label,
                message: `Value must not exceed ${field.validation_rules.max}`
              });
            }
          }
        }
        break;

      case FIELD_TYPES.DATE:
        if (!this._isValidDate(trimmedValue)) {
          errors.push({
            row: rowNumber,
            field: field.field_label,
            message: `Invalid date format. Use DD/MM/YYYY or DD-MM-YYYY: ${trimmedValue}`
          });
        }
        break;

      case FIELD_TYPES.URL:
        if (!this._isValidUrl(trimmedValue)) {
          errors.push({
            row: rowNumber,
            field: field.field_label,
            message: `Invalid URL format: ${trimmedValue}`
          });
        }
        break;

      case FIELD_TYPES.SELECT:
        if (field.field_options && !field.field_options.includes(trimmedValue)) {
          errors.push({
            row: rowNumber,
            field: field.field_label,
            message: `Invalid option. Must be one of: ${field.field_options.join(', ')}`
          });
        }
        break;

      case FIELD_TYPES.CHECKBOX:
        const normalizedValue = trimmedValue.toLowerCase();
        if (!['yes', 'no', 'true', 'false', '1', '0'].includes(normalizedValue)) {
          errors.push({
            row: rowNumber,
            field: field.field_label,
            message: `Invalid checkbox value. Use: Yes/No, True/False, or 1/0`
          });
        }
        break;

      case FIELD_TYPES.TEXT:
      case FIELD_TYPES.TEXTAREA:
        if (field.validation_rules) {
          if (field.validation_rules.minLength != null && trimmedValue.length < field.validation_rules.minLength) {
            errors.push({
              row: rowNumber,
              field: field.field_label,
              message: `Minimum length is ${field.validation_rules.minLength} characters`
            });
          }
          if (field.validation_rules.maxLength != null && trimmedValue.length > field.validation_rules.maxLength) {
            errors.push({
              row: rowNumber,
              field: field.field_label,
              message: `Maximum length is ${field.validation_rules.maxLength} characters`
            });
          }
          if (field.validation_rules.pattern) {
            const regex = new RegExp(field.validation_rules.pattern);
            if (!regex.test(trimmedValue)) {
              errors.push({
                row: rowNumber,
                field: field.field_label,
                message: `Value does not match required pattern`
              });
            }
          }
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      value: errors.length === 0 ? trimmedValue : null
    };
  }

  /**
   * Email validation
   * @private
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Number validation
   * @private
   */
  _isValidNumber(value) {
    return !isNaN(value) && !isNaN(parseFloat(value));
  }

  /**
   * Date validation (DD/MM/YYYY or DD-MM-YYYY)
   * @private
   */
  _isValidDate(dateStr) {
    const dateRegex = /^(\d{2})[\/-](\d{2})[\/-](\d{4})$/;
    const match = dateStr.match(dateRegex);

    if (!match) return false;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;

    // Check for valid date
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;
  }

  /**
   * URL validation
   * @private
   */
  _isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Format errors for display
   * @param {Array} errors - Array of error objects
   * @returns {string} - Formatted error string
   */
  formatErrors(errors) {
    if (!errors || errors.length === 0) {
      return 'No errors';
    }

    const grouped = {};
    errors.forEach(err => {
      const key = `Row ${err.row}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(`${err.field}: ${err.message}`);
    });

    const lines = [];
    Object.keys(grouped).forEach(row => {
      lines.push(`${row}:`);
      grouped[row].forEach(msg => {
        lines.push(`  - ${msg}`);
      });
    });

    return lines.join('\n');
  }

  /**
   * Generate CSV error report
   * @param {Array} errors - Array of error objects
   * @returns {string} - CSV string with errors
   */
  generateErrorReport(errors) {
    if (!errors || errors.length === 0) {
      return 'Row,Field,Error\n';
    }

    const lines = ['Row,Field,Error'];
    errors.forEach(err => {
      const escapedMessage = this._escapeCSV(err.message);
      lines.push(`${err.row},${err.field},${escapedMessage}`);
    });

    return lines.join('\n');
  }

  /**
   * Escape CSV value
   * @private
   */
  _escapeCSV(value) {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);
    const needsQuoting = /[",\n\r]/.test(stringValue);

    if (needsQuoting) {
      const escapedValue = stringValue.replace(/"/g, '""');
      return `"${escapedValue}"`;
    }

    return stringValue;
  }
}

// Export singleton instance
module.exports = new CsvParserService();
