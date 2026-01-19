import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { useMyBatches } from '../../../hooks/useBatches';
import { Card, Badge, Input, Select, Table, Pagination, Spinner, EmptyState } from '../../../components/ui';
import { formatCurrency, formatDate } from '../../../utils/helpers';
import { BATCH_STATUS, BADGE_CLASSES } from '../../../utils/constants';

/**
 * My Batches List Page
 * Shows all registration batches created by the school
 */
const MyBatches = () => {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 10,
  });

  const { data, isLoading } = useMyBatches(filters);

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleStatusChange = (e) => {
    setFilters({ ...filters, status: e.target.value, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: BATCH_STATUS.PENDING, label: 'Pending Payment' },
    { value: BATCH_STATUS.CONFIRMED, label: 'Confirmed' },
    { value: BATCH_STATUS.CANCELLED, label: 'Cancelled' },
  ];

  const tableColumns = [
    {
      key: 'batch_reference',
      label: 'Batch Reference',
      sortable: true,
      render: (value, row) => (
        <Link
          to={`/school/batches/${value}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          {value}
        </Link>
      ),
    },
    {
      key: 'event',
      label: 'Event',
      render: (value) => value?.name || 'N/A',
    },
    {
      key: 'num_students',
      label: 'Students',
      sortable: true,
    },
    {
      key: 'total_amount',
      label: 'Amount',
      sortable: true,
      render: (value, row) => formatCurrency(value, row.currency),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const badgeClass = BADGE_CLASSES[value];
        return (
          <Badge variant={badgeClass?.variant || 'info'}>
            {value}
          </Badge>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => formatDate(value),
    },
  ];

  return (
    <SchoolLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Batches</h1>
            <p className="text-gray-600 mt-1">Manage your student registration batches</p>
          </div>
          <Link to="/school/events">
            <button className="btn-primary">
              Create New Batch
            </button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search by batch reference or event..."
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

        {/* Batches Table */}
        <Card>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : data?.batches?.length > 0 ? (
            <>
              <Table
                columns={tableColumns}
                data={data.batches}
                onRowClick={(row) => window.location.href = `/school/batches/${row.batch_reference}`}
              />

              {/* Pagination */}
              {data.pagination && data.pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination
                    currentPage={data.pagination.currentPage}
                    totalPages={data.pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <EmptyState
              message="No batches found"
              description="You haven't created any registration batches yet. Browse events to get started."
              actionLabel="Browse Events"
              onAction={() => window.location.href = '/school/events'}
            />
          )}
        </Card>
      </div>
    </SchoolLayout>
  );
};

export default MyBatches;
