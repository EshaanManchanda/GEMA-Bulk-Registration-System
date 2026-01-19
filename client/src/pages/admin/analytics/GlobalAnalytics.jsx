import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { useDashboardStats, useDashboardRevenue } from '../../../hooks/useAdmin';
import { Card, Spinner, Button, Badge } from '../../../components/ui';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDate } from '../../../utils/helpers';

/**
 * Global Analytics Dashboard
 * System-wide analytics with period selector
 */
const GlobalAnalytics = () => {
  const [period, setPeriod] = useState('30d'); // 7d, 30d, 90d, 1y
  const [currency, setCurrency] = useState('INR'); // INR, USD
  const { data: dashboardData, isLoading: statsLoading } = useDashboardStats();
  const { data: revenueData, isLoading: revenueLoading } = useDashboardRevenue(period, currency);

  const PERIOD_OPTIONS = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  const CURRENCY_OPTIONS = [
    { value: 'INR', label: 'INR (₹)' },
    { value: 'USD', label: 'USD ($)' },
  ];

  if (statsLoading || revenueLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="xl" />
        </div>
      </AdminLayout>
    );
  }

  const {
    total_schools = 0,
    active_schools = 0,
    total_events = 0,
    active_events = 0,
    total_registrations = 0,
    total_revenue_inr = 0,
    total_revenue_usd = 0,
    pending_verifications = 0,
    payment_success_rate = 0,
  } = dashboardData?.stats || {};

  const revenue = revenueData || {};
  const revenueTimeline = revenue.timeline || [];
  const topEvents = dashboardData?.topEvents || [];
  const topSchools = revenue.top_schools || [];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, dataKey }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">
            {formatDate(payload[0].payload.date)}
          </p>
          <p className="text-sm text-purple-600 font-semibold mt-1">
            {dataKey === 'total_revenue' // API returns total_revenue
              ? formatCurrency(payload[0].value, currency)
              : `${payload[0].value} registrations`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Global Analytics</h1>
            <p className="text-gray-600 mt-1">System-wide performance metrics and insights</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Currency Selector */}
            <div className="flex bg-white rounded-lg border border-gray-300 overflow-hidden">
              {CURRENCY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCurrency(option.value)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${currency === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-300 hidden md:block"></div>

            {/* Period Selector */}
            <div className="flex bg-white rounded-lg border border-gray-300 overflow-hidden">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${period === option.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Top-Level Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(total_revenue_inr, 'INR')}
                </p>
                <p className="text-xs text-gray-500">{formatCurrency(total_revenue_usd, 'USD')}</p>
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">{total_events}</p>
              <p className="text-sm text-gray-600 mt-1">Total Events</p>
              <Badge variant="success" size="sm" className="mt-2">
                {active_events} Active
              </Badge>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">{total_schools}</p>
              <p className="text-sm text-gray-600 mt-1">Total Schools</p>
              <Badge variant="success" size="sm" className="mt-2">
                {active_schools} Active
              </Badge>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">{total_registrations}</p>
              <p className="text-sm text-gray-600 mt-1">Total Registrations</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {payment_success_rate ? payment_success_rate.toFixed(1) : '0'}%
              </p>
              <p className="text-sm text-gray-600 mt-1">Payment Success</p>
              {pending_verifications > 0 && (
                <Badge variant="warning" size="sm" className="mt-2">
                  {pending_verifications} Pending
                </Badge>
              )}
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Over Time */}
          <Card>
            <Card.Header>
              <Card.Title>Revenue Over Time</Card.Title>
              <p className="text-sm text-gray-600 mt-1">Daily revenue for the selected period</p>
            </Card.Header>
            <Card.Body>
              {revenueTimeline.length > 0 ? (
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueTimeline} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                      />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip content={(props) => <CustomTooltip {...props} dataKey="total_revenue" />} />
                      <Line
                        type="monotone"
                        dataKey="total_revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No revenue data for this period</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Registrations Over Time */}
          <Card>
            <Card.Header>
              <Card.Title>Registrations Over Time</Card.Title>
              <p className="text-sm text-gray-600 mt-1">
                Daily registrations for the selected period
              </p>
            </Card.Header>
            <Card.Body>
              {revenueTimeline.length > 0 ? (
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueTimeline} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                      />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                      <Tooltip content={(props) => <CustomTooltip {...props} dataKey="registrations" />} />
                      <Line
                        type="monotone"
                        dataKey="registrations"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No registration data for this period</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Events */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>
                  <Card.Title>Top Performing Events</Card.Title>
                  <p className="text-sm text-gray-600 mt-1">By total registrations</p>
                </div>
                <Link to="/admin/events">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {topEvents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Registrations
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topEvents.map((event, index) => (
                        <tr key={event.event_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold text-sm">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <Link
                                to={`/admin/events/${event.event_id}`}
                                className="text-sm font-medium text-purple-600 hover:text-purple-900"
                              >
                                {event.event_name}
                              </Link>
                              <div className="text-sm text-gray-500">{event.event_slug}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-purple-600">
                              {event.total_registrations}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600">
                              {formatCurrency(event.total_revenue, event.currency || 'INR')}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50">
                  <p className="text-gray-500">No events data available</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Most Active Schools */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>
                  <Card.Title>Most Active Schools</Card.Title>
                  <p className="text-sm text-gray-600 mt-1">By total spending</p>
                </div>
                <Link to="/admin/schools">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {topSchools.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          School
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Registrations
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total Spent
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topSchools.map((school, index) => (
                        <tr key={school.school_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-semibold text-sm">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <Link
                                to={`/admin/schools/${school.school_id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-900"
                              >
                                {school.school_name}
                              </Link>
                              <div className="text-sm text-gray-500">{school.country}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-purple-600">
                              {school.total_registrations}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600">
                              {formatCurrency(school.total_spent, school.currency || 'INR')}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50">
                  <p className="text-gray-500">No schools data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default GlobalAnalytics;
