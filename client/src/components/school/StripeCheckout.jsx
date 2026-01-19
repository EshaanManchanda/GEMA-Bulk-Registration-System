import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useVerifyStripePayment } from '../../hooks/usePayments';
import { Modal, Button } from '../ui';
import { formatCurrency } from '../../utils/helpers';
import { showError } from '../common/Toast';

// Load Stripe with environment-based key
const isDevelopment = import.meta.env.MODE === 'development';
const STRIPE_PUBLISHABLE_KEY = isDevelopment
  ? import.meta.env.VITE_STRIPE_TEST_PUBLISHABLE_KEY
  : import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

/**
 * Stripe Payment Form
 */
const StripePaymentForm = ({ order, batch, onSuccess, onFailure, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const verifyPayment = useVerifyStripePayment();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);

      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Confirm payment with backend
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        order.client_secret,
        {
          payment_method: paymentMethod.id,
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Verify payment on backend
      await verifyPayment.mutateAsync({
        payment_intent_id: paymentIntent.id,
        batch_reference: batch.batch_reference,
      });

      onSuccess();
    } catch (error) {
      showError(error.message || 'Payment failed');
      onFailure(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Inter", sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Pay with Stripe"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Event:</span>
            <span className="font-medium text-gray-900">{batch.event?.name}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Students:</span>
            <span className="font-medium text-gray-900">{batch.num_students}</span>
          </div>
          <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between">
            <span className="font-semibold text-gray-900">Total:</span>
            <span className="font-bold text-lg text-gray-900">
              {formatCurrency(batch.total_amount, batch.currency)}
            </span>
          </div>
        </div>

        {/* Card Element */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="p-4 border border-gray-300 rounded-lg">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-blue-800">
              Your payment is processed securely by Stripe. We never store your card details.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isProcessing}
            disabled={!stripe || isProcessing}
            className="flex-1"
          >
            Pay {formatCurrency(batch.total_amount, batch.currency)}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/**
 * Stripe Checkout Component
 * Wrapper component with Stripe Elements provider
 */
const StripeCheckout = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  );
};

export default StripeCheckout;
