import React from 'react';
import { Link } from 'react-router-dom';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { useSchoolStatistics, useMyBatches } from '../../../hooks/useBatches';
import { Card, Badge, Spinner, EmptyState } from '../../../components/ui';
import { formatCurrency, formatDate } from '../../../utils/helpers';
import { BADGE_CLASSES } from '../../../utils/constants';

/**
 * School Dashboard Page
 * Overview of school's registrations, payments, and batches
 */
const SchoolDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useSchoolStatistics();
  const { data: recentBatches, isLoading: batchesLoading } = useMyBatches({ limit: 5 });

  const statsCards = [
    {
      title: 'Total Registrations',
      value: stats?.total_registrations || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      title: 'Pending Payments',
      value: stats?.pending_payments || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Confirmed Batches',
      value: stats?.confirmed_batches || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      title: 'Total Spent',
      value: stats?.total_spent ? formatCurrency(stats.total_spent, stats.currency) : formatCurrency(0),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <SchoolLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
          </div>
          <Link to="/school/events">
            <button className="btn-primary">
              Browse Events
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                    {stat.icon}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <Card.Header>
            <Card.Title>Quick Actions</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                to="/school/events"
                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-600"
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
                <div>
                  <p className="font-medium text-gray-900">Browse Events</p>
                  <p className="text-sm text-gray-500">Find events to register</p>
                </div>
              </Link>

              <Link
                to="/school/batches"
                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">My Batches</p>
                  <p className="text-sm text-gray-500">View all registrations</p>
                </div>
              </Link>

              <Link
                to="/school/payments"
                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Payments</p>
                  <p className="text-sm text-gray-500">Manage payments</p>
                </div>
              </Link>
            </div>
          </Card.Body>
        </Card>

        {/* Recent Batches */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Recent Batches</Card.Title>
              <Link to="/school/batches" className="text-sm text-primary-600 hover:text-primary-700">
                View All
              </Link>
            </div>
          </Card.Header>
          <Card.Body>
            {batchesLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : recentBatches?.batches?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Batch Reference</th>
                      <th>Event</th>
                      <th>Students</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBatches.batches.map((batch) => (
                      <tr key={batch.batch_reference}>
                        <td>
                          <Link
                            to={`/school/batches/${batch.batch_reference}`}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {batch.batch_reference}
                          </Link>
                        </td>
                        <td>{batch.event?.name || 'N/A'}</td>
                        <td>{batch.num_students}</td>
                        <td>{formatCurrency(batch.total_amount, batch.currency)}</td>
                        <td>
                          <Badge variant={BADGE_CLASSES[batch.status]?.variant || 'info'}>
                            {batch.status}
                          </Badge>
                        </td>
                        <td>{formatDate(batch.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                message="No batches yet"
                description="Start by browsing events and uploading your first batch"
                actionLabel="Browse Events"
                onAction={() => window.location.href = '/school/events'}
              />
            )}
          </Card.Body>
        </Card>
      </div>
    </SchoolLayout>
  );
};

export default SchoolDashboard;
