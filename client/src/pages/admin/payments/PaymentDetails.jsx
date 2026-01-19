import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdminPaymentDetails, useVerifyPayment, useRejectPayment } from '../../../hooks/useAdmin';
import { Card, Badge, Spinner, Button, Modal } from '../../../components/ui';
import { formatDate, formatCurrency } from '../../../utils/helpers';
import { showError, showSuccess } from '../../../components/common/Toast';

/**
 * Payment Details Page
 * Admin page showing detailed information about a payment
 */
const PaymentDetails = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { data: payment, isLoading } = useAdminPaymentDetails(paymentId);

  // Helper variables to access data (handling different API structures if needed)
  const batch = payment?.batch_id || payment?.batch;
  const school = payment?.school_id || batch?.school;
  const event = payment?.event_id || batch?.event;

  // Normalize offline payment details
  const offlineDetails = payment?.offline_payment_details || batch?.offline_payment_details || {};
  const receiptUrl = payment?.receipt_url || offlineDetails?.receipt_url;
  const receiptDate = payment?.receipt_uploaded_at || offlineDetails?.upload_date || payment?.created_at;
  const transactionId = payment?.transaction_id || payment?.gateway_order_id || offlineDetails?.transaction_reference || payment?.payment_reference;

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  const verifyPayment = useVerifyPayment();
  const rejectPayment = useRejectPayment();

  const handleVerify = async () => {
    try {
      await verifyPayment.mutateAsync({ paymentId: payment._id, notes: actionNotes });
      showSuccess('Payment verified successfully!');
      setShowVerifyModal(false);
      setActionNotes('');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to verify payment');
    }
  };

  const handleReject = async () => {
    if (!actionNotes.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }
    try {
      await rejectPayment.mutateAsync({ paymentId: payment._id, reason: actionNotes });
      showSuccess('Payment rejected!');
      setShowRejectModal(false);
      setActionNotes('');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to reject payment');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="xl" />
        </div>
      </AdminLayout>
    );
  }

  if (!payment) {
    return (
      <AdminLayout>
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h2>
            <p className="text-gray-600 mb-6">The payment you're looking for doesn't exist.</p>
            <Button variant="primary" onClick={() => navigate('/admin/payments')}>
              Back to Payments
            </Button>
          </div>
        </Card>
      </AdminLayout>
    );
  }

  const isPending = payment.status === 'pending';
  const isOffline = payment.payment_mode?.toLowerCase() === 'offline';

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate('/admin/payments')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Payment Details</h1>
              <Badge
                variant={
                  payment.status === 'verified'
                    ? 'success'
                    : payment.status === 'paid'
                      ? 'info'
                      : payment.status === 'failed'
                        ? 'danger'
                        : 'warning'
                }
              >
                {payment.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">ID: {payment.payment_id || payment._id}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(payment.amount, payment.currency)}
            </p>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Payment Info */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Payment Mode</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{payment.payment_mode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Currency</p>
                  <p className="text-sm font-medium text-gray-900">{payment.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(payment.created_at)}</p>
                </div>
                {transactionId && (
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID / Reference</p>
                    <p className="text-sm font-mono font-medium text-gray-900 break-all">
                      {transactionId}
                    </p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* School Info */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">School Information</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">School Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {school?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">School Code</p>
                  <p className="text-sm font-medium text-gray-900">
                    {school?.school_code || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {school?.contact_person?.email || school?.email || 'N/A'}
                  </p>
                </div>
                {school?._id && (
                  <Link
                    to={`/admin/schools/${school._id}`}
                    className="inline-flex items-center text-sm text-purple-600 hover:text-purple-900"
                  >
                    View School Details →
                  </Link>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Batch/Event Info */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">Batch & Event Info</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Event Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {event?.title || event?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Batch Reference</p>
                  <p className="text-sm font-mono font-medium text-purple-600">
                    {batch?.batch_reference || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Students Count</p>
                  <p className="text-sm font-medium text-gray-900">
                    {batch?.student_count || batch?.total_students || batch?.students?.length || 0}
                  </p>
                </div>
                {batch?.batch_reference && (
                  <Link
                    to={`/school/batches/${batch.batch_reference}`}
                    className="inline-flex items-center text-sm text-purple-600 hover:text-purple-900"
                  >
                    View Batch Details →
                  </Link>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Receipt Section (if offline) */}
        {isOffline && receiptUrl && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">Payment Receipt</h3>
            </Card.Header>
            <Card.Body>
              <div className="flex items-center gap-6">
                <img
                  src={receiptUrl}
                  alt="Payment Receipt"
                  className="w-48 h-48 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-90"
                  onClick={() => window.open(receiptUrl, '_blank')}
                />
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Receipt uploaded on {formatDate(receiptDate)}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.open(receiptUrl, '_blank')}
                  >
                    Download Receipt
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Invoice Section (if generated) */}
        {payment.invoice && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">Invoice</h3>
            </Card.Header>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Invoice Number: {payment.invoice.invoice_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    Generated on {formatDate(payment.invoice.generated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => window.open(payment.invoice.invoice_url, '_blank')}>
                    Download Invoice
                  </Button>
                  <Link to={`/admin/invoices/${payment.invoice._id}`}>
                    <Button variant="primary">View Invoice</Button>
                  </Link>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Admin Actions (if pending) */}
        {isPending && isOffline && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">Admin Actions</h3>
            </Card.Header>
            <Card.Body>
              <div className="flex items-center gap-4">
                <Button
                  variant="success"
                  onClick={() => setShowVerifyModal(true)}
                  isLoading={verifyPayment.isPending}
                >
                  Verify Payment
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowRejectModal(true)}
                  isLoading={rejectPayment.isPending}
                >
                  Reject Payment
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Timeline/History */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold text-gray-900">Payment Timeline</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Payment Initiated</p>
                  <p className="text-sm text-gray-600">{formatDate(payment.created_at)}</p>
                </div>
              </div>

              {isOffline && (receiptDate || receiptUrl) && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Receipt Uploaded</p>
                    <p className="text-sm text-gray-600">{formatDate(receiptDate)}</p>
                  </div>
                </div>
              )}

              {payment.verified_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Payment Verified</p>
                    <p className="text-sm text-gray-600">{formatDate(payment.verified_at)}</p>
                    {payment.verified_by && (
                      <p className="text-sm text-gray-500">By: Admin</p>
                    )}
                  </div>
                </div>
              )}

              {payment.invoice?.generated_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Invoice Generated</p>
                    <p className="text-sm text-gray-600">{formatDate(payment.invoice.generated_at)}</p>
                  </div>
                </div>
              )}

              {payment.rejected_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Payment Rejected</p>
                    <p className="text-sm text-gray-600">{formatDate(payment.rejected_at)}</p>
                    {payment.rejection_reason && (
                      <p className="text-sm text-red-600 mt-1">Reason: {payment.rejection_reason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Verify Modal */}
        <Modal
          isOpen={showVerifyModal}
          onClose={() => {
            setShowVerifyModal(false);
            setActionNotes('');
          }}
          title="Verify Payment"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                You are about to verify this payment. This action will approve the payment and update the batch status.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Add any verification notes..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVerifyModal(false);
                  setActionNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={handleVerify}
                isLoading={verifyPayment.isPending}
              >
                Verify Payment
              </Button>
            </div>
          </div>
        </Modal>

        {/* Reject Modal */}
        <Modal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setActionNotes('');
          }}
          title="Reject Payment"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">
                You are about to reject this payment. Please provide a clear reason for rejection.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                placeholder="Explain why this payment is being rejected..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setActionNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                isLoading={rejectPayment.isPending}
              >
                Reject Payment
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default PaymentDetails;
