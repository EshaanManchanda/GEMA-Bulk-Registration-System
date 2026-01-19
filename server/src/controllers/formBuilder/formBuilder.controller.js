const asyncHandler = require('../../middleware/async.middleware');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');
const Event = require('../../models/Event');

/**
 * Supported field types for the form builder
 */
const SUPPORTED_FIELD_TYPES = [
  'text',
  'number',
  'email',
  'tel',
  'date',
  'select',
  'radio',
  'checkbox',
  'textarea',
  'file'
];

/**
 * Default required fields that must exist in every form
 */
const DEFAULT_REQUIRED_FIELDS = ['student_name', 'grade', 'section'];

/**
 * Validate form schema structure
 */
const validateFormSchema = (formSchema) => {
  if (!Array.isArray(formSchema)) {
    throw new AppError('Form schema must be an array', 400);
  }

  if (formSchema.length === 0) {
    throw new AppError('Form schema cannot be empty', 400);
  }

  // Check for default required fields
  const fieldNames = formSchema.map(field => field.field_name);
  const missingFields = DEFAULT_REQUIRED_FIELDS.filter(
    field => !fieldNames.includes(field)
  );

  if (missingFields.length > 0) {
    throw new AppError(
      `Missing required fields: ${missingFields.join(', ')}`,
      400
    );
  }

  // Validate each field
  formSchema.forEach((field, index) => {
    // Required field properties
    if (!field.field_name) {
      throw new AppError(`Field at index ${index} missing field_name`, 400);
    }

    if (!field.field_type) {
      throw new AppError(`Field at index ${index} missing field_type`, 400);
    }

    if (!field.label) {
      throw new AppError(`Field at index ${index} missing label`, 400);
    }

    // Validate field type
    if (!SUPPORTED_FIELD_TYPES.includes(field.field_type)) {
      throw new AppError(
        `Invalid field_type '${field.field_type}' at index ${index}. Supported types: ${SUPPORTED_FIELD_TYPES.join(', ')}`,
        400
      );
    }

    // Validate field name format (alphanumeric and underscore only)
    if (!/^[a-z0-9_]+$/.test(field.field_name)) {
      throw new AppError(
        `Invalid field_name '${field.field_name}' at index ${index}. Use only lowercase letters, numbers, and underscores.`,
        400
      );
    }

    // Validate select/radio/checkbox options
    if (['select', 'radio', 'checkbox'].includes(field.field_type)) {
      if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
        throw new AppError(
          `Field '${field.field_name}' requires options array`,
          400
        );
      }
    }

    // Validate validation rules if present
    if (field.validation) {
      if (typeof field.validation !== 'object') {
        throw new AppError(
          `Validation rules for '${field.field_name}' must be an object`,
          400
        );
      }

      // Check for valid validation properties
      const validValidationKeys = ['required', 'min', 'max', 'minLength', 'maxLength', 'pattern', 'custom'];
      const invalidKeys = Object.keys(field.validation).filter(
        key => !validValidationKeys.includes(key)
      );

      if (invalidKeys.length > 0) {
        throw new AppError(
          `Invalid validation keys for '${field.field_name}': ${invalidKeys.join(', ')}`,
          400
        );
      }
    }
  });

  // Check for duplicate field names
  const duplicates = fieldNames.filter(
    (name, index) => fieldNames.indexOf(name) !== index
  );

  if (duplicates.length > 0) {
    throw new AppError(
      `Duplicate field names found: ${[...new Set(duplicates)].join(', ')}`,
      400
    );
  }

  return true;
};

/**
 * @desc    Update event form schema
 * @route   PUT /api/v1/form-builder/events/:eventId/schema
 * @access  Private (Admin)
 */
exports.updateEventFormSchema = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const { form_schema } = req.body;

  if (!form_schema) {
    return next(new AppError('Please provide form_schema', 400));
  }

  // Validate form schema
  validateFormSchema(form_schema);

  // Find and update event
  const event = await Event.findById(eventId);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  event.form_schema = form_schema;
  await event.save();

  logger.info(`Form schema updated for event: ${event.event_slug} by admin: ${req.user.id}`);

  res.status(200).json({
    status: 'success',
    message: 'Form schema updated successfully',
    data: {
      event_id: event._id,
      event_slug: event.event_slug,
      form_schema: event.form_schema
    }
  });
});

/**
 * @desc    Get event form schema
 * @route   GET /api/v1/form-builder/events/:eventId/schema
 * @access  Public (for schools to see the form)
 */
exports.getEventFormSchema = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId).select('title event_slug form_schema status');

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  if (event.status !== 'active') {
    return next(new AppError('Event is not active', 400));
  }

  res.status(200).json({
    status: 'success',
    data: {
      event_id: event._id,
      event_title: event.title,
      event_slug: event.event_slug,
      form_schema: event.form_schema
    }
  });
});

/**
 * @desc    Get event form schema by slug (public)
 * @route   GET /api/v1/form-builder/events/slug/:eventSlug/schema
 * @access  Public
 */
