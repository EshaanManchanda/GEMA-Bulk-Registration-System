
import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { useBatchDetails } from '../../../hooks/useBatches';
import { useInitiatePayment, useOfflinePayment } from '../../../hooks/usePayments';
import { Card, Button, Spinner, Input, Textarea, FileUpload, Badge } from '../../../components/ui';
import StripeCheckout from '../../../components/school/StripeCheckout';
import { formatCurrency, formatDate } from '../../../utils/helpers';
import { showError, showSuccess } from '../../../components/common/Toast';
import { PAYMENT_MODE } from '../../../utils/constants';

/**
 * Make Payment Page
 * Handles online (Razorpay/Stripe) and offline payment submissions
 */
const MakePayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const batchReference = searchParams.get('batch');
  const mode = searchParams.get('mode') || 'online';

  const { data, isLoading: batchLoading } = useBatchDetails(batchReference);
  const batch = data?.batch;
  const payment = data?.payment;
  const initiatePayment = useInitiatePayment();
  const offlinePayment = useOfflinePayment();

  const [paymentMode, setPaymentMode] = useState(mode); // 'online' or 'offline'
  const [showStripe, setShowStripe] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      transaction_id: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
      receipt: null,
    },
  });

  const receiptFile = watch('receipt');

  const handleOnlinePayment = async () => {
    try {
      const result = await initiatePayment.mutateAsync({
        batchReference: batch.batch_reference,
        paymentMethod: 'stripe',
      });

      // Result contains { status, data } - extract data
      const { gateway_data, amount, currency } = result.data;

      // Normalize order data for Stripe
      const orderData = {
        client_secret: gateway_data.client_secret,
        amount: amount,
        currency: currency,
        ...gateway_data
      };

      setPaymentOrder(orderData);
      setShowStripe(true);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to initiate payment');
    }
  };

  const handleOfflinePayment = async (data) => {
    try {
      await offlinePayment.mutateAsync({
        batch_reference: batch.batch_reference,
        transaction_id: data.transaction_id,
        amount: batch.total_amount,
        payment_date: data.payment_date,
        notes: data.notes,
        receipt: data.receipt,
      });

      showSuccess('Offline payment submitted! It will be verified by admin.');
      navigate(`/school/batches/${batch.batch_reference}`);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to submit offline payment');
    }
  };

  const handlePaymentSuccess = () => {
    showSuccess('Payment successful! Your batch is now confirmed.');
    navigate('/school/payments/success');
  };

  const handlePaymentFailure = (error) => {
    showError(error || 'Payment failed. Please try again.');
    navigate('/school/payments/failure');
  };

  if (batchLoading) {
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
            <p className="text-gray-600 mb-6">Unable to find the batch for payment.</p>
            <Link to="/school/batches">
              <Button variant="primary">Back to My Batches</Button>
            </Link>
          </div>
        </Card>
      </SchoolLayout>
    );
  }

  // Check if payment already completed
  if (payment && payment.status === 'completed') {
    return (
      <SchoolLayout>
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Already Completed</h2>
            <p className="text-gray-600 mb-6">This batch has already been paid for.</p>
            <Link to={`/school/batches/${batch.batch_reference}`}>
              <Button variant="primary">View Batch Details</Button>
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
          <Link to={`/school/batches/${batch.batch_reference}`} className="text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Make Payment</h1>
            <p className="text-gray-600 mt-1">Complete payment for batch {batch.batch_reference}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Selection */}
            <Card>
              <Card.Header>
                <Card.Title>Select Payment Method</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMode('online')}
                    className={`p-6 border-2 rounded-lg transition-all ${paymentMode === 'online'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMode === 'online' ? 'bg-primary-600' : 'bg-gray-200'
                        }`}>
                        <svg className={`w-6 h-6 ${paymentMode === 'online' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Online Payment</p>
                        <p className="text-sm text-gray-600">Stripe</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMode('offline')}
                    className={`p-6 border-2 rounded-lg transition-all ${paymentMode === 'offline'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMode === 'offline' ? 'bg-primary-600' : 'bg-gray-200'
                        }`}>
                        <svg className={`w-6 h-6 ${paymentMode === 'offline' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Offline Payment</p>
                        <p className="text-sm text-gray-600">Bank transfer/Cash</p>
                      </div>
                    </div>
                  </button>
                </div>
              </Card.Body>
            </Card>

            {/* Online Payment */}
            {paymentMode === 'online' && (
              <Card>
                <Card.Header>
                  <Card.Title>Pay Online</Card.Title>
                  <Card.Description>
                    Secure payment via Stripe
                  </Card.Description>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <strong>Payment Gateway:</strong> Stripe
                      </p>
                      <p className="text-sm text-blue-800 mt-1">
                        You will be redirected to a secure payment page to complete your transaction.
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleOnlinePayment}
                      loading={initiatePayment.isPending}
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      }
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Offline Payment */}
            {paymentMode === 'offline' && (
              <Card>
                <Card.Header>
                  <Card.Title>Submit Offline Payment Details</Card.Title>
                  <Card.Description>
                    Upload proof of payment for admin verification
                  </Card.Description>
                </Card.Header>
                <Card.Body>
                  <form onSubmit={handleSubmit(handleOfflinePayment)} className="space-y-4">
                    <Input
                      {...register('transaction_id', { required: 'Transaction ID is required' })}
                      label="Transaction ID / Reference Number"
                      placeholder="Enter transaction reference"
                      error={errors.transaction_id?.message}
                      required
                    />

                    <Input
                      {...register('payment_date', { required: 'Payment date is required' })}
                      type="date"
                      label="Payment Date"
                      error={errors.payment_date?.message}
                      required
                    />

                    <FileUpload
                      label="Upload Payment Receipt"
                      helperText="Upload proof of payment (PDF, JPG, PNG - max 5MB)"
                      accept={{
                        'image/*': ['.jpg', '.jpeg', '.png'],
                        'application/pdf': ['.pdf'],
                      }}
                      maxSize={5 * 1024 * 1024}
                      onFileSelect={(file) => setValue('receipt', file)}
                      error={errors.receipt?.message}
                    />

                    <Textarea
                      {...register('notes')}
                      label="Additional Notes (Optional)"
                      placeholder="Add any additional information..."
                      rows={3}
                    />

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-900 font-medium mb-1">Note:</p>
                      <p className="text-sm text-yellow-800">
                        Your offline payment will be verified by our admin team. You'll receive a confirmation email once verified.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={offlinePayment.isPending}
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                    >
                      Submit Payment Details
                    </Button>
                  </form>
                </Card.Body>
              </Card>
            )}
          </div>

          {/* Sidebar - Order Summary */}
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>Order Summary</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Event</p>
                    <p className="font-medium text-gray-900">{batch.event?.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Batch Reference</p>
                    <p className="font-medium text-gray-900">{batch.batch_reference}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Number of Students</p>
                    <p className="font-medium text-gray-900">{batch.num_students}</p>
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-2">
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

                    <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-lg text-gray-900">
                      <span>Total Amount</span>
                      <span>{formatCurrency(batch.total_amount, batch.currency)}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Currency: {batch.currency}</p>
                    <p className="text-xs text-gray-600">Created: {formatDate(batch.created_at)}</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>

      {/* Stripe Checkout Modal */}
      {showStripe && paymentOrder && (
        <StripeCheckout
          order={paymentOrder}
          batch={batch}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onClose={() => setShowStripe(false)}
        />
      )}
    </SchoolLayout>
  );
};

export default MakePayment;
