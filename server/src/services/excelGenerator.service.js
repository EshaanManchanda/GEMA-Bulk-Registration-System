const ExcelJS = require('exceljs');
const logger = require('../utils/logger');

/**
 * Sanitize string for Excel XML - removes/escapes problematic characters
 * @param {*} value - Value to sanitize
 * @returns {string} - Safe string for Excel
 */
function sanitizeForExcel(value) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') value = String(value);

  return value
    // Remove control characters (except tab, newline, carriage return)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Escape XML special characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Remove problematic unicode that can break XML
    .replace(/[\uFFFE\uFFFF]/g, '');
}

/**
 * Sanitize cell value - simpler version for cell content
 * @param {*} value - Value to write to cell
 * @returns {string|number} - Safe value
 */
function sanitizeCellValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  if (typeof value === 'object') return '';

  return String(value)
    // Remove control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove problematic unicode
    .replace(/[\uFFFE\uFFFF]/g, '');
}

/**
 * Excel Template Generator Service
 * Generates .xlsx templates with advanced Excel features:
 * - Dropdown validation with hidden master sheets
 * - Data validation (numbers, dates, text length)
 * - Input messages for user guidance
 * - Error alerts with hard blocking
 * - Conditional formatting for required fields
 * - Sheet protection (headers locked)
 * - Status columns for round-trip feedback
 */
