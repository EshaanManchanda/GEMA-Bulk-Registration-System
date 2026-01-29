import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEventBySlug } from '../../hooks/useEvents';
import { Card, Badge, Button, Spinner, Modal } from '../../components/ui';
import { sanitizeHtml, getTextFromHtml } from '../../components/ui/RichTextEditor';
import { formatDate } from '../../utils/helpers';

/**
 * Public Event Details Page
 * Accessible without authentication for marketing and information
 */
const EventPublic = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: event, isLoading } = useEventBySlug(slug);
  const [showFormPreview, setShowFormPreview] = useState(false);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Card className="max-w-md mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
            <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or is no longer available.</p>
            <Link to="/">
              <Button variant="primary">Go to Homepage</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img src="/assets/images/gema-logo.png" alt="GEMA Events" className="h-10 w-auto" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/school/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link to="/school/register">
                <Button variant="primary" size="sm">Register School</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">{event.name}</h1>
                  <Badge variant={event.status === 'active' ? 'success' : 'info'}>
                    {event.status}
                  </Badge>
                </div>
                <p className="text-gray-600 text-lg">
                  {getTextFromHtml(event.short_description) || getTextFromHtml(event.description)?.substring(0, 100)}
                </p>
              </div>
            </div>
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
                    className="w-full h-80 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div class="w-full h-80 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-lg flex items-center justify-center">
                          <svg class="w-24 h-24 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      `;
                    }}
                  />
                </Card>
              ) : (
                <Card noPadding>
                  <div className="w-full h-80 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-lg flex items-center justify-center">
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
                    <Card.Title>Registration Requirements</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-gray-600 mb-4">The following information will be required for each student:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Default fields */}
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-gray-700">Student Name</span>
                        <span className="text-red-500 text-xs">*</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-gray-700">Grade</span>
                        <span className="text-red-500 text-xs">*</span>
                      </div>

                      {/* Custom fields */}
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
                  </Card.Header>
                  <Card.Body>
                    <p className="text-gray-600 mb-4">Register more students and save:</p>
                    <div className="space-y-2">
                      {event.bulk_discount_rules
                        .sort((a, b) => a.min_students - b.min_students)
                        .map((rule, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{rule.discount_percentage}%</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {rule.min_students}+ Students
                                </p>
                                <p className="text-sm text-gray-600">
                                  {rule.discount_percentage}% discount applied
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </Card.Body>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Call to Action */}
              <Card>
                <Card.Body>
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <Link to="/school/register" className="block">
                        <Button variant="primary" className="w-full" size="lg">
                          Register Your School
                        </Button>
                      </Link>
                      <Link to="/school/login" className="block">
                        <Button variant="outline" className="w-full">
                          Login to Register Students
                        </Button>
                      </Link>
                    </div>

                    <p className="text-xs text-gray-500">
                      You need a school account to register students for this event
                    </p>
                  </div>
                </Card.Body>
              </Card>

              {/* Event Details */}
              <Card>
                <Card.Header>
                  <Card.Title>Event Details</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Multiple Dates Template */}
                    {event.schedule_type === 'multiple_dates' && event.schedule?.event_dates?.map((dateItem, index) => (
                      <div key={index} className="col-span-2 sm:col-span-1">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                          Date {dateItem.label || index + 1}
                        </p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(dateItem.date)}
                        </p>
                      </div>
                    ))}

                    {/* Single Date Template */}
                    {event.schedule_type === 'single_date' && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Event Date</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(event.schedule?.event_date || event.event_start_date)}
                        </p>
                      </div>
                    )}

                    {/* Date Range Template (Default) */}
                    {(event.schedule_type === 'date_range' || !event.schedule_type) && (
                      <>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Start Date</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(event.schedule?.date_range?.start || event.event_start_date)}
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">End Date</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(event.schedule?.date_range?.end || event.event_end_date)}
                          </p>
                        </div>
                      </>
                    )}

                    {event.registration_deadline && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Registration Deadline</p>
                        <p className="text-sm font-medium text-red-600 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDate(event.registration_deadline)}
                        </p>
                      </div>
                    )}

                    {event.venue && (
                      <div className="col-span-2 border-t pt-2 mt-2">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Venue</p>
                        <p className="text-sm font-medium text-gray-900 flex items-start gap-2">
                          <svg className="w-4 h-4 text-primary-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.venue}
                        </p>
                      </div>
                    )}

                    {event.category && (
                      <div className="col-span-2 border-t pt-2 mt-0">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Category</p>
                        <p className="text-sm font-medium text-gray-900 capitalize flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {event.category}
                        </p>
                      </div>
                    )}

                    {event.max_participants && (
                      <div className="col-span-2 border-t pt-2 mt-0">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Max Participants</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {event.max_participants.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>

              {/* Downloads & Resources */}
              {(event.notice_url || (event.brochures && event.brochures.length > 0) || (event.posters && event.posters.length > 0)) && (
                <Card>
                  <Card.Header>
                    <Card.Title>Downloads</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <div className="space-y-4">
                      {/* Official Notice */}
                      {event.notice_url && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Official Notice</p>
                          <a
                            href={event.notice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                            <span className="text-sm font-medium truncate">Download Notice</span>
                          </a>
                        </div>
                      )}

                      {/* Brochures */}
                      {event.brochures && event.brochures.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Brochures</p>
                          <div className="space-y-2">
                            {event.brochures.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                              >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-medium truncate">Brochure {event.brochures.length > 1 ? idx + 1 : ''}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Posters */}
                      {event.posters && event.posters.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Posters</p>
                          <div className="grid grid-cols-2 gap-2">
                            {event.posters.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block relative aspect-[2/3] rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
                              >
                                <img src={url} alt={`Poster ${idx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Contact */}
              {event.contact_email && (
                <Card>
                  <Card.Header>
                    <Card.Title>Need Help?</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${event.contact_email}`} className="text-primary-600 hover:underline">
                        {event.contact_email}
                      </a>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 text-sm">
            <p>&copy; {new Date().getFullYear()} GEMA Events. All rights reserved.</p>
            <p className="mt-2">Empowering Education Through Olympiads and Competitions</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EventPublic;
