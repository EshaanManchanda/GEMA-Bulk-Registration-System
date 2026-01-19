const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

/**
 * Cloudinary File Upload Service
 * Handles all file uploads to Cloudinary with different folder structures
 */
class CloudinaryService {
  /**
   * Upload CSV file
   * @param {Buffer} fileBuffer - File buffer from multer
   * @param {string} filename - Original filename
   * @param {string} batchReference - Batch reference for folder organization
   * @returns {Promise<Object>} - { url, public_id, secure_url }
   */
  async uploadCSV(fileBuffer, filename, batchReference) {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `gema/csv/${batchReference}`,
            resource_type: 'raw',
            public_id: filename.replace(/\.[^/.]+$/, ''), // Remove extension
            format: 'csv',
            use_filename: true,
            unique_filename: true,
            overwrite: false,
            tags: ['csv', 'batch-registration', batchReference]
          },
          (error, result) => {
            if (error) {
              logger.error('Cloudinary CSV upload error:', error);
              reject(new AppError('Failed to upload CSV file', 500));
            } else {
              logger.info(`CSV uploaded: ${result.public_id}`);
              resolve({
                url: result.url,
                secure_url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                bytes: result.bytes,
                created_at: result.created_at
              });
            }
          }
        );

        uploadStream.end(fileBuffer);
      });
    } catch (error) {
      logger.error('Upload CSV error:', error);
      throw new AppError('Failed to upload CSV file', 500);
    }
  }

  /**
   * Upload payment receipt (image or PDF)
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} filename - Original filename
   * @param {string} batchReference - Batch reference
   * @param {string} mimeType - File MIME type
   * @returns {Promise<Object>}
   */
  async uploadReceipt(fileBuffer, filename, batchReference, mimeType) {
    try {
      const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `gema/receipts/${batchReference}`,
            resource_type: resourceType,
            public_id: filename.replace(/\.[^/.]+$/, ''),
            use_filename: true,
            unique_filename: true,
            overwrite: false,
            tags: ['receipt', 'offline-payment', batchReference]
          },
          (error, result) => {
            if (error) {
              logger.error('Cloudinary receipt upload error:', error);
              reject(new AppError('Failed to upload receipt', 500));
            } else {
              logger.info(`Receipt uploaded: ${result.public_id}`);
              resolve({
                url: result.url,
                secure_url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                bytes: result.bytes,
                created_at: result.created_at
              });
            }
          }
        );

        uploadStream.end(fileBuffer);
      });
    } catch (error) {
      logger.error('Upload receipt error:', error);
      throw new AppError('Failed to upload receipt', 500);
    }
  }

  /**
   * Upload invoice PDF
   * @param {Buffer} pdfBuffer - PDF buffer
   * @param {string} invoiceNumber - Invoice number for filename
   * @param {string} batchReference - Batch reference
   * @returns {Promise<Object>}
   */
  async uploadInvoice(pdfBuffer, invoiceNumber, batchReference) {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `gema/invoices/${new Date().getFullYear()}`,
            resource_type: 'raw',
            public_id: `invoice_${invoiceNumber}.pdf`,
            access_mode: 'public', // Make invoices publicly accessible
            use_filename: true,
            unique_filename: false,
            overwrite: true, // Allow invoice regeneration
            tags: ['invoice', batchReference, invoiceNumber]
          },
          (error, result) => {
            if (error) {
              logger.error('Cloudinary invoice upload error:', error);
              reject(new AppError('Failed to upload invoice', 500));
            } else {
              logger.info(`Invoice uploaded: ${result.public_id}`);
              resolve({
                url: result.url,
                secure_url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                bytes: result.bytes,
                created_at: result.created_at
              });
            }
          }
        );

        uploadStream.end(pdfBuffer);
      });
    } catch (error) {
      logger.error('Upload invoice error:', error);
      throw new AppError('Failed to upload invoice', 500);
    }
  }

  /**
   * Upload event banner/image
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} filename - Original filename
   * @param {string} eventSlug - Event slug for folder organization
   * @returns {Promise<Object>}
   */
  async uploadEventImage(imageBuffer, filename, eventSlug) {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `gema/events/${eventSlug}`,
            resource_type: 'image',
            public_id: filename.replace(/\.[^/.]+$/, ''),
            transformation: [
              { width: 1200, height: 630, crop: 'limit' }, // Limit max dimensions
              { quality: 'auto' }, // Auto quality
              { fetch_format: 'auto' } // Auto format (WebP for supported browsers)
            ],
            use_filename: true,
            unique_filename: true,
            overwrite: false,
            tags: ['event', 'banner', eventSlug]
          },
          (error, result) => {
            if (error) {
              logger.error('Cloudinary event image upload error:', error);
              reject(new AppError('Failed to upload event image', 500));
            } else {
              logger.info(`Event image uploaded: ${result.public_id}`);
              resolve({
                url: result.url,
                secure_url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                created_at: result.created_at
              });
            }
          }
        );

        uploadStream.end(imageBuffer);
      });
    } catch (error) {
      logger.error('Upload event image error:', error);
      throw new AppError('Failed to upload event image', 500);
    }
  }

  /**
   * Delete file from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @param {string} resourceType - Resource type ('image', 'raw', etc.)
   * @returns {Promise<Object>}
   */
  async deleteFile(publicId, resourceType = 'raw') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true // Invalidate CDN cache
      });

      if (result.result === 'ok') {
        logger.info(`File deleted from Cloudinary: ${publicId}`);
        return { success: true, result };
      } else {
        logger.warn(`Failed to delete file: ${publicId}`, result);
        return { success: false, result };
      }
    } catch (error) {
      logger.error('Delete file error:', error);
      throw new AppError('Failed to delete file', 500);
    }
  }

  /**
   * Delete multiple files from Cloudinary
   * @param {Array<string>} publicIds - Array of public IDs
   * @param {string} resourceType - Resource type
   * @returns {Promise<Object>}
   */
  async deleteFiles(publicIds, resourceType = 'raw') {
    try {
      const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: resourceType,
        invalidate: true
      });

      logger.info(`Bulk delete: ${publicIds.length} files`);
      return result;
    } catch (error) {
      logger.error('Bulk delete error:', error);
      throw new AppError('Failed to delete files', 500);
    }
  }

  /**
   * Get file details from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @param {string} resourceType - Resource type
   * @returns {Promise<Object>}
   */
  async getFileDetails(publicId, resourceType = 'raw') {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType
      });

      return {
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
        url: result.url,
        secure_url: result.secure_url,
        created_at: result.created_at,
        tags: result.tags
      };
    } catch (error) {
      logger.error('Get file details error:', error);
      throw new AppError('Failed to get file details', 500);
    }
  }

  /**
   * Generate signed URL for temporary access
   * @param {string} publicId - Cloudinary public ID
   * @param {number} expiresIn - Expiration time in seconds (default 1 hour)
   * @returns {string} - Signed URL
   */
  generateSignedUrl(publicId, expiresIn = 3600) {
    try {
      const timestamp = Math.floor(Date.now() / 1000) + expiresIn;

      const signature = cloudinary.utils.api_sign_request(
        { public_id: publicId, timestamp },
        process.env.CLOUDINARY_API_SECRET
      );

      const signedUrl = cloudinary.url(publicId, {
        sign_url: true,
        type: 'authenticated',
        expires_at: timestamp
      });

      return signedUrl;
    } catch (error) {
      logger.error('Generate signed URL error:', error);
      throw new AppError('Failed to generate signed URL', 500);
    }
  }

  /**
   * Get folder contents
   * @param {string} folderPath - Folder path (e.g., 'gema/excel')
   * @param {string} resourceType - Resource type
   * @returns {Promise<Array>}
   */
  async getFolderContents(folderPath, resourceType = 'raw') {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        resource_type: resourceType,
        prefix: folderPath,
        max_results: 500
      });

      return result.resources.map(r => ({
        public_id: r.public_id,
        url: r.url,
        secure_url: r.secure_url,
        format: r.format,
        bytes: r.bytes,
        created_at: r.created_at
      }));
    } catch (error) {
      logger.error('Get folder contents error:', error);
      throw new AppError('Failed to get folder contents', 500);
    }
  }

  /**
   * Search files by tag
   * @param {string} tag - Tag to search for
   * @param {string} resourceType - Resource type
   * @returns {Promise<Array>}
   */
  async searchByTag(tag, resourceType = 'raw') {
    try {
      const result = await cloudinary.api.resources_by_tag(tag, {
        resource_type: resourceType,
        max_results: 500
      });

      return result.resources.map(r => ({
        public_id: r.public_id,
        url: r.url,
        secure_url: r.secure_url,
        format: r.format,
        bytes: r.bytes,
        created_at: r.created_at,
        tags: r.tags
      }));
    } catch (error) {
      logger.error('Search by tag error:', error);
      throw new AppError('Failed to search files', 500);
    }
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<Object>}
   */
  async getUsageStats() {
    try {
      const result = await cloudinary.api.usage();

      return {
        used_credits: result.credits.usage,
        used_percent: result.credits.used_percent,
        bandwidth: {
          used: result.bandwidth.usage,
          limit: result.bandwidth.limit,
          used_percent: result.bandwidth.used_percent
        },
        storage: {
          used: result.storage.usage,
          limit: result.storage.limit,
          used_percent: result.storage.used_percent
        },
        resources: result.resources,
        transformations: result.transformations
      };
    } catch (error) {
      logger.error('Get usage stats error:', error);
      throw new AppError('Failed to get usage statistics', 500);
    }
  }

  /**
   * Upload media to library (for media library management)
   * @param {Buffer} buffer - File buffer
   * @param {String} filename - Original filename
   * @param {Object} options - Upload options (folder, tags, transformation)
   * @returns {Promise<Object>}
   */
  async uploadMedia(buffer, filename, options = {}) {
    try {
      const {
        folder = 'gema/media',
        tags = ['media-library'],
        transformation = {}
      } = options;

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'auto',
            public_id: filename.replace(/\.[^/.]+$/, ''),
            tags: tags,
            transformation: {
              quality: 'auto',
              fetch_format: 'auto',
              width: 2000,
              height: 2000,
              crop: 'limit',
              ...transformation
            },
            use_filename: true,
            unique_filename: true,
            overwrite: false
          },
          (error, result) => {
            if (error) {
              logger.error('Cloudinary media upload error:', error);
              reject(new AppError('Failed to upload media', 500));
            } else {
              logger.info(`Media uploaded: ${result.public_id}`);
              resolve({
                url: result.url,
                secure_url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                created_at: result.created_at
              });
            }
          }
        );

        uploadStream.end(buffer);
      });
    } catch (error) {
      logger.error('Upload media error:', error);
      throw new AppError('Failed to upload media', 500);
    }
  }

  /**
   * Delete media from Cloudinary (for media library)
   * @param {String} publicId - Cloudinary public ID
   * @param {String} resourceType - Resource type ('image', 'raw', etc.)
   * @returns {Promise<Object>}
   */
  async deleteMedia(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true
      });

      if (result.result === 'ok' || result.result === 'not found') {
        logger.info(`Media deleted from Cloudinary: ${publicId}`);
        return { success: true, result };
      } else {
        logger.warn(`Failed to delete media: ${publicId}`, result);
        return { success: false, result };
      }
    } catch (error) {
      logger.error('Delete media error:', error);
      throw new AppError('Failed to delete media', 500);
    }
  }
}

// Export singleton instance
module.exports = new CloudinaryService();
