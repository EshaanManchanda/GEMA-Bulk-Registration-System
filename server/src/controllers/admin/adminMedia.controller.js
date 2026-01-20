const Media = require('../../models/Media');
const storageService = require('../../services/storage.service');
const asyncHandler = require('../../middleware/async.middleware');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');
const path = require('path');
const mongoose = require('mongoose');

/**
 * @desc    Upload media files
 * @route   POST /api/v1/admin/media/upload
 * @access  Private (Admin)
 */
exports.uploadMedia = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('No files uploaded', 400));
  }

  const { folder = 'media', tags = '' } = req.body;
  const tagArray = tags ? tags.split(',').map(t => t.trim()) : [];

  const uploadPromises = req.files.map(async (file) => {
    // Upload to storage
    const uploadResult = await storageService.uploadMedia(
      file.buffer,
      file.originalname,
      { folder, tags: ['media-library', ...tagArray] }
    );

    // Get image dimensions (if image)
    let dimensions = {};
    if (file.mimetype.startsWith('image/')) {
      try {
        const sharp = require('sharp');
        const metadata = await sharp(file.buffer).metadata();
        dimensions = { width: metadata.width, height: metadata.height };
      } catch (error) {
        console.error('Failed to get image dimensions:', error);
      }
    }

    // Generate ObjectId first to construct file_url before creating record
    const mediaId = new mongoose.Types.ObjectId();
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const file_url = `${baseUrl}/api/v1/media/serve/${mediaId}`;

    logger.info(`Creating media record: ${file.originalname}`, {
      mediaId,
      baseUrl,
      file_url,
      uploadResult: {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url
      }
    });

    // Create media record with pre-generated _id and file_url
    const media = await Media.create({
      _id: mediaId,
      filename: path.basename(uploadResult.secure_url),
      original_filename: file.originalname,
      storage_url: uploadResult.secure_url,
      file_url,
      public_id: uploadResult.public_id,
      file_type: file.mimetype.startsWith('image/') ? 'image' : 'other',
      mime_type: file.mimetype,
      file_size: file.size,
      dimensions,
      folder,
      tags: tagArray,
      storage_provider: process.env.MEDIA_PROVIDER || 'cloudinary',
      uploaded_by: req.user.id
    });

    return media;
  });

  const uploadedMedia = await Promise.all(uploadPromises);

  res.status(201).json({
    status: 'success',
    message: `${uploadedMedia.length} file(s) uploaded successfully`,
    data: { media: uploadedMedia }
  });
});

/**
 * @desc    Get all media with filters
 * @route   GET /api/v1/admin/media
 * @access  Private (Admin)
 */
exports.getAllMedia = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 24,
    file_type,
    search,
    tags,
    sort = '-uploaded_at'
  } = req.query;

  const query = {};

  if (file_type) query.file_type = file_type;
  if (search) {
    query.$or = [
      { original_filename: { $regex: search, $options: 'i' } },
      { alt_text: { $regex: search, $options: 'i' } },
      { caption: { $regex: search, $options: 'i' } }
    ];
  }
  if (tags) {
    const tagArray = tags.split(',').map(t => t.trim());
    query.tags = { $in: tagArray };
  }

  const media = await Media.find(query)
    .populate('uploaded_by', 'name email')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Media.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      media,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Get single media details
 * @route   GET /api/v1/admin/media/:mediaId
 * @access  Private (Admin)
 */
exports.getMediaDetails = asyncHandler(async (req, res, next) => {
  const media = await Media.findById(req.params.mediaId)
    .populate('uploaded_by', 'name email')
    .populate('used_in.document_id');

  if (!media) {
    return next(new AppError('Media not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { media }
  });
});

/**
 * @desc    Update media metadata
 * @route   PUT /api/v1/admin/media/:mediaId
 * @access  Private (Admin)
 */
exports.updateMedia = asyncHandler(async (req, res, next) => {
  const { alt_text, caption, tags } = req.body;

  const media = await Media.findById(req.params.mediaId);
  if (!media) {
    return next(new AppError('Media not found', 404));
  }

  if (alt_text !== undefined) media.alt_text = alt_text;
  if (caption !== undefined) media.caption = caption;
  if (tags) media.tags = tags.split(',').map(t => t.trim());

  media.last_modified = Date.now();
  await media.save();

  res.status(200).json({
    status: 'success',
    message: 'Media updated successfully',
    data: { media }
  });
});

/**
 * @desc    Delete media
 * @route   DELETE /api/v1/admin/media/:mediaId?force=true
 * @access  Private (Admin)
 */
exports.deleteMedia = asyncHandler(async (req, res, next) => {
  const media = await Media.findById(req.params.mediaId);
  const { force } = req.query;

  if (!media) {
    return next(new AppError('Media not found', 404));
  }

  // Check if media is in use (skip if force=true)
  if (!force && media.used_in && media.used_in.length > 0) {
    return next(new AppError(
      `Media is currently used in ${media.used_in.length} document(s). Remove references first or use force=true.`,
      400
    ));
  }

  // Delete from storage
  try {
    await storageService.deleteMedia(
      media.public_id || media.storage_url,
      media.file_type
    );
  } catch (error) {
    console.error('Storage deletion error:', error);
    // Continue with DB deletion even if storage fails
  }

  await media.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Media deleted successfully'
  });
});

/**
 * @desc    Bulk delete media
 * @route   POST /api/v1/admin/media/bulk-delete?force=true
 * @access  Private (Admin)
 */
exports.bulkDeleteMedia = asyncHandler(async (req, res, next) => {
  const { mediaIds, force } = req.body;

  if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
    return next(new AppError('No media IDs provided', 400));
  }

  const media = await Media.find({ _id: { $in: mediaIds } });

  // Check for in-use media (skip if force=true)
  if (!force) {
    const inUse = media.filter(m => m.used_in && m.used_in.length > 0);
    if (inUse.length > 0) {
      return next(new AppError(
        `${inUse.length} media file(s) are in use and cannot be deleted. Use force=true to delete anyway.`,
        400
      ));
    }
  }

  // Delete from storage
  const deletePromises = media.map(m =>
    storageService.deleteMedia(m.public_id || m.storage_url, m.file_type)
      .catch(err => console.error(`Failed to delete ${m.filename}:`, err))
  );
  await Promise.allSettled(deletePromises);

  // Delete from database
  await Media.deleteMany({ _id: { $in: mediaIds } });

  res.status(200).json({
    status: 'success',
    message: `${media.length} media file(s) deleted successfully`
  });
});
