import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../../utils/helpers';

/**
 * Revenue Chart
 * Pie chart showing revenue distribution (INR vs USD)
 */
const RevenueChart = ({ totalRevenueInr = 0, totalRevenueUsd = 0 }) => {
  const COLORS = {
    INR: '#10b981', // green
    USD: '#3b82f6', // blue
  };

  const data = [
    { name: 'INR', value: totalRevenueInr, currency: 'INR' },
    { name: 'USD', value: totalRevenueUsd, currency: 'USD' },
  ];

  // Filter out zero values
  const filteredData = data.filter((item) => item.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No revenue data available</p>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-sm font-semibold mt-1" style={{ color: COLORS[data.name] }}>
            {formatCurrency(data.value, data.currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-semibold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => {
              const item = filteredData.find((d) => d.name === value);
              return `${value}: ${formatCurrency(item?.value || 0, item?.currency || 'INR')}`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
