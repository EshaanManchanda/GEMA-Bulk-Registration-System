const asyncHandler = require('../../middleware/async.middleware');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');
const Event = require('../../models/Event');
const Registration = require('../../models/Registration');
const Batch = require('../../models/Batch');
const Payment = require('../../models/Payment');
const csvExport = require('../../services/csvExport.service');

/**
 * @desc    Create new event
 * @route   POST /api/v1/admin/events
 * @access  Private (Admin)
 */
exports.createEvent = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    short_description,
    event_slug,
    category,
    grade_levels,
    event_start_date,
    event_end_date,
    registration_start_date,
    registration_deadline,
    base_fee_inr,
    base_fee_usd,
    bulk_discount_rules,
    max_participants,
    status,
    banner_url,
    form_schema,
    schedule_type,
    schedule,
    posters,
    brochures,
    notice_url
  } = req.body;

  // Check if event slug already exists
  const existingEvent = await Event.findOne({ event_slug });
  if (existingEvent) {
    return next(new AppError('Event slug already exists', 400));
  }

  // Create event
  const event = await Event.create({
    title,
    description,
    short_description,
    event_slug,
    category,
    grade_levels,
    event_start_date,
    event_end_date,
    registration_start_date,
    registration_deadline,
    base_fee_inr,
    base_fee_usd,
    bulk_discount_rules,
    max_participants,
    status,
    banner_image_url: banner_url,
    form_schema: form_schema || [],
    created_by: req.user.id,
    schedule_type,
    schedule,
    posters,
    brochures,
    notice_url
  });

  logger.info(`Event created: ${event.event_slug} by admin: ${req.user.id}`);

  // Track media usage for banner
  if (banner_url) {
    const { trackMediaUsage } = require('../../utils/mediaTracking');
    await trackMediaUsage(banner_url, 'Event', event._id, 'banner_image_url');
  }

  res.status(201).json({
    status: 'success',
    message: 'Event created successfully',
    data: { event }
  });
});

/**
 * @desc    Get all events
 * @route   GET /api/v1/admin/events
 * @access  Private (Admin)
 */
