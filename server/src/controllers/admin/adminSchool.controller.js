const asyncHandler = require('../../middleware/async.middleware');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');
const School = require('../../models/School');
const Batch = require('../../models/Batch');
const Payment = require('../../models/Payment');
const Registration = require('../../models/Registration');
const emailService = require('../../services/email.service');
const { generateSchoolCode } = require('../../utils/helpers');

/**
 * @desc    Get all schools with filters and pagination
 * @route   GET /api/v1/admin/schools
 * @access  Private (Admin)
 */
exports.getAllSchools = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    approval_status,
    status,
    is_verified,
    is_active,
    country,
    sort = '-created_at'
  } = req.query;

  // Build query
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { school_code: { $regex: search, $options: 'i' } },
      { 'contact_person.email': { $regex: search, $options: 'i' } }
    ];
  }

  if (is_verified !== undefined) {
    query.is_verified = is_verified === 'true';
  }

  if (is_active !== undefined) {
    query.is_active = is_active === 'true';
  }

  if (country) {
    query['address.country'] = country;
  }

  // Map frontend approval_status to backend is_verified
  if (approval_status === 'pending') {
    query.is_verified = false;
  } else if (approval_status === 'approved') {
    query.is_verified = true;
  }

  // Map frontend status to backend is_active
  if (status === 'active') {
    query.is_active = true;
  } else if (status === 'suspended') {
    query.is_active = false;
  }

  // Execute query and summary in parallel
  const [schools, summaryStats] = await Promise.all([
    School.find(query)
      .select('-password -reset_password_token -reset_password_expires')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit),

    School.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$is_verified', false] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$is_verified', true] }, 1, 0] } },
          suspended: { $sum: { $cond: [{ $eq: ['$is_active', false] }, 1, 0] } }
        }
      }
    ])
  ]);

  const summary = summaryStats[0] || { total: 0, pending: 0, approved: 0, suspended: 0 };

  // Transform schools to add frontend-expected fields
  const transformedSchools = schools.map(school => {
    const obj = school.toObject();
    obj.approval_status = obj.is_verified ? 'approved' : 'pending';
    obj.status = obj.is_active ? 'active' : 'suspended';
    obj.email = obj.contact_person?.email || '';
    return obj;
  });

  res.status(200).json({
    status: 'success',
    data: {
      schools: transformedSchools,
      summary: {
        total: summary.total,
        pending: summary.pending,
        approved: summary.approved,
        suspended: summary.suspended
      },
      pagination: {
        total: summary.total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(summary.total / limit)
      }
    }
  });
});

/**
 * @desc    Get school details with statistics
 * @route   GET /api/v1/admin/schools/:schoolId
 * @access  Private (Admin)
 */
