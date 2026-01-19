import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEventBySlug } from '../../hooks/useEvents';
import { Card, Badge, Button, Spinner, Modal } from '../../components/ui';
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
                <p className="text-gray-600 text-lg">{event.short_description || event.description?.substring(0, 100)}</p>
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
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{event.description}</p>
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
                  <div className="space-y-4">
                    {event.event_start_date && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Start Date</p>
                          <p className="text-sm text-gray-600">{formatDate(event.event_start_date)}</p>
                        </div>
                      </div>
                    )}

                    {event.event_end_date && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">End Date</p>
                          <p className="text-sm text-gray-600">{formatDate(event.event_end_date)}</p>
                        </div>
                      </div>
                    )}

                    {event.registration_deadline && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Registration Deadline</p>
                          <p className="text-sm text-red-600 font-medium">{formatDate(event.registration_deadline)}</p>
                        </div>
                      </div>
                    )}

                    {event.venue && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Venue</p>
                          <p className="text-sm text-gray-600">{event.venue}</p>
                        </div>
                      </div>
                    )}

                    {event.category && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Category</p>
                          <p className="text-sm text-gray-600">{event.category}</p>
                        </div>
                      </div>
                    )}

                    {event.max_participants && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Max Participants</p>
                          <p className="text-sm text-gray-600">{event.max_participants.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>

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
