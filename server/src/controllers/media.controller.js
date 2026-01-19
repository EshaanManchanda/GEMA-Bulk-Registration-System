const Media = require('../models/Media');
const asyncHandler = require('../middleware/async.middleware');
const AppError = require('../utils/appError');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

/**
 * @desc    Serve media file (public endpoint - hides storage implementation)
 * @route   GET /api/v1/media/serve/:id
 * @access  Public
 */
exports.serveMedia = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Get media record from database
  const media = await Media.findById(id);

  if (!media) {
    return next(new AppError('Media not found', 404));
  }

  // Backwards compatibility: fallback for unmigrated records
  if (!media.storage_url && media.storage_provider === 'local') {
    media.storage_url = `/uploads/${media.public_id}`;
    await media.save();
  }

  // Handle based on storage provider
  if (media.storage_provider === 'local') {
    // Local storage - stream file from filesystem
    try {
      // Build file path from public_id
      const uploadsDir = path.join(__dirname, '../../uploads');
      const filePath = path.join(uploadsDir, media.public_id);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        logger.error(`Media file not found: ${filePath}`);
        return next(new AppError('Media file not found on disk', 404));
      }

      // Set headers
      res.set({
        'Content-Type': media.mime_type || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000', // 1 year cache
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      });

      // Stream file
      const fileStream = require('fs').createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        logger.error('File stream error:', error);
        if (!res.headersSent) {
          return next(new AppError('Error streaming file', 500));
        }
      });
    } catch (error) {
      logger.error('Local media serve error:', error);
      return next(new AppError('Failed to serve media', 500));
    }
  } else if (media.storage_provider === 'cloudinary') {
    // Cloudinary - proxy through backend to hide Cloudinary URL
    if (!media.storage_url) {
      return next(new AppError('Media storage URL not available', 404));
    }

    try {
      const axios = require('axios');
      const response = await axios.get(media.storage_url, {
        responseType: 'stream'
      });

      res.set({
        'Content-Type': media.mime_type || response.headers['content-type'],
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      });

      response.data.pipe(res);
    } catch (error) {
      logger.error('Cloudinary proxy error:', error);
      return next(new AppError('Failed to serve media', 500));
    }
  } else {
    return next(new AppError('Unknown storage provider', 500));
  }
});