class ExcelGeneratorService {
  constructor() {
    this.MAX_DATA_ROWS = 500; // Reduced to prevent XML bloat

    // Style constants
    this.STYLES = {
      HEADER_FILL: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      HEADER_FONT: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      REQUIRED_FILL: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } },
      ERROR_FILL: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } },
      SUCCESS_FILL: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } },
      SAMPLE_FONT: { italic: true, color: { argb: 'FF808080' } },
      LOCKED_CELL: { locked: true },
      UNLOCKED_CELL: { locked: false }
    };
  }

  /**
   * Generate Excel template for an event
   * @param {Object} event - Event object with form_schema
   * @returns {Promise<Buffer>} - Excel file buffer
   */
  async generateTemplate(event) {
    try {
      const workbook = await this._createTemplateWorkbook(event);
      const buffer = await workbook.xlsx.writeBuffer();
      logger.info(`Excel template generated for event: ${event.title}`);
      return buffer;
    } catch (error) {
      logger.error('Excel template generation error:', error);
      throw new Error(`Failed to generate Excel template: ${error.message}`);
    }
  }

  /**
   * Stream Excel template directly to HTTP response
   * Avoids binary corruption issues with res.send(buffer)
   * @param {Object} event - Event object with form_schema
   * @param {Object} res - Express response object
   */
  async streamTemplate(event, res) {
    try {
      const workbook = await this._createTemplateWorkbook(event);
      const filename = this.generateFilename(event);

      res.setHeader('Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await workbook.xlsx.write(res);
      res.end();

      logger.info(`Excel template streamed for event: ${event.title}`);
    } catch (error) {
      logger.error('Excel template streaming error:', error);
      throw new Error(`Failed to stream Excel template: ${error.message}`);
    }
  }

  /**
   * Create workbook with template structure (shared logic)
   * @private
   */
  async _createTemplateWorkbook(event) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GEMA Events';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create hidden master sheet for dropdown options
    const masterSheet = workbook.addWorksheet('_MASTER', { state: 'veryHidden' });

    // Create main data sheet
    const dataSheet = workbook.addWorksheet('Registrations', {
      views: [{ state: 'frozen', ySplit: 1 }],
      properties: { defaultRowHeight: 20 }
    });

    // Create instructions sheet
    this._addInstructionsSheet(workbook, event);

    // Build columns and collect dropdown/validation configs
    const { columns, validationConfigs } = this._buildColumns(event.form_schema);
    dataSheet.columns = columns;

    // Style and protect header row
    this._styleHeaderRow(dataSheet);

    // Add sample row
    const sampleData = this._buildSampleRow(event.form_schema, columns);
    const sampleRow = dataSheet.addRow(sampleData);
    sampleRow.font = this.STYLES.SAMPLE_FONT;

    // Setup master sheet with dropdown options
    this._setupMasterSheet(masterSheet, validationConfigs);

    // Apply all validations
    this._applyValidations(dataSheet, masterSheet, validationConfigs, event.form_schema);

    // Apply conditional formatting for required fields
    this._applyConditionalFormatting(dataSheet, columns);

    // Protect sheet (headers locked, data cells unlocked)
    this._protectSheet(dataSheet);

    // Auto-fit column widths
    this._autoFitColumns(dataSheet);

    return workbook;
  }

  /**
   * Build columns from form schema
   * @private
   */
  _buildColumns(formSchema) {
    const validationConfigs = [];

    // Default columns with metadata
    const columns = [
      { header: 'S.No', key: 'sno', width: 8, fieldType: 'number', required: false },
      { header: 'Student Name*', key: 'student_name', width: 25, fieldType: 'text', required: true },
      { header: 'Grade*', key: 'grade', width: 10, fieldType: 'text', required: true },
      { header: 'Section', key: 'section', width: 10, fieldType: 'text', required: false }
    ];

    // Add dynamic columns from form_schema
    if (formSchema && formSchema.length > 0) {
      formSchema.forEach((field, index) => {
        const headerName = field.is_required ? `${field.field_label}*` : field.field_label;
        const colKey = field.field_id || `field_${index}`;

        // Handle FILE type as URL
        const fieldType = field.field_type === 'file' ? 'url' : field.field_type;

        columns.push({
          header: headerName,
          key: colKey,
          width: Math.max(headerName.length + 5, 18),
          fieldType: fieldType,
          required: field.is_required,
          fieldConfig: field
        });

        // Build validation config
        validationConfigs.push({
          columnIndex: columns.length,
          columnKey: colKey,
          fieldType: fieldType,
          fieldLabel: field.field_label,
          required: field.is_required,
          options: field.field_options || [],
          validationRules: field.validation_rules || {},
          helpText: field.help_text || ''
        });
      });
    }

    return { columns, validationConfigs };
  }

  /**
   * Style header row
   * @private
   */
  _styleHeaderRow(dataSheet) {
    const headerRow = dataSheet.getRow(1);
    headerRow.font = this.STYLES.HEADER_FONT;
    headerRow.fill = this.STYLES.HEADER_FILL;
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 30;

    // Lock header cells
    headerRow.eachCell(cell => {
      cell.protection = this.STYLES.LOCKED_CELL;
    });
  }

  /**
   * Build sample data row
   * @private
   */
  _buildSampleRow(formSchema, columns) {
    const sampleData = {
      sno: 1,
      student_name: 'John Doe (DELETE THIS ROW)',
      grade: '10',
      section: 'A'
    };

    if (formSchema && formSchema.length > 0) {
      formSchema.forEach((field, index) => {
        const colKey = field.field_id || `field_${index}`;
        sampleData[colKey] = this._getSampleValueForField(field);
      });
    }

    return sampleData;
  }

  /**
   * Get sample value based on field type
   * @private
   */
  _getSampleValueForField(field) {
    const fieldType = field.field_type.toLowerCase();

    switch (fieldType) {
      case 'text':
      case 'textarea':
        return 'Sample Text';
      case 'number':
        if (field.validation_rules?.min !== undefined) {
          return field.validation_rules.min;
        }
        return 15;
      case 'email':
        return 'student@school.com';
      case 'date':
        return '15/01/2024';
      case 'select':
        return field.field_options?.[0] || 'Option1';
      case 'checkbox':
        return 'Yes';
      case 'url':
      case 'file':
        return 'https://drive.google.com/file/your-file-link';
      default:
        return 'Sample';
    }
  }

  /**
   * Setup master sheet with dropdown options and named ranges
   * @private
   */
  _setupMasterSheet(masterSheet, validationConfigs) {
    let colIndex = 1;

    validationConfigs.forEach(config => {
      if (config.fieldType === 'select' && config.options.length > 0) {
        // Build values array with null at index 0 (ExcelJS is 1-based)
        // values[1] → row 1, values[2] → row 2, etc.
        const values = [null, ...config.options.map(o => sanitizeCellValue(o))];
        masterSheet.getColumn(colIndex).values = values;

        // Range: row 1 to row N where N = options.length
        const colLetter = this._getColumnLetter(colIndex);
        const endRow = config.options.length;
        config.masterRange = `=_MASTER!$${colLetter}$1:$${colLetter}$${endRow}`;

        colIndex++;
      }

      // Add Yes/No options for checkbox fields
      if (config.fieldType === 'checkbox') {
        // [null, 'Yes', 'No'] → Yes at row 1, No at row 2
        masterSheet.getColumn(colIndex).values = [null, 'Yes', 'No'];

        const colLetter = this._getColumnLetter(colIndex);
        config.masterRange = `=_MASTER!$${colLetter}$1:$${colLetter}$2`;

        colIndex++;
      }
    });
  }

  /**
   * Apply all validations to data sheet
   * @private
   */
  _applyValidations(dataSheet, masterSheet, validationConfigs, formSchema) {
    // Apply validations to each config
    validationConfigs.forEach(config => {
      const colLetter = this._getColumnLetter(config.columnIndex);

      for (let row = 2; row <= this.MAX_DATA_ROWS; row++) {
        const cell = dataSheet.getCell(`${colLetter}${row}`);

        // Unlock data cells
        cell.protection = this.STYLES.UNLOCKED_CELL;

        // Apply type-specific validation
        switch (config.fieldType) {
          case 'select':
            this._applySelectValidation(cell, config);
            break;
          case 'checkbox':
            this._applyCheckboxValidation(cell, config);
            break;
          case 'number':
            this._applyNumberValidation(cell, config);
            break;
          case 'email':
            this._applyEmailValidation(cell, config, row);
            break;
          case 'date':
            this._applyDateValidation(cell, config);
            break;
          case 'url':
          case 'file':
            this._applyUrlValidation(cell, config);
            break;
          case 'text':
          case 'textarea':
            this._applyTextValidation(cell, config);
            break;
        }
      }

      // Add input message to header cell
      this._addHeaderNote(dataSheet, config);
    });

    // Apply basic validations to default columns
    this._applyDefaultColumnValidations(dataSheet);
  }

  /**
   * Apply SELECT dropdown validation
   * @private
   */
  _applySelectValidation(cell, config) {
    // Sanitize options for prompt display (limit to avoid XML issues)
    const safeOptions = config.options.slice(0, 3).map(o => sanitizeCellValue(o));
    const promptText = `Select from dropdown list`;
    const safeLabel = sanitizeCellValue(config.fieldLabel);

    cell.dataValidation = {
      type: 'list',
      allowBlank: !config.required,
      formulae: [config.masterRange],
      showInputMessage: true,
      promptTitle: safeLabel.slice(0, 32), // Excel limits title to 32 chars
      prompt: promptText,
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Invalid Selection',
      error: `Please select a valid option`
    };
  }

  /**
   * Apply CHECKBOX (Yes/No) validation
   * @private
   */
  _applyCheckboxValidation(cell, config) {
    const safeLabel = sanitizeCellValue(config.fieldLabel);
    cell.dataValidation = {
      type: 'list',
      allowBlank: !config.required,
      formulae: [config.masterRange],
      showInputMessage: true,
      promptTitle: safeLabel.slice(0, 32),
      prompt: 'Select Yes or No',
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Invalid Value',
      error: 'Please select Yes or No'
    };
  }

  /**
   * Apply NUMBER validation with range
   * @private
   */
  _applyNumberValidation(cell, config) {
    const { min, max } = config.validationRules;
    const safeLabel = sanitizeCellValue(config.fieldLabel);

    const validation = {
      type: 'whole',
      allowBlank: !config.required,
      showInputMessage: true,
      promptTitle: safeLabel.slice(0, 32),
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Invalid Number'
    };

    if (min !== undefined && max !== undefined) {
      validation.operator = 'between';
      validation.formulae = [min, max];
      validation.prompt = `Enter a number between ${min} and ${max}`;
      validation.error = `Value must be between ${min} and ${max}`;
    } else if (min !== undefined) {
      validation.operator = 'greaterThanOrEqual';
      validation.formulae = [min];
      validation.prompt = `Enter a number >= ${min}`;
      validation.error = `Value must be at least ${min}`;
    } else if (max !== undefined) {
      validation.operator = 'lessThanOrEqual';
      validation.formulae = [max];
      validation.prompt = `Enter a number <= ${max}`;
      validation.error = `Value must not exceed ${max}`;
    } else {
      validation.prompt = 'Enter a whole number';
      validation.error = 'Please enter a valid number';
    }

    cell.dataValidation = validation;
  }

  /**
   * Apply EMAIL validation hint (Excel can't do regex)
   * @private
   */
  _applyEmailValidation(cell, config, row) {
    // Excel doesn't support regex, so we use text length + note
    cell.dataValidation = {
      type: 'textLength',
      operator: 'greaterThan',
      allowBlank: !config.required,
      formulae: [5],
      showInputMessage: true,
      promptTitle: 'Email Address',
      prompt: 'Enter a valid email (e.g., student@school.com)',
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Check Email Format',
      error: 'Please ensure this is a valid email address'
    };
  }

  /**
   * Apply DATE validation
   * @private
   */
  _applyDateValidation(cell, config) {
    cell.dataValidation = {
      type: 'textLength',
      operator: 'equal',
      allowBlank: !config.required,
      formulae: [10], // DD/MM/YYYY = 10 chars
      showInputMessage: true,
      promptTitle: 'Date',
      prompt: 'Enter date as DD/MM/YYYY (e.g., 15/01/2024)',
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Date Format',
      error: 'Please enter date in DD/MM/YYYY format'
    };
  }

  /**
   * Apply URL validation (for file links)
   * @private
   */
  _applyUrlValidation(cell, config) {
    const safeLabel = sanitizeCellValue(config.fieldLabel);
    cell.dataValidation = {
      type: 'textLength',
      operator: 'greaterThan',
      allowBlank: !config.required,
      formulae: [10],
      showInputMessage: true,
      promptTitle: safeLabel.slice(0, 32),
      prompt: 'Enter a public URL (Google Drive, Dropbox, etc.)',
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'URL Required',
      error: 'Please enter a valid public URL for the file'
    };
  }

  /**
   * Apply TEXT validation with length limits
   * @private
   */
  _applyTextValidation(cell, config) {
    const { minLength, maxLength } = config.validationRules;
    const safeLabel = sanitizeCellValue(config.fieldLabel);

    if (minLength || maxLength) {
      const validation = {
        type: 'textLength',
        allowBlank: !config.required,
        showInputMessage: true,
        promptTitle: safeLabel.slice(0, 32),
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Text Length'
      };

      if (minLength && maxLength) {
        validation.operator = 'between';
        validation.formulae = [minLength, maxLength];
        validation.prompt = `Enter ${minLength}-${maxLength} characters`;
        validation.error = `Text must be ${minLength}-${maxLength} characters`;
      } else if (minLength) {
        validation.operator = 'greaterThanOrEqual';
        validation.formulae = [minLength];
        validation.prompt = `Enter at least ${minLength} characters`;
        validation.error = `Text must be at least ${minLength} characters`;
      } else if (maxLength) {
        validation.operator = 'lessThanOrEqual';
        validation.formulae = [maxLength];
        validation.prompt = `Enter up to ${maxLength} characters`;
        validation.error = `Text must not exceed ${maxLength} characters`;
      }

      cell.dataValidation = validation;
    } else if (config.required) {
      const safeHelp = sanitizeCellValue(config.helpText) || 'This field is required';
      cell.dataValidation = {
        type: 'textLength',
        operator: 'greaterThan',
        allowBlank: false,
        formulae: [0],
        showInputMessage: true,
        promptTitle: safeLabel.slice(0, 32),
        prompt: safeHelp.slice(0, 255),
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Required Field',
        error: 'This field is required'
      };
    }
  }

  /**
   * Apply validations to default columns (Student Name, Grade, Section)
   * @private
   */
  _applyDefaultColumnValidations(dataSheet) {
    for (let row = 2; row <= this.MAX_DATA_ROWS; row++) {
      // Student Name - required, max 200 chars
      const nameCell = dataSheet.getCell(`B${row}`);
      nameCell.protection = this.STYLES.UNLOCKED_CELL;
      nameCell.dataValidation = {
        type: 'textLength',
        operator: 'between',
        allowBlank: false,
        formulae: [1, 200],
        showInputMessage: true,
        promptTitle: 'Student Name',
        prompt: 'Enter full name of the student',
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Name',
        error: 'Student name is required (max 200 characters)'
      };

      // Grade - required
      const gradeCell = dataSheet.getCell(`C${row}`);
      gradeCell.protection = this.STYLES.UNLOCKED_CELL;
      gradeCell.dataValidation = {
        type: 'textLength',
        operator: 'greaterThan',
        allowBlank: false,
        formulae: [0],
        showInputMessage: true,
        promptTitle: 'Grade',
        prompt: 'Enter grade/class (e.g., 10, 11, 12)',
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Grade Required',
        error: 'Grade is required'
      };

      // Section - optional
      const sectionCell = dataSheet.getCell(`D${row}`);
      sectionCell.protection = this.STYLES.UNLOCKED_CELL;

      // S.No - auto-fill hint
      const snoCell = dataSheet.getCell(`A${row}`);
      snoCell.protection = this.STYLES.UNLOCKED_CELL;
    }
  }

  /**
   * Add note/comment to header cell with field instructions
   * @private
   */
  _addHeaderNote(dataSheet, config) {
    const colLetter = this._getColumnLetter(config.columnIndex);
    const headerCell = dataSheet.getCell(`${colLetter}1`);

    let noteText = sanitizeCellValue(config.helpText) || '';

    // Add type-specific hints
    switch (config.fieldType) {
      case 'select':
        // Sanitize each option and limit list length
        const safeOpts = config.options.slice(0, 10).map(o => sanitizeCellValue(o)).join(', ');
        noteText = `Options: ${safeOpts}${config.options.length > 10 ? '...' : ''}\n\n${noteText}`;
        break;
      case 'email':
        noteText = `Format: email@domain.com\n\n${noteText}`;
        break;
      case 'date':
        noteText = `Format: DD/MM/YYYY\n\n${noteText}`;
        break;
      case 'url':
      case 'file':
        noteText = `Enter a public URL (Google Drive, Dropbox link)\n\n${noteText}`;
        break;
      case 'checkbox':
        noteText = `Select: Yes or No\n\n${noteText}`;
        break;
      case 'number':
        const { min, max } = config.validationRules;
        if (min !== undefined || max !== undefined) {
          noteText = `Range: ${min ?? '-'} to ${max ?? '-'}\n\n${noteText}`;
        }
        break;
    }

    if (noteText.trim()) {
      headerCell.note = noteText.trim();
    }
  }

  /**
   * Apply conditional formatting for required fields (highlight if empty)
   * @private
   */
  _applyConditionalFormatting(dataSheet, columns) {
    // Excel conditional formatting for required empty cells
    columns.forEach((col, index) => {
      if (col.required) {
        const colLetter = this._getColumnLetter(index + 1);

        dataSheet.addConditionalFormatting({
          ref: `${colLetter}2:${colLetter}${this.MAX_DATA_ROWS}`,
          rules: [
            {
              type: 'containsBlanks',
              priority: 1,
              style: {
                fill: this.STYLES.REQUIRED_FILL
              }
            }
          ]
        });
      }
    });
  }

  /**
   * Protect sheet - lock headers, unlock data cells
   * @private
   */
  _protectSheet(dataSheet) {
    dataSheet.protect('', {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: true,
      insertHyperlinks: true,
      deleteColumns: false,
      deleteRows: true,
      sort: true,
      autoFilter: true
    });
  }

  /**
   * Auto-fit column widths
   * @private
   */
  _autoFitColumns(dataSheet) {
    dataSheet.columns.forEach(column => {
      column.width = Math.max(column.width || 12, 12);
    });
  }

  /**
   * Add instructions sheet
   * @private
   */
  _addInstructionsSheet(workbook, event) {
    const instrSheet = workbook.addWorksheet('Instructions', {
      properties: { tabColor: { argb: 'FF00B050' } }
    });

    instrSheet.columns = [{ header: '', key: 'text', width: 100 }];

    // Sanitize event title
    const safeTitle = sanitizeCellValue(event.title);

    const lines = [
      { text: `REGISTRATION TEMPLATE: ${safeTitle}`, style: 'title' },
      { text: '' },
      { text: '[INSTRUCTIONS]', style: 'heading' },
      { text: '* Row 1 contains headers - DO NOT modify' },
      { text: '* Row 2 is a sample row - DELETE before uploading' },
      { text: '* Start entering data from Row 3' },
      { text: '* Fields marked with * are required' },
      { text: '* Dropdown fields will show valid options when clicked' },
      { text: '* Yellow highlighted cells indicate missing required data' },
      { text: '' },
      { text: '[FILE UPLOADS]', style: 'heading' },
      { text: '* For file fields, enter a PUBLIC URL (not actual file)' },
      { text: '* Supported: Google Drive, Dropbox, OneDrive links' },
      { text: '* Ensure link is publicly accessible or shared with anyone' },
      { text: '* Example: https://drive.google.com/file/d/xxxx/view?usp=sharing' },
      { text: '' },
      { text: '[DATE FORMAT]', style: 'heading' },
      { text: '* Use DD/MM/YYYY format (e.g., 15/01/2024)' },
      { text: '' },
      { text: '[EMAIL FORMAT]', style: 'heading' },
      { text: '* Must be valid email (e.g., student@school.com)' },
      { text: '' }
    ];

    // Add field-specific instructions
    if (event.form_schema?.length > 0) {
      lines.push({ text: '[FIELD DETAILS]', style: 'heading' });

      event.form_schema.forEach(field => {
        const req = field.is_required ? '(Required)' : '(Optional)';
        const safeLabel = sanitizeCellValue(field.field_label);
        let detail = `* ${safeLabel} ${req}`;

        if (field.field_type === 'select' && field.field_options?.length) {
          const safeOpts = field.field_options.slice(0, 5).map(o => sanitizeCellValue(o)).join(', ');
          detail += ` - Options: ${safeOpts}${field.field_options.length > 5 ? '...' : ''}`;
        }
        if (field.field_type === 'file') {
          detail += ` - Enter public URL`;
        }
        if (field.help_text) {
          detail += ` - ${sanitizeCellValue(field.help_text)}`;
        }

        lines.push({ text: detail });
      });
    }

    lines.push({ text: '' });
    lines.push({ text: 'Support: support@gema.com', style: 'footer' });

    lines.forEach((line, index) => {
      const row = instrSheet.addRow({ text: sanitizeCellValue(line.text) });

      if (line.style === 'title') {
        row.font = { bold: true, size: 16, color: { argb: 'FF4472C4' } };
      } else if (line.style === 'heading') {
        row.font = { bold: true, size: 12 };
      } else if (line.style === 'footer') {
        row.font = { italic: true, color: { argb: 'FF666666' } };
      }
    });
  }

  /**
   * Convert column number to Excel letter (1=A, 2=B, 27=AA)
   * @private
   */
  _getColumnLetter(colNum) {
    let letter = '';
    let num = colNum;
    while (num > 0) {
      const mod = (num - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      num = Math.floor((num - 1) / 26);
    }
    return letter;
  }

  /**
   * Generate filename for template
   * @param {Object} event - Event object
   * @returns {string} - Filename
   */
  generateFilename(event) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `${event.event_slug}_template_${date}.xlsx`;
  }

  /**
   * Generate error feedback Excel for failed uploads
   * @param {Array} originalData - Original uploaded data
   * @param {Array} errors - Validation errors
   * @returns {Promise<Buffer>} - Excel buffer with errors marked
   */
  async generateErrorFeedback(originalData, errors, event) {
    const workbook = new ExcelJS.Workbook();
    const dataSheet = workbook.addWorksheet('Data with Errors');
    const errorSheet = workbook.addWorksheet('Error Summary');

    // Build columns including status columns
    const columns = [
      { header: 'ROW_STATUS', key: 'row_status', width: 12 },
      { header: 'ERROR_MESSAGE', key: 'error_message', width: 50 },
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Student Name', key: 'student_name', width: 25 },
      { header: 'Grade', key: 'grade', width: 10 },
      { header: 'Section', key: 'section', width: 10 }
    ];

    // Add dynamic columns
    if (event.form_schema) {
      event.form_schema.forEach(field => {
        columns.push({
          header: field.field_label,
          key: field.field_id,
          width: 18
        });
      });
    }

    dataSheet.columns = columns;

    // Style header
    const headerRow = dataSheet.getRow(1);
    headerRow.font = this.STYLES.HEADER_FONT;
    headerRow.fill = this.STYLES.HEADER_FILL;

    // Group errors by row
    const errorsByRow = {};
    errors.forEach(err => {
      if (!errorsByRow[err.row]) {
        errorsByRow[err.row] = [];
      }
      errorsByRow[err.row].push(`${err.field}: ${err.message}`);
    });

    // Add data rows with status
    originalData.forEach((rowData, index) => {
      const rowNum = index + 2; // Account for header and 1-based
      const rowErrors = errorsByRow[rowNum] || [];

      const row = dataSheet.addRow({
        row_status: rowErrors.length > 0 ? 'ERROR' : 'OK',
        error_message: rowErrors.join('; '),
        sno: index + 1,
        ...rowData
      });

      // Style based on status
      if (rowErrors.length > 0) {
        row.getCell('row_status').fill = this.STYLES.ERROR_FILL;
        row.getCell('error_message').fill = this.STYLES.ERROR_FILL;
      } else {
        row.getCell('row_status').fill = this.STYLES.SUCCESS_FILL;
      }
    });

    // Build error summary sheet
    errorSheet.columns = [
      { header: 'Row', key: 'row', width: 10 },
      { header: 'Field', key: 'field', width: 20 },
      { header: 'Error', key: 'message', width: 60 }
    ];

    const errHeaderRow = errorSheet.getRow(1);
    errHeaderRow.font = this.STYLES.HEADER_FONT;
    errHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };

    errors.forEach(err => {
      errorSheet.addRow(err);
    });

    return workbook.xlsx.writeBuffer();
  }
}

module.exports = new ExcelGeneratorService();
