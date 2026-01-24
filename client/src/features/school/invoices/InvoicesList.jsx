import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { useMyInvoices, useDownloadInvoice } from '../../../hooks/useInvoices';
import { Card, Badge, Input, Table, Pagination, Spinner, EmptyState, Button } from '../../../components/ui';
import { formatCurrency, formatDate, capitalizeFirst } from '../../../utils/helpers';
import { BADGE_CLASSES, STATUS_VARIANTS } from '../../../utils/constants';
import { showError, showSuccess } from '../../../components/common/Toast';

/**
 * Invoices List Page
 * Shows all invoices for the school
 */
const InvoicesList = () => {
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10,
  });

  const { data, isLoading } = useMyInvoices(filters);
  const downloadInvoice = useDownloadInvoice();


  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const handleDownload = async (batchReference, invoiceNumber) => {
    try {
      await downloadInvoice.mutateAsync(batchReference);
      showSuccess(`Invoice ${invoiceNumber} downloaded successfully!`);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to download invoice');
    }
  };

  /*
   * View invoice in new tab
   */
  const handleView = (url) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      showError('Invoice document not found');
    }
  };

  const tableColumns = [
    {
      key: 'invoice_number',
      label: 'Invoice Number',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">{value || '-'}</span>
      ),
    },
    {
      key: 'batch_reference',
      label: 'Batch Reference',
      render: (value) => {
        if (value) {
          return (
            <Link
              to={`/school/batches/${value}`}
              className="text-primary-600 hover:text-primary-700"
            >
              {value}
            </Link>
          );
        }
        return 'N/A';
      },
    },
    {
      key: 'event_title',
      label: 'Event',
      render: (value) => value || 'N/A',
    },
    {
      key: 'total_amount',
      label: 'Amount',
      sortable: true,
      render: (value, row) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(value, row.currency)}
        </span>
      ),
    },
    {
      key: 'payment_status',
      label: 'Status',
      render: (value) => {
        return (
          <Badge variant={STATUS_VARIANTS[value] || 'info'}>
            {capitalizeFirst(value || 'Issued')}
          </Badge>
        );
      },
    },
    {
      key: 'issue_date',
      label: 'Issue Date',
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleView(row.invoice_url)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            title="View Invoice"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => handleDownload(row.batch_reference, row.invoice_number)}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
            disabled={downloadInvoice.isPending}
            title="Download Invoice"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <SchoolLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">View and download all your invoices</p>
        </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Search */}
          <div className="md:col-span-3">
            <Card>
              <Input
                placeholder="Search by invoice number or batch reference..."
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
            </Card>
          </div>

          {/* Quick Stats */}
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {data?.pagination?.totalCount || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Invoices</p>
            </div>
          </Card>
        </div>

        {/* Info Banner */}
        <Card>
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">About Invoices</h3>
              <p className="text-sm text-gray-600 mt-1">
                Invoices are automatically generated when your payment is verified. You can download them as PDF files for your records.
                All invoices are also sent to your registered email address.
              </p>
            </div>
          </div>
        </Card>

        {/* Invoices Table */}
        <Card>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : data?.invoices?.length > 0 ? (
            <>
              <Table
                columns={tableColumns}
                data={data.invoices}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              message="No invoices found"
              description="You don't have any invoices yet. Invoices are automatically generated when your payments are verified."
              actionLabel="View Payments"
              onAction={() => window.location.href = '/school/payments'}
            />
          )}
        </Card>

        {/* Help Section */}
        <Card>
          <Card.Header>
            <Card.Title>Need Help?</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">Can't find an invoice?</p>
                  <p className="text-sm text-gray-600">Make sure your payment has been verified. Pending payments don't have invoices yet.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">Need to request a duplicate?</p>
                  <p className="text-sm text-gray-600">You can download the same invoice multiple times. All downloads are unlimited and free.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">Have a question about an invoice?</p>
                  <p className="text-sm text-gray-600">Contact our support team with your invoice number for assistance.</p>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </SchoolLayout>
  );
};

export default InvoicesList;
