const Media = require('../models/Media');
const logger = require('./logger');

/**
 * Track media usage in a document
 * @param {string} fileUrl - Media file URL
 * @param {string} modelName - Model name (Event, School, Certificate)
 * @param {ObjectId} documentId - Document ID
 * @param {string} fieldName - Field name (e.g., 'banner_image_url')
 */
async function trackMediaUsage(fileUrl, modelName, documentId, fieldName) {
  if (!fileUrl) return;

  try {
    const media = await Media.findOne({ file_url: fileUrl });
    if (!media) {
      logger.warn(`Media not found for URL: ${fileUrl}`);
      return;
    }

    // Check if already tracked
    const alreadyTracked = media.used_in.some(
      usage => usage.model === modelName &&
               usage.document_id.toString() === documentId.toString() &&
               usage.field === fieldName
    );

    if (!alreadyTracked) {
      await Media.updateOne(
        { _id: media._id },
        {
          $addToSet: {
            used_in: {
              model: modelName,
              document_id: documentId,
              field: fieldName
            }
          }
        }
      );
      logger.info(`Tracked media usage: ${fileUrl} in ${modelName}:${documentId}`);
    }
  } catch (error) {
    logger.error('Media tracking error:', error);
    // Don't throw - tracking failure shouldn't block main operation
  }
}

/**
 * Remove media usage tracking
 * @param {string} fileUrl - Media file URL
 * @param {string} modelName - Model name
 * @param {ObjectId} documentId - Document ID
 */
async function untrackMediaUsage(fileUrl, modelName, documentId) {
  if (!fileUrl) return;

  try {
    const media = await Media.findOne({ file_url: fileUrl });
    if (!media) return;

    await Media.updateOne(
      { _id: media._id },
      {
        $pull: {
          used_in: {
            model: modelName,
            document_id: documentId
          }
        }
      }
    );
    logger.info(`Untracked media usage: ${fileUrl} from ${modelName}:${documentId}`);
  } catch (error) {
    logger.error('Media untracking error:', error);
  }
}

module.exports = {
  trackMediaUsage,
  untrackMediaUsage
};
