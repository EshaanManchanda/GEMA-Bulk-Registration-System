import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { useEvents } from '../../../hooks/useEvents';
import { Card, Badge, Input, Select, Spinner, EmptyState } from '../../../components/ui';
import { getTextFromHtml } from '../../../components/ui/RichTextEditor';
import { formatCurrency, formatDate } from '../../../utils/helpers';
import { EVENT_STATUS } from '../../../utils/constants';
import useAuthStore from '../../../stores/authStore';

/**
 * Events List Page
 * Browse and search available events for registration
 */
const EventsList = () => {
  const { user } = useAuthStore();
  const schoolCurrency = user?.currency_pref || user?.currency || 'USD';

  const [filters, setFilters] = useState({
    status: 'active',
    search: '',
    type: '',
  });

  const { data, isLoading } = useEvents(filters);


  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleTypeChange = (e) => {
    setFilters({ ...filters, type: e.target.value });
  };

  const handleStatusChange = (e) => {
    setFilters({ ...filters, status: e.target.value });
  };

  const eventTypes = [
    { value: '', label: 'All Types' },
    { value: 'conference', label: 'Conference' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'competition', label: 'Competition' },
    { value: 'sports', label: 'Sports' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'other', label: 'Other' },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: EVENT_STATUS.ACTIVE, label: 'Active' },
    { value: EVENT_STATUS.UPCOMING, label: 'Upcoming' },
    { value: EVENT_STATUS.COMPLETED, label: 'Completed' },
  ];

  return (
    <SchoolLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Events</h1>
          <p className="text-gray-600 mt-1">Find events and register your students</p>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search events..."
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
              value={filters.type}
              onChange={handleTypeChange}
              options={eventTypes}
              placeholder="Event Type"
            />

            <Select
              value={filters.status}
              onChange={handleStatusChange}
              options={statusOptions}
              placeholder="Status"
            />
          </div>
        </Card>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : data?.events?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.events.map((event) => (
              <Link
                key={event._id}
                to={`/school/events/${event.slug}`}
                className="group"
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300">
                  {/* Event Banner */}
                  {event.banner_image_url ? (
                    <div className="h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={event.banner_image_url}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-t-lg flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-white opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
                        {event.name}
                      </h3>
                      <Badge variant={event.status === 'active' ? 'success' : 'info'} size="sm">
                        {event.status}
                      </Badge>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {getTextFromHtml(event.description)}
                    </p>

                    <div className="space-y-2 text-sm">
                      {/* Date */}
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{formatDate(event.event_date)}</span>
                      </div>

                      {/* Location */}
                      {event.venue && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="truncate">{event.venue}</span>
                        </div>
                      )}

                      {/* Fee */}
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          {formatCurrency(
                            schoolCurrency === 'INR' ? event.base_fee_inr : event.base_fee_usd,
                            schoolCurrency
                          )}
                        </span>
                      </div>

                      {/* Capacity */}
                      {event.capacity && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span>Capacity: {event.capacity} students</span>
                        </div>
                      )}
                    </div>

                    {/* Registration Status */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {event.registration_start && event.registration_end && (
                        <p className="text-xs text-gray-500">
                          Registration: {formatDate(event.registration_start)} - {formatDate(event.registration_end)}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            message="No events found"
            description="Try adjusting your search filters or check back later for new events"
          />
        )}
      </div>
    </SchoolLayout>
  );
};

export default EventsList;
