const asyncHandler = require('../../middleware/async.middleware');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');
const Payment = require('../../models/Payment');
const { PAYMENT_STATUS, PAYMENT_MODE } = require('../../utils/constants');

/**
 * @desc    Get all payments with filters
 * @route   GET /api/v1/admin/payments
 * @access  Private (Admin)
 */
exports.getAllPayments = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    payment_status,
    payment_mode,
    payment_gateway,
    school_id,
    event_id,
    search,
    sort = '-created_at',
    date_from,
    date_to
  } = req.query;

  // Build query
  const query = {};

  if (payment_status) {
    query.status = payment_status;
  }

  if (payment_mode) {
    query.payment_mode = payment_mode;
  }

  if (payment_gateway) {
    query.payment_gateway = payment_gateway;
  }

  if (school_id) {
    query.school_id = school_id;
  }

  if (event_id) {
    query.event_id = event_id;
  }

  if (search) {
    query.$or = [
      { gateway_order_id: { $regex: search, $options: 'i' } },
      { gateway_payment_id: { $regex: search, $options: 'i' } }
    ];
  }

  // Date range filter
  if (date_from || date_to) {
    query.created_at = {};
    if (date_from) {
      query.created_at.$gte = new Date(date_from);
    }
    if (date_to) {
      query.created_at.$lte = new Date(date_to);
    }
  }

  // Execute query with pagination
  const payments = await Payment.find(query)
    .populate('school_id', 'name school_code contact_person')
    .populate('event_id', 'title event_slug')
    .populate('batch_id', 'batch_reference student_count')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Payment.countDocuments(query);

  // Calculate summary statistics for filtered payments
  const summary = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        total_amount: { $sum: '$amount' },
        completed_amount: {
          $sum: {
            $cond: [{ $eq: ['$status', PAYMENT_STATUS.COMPLETED] }, '$amount', 0]
          }
        },
        pending_count: {
          $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.PENDING] }, 1, 0] }
        },
        completed_count: {
          $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.COMPLETED] }, 1, 0] }
        },
        failed_count: {
          $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.FAILED] }, 1, 0] }
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      payments,
      summary: summary[0] || {
        total_amount: 0,
        completed_amount: 0,
        pending_count: 0,
        completed_count: 0,
        failed_count: 0
      },
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Get pending offline payments
 * @route   GET /api/v1/admin/payments/pending-offline
 * @access  Private (Admin)
 */
exports.getPendingOfflinePayments = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  // Get pending offline payments
  const payments = await Payment.find({
    payment_mode: PAYMENT_MODE.OFFLINE,
    status: PAYMENT_STATUS.PENDING
  })
    .populate('school_id', 'name school_code contact_person')
    .populate('event_id', 'title event_slug')
    .populate('batch_id', 'batch_reference student_count')
    .sort({ created_at: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Payment.countDocuments({
    payment_mode: PAYMENT_MODE.OFFLINE,
    status: PAYMENT_STATUS.PENDING
  });

  res.status(200).json({
    status: 'success',
    data: {
      payments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Get payment details
 * @route   GET /api/v1/admin/payments/:paymentId
 * @access  Private (Admin)
 */
exports.getPaymentDetails = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId)
    .populate('school_id')
    .populate('event_id')
    .populate({
      path: 'batch_id',
      populate: {
        path: 'registration_ids',
        select: 'student_name grade section'
      }
    });

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { payment }
  });
});

/**
 * @desc    Get payment analytics
 * @route   GET /api/v1/admin/payments/analytics
 * @access  Private (Admin)
 */
