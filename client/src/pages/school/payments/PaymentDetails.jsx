import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { usePaymentDetails, useDownloadReceipt } from '../../../hooks/usePayments';
import { Card, Badge, Button, Spinner } from '../../../components/ui';
import { formatCurrency, formatDate, toTitleCase, capitalizeFirst } from '../../../utils/helpers';
import { PAYMENT_STATUS, PAYMENT_MODE, BADGE_CLASSES, STATUS_VARIANTS } from '../../../utils/constants';
import { showError, showSuccess } from '../../../components/common/Toast';

/**
 * Payment Details Page
 * Shows detailed information about a specific payment
 */
const PaymentDetails = () => {
  const { paymentId } = useParams();
  const { data: payment, isLoading } = usePaymentDetails(paymentId);
  const downloadReceipt = useDownloadReceipt();

  const handleDownloadReceipt = async () => {
    try {
      await downloadReceipt.mutateAsync(paymentId);
      showSuccess('Receipt downloaded successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to download receipt');
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

  if (!payment) {
    return (
      <SchoolLayout>
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h2>
            <p className="text-gray-600 mb-6">The payment you're looking for doesn't exist.</p>
            <Link to="/school/payments">
              <Button variant="primary">Back to Payments</Button>
            </Link>
          </div>
        </Card>
      </SchoolLayout>
    );
  }

  return (
    <SchoolLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/school/payments" className="text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{payment.payment_reference}</h1>
            <p className="text-gray-600 mt-1">Payment Details</p>
          </div>
          <Badge variant={STATUS_VARIANTS[payment.status] || 'info'} size="lg">
            {capitalizeFirst(payment.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Information */}
            <Card>
              <Card.Header>
                <Card.Title>Payment Information</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Payment Reference</p>
                    <p className="text-lg font-medium text-gray-900">{payment.payment_reference}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Amount</p>
                    <p className="text-lg font-medium text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Payment Mode</p>
                    <p className="text-lg font-medium text-gray-900">{toTitleCase(payment.payment_mode)}</p>
                  </div>

                  {payment.payment_gateway && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Payment Gateway</p>
                      <p className="text-lg font-medium text-gray-900">{toTitleCase(payment.payment_gateway)}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Payment Date</p>
                    <p className="text-lg font-medium text-gray-900">{formatDate(payment.created_at)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <Badge variant={STATUS_VARIANTS[payment.status] || 'info'}>
                      {capitalizeFirst(payment.status)}
                    </Badge>
                  </div>

                  {(payment.gateway_payment_id || payment.offline_payment_details?.transaction_reference) && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Transaction ID / Reference</p>
                      <p className="text-sm font-mono bg-gray-50 p-2 rounded text-gray-900">
                        {payment.gateway_payment_id || payment.offline_payment_details?.transaction_reference}
                      </p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Batch Information */}
            {payment.batch_id && (
              <Card>
                <Card.Header>
                  <Card.Title>Related Batch</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Batch Reference</p>
                      <Link
                        to={`/school/batches/${payment.batch_id.batch_reference}`}
                        className="text-lg font-medium text-primary-600 hover:text-primary-700"
                      >
                        {payment.batch_id.batch_reference}
                      </Link>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Event</p>
                      <p className="text-lg font-medium text-gray-900">{payment.event_id?.title || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Number of Students</p>
                      <p className="text-lg font-medium text-gray-900">{payment.batch_id.student_count}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Batch Status</p>
                      <Badge variant={STATUS_VARIANTS[payment.batch_id.status] || 'info'}>
                        {capitalizeFirst(payment.batch_id.status)}
                      </Badge>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Payment Timeline */}
            <Card>
              <Card.Header>
                <Card.Title>Payment Timeline</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary-600 rounded-full" />
                      <div className="w-0.5 h-full bg-gray-300" />
                    </div>
                    <div className="pb-6">
                      <p className="font-medium text-gray-900">Payment Initiated</p>
                      <p className="text-sm text-gray-600">{formatDate(payment.created_at)}</p>
                    </div>
                  </div>

                  {payment.offline_payment_details?.verified_at && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-green-600 rounded-full" />
                        <div className="w-0.5 h-full bg-gray-300" />
                      </div>
                      <div className="pb-6">
                        <p className="font-medium text-gray-900">Payment Verified</p>
                        <p className="text-sm text-gray-600">{formatDate(payment.offline_payment_details.verified_at)}</p>
                        {payment.offline_payment_details.verified_by && (
                          <p className="text-sm text-gray-500">By Admin</p>
                        )}
                      </div>
                    </div>
                  )}

                  {payment.status === PAYMENT_STATUS.FAILED && payment.offline_payment_details?.verified_at && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-red-600 rounded-full" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Payment Rejected</p>
                        <p className="text-sm text-gray-600">{formatDate(payment.offline_payment_details.verified_at)}</p>
                        {payment.offline_payment_details.verification_notes && (
                          <p className="text-sm text-red-600 mt-1">Reason: {payment.offline_payment_details.verification_notes}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Notes */}
            {payment.notes && (
              <Card>
                <Card.Header>
                  <Card.Title>Notes</Card.Title>
                </Card.Header>
                <Card.Body>
                  <p className="text-gray-700 whitespace-pre-line">{payment.notes}</p>
                </Card.Body>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <Card.Header>
                <Card.Title>Actions</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  {payment.offline_payment_details?.receipt_url && (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleDownloadReceipt}
                      loading={downloadReceipt.isPending}
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      }
                    >
                      Download Receipt
                    </Button>
                  )}

                  {payment.batch_id && (
                    <Link to={`/school/batches/${payment.batch_id.batch_reference}`}>
                      <Button
                        variant="outline"
                        fullWidth
                        leftIcon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        }
                      >
                        View Batch
                      </Button>
                    </Link>
                  )}

                  {payment.batch_id?.invoice_pdf_url && (
                    <Link to={`/school/invoices`}>
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
                </div>
              </Card.Body>
            </Card>

            {/* Payment Status Info */}
            <Card>
              <Card.Header>
                <Card.Title>Status Information</Card.Title>
              </Card.Header>
              <Card.Body>
                {payment.status === PAYMENT_STATUS.PENDING && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-900 font-medium mb-1">Pending Verification</p>
                    <p className="text-sm text-yellow-800">
                      Your offline payment is being verified by our admin team. You'll receive a confirmation email once verified.
                    </p>
                  </div>
                )}

                {payment.status === PAYMENT_STATUS.VERIFIED && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-900 font-medium mb-1">Payment Verified</p>
                    <p className="text-sm text-green-800">
                      Your payment has been verified and processed successfully. Your batch is confirmed.
                    </p>
                  </div>
                )}

                {payment.status === PAYMENT_STATUS.REJECTED && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-900 font-medium mb-1">Payment Rejected</p>
                    <p className="text-sm text-red-800">
                      {payment.rejection_reason || 'Your payment was rejected. Please contact support for more information.'}
                    </p>
                  </div>
                )}

                {payment.status === PAYMENT_STATUS.FAILED && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-900 font-medium mb-1">Payment Failed</p>
                    <p className="text-sm text-red-800">
                      The payment transaction failed. Please try again or contact support.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </SchoolLayout>
  );
};

export default PaymentDetails;
