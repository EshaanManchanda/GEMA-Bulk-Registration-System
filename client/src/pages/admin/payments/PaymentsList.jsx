import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdminPayments } from '../../../hooks/useAdmin';
import { Card, Badge, Input, Select, Table, Pagination, Spinner, EmptyState } from '../../../components/ui';
import { formatCurrency, formatDate } from '../../../utils/helpers';
import { PAYMENT_STATUS, PAYMENT_MODE, BADGE_CLASSES } from '../../../utils/constants';
import PaymentAnalytics from './PaymentAnalytics';

/**
 * Admin Payments List Page
 * View and manage all payments
 */
const PaymentsList = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    payment_mode: '',
    currency: '',
    page: 1,
    limit: 10,
  });

  const { data, isLoading } = useAdminPayments(filters);

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleStatusChange = (e) => {
    setFilters({ ...filters, status: e.target.value, page: 1 });
  };

  const handleModeChange = (e) => {
    setFilters({ ...filters, payment_mode: e.target.value, page: 1 });
  };

  const handleCurrencyChange = (e) => {
    setFilters({ ...filters, currency: e.target.value, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: PAYMENT_STATUS.PENDING, label: 'Pending' },
    { value: PAYMENT_STATUS.COMPLETED, label: 'Completed' },
    { value: PAYMENT_STATUS.FAILED, label: 'Failed' },
    { value: PAYMENT_STATUS.PENDING_VERIFICATION, label: 'Pending Verification' },
  ];

  const modeOptions = [
    { value: '', label: 'All Methods' },
    { value: PAYMENT_MODE.ONLINE, label: 'Online' },
    { value: PAYMENT_MODE.OFFLINE, label: 'Offline' },
  ];

  const currencyOptions = [
    { value: '', label: 'All Currencies' },
    { value: 'INR', label: 'INR' },
    { value: 'USD', label: 'USD' },
  ];

  const tableColumns = [
    {
      key: 'payment_reference',
      label: 'Payment Ref',
      sortable: true,
      render: (value, row) => (
        <Link
          to={`/admin/payments/${row._id}`}
          className="text-purple-600 hover:text-purple-700 font-medium font-mono text-sm whitespace-nowrap"
        >
          {value}
        </Link>
      ),
    },
    {
      key: 'school_id',
      label: 'School',
      render: (value) => (
        <Link
          to={`/admin/schools/${value?._id}`}
          className="text-gray-900 hover:text-purple-600 font-medium"
        >
          {value?.name || 'N/A'}
        </Link>
      ),
    },
    {
      key: 'batch_id',
      label: 'Batch',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value?.batch_reference || 'N/A'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value, row) => (
        <span className="font-medium text-gray-900 whitespace-nowrap">
          {formatCurrency(value, row.currency)}
        </span>
      ),
    },
    {
      key: 'payment_mode',
      label: 'Method',
      render: (value) => (
        <Badge variant={value === PAYMENT_MODE.ONLINE ? 'info' : 'secondary'}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'payment_gateway',
      label: 'Gateway',
      render: (value) => (
        <span className="text-sm text-gray-600 capitalize whitespace-nowrap">
          {value || '-'}
        </span>
      ),
    },
    {
      key: 'payment_status',
      label: 'Status',
      render: (value) => {
        const badgeClass = BADGE_CLASSES[value];
        return (
          <Badge variant={badgeClass?.variant || 'info'}>
            {value?.replace('_', ' ') || 'unknown'}
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
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Link to={`/admin/payments/${row._id}`}>
            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              View
            </button>
          </Link>
          {row.payment_status === 'pending_verification' && (
            <Link to={`/admin/payments/pending`}>
              <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                Verify
              </button>
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments Management</h1>
            <p className="text-gray-600 mt-1">View and manage all payment transactions</p>
          </div>
          <Link to="/admin/payments/pending">
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending Verifications
              {data?.summary?.pending_verification > 0 && (
                <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {data.summary.pending_verification}
                </span>
              )}
            </button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </span>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'transactions'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Transactions
              </span>
            </button>
          </nav>
        </div>

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && <PaymentAnalytics />}

        {/* Transactions Tab Content */}
        {activeTab === 'transactions' && (
          <>
            {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <Select
              value={filters.currency}
              onChange={handleCurrencyChange}
              options={currencyOptions}
              placeholder="Filter by Currency"
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
              icon={
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
              message="No payments found"
              description="No payments match your current filters. Try adjusting your search criteria."
            />
          )}
        </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default PaymentsList;