exports.getAllEvents = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    is_active,
    status,
    sort = '-created_at'
  } = req.query;

  // Build query
  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { event_slug: { $regex: search, $options: 'i' } }
    ];
  }

  // Support both is_active (legacy) and status parameters
  if (status !== undefined) {
    query.status = status;
  } else if (is_active !== undefined) {
    query.status = is_active === 'true' ? 'active' : 'draft';
  }

  // Execute query with pagination
  const events = await Event.find(query)
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Event.countDocuments(query);

  // Get registration counts for each event
  const eventsWithStats = await Promise.all(
    events.map(async (event) => {
      const registrationCount = await Registration.countDocuments({ event_id: event._id });
      const revenueData = await Payment.aggregate([
        {
          $match: {
            event_id: event._id,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      return {
        ...event.toObject(),
        stats: {
          total_registrations: registrationCount,
          total_revenue: revenueData[0]?.total || 0
        }
      };
    })
  );

  res.status(200).json({
    status: 'success',
    data: {
      events: eventsWithStats,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Get event details
 * @route   GET /api/v1/admin/events/:eventId
 * @access  Private (Admin)
 */
exports.getEventDetails = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Get event statistics
  const [totalRegistrations, totalBatches, totalRevenue, registrationsByStatus] = await Promise.all([
    Registration.countDocuments({ event_id: eventId }),
    Batch.countDocuments({ event_id: eventId }),
    Payment.aggregate([
      {
        $match: {
          event_id: event._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]),
    Batch.aggregate([
      {
        $match: { event_id: event._id }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      event,
      statistics: {
        total_registrations: totalRegistrations,
        total_batches: totalBatches,
        total_revenue: totalRevenue[0]?.total || 0,
        batches_by_status: registrationsByStatus
      }
    }
  });
});

/**
 * @desc    Update event
 * @route   PUT /api/v1/admin/events/:eventId
 * @access  Private (Admin)
 */
exports.updateEvent = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const {
    title,
    description,
    short_description,
    category,
    grade_levels,
    event_start_date,
    event_end_date,
    registration_start_date,
    registration_deadline,
    result_announced_date,
    base_fee_inr,
    base_fee_usd,
    bulk_discount_rules,
    max_participants,
    status,
    banner_url,
    form_schema,
    is_featured,
    rules_document_url,
    certificate_config_india,
    certificate_config_international,
    schedule_type,
    schedule,
    posters,
    brochures,
    notice_url
  } = req.body;

  const event = await Event.findById(eventId);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Capture old banner URL for tracking
  const oldBannerUrl = event.banner_image_url;

  // Update fields
  if (title) event.title = title;
  if (description) event.description = description;
  if (short_description !== undefined) event.short_description = short_description;
  if (category) event.category = category;
  if (grade_levels) event.grade_levels = grade_levels;
  if (event_start_date) event.event_start_date = event_start_date;
  if (event_end_date) event.event_end_date = event_end_date;
  if (registration_start_date) event.registration_start_date = registration_start_date;
  if (registration_deadline) event.registration_deadline = registration_deadline;
  if (result_announced_date !== undefined) event.result_announced_date = result_announced_date;
  if (base_fee_inr !== undefined) event.base_fee_inr = base_fee_inr;
  if (base_fee_usd !== undefined) event.base_fee_usd = base_fee_usd;
  if (bulk_discount_rules) event.bulk_discount_rules = bulk_discount_rules;
  if (max_participants !== undefined) event.max_participants = max_participants;
  if (status) event.status = status;
  if (banner_url) event.banner_image_url = banner_url;
  if (form_schema) event.form_schema = form_schema;
  if (is_featured !== undefined) event.is_featured = is_featured;
  if (rules_document_url !== undefined) event.rules_document_url = rules_document_url;
  if (certificate_config_india !== undefined) event.certificate_config_india = certificate_config_india;
  if (certificate_config_international !== undefined) event.certificate_config_international = certificate_config_international;
  if (schedule_type) event.schedule_type = schedule_type;
  if (schedule) event.schedule = schedule;
  if (posters) event.posters = posters;
  if (brochures) event.brochures = brochures;
  if (notice_url !== undefined) event.notice_url = notice_url;

  await event.save();

  // Handle media tracking for banner changes
  if (banner_url !== undefined && oldBannerUrl !== banner_url) {
    const { trackMediaUsage, untrackMediaUsage } = require('../../utils/mediaTracking');

    // Remove old tracking if banner existed
    if (oldBannerUrl) {
      await untrackMediaUsage(oldBannerUrl, 'Event', event._id);
    }

    // Add new tracking if new banner provided
    if (banner_url) {
      await trackMediaUsage(banner_url, 'Event', event._id, 'banner_image_url');
    }
  }

  logger.info(`Event updated: ${event.event_slug} by admin: ${req.user.id}`);

  res.status(200).json({
    status: 'success',
    message: 'Event updated successfully',
    data: { event }
  });
});

/**
 * @desc    Delete event
 * @route   DELETE /api/v1/admin/events/:eventId
 * @access  Private (Admin)
 */
exports.deleteEvent = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Check if event has registrations
  const registrationCount = await Registration.countDocuments({ event_id: eventId });

  if (registrationCount > 0) {
    return next(
      new AppError(
        'Cannot delete event with existing registrations. Consider deactivating instead.',
        400
      )
    );
  }

  // Check if event has batches
  const batchCount = await Batch.countDocuments({ event_id: eventId });

  if (batchCount > 0) {
    return next(
      new AppError(
        `Cannot delete event with ${batchCount} associated batch(es). Consider deactivating instead.`,
        400
      )
    );
  }

  // Cleanup media tracking before deletion
  if (event.banner_image_url) {
    const { untrackMediaUsage } = require('../../utils/mediaTracking');
    await untrackMediaUsage(event.banner_image_url, 'Event', event._id);
  }

  await event.deleteOne();

  logger.info(`Event deleted: ${event.event_slug} by admin: ${req.user.id}`);

  res.status(200).json({
    status: 'success',
    message: 'Event deleted successfully'
  });
});

/**
 * @desc    Toggle event active status
 * @route   PUT /api/v1/admin/events/:eventId/toggle-status
 * @access  Private (Admin)
 */
exports.toggleEventStatus = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Toggle between 'active' and 'draft' status
  event.status = event.status === 'active' ? 'draft' : 'active';
  await event.save();

  logger.info(`Event status toggled: ${event.event_slug} (${event.status}) by admin: ${req.user.id}`);

  res.status(200).json({
    status: 'success',
    message: `Event ${event.status === 'active' ? 'activated' : 'deactivated'} successfully`,
    data: { event }
  });
});

/**
 * @desc    Activate event (set status to 'active')
 * @route   PUT /api/v1/admin/events/:eventId/activate
 * @access  Private (Admin)
 */
exports.activateEvent = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  event.status = 'active';
  await event.save();

  logger.info(`Event activated: ${event.event_slug} by admin: ${req.user.id}`);

  res.status(200).json({
    status: 'success',
    message: 'Event activated successfully',
    data: { event }
  });
});

/**
 * @desc    Close event (set status to 'closed')
 * @route   PUT /api/v1/admin/events/:eventId/close
 * @access  Private (Admin)
 */
exports.closeEvent = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  event.status = 'closed';
  await event.save();

  logger.info(`Event closed: ${event.event_slug} by admin: ${req.user.id}`);

  res.status(200).json({
    status: 'success',
    message: 'Event closed successfully',
    data: { event }
  });
});

/**
 * @desc    Archive event (set status to 'archived')
 * @route   PUT /api/v1/admin/events/:eventId/archive
 * @access  Private (Admin)
 */
exports.archiveEvent = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  event.status = 'archived';
  await event.save();

  logger.info(`Event archived: ${event.event_slug} by admin: ${req.user.id}`);

  res.status(200).json({
    status: 'success',
    message: 'Event archived successfully',
    data: { event }
  });
});

/**
 * @desc    Get event registrations
 * @route   GET /api/v1/admin/events/:eventId/registrations
 * @access  Private (Admin)
 */
