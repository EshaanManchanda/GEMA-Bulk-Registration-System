const asyncHandler = require('../../middleware/async.middleware');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');
const School = require('../../models/School');
const Event = require('../../models/Event');
const Batch = require('../../models/Batch');
const Payment = require('../../models/Payment');
const Registration = require('../../models/Registration');
const { PAYMENT_STATUS, BATCH_STATUS } = require('../../utils/constants');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/v1/admin/dashboard/stats
 * @access  Private (Admin)
 */
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const { timeframe = '30d' } = req.query;

  // Calculate date range based on timeframe
  const now = new Date();
  let startDate;

  switch (timeframe) {
    case '7d':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case '30d':
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case '90d':
      startDate = new Date(now.setDate(now.getDate() - 90));
      break;
    case '1y':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    case 'all':
      startDate = new Date(0); // Beginning of time
      break;
    default:
      startDate = new Date(now.setDate(now.getDate() - 30));
  }

  // Run all queries in parallel
  const [
    totalSchools,
    activeSchools,
    pendingSchools,
    suspendedSchools,
    totalEvents,
    activeEvents,
    totalRegistrations,
    periodRegistrations,
    totalRevenue,
    periodRevenue,
    pendingPayments,
    completedPayments,
    failedPayments,
    pendingVerifications
  ] = await Promise.all([
    // School stats
    School.countDocuments(),
    School.countDocuments({ is_verified: true, is_active: true }),
    School.countDocuments({ is_verified: false }),
    School.countDocuments({ is_active: false }),

    // Event stats
    Event.countDocuments(),
    Event.countDocuments({ status: 'active' }),

    // Registration stats
    Registration.countDocuments(),
    Registration.countDocuments({ created_at: { $gte: startDate } }),

    // Revenue stats - all time (grouped by currency)
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.COMPLETED } },
      {
        $group: {
          _id: '$currency',
          total: { $sum: '$amount' }
        }
      }
    ]),

    // Revenue stats - period (grouped by currency)
    Payment.aggregate([
      {
        $match: {
          status: PAYMENT_STATUS.COMPLETED,
          paid_at: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$currency',
          total: { $sum: '$amount' }
        }
      }
    ]),

    // Payment stats
    Payment.countDocuments({ status: PAYMENT_STATUS.PENDING }),
    Payment.countDocuments({ status: PAYMENT_STATUS.COMPLETED }),
    Payment.countDocuments({ status: PAYMENT_STATUS.FAILED }),
    Payment.countDocuments({ status: PAYMENT_STATUS.PENDING_VERIFICATION })
  ]);

  // Calculate payment success rate
  const totalAttemptedPayments = completedPayments + failedPayments;
  const paymentSuccessRate = totalAttemptedPayments > 0
    ? (completedPayments / totalAttemptedPayments) * 100
    : 0;

  // Helper to get amount by currency
  const getAmountByCurrency = (data, currency) => {
    const found = data.find(item => item._id === currency);
    return found ? found.total : 0;
  };

  // Get top performing events with revenue
  const topEvents = await Event.aggregate([
    {
      $lookup: {
        from: 'registrations',
        localField: '_id',
        foreignField: 'event_id',
        as: 'registrations'
      }
    },
    {
      $lookup: {
        from: 'payments',
        let: { eventId: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [
            { $eq: ['$event_id', '$$eventId'] },
            { $eq: ['$status', PAYMENT_STATUS.COMPLETED] }
          ]}}},
          { $group: { _id: '$currency', total: { $sum: '$amount' } } }
        ],
        as: 'revenue'
      }
    },
    {
      $addFields: {
        total_registrations: { $size: '$registrations' },
        total_revenue: {
          $sum: {
            $map: {
              input: '$revenue',
              as: 'r',
              in: '$$r.total'
            }
          }
        }
      }
    },
    { $sort: { total_registrations: -1 } },
    { $limit: 5 },
    {
      $project: {
        event_id: '$_id',
        event_name: '$title',
        event_slug: 1,
        total_registrations: 1,
        total_revenue: 1,
        status: 1
      }
    }
  ]);

  // Get recent batches
  const recentBatches = await Batch.find()
    .populate('school_id', 'name school_code')
    .populate('event_id', 'title event_slug')
    .sort({ created_at: -1 })
    .limit(5)
    .select('batch_reference student_count total_amount status payment_status created_at');

  res.status(200).json({
    status: 'success',
    data: {
      stats: {
        // Flat structure for frontend
        total_schools: totalSchools,
        active_schools: activeSchools,
        pending_schools: pendingSchools,
        suspended_schools: suspendedSchools,
        total_events: totalEvents,
        active_events: activeEvents,
        total_registrations: totalRegistrations,
        period_registrations: periodRegistrations,
        total_revenue_inr: getAmountByCurrency(totalRevenue, 'INR'),
        total_revenue_usd: getAmountByCurrency(totalRevenue, 'USD'),
        period_revenue_inr: getAmountByCurrency(periodRevenue, 'INR'),
        period_revenue_usd: getAmountByCurrency(periodRevenue, 'USD'),
        pending_payments: pendingPayments,
        completed_payments: completedPayments,
        failed_payments: failedPayments,
        pending_verifications: pendingVerifications,
        payment_success_rate: paymentSuccessRate
      },
      topEvents,
      recentBatches,
      timeframe
    }
  });
});

