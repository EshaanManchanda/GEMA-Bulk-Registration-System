const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

/**
 * Cloudinary Configuration
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Verify connection
const verifyCloudinaryConnection = async () => {
  try {
    // Check if Cloudinary credentials are configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      logger.warn('Cloudinary credentials not configured. File upload service disabled.');
      return;
    }

    await cloudinary.api.ping();
    logger.info('Cloudinary connection successful');
  } catch (error) {
    logger.error('Cloudinary connection failed:', error.message);
  }
};

// Verify on startup (non-blocking)
if (process.env.NODE_ENV !== 'test') {
  verifyCloudinaryConnection();
}

module.exports = cloudinary;
