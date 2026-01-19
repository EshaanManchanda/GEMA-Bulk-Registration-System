const Papa = require('papaparse');
const logger = require('../utils/logger');
const { formatDate } = require('../utils/helpers');

/**
 * CSV Export Service
 * Generates CSV exports for admin and batch downloads
 */
class CsvExportService {
  /**
   * Generate CSV export for event registrations (admin export)
   * @param {Array} registrations - Registration documents with populated relations
   * @param {Array} formSchema - Event form schema
   * @returns {Buffer} - CSV file buffer with UTF-8 BOM
   */
  generateRegistrationsCSV(registrations, formSchema) {
    try {
      // Build headers
      const headers = [
        'Registration ID',
        'School Name',
        'School Code',
        'Student Name',
        'Grade',
        'Section'
      ];

      // Add dynamic columns from form_schema
      if (formSchema && formSchema.length > 0) {
        formSchema.forEach(field => {
          headers.push(field.field_label);
        });
      }

      // Add batch and payment columns
      headers.push(
        'Batch Reference',
        'Payment Status',
        'Payment Mode',
        'Total Amount',
        'Currency',
        'Registered On'
      );

      // Build data rows
      const data = registrations.map(reg => {
        const row = {
          'Registration ID': reg.registration_id,
          'School Name': reg.school_id?.name || 'N/A',
          'School Code': reg.school_id?.school_code || 'N/A',
          'Student Name': reg.student_name,
          'Grade': reg.grade,
          'Section': reg.section || ''
        };

        // Add dynamic data
        if (formSchema && formSchema.length > 0) {
          formSchema.forEach(field => {
            const value = reg.dynamic_data?.get(field.field_id);
            row[field.field_label] = this._formatFieldValue(value, field.field_type);
          });
        }

        // Add batch and payment data
        row['Batch Reference'] = reg.batch_id?.batch_reference || 'N/A';
        row['Payment Status'] = reg.batch_id?.payment_status || 'pending';
        row['Payment Mode'] = reg.batch_id?.payment_mode || '';
        row['Total Amount'] = reg.batch_id?.total_amount || 0;
        row['Currency'] = reg.batch_id?.currency || '';
        row['Registered On'] = formatDate(reg.created_at);

        return row;
      });

      // Generate CSV using PapaParse
      const csv = Papa.unparse({
        fields: headers,
        data: data
      }, {
        quotes: true,
        delimiter: ',',
        header: true
      });

      // Add UTF-8 BOM for Excel compatibility
      const buffer = Buffer.from('\ufeff' + csv, 'utf-8');

      logger.info(`CSV export generated: ${registrations.length} registrations`);
      return buffer;

    } catch (error) {
      logger.error('CSV registrations export error:', error);
      throw new Error(`Failed to generate CSV export: ${error.message}`);
    }
  }

  /**
   * Generate CSV export for single batch (batch download)
   * @param {Object} batch - Batch document
   * @param {Array} registrations - Registration documents
   * @param {Array} formSchema - Event form schema
   * @returns {Buffer} - CSV file buffer with UTF-8 BOM
   */
  generateBatchCSV(batch, registrations, formSchema) {
    try {
      // Build headers
      const headers = [
        'S.No',
        'Student Name',
        'Grade',
        'Section'
      ];

      // Add dynamic columns from form_schema
      if (formSchema && formSchema.length > 0) {
        formSchema.forEach(field => {
          headers.push(field.field_label);
        });
      }

      headers.push('Registration ID', 'Registered On');

      // Build data rows
      const data = registrations.map((reg, index) => {
        const row = {
          'S.No': index + 1,
          'Student Name': reg.student_name,
          'Grade': reg.grade,
          'Section': reg.section || ''
        };

        // Add dynamic data
        if (formSchema && formSchema.length > 0) {
          formSchema.forEach(field => {
            const value = reg.dynamic_data?.get(field.field_id);
            row[field.field_label] = this._formatFieldValue(value, field.field_type);
          });
        }

        row['Registration ID'] = reg.registration_id;
        row['Registered On'] = formatDate(reg.created_at);

        return row;
      });

      // Generate CSV using PapaParse
      const csv = Papa.unparse({
        fields: headers,
        data: data
      }, {
        quotes: true,
        delimiter: ',',
        header: true
      });

      // Add UTF-8 BOM for Excel compatibility
      const buffer = Buffer.from('\ufeff' + csv, 'utf-8');

      logger.info(`Batch CSV generated: ${batch.batch_reference} (${registrations.length} students)`);
      return buffer;

    } catch (error) {
      logger.error('Batch CSV export error:', error);
      throw new Error(`Failed to generate batch CSV: ${error.message}`);
    }
  }

