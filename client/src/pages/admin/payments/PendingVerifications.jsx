import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { usePendingOfflinePayments, useVerifyPayment, useRejectPayment } from '../../../hooks/useAdmin';
import { Card, Badge, Spinner, EmptyState, Button, Modal } from '../../../components/ui';
import { formatCurrency, formatDate } from '../../../utils/helpers';
import { BADGE_CLASSES } from '../../../utils/constants';
import { showError, showSuccess } from '../../../components/common/Toast';

/**
 * Pending Verifications Page
 * Admin page for verifying offline payments
 */
const PendingVerifications = () => {
  const { data: payments, isLoading } = usePendingOfflinePayments();
  const verifyPayment = useVerifyPayment();
  const rejectPayment = useRejectPayment();

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  const handleVerify = async () => {
    try {
      await verifyPayment.mutateAsync({
        paymentId: selectedPayment._id,
        notes: actionNotes,
      });
      showSuccess('Payment verified successfully!');
      setShowVerifyModal(false);
      setActionNotes('');
      setSelectedPayment(null);
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
      await rejectPayment.mutateAsync({
        paymentId: selectedPayment._id,
        reason: actionNotes,
      });
      showSuccess('Payment rejected');
      setShowRejectModal(false);
      setActionNotes('');
      setSelectedPayment(null);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/payments" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pending Verifications</h1>
              <p className="text-gray-600 mt-1">Review and verify offline payment submissions</p>
            </div>
          </div>
          {payments && payments.length > 0 && (
            <Badge variant="warning" size="lg">
              {payments.length} Pending
            </Badge>
          )}
        </div>

        {/* Info Banner */}
        <Card>
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Verification Guidelines</h3>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Verify the payment receipt matches the amount and transaction ID</li>
                <li>• Check that the receipt is clear and legitimate</li>
                <li>• Cross-reference with bank statements if needed</li>
                <li>• Provide clear notes for rejections to help schools understand</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Payments List */}
        {payments && payments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {payments.map((payment) => (
              <Card key={payment._id}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Payment Info */}
                  <div className="lg:col-span-7">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            to={`/admin/payments/${payment._id}`}
                            className="text-lg font-semibold text-purple-600 hover:text-purple-700"
                          >
                            {payment.payment_reference}
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">
                            Submitted {formatDate(payment.created_at)}
                          </p>
                        </div>
                        <Badge variant="warning">Pending Verification</Badge>
                      </div>

                      {/* School & Batch */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">School</p>
                          <Link
                            to={`/admin/schools/${payment.school?._id}`}
                            className="text-sm font-medium text-gray-900 hover:text-purple-600"
                          >
                            {payment.school?.name}
                          </Link>
                          <p className="text-xs text-gray-600">{payment.school?.school_code}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Batch Reference</p>
                          <p className="text-sm font-medium text-gray-900">
                            {payment.batch?.batch_reference}
                          </p>
                          <p className="text-xs text-gray-600">
                            {payment.batch?.num_students} students
                          </p>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Amount</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(payment.amount, payment.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Payment Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(payment.payment_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Transaction ID</p>
                            <p className="text-sm font-medium text-gray-900 font-mono">
                              {payment.transaction_id || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Payment Method</p>
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {payment.payment_gateway || 'Bank Transfer'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {payment.notes && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">School Notes</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {payment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Receipt & Actions */}
                  <div className="lg:col-span-5">
                    <div className="space-y-4">
                      {/* Receipt Preview */}
                      {payment.receipt_url && (
                        <div>
                          <p className="text-xs text-gray-600 mb-2">Payment Receipt</p>
                          <div
                            className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowReceiptModal(true);
                            }}
                          >
                            <img
                              src={payment.receipt_url}
                              alt="Payment Receipt"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /%3E%3C/svg%3E';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                              <svg className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowReceiptModal(true);
                            }}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium mt-2"
                          >
                            View Full Receipt
                          </button>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-3 pt-4 border-t border-gray-200">
                        <Button
                          variant="primary"
                          fullWidth
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowVerifyModal(true);
                          }}
                          leftIcon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          }
                        >
                          Verify Payment
                        </Button>
                        <Button
                          variant="danger"
                          fullWidth
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowRejectModal(true);
                          }}
                          leftIcon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          }
                        >
                          Reject Payment
                        </Button>
                        <Link to={`/admin/payments/${payment._id}`}>
                          <Button variant="outline" fullWidth>
                            View Full Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              message="All caught up!"
              description="There are no pending payment verifications at the moment. New offline payments will appear here for your review."
              actionLabel="View All Payments"
              onAction={() => window.location.href = '/admin/payments'}
            />
          </Card>
        )}

        {/* Verify Modal */}
        <Modal
          isOpen={showVerifyModal}
          onClose={() => {
            setShowVerifyModal(false);
            setActionNotes('');
            setSelectedPayment(null);
          }}
          title="Verify Payment"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                You are about to verify this payment of <strong>{formatCurrency(selectedPayment?.amount, selectedPayment?.currency)}</strong> from <strong>{selectedPayment?.school?.name}</strong>.
              </p>
              <p className="text-sm text-green-800 mt-2">
                This will approve the batch and generate an invoice for the school.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={3}
                className="input"
                placeholder="Add any notes about this verification..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVerifyModal(false);
                  setActionNotes('');
                  setSelectedPayment(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleVerify}
                loading={verifyPayment.isPending}
                disabled={verifyPayment.isPending}
                className="flex-1"
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
            setSelectedPayment(null);
          }}
          title="Reject Payment"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">
                You are about to reject this payment from <strong>{selectedPayment?.school?.name}</strong>.
              </p>
              <p className="text-sm text-red-800 mt-2">
                The school will be notified and will need to resubmit their payment.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection <span className="text-red-600">*</span>
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={3}
                className="input"
                placeholder="Explain clearly why this payment is being rejected..."
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setActionNotes('');
                  setSelectedPayment(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                loading={rejectPayment.isPending}
                disabled={rejectPayment.isPending}
                className="flex-1"
              >
                Reject Payment
              </Button>
            </div>
          </div>
        </Modal>

        {/* Receipt Modal */}
        <Modal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedPayment(null);
          }}
          title="Payment Receipt"
          size="2xl"
        >
          <div className="space-y-4">
            {selectedPayment?.receipt_url && (
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={selectedPayment.receipt_url}
                  alt="Payment Receipt"
                  className="w-full h-auto"
                />
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedPayment(null);
                }}
                className="flex-1"
              >
                Close
              </Button>
              <a
                href={selectedPayment?.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="primary" fullWidth>
                  Open in New Tab
                </Button>
              </a>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default PendingVerifications;
