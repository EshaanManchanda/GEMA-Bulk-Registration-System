const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/async.middleware');
const { AppError } = require('../middleware/errorHandler.middleware');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireSchool } = require('../middleware/role.middleware');
const Registration = require('../models/Registration');

/**
 * Registration Routes
 * Base path: /api/v1/registrations
 */

// ===============================================
// PUBLIC ROUTES
// ===============================================

/**
 * @desc    Public result lookup by registration ID
 * @route   GET /api/v1/registrations/:registrationId/result
 * @access  Public
 */
router.get('/:registrationId/result', asyncHandler(async (req, res, next) => {
  const { registrationId } = req.params;

  const registration = await Registration.findOne({
    registration_id: registrationId
  })
    .populate('event_id', 'title event_slug banner_image_url')
    .populate('school_id', 'name')
    .select('registration_id student_name grade section result event_id school_id certificate_url status');

  if (!registration) {
    return next(new AppError('Registration not found', 404));
  }

  // Only show result if registration is confirmed/attended
  if (!['confirmed', 'attended'].includes(registration.status)) {
    return next(new AppError('Results not available for this registration', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      registration: {
        id: registration.registration_id,
        studentName: registration.student_name,
        grade: registration.grade,
        section: registration.section,
        event: {
          title: registration.event_id.title,
          slug: registration.event_id.event_slug,
          banner: registration.event_id.banner_image_url
        },
        school: registration.school_id.name,
        result: registration.result || null,
        certificateUrl: registration.certificate_url || null
      }
    }
  });
}));

// ===============================================
// SCHOOL ROUTES (Protected)
// ===============================================

/**
 * @desc    Get school's results (all events)
 * @route   GET /api/v1/registrations/school/results
 * @access  Private (School)
 */
router.get('/school/results', verifyToken, requireSchool, asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 50,
    eventId,
    hasResult,
    sort = '-updated_at'
  } = req.query;

  const query = {
    school_id: req.user._id,
    status: { $in: ['confirmed', 'attended'] }
  };

  if (eventId) {
    query.event_id = eventId;
  }

  if (hasResult === 'true') {
    query['result.score'] = { $exists: true, $ne: null };
  }

  const skip = (page - 1) * limit;

  const registrations = await Registration.find(query)
    .populate('event_id', 'title event_slug')
    .populate('batch_id', 'batch_reference')
    .select('registration_id student_name grade section result event_id batch_id certificate_url')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Registration.countDocuments(query);

  // Get stats
  const stats = await Registration.aggregate([
    { $match: { school_id: req.user._id, status: { $in: ['confirmed', 'attended'] } } },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        withResults: {
          $sum: { $cond: [{ $ne: ['$result.score', null] }, 1, 0] }
        },
        withCertificates: {
          $sum: { $cond: [{ $ne: ['$certificate_url', null] }, 1, 0] }
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      registrations,
      stats: stats[0] || {},
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

/**
 * @desc    Get results for a specific event (school's students only)
 * @route   GET /api/v1/registrations/school/events/:eventId/results
 * @access  Private (School)
 */
router.get('/school/events/:eventId/results', verifyToken, requireSchool, asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const Event = require('../models/Event');

  const event = await Event.findById(eventId).select('title event_slug');
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  const registrations = await Registration.find({
    school_id: req.user._id,
    event_id: eventId,
    status: { $in: ['confirmed', 'attended'] }
  })
    .populate('batch_id', 'batch_reference')
    .select('registration_id student_name grade section result batch_id certificate_url')
    .sort('result.rank student_name');

  res.status(200).json({
    status: 'success',
    data: {
      event: { id: event._id, title: event.title, slug: event.event_slug },
      registrations,
      total: registrations.length
    }
  });
}));

module.exports = router;