exports.getPaymentAnalytics = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfWeek.getDate() - 7);
  const endOfLastWeek = new Date(startOfWeek);
  endOfLastWeek.setDate(startOfWeek.getDate() - 1);
  const thirtyDaysAgo = new Date(startOfToday);
  thirtyDaysAgo.setDate(startOfToday.getDate() - 30);

  // Run all aggregations in parallel
  const [
    overallStats,
    gatewayDistribution,
    modeDistribution,
    dailyTrend,
    topSchools,
    thisMonthStats,
    lastMonthStats,
    thisWeekStats,
    lastWeekStats,
    recentFailures
  ] = await Promise.all([
    // Overall statistics
    Payment.aggregate([
      {
        $group: {
          _id: null,
          total_count: { $sum: 1 },
          total_amount: { $sum: '$amount' },
          completed_count: {
            $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.COMPLETED] }, 1, 0] }
          },
          completed_amount: {
            $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.COMPLETED] }, '$amount', 0] }
          },
          pending_count: {
            $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.PENDING] }, 1, 0] }
          },
          pending_verification_count: {
            $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.PENDING_VERIFICATION] }, 1, 0] }
          },
          failed_count: {
            $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.FAILED] }, 1, 0] }
          },
          inr_amount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$currency', 'INR'] }, { $eq: ['$status', PAYMENT_STATUS.COMPLETED] }] },
                '$amount', 0
              ]
            }
          },
          usd_amount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$currency', 'USD'] }, { $eq: ['$status', PAYMENT_STATUS.COMPLETED] }] },
                '$amount', 0
              ]
            }
          }
        }
      }
    ]),

    // Gateway distribution
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.COMPLETED } },
      {
        $group: {
          _id: '$payment_gateway',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { amount: -1 } }
    ]),

    // Payment mode distribution
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.COMPLETED } },
      {
        $group: {
          _id: '$payment_mode',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]),

    // Daily trend (last 30 days)
    Payment.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          total_count: { $sum: 1 },
          completed_count: {
            $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.COMPLETED] }, 1, 0] }
          },
          failed_count: {
            $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.FAILED] }, 1, 0] }
          },
          revenue: {
            $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.COMPLETED] }, '$amount', 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Top 5 schools by revenue
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.COMPLETED } },
      {
        $group: {
          _id: '$school_id',
          total_amount: { $sum: '$amount' },
          payment_count: { $sum: 1 }
        }
      },
      { $sort: { total_amount: -1 } },
      { $limit: 5 },
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
        $project: {
          school_name: '$school.name',
          school_code: '$school.school_code',
          total_amount: 1,
          payment_count: 1
        }
      }
    ]),

    // This month stats
    Payment.aggregate([
      { $match: { created_at: { $gte: startOfMonth }, status: PAYMENT_STATUS.COMPLETED } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
          inr_amount: { $sum: { $cond: [{ $eq: ['$currency', 'INR'] }, '$amount', 0] } },
          usd_amount: { $sum: { $cond: [{ $eq: ['$currency', 'USD'] }, '$amount', 0] } }
        }
      }
    ]),

    // Last month stats
    Payment.aggregate([
      {
        $match: {
          created_at: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          status: PAYMENT_STATUS.COMPLETED
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
          inr_amount: { $sum: { $cond: [{ $eq: ['$currency', 'INR'] }, '$amount', 0] } },
          usd_amount: { $sum: { $cond: [{ $eq: ['$currency', 'USD'] }, '$amount', 0] } }
        }
      }
    ]),

    // This week stats
    Payment.aggregate([
      { $match: { created_at: { $gte: startOfWeek }, status: PAYMENT_STATUS.COMPLETED } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]),

    // Last week stats
    Payment.aggregate([
      {
        $match: {
          created_at: { $gte: startOfLastWeek, $lte: endOfLastWeek },
          status: PAYMENT_STATUS.COMPLETED
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]),

    // Recent failures (last 7 days)
    Payment.find({
      status: PAYMENT_STATUS.FAILED,
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
      .populate('school_id', 'name')
      .sort({ created_at: -1 })
      .limit(5)
      .select('payment_reference amount currency error_description created_at school_id')
  ]);

  const stats = overallStats[0] || {
    total_count: 0, total_amount: 0, completed_count: 0, completed_amount: 0,
    pending_count: 0, pending_verification_count: 0, failed_count: 0,
    inr_amount: 0, usd_amount: 0
  };

  const thisMonth = thisMonthStats[0] || { count: 0, amount: 0, inr_amount: 0, usd_amount: 0 };
  const lastMonth = lastMonthStats[0] || { count: 0, amount: 0, inr_amount: 0, usd_amount: 0 };
  const thisWeek = thisWeekStats[0] || { count: 0, amount: 0 };
  const lastWeek = lastWeekStats[0] || { count: 0, amount: 0 };

  // Calculate percentage changes
  const calcChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Calculate success rate
  const totalAttempts = stats.completed_count + stats.failed_count;
  const successRate = totalAttempts > 0 ? Math.round((stats.completed_count / totalAttempts) * 100) : 0;

  // Average transaction value
  const avgTransactionValue = stats.completed_count > 0
    ? Math.round(stats.completed_amount / stats.completed_count)
    : 0;

  res.status(200).json({
    status: 'success',
    data: {
      overview: {
        total_payments: stats.total_count,
        completed: stats.completed_count,
        pending: stats.pending_count,
        pending_verification: stats.pending_verification_count,
        failed: stats.failed_count,
        success_rate: successRate,
        avg_transaction_value: avgTransactionValue
      },
      revenue: {
        total_inr: stats.inr_amount,
        total_usd: stats.usd_amount,
        this_month_inr: thisMonth.inr_amount,
        this_month_usd: thisMonth.usd_amount,
        last_month_inr: lastMonth.inr_amount,
        last_month_usd: lastMonth.usd_amount
      },
      comparisons: {
        month_over_month: {
          revenue_change: calcChange(thisMonth.amount, lastMonth.amount),
          count_change: calcChange(thisMonth.count, lastMonth.count)
        },
        week_over_week: {
          revenue_change: calcChange(thisWeek.amount, lastWeek.amount),
          count_change: calcChange(thisWeek.count, lastWeek.count)
        }
      },
      gateway_distribution: gatewayDistribution.map(g => ({
        gateway: g._id || 'unknown',
        count: g.count,
        amount: g.amount
      })),
      mode_distribution: modeDistribution.map(m => ({
        mode: m._id,
        count: m.count,
        amount: m.amount
      })),
      daily_trend: dailyTrend.map(d => ({
        date: d._id,
        total: d.total_count,
        completed: d.completed_count,
        failed: d.failed_count,
        revenue: d.revenue
      })),
      top_schools: topSchools,
      recent_failures: recentFailures.map(f => ({
        reference: f.payment_reference,
        amount: f.amount,
        currency: f.currency,
        error: f.error_description,
        school: f.school_id?.name,
        date: f.created_at
      }))
    }
  });
});
