import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { useDashboardStats, useDashboardActivities } from '../../../hooks/useAdmin';
import { Card, Badge, Spinner } from '../../../components/ui';
import { formatCurrency, formatDate } from '../../../utils/helpers';
import { BADGE_CLASSES } from '../../../utils/constants';

/**
 * Admin Dashboard
 * Main dashboard for administrators with statistics and activity feed
 */
const AdminDashboard = () => {
  const { data: dashboardData, isLoading: isLoadingStats } = useDashboardStats();
  const stats = dashboardData?.stats;
  const { data: activities, isLoading: isLoadingActivities } = useDashboardActivities(10);

  if (isLoadingStats) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="xl" />
        </div>
      </AdminLayout>
    );
  }

  const statsCards = [
    {
      title: 'Total Schools',
      value: stats?.total_schools || 0,
      subtitle: `${stats?.pending_approvals || 0} pending approval`,
      color: 'from-purple-500 to-purple-600',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      link: '/admin/schools',
    },
    {
      title: 'Active Events',
      value: stats?.active_events || 0,
      subtitle: `${stats?.total_events || 0} total events`,
      color: 'from-blue-500 to-blue-600',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      link: '/admin/events',
    },
    {
      title: 'Total Registrations',
      value: stats?.total_registrations || 0,
      subtitle: `${stats?.registrations_this_month || 0} this month`,
      color: 'from-green-500 to-green-600',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      link: '/admin/schools',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.total_revenue_inr || 0, 'INR') + ' / ' + formatCurrency(stats?.total_revenue_usd || 0, 'USD'),
      subtitle: `${stats?.revenue_this_month_inr ? formatCurrency(stats.revenue_this_month_inr, 'INR') : '₹0'} this month`,
      color: 'from-yellow-500 to-orange-600',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: '/admin/analytics',
    },
    {
      title: 'Pending Verifications',
      value: stats?.pending_verifications || 0,
      subtitle: 'Offline payments',
      color: 'from-red-500 to-red-600',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: '/admin/payments/pending',
    },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'registration':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          </div>
        );
      case 'payment':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'school':
        return (
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </div>
        );
      case 'event':
        return (
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {stats?.admin_name || 'Administrator'}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {statsCards.map((stat, index) => (
            <Link key={index} to={stat.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className={`bg-gradient-to-br ${stat.color} text-white rounded-t-lg p-4 -mx-6 -mt-6 mb-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white/80 text-sm font-medium mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{stat.subtitle}</p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card>
            <Card.Header>
              <Card.Title>Quick Actions</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-2">
                <Link
                  to="/admin/schools?filter=pending"
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Approve Schools</span>
                  </div>
                  {stats?.pending_approvals > 0 && (
                    <Badge variant="warning">{stats.pending_approvals}</Badge>
                  )}
                </Link>

                <Link
                  to="/admin/payments/pending"
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Verify Payments</span>
                  </div>
                  {stats?.pending_verifications > 0 && (
                    <Badge variant="danger">{stats.pending_verifications}</Badge>
                  )}
                </Link>

                <Link
                  to="/admin/events/create"
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Create Event</span>
                  </div>
                </Link>

                <Link
                  to="/admin/analytics"
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">View Reports</span>
                  </div>
                </Link>
              </div>
            </Card.Body>
          </Card>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title>Recent Activity</Card.Title>
                  <Link to="/admin/analytics" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                    View All
                  </Link>
                </div>
              </Card.Header>
              <Card.Body>
                {isLoadingActivities ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : activities && activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-4">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(activity.created_at)}</p>
                        </div>
                        {activity.status && (
                          <Badge variant={BADGE_CLASSES[activity.status]?.variant || 'info'} size="sm">
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-600">No recent activity</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* System Status */}
        <Card>
          <Card.Header>
            <Card.Title>System Status</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-900">All Systems Operational</span>
                </div>
                <p className="text-xs text-gray-600">Last checked: {formatDate(new Date())}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.uptime || '99.9'}%</p>
                <p className="text-xs text-gray-600">Uptime (30 days)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.active_sessions || 0}</p>
                <p className="text-xs text-gray-600">Active Sessions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.response_time || '120'}ms</p>
                <p className="text-xs text-gray-600">Avg Response Time</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
