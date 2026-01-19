const BrandInfo = require('../models/BrandInfo');
const { asyncHandler } = require('../utils/helpers');

/**
 * @desc    Get brand information (public)
 * @route   GET /api/v1/brand
 * @access  Public
 */
const getBrandInfo = asyncHandler(async (req, res) => {
  const brandInfo = await BrandInfo.get();

  res.json({
    success: true,
    data: { brandInfo },
  });
});

/**
 * @desc    Update brand information
 * @route   PUT /api/v1/admin/brand
 * @access  Admin
 */
const updateBrandInfo = asyncHandler(async (req, res) => {
  const allowedFields = [
    'company_name',
    'tagline',
    'address',
    'phone',
    'email',
    'website',
    'facebook',
    'instagram',
    'youtube',
    'whatsapp',
    'linkedin',
    'twitter',
    'logo_url',
    'logo_white_url',
    'favicon_url',
    'support_email',
    'support_phone',
    'support_hours',
  ];

  // Filter only allowed fields
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const brandInfo = await BrandInfo.updateInfo(updates);

  res.json({
    success: true,
    message: 'Brand information updated successfully',
    data: { brandInfo },
  });
});

module.exports = {
  getBrandInfo,
  updateBrandInfo,
};