/**
 * @desc    Get recent activities
 * @route   GET /api/v1/admin/dashboard/activities
 * @access  Private (Admin)
 */
exports.getRecentActivities = asyncHandler(async (req, res, next) => {
  const { limit = 20 } = req.query;

  // Get recent schools registered
  const recentSchools = await School.find()
    .sort({ created_at: -1 })
    .limit(5)
    .select('name school_code created_at is_verified');

  // Get recent payments
  const recentPayments = await Payment.find()
    .populate('school_id', 'name school_code')
    .populate('event_id', 'title')
    .sort({ created_at: -1 })
    .limit(10)
    .select('amount currency payment_status payment_mode created_at paid_at');

  // Get recent batches
  const recentBatches = await Batch.find()
    .populate('school_id', 'name school_code')
    .populate('event_id', 'title')
    .sort({ created_at: -1 })
    .limit(10)
    .select('batch_reference student_count status payment_status created_at');

  // Combine and format activities
  const activities = [];

  recentSchools.forEach(school => {
    activities.push({
      type: 'school_registration',
      title: 'New School Registration',
      description: `${school.name} (${school.school_code}) registered`,
      status: school.is_verified ? 'verified' : 'pending',
      timestamp: school.created_at,
      metadata: {
        school_id: school._id,
        school_name: school.name,
        school_code: school.school_code
      }
    });
  });

  recentPayments.forEach(payment => {
    activities.push({
      type: 'payment',
      title: `Payment ${payment.payment_status}`,
      description: `${payment.school_id?.name || 'Unknown School'} - ${payment.event_id?.title || 'Unknown Event'}`,
      status: payment.payment_status,
      timestamp: payment.paid_at || payment.created_at,
      metadata: {
        payment_id: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        payment_mode: payment.payment_mode
      }
    });
  });

  recentBatches.forEach(batch => {
    activities.push({
      type: 'batch_submission',
      title: 'Batch Submitted',
      description: `${batch.school_id?.name || 'Unknown School'} - ${batch.event_id?.title || 'Unknown Event'} (${batch.student_count} students)`,
      status: batch.status,
      timestamp: batch.created_at,
      metadata: {
        batch_id: batch._id,
        batch_reference: batch.batch_reference,
        student_count: batch.student_count
      }
    });
  });

  // Sort all activities by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Limit results
  const limitedActivities = activities.slice(0, parseInt(limit));

  res.status(200).json({
    status: 'success',
    data: {
      activities: limitedActivities,
      total: activities.length
    }
  });
});

