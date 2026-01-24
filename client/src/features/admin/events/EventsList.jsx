import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdminEvents, useToggleEventStatus, useDeleteEvent } from '../../../hooks/useAdmin';
import { Card, Badge, Input, Select, Spinner, EmptyState, Button, Modal } from '../../../components/ui';
import { sanitizeHtml, getTextFromHtml } from '../../../components/ui/RichTextEditor';
import { formatDate, formatCurrency } from '../../../utils/helpers';
import { EVENT_STATUS, BADGE_CLASSES } from '../../../utils/constants';
import { showError, showSuccess } from '../../../components/common/Toast';

/**
 * Admin Events List Page
 * View and manage all events
 */
const EventsList = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 12,
  });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data, isLoading } = useAdminEvents(filters);
  const toggleStatus = useToggleEventStatus();
  const deleteEvent = useDeleteEvent();

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleStatusChange = (e) => {
    setFilters({ ...filters, status: e.target.value, page: 1 });
  };

  const handleToggleStatus = async (event) => {
    try {
      await toggleStatus.mutateAsync(event._id);
      showSuccess(`Event ${event.status === EVENT_STATUS.ACTIVE ? 'closed' : 'activated'} successfully!`);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to toggle event status');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent.mutateAsync(selectedEvent._id);
      showSuccess('Event deleted successfully!');
      setShowDeleteModal(false);
      setSelectedEvent(null);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: EVENT_STATUS.DRAFT, label: 'Draft' },
    { value: EVENT_STATUS.ACTIVE, label: 'Active' },
    { value: EVENT_STATUS.CLOSED, label: 'Closed' },
    { value: EVENT_STATUS.ARCHIVED, label: 'Archived' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
            <p className="text-gray-600 mt-1">Create and manage events for bulk registrations</p>
          </div>
          <Link
            to="/admin/events/create"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Event</span>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {data?.summary?.total || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Events</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {data?.summary?.active || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Active</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {data?.summary?.draft || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Draft</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-600">
                {data?.summary?.closed || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Closed</p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search by event name or slug..."
              value={filters.search}
              onChange={handleSearchChange}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />

            <Select
              value={filters.status}
              onChange={handleStatusChange}
              options={statusOptions}
              placeholder="Filter by Status"
            />
          </div>
        </Card>

        {/* Events Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : data?.events?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.events.map((event) => (
              <Card key={event._id} className="hover:shadow-lg transition-shadow">
                {/* Event Banner */}
                <div className="relative -mx-6 -mt-6 mb-4">
                  {event.banner_image_url ? (
                    <img
                      src={event.banner_image_url}
                      alt={event.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-48 bg-gradient-to-br from-purple-400 to-blue-500 rounded-t-lg flex items-center justify-center"
                    style={{ display: event.banner_image_url ? 'none' : 'flex' }}
                  >
                    <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant={BADGE_CLASSES[event.status]?.variant || 'info'}>
                      {event.status}
                    </Badge>
                  </div>
                </div>

                {/* Event Info */}
                <div className="space-y-3">
                  <div>
                    <Link to={`/admin/events/${event._id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-purple-600 line-clamp-2">
                        {event.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {getTextFromHtml(event.description) || 'No description'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Event Date</p>
                      <p className="font-medium text-gray-900">{formatDate(event.event_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Capacity</p>
                      <p className="font-medium text-gray-900">{event.capacity || 'Unlimited'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Fee (INR)</p>
                      <p className="font-medium text-gray-900">{formatCurrency(event.base_fee_inr, 'INR')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Fee (USD)</p>
                      <p className="font-medium text-gray-900">{formatCurrency(event.base_fee_usd, 'USD')}</p>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Registrations</p>
                        <p className="font-medium text-gray-900">{event.stats?.total_registrations || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Revenue</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(event.stats?.total_revenue || 0, 'INR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link to={`/admin/events/${event._id}`} className="flex-1">
                      <Button variant="outline" fullWidth size="sm">
                        View Details
                      </Button>
                    </Link>
                    <div className="relative group">
                      <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        <Link
                          to={`/admin/events/${event._id}/edit`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Event
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(event)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          {event.status === EVENT_STATUS.ACTIVE ? 'Close Event' : 'Activate Event'}
                        </button>
                        <Link
                          to={`/admin/events/${event._id}/analytics`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          View Analytics
                        </Link>
                        <div className="border-t border-gray-200 my-2" />
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowDeleteModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Event
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              message="No events found"
              description="No events match your current filters. Try adjusting your search or create a new event."
              actionLabel="Create Event"
              onAction={() => window.location.href = '/admin/events/create'}
            />
          </Card>
        )}

        {/* Delete Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedEvent(null);
          }}
          title="Delete Event"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">
                You are about to delete <strong>{selectedEvent?.name}</strong>. This action cannot be undone.
              </p>
              <p className="text-sm text-red-800 mt-2">
                All registrations and data associated with this event will be preserved but the event will be permanently removed from the system.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedEvent(null);
                }}
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

export default EventsList;