exports.getSchoolDetails = asyncHandler(async (req, res, next) => {
  const { schoolId } = req.params;

  // Get school
  const school = await School.findById(schoolId).select('-password');

  if (!school) {
    return next(new AppError('School not found', 404));
  }

  // Get school statistics
  const [totalRegistrations, totalBatches, totalPayments, totalRevenue] = await Promise.all([
    Registration.countDocuments({ school_id: schoolId }),
    Batch.countDocuments({ school_id: schoolId }),
    Payment.countDocuments({ school_id: schoolId }),
    Payment.aggregate([
      {
        $match: {
          school_id: school._id,
          payment_status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ])
  ]);

  // Get recent batches
  const recentBatches = await Batch.find({ school_id: schoolId })
    .populate('event_id', 'title event_slug')
    .sort({ created_at: -1 })
    .limit(5)
    .select('batch_reference student_count total_amount status payment_status created_at');

  // Transform school to add frontend-expected fields
  const transformedSchool = school.toObject();
  transformedSchool.approval_status = transformedSchool.is_verified ? 'approved' : 'pending';
  transformedSchool.status = transformedSchool.is_active ? 'active' : 'suspended';
  transformedSchool.email = transformedSchool.contact_person?.email || '';

  res.status(200).json({
    status: 'success',
    data: {
      school: transformedSchool,
      statistics: {
        total_registrations: totalRegistrations,
        total_batches: totalBatches,
        total_payments: totalPayments,
        total_revenue: totalRevenue[0]?.total || 0
      },
      recent_batches: recentBatches
    }
  });
});

/**
 * @desc    Approve school
 * @route   PUT /api/v1/admin/schools/:schoolId/approve
 * @access  Private (Admin)
 */
exports.approveSchool = asyncHandler(async (req, res, next) => {
  const { schoolId } = req.params;
  const { notes } = req.body;

  const school = await School.findById(schoolId);

  if (!school) {
    return next(new AppError('School not found', 404));
  }

  if (school.is_verified) {
    return next(new AppError('School is already verified', 400));
  }

  school.is_verified = true;
  school.is_active = true;
  school.verified_at = new Date();
  school.verified_by = req.user.id;

  if (notes) {
    school.admin_notes = notes;
  }

  await school.save();

  logger.info(`School approved: ${school.school_code} by admin: ${req.user.id}`);

  // Send approval email (non-blocking)
  setImmediate(async () => {
    try {
      await emailService.sendSchoolApprovalEmail(school.contact_person.email, {
        schoolName: school.name,
        schoolCode: school.school_code
      });
      logger.info(`School approval email sent to: ${school.contact_person.email}`);
    } catch (emailError) {
      logger.error('Failed to send school approval email:', emailError);
    }
  });

  res.status(200).json({
    status: 'success',
    message: 'School approved successfully',
    data: { school }
  });
});

/**
 * @desc    Suspend school
 * @route   PUT /api/v1/admin/schools/:schoolId/suspend
 * @access  Private (Admin)
 */
exports.suspendSchool = asyncHandler(async (req, res, next) => {
  const { schoolId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return next(new AppError('Please provide suspension reason', 400));
  }

  const school = await School.findById(schoolId);

  if (!school) {
    return next(new AppError('School not found', 404));
  }

  if (!school.is_active) {
    return next(new AppError('School is already suspended', 400));
  }

  school.is_active = false;
  school.admin_notes = `SUSPENDED: ${reason}`;
  await school.save();

  logger.info(`School suspended: ${school.school_code} by admin: ${req.user.id}. Reason: ${reason}`);

  // Send suspension email (non-blocking)
  setImmediate(async () => {
    try {
      await emailService.sendSchoolSuspensionEmail(school.contact_person.email, {
        schoolName: school.name,
        schoolCode: school.school_code,
        reason: reason
      });
      logger.info(`School suspension email sent to: ${school.contact_person.email}`);
    } catch (emailError) {
      logger.error('Failed to send school suspension email:', emailError);
    }
  });

  res.status(200).json({
    status: 'success',
    message: 'School suspended successfully',
    data: { school }
  });
});

/**
 * @desc    Activate suspended school
 * @route   PUT /api/v1/admin/schools/:schoolId/activate
 * @access  Private (Admin)
 */
exports.activateSchool = asyncHandler(async (req, res, next) => {
  const { schoolId } = req.params;
  const { notes } = req.body;

  const school = await School.findById(schoolId);

  if (!school) {
    return next(new AppError('School not found', 404));
  }

  if (school.is_active) {
    return next(new AppError('School is already active', 400));
  }

  school.is_active = true;

  if (notes) {
    school.admin_notes = notes;
  }

  await school.save();

  logger.info(`School activated: ${school.school_code} by admin: ${req.user.id}`);

  // Send reactivation email (non-blocking)
  setImmediate(async () => {
    try {
      await emailService.sendSchoolReactivationEmail(school.contact_person.email, {
        schoolName: school.name,
        schoolCode: school.school_code
      });
      logger.info(`School reactivation email sent to: ${school.contact_person.email}`);
    } catch (emailError) {
      logger.error('Failed to send school reactivation email:', emailError);
    }
  });

  res.status(200).json({
    status: 'success',
    message: 'School activated successfully',
    data: { school }
  });
});

/**
 * @desc    Update school details
 * @route   PUT /api/v1/admin/schools/:schoolId
 * @access  Private (Admin)
 */
exports.updateSchool = asyncHandler(async (req, res, next) => {
  const { schoolId } = req.params;
  const { name, contact_person, address, admin_notes } = req.body;

  const school = await School.findById(schoolId);

  if (!school) {
    return next(new AppError('School not found', 404));
  }

  // Update fields
  if (name) school.name = name;
  if (contact_person) school.contact_person = { ...school.contact_person, ...contact_person };
  if (address) school.address = { ...school.address, ...address };
  if (admin_notes !== undefined) school.admin_notes = admin_notes;

  await school.save();

  logger.info(`School updated: ${school.school_code} by admin: ${req.user.id}`);

  res.status(200).json({
    status: 'success',
    message: 'School updated successfully',
    data: { school }
  });
});

/**
 * @desc    Get school's registration history
 * @route   GET /api/v1/admin/schools/:schoolId/registrations
 * @access  Private (Admin)
 */
exports.getSchoolRegistrations = asyncHandler(async (req, res, next) => {
  const { schoolId } = req.params;
  const { page = 1, limit = 20, event_id } = req.query;

  // Verify school exists
  const school = await School.findById(schoolId);
  if (!school) {
    return next(new AppError('School not found', 404));
  }

  // Build query
  const query = { school_id: schoolId };
  if (event_id) {
    query.event_id = event_id;
  }

  // Get registrations
  const registrations = await Registration.find(query)
    .populate('event_id', 'title event_slug')
    .populate('batch_id', 'batch_reference')
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
 * @desc    Get school's payment history
 * @route   GET /api/v1/admin/schools/:schoolId/payments
 * @access  Private (Admin)
 */
exports.getSchoolPayments = asyncHandler(async (req, res, next) => {
  const { schoolId } = req.params;
  const { page = 1, limit = 20, payment_status } = req.query;

  // Verify school exists
  const school = await School.findById(schoolId);
  if (!school) {
    return next(new AppError('School not found', 404));
  }

  // Build query
  const query = { school_id: schoolId };
  if (payment_status) {
    query.payment_status = payment_status;
  }

  // Get payments
  const payments = await Payment.find(query)
    .populate('event_id', 'title event_slug')
    .populate('batch_id', 'batch_reference student_count')
    .sort({ created_at: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Payment.countDocuments(query);

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
 * @desc    Create new school (Admin)
 * @route   POST /api/v1/admin/schools
 * @access  Private (Admin)
 */
exports.createSchool = asyncHandler(async (req, res, next) => {
  const {
    name,
    country,
    currency_pref,
    contact_person,
    address,
    password,
    external_docs_link
  } = req.body;

  // Validation
  if (!name || !country || !currency_pref || !contact_person?.email ||
      !contact_person?.name || !contact_person?.phone || !password) {
    return next(new AppError('Missing required fields', 400));
  }

  // Check email uniqueness
  const existingSchool = await School.findByEmail(contact_person.email);
  if (existingSchool) {
    return next(new AppError('School with this email already exists', 400));
  }

  // Generate unique school code
  let schoolCode;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    schoolCode = generateSchoolCode();
    const existing = await School.findOne({ school_code: schoolCode });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    return next(new AppError('Failed to generate unique school code', 500));
  }

  // Create school (auto-approved)
  const school = await School.create({
    school_code: schoolCode,
    name,
    country,
    currency_pref,
    contact_person,
    address,
    password_hash: password,
    external_docs_link,
    is_verified: true,
    is_active: true,
    verified_at: new Date(),
    verified_by: req.user.id
  });

  logger.info(`School created by admin: ${school.school_code} by ${req.user.id}`);

  res.status(201).json({
    status: 'success',
    message: 'School created successfully',
    data: { school: school.toSafeObject() }
  });
});