exports.getEventFormSchemaBySlug = asyncHandler(async (req, res, next) => {
  const { eventSlug } = req.params;

  const event = await Event.findOne({ event_slug: eventSlug }).select('title event_slug form_schema status');

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  if (event.status !== 'active') {
    return next(new AppError('Event is not active', 400));
  }

  res.status(200).json({
    status: 'success',
    data: {
      event_id: event._id,
      event_title: event.title,
      event_slug: event.event_slug,
      form_schema: event.form_schema
    }
  });
});

/**
 * @desc    Get default form template
 * @route   GET /api/v1/form-builder/templates/default
 * @access  Private (Admin)
 */
exports.getDefaultFormTemplate = asyncHandler(async (req, res, next) => {
  const defaultTemplate = [
    {
      field_name: 'student_name',
      field_type: 'text',
      label: 'Student Name',
      placeholder: 'Enter student full name',
      validation: {
        required: true,
        minLength: 2,
        maxLength: 100
      },
      order: 1
    },
    {
      field_name: 'grade',
      field_type: 'select',
      label: 'Grade',
      placeholder: 'Select grade',
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      validation: {
        required: true
      },
      order: 2
    },
    {
      field_name: 'section',
      field_type: 'text',
      label: 'Section',
      placeholder: 'Enter section (e.g., A, B, C)',
      validation: {
        required: true,
        maxLength: 10
      },
      order: 3
    },
    {
      field_name: 'date_of_birth',
      field_type: 'date',
      label: 'Date of Birth',
      placeholder: 'Select date of birth',
      validation: {
        required: false
      },
      order: 4
    },
    {
      field_name: 'gender',
      field_type: 'select',
      label: 'Gender',
      placeholder: 'Select gender',
      options: ['Male', 'Female', 'Other'],
      validation: {
        required: false
      },
      order: 5
    },
    {
      field_name: 'parent_contact',
      field_type: 'tel',
      label: 'Parent Contact Number',
      placeholder: 'Enter parent contact number',
      validation: {
        required: false,
        pattern: '^[0-9]{10}$'
      },
      order: 6
    },
    {
      field_name: 'parent_email',
      field_type: 'email',
      label: 'Parent Email',
      placeholder: 'Enter parent email address',
      validation: {
        required: false
      },
      order: 7
    }
  ];

  res.status(200).json({
    status: 'success',
    data: {
      template_name: 'default',
      description: 'Default registration form template',
      form_schema: defaultTemplate
    }
  });
});

/**
 * @desc    Validate form data against schema
 * @route   POST /api/v1/form-builder/validate
 * @access  Private (School)
 */
exports.validateFormData = asyncHandler(async (req, res, next) => {
  const { event_id, form_data } = req.body;

  if (!event_id || !form_data) {
    return next(new AppError('Please provide event_id and form_data', 400));
  }

  const event = await Event.findById(event_id).select('form_schema');

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  const errors = [];

  // Validate each field
  event.form_schema.forEach(field => {
    const value = form_data[field.field_name];

    // Check required fields
    if (field.validation?.required && (!value || value === '')) {
      errors.push({
        field: field.field_name,
        message: `${field.label} is required`
      });
      return;
    }

    // Skip validation if field is not required and empty
    if (!value || value === '') {
      return;
    }

    // Validate based on field type
    if (field.field_type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push({
          field: field.field_name,
          message: `${field.label} must be a valid email`
        });
      }
    }

    if (field.field_type === 'tel' || field.field_type === 'number') {
      if (isNaN(value)) {
        errors.push({
          field: field.field_name,
          message: `${field.label} must be a number`
        });
      }
    }

    // Check minLength
    if (field.validation?.minLength && value.length < field.validation.minLength) {
      errors.push({
        field: field.field_name,
        message: `${field.label} must be at least ${field.validation.minLength} characters`
      });
    }

    // Check maxLength
    if (field.validation?.maxLength && value.length > field.validation.maxLength) {
      errors.push({
        field: field.field_name,
        message: `${field.label} must not exceed ${field.validation.maxLength} characters`
      });
    }

    // Check min (for numbers)
    if (field.validation?.min && parseFloat(value) < field.validation.min) {
      errors.push({
        field: field.field_name,
        message: `${field.label} must be at least ${field.validation.min}`
      });
    }

    // Check max (for numbers)
    if (field.validation?.max && parseFloat(value) > field.validation.max) {
      errors.push({
        field: field.field_name,
        message: `${field.label} must not exceed ${field.validation.max}`
      });
    }

    // Check pattern
    if (field.validation?.pattern) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        errors.push({
          field: field.field_name,
          message: `${field.label} format is invalid`
        });
      }
    }

    // Check if value is in options (for select/radio)
    if (['select', 'radio'].includes(field.field_type)) {
      if (field.options && !field.options.includes(value)) {
        errors.push({
          field: field.field_name,
          message: `${field.label} must be one of: ${field.options.join(', ')}`
        });
      }
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Validation successful',
    data: { form_data }
  });
});
