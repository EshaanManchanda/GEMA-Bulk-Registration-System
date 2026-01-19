const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

/**
 * Local File Storage Service
 * Mirrors CloudinaryService API but stores files on local disk
 * Files are organized in server/uploads/ directory
 */
class LocalStorageService {
  constructor() {
    this.baseDir = path.join(__dirname, '../../uploads');
    this.baseUrl = '/uploads'; // URL prefix for serving static files

    // Ensure base upload directory exists
    this.ensureDir(this.baseDir).catch(err => {
      logger.error('Failed to create base upload directory:', err);
    });
  }

  /**
   * Ensure directory exists, create if not
   * @param {string} dirPath - Directory path
   */
  async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
      logger.info(`Created directory: ${dirPath}`);
    }
  }

  /**
   * Sanitize filename to prevent path traversal and special characters
   * @param {string} filename - Original filename
   * @returns {string} - Sanitized filename
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }

  /**
   * Generate unique filename with timestamp
   * @param {string} originalFilename - Original filename
   * @returns {string} - Unique filename
   */
  generateUniqueFilename(originalFilename) {
    const timestamp = Date.now();
    const sanitized = this.sanitizeFilename(originalFilename);
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    return `${timestamp}-${name}${ext}`;
  }

  /**
   * Upload CSV file
   * @param {Buffer} fileBuffer - File buffer from multer
   * @param {string} filename - Original filename
   * @param {string} batchReference - Batch reference for folder organization
   * @returns {Promise<Object>} - { url, secure_url, public_id, format, bytes, created_at }
   */
  async uploadCSV(fileBuffer, filename, batchReference) {
    try {
      const category = 'csv';
      const folderPath = path.join(this.baseDir, category, batchReference);
      await this.ensureDir(folderPath);

      const uniqueFilename = this.generateUniqueFilename(filename);
      const filePath = path.join(folderPath, uniqueFilename);

      // Write file to disk
      await fs.writeFile(filePath, fileBuffer);

      // Get file stats
      const stats = await fs.stat(filePath);

      const url = `${this.baseUrl}/${category}/${batchReference}/${uniqueFilename}`;
      const publicId = `${category}/${batchReference}/${uniqueFilename}`;

      logger.info(`CSV uploaded to local storage: ${publicId}`);

      return {
        url,
        secure_url: url, // Same as url for local storage
        public_id: publicId,
        format: path.extname(filename).slice(1), // Remove leading dot
        bytes: stats.size,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Local storage CSV upload error:', error);
      throw new AppError('Failed to upload CSV file to local storage', 500);
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
      const category = 'receipts';
      const folderPath = path.join(this.baseDir, category, batchReference);
      await this.ensureDir(folderPath);

      const uniqueFilename = this.generateUniqueFilename(filename);
      const filePath = path.join(folderPath, uniqueFilename);

      // Write file to disk
      await fs.writeFile(filePath, fileBuffer);

      // Get file stats
      const stats = await fs.stat(filePath);

      const url = `${this.baseUrl}/${category}/${batchReference}/${uniqueFilename}`;
      const publicId = `${category}/${batchReference}/${uniqueFilename}`;

      logger.info(`Receipt uploaded to local storage: ${publicId}`);

      return {
        url,
        secure_url: url,
        public_id: publicId,
        format: path.extname(filename).slice(1),
        bytes: stats.size,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Local storage receipt upload error:', error);
      throw new AppError('Failed to upload receipt to local storage', 500);
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
      const category = 'invoices';
      const year = new Date().getFullYear();
      const folderPath = path.join(this.baseDir, category, year.toString());
      await this.ensureDir(folderPath);

      const filename = `invoice_${invoiceNumber}.pdf`;
      const filePath = path.join(folderPath, filename);

      // Write file to disk (overwrite if exists)
      await fs.writeFile(filePath, pdfBuffer);

      // Get file stats
      const stats = await fs.stat(filePath);

      const url = `${this.baseUrl}/${category}/${year}/${filename}`;
      const publicId = `${category}/${year}/${filename}`;

      logger.info(`Invoice uploaded to local storage: ${publicId}`);

      return {
        url,
        secure_url: url,
        public_id: publicId,
        format: 'pdf',
        bytes: stats.size,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Local storage invoice upload error:', error);
      throw new AppError('Failed to upload invoice to local storage', 500);
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
      const category = 'events';
      const folderPath = path.join(this.baseDir, category, eventSlug);
      await this.ensureDir(folderPath);

      const uniqueFilename = this.generateUniqueFilename(filename);
      const filePath = path.join(folderPath, uniqueFilename);

      // Write file to disk
      await fs.writeFile(filePath, imageBuffer);

      // Get file stats
      const stats = await fs.stat(filePath);

      const url = `${this.baseUrl}/${category}/${eventSlug}/${uniqueFilename}`;
      const publicId = `${category}/${eventSlug}/${uniqueFilename}`;

      logger.info(`Event image uploaded to local storage: ${publicId}`);

      return {
        url,
        secure_url: url,
        public_id: publicId,
        format: path.extname(filename).slice(1),
        width: null, // Would need image processing library to get dimensions
        height: null,
        bytes: stats.size,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Local storage event image upload error:', error);
      throw new AppError('Failed to upload event image to local storage', 500);
    }
  }

  /**
   * Delete file from local storage
   * @param {string} publicId - File path relative to uploads directory
   * @param {string} resourceType - Resource type (not used in local storage, kept for API compatibility)
   * @returns {Promise<Object>}
   */
  async deleteFile(publicId, resourceType = 'raw') {
    try {
      const filePath = path.join(this.baseDir, publicId);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        logger.warn(`File not found for deletion: ${publicId}`);
        return { success: false, result: 'not found' };
      }

      // Delete file
      await fs.unlink(filePath);
      logger.info(`File deleted from local storage: ${publicId}`);

      return { success: true, result: 'ok' };
    } catch (error) {
      logger.error('Local storage file deletion error:', error);
      throw new AppError('Failed to delete file from local storage', 500);
    }
  }

  /**
   * Delete multiple files from local storage
   * @param {Array<string>} publicIds - Array of file paths
   * @param {string} resourceType - Resource type (not used in local storage)
   * @returns {Promise<Object>}
   */
  async deleteFiles(publicIds, resourceType = 'raw') {
    try {
      const results = {
        deleted: [],
        not_found: [],
        errors: []
      };

      for (const publicId of publicIds) {
        try {
          const filePath = path.join(this.baseDir, publicId);
          await fs.unlink(filePath);
          results.deleted.push(publicId);
        } catch (error) {
          if (error.code === 'ENOENT') {
            results.not_found.push(publicId);
          } else {
            results.errors.push({ public_id: publicId, error: error.message });
          }
        }
      }

      logger.info(`Bulk delete: ${results.deleted.length} files deleted, ${results.not_found.length} not found, ${results.errors.length} errors`);

      return results;
    } catch (error) {
      logger.error('Local storage bulk delete error:', error);
      throw new AppError('Failed to delete files from local storage', 500);
    }
  }

  /**
   * Get file details from local storage
   * @param {string} publicId - File path relative to uploads directory
   * @param {string} resourceType - Resource type (not used in local storage)
   * @returns {Promise<Object>}
   */
  async getFileDetails(publicId, resourceType = 'raw') {
    try {
      const filePath = path.join(this.baseDir, publicId);

      // Check if file exists and get stats
      const stats = await fs.stat(filePath);

      const url = `${this.baseUrl}/${publicId}`;

      return {
        public_id: publicId,
        format: path.extname(publicId).slice(1),
        bytes: stats.size,
        url,
        secure_url: url,
        created_at: stats.birthtime.toISOString(),
        tags: [] // Local storage doesn't support tags
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn(`File not found: ${publicId}`);
        throw new AppError('File not found', 404);
      }
      logger.error('Get file details error:', error);
      throw new AppError('Failed to get file details', 500);
    }
  }

  /**
   * Get folder contents (list files in a directory)
   * @param {string} folderPath - Folder path relative to uploads directory
   * @param {string} resourceType - Resource type (not used in local storage)
   * @returns {Promise<Array>}
   */
  async getFolderContents(folderPath, resourceType = 'raw') {
    try {
      const dirPath = path.join(this.baseDir, folderPath);

      // Read directory
      const files = await fs.readdir(dirPath, { withFileTypes: true });

      const resources = [];

      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(dirPath, file.name);
          const stats = await fs.stat(filePath);
          const publicId = path.join(folderPath, file.name).replace(/\\/g, '/');
          const url = `${this.baseUrl}/${publicId}`;

          resources.push({
            public_id: publicId,
            url,
            secure_url: url,
            format: path.extname(file.name).slice(1),
            bytes: stats.size,
            created_at: stats.birthtime.toISOString()
          });
        }
      }

      return resources;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn(`Folder not found: ${folderPath}`);
        return [];
      }
      logger.error('Get folder contents error:', error);
      throw new AppError('Failed to get folder contents', 500);
    }
  }

  /**
   * Search files by tag (not supported in local storage)
   * @param {string} tag - Tag to search for
   * @param {string} resourceType - Resource type
   * @returns {Promise<Array>}
   */
  async searchByTag(tag, resourceType = 'raw') {
    logger.warn('searchByTag is not supported in local storage');
    return [];
  }

  /**
   * Get storage usage statistics (simplified for local storage)
   * @returns {Promise<Object>}
   */
  async getUsageStats() {
    try {
      let totalSize = 0;
      let fileCount = 0;

      const calculateDirSize = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            await calculateDirSize(fullPath);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
            fileCount++;
          }
        }
      };

      await calculateDirSize(this.baseDir);

      // Convert bytes to MB for readability
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

      return {
        storage: {
          used: totalSize,
          used_mb: totalSizeMB,
          file_count: fileCount
        },
        provider: 'local',
        base_directory: this.baseDir
      };
    } catch (error) {
      logger.error('Get usage stats error:', error);
      throw new AppError('Failed to get usage statistics', 500);
    }
  }

  /**
   * Generate signed URL (not applicable for local storage, return regular URL)
   * @param {string} publicId - File identifier
   * @param {number} expiresIn - Expiration time in seconds (not used)
   * @returns {string} - URL
   */
  generateSignedUrl(publicId, expiresIn = 3600) {
    logger.warn('Signed URLs are not supported in local storage, returning regular URL');
    return `${this.baseUrl}/${publicId}`;
  }

  /**
   * Upload media to library (for media library management)
   * @param {Buffer} buffer - File buffer
   * @param {String} filename - Original filename
   * @param {Object} options - Upload options (folder, tags, etc.)
   * @returns {Promise<Object>}
   */
  async uploadMedia(buffer, filename, options = {}) {
    try {
      const { folder = 'media' } = options;
      const folderPath = path.join(this.baseDir, folder);
      await this.ensureDir(folderPath);

      const uniqueFilename = this.generateUniqueFilename(filename);
      const filePath = path.join(folderPath, uniqueFilename);

      // Write file to disk
      await fs.writeFile(filePath, buffer);

      // Get file stats
      const stats = await fs.stat(filePath);

      const url = `${this.baseUrl}/${folder}/${uniqueFilename}`;
      const publicId = `${folder}/${uniqueFilename}`;

      logger.info(`Media uploaded to local storage: ${publicId}`);

      return {
        url,
        secure_url: url,
        public_id: publicId,
        format: path.extname(filename).slice(1),
        width: null, // Would need image processing library
        height: null,
        bytes: stats.size,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Local storage media upload error:', error);
      throw new AppError('Failed to upload media to local storage', 500);
    }
  }

  /**
   * Delete media from local storage (for media library)
   * @param {String} publicId - File path relative to uploads directory
   * @param {String} resourceType - Resource type (not used, kept for API compatibility)
   * @returns {Promise<Object>}
   */
  async deleteMedia(publicId, resourceType = 'image') {
    try {
      // Remove /uploads/ prefix if present
      const cleanPublicId = publicId.replace(/^\/uploads\//, '');
      const filePath = path.join(this.baseDir, cleanPublicId);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        logger.warn(`Media not found for deletion: ${publicId}`);
        return { success: true, result: 'not found' };
      }

      // Delete file
      await fs.unlink(filePath);
      logger.info(`Media deleted from local storage: ${publicId}`);

      return { success: true, result: 'ok' };
    } catch (error) {
      logger.error('Local storage media deletion error:', error);
      throw new AppError('Failed to delete media from local storage', 500);
    }
  }
}

// Export singleton instance
module.exports = new LocalStorageService();
