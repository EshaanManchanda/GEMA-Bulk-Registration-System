const logger = require('../utils/logger');

/**
 * CSV Template Generator Service
 * Generates CSV templates for bulk registration uploads
 */
class CsvGeneratorService {
  /**
   * Generate CSV template for an event
   * @param {Object} event - Event object with form_schema
   * @returns {Buffer} - CSV file buffer with UTF-8 BOM
   */
  generateTemplate(event) {
    try {
      // Build header row and sample row
      const headers = this._buildHeaders(event.form_schema);
      const sampleRow = this._buildSampleRow(event.form_schema);

      // Generate CSV content
      const csvLines = [
        headers.join(','),
        sampleRow.join(',')
      ];

      const csvContent = csvLines.join('\r\n') + '\r\n'; // Windows-style line endings

      // Add UTF-8 BOM for Excel compatibility
      const buffer = Buffer.from('\ufeff' + csvContent, 'utf-8');

      logger.info(`CSV template generated for event: ${event.title}`);
      return buffer;
    } catch (error) {
      logger.error('CSV template generation error:', error);
      throw new Error(`Failed to generate CSV template: ${error.message}`);
    }
  }

  /**
   * Build header row from form schema
   * @private
   * @param {Array} formSchema - Event form schema
   * @returns {Array} - Header values
   */
  _buildHeaders(formSchema) {
    // Default headers (required fields marked with asterisk)
    const headers = [
      'S.No',
      'Student Name*',
      'Grade*',
      'Section'
    ];

    // Add dynamic columns from form_schema
    if (formSchema && formSchema.length > 0) {
      formSchema.forEach(field => {
        const headerName = field.is_required ? `${field.field_label}*` : field.field_label;
        const escapedHeader = this._escapeCSV(headerName);
        headers.push(escapedHeader);
      });
    }

    return headers;
  }

  /**
   * Build sample data row
   * @private
   * @param {Array} formSchema - Event form schema
   * @returns {Array} - Sample row values
   */
  _buildSampleRow(formSchema) {
    // Default sample data
    const sampleRow = [
      '1',
      this._escapeCSV('John Doe'),
      '10',
      'A'
    ];

    // Add sample data for dynamic fields based on type
    if (formSchema && formSchema.length > 0) {
      formSchema.forEach(field => {
        const sampleValue = this._getSampleValueForField(field);
        sampleRow.push(this._escapeCSV(sampleValue));
      });
    }

    return sampleRow;
  }

  /**
   * Get sample value based on field type
   * @private
   * @param {Object} field - Form field configuration
   * @returns {string} - Sample value
   */
  _getSampleValueForField(field) {
    switch (field.field_type.toLowerCase()) {
      case 'text':
      case 'textarea':
        return 'Sample Text';

      case 'number':
        if (field.validation_rules && field.validation_rules.min !== undefined) {
          return field.validation_rules.min.toString();
        }
        return '15';

      case 'email':
        return 'student@school.com';

      case 'date':
        return 'DD/MM/YYYY';

      case 'select':
        // Return first option if available
        if (field.field_options && field.field_options.length > 0) {
          return field.field_options[0];
        }
        return 'Option1';

      case 'checkbox':
        return 'Yes';

      case 'url':
        return 'https://example.com';

      case 'file':
        return 'filename.pdf';

      default:
        return 'Sample Value';
    }
  }

  /**
   * Escape CSV value (handle quotes, commas, newlines)
   * @private
   * @param {*} value - Value to escape
   * @returns {string} - Escaped value
   */
  _escapeCSV(value) {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // Check if value needs quoting (contains comma, quote, or newline)
    const needsQuoting = /[",\n\r]/.test(stringValue);

    if (needsQuoting) {
      // Escape double quotes by doubling them
      const escapedValue = stringValue.replace(/"/g, '""');
      return `"${escapedValue}"`;
    }

    return stringValue;
  }

  /**
   * Generate filename for template
   * @param {Object} event - Event object
   * @returns {string} - Filename
   */
  generateFilename(event) {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    return `${event.event_slug}_registration_template_${dateStr}.csv`;
  }

  /**
   * Generate instructions text file content
   * @param {Object} event - Event object with form_schema
   * @returns {string} - Instructions text content
   */
  generateInstructions(event) {
    const lines = [];

    lines.push(`REGISTRATION INSTRUCTIONS FOR: ${event.title}`);
    lines.push('='.repeat(60));
    lines.push('');

    lines.push('REQUIRED FIELDS (marked with * in template):');
    lines.push('- Student Name: Full name of the student');
    lines.push('- Grade: Student\'s grade/class (e.g., 10, 11, 12)');

    // Add dynamic required fields
    if (event.form_schema && event.form_schema.length > 0) {
      event.form_schema.forEach(field => {
        if (field.is_required) {
          lines.push(`- ${field.field_label}: ${field.help_text || 'Required field'}`);
        }
      });
    }

    lines.push('');
    lines.push('FIELD FORMATS:');
    lines.push('- Email: Must be valid email format (e.g., student@school.com)');
    lines.push('- Date: Must be in DD/MM/YYYY format (e.g., 15/08/2023)');
    lines.push('- Checkbox: Use Yes/No, True/False, or 1/0');
    lines.push('');

    // Add SELECT field options
    if (event.form_schema && event.form_schema.length > 0) {
      const selectFields = event.form_schema.filter(f => f.field_type === 'select');

      if (selectFields.length > 0) {
        lines.push('ALLOWED OPTIONS FOR SELECT FIELDS:');
        selectFields.forEach(field => {
          lines.push(`- ${field.field_label}: ${field.field_options.join(', ')}`);
        });
        lines.push('');
      }
    }

    // Add validation rules
    if (event.form_schema && event.form_schema.length > 0) {
      const fieldsWithValidation = event.form_schema.filter(f => f.validation_rules);

      if (fieldsWithValidation.length > 0) {
        lines.push('VALIDATION RULES:');
        fieldsWithValidation.forEach(field => {
          if (field.validation_rules.min !== undefined && field.validation_rules.max !== undefined) {
            lines.push(`- ${field.field_label}: Must be between ${field.validation_rules.min} and ${field.validation_rules.max}`);
          } else if (field.validation_rules.minLength !== undefined) {
            lines.push(`- ${field.field_label}: Minimum ${field.validation_rules.minLength} characters`);
          } else if (field.validation_rules.maxLength !== undefined) {
            lines.push(`- ${field.field_label}: Maximum ${field.validation_rules.maxLength} characters`);
          } else if (field.validation_rules.pattern) {
            lines.push(`- ${field.field_label}: Must match pattern: ${field.validation_rules.pattern}`);
          }
        });
        lines.push('');
      }
    }

    lines.push('SPECIAL CHARACTERS:');
    lines.push('- If a value contains comma, wrap it in double quotes: "Smith, John"');
    lines.push('- If a value contains quotes, double them: "He said ""Hello"""');
    lines.push('');

    lines.push('NOTES:');
    lines.push('- Row 1 contains column headers');
    lines.push('- Row 2 is a sample row (delete before submitting)');
    lines.push('- Start your actual data from Row 3');
    lines.push('- Do not modify column headers');
    lines.push('- Save file as CSV format');
    lines.push('');

    lines.push('For support, contact: support@gema.com');

    return lines.join('\n');
  }
}

// Export singleton instance
module.exports = new CsvGeneratorService();
