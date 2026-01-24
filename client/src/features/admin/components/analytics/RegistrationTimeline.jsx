import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate } from '@/utils/helpers';

/**
 * Registration Timeline Chart
 * Line chart showing registrations over time
 */
const RegistrationTimeline = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No registration data available</p>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">
            {formatDate(payload[0].payload.date)}
          </p>
          <p className="text-sm text-purple-600 font-semibold mt-1">
            {payload[0].value} registration{payload[0].value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(date) => {
              const d = new Date(date);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RegistrationTimeline;
