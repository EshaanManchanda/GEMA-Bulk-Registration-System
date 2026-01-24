import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Badge } from '@/components/ui';
import { formatCurrency } from '@/utils/helpers';

/**
 * School Breakdown Table
 * Sortable table showing registrations by school
 */
const SchoolBreakdown = ({ schools = [] }) => {
  const [sortBy, setSortBy] = useState('registrations'); // 'registrations' or 'revenue'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  if (!schools || schools.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No school data available</p>
      </div>
    );
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedSchools = [...schools].sort((a, b) => {
    let aValue, bValue;

    if (sortBy === 'registrations') {
      aValue = a.total_registrations || 0;
      bValue = b.total_registrations || 0;
    } else if (sortBy === 'revenue') {
      aValue = a.total_revenue || 0;
      bValue = b.total_revenue || 0;
    } else {
      aValue = a.school_name || '';
      bValue = b.school_name || '';
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const SortIcon = ({ field }) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-2">
                School Name
                <SortIcon field="name" />
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('registrations')}
            >
              <div className="flex items-center gap-2">
                Registrations
                <SortIcon field="registrations" />
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('revenue')}
            >
              <div className="flex items-center gap-2">
                Revenue
                <SortIcon field="revenue" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Country
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedSchools.map((school, index) => (
            <tr key={school.school_id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold text-sm">
                  {index + 1}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{school.school_name}</div>
                  <div className="text-sm text-gray-500">{school.school_code}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-purple-600">
                  {school.total_registrations || 0}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-green-600">
                  {formatCurrency(school.total_revenue || 0, school.currency || 'INR')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant="secondary">{school.country}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  to={`/admin/schools/${school.school_id}`}
                  className="text-purple-600 hover:text-purple-900"
                >
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">
            Total: {schools.length} school{schools.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-6">
            <span className="text-gray-600">
              Total Registrations:{' '}
              <span className="font-semibold text-purple-600">
                {schools.reduce((sum, s) => sum + (s.total_registrations || 0), 0)}
              </span>
            </span>
            <span className="text-gray-600">
              Total Revenue:{' '}
              <span className="font-semibold text-green-600">
                {formatCurrency(
                  schools.reduce((sum, s) => sum + (s.total_revenue || 0), 0),
                  'INR'
                )}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolBreakdown;
