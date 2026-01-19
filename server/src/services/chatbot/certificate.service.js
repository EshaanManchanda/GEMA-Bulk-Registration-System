const axios = require('axios');

/**
 * Generate certificate for a student
 * @param {Object} event - Event document from DB
 * @param {string} email - Student email
 * @param {string} country - Student country ('India' or other)
 * @returns {Object} { success, data/error }
 */
const generateCertificate = async (event, email, country) => {
  try {
    // Determine which config to use based on country
    const isIndia = country === 'India';
    const config = isIndia ? event.certificate_config_india : event.certificate_config_international;

    if (!config || !config.enabled) {
      return {
        success: false,
        error: `Certificate generation is not enabled for ${event.title} (${isIndia ? 'India' : 'International'})`
      };
    }

    if (!config.certificate_issuance_url || !config.api_key) {
      return {
        success: false,
        error: 'Certificate generation is not properly configured for this event'
      };
    }

    console.log(`Generating certificate for ${email} at ${config.certificate_issuance_url}`);

    const response = await axios.post(config.certificate_issuance_url, {
      student_email: email,
      template_id: config.template_id
    }, {
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('Certificate generated successfully:', response.data);

    return {
      success: true,
      data: {
        download_url: response.data.download_url || response.data.certificate_url,
        website_url: config.website_url,
        template_id: config.template_id
      }
    };

  } catch (error) {
    console.error('Certificate generation error:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'Student not found with the provided email address'
      };
    }

    if (error.response?.status === 400) {
      return {
        success: false,
        error: error.response.data.message || 'Invalid request to certificate service'
      };
    }

    return {
      success: false,
      error: 'Failed to generate certificate. Please try again later'
    };
  }
};

/**
 * Check if certificate generation is available for an event
 * @param {Object} event - Event document
 * @param {string} country - Country ('India' or other)
 * @returns {boolean}
 */
const isCertificateAvailable = (event, country) => {
  const config = country === 'India' ? event.certificate_config_india : event.certificate_config_international;
  return config && config.enabled && config.certificate_issuance_url && config.api_key;
};

module.exports = {
  generateCertificate,
  isCertificateAvailable
};