/**
 * @desc    Get revenue analytics
 * @route   GET /api/v1/admin/dashboard/revenue
 * @access  Private (Admin)
 */
exports.getRevenueAnalytics = asyncHandler(async (req, res, next) => {
  const { timeframe = '30d', groupBy = 'day', currency } = req.query;

  // Calculate date range
  const now = new Date();
  let startDate;

  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    case 'all':
      startDate = new Date(0); // Beginning of time
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Define date grouping format based on groupBy parameter
  let dateFormat;

  switch (groupBy) {
    case 'day':
      dateFormat = {
        $dateToString: { format: '%Y-%m-%d', date: '$paid_at' }
      };
      break;
    case 'week':
      dateFormat = {
        $dateToString: { format: '%Y-W%V', date: '$paid_at' }
      };
      break;
    case 'month':
      dateFormat = {
        $dateToString: { format: '%Y-%m', date: '$paid_at' }
      };
      break;
    case 'year':
      dateFormat = {
        $dateToString: { format: '%Y', date: '$paid_at' }
      };
      break;
    default:
      dateFormat = {
        $dateToString: { format: '%Y-%m-%d', date: '$paid_at' }
      };
  }

  // Build match query
  const matchQuery = {
    status: PAYMENT_STATUS.COMPLETED,
    paid_at: { $gte: startDate }
  };

  if (currency) {
    matchQuery.currency = currency;
  }

  // Revenue over time
  const revenueTimeline = await Payment.aggregate([
    {
      $match: matchQuery
    },
    {
      $group: {
        _id: dateFormat,
        total_revenue: { $sum: '$amount' },
        payment_count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Revenue by payment mode
  const revenueByMode = await Payment.aggregate([
    {
      $match: {
        status: PAYMENT_STATUS.COMPLETED,
        paid_at: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$payment_mode',
        total_revenue: { $sum: '$amount' },
        payment_count: { $sum: 1 }
      }
    }
  ]);

  // Revenue by currency
  const revenueByCurrency = await Payment.aggregate([
    {
      $match: {
        status: PAYMENT_STATUS.COMPLETED,
        paid_at: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$currency',
        total_revenue: { $sum: '$amount' },
        payment_count: { $sum: 1 }
      }
    }
  ]);

  // Revenue by event
  const revenueByEvent = await Payment.aggregate([
    {
      $match: {
        status: PAYMENT_STATUS.COMPLETED,
        paid_at: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$event_id',
        total_revenue: { $sum: '$amount' },
        payment_count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'events',
        localField: '_id',
        foreignField: '_id',
        as: 'event'
      }
    },
    {
      $unwind: '$event'
    },
    {
      $project: {
        event_title: '$event.title',
        event_slug: '$event.event_slug',
        total_revenue: 1,
        payment_count: 1
      }
    },
    {
      $sort: { total_revenue: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Top schools by spending
  const topSchools = await Payment.aggregate([
    {
      $match: {
        status: PAYMENT_STATUS.COMPLETED,
        paid_at: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$school_id',
        total_spent: { $sum: '$amount' },
        payment_count: { $sum: 1 }
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
    { $unwind: '$school' },
    {
      $lookup: {
        from: 'registrations',
        localField: '_id',
        foreignField: 'school_id',
        as: 'registrations'
      }
    },
    {
      $project: {
        school_id: '$_id',
        school_name: '$school.name',
        country: '$school.address.country',
        total_spent: 1,
        total_registrations: { $size: '$registrations' }
      }
    },
    { $sort: { total_spent: -1 } },
    { $limit: 5 }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      timeline: revenueTimeline.map(t => ({ date: t._id, total_revenue: t.total_revenue, payment_count: t.payment_count })),
      byPaymentMode: revenueByMode,
      byCurrency: revenueByCurrency,
      byEvent: revenueByEvent,
      top_schools: topSchools,
      timeframe,
      groupBy
    }
  });
});
