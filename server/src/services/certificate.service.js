const axios = require('axios');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

/**
 * Certificate Service
 * Handles integration with external WordPress certificate generation plugin
 */
class CertificateService {
  /**
   * Validate API key with certificate plugin
   * @param {string} keyValidationUrl - URL for API key validation
   * @param {string} apiKey - API key to validate
   * @returns {Promise<boolean>} - Whether API key is valid
   */
  async validateApiKey(keyValidationUrl, apiKey) {
    try {
      const response = await axios.post(keyValidationUrl, {
        api_key: apiKey
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data.valid === true || response.status === 200;
    } catch (error) {
      logger.error('Certificate API key validation failed:', error.message);
      throw new AppError('Failed to validate certificate API key', 500);
    }
  }

  /**
   * Check certificate service health
   * @param {string} healthCheckUrl - URL for health check
   * @returns {Promise<boolean>} - Whether service is healthy
   */
  async checkHealth(healthCheckUrl) {
    try {
      const response = await axios.get(healthCheckUrl, {
        timeout: 10000
      });

      return response.data.status === 'ok' || response.status === 200;
    } catch (error) {
      logger.warn('Certificate service health check failed:', error.message);
      return false;
    }
  }

  /**
   * Issue certificate for a student
   * @param {string} apiUrl - Certificate issuance API URL
   * @param {string} apiKey - API key for authentication
   * @param {Object} studentData - Student certificate data
   * @returns {Promise<Object>} - Certificate result with URL and ID
   */
  async issueCertificate(apiUrl, apiKey, studentData) {
    try {
      const response = await axios.post(apiUrl, {
        api_key: apiKey,
        student_name: studentData.student_name,
        event_name: studentData.event_name,
        achievement: studentData.achievement || 'Participation',
        issue_date: studentData.issue_date || new Date().toISOString(),
        certificate_id: studentData.certificate_id,
        template_id: studentData.template_id,
        ...studentData.additional_fields
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.certificate_url) {
        throw new Error('Certificate URL not returned from API');
      }

      logger.info(`Certificate issued: ${studentData.certificate_id}`);

      return {
        success: true,
        certificate_url: response.data.certificate_url,
        certificate_id: response.data.certificate_id || studentData.certificate_id,
        issued_at: new Date()
      };
    } catch (error) {
      logger.error(`Certificate generation failed for ${studentData.student_name}:`, error.message);
      throw new AppError(`Certificate generation failed: ${error.message}`, 500);
    }
  }

  /**
   * Bulk issue certificates for all students in registrations
   * @param {Object} event - Event document with certificate_config_india and certificate_config_international
   * @param {Array} registrations - Array of registration documents
   * @param {Object} batch - Batch document with currency field
   * @returns {Promise<Array>} - Array of certificate results
   */
  async issueBatchCertificates(event, registrations, batch) {
    // Determine which config to use based on batch currency
    const isIndia = batch.currency === 'INR';
    const certificateConfig = isIndia
      ? event.certificate_config_india
      : event.certificate_config_international;

    if (!certificateConfig || !certificateConfig.enabled) {
      throw new AppError(
        `Certificates are not enabled for ${isIndia ? 'India' : 'International'} region`,
        400
      );
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const registration of registrations) {
      try {
        const certificateData = {
          student_name: registration.student_name,
          event_name: event.title,
          certificate_id: `${batch.batch_reference}-${registration._id}`,
          template_id: certificateConfig.template_id,
          issue_date: new Date().toISOString(),
          achievement: 'Participation',
          additional_fields: {
            grade: registration.grade,
            section: registration.section,
            school_code: registration.school_id?.school_code
          }
        };

        const cert = await this.issueCertificate(
          certificateConfig.certificate_issuance_url,
          certificateConfig.api_key,
          certificateData
        );

        results.push({
          registration_id: registration._id,
          student_name: registration.student_name,
          success: true,
          certificate_url: cert.certificate_url,
          certificate_id: cert.certificate_id,
          issued_at: cert.issued_at
        });

        successCount++;
      } catch (error) {
        results.push({
          registration_id: registration._id,
          student_name: registration.student_name,
          success: false,
          error: error.message
        });

        failCount++;
      }
    }

    logger.info(`Batch certificate generation completed: ${successCount} success, ${failCount} failed`);

    return {
      total: results.length,
      success: successCount,
      failed: failCount,
      results
    };
  }

  /**
   * Test certificate configuration for both India and International regions
   * @param {Object} certificateConfigIndia - India certificate configuration
   * @param {Object} certificateConfigInternational - International certificate configuration
   * @returns {Promise<Object>} - Test results for both regions
   */
  async testConfiguration(certificateConfigIndia, certificateConfigInternational) {
    const results = {
      india: null,
      international: null
    };

    // Test India config
    if (certificateConfigIndia?.enabled) {
      results.india = await this._testSingleConfig(certificateConfigIndia, 'India');
    }

    // Test International config
    if (certificateConfigInternational?.enabled) {
      results.international = await this._testSingleConfig(certificateConfigInternational, 'International');
    }

    return results;
  }

  /**
   * Test single certificate configuration
   * @param {Object} config - Certificate configuration object
   * @param {string} region - Region name (India/International)
   * @returns {Promise<Object>} - Test results
   */
  async _testSingleConfig(config, region) {
    const results = {
      region,
      api_key_valid: false,
      service_healthy: false,
      errors: []
    };

    // Test health check
    if (config.health_check_url) {
      try {
        results.service_healthy = await this.checkHealth(config.health_check_url);
      } catch (error) {
        results.errors.push(`Health check failed: ${error.message}`);
      }
    }

    // Test API key validation
    if (config.key_validation_url && config.api_key) {
      try {
        results.api_key_valid = await this.validateApiKey(
          config.key_validation_url,
          config.api_key
        );
      } catch (error) {
        results.errors.push(`API key validation failed: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Fetch certificate by student email
   * @param {string} apiUrl - Certificate issuance API URL
   * @param {string} apiKey - API key for Bearer authentication
   * @param {string} studentEmail - Student's email address
   * @returns {Promise<Object>} - Certificate result with download URL
   */
  async fetchCertificateByEmail(apiUrl, apiKey, studentEmail) {
    try {
      const response = await axios.post(apiUrl, {
        student_email: studentEmail
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.data.status === 'success' && response.data.download_url) {
        logger.info(`Certificate fetched for email: ${studentEmail}`);

        return {
          success: true,
          download_url: response.data.download_url,
          message: response.data.message || 'Certificate fetched successfully'
        };
      } else {
        throw new Error(response.data.message || 'Certificate not found or not available');
      }
    } catch (error) {
      logger.error(`Certificate fetch failed for ${studentEmail}:`, error.message);

      if (error.response?.data?.message) {
        throw new AppError(error.response.data.message, error.response.status || 400);
      }

      throw new AppError(`Failed to fetch certificate: ${error.message}`, 500);
    }
  }
}

module.exports = new CertificateService();
