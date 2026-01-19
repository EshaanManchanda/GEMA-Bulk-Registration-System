import React from 'react';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card, Badge, Spinner } from '../../../components/ui';
import { usePaymentAnalytics } from '../../../hooks/useAdmin';
import { formatCurrency, formatDate } from '../../../utils/helpers';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
const GATEWAY_COLORS = {
  razorpay: '#3b82f6',
  stripe: '#6366f1',
  bank_transfer: '#10b981',
  unknown: '#9ca3af'
};

const ChangeIndicator = ({ value, label }) => {
  const isPositive = value >= 0;
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
        {isPositive ? '↑' : '↓'} {Math.abs(value)}%
      </span>
      <span className="text-gray-500">{label}</span>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, change, changeLabel, color = 'gray' }) => {
  const colorClasses = {
    gray: 'text-gray-900',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  };

  return (
    <Card className="p-4">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      {change !== undefined && <ChangeIndicator value={change} label={changeLabel} />}
    </Card>
  );
};

const PaymentAnalytics = () => {
  const { data, isLoading, error } = usePaymentAnalytics();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center text-red-600">
        Failed to load analytics data
      </Card>
    );
  }

  if (!data) return null;

  const { overview, revenue, comparisons, gateway_distribution, mode_distribution,
    daily_trend, top_schools, recent_failures } = data;

  // Format daily trend for chart
  const trendData = daily_trend.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatCard
          title="Total Payments"
          value={overview.total_payments}
          color="gray"
        />
        <StatCard
          title="Completed"
          value={overview.completed}
          color="green"
        />
        <StatCard
          title="Pending"
          value={overview.pending}
          color="yellow"
        />
        <StatCard
          title="Need Verification"
          value={overview.pending_verification}
          color="orange"
        />
        <StatCard
          title="Failed"
          value={overview.failed}
          color="red"
        />
        <StatCard
          title="Success Rate"
          value={`${overview.success_rate}%`}
          color="purple"
        />
        <StatCard
          title="Avg. Transaction"
          value={formatCurrency(overview.avg_transaction_value, 'INR')}
          color="gray"
        />
      </div>

      {/* Revenue Cards with Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center justify-between">
              <span>Revenue (INR)</span>
              <ChangeIndicator
                value={comparisons.month_over_month.revenue_change}
                label="vs last month"
              />
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(revenue.total_inr, 'INR')}
            </p>
            <div className="mt-2 flex gap-4 text-sm">
              <span className="text-gray-600">
                This month: <span className="font-medium text-gray-900">
                  {formatCurrency(revenue.this_month_inr, 'INR')}
                </span>
              </span>
              <span className="text-gray-500">
                Last month: {formatCurrency(revenue.last_month_inr, 'INR')}
              </span>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title className="flex items-center justify-between">
              <span>Revenue (USD)</span>
              <ChangeIndicator
                value={comparisons.week_over_week.revenue_change}
                label="vs last week"
              />
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(revenue.total_usd, 'USD')}
            </p>
            <div className="mt-2 flex gap-4 text-sm">
              <span className="text-gray-600">
                This month: <span className="font-medium text-gray-900">
                  {formatCurrency(revenue.this_month_usd, 'USD')}
                </span>
              </span>
              <span className="text-gray-500">
                Last month: {formatCurrency(revenue.last_month_usd, 'USD')}
              </span>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <Card.Header>
          <Card.Title>Revenue Trend (Last 30 Days)</Card.Title>
        </Card.Header>
        <Card.Body>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value, 'INR'), 'Revenue']}
                  labelStyle={{ color: '#374151' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available for the selected period
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Payment Status Trend */}
      <Card>
        <Card.Header>
          <Card.Title>Payment Status Trend</Card.Title>
        </Card.Header>
        <Card.Body>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" strokeWidth={2} />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" strokeWidth={2} />
                <Line type="monotone" dataKey="total" stroke="#6b7280" name="Total" strokeWidth={1} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Distribution Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gateway Distribution */}
        <Card>
          <Card.Header>
            <Card.Title>Payment Gateway Distribution</Card.Title>
          </Card.Header>
          <Card.Body>
            {gateway_distribution.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={gateway_distribution}
                      dataKey="amount"
                      nameKey="gateway"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ gateway, percent }) =>
                        `${gateway} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {gateway_distribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={GATEWAY_COLORS[entry.gateway] || COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value, 'INR')} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {gateway_distribution.map((g, i) => (
                    <div key={g.gateway} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: GATEWAY_COLORS[g.gateway] || COLORS[i] }}
                        />
                        <span className="capitalize">{g.gateway || 'Unknown'}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(g.amount, 'INR')}</p>
                        <p className="text-gray-500">{g.count} txns</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                No completed payments
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Online vs Offline */}
        <Card>
          <Card.Header>
            <Card.Title>Payment Mode Distribution</Card.Title>
          </Card.Header>
          <Card.Body>
            {mode_distribution.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={mode_distribution}
                      dataKey="amount"
                      nameKey="mode"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                    >
                      {mode_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value, 'INR')} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {mode_distribution.map((m, i) => (
                    <div key={m.mode} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[i] }}
                        />
                        <span>{m.mode}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(m.amount, 'INR')}</p>
                        <p className="text-sm text-gray-500">{m.count} payments</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                No completed payments
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Bottom Row: Top Schools & Recent Failures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Schools */}
        <Card>
          <Card.Header>
            <Card.Title>Top Schools by Revenue</Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            {top_schools.length > 0 ? (
              <div className="divide-y">
                {top_schools.map((school, i) => (
                  <div key={school._id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{school.school_name}</p>
                        <p className="text-sm text-gray-500">{school.school_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(school.total_amount, 'INR')}
                      </p>
                      <p className="text-sm text-gray-500">{school.payment_count} payments</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No payment data available
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Recent Failures */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              Recent Failed Payments
              {recent_failures.length > 0 && (
                <Badge variant="error">{recent_failures.length}</Badge>
              )}
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            {recent_failures.length > 0 ? (
              <div className="divide-y">
                {recent_failures.map((f) => (
                  <div key={f.reference} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-gray-600">{f.reference}</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(f.amount, f.currency)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-gray-500">{f.school || 'Unknown School'}</span>
                      <span className="text-gray-400">
                        {formatDate(f.date)}
                      </span>
                    </div>
                    {f.error && (
                      <p className="mt-1 text-xs text-red-500 truncate">{f.error}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No failed payments in last 7 days
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default PaymentAnalytics;