exports.getEventRegistrations = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const { page = 1, limit = 50, school_id } = req.query;

  // Verify event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Build query
  const query = { event_id: eventId };
  if (school_id) {
    query.school_id = school_id;
  }

  // Get registrations
  const registrations = await Registration.find(query)
    .populate('school_id', 'name school_code')
    .populate('batch_id', 'batch_reference payment_status')
    .sort({ created_at: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Registration.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      registrations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Get event batches
 * @route   GET /api/v1/admin/events/:eventId/batches
 * @access  Private (Admin)
 */
exports.getEventBatches = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const { page = 1, limit = 20, search, status } = req.query;

  // Verify event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Build query
  const query = { event_id: eventId };

  if (status) {
    query.payment_status = status;
  }

  // If search is provided, we need to find schools first
  if (search) {
    const schools = await mongoose.model('School').find({
      name: { $regex: search, $options: 'i' }
    }).select('_id');

    const schoolIds = schools.map(s => s._id);
    query.school_id = { $in: schoolIds };
  }

  // Execute query with pagination
  const batches = await Batch.find(query)
    .populate('school_id', 'name school_code')
    .sort({ created_at: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Batch.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      batches,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Get event analytics
 * @route   GET /api/v1/admin/events/:eventId/analytics
 * @access  Private (Admin)
 */
exports.getEventAnalytics = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  // Verify event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Registration growth over time
  const registrationTimeline = await Registration.aggregate([
    {
      $match: { event_id: event._id }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Registrations by school (with revenue)
  const registrationsBySchool = await Registration.aggregate([
    {
      $match: { event_id: event._id }
    },
    {
      $group: {
        _id: '$school_id',
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'schools',
        localField: '_id',
        foreignField: '_id',
        as: 'school'
      }
    },
    {
      $unwind: '$school'
    },
    {
      $lookup: {
        from: 'payments',
        let: { schoolId: '$_id', eventId: event._id },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$school_id', '$$schoolId'] },
                  { $eq: ['$event_id', '$$eventId'] },
                  { $eq: ['$status', 'completed'] }
                ]
              }
            }
          },
          {
            $group: {
              _id: '$currency',
              total: { $sum: '$amount' }
            }
          }
        ],
        as: 'payment_stats'
      }
    },
    {
      $project: {
        school_id: '$_id',
        school_name: '$school.name',
        school_code: '$school.school_code',
        country: '$school.country',
        total_registrations: '$count',
        total_revenue: { $ifNull: [{ $arrayElemAt: ['$payment_stats.total', 0] }, 0] },
        currency: { $ifNull: [{ $arrayElemAt: ['$payment_stats._id', 0] }, 'INR'] }
      }
    },
    {
      $sort: { total_registrations: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Registrations by grade (if available in dynamic_data)
  const registrationsByGrade = await Registration.aggregate([
    {
      $match: { event_id: event._id }
    },
    {
      $group: {
        _id: '$grade',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Revenue timeline
  const revenueTimeline = await Payment.aggregate([
    {
      $match: {
        event_id: event._id,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$paid_at' }
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Calculate totals and averages
  const totalRegistrations = await Registration.countDocuments({ event_id: eventId });

  const revenueStats = await Payment.aggregate([
    {
      $match: {
        event_id: event._id,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$currency',
        total: { $sum: '$amount' }
      }
    }
  ]);

  let totalRevenueInr = 0;
  let totalRevenueUsd = 0;

  revenueStats.forEach(stat => {
    if (stat._id === 'INR') totalRevenueInr = stat.total;
    if (stat._id === 'USD') totalRevenueUsd = stat.total;
  });

  const batchStats = await Batch.aggregate([
    { $match: { event_id: event._id } },
    {
      $group: {
        _id: null,
        avgSize: { $avg: '$total_students' },
        maxSize: { $max: '$total_students' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      total_registrations: totalRegistrations,
      total_revenue_inr: totalRevenueInr,
      total_revenue_usd: totalRevenueUsd,
      avg_batch_size: batchStats[0]?.avgSize || 0,
      largest_batch_size: batchStats[0]?.maxSize || 0,
      registration_timeline: registrationTimeline,
      school_breakdown: registrationsBySchool,
      registrations_by_grade: registrationsByGrade,
      revenue_timeline: revenueTimeline
    }
  });
});

/**
 * @desc    Export event registrations to CSV
 * @route   GET /api/v1/admin/events/:eventId/export
 * @access  Private (Admin)
 */
exports.exportEventRegistrations = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  // Verify event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Get all registrations for this event
  const registrations = await Registration.find({ event_id: eventId })
    .populate('school_id', 'name school_code contact_person address')
    .populate('batch_id', 'batch_reference payment_status payment_mode total_amount currency')
    .sort({ created_at: 1 });

  // Generate CSV using csvExport service
  const buffer = csvExport.generateRegistrationsCSV(registrations, event.form_schema);
  const filename = csvExport.generateRegistrationsFilename(event.event_slug);

  // Set response headers
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);

  // Send buffer
  res.send(buffer);

  logger.info(`Event registrations exported to CSV: ${event.event_slug} by admin: ${req.user.id}`);
});
