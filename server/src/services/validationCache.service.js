const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Validation Cache Schema
 * Uses MongoDB TTL collection to auto-expire entries after 30 minutes
 */
const validationCacheSchema = new mongoose.Schema({
  validation_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  school_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  event_slug: {
    type: String,
    required: true
  },
  validation_data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now,
    expires: 1800 // Auto-delete after 30 minutes (1800 seconds)
  }
});

const ValidationCache = mongoose.model('ValidationCache', validationCacheSchema);

/**
 * Validation Cache Service
 * Caches Excel validation results to avoid re-parsing on upload
 */
class ValidationCacheService {
  /**
   * Store validation result in cache
   * @param {string} schoolId - School ID
   * @param {string} eventSlug - Event slug
   * @param {object} validationData - Validation result data
   * @returns {Promise<string>} - Validation ID
   */
  async set(schoolId, eventSlug, validationData) {
    try {
      const validationId = uuidv4();

      await ValidationCache.create({
        validation_id: validationId,
        school_id: schoolId,
        event_slug: eventSlug,
        validation_data: validationData
      });

      logger.info(`Validation cached: ${validationId} for school: ${schoolId}, event: ${eventSlug}`);
      return validationId;
    } catch (error) {
      logger.error('Validation cache set error:', error);
      throw error;
    }
  }

  /**
   * Retrieve validation result from cache
   * @param {string} validationId - Validation ID
   * @param {string} schoolId - School ID (for verification)
   * @param {string} eventSlug - Event slug (for verification)
   * @returns {Promise<object|null>} - Validation data or null if not found/expired
   */
  async get(validationId, schoolId, eventSlug) {
    try {
      const cached = await ValidationCache.findOne({
        validation_id: validationId,
        school_id: schoolId,
        event_slug: eventSlug
      });

      if (!cached) {
        logger.warn(`Validation cache miss: ${validationId}`);
        return null;
      }

      logger.info(`Validation cache hit: ${validationId}`);
      return cached.validation_data;
    } catch (error) {
      logger.error('Validation cache get error:', error);
      return null;
    }
  }

  /**
   * Delete validation from cache
   * @param {string} validationId - Validation ID
   * @returns {Promise<boolean>} - True if deleted
   */
  async delete(validationId) {
    try {
      const result = await ValidationCache.deleteOne({ validation_id: validationId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Validation cache delete error:', error);
      return false;
    }
  }

  /**
   * Clear all expired entries (manual cleanup, TTL handles this automatically)
   * @returns {Promise<number>} - Number of deleted entries
   */
  async clearExpired() {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const result = await ValidationCache.deleteMany({
        created_at: { $lt: thirtyMinutesAgo }
      });

      logger.info(`Cleared ${result.deletedCount} expired validation cache entries`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Validation cache clearExpired error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<object>} - Cache stats
   */
  async getStats() {
    try {
      const total = await ValidationCache.countDocuments();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recent = await ValidationCache.countDocuments({
        created_at: { $gte: fiveMinutesAgo }
      });

      return {
        total_entries: total,
        recent_entries: recent,
        avg_age_minutes: total > 0 ? await this._getAverageAge() : 0
      };
    } catch (error) {
      logger.error('Validation cache getStats error:', error);
      return { total_entries: 0, recent_entries: 0, avg_age_minutes: 0 };
    }
  }

  /**
   * Get average age of cache entries in minutes
   * @private
   * @returns {Promise<number>}
   */
  async _getAverageAge() {
    const result = await ValidationCache.aggregate([
      {
        $project: {
          age: { $subtract: [new Date(), '$created_at'] }
        }
      },
      {
        $group: {
          _id: null,
          avgAge: { $avg: '$age' }
        }
      }
    ]);

    if (result.length === 0) return 0;
    return Math.round(result[0].avgAge / 60000); // Convert to minutes
  }
}

module.exports = new ValidationCacheService();