  /**
   * Format field value based on type for CSV export
   * @private
   * @param {*} value - Field value
   * @param {string} type - Field type
   * @returns {string} - Formatted value
   */
  _formatFieldValue(value, type) {
    if (value === null || value === undefined) {
      return '';
    }

    switch (type?.toLowerCase()) {
      case 'checkbox':
        // Convert boolean to Yes/No
        if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No';
        }
        // Handle string representations
        const normalizedValue = String(value).toLowerCase();
        if (['yes', 'true', '1'].includes(normalizedValue)) return 'Yes';
        if (['no', 'false', '0'].includes(normalizedValue)) return 'No';
        return String(value);

      case 'date':
        // If value is Date object, format it
        if (value instanceof Date) {
          return formatDate(value);
        }
        return String(value);

      case 'number':
        // Ensure number format
        if (typeof value === 'number') {
          return value.toString();
        }
        return String(value);

      default:
        return String(value);
    }
  }

  /**
   * Generate filename for registration export
   * @param {string} eventSlug - Event slug
   * @returns {string} - Filename
   */
  generateRegistrationsFilename(eventSlug) {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    return `${eventSlug}_registrations_${dateStr}.csv`;
  }

  /**
   * Generate filename for batch export
   * @param {string} batchReference - Batch reference
   * @returns {string} - Filename
   */
  generateBatchFilename(batchReference) {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    return `${batchReference}_${dateStr}.csv`;
  }

  /**
   * Generate CSV export for schools
   * @param {Array} schools - School documents
   * @returns {Buffer} - CSV file buffer with UTF-8 BOM
   */
  generateSchoolsCSV(schools) {
    try {
      const headers = [
        'School Code',
        'School Name',
        'Country',
        'Currency Preference',
        'Contact Person',
        'Contact Designation',
        'Contact Email',
        'Contact Phone',
        'Address',
        'City',
        'State',
        'Postal Code',
        'Status',
        'Verified',
        'Registered On'
      ];

      const data = schools.map(school => ({
        'School Code': school.school_code,
        'School Name': school.name,
        'Country': school.country,
        'Currency Preference': school.currency_pref,
        'Contact Person': school.contact_person?.name || '',
        'Contact Designation': school.contact_person?.designation || '',
        'Contact Email': school.contact_person?.email || '',
        'Contact Phone': school.contact_person?.phone || '',
        'Address': school.address?.street || '',
        'City': school.address?.city || '',
        'State': school.address?.state || '',
        'Postal Code': school.address?.postal_code || '',
        'Status': school.is_active ? 'Active' : 'Inactive',
        'Verified': school.is_verified ? 'Yes' : 'No',
        'Registered On': formatDate(school.created_at)
      }));

      const csv = Papa.unparse({ fields: headers, data }, {
        quotes: true,
        delimiter: ',',
        header: true
      });

      const buffer = Buffer.from('\ufeff' + csv, 'utf-8');
      logger.info(`Schools CSV export generated: ${schools.length} schools`);
      return buffer;
    } catch (error) {
      logger.error('Schools CSV export error:', error);
      throw new Error(`Failed to generate schools CSV: ${error.message}`);
    }
  }

  /**
   * Generate CSV export for events
   * @param {Array} events - Event documents
   * @returns {Buffer} - CSV file buffer with UTF-8 BOM
   */
  generateEventsCSV(events) {
    try {
      const headers = [
        'Event Title',
        'Slug',
        'Status',
        'Category',
        'Base Fee (INR)',
        'Base Fee (USD)',
        'Event Start Date',
        'Event End Date',
        'Registration Deadline',
        'Max Participants',
        'Registration Count',
        'View Count',
        'Featured',
        'Created On'
      ];

      const data = events.map(event => ({
        'Event Title': event.title,
        'Slug': event.event_slug,
        'Status': event.status,
        'Category': event.category || '',
        'Base Fee (INR)': event.base_fee_inr,
        'Base Fee (USD)': event.base_fee_usd,
        'Event Start Date': formatDate(event.event_start_date),
        'Event End Date': formatDate(event.event_end_date),
        'Registration Deadline': formatDate(event.registration_deadline),
        'Max Participants': event.max_participants || 'Unlimited',
        'Registration Count': event.registration_count || 0,
        'View Count': event.view_count || 0,
        'Featured': event.is_featured ? 'Yes' : 'No',
        'Created On': formatDate(event.created_at)
      }));

      const csv = Papa.unparse({ fields: headers, data }, {
        quotes: true,
        delimiter: ',',
        header: true
      });

      const buffer = Buffer.from('\ufeff' + csv, 'utf-8');
      logger.info(`Events CSV export generated: ${events.length} events`);
      return buffer;
    } catch (error) {
      logger.error('Events CSV export error:', error);
      throw new Error(`Failed to generate events CSV: ${error.message}`);
    }
  }

  /**
   * Generate CSV export for all registrations (admin export without form schema)
   * @param {Array} registrations - Registration documents with populated relations
   * @returns {Buffer} - CSV file buffer with UTF-8 BOM
   */
  generateAllRegistrationsCSV(registrations) {
    try {
      const headers = [
        'Registration ID',
        'School Code',
        'School Name',
        'Event Title',
        'Student Name',
        'Grade',
        'Section',
        'Batch Reference',
        'Payment Status',
        'Payment Mode',
        'Total Amount',
        'Currency',
        'Registered On'
      ];

      const data = registrations.map(reg => ({
        'Registration ID': reg.registration_id,
        'School Code': reg.school_id?.school_code || 'N/A',
        'School Name': reg.school_id?.name || 'N/A',
        'Event Title': reg.event_id?.title || 'N/A',
        'Student Name': reg.student_name,
        'Grade': reg.grade,
        'Section': reg.section || '',
        'Batch Reference': reg.batch_id?.batch_reference || 'N/A',
        'Payment Status': reg.batch_id?.payment_status || 'pending',
        'Payment Mode': reg.batch_id?.payment_mode || '',
        'Total Amount': reg.batch_id?.total_amount || 0,
        'Currency': reg.batch_id?.currency || '',
        'Registered On': formatDate(reg.created_at)
      }));

      const csv = Papa.unparse({ fields: headers, data }, {
        quotes: true,
        delimiter: ',',
        header: true
      });

      const buffer = Buffer.from('\ufeff' + csv, 'utf-8');
      logger.info(`All registrations CSV export generated: ${registrations.length} registrations`);
      return buffer;
    } catch (error) {
      logger.error('All registrations CSV export error:', error);
      throw new Error(`Failed to generate registrations CSV: ${error.message}`);
    }
  }

  /**
   * Generate CSV export for payments
   * @param {Array} payments - Payment documents with populated relations
   * @returns {Buffer} - CSV file buffer with UTF-8 BOM
   */
  generatePaymentsCSV(payments) {
    try {
      const headers = [
        'Payment Reference',
        'Batch Reference',
        'School Code',
        'School Name',
        'Event Title',
        'Amount',
        'Currency',
        'Payment Gateway',
        'Payment Mode',
        'Payment Method',
        'Status',
        'Gateway Payment ID',
        'Gateway Order ID',
        'Transaction Reference',
        'Paid At',
        'Created On'
      ];

      const data = payments.map(payment => ({
        'Payment Reference': payment.payment_reference,
        'Batch Reference': payment.batch_id?.batch_reference || 'N/A',
        'School Code': payment.school_id?.school_code || 'N/A',
        'School Name': payment.school_id?.name || 'N/A',
        'Event Title': payment.event_id?.title || 'N/A',
        'Amount': payment.amount,
        'Currency': payment.currency,
        'Payment Gateway': payment.payment_gateway || 'N/A',
        'Payment Mode': payment.payment_mode,
        'Payment Method': payment.payment_method || '',
        'Status': payment.status,
        'Gateway Payment ID': payment.gateway_payment_id || '',
        'Gateway Order ID': payment.gateway_order_id || '',
        'Transaction Reference': payment.offline_payment_details?.transaction_reference || '',
        'Paid At': payment.paid_at ? formatDate(payment.paid_at) : '',
        'Created On': formatDate(payment.created_at)
      }));

      const csv = Papa.unparse({ fields: headers, data }, {
        quotes: true,
        delimiter: ',',
        header: true
      });

      const buffer = Buffer.from('\ufeff' + csv, 'utf-8');
      logger.info(`Payments CSV export generated: ${payments.length} payments`);
      return buffer;
    } catch (error) {
      logger.error('Payments CSV export error:', error);
      throw new Error(`Failed to generate payments CSV: ${error.message}`);
    }
  }

  /**
   * Generate generic filename for exports
   * @param {string} type - Export type (e.g., 'schools', 'events')
   * @returns {string} - Filename
   */
  generateExportFilename(type) {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    return `${type}_${dateStr}.csv`;
  }
}

// Export singleton instance
module.exports = new CsvExportService();
