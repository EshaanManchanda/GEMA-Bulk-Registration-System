const Event = require('../models/Event');
const { asyncHandler } = require('../utils/helpers');
const AppError = require('../utils/appError');

/**
 * @desc    Get all public active events
 * @route   GET /api/v1/events
 * @access  Public
 */
const getPublicEvents = asyncHandler(async (req, res) => {
  const { category, grade_levels, search, sortBy = 'event_date', sortOrder = 'asc', page = 1, limit = 20 } = req.query;

  // Build query for active events only
  const query = { status: 'active' };

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Filter by grade levels
  if (grade_levels) {
    const grades = grade_levels.split(',').map(g => g.trim());
    query.grade_levels = { $in: grades };
  }

  // Search by name or description
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Pagination
  const skip = (page - 1) * limit;

  // Execute query
  const events = await Event.find(query)
    .select('-form_schema') // Exclude form_schema from list view
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Get total count for pagination
  const total = await Event.countDocuments(query);

  res.json({
    success: true,
    data: {
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @desc    Get event by ID
 * @route   GET /api/v1/events/:eventId
 * @access  Public
 */
const getEventById = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId).lean();

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Only return active events to public
  if (event.status !== 'active') {
    throw new AppError('Event not found', 404);
  }

  res.json({
    success: true,
    data: { event },
  });
});

/**
 * @desc    Get event by slug
 * @route   GET /api/v1/events/slug/:eventSlug
 * @access  Public
 */
const getEventBySlug = asyncHandler(async (req, res) => {
  const { eventSlug } = req.params;

  const event = await Event.findOne({ event_slug: eventSlug }).lean();

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Only return active events to public
  if (event.status !== 'active') {
    throw new AppError('Event not found', 404);
  }

  res.json({
    success: true,
    data: { event },
  });
});

/**
 * @desc    Fetch certificate by student email
 * @route   POST /api/v1/events/:eventId/fetch-certificate
 * @access  Public
 */
const fetchCertificate = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { email, region } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  // Fetch event
  const event = await Event.findById(eventId);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Determine which certificate config to use (default to India if not specified)
  const useIndia = !region || region === 'india' || region === 'IN';
  const certificateConfig = useIndia
    ? event.certificate_config_india
    : event.certificate_config_international;

  if (!certificateConfig || !certificateConfig.enabled) {
    throw new AppError(`Certificate generation is not enabled for ${useIndia ? 'India' : 'International'} region`, 400);
  }

  // Fetch certificate from external API
  const certificateService = require('../services/certificate.service');
  const result = await certificateService.fetchCertificateByEmail(
    certificateConfig.certificate_issuance_url,
    certificateConfig.api_key,
    email
  );

  res.json({
    success: true,
    data: {
      download_url: result.download_url,
      message: result.message
    },
  });
});

module.exports = {
  getPublicEvents,
  getEventById,
  getEventBySlug,
  fetchCertificate,
};
