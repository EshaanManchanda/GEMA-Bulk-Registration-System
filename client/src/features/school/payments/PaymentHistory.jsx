import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { useMyPayments } from '../../../hooks/usePayments';
import { Card, Badge, Input, Select, Table, Pagination, Spinner, EmptyState } from '../../../components/ui';
import { formatCurrency, formatDate, toTitleCase, capitalizeFirst } from '../../../utils/helpers';
import { PAYMENT_STATUS, PAYMENT_MODE, BADGE_CLASSES, STATUS_VARIANTS } from '../../../utils/constants';

/**
 * Payment History Page
 * Shows all payments made by the school
 */
const PaymentHistory = () => {
  const [filters, setFilters] = useState({
    status: '',
    payment_mode: '',
    search: '',
    page: 1,
    limit: 10,
  });

  const { data, isLoading } = useMyPayments(filters);

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleStatusChange = (e) => {
    setFilters({ ...filters, status: e.target.value, page: 1 });
  };

  const handleModeChange = (e) => {
    setFilters({ ...filters, payment_mode: e.target.value, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: PAYMENT_STATUS.PENDING, label: 'Pending' },
    { value: PAYMENT_STATUS.VERIFIED, label: 'Verified' },
    { value: PAYMENT_STATUS.FAILED, label: 'Failed' },
    { value: PAYMENT_STATUS.REJECTED, label: 'Rejected' },
  ];

  const modeOptions = [
    { value: '', label: 'All Methods' },
    { value: PAYMENT_MODE.ONLINE, label: 'Online' },
    { value: PAYMENT_MODE.OFFLINE, label: 'Offline' },
  ];

  const tableColumns = [
    {
      key: 'payment_reference',
      label: 'Payment Reference',
      sortable: true,
      render: (value, row) => (
        <Link
          to={`/school/payments/${row._id}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          {value}
        </Link>
      ),
    },
    {
      key: 'batch_id',
      label: 'Batch',
      render: (value) => value?.batch_reference || 'N/A',
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value, row) => formatCurrency(value, row.currency),
    },
    {
      key: 'payment_mode',
      label: 'Method',
      render: (value) => (
        <span>{toTitleCase(value)}</span>
      ),
    },
    {
      key: 'payment_gateway',
      label: 'Gateway',
      render: (value) => value ? <span className="capitalize">{value}</span> : '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        return (
          <Badge variant={STATUS_VARIANTS[value] || 'info'}>
            {capitalizeFirst(value)}
          </Badge>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (value) => formatDate(value),
    },
  ];

  return (
    <SchoolLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600 mt-1">View all your payment transactions</p>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by payment or batch reference..."
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

            <Select
              value={filters.payment_mode}
              onChange={handleModeChange}
              options={modeOptions}
              placeholder="Filter by Method"
            />
          </div>
        </Card>

        {/* Payments Table */}
        <Card>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : data?.payments?.length > 0 ? (
            <>
              <Table
                columns={tableColumns}
                data={data.payments}
                onRowClick={(row) => window.location.href = `/school/payments/${row._id}`}
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
              message="No payments found"
              description="You haven't made any payments yet. Complete a batch registration to make your first payment."
              actionLabel="Browse Events"
              onAction={() => window.location.href = '/school/events'}
            />
          )}
        </Card>
      </div>
    </SchoolLayout>
  );
};

export default PaymentHistory;
