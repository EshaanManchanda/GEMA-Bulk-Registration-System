import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { useBatchDetails, useDownloadBatchCSV, useDeleteBatch } from '../../../hooks/useBatches';
import { Card, Badge, Button, Spinner, Table, Modal } from '../../../components/ui';
import { formatCurrency, formatDate } from '../../../utils/helpers';
import { BATCH_STATUS, PAYMENT_STATUS, BADGE_CLASSES } from '../../../utils/constants';
import { showError, showSuccess } from '../../../components/common/Toast';
import PaymentSelectionModal from '../../../components/PaymentSelectionModal';

/**
 * Batch Details Page
 * Shows detailed information about a specific batch
 */
const BatchDetails = () => {
  const { batchReference } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useBatchDetails(batchReference);
  console.log("data:", data);
  const batch = data?.batch;
  const payment = data?.payment;
  const downloadCSV = useDownloadBatchCSV();
  const deleteBatchMutation = useDeleteBatch();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDownloadCSV = async () => {
    try {
      await downloadCSV.mutateAsync(batchReference);
      showSuccess('CSV file downloaded successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to download CSV file');
    }
  };

  const handleMakePayment = () => {
    navigate(`/school/payments/make-payment?batch=${batchReference}`);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteBatchMutation.mutateAsync(batchReference);
      showSuccess('Batch deleted successfully');
      navigate('/school/batches');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete batch');
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <SchoolLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="xl" />
        </div>
      </SchoolLayout>
    );
  }

  if (!batch) {
    return (
      <SchoolLayout>
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Batch Not Found</h2>
            <p className="text-gray-600 mb-6">The batch you're looking for doesn't exist.</p>
            <Link to="/school/batches">
              <Button variant="primary">Back to My Batches</Button>
            </Link>
          </div>
        </Card>
      </SchoolLayout>
    );
  }

  const studentColumns = [
    { key: 'index', label: '#', render: (value, row, index) => index + 1 },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
  ];

  return (
    <SchoolLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/school/batches" className="text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{batch.batch_reference}</h1>
            <p className="text-gray-600 mt-1">Batch Details</p>
          </div>
          <Badge variant={BADGE_CLASSES[batch.status]?.variant || 'info'} size="lg">
            {batch.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Batch Information */}
            <Card>
              <Card.Header>
                <Card.Title>Batch Information</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Event</p>
                    <Link
                      to={`/school/events/${batch.event?.slug}`}
                      className="text-lg font-medium text-primary-600 hover:text-primary-700"
                    >
                      {batch.event?.name || 'N/A'}
                    </Link>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Batch Reference</p>
                    <p className="text-lg font-medium text-gray-900">{batch.batch_reference}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Number of Students</p>
                    <p className="text-lg font-medium text-gray-900">{batch.num_students}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Currency</p>
                    <p className="text-lg font-medium text-gray-900">{batch.currency}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Created Date</p>
                    <p className="text-lg font-medium text-gray-900">{formatDate(batch.created_at)}</p>
                  </div>

                  {batch.excel_file_url && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">CSV File</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadCSV}
                        loading={downloadCSV.isPending}
                        leftIcon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        }
                      >
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Students List */}
            <Card>
              <Card.Header>
                <Card.Title>Registered Students ({batch.students?.length || 0})</Card.Title>
              </Card.Header>
              <Card.Body>
                {batch.students && batch.students.length > 0 ? (
                  <Table
                    columns={studentColumns}
                    data={batch.students}
                  />
                ) : (
                  <p className="text-gray-500 text-center py-8">No student data available</p>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <Card.Header>
                <Card.Title>Payment Summary</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>{formatCurrency(batch.subtotal_amount, batch.currency)}</span>
                  </div>

                  {batch.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(batch.discount_amount, batch.currency)}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg text-gray-900">
                    <span>Total Amount</span>
                    <span>{formatCurrency(batch.total_amount, batch.currency)}</span>
                  </div>

                  {/* Payment Status */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Payment Status</span>
                        {payment ? (
                          <Badge variant={
                            payment.status === 'completed' ? 'success' :
                              payment.status === 'processing' ? 'warning' :
                                payment.status === 'failed' ? 'danger' : 'info'
                          }>
                            {payment.status}
                          </Badge>
                        ) : (
                          <Badge variant="warning">Not Paid</Badge>
                        )}
                      </div>

                      {payment?.payment_mode && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payment Mode</span>
                          <span className="font-medium capitalize">{payment.payment_mode}</span>
                        </div>
                      )}

                      {payment?.payment_gateway && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Gateway</span>
                          <span className="font-medium capitalize">{payment.payment_gateway}</span>
                        </div>
                      )}

                      {payment && payment.status === 'completed' && (
                        <div className="mt-3">
                          <Link to={`/school/payments/${payment.payment_reference}`}>
                            <Button variant="outline" size="sm" fullWidth>
                              View Payment Details
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Actions */}
            <Card>
              <Card.Header>
                <Card.Title>Actions</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  {/* Show payment options if no payment exists or payment failed */}
                  {(!payment || payment.status === 'failed') && batch.status === 'draft' && (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => setShowPaymentModal(true)}
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      }
                    >
                      Make Payment
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    fullWidth
                    onClick={handleDownloadCSV}
                    loading={downloadCSV.isPending}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    }
                  >
                    Download CSV
                  </Button>

                  {batch.invoice && (
                    <Link to={`/school/invoices/${batch.invoice.invoice_number}`}>
                      <Button
                        variant="outline"
                        fullWidth
                        leftIcon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        }
                      >
                        View Invoice
                      </Button>
                    </Link>
                  )}

                  {batch.status === 'draft' && (
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => setShowDeleteModal(true)}
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      }
                    >
                      Delete Batch
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Event Info */}
            {batch.event && (
              <Card>
                <Card.Header>
                  <Card.Title>Event Details</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Event Date</p>
                      <p className="text-gray-900 font-medium">{formatDate(batch.event.event_date)}</p>
                    </div>

                    {batch.event.venue && (
                      <div>
                        <p className="text-gray-600 mb-1">Venue</p>
                        <p className="text-gray-900 font-medium">{batch.event.venue}</p>
                      </div>
                    )}

                    <Link to={`/school/events/${batch.event.slug}`}>
                      <Button variant="outline" size="sm" fullWidth>
                        View Event Details
                      </Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        </div>

        {/* Payment Selection Modal */}
        {showPaymentModal && (
          <PaymentSelectionModal
            batchReference={batch.batch_reference}
            amount={batch.total_amount}
            currency={batch.currency}
            onClose={() => setShowPaymentModal(false)}
            onSelect={(mode) => {
              setShowPaymentModal(false);
              navigate(`/school/payments/make-payment?batch=${batch.batch_reference}&mode=${mode}`);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Batch"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-red-800 mb-1">Critical Warning</h4>
              <p className="text-sm text-red-700">
                Are you sure you want to delete filter batch <strong>{batchReference}</strong>?
                This acton cannot be undone and all {batch.num_students} registration data will be permanently lost.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteBatchMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                isLoading={deleteBatchMutation.isPending}
              >
                Yes, Delete Batch
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </SchoolLayout>
  );
};

export default BatchDetails;
