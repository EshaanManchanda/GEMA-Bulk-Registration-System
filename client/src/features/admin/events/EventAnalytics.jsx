import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdminEventDetails } from '../../../hooks/useAdmin';
import { useEventAnalytics, useExportEventRegistrations } from '../../../hooks/useAnalytics';
import { Card, Spinner, Button, Badge } from '../../../components/ui';
import RegistrationTimeline from '@/features/admin/components/analytics/RegistrationTimeline';
import RevenueChart from '@/features/admin/components/analytics/RevenueChart';
import SchoolBreakdown from '@/features/admin/components/analytics/SchoolBreakdown';
import { formatCurrency } from '../../../utils/helpers';
import { showError, showSuccess } from '../../../components/common/Toast';

/**
 * Event Analytics Page
 * Charts and analytics for a single event
 */
const EventAnalytics = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading: eventLoading } = useAdminEventDetails(eventId);
  const event = data?.event;
  const { data: analytics, isLoading: analyticsLoading } = useEventAnalytics(eventId);
  const exportRegistrations = useExportEventRegistrations();

  const handleExport = async () => {
    try {
      await exportRegistrations(eventId);
      showSuccess('Export started! Check your downloads folder.');
    } catch (error) {
      showError('Failed to export registrations');
    }
  };

  if (eventLoading || analyticsLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="xl" />
        </div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout>
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
            <p className="text-gray-600 mb-6">The event you're looking for doesn't exist.</p>
            <Button variant="primary" onClick={() => navigate('/admin/events')}>
              Back to Events
            </Button>
          </div>
        </Card>
      </AdminLayout>
    );
  }

  const stats = analytics || {};
  const {
    total_registrations = 0,
    total_revenue_inr = 0,
    total_revenue_usd = 0,
    avg_batch_size = 0,
    largest_batch_size = 0,
    registration_timeline = [],
    school_breakdown = [],
  } = stats;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/admin/events/${eventId}`)}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Analytics</h1>
              <p className="text-gray-600 mt-1">{event.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/admin/events/${eventId}/edit`}>
              <Button variant="outline">Edit Event</Button>
            </Link>
            <Button variant="primary" onClick={handleExport}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">{total_registrations}</p>
              <p className="text-sm text-gray-600 mt-1">Total Registrations</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {avg_batch_size ? avg_batch_size.toFixed(1) : '0'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Avg Batch Size</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">{largest_batch_size}</p>
              <p className="text-sm text-gray-600 mt-1">Largest Batch</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(total_revenue_inr, 'INR')}
                </p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(total_revenue_usd, 'USD')}
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
            </div>
          </Card>
        </div>

        {/* Registration Timeline */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <Card.Title>Registration Timeline</Card.Title>
                <p className="text-sm text-gray-600 mt-1">
                  Daily registrations over time
                </p>
              </div>
              <Badge variant="info">
                {registration_timeline.length} day{registration_timeline.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </Card.Header>
          <Card.Body>
            <RegistrationTimeline data={registration_timeline} />
          </Card.Body>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* School Breakdown */}
          <Card className="lg:col-span-2">
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>
                  <Card.Title>School Breakdown</Card.Title>
                  <p className="text-sm text-gray-600 mt-1">
                    Registrations and revenue by school
                  </p>
                </div>
                <Badge variant="info">
                  {school_breakdown.length} school{school_breakdown.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <SchoolBreakdown schools={school_breakdown} />
            </Card.Body>
          </Card>

          {/* Revenue Distribution */}
          <Card>
            <Card.Header>
              <div>
                <Card.Title>Revenue Distribution</Card.Title>
                <p className="text-sm text-gray-600 mt-1">
                  Revenue breakdown by currency
                </p>
              </div>
            </Card.Header>
            <Card.Body>
              <RevenueChart
                totalRevenueInr={total_revenue_inr}
                totalRevenueUsd={total_revenue_usd}
              />
            </Card.Body>
          </Card>

          {/* Key Insights */}
          <Card>
            <Card.Header>
              <Card.Title>Key Insights</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Registration Rate</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {total_registrations > 0
                        ? `${(
                          (total_registrations / (event.max_participants || total_registrations)) *
                          100
                        ).toFixed(1)}% of capacity`
                        : 'No registrations yet'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Revenue per Student</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {total_registrations > 0
                        ? formatCurrency(total_revenue_inr / total_registrations, 'INR')
                        : formatCurrency(0, 'INR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Participating Schools</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {school_breakdown.length} school{school_breakdown.length !== 1 ? 's' : ''}{' '}
                      registered
                    </p>
                  </div>
                </div>

                {largest_batch_size > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Top Performance</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Largest single batch: {largest_batch_size} students
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Empty State */}
        {total_registrations === 0 && (
          <Card>
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Yet</h3>
              <p className="text-gray-600 mb-4">
                Analytics will appear once schools start registering for this event.
              </p>
              <Link to={`/admin/events/${eventId}`}>
                <Button variant="primary">View Event Details</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default EventAnalytics;
