import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { useEventBySlug } from '../../../hooks/useEvents';
import { useDownloadTemplate } from '../../../hooks/useBatches';
import { useFetchCertificate } from '../../../hooks/useCertificate';
import { Card, Badge, Button, Spinner, Modal } from '../../../components/ui';
import { sanitizeHtml } from '../../../components/ui/RichTextEditor';
import { formatCurrency, formatDate } from '../../../utils/helpers';
import { showError, showSuccess } from '../../../components/common/Toast';
import useAuthStore from '../../../stores/authStore';

/**
 * Event Details Page
 * Displays full event information and registration options
 */
const EventDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const schoolCurrency = user?.currency_pref || user?.currency || 'USD';
  const { data: event, isLoading } = useEventBySlug(slug);
  const downloadTemplate = useDownloadTemplate();
  const fetchCertificate = useFetchCertificate();
  const [showFormPreview, setShowFormPreview] = useState(false);
  const [certificateEmail, setCertificateEmail] = useState('');
  const [certificateResult, setCertificateResult] = useState(null);

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate.mutateAsync(slug);
      showSuccess('Template downloaded successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to download template');
    }
  };

  const handleStartRegistration = () => {
    navigate(`/school/batches/upload/${slug}`);
  };

  const calculateBulkDiscount = (numStudents) => {
    if (!event || !event.bulk_discount_rules || event.bulk_discount_rules.length === 0) {
      return 0;
    }

    let applicableDiscount = 0;
    event.bulk_discount_rules.forEach((rule) => {
      if (numStudents >= rule.min_students) {
        applicableDiscount = Math.max(applicableDiscount, rule.discount_percentage);
      }
    });

    return applicableDiscount;
  };

  const handleFetchCertificate = async () => {
    if (!certificateEmail || !certificateEmail.includes('@')) {
      showError('Please enter a valid email address');
      return;
    }

    try {
      const result = await fetchCertificate.mutateAsync({
        eventId: event._id,
        email: certificateEmail,
      });
      setCertificateResult(result);
      showSuccess('Certificate found! Click the link below to download.');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to fetch certificate');
      setCertificateResult(null);
    }
  };

  if (isLoading) {
    return (
      <SchoolLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="xl" />
        </div>
      </SchoolLayout>
    );
  }

  if (!event) {
    return (
      <SchoolLayout>
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
            <p className="text-gray-600 mb-6">The event you're looking for doesn't exist.</p>
            <Link to="/school/events">
              <Button variant="primary">Back to Events</Button>
            </Link>
          </div>
        </Card>
      </SchoolLayout>
    );
  }

  return (
    <SchoolLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/school/events" className="text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
            <p className="text-gray-600 mt-1">Event Details & Registration</p>
          </div>
          <Badge variant={event.status === 'active' ? 'success' : 'info'}>
            {event.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Banner */}
            {event.banner_image_url ? (
              <Card noPadding>
                <img
                  src={event.banner_image_url}
                  alt={event.name}
                  className="w-full h-64 object-cover rounded-t-lg"
                />
              </Card>
            ) : (
              <Card noPadding>
                <div className="w-full h-64 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-t-lg flex items-center justify-center">
                  <svg className="w-24 h-24 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </Card>
            )}

            {/* Description */}
            <Card>
              <Card.Header>
                <Card.Title>About This Event</Card.Title>
              </Card.Header>
              <Card.Body>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.description) }}
                />
              </Card.Body>
            </Card>

            {/* Registration Form Preview */}
            {event.form_schema && event.form_schema.length > 0 && (
              <Card>
                <Card.Header>
                  <div className="flex items-center justify-between">
                    <Card.Title>Registration Form Fields</Card.Title>
                    <Button variant="outline" size="sm" onClick={() => setShowFormPreview(true)}>
                      Preview Form
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {event.form_schema.map((field, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-gray-700">{field.field_label}</span>
                        {field.is_required && <span className="text-red-500 text-xs">*</span>}
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Bulk Discounts */}
            {event.bulk_discount_rules && event.bulk_discount_rules.length > 0 && (
              <Card>
                <Card.Header>
                  <Card.Title>Bulk Registration Discounts</Card.Title>
                  <Card.Description>Save more when you register more students!</Card.Description>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    {event.bulk_discount_rules.map((rule, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                            {rule.discount_percentage}%
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {rule.min_students}+ Students
                            </p>
                            <p className="text-sm text-gray-600">
                              Get {rule.discount_percentage}% off
                            </p>
                          </div>
                        </div>
                        <Badge variant="success" size="sm">
                          Save {rule.discount_percentage}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Info Card */}
            <Card>
              <Card.Header>
                <Card.Title>Event Information</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {/* Date */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Event Date</p>
                    <div className="flex items-center gap-2 text-gray-900">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{formatDate(event.event_date)}</span>
                    </div>
                  </div>

                  {/* Location */}
                  {event.venue && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Venue</p>
                      <div className="flex items-start gap-2 text-gray-900">
                        <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">{event.venue}</span>
                      </div>
                    </div>
                  )}

                  {/* Fee */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Registration Fee</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(
                        schoolCurrency === 'INR' ? event.base_fee_inr : event.base_fee_usd,
                        schoolCurrency
                      )}
                    </p>
                  </div>

                  {/* Capacity */}
                  {event.capacity && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Capacity</p>
                      <p className="font-medium text-gray-900">{event.capacity} students</p>
                    </div>
                  )}

                  {/* Registration Period */}
                  {event.registration_start && event.registration_end && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Registration Period</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(event.registration_start)}
                      </p>
                      <p className="text-sm text-gray-600">to</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(event.registration_end)}
                      </p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Registration Actions */}
            <Card>
              <Card.Header>
                <Card.Title>Register Students</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleStartRegistration}
                    disabled={event.status !== 'active'}
                  >
                    Start Bulk Registration
                  </Button>

                  <Button
                    variant="outline"
                    fullWidth
                    onClick={handleDownloadTemplate}
                    loading={downloadTemplate.isPending}
                  >
                    Download Excel Template
                  </Button>

                  <div className="text-xs text-gray-500 mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="font-medium text-blue-900 mb-1">How to Register:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-800">
                      <li>Download the Excel template</li>
                      <li>Fill in student details</li>
                      <li>Upload and validate</li>
                      <li>Complete payment</li>
                    </ol>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Certificate Download Section */}
            <Card>
                <Card.Header>
                  <Card.Title>Download Certificate</Card.Title>
                  <Card.Description>Enter your email to get your certificate</Card.Description>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Student Email
                      </label>
                      <input
                        type="email"
                        value={certificateEmail}
                        onChange={(e) => setCertificateEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleFetchCertificate}
                      loading={fetchCertificate.isPending}
                      disabled={!certificateEmail}
                    >
                      Get Certificate
                    </Button>

                    {certificateResult && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-900 mb-2">
                          Certificate Ready!
                        </p>
                        <a
                          href={certificateResult.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800 font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Certificate (PDF)
                        </a>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="font-medium text-blue-900 mb-1">Note:</p>
                      <p className="text-blue-800">
                        Enter the email address you used during registration to download your certificate.
                      </p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
          </div>
        </div>
      </div>

      {/* Form Preview Modal */}
      <Modal
        isOpen={showFormPreview}
        onClose={() => setShowFormPreview(false)}
        title="Registration Form Preview"
        size="lg"
      >
        <div className="space-y-4">
          {event.form_schema?.map((field, index) => (
            <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-900">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <Badge variant="info" size="sm">{field.type}</Badge>
              </div>
              {field.placeholder && (
                <p className="text-sm text-gray-500">Placeholder: {field.placeholder}</p>
              )}
              {field.validation && (
                <p className="text-xs text-gray-400 mt-1">Validation: {JSON.stringify(field.validation)}</p>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </SchoolLayout>
  );
};

export default EventDetails;
