import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AdminLayout from '../../../layouts/AdminLayout';
import { useCreateEvent, useUpdateEvent } from '../../../hooks/useAdmin';
import { Card, Button, Spinner, Badge } from '../../../components/ui';
import RichTextEditor, { getTextFromHtml } from '../../../components/ui/RichTextEditor';
import Stepper from '../../../components/ui/Stepper';
import FormSchemaBuilder from '@/features/admin/components/events/FormSchemaBuilder';
import DiscountRulesEditor from '@/features/admin/components/events/DiscountRulesEditor';
import MediaPicker from '@/features/admin/components/MediaPicker';
import { showError, showSuccess } from '../../../components/common/Toast';
import { formatCurrency, formatDate } from '../../../utils/helpers';
import { EVENT_TYPE_LABELS, GRADE_LEVELS } from '../../../utils/constants';

/**
 * Create Event Page
 * Multi-step form for creating/editing events
 */
const CreateEvent = ({ mode = 'create', eventId = null, defaultValues = null }) => {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const [currentStep, setCurrentStep] = useState(0);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(defaultValues?.banner_url || null);
  const [bannerUrl, setBannerUrl] = useState(defaultValues?.banner_url || null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Media State
  const [posters, setPosters] = useState(defaultValues?.posters || []);
  const [brochures, setBrochures] = useState(defaultValues?.brochures || []);
  const [noticeUrl, setNoticeUrl] = useState(defaultValues?.notice_url || null);
  const [mediaPickerConfig, setMediaPickerConfig] = useState({
    type: 'banner', // banner, poster, brochure, notice
    accept: ['image']
  });

  const steps = [
    { label: 'Basic Info', description: 'Event details' },
    { label: 'Dates & Pricing', description: 'Schedule & fees' },
    { label: 'Form Builder', description: 'Registration fields' },
    { label: 'Discounts & Media', description: 'Offers & banner' },
    { label: 'Certificate Settings', description: 'API configuration' },
    { label: 'Review', description: 'Confirm & submit' },
  ];

  // Combined validation schema for all form fields
  const eventSchema = yup.object({
    // Step 1: Basic Info
    title: yup.string().max(200, 'Max 200 characters').required('Title is required'),
    event_slug: yup
      .string()
      .matches(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens')
      .required('Slug is required'),
    category: yup
      .string()
      .oneOf(['olympiad', 'championship', 'competition', 'workshop', 'other'])
      .required('Category is required'),
    event_type: yup
      .string()
      .oneOf(['exam', 'olympiad', 'championship', 'competition', 'workshop', 'submission_only', 'other'])
      .required('Event type is required'),
    grade_levels: yup.array().min(1, 'Select at least one grade').required(),
    short_description: yup.string().test(
      'max-text-length',
      'Max 500 characters',
      (value) => !value || getTextFromHtml(value).length <= 500
    ),
    description: yup.string().required('Description is required').test(
      'max-text-length',
      'Max 2000 characters',
      (value) => !value || getTextFromHtml(value).length <= 2000
    ),

    // Step 2: Dates & Pricing - Accept strings from HTML date inputs
    schedule_type: yup.string().oneOf(['single_date', 'date_range', 'multiple_dates']).default('date_range'),
    event_start_date: yup
      .string()
      .test('required-for-type', 'Start date is required', function (value) {
        const { schedule_type } = this.parent;
        // Not required for multiple_dates (derived from event_dates)
        if (schedule_type === 'multiple_dates') return true;
        return !!value;
      }),
    event_end_date: yup
      .string()
      .test('required-for-range', 'End date is required for date range', function (value) {
        const { schedule_type } = this.parent;
        // Only required for date_range
        if (schedule_type !== 'date_range') return true;
        return !!value;
      })
      .test('is-after-start', 'End date must be after start date', function (value) {
        const { event_start_date, schedule_type } = this.parent;
        if (schedule_type !== 'date_range') return true;
        if (!value || !event_start_date) return true;
        const endDate = value.substring(0, 10);
        const startDate = event_start_date.substring(0, 10);
        return endDate > startDate;
      }),
    registration_deadline: yup
      .string()
      .required('Registration deadline is required')
      .test('is-before', 'Deadline must be before/on event start', function (value) {
        const { event_start_date, schedule_type, event_dates } = this.parent;
        // For multiple_dates, derive start date from event_dates array
        let effectiveStartDate = event_start_date;
        if (schedule_type === 'multiple_dates' && event_dates?.length > 0) {
          const validDates = event_dates.filter(d => d.date).map(d => d.date);
          if (validDates.length > 0) {
            effectiveStartDate = [...validDates].sort()[0];
          }
        }
        if (!value || !effectiveStartDate) return true;
        // Compare date strings directly (YYYY-MM-DD format) to avoid timezone issues
        const deadlineDate = value.substring(0, 10);
        const startDate = effectiveStartDate.substring(0, 10);
        return deadlineDate <= startDate;
      }),
    registration_start_date: yup
      .string()
      .nullable()
      .test('is-before-deadline', 'Registration start must be before deadline', function (value) {
        const { registration_deadline } = this.parent;
        if (!value || !registration_deadline) return true;
        const startDate = value.substring(0, 10);
        const deadlineDate = registration_deadline.substring(0, 10);
        return startDate <= deadlineDate;
      }),
    result_announced_date: yup
      .string()
      .nullable()
      .test('is-after-event', 'Result date must be on or after event end', function (value) {
        const { event_end_date, event_start_date, schedule_type } = this.parent;
        // Use event_end_date for date_range, event_start_date for single_date
        const eventDate = schedule_type === 'date_range' ? event_end_date : event_start_date;
        if (!value || !eventDate) return true;
        const resultDate = value.substring(0, 10);
        const endDate = eventDate.substring(0, 10);
        return resultDate >= endDate;
      }),
    event_dates: yup.array().of(
      yup.object({
        label: yup.string(),
        date: yup.string()
      })
    ).test('min-dates', 'At least one event date is required', function (value) {
      const { schedule_type } = this.parent;
      if (schedule_type !== 'multiple_dates') return true;
      const validDates = (value || []).filter(d => d.date);
      return validDates.length > 0;
    }).default([]),
    base_fee_inr: yup.number().transform((value, orig) => orig === '' ? undefined : value).min(0, 'Must be positive').required('INR fee is required'),
    base_fee_usd: yup.number().transform((value, orig) => orig === '' ? undefined : value).min(0, 'Must be positive').required('USD fee is required'),
    max_participants: yup.number().transform((value, orig) => orig === '' ? null : value).min(1, 'Must be at least 1').nullable().optional(),

    // Step 3: Form Schema - Make optional, validate in onSubmit
    form_schema: yup.array().default([]),

    // Step 4: Optional fields
    bulk_discount_rules: yup.array().default([]),
    status: yup.string(),
    is_featured: yup.boolean().default(false),
    rules_document_url: yup.string().url('Must be a valid URL').nullable(),
  });

  const methods = useForm({
    resolver: yupResolver(eventSchema),
    defaultValues: defaultValues || {
      title: '',
      event_slug: '',
      category: 'olympiad',
      event_type: 'olympiad',
      grade_levels: [],
      short_description: '',
      description: '',
      schedule_type: 'date_range',
      event_start_date: '',
      event_end_date: '',
      event_dates: [],
      registration_start_date: '',
      registration_deadline: '',
      result_announced_date: '',
      base_fee_inr: '',
      base_fee_usd: '',
      max_participants: '',
      form_schema: [],
      bulk_discount_rules: [],
      status: 'draft',
      is_featured: false,
      rules_document_url: '',
      certificate_config_india: {
        enabled: false,
        website_url: '',
        certificate_issuance_url: '',
        health_check_url: '',
        key_validation_url: '',
        api_key: '',
        template_id: '',
        auto_generate: false,
      },
      certificate_config_international: {
        enabled: false,
        website_url: '',
        certificate_issuance_url: '',
        health_check_url: '',
        key_validation_url: '',
        api_key: '',
        template_id: '',
        auto_generate: false,
      },
    },
    mode: 'onChange',
  });

  const { handleSubmit, watch, setValue, trigger, formState: { errors } } = methods;

  const title = watch('title');

  // Auto-generate slug from title
  useEffect(() => {
    if (title && mode === 'create') {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('event_slug', slug);
    }
  }, [title, mode, setValue]);

  // Reset form when defaultValues change (edit mode)
  useEffect(() => {
    if (defaultValues && mode === 'edit') {
      methods.reset(defaultValues);
      // Clear validation errors after reset
      setTimeout(() => methods.clearErrors(), 0);
    }
  }, [defaultValues, mode, methods]);

  // Update banner preview when defaultValues change (edit mode)
  useEffect(() => {
    if (defaultValues?.banner_url && mode === 'edit') {
      setBannerPreview(defaultValues.banner_url);
      setBannerUrl(defaultValues.banner_url);
    }
    if (defaultValues && mode === 'edit') {
      setPosters(defaultValues.posters || []);
      setBrochures(defaultValues.brochures || []);
      setNoticeUrl(defaultValues.notice_url || null);
    }
  }, [defaultValues, mode]);

  // Sync event_dates to event_start_date/event_end_date for multiple_dates mode
  const scheduleType = watch('schedule_type');
  const eventDates = watch('event_dates');

  useEffect(() => {
    if (scheduleType === 'multiple_dates' && eventDates?.length > 0) {
      const validDates = eventDates.filter(d => d.date).map(d => d.date);
      if (validDates.length > 0) {
        const sorted = [...validDates].sort();
        setValue('event_start_date', sorted[0], { shouldValidate: false });
        setValue('event_end_date', sorted[sorted.length - 1], { shouldValidate: false });
      }
    }
  }, [scheduleType, eventDates, setValue]);

  // Sync category with event_type (for legacy compatibility)
  const eventType = watch('event_type');
  useEffect(() => {
    if (eventType) {
      // If event_type matches one of the legacy categories, use it
      // Otherwise default to 'other' or a mapped value
      const validCategories = ['olympiad', 'championship', 'competition', 'workshop', 'other'];
      const newCategory = validCategories.includes(eventType) ? eventType : 'other';
      setValue('category', newCategory, { shouldValidate: true });
    }
  }, [eventType, setValue]);

  const handleNext = async () => {
    let isValid = false;

    // Validate current step
    if (currentStep === 0) {
      isValid = await trigger([
        'title',
        'event_slug',
        'category',
        'event_type',
        'grade_levels',
        'short_description',
        'description',
      ]);
    } else if (currentStep === 1) {
      const scheduleType = watch('schedule_type');
      const fieldsToValidate = ['registration_deadline', 'registration_start_date', 'base_fee_inr', 'base_fee_usd'];

      if (scheduleType === 'single_date') {
        fieldsToValidate.push('event_start_date');
      } else if (scheduleType === 'date_range') {
        fieldsToValidate.push('event_start_date', 'event_end_date');
      } else if (scheduleType === 'multiple_dates') {
        fieldsToValidate.push('event_dates');
      }

      isValid = await trigger(fieldsToValidate);
    } else if (currentStep === 2) {
      isValid = await trigger(['form_schema']);
      const formSchema = watch('form_schema');
      if (formSchema.length === 0) {
        showError('Please add at least one field to the form');
        return;
      }
    } else {
      isValid = true;
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else {
      showError('Please fix the errors before continuing');
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        showError('Banner file must be less than 20MB');
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const uploadBannerToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('folder', 'events');
    formData.append('tags', 'event-banner');

    try {
      // Use our backend media upload endpoint instead of direct Cloudinary upload
      // This ensures consistent error handling and database tracking
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Banner upload failed');
      }

      // Backend returns array of uploaded files
      if (data.data && data.data.media && data.data.media.length > 0) {
        return data.data.media[0].file_url;
      } else {
        throw new Error('No file URL in response');
      }
    } catch (error) {
      console.error('Banner upload error:', error);
      throw new Error(error.message || 'Banner upload failed');
    }
  };

  const onSubmit = async (data) => {
    let payload = null;
    try {
      // Validate form_schema
      if (!data.form_schema || data.form_schema.length === 0) {
        showError('Please add at least one form field in Step 3');
        setCurrentStep(2); // Go back to form builder
        return;
      }

      // Use banner URL from state (from media library)
      const bannerUrlToUse = bannerUrl || defaultValues?.banner_url || null;

      // Process form_schema field_options (convert comma-separated to array)
      const processedFormSchema = data.form_schema.map((field) => ({
        ...field,
        field_options:
          field.field_type === 'select' && field.field_options
            ? (Array.isArray(field.field_options)
              ? field.field_options
              : field.field_options.split(',').map((opt) => opt.trim()))
            : undefined,
      }));

      // Build schedule object based on schedule_type
      const schedule = {
        registration_start: data.registration_start_date || null,
        registration_deadline: data.registration_deadline,
        result_date: data.result_announced_date || null
      };

      if (data.schedule_type === 'single_date') {
        schedule.event_date = data.event_start_date;
        // Ensure event_end_date matches start date or is null to pass backend validation
        data.event_end_date = data.event_start_date;
      } else if (data.schedule_type === 'date_range') {
        schedule.date_range = {
          start: data.event_start_date,
          end: data.event_end_date
        };
      } else if (data.schedule_type === 'multiple_dates') {
        schedule.event_dates = (data.event_dates || []).filter(d => d.date);
        // Set start/end from first/last dates for backward compatibility
        if (schedule.event_dates.length > 0) {
          const sortedDates = [...schedule.event_dates].sort((a, b) =>
            new Date(a.date) - new Date(b.date)
          );
          data.event_start_date = sortedDates[0].date;
          data.event_end_date = sortedDates[sortedDates.length - 1].date;
        }
      }

      payload = {
        ...data,
        form_schema: processedFormSchema,
        form_schema: processedFormSchema,
        banner_url: bannerUrlToUse,
        posters,
        brochures,
        notice_url: noticeUrl,
        schedule,
      };

      if (mode === 'edit' && eventId) {
        await updateEvent.mutateAsync({ eventId, eventData: payload });
        showSuccess('Event updated successfully!');
        navigate(`/admin/events/${eventId}`);
      } else {
        const result = await createEvent.mutateAsync(payload);
        console.log('Create event result:', result);
        showSuccess('Event created successfully!');
        // Handle different response structures
        const createdEventId = result?.data?.event?._id || result?.event?._id || result?._id;
        if (createdEventId) {
          navigate(`/admin/events/${createdEventId}`);
        } else {
          navigate('/admin/events');
        }
      }
    } catch (error) {
      console.error('Event creation error:', error);
      console.error('Error response:', error.response?.data);
      if (payload) console.error('Payload sent:', payload);
      showError(error.response?.data?.message || `Failed to ${mode} event`);
    }
  };

  // Event type options for dropdown
  const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(([value, info]) => ({
    value,
    label: info.label,
    icon: info.icon,
    description: info.description
  }));

  // Legacy categories (kept for backward compatibility)
  const CATEGORIES = [
    { value: 'olympiad', label: 'Olympiad', icon: '🏆' },
    { value: 'championship', label: 'Championship', icon: '🥇' },
    { value: 'competition', label: 'Competition', icon: '🎯' },
    { value: 'workshop', label: 'Workshop', icon: '🎓' },
    { value: 'other', label: 'Other', icon: '📌' },
  ];

  const handleFormSubmit = (e) => {
    console.log('Form submit triggered');
    console.log('Validation errors:', errors);
    console.log('Form values:', watch());
    handleSubmit(onSubmit)(e);
  };

  return (
    <AdminLayout>
      <FormProvider {...methods}>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {mode === 'edit' ? 'Edit Event' : 'Create New Event'}
              </h1>
              <p className="text-gray-600 mt-1">
                {mode === 'edit'
                  ? 'Update event information'
                  : 'Fill in the details to create a new event'}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/admin/events')}>
              Cancel
            </Button>
          </div>

          {/* Show validation errors */}
          {Object.keys(errors).length > 0 && (
            <Card>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h3>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>{field}: {error.message}</li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* Stepper */}
          <Card>
            <Stepper steps={steps} currentStep={currentStep} />
          </Card>

          {/* Step Content */}
          <Card>
            <Card.Body>
              {/* Step 1: Basic Info */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...methods.register('title')}
                      placeholder="e.g., National Science Olympiad 2024"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Event Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...methods.register('event_slug')}
                      placeholder="e.g., national-science-olympiad-2024"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      readOnly={mode === 'create'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-generated from title. Used in event URL.
                    </p>
                    {errors.event_slug && (
                      <p className="text-sm text-red-600 mt-1">{errors.event_slug.message}</p>
                    )}
                  </div>

                  {/* Event Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...methods.register('event_type')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {EVENT_TYPE_OPTIONS.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {EVENT_TYPE_LABELS[watch('event_type')]?.description || 'Select event type'}
                    </p>
                    {errors.event_type && (
                      <p className="text-sm text-red-600 mt-1">{errors.event_type.message}</p>
                    )}
                  </div>

                  {/* Grade Levels */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade Levels <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                      {GRADE_LEVELS.map((grade) => (
                        <label
                          key={grade.value}
                          className="flex items-center justify-center p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-purple-50 has-[:checked]:bg-purple-100 has-[:checked]:border-purple-500"
                        >
                          <input
                            type="checkbox"
                            value={grade.value}
                            {...methods.register('grade_levels')}
                            className="sr-only"
                          />
                          <span className="text-xs font-medium text-center">
                            {grade.value === 'below_1' ? '<1' : grade.value}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Select applicable grade levels (including "Below Grade 1" for pre-school)
                    </p>
                    {errors.grade_levels && (
                      <p className="text-sm text-red-600 mt-1">{errors.grade_levels.message}</p>
                    )}
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description
                    </label>
                    <Controller
                      name="short_description"
                      control={methods.control}
                      render={({ field }) => (
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Brief summary (max 500 characters)"
                          maxLength={500}
                          minHeight="80px"
                          error={errors.short_description}
                        />
                      )}
                    />
                    {errors.short_description && (
                      <p className="text-sm text-red-600 mt-1">{errors.short_description.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Description <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="description"
                      control={methods.control}
                      render={({ field }) => (
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Detailed event description (max 2000 characters)"
                          maxLength={2000}
                          minHeight="150px"
                          error={errors.description}
                        />
                      )}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Dates & Pricing */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Dates & Pricing</h2>

                  {/* Schedule Type Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Type
                    </label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="single_date"
                          {...methods.register('schedule_type')}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm">Single Date</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="date_range"
                          {...methods.register('schedule_type')}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm">Date Range</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="multiple_dates"
                          {...methods.register('schedule_type')}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm">Multiple Dates</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {watch('schedule_type') === 'single_date' && 'Event occurs on a single day'}
                      {watch('schedule_type') === 'date_range' && 'Event spans multiple consecutive days'}
                      {watch('schedule_type') === 'multiple_dates' && 'Event occurs on specific non-consecutive dates'}
                    </p>
                  </div>

                  {/* Event Dates - Conditional based on schedule_type */}
                  {watch('schedule_type') === 'single_date' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        {...methods.register('event_start_date')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {errors.event_start_date && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.event_start_date.message}
                        </p>
                      )}
                    </div>
                  )}

                  {watch('schedule_type') === 'date_range' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Event Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          {...methods.register('event_start_date')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        {errors.event_start_date && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.event_start_date.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Event End Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          {...methods.register('event_end_date')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        {errors.event_end_date && (
                          <p className="text-sm text-red-600 mt-1">{errors.event_end_date.message}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {watch('schedule_type') === 'multiple_dates' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Dates
                      </label>
                      <div className="space-y-3">
                        {(watch('event_dates') || []).map((eventDate, index) => (
                          <div key={index} className="flex gap-3 items-center">
                            <input
                              type="text"
                              placeholder="Label (e.g., Round 1)"
                              value={eventDate.label || ''}
                              onChange={(e) => {
                                const dates = [...(watch('event_dates') || [])];
                                dates[index] = { ...dates[index], label: e.target.value };
                                setValue('event_dates', dates);
                              }}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <input
                              type="date"
                              value={eventDate.date || ''}
                              onChange={(e) => {
                                const dates = [...(watch('event_dates') || [])];
                                dates[index] = { ...dates[index], date: e.target.value };
                                setValue('event_dates', dates);
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const dates = [...(watch('event_dates') || [])];
                                dates.splice(index, 1);
                                setValue('event_dates', dates);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const dates = [...(watch('event_dates') || []), { label: '', date: '' }];
                            setValue('event_dates', dates);
                          }}
                        >
                          + Add Date
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Add multiple event dates with optional labels
                      </p>
                      {errors.event_dates && (
                        <p className="text-sm text-red-600 mt-1">{errors.event_dates.message}</p>
                      )}
                      {/* Hidden fields for start/end dates (auto-populated from event_dates) */}
                      <input type="hidden" {...methods.register('event_start_date')} />
                      <input type="hidden" {...methods.register('event_end_date')} />
                    </div>
                  )}

                  {/* Registration Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Registration Start Date
                      </label>
                      <input
                        type="date"
                        {...methods.register('registration_start_date')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {errors.registration_start_date && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.registration_start_date.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Registration Deadline <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        {...methods.register('registration_deadline')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {errors.registration_deadline && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.registration_deadline.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Result Announced Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Result Announced Date (Optional)
                    </label>
                    <input
                      type="date"
                      {...methods.register('result_announced_date')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Date when results will be announced and certificates become available
                    </p>
                    {errors.result_announced_date && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.result_announced_date.message}
                      </p>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Fee (INR) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          ₹
                        </span>
                        <input
                          type="number"
                          {...methods.register('base_fee_inr')}
                          placeholder="e.g., 500"
                          min="0"
                          step="0.01"
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      {errors.base_fee_inr && (
                        <p className="text-sm text-red-600 mt-1">{errors.base_fee_inr.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Fee (USD) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          {...methods.register('base_fee_usd')}
                          placeholder="e.g., 10"
                          min="0"
                          step="0.01"
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      {errors.base_fee_usd && (
                        <p className="text-sm text-red-600 mt-1">{errors.base_fee_usd.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Max Participants */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Participants (Optional)
                    </label>
                    <input
                      type="number"
                      {...methods.register('max_participants')}
                      placeholder="Leave empty for unlimited"
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Set a cap on total registrations (optional)
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Form Builder */}
              {currentStep === 2 && <FormSchemaBuilder />}

              {/* Step 4: Discounts & Media */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <h2 className="text-xl font-semibold text-gray-900">Discounts & Media</h2>

                  {/* Discount Rules */}
                  <DiscountRulesEditor />

                  {/* Banner Upload */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Banner</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Banner Image
                        </label>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setMediaPickerConfig({ type: 'banner', accept: ['image'] });
                            setShowMediaPicker(true);
                          }}
                          className="w-full"
                        >
                          {bannerUrl ? 'Change Banner' : 'Select from Media Library'}
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">
                          Recommended: 1200x600px, Max 10MB (JPG, PNG)
                        </p>
                      </div>

                      {bannerUrl && (
                        <div className="relative">
                          <img
                            src={bannerUrl}
                            alt="Banner preview"
                            className="w-full h-64 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setBannerUrl(null);
                              setBannerPreview(null);
                              setBannerFile(null);
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Posters Management */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Posters</h3>
                    <div className="space-y-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setMediaPickerConfig({ type: 'poster', accept: ['image'] });
                          setShowMediaPicker(true);
                        }}
                      >
                        + Add Poster
                      </Button>

                      {posters.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {posters.map((url, idx) => (
                            <div key={idx} className="relative group">
                              <img src={url} alt={`Poster ${idx + 1}`} className="h-32 w-full object-cover rounded-lg border" />
                              <button
                                type="button"
                                onClick={() => setPosters(posters.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Brochures Management */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Brochures</h3>
                    <div className="space-y-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setMediaPickerConfig({ type: 'brochure', accept: ['document'] });
                          setShowMediaPicker(true);
                        }}
                      >
                        + Add Brochure (PDF/Doc)
                      </Button>

                      {brochures.length > 0 && (
                        <ul className="space-y-2">
                          {brochures.map((url, idx) => (
                            <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 truncate hover:underline text-sm">{url.split('/').pop()}</a>
                              <button
                                type="button"
                                onClick={() => setBrochures(brochures.filter((_, i) => i !== idx))}
                                className="text-red-600 hover:text-red-800"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Notice Management */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Official Notice</h3>
                    <div className="space-y-4">
                      <div className="flex gap-4 items-center">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setMediaPickerConfig({ type: 'notice', accept: ['document'] });
                            setShowMediaPicker(true);
                          }}
                        >
                          {noticeUrl ? 'Change Notice File' : 'Select Notice File'}
                        </Button>
                        {noticeUrl && (
                          <div className="flex items-center gap-2">
                            <a href={noticeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">View Current Notice</a>
                            <button
                              type="button"
                              onClick={() => setNoticeUrl(null)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Event Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Status
                    </label>
                    <select
                      {...methods.register('status')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="draft">Draft (Not visible to schools)</option>
                      <option value="active">Active (Open for registration)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      You can change this later from the event details page
                    </p>
                  </div>

                  {/* Featured Event Toggle */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...methods.register('is_featured')}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Mark as Featured Event
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      Featured events are highlighted and shown prominently
                    </p>
                  </div>

                  {/* Rules Document URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rules Document URL (Optional)
                    </label>
                    <input
                      type="url"
                      {...methods.register('rules_document_url')}
                      placeholder="https://example.com/rules.pdf"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Link to event rules or guidelines document (PDF, Google Docs, etc.)
                    </p>
                    {errors.rules_document_url && (
                      <p className="text-sm text-red-600 mt-1">{errors.rules_document_url.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Certificate Settings */}
              {currentStep === 4 && (
                <div className="space-y-8">
                  <h2 className="text-xl font-semibold text-gray-900">Certificate Settings</h2>
                  <p className="text-gray-600">Configure external certificate generation APIs for India and International students</p>

                  {/* India Configuration */}
                  <div className="border border-gray-200 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">India Region</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          {...methods.register('certificate_config_india.enabled')}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Enable</span>
                      </label>
                    </div>

                    {watch('certificate_config_india.enabled') && (
                      <div className="space-y-4 pt-4 border-t">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                          <input
                            type="url"
                            {...methods.register('certificate_config_india.website_url')}
                            placeholder="https://scratcholympiads.in/"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Issuance URL</label>
                          <input
                            type="url"
                            {...methods.register('certificate_config_india.certificate_issuance_url')}
                            placeholder="https://scratcholympiads.in/wp-json/certificate-generator/v1/issue-certificate"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Health Check URL</label>
                          <input
                            type="url"
                            {...methods.register('certificate_config_india.health_check_url')}
                            placeholder="https://scratcholympiads.in/wp-json/certificate-generator/v1/health"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Key Validation URL</label>
                          <input
                            type="url"
                            {...methods.register('certificate_config_india.key_validation_url')}
                            placeholder="https://scratcholympiads.in/wp-json/certificate-generator/v1/validate-key"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">API Key (Bearer Token)</label>
                          <input
                            type="text"
                            {...methods.register('certificate_config_india.api_key')}
                            placeholder="Enter API key"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Template ID (Optional)</label>
                          <input
                            type="text"
                            {...methods.register('certificate_config_india.template_id')}
                            placeholder="Enter template ID"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              {...methods.register('certificate_config_india.auto_generate')}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Auto-generate certificates on result upload</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* International Configuration */}
                  <div className="border border-gray-200 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">International Region</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          {...methods.register('certificate_config_international.enabled')}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Enable</span>
                      </label>
                    </div>

                    {watch('certificate_config_international.enabled') && (
                      <div className="space-y-4 pt-4 border-t">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                          <input
                            type="url"
                            {...methods.register('certificate_config_international.website_url')}
                            placeholder="https://scratcholympiads.com/"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Issuance URL</label>
                          <input
                            type="url"
                            {...methods.register('certificate_config_international.certificate_issuance_url')}
                            placeholder="https://scratcholympiads.com/wp-json/certificate-generator/v1/issue-certificate"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Health Check URL</label>
                          <input
                            type="url"
                            {...methods.register('certificate_config_international.health_check_url')}
                            placeholder="https://scratcholympiads.com/wp-json/certificate-generator/v1/health"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Key Validation URL</label>
                          <input
                            type="url"
                            {...methods.register('certificate_config_international.key_validation_url')}
                            placeholder="https://scratcholympiads.com/wp-json/certificate-generator/v1/validate-key"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">API Key (Bearer Token)</label>
                          <input
                            type="text"
                            {...methods.register('certificate_config_international.api_key')}
                            placeholder="Enter API key"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Template ID (Optional)</label>
                          <input
                            type="text"
                            {...methods.register('certificate_config_international.template_id')}
                            placeholder="Enter template ID"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              {...methods.register('certificate_config_international.auto_generate')}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Auto-generate certificates on result upload</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 6: Review */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Review & Confirm</h2>

                  {/* Summary */}
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Basic Information</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStep(0)}
                        >
                          Edit
                        </Button>
                      </div>
                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-gray-600">Title:</dt>
                          <dd className="font-medium">{watch('title')}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Slug:</dt>
                          <dd className="font-medium">{watch('event_slug')}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Category:</dt>
                          <dd className="font-medium capitalize">{watch('category')}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Grades:</dt>
                          <dd className="font-medium">{watch('grade_levels')?.join(', ')}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Dates & Pricing */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Dates & Pricing</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStep(1)}
                        >
                          Edit
                        </Button>
                      </div>
                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-gray-600">Event Date:</dt>
                          <dd className="font-medium">
                            {watch('event_start_date')} to {watch('event_end_date')}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Registration Deadline:</dt>
                          <dd className="font-medium">{watch('registration_deadline')}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Fee (INR):</dt>
                          <dd className="font-medium">₹{watch('base_fee_inr')}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Fee (USD):</dt>
                          <dd className="font-medium">${watch('base_fee_usd')}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Form Schema */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Registration Form</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStep(2)}
                        >
                          Edit
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        {watch('form_schema')?.length || 0} field(s) configured
                      </p>
                    </div>

                    {/* Discounts */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Bulk Discounts</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStep(3)}
                        >
                          Edit
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        {watch('bulk_discount_rules')?.length || 0} discount tier(s) configured
                      </p>
                    </div>

                    {/* Status */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Status</h3>
                        <Badge variant={watch('status') === 'active' ? 'success' : 'warning'}>
                          {watch('status')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-900">Ready to submit?</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Review all information carefully. You can edit the event later if needed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Navigation Buttons */}
          <Card>
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </Button>

              <div className="text-sm text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </div>

              {currentStep < steps.length - 1 ? (
                <Button type="button" variant="primary" onClick={handleNext}>
                  Next
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  loading={createEvent.isPending || updateEvent.isPending}
                  disabled={createEvent.isPending || updateEvent.isPending}
                >
                  {mode === 'edit' ? 'Update Event' : 'Create Event'}
                </Button>
              )}
            </div>
          </Card>
        </form>

        {/* Media Picker Modal */}
        <MediaPicker
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(media) => {
            if (mediaPickerConfig.type === 'banner') {
              setBannerUrl(media.file_url);
              setBannerPreview(media.file_url);
            } else if (mediaPickerConfig.type === 'poster') {
              setPosters([...posters, media.file_url]);
            } else if (mediaPickerConfig.type === 'brochure') {
              setBrochures([...brochures, media.file_url]);
            } else if (mediaPickerConfig.type === 'notice') {
              setNoticeUrl(media.file_url);
            }
          }}
          selectedUrl={
            mediaPickerConfig.type === 'banner' ? bannerUrl :
              mediaPickerConfig.type === 'notice' ? noticeUrl : null
          }
          allowUpload={true}
          acceptTypes={mediaPickerConfig.accept}
        />
      </FormProvider>
    </AdminLayout>
  );
};

export default CreateEvent;
