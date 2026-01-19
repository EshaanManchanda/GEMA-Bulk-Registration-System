const cloudinaryService = require('./cloudinary.service');
const localStorageService = require('./localStorage.service');
const logger = require('../utils/logger');

/**
 * Storage Service Factory
 * Provides unified interface for file storage operations
 * Delegates to either CloudinaryService or LocalStorageService based on MEDIA_PROVIDER env variable
 */
class StorageService {
  constructor() {
    this.provider = process.env.MEDIA_PROVIDER || 'cloudinary';
    this.service = this.provider === 'local' ? localStorageService : cloudinaryService;

    logger.info(`Storage service initialized with provider: ${this.provider}`);
  }

  /**
   * Upload CSV file
   * @param {Buffer} fileBuffer - File buffer from multer
   * @param {string} filename - Original filename
   * @param {string} batchReference - Batch reference for folder organization
   * @returns {Promise<Object>} - { url, secure_url, public_id, ... }
   */
  async uploadCSV(fileBuffer, filename, batchReference) {
    try {
      logger.info(`Uploading CSV file via ${this.provider}: ${filename}`);
      return await this.service.uploadCSV(fileBuffer, filename, batchReference);
    } catch (error) {
      logger.error(`CSV upload failed (${this.provider}):`, error);
      throw error;
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
      logger.info(`Uploading receipt via ${this.provider}: ${filename}`);
      return await this.service.uploadReceipt(fileBuffer, filename, batchReference, mimeType);
    } catch (error) {
      logger.error(`Receipt upload failed (${this.provider}):`, error);
      throw error;
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
      logger.info(`Uploading invoice via ${this.provider}: ${invoiceNumber}`);
      return await this.service.uploadInvoice(pdfBuffer, invoiceNumber, batchReference);
    } catch (error) {
      logger.error(`Invoice upload failed (${this.provider}):`, error);
      throw error;
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
      logger.info(`Uploading event image via ${this.provider}: ${filename}`);
      return await this.service.uploadEventImage(imageBuffer, filename, eventSlug);
    } catch (error) {
      logger.error(`Event image upload failed (${this.provider}):`, error);
      throw error;
    }
  }

  /**
   * Upload media to library (for media library management)
   * @param {Buffer} buffer - File buffer
   * @param {string} filename - Original filename
   * @param {Object} options - Upload options (folder, tags, transformation)
   * @returns {Promise<Object>}
   */
  async uploadMedia(buffer, filename, options = {}) {
    try {
      logger.info(`Uploading media via ${this.provider}: ${filename}`);
      return await this.service.uploadMedia(buffer, filename, options);
    } catch (error) {
      logger.error(`Media upload failed (${this.provider}):`, error);
      throw error;
    }
  }

  /**
   * Delete media from storage (for media library)
   * @param {string} publicIdOrPath - Cloudinary public_id or local file path
   * @param {string} resourceType - Resource type ('image', 'raw', etc.)
   * @returns {Promise<Object>}
   */
  async deleteMedia(publicIdOrPath, resourceType = 'image') {
    try {
      logger.info(`Deleting media via ${this.provider}: ${publicIdOrPath}`);
      return await this.service.deleteMedia(publicIdOrPath, resourceType);
    } catch (error) {
      logger.error(`Media deletion failed (${this.provider}):`, error);
      throw error;
    }
  }

  /**
   * Delete file
   * @param {string} publicId - File identifier (Cloudinary public_id or local file path)
   * @param {string} resourceType - Resource type ('image', 'raw', etc.)
   * @returns {Promise<Object>}
   */
  async deleteFile(publicId, resourceType = 'raw') {
    try {
      logger.info(`Deleting file via ${this.provider}: ${publicId}`);
      return await this.service.deleteFile(publicId, resourceType);
    } catch (error) {
      logger.error(`File deletion failed (${this.provider}):`, error);
      throw error;
    }
  }

  /**
   * Delete multiple files
   * @param {Array<string>} publicIds - Array of file identifiers
   * @param {string} resourceType - Resource type
   * @returns {Promise<Object>}
   */
  async deleteFiles(publicIds, resourceType = 'raw') {
    try {
      logger.info(`Deleting ${publicIds.length} files via ${this.provider}`);
      return await this.service.deleteFiles(publicIds, resourceType);
    } catch (error) {
      logger.error(`Bulk file deletion failed (${this.provider}):`, error);
      throw error;
    }
  }

  /**
   * Get file details
   * @param {string} publicId - File identifier
   * @param {string} resourceType - Resource type
   * @returns {Promise<Object>}
   */
  async getFileDetails(publicId, resourceType = 'raw') {
    try {
      return await this.service.getFileDetails(publicId, resourceType);
    } catch (error) {
      logger.error(`Get file details failed (${this.provider}):`, error);
      throw error;
    }
  }

  /**
   * Get current storage provider
   * @returns {string} - 'local' or 'cloudinary'
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Check if using local storage
   * @returns {boolean}
   */
  isLocal() {
    return this.provider === 'local';
  }

  /**
   * Check if using cloudinary
   * @returns {boolean}
   */
  isCloudinary() {
    return this.provider === 'cloudinary';
  }
}

// Export singleton instance
module.exports = new StorageService();
