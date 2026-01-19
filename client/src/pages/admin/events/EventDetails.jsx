import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  useAdminEventDetails,
  useToggleEventStatus,
  useDeleteEvent,
  useEventRegistrations,
  useEventBatches,
} from '../../../hooks/useAdmin';
import { Card, Badge, Tabs, Spinner, Button, Modal } from '../../../components/ui';
import { formatDate, formatCurrency } from '../../../utils/helpers';
import { BADGE_CLASSES, EVENT_STATUS } from '../../../utils/constants';
import { showError, showSuccess } from '../../../components/common/Toast';
import EventAnalytics from './EventAnalytics';

/**
 * Event Details Page
 * Admin page showing detailed information about an event
 */
const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useAdminEventDetails(eventId);
  const event = data?.event;
  const statistics = data?.statistics;

  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFormSchema, setShowFormSchema] = useState(false);
  const [regFilters, setRegFilters] = useState({
    search: '',
    status: '',
  });

  const toggleStatus = useToggleEventStatus();
  const deleteEvent = useDeleteEvent();
  const { data: batchesData, isLoading: loadingBatches } = useEventBatches(
    eventId,
    regFilters
  );

  const handleToggleStatus = async () => {
    try {
      await toggleStatus.mutateAsync(event._id);
      showSuccess(
        `Event ${event.status === EVENT_STATUS.ACTIVE ? 'closed' : 'activated'} successfully!`
      );
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to toggle event status');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent.mutateAsync(event._id);
      showSuccess('Event deleted successfully!');
      navigate('/admin/events');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete event');
    }
  };

  if (isLoading) {
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

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'registrations',
      label: 'Registrations',
      count: statistics?.total_registrations || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/events')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event?.title}</h1>
              <p className="text-gray-600 mt-1">Slug: {event?.event_slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={BADGE_CLASSES[event.status]?.variant || 'info'} size="lg">
              {event.status}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {statistics?.total_registrations || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Registrations</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(statistics?.total_revenue || 0, 'INR')}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {statistics?.total_batches || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Batches</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {batchesData?.pagination?.total || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Batch Records</p>
            </div>
          </Card>
        </div>

        {/* Action Bar */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Event Management</p>
                <p className="text-sm text-gray-600">
                  Status: {event?.status} • {statistics?.total_registrations || 0} registrations
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to={`/admin/events/${eventId}/edit`}>
                <Button variant="outline">Edit Event</Button>
              </Link>
              <Button
                variant={event.status === EVENT_STATUS.ACTIVE ? 'warning' : 'primary'}
                onClick={handleToggleStatus}
                loading={toggleStatus.isPending}
              >
                {event.status === EVENT_STATUS.ACTIVE ? 'Close Event' : 'Activate Event'}
              </Button>
              <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                Delete
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Banner */}
              {event?.banner_image_url && (
                <Card>
                  <Card.Header>
                    <Card.Title>Event Banner</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <img
                      src={event.banner_image_url}
                      alt={event?.title}
                      className="w-full h-64 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-64 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center text-white';
                        fallback.innerHTML = '<span class="text-sm">Banner image not available</span>';
                        e.target.parentNode.appendChild(fallback);
                      }}
                    />
                  </Card.Body>
                </Card>
              )}

              {/* Event Information */}
              <Card>
                <Card.Header>
                  <Card.Title>Event Information</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Event Name</p>
                      <p className="text-lg font-medium text-gray-900">{event?.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Event Slug</p>
                      <p className="text-lg font-medium text-gray-900">{event?.event_slug}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Category</p>
                      <Badge variant="info">{event?.category}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <Badge variant={BADGE_CLASSES[event?.status]?.variant || 'info'}>
                        {event?.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Event Start Date</p>
                      <p className="text-lg font-medium text-gray-900">
                        {formatDate(event?.event_start_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Registration Deadline</p>
                      <p className="text-lg font-medium text-gray-900">
                        {formatDate(event?.registration_deadline)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Registration Opens</p>
                      <p className="text-lg font-medium text-gray-900">
                        {formatDate(event?.registration_start_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Event End Date</p>
                      <p className="text-lg font-medium text-gray-900">
                        {formatDate(event?.event_end_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Fee (INR)</p>
                      <p className="text-lg font-medium text-gray-900">
                        {formatCurrency(event?.base_fee_inr, 'INR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Fee (USD)</p>
                      <p className="text-lg font-medium text-gray-900">
                        {formatCurrency(event?.base_fee_usd, 'USD')}
                      </p>
                    </div>
                    {event?.max_participants && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Max Participants</p>
                        <p className="text-lg font-medium text-gray-900">{event.max_participants}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Created</p>
                      <p className="text-lg font-medium text-gray-900">
                        {formatDate(event?.created_at)}
                      </p>
                    </div>
                  </div>
                  {event?.description && (
                    <div className="mt-6">
                      <p className="text-sm text-gray-600 mb-2">Description</p>
                      <p className="text-gray-900">{event.description}</p>
                    </div>
                  )}
                  {event?.short_description && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Short Description</p>
                      <p className="text-gray-900">{event.short_description}</p>
                    </div>
                  )}
                  {event?.grade_levels && event.grade_levels.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Grade Levels</p>
                      <div className="flex flex-wrap gap-2">
                        {event.grade_levels.map((grade, idx) => (
                          <Badge key={idx} variant="info">Grade {grade}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Form Schema */}
              {event.form_schema && event.form_schema.length > 0 && (
                <Card>
                  <Card.Header>
                    <div className="flex items-center justify-between">
                      <Card.Title>Registration Form Schema</Card.Title>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFormSchema(!showFormSchema)}
                      >
                        {showFormSchema ? 'Hide' : 'Show'} Fields ({event.form_schema.length})
                      </Button>
                    </div>
                  </Card.Header>
                  {showFormSchema && (
                    <Card.Body>
                      <div className="space-y-3">
                        {event.form_schema.map((field, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{field.field_type}</Badge>
                                {field.is_required && <Badge variant="danger">Required</Badge>}
                              </div>
                            </div>
                            <p className="font-medium text-gray-900">{field.field_label}</p>
                            {field.placeholder && (
                              <p className="text-sm text-gray-600 mt-1">{field.placeholder}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  )}
                </Card>
              )}

              {/* Bulk Discounts */}
              {event.bulk_discount_rules && event.bulk_discount_rules.length > 0 && (
                <Card>
                  <Card.Header>
                    <Card.Title>Bulk Discount Rules</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <div className="space-y-3">
                      {event.bulk_discount_rules.map((rule, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {rule.min_students}+ students
                            </p>
                            <p className="text-sm text-gray-600">
                              Minimum {rule.min_students} students required
                            </p>
                          </div>
                          <Badge variant="success">{rule.discount_percentage}% OFF</Badge>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Statistics */}
              <Card>
                <Card.Header>
                  <Card.Title>Statistics</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {statistics?.total_registrations || 0}
                      </p>
                      <p className="text-sm text-gray-600">Total Registrations</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {statistics?.total_batches || 0}
                      </p>
                      <p className="text-sm text-gray-600">Total Batches</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(statistics?.total_revenue || 0, 'INR')}
                      </p>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Quick Actions */}
              <Card>
                <Card.Header>
                  <Card.Title>Quick Actions</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    <Link to={`/admin/events/${eventId}/edit`}>
                      <Button variant="outline" fullWidth>
                        Edit Event
                      </Button>
                    </Link>
                    <Link to={`/admin/events/${eventId}/analytics`}>
                      <Button variant="outline" fullWidth>
                        View Analytics
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => window.open(`/events/${event?.event_slug}`, '_blank')}
                    >
                      View Public Page
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'registrations' && (
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Event Registrations</h3>
                <div className="text-sm text-gray-600">
                  Total: {batchesData?.pagination?.total || 0} batch
                  {batchesData?.pagination?.total !== 1 ? 'es' : ''}
                </div>
              </div>

              {/* Filters */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by school name..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={regFilters.search}
                    onChange={(e) => setRegFilters({ ...regFilters, search: e.target.value })}
                  />
                </div>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={regFilters.status}
                  onChange={(e) => setRegFilters({ ...regFilters, status: e.target.value })}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="verified">Verified</option>
                </select>
              </div>
            </Card.Header>

            <Card.Body>
              {loadingBatches ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : !batchesData?.batches || batchesData.batches.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No registrations found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    No schools have registered for this event yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Batch Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          School Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Students
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registered Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {batchesData.batches.map((batch) => (
                        <tr key={batch._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono font-medium text-purple-600">
                              {batch.batch_reference}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {batch.school_id?.name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {batch.school_id?.school_code || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {batch.total_students || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-green-600">
                              {formatCurrency(batch.total_amount, batch.currency)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                batch.payment_status === 'verified'
                                  ? 'success'
                                  : batch.payment_status === 'paid'
                                    ? 'info'
                                    : 'warning'
                              }
                            >
                              {batch.payment_status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {formatDate(batch.created_at)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/admin/batches/${batch.batch_reference}`}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'analytics' && <EventAnalytics />}

        {/* Delete Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Event"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">
                You are about to delete <strong>{event?.title}</strong>. This action cannot be
                undone.
              </p>
              <p className="text-sm text-red-800 mt-2">
                All registrations and data associated with this event will be preserved but the
                event will be permanently removed from the system.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={deleteEvent.isPending}
                disabled={deleteEvent.isPending}
                className="flex-1"
              >
                Delete Event
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default EventDetails;
