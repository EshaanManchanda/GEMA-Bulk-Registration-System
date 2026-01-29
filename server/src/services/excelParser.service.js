const ExcelJS = require('exceljs');
const logger = require('../utils/logger');

// Field types (matching existing constants)
// Note: FILE type is treated as URL (accepts public links like Google Drive)
const FIELD_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  NUMBER: 'number',
  EMAIL: 'email',
  DATE: 'date',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  URL: 'url',
  FILE: 'file' // Treated as URL - accepts public links
};

/**
 * Excel Parser and Validation Service
 * Parses and validates .xlsx files for bulk registration
 */
class ExcelParserService {
  /**
   * Parse and validate Excel file
   * @param {Buffer} fileBuffer - Excel file buffer
   * @param {Object} event - Event object with form_schema
   * @returns {Promise<Object>} - Validation result
   */
  async parseAndValidate(fileBuffer, event) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);

      // Get the main data sheet (first visible sheet or 'Registrations')
      let dataSheet = workbook.getWorksheet('Registrations');
      if (!dataSheet) {
        dataSheet = workbook.worksheets.find(ws => ws.state === 'visible');
      }
      if (!dataSheet) {
        dataSheet = workbook.worksheets[0];
      }

      if (!dataSheet) {
        return {
          success: false,
          data: [],
          errors: [{ row: 0, field: 'File', message: 'No worksheet found in Excel file' }],
          summary: { total: 0, valid: 0, invalid: 1 }
        };
      }

      // Get headers from first row
      const headerRow = dataSheet.getRow(1);
      const headers = [];
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        let headerValue = cell.value || '';
        if (typeof headerValue === 'object' && headerValue.richText) {
          headerValue = headerValue.richText.map(r => r.text).join('');
        }
        headers[colNumber] = String(headerValue).trim().replace(/\*$/, '');
      });

      // Validate headers
      const headerErrors = this._validateHeaders(headers, event.form_schema);
      if (headerErrors.length > 0) {
        return {
          success: false,
          data: [],
          errors: headerErrors,
          summary: { total: 0, valid: 0, invalid: headerErrors.length }
        };
      }

      // Build header index map for faster lookup
      const headerMap = {};
      headers.forEach((header, index) => {
        if (header) {
          headerMap[header.toLowerCase()] = index;
        }
      });

      // Parse and validate each data row
      const validatedData = [];
      const errors = [];
      let totalRows = 0;

      dataSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        // Skip header row
        if (rowNumber === 1) return;

        // Check if this is a sample row (skip it)
        const firstCell = this._getCellValue(row.getCell(2));
        if (firstCell && firstCell.toLowerCase().includes('sample')) {
          return;
        }

        totalRows++;
        const rowData = this._extractRowData(row, headers, headerMap);
        const result = this._validateRow(rowData, event.form_schema, rowNumber);

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
          total: totalRows,
          valid: validatedData.length,
          invalid: errors.length
        }
      };
    } catch (error) {
      logger.error('Excel parsing error:', error);
      return {
        success: false,
        data: [],
        errors: [{
          row: 0,
          field: 'File',
          message: `Failed to parse Excel file: ${error.message}`
        }],
        summary: { total: 0, valid: 0, invalid: 1 }
      };
    }
  }

  /**
   * Get cell value handling different Excel cell types
   * @private
   */
  _getCellValue(cell) {
    if (!cell || cell.value === null || cell.value === undefined) {
      return '';
    }

    const value = cell.value;

    // Handle rich text
    if (typeof value === 'object' && value.richText) {
      return value.richText.map(r => r.text).join('');
    }

    // Handle formula results
    if (typeof value === 'object' && value.result !== undefined) {
      return String(value.result);
    }

    // Handle hyperlinks (ExcelJS returns { text, hyperlink } or { hyperlink })
    if (typeof value === 'object' && value.hyperlink) {
      return value.text || value.hyperlink || '';
    }

    // Handle other objects with text property
    if (typeof value === 'object' && value.text) {
      return String(value.text);
    }

    // Handle dates
    if (value instanceof Date) {
      const day = String(value.getDate()).padStart(2, '0');
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const year = value.getFullYear();
      return `${day}/${month}/${year}`;
    }

    // Handle any remaining objects - try to extract meaningful value
    if (typeof value === 'object') {
      // Last resort: try JSON or return empty
      logger.warn('Unknown cell object type:', value);
      return '';
    }

    return String(value);
  }

  /**
   * Extract row data into object
   * @private
   */
  _extractRowData(row, headers, headerMap) {
    const data = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (header) {
        data[header.toLowerCase()] = this._getCellValue(cell);
      }
    });
    return data;
  }

  /**
   * Validate headers against form schema
   * @private
   */
  _validateHeaders(headers, formSchema) {
    const errors = [];
    const normalizedHeaders = headers.filter(h => h).map(h => h.toLowerCase());

    // Required default headers
    const requiredHeaders = ['s.no', 'student name', 'grade'];

    requiredHeaders.forEach(required => {
      if (!normalizedHeaders.includes(required)) {
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
  _validateRow(rowData, formSchema, rowNumber) {
    const errors = [];

    // Get values using multiple possible header names
    const studentName = this._getFieldValue(rowData, ['student name']);
    const grade = this._getFieldValue(rowData, ['grade']);
    const section = this._getFieldValue(rowData, ['section']);
    const studentEmail = this._getFieldValue(rowData, ['student email', 'email']);
    const examDate = this._getFieldValue(rowData, ['exam date', 'exam_date']);

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

    // Validate Student Email if present
    if (studentEmail && studentEmail.trim() !== '') {
      if (!this._isValidEmail(studentEmail.trim())) {
        errors.push({
          row: rowNumber,
          field: 'Student Email',
          message: `Invalid email format: ${studentEmail}`
        });
      }
    }

    // Validate Exam Date if present
    let parsedExamDate = null;
    if (examDate && examDate.trim() !== '') {
      if (!this._isValidDate(examDate.trim())) {
        errors.push({
          row: rowNumber,
          field: 'Exam Date',
          message: `Invalid date format. Use DD/MM/YYYY: ${examDate}`
        });
      } else {
        // Parse date for native field
        const parts = examDate.trim().match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
        if (parts) {
          parsedExamDate = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
        }
      }
    }

    // Build dynamic data object
    const dynamicData = {};

    if (formSchema && formSchema.length > 0) {
      formSchema.forEach(field => {
        // Skip if same as native fields (case insensitive check)
        const label = field.field_label.toLowerCase();
        const id = field.field_id.toLowerCase();

        if (label === 'student email' || id === 'student_email' ||
          label === 'exam date' || id === 'exam_date') {
          return;
        }

        const value = this._getFieldValue(rowData, [
          field.field_label.toLowerCase(),
          field.field_id.toLowerCase()
        ]);

        const validation = this._validateField(field, value, rowNumber);

        if (validation.errors.length > 0) {
          errors.push(...validation.errors);
        } else if (validation.value !== null && validation.value !== undefined) {
          dynamicData[field.field_id] = validation.value;
        }
      });
    }

    if (errors.length > 0) {
      return { data: null, errors };
    }

    return {
      data: {
        student_name: studentName.trim(),
        grade: grade.trim(),
        section: section ? section.trim() : '',
        student_email: studentEmail ? studentEmail.trim().toLowerCase() : '',
        exam_date: parsedExamDate,
        dynamic_data: dynamicData
      },
      errors: []
    };
  }

  /**
   * Get field value from row data using multiple possible keys
   * @private
   */
  _getFieldValue(rowData, possibleKeys) {
    for (const key of possibleKeys) {
      if (rowData[key] !== undefined && rowData[key] !== null && rowData[key] !== '') {
        return rowData[key];
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
            message: `Invalid date format. Use DD/MM/YYYY: ${trimmedValue}`
          });
        }
        break;

      case FIELD_TYPES.URL:
      case FIELD_TYPES.FILE:
        // FILE type accepts public URLs (Google Drive, Dropbox, etc.)
        if (!this._isValidUrl(trimmedValue)) {
          errors.push({
            row: rowNumber,
            field: field.field_label,
            message: `Invalid URL. Please provide a public link (Google Drive, Dropbox, etc.): ${trimmedValue}`
          });
        }
        break;

      case FIELD_TYPES.SELECT:
        if (field.field_options) {
          // Case-insensitive comparison with trimmed values
          const normalizedOptions = field.field_options.map(o => o.trim().toLowerCase());
          const normalizedValue = trimmedValue.toLowerCase();
          if (!normalizedOptions.includes(normalizedValue)) {
            errors.push({
              row: rowNumber,
              field: field.field_label,
              message: `Invalid option. Must be one of: ${field.field_options.join(', ')}`
            });
          }
        }
        break;

      case FIELD_TYPES.CHECKBOX:
        const checkboxValue = trimmedValue.toLowerCase();
        if (!['yes', 'no', 'true', 'false', '1', '0'].includes(checkboxValue)) {
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
          if (field.validation_rules.minLength != null &&
            trimmedValue.length < field.validation_rules.minLength) {
            errors.push({
              row: rowNumber,
              field: field.field_label,
              message: `Minimum length is ${field.validation_rules.minLength} characters`
            });
          }
          if (field.validation_rules.maxLength != null &&
            trimmedValue.length > field.validation_rules.maxLength) {
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
   * Generate error report as Excel buffer
   * @param {Array} errors - Array of error objects
   * @returns {Promise<Buffer>} - Excel buffer with errors
   */
  async generateErrorReport(errors) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Errors');

    sheet.columns = [
      { header: 'Row', key: 'row', width: 10 },
      { header: 'Field', key: 'field', width: 20 },
      { header: 'Error', key: 'message', width: 50 }
    ];

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF6B6B' }
    };

    errors.forEach(err => {
      sheet.addRow({
        row: err.row,
        field: err.field,
        message: err.message
      });
    });

    return workbook.xlsx.writeBuffer();
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
}

module.exports = new ExcelParserService();
