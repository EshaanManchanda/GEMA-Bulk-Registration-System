import React from 'react';

/**
 * Payment Selection Modal
 * Modal for selecting payment method (online or offline)
 */
const PaymentSelectionModal = ({ batchReference, amount, currency, onClose, onSelect }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Select Payment Method</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">Amount to pay:</p>
          <p className="text-2xl font-bold text-primary-600">
            {currency} {amount.toLocaleString()}
          </p>
        </div>

        <div className="space-y-3">
          {/* Online Payment Option */}
          <button
            onClick={() => onSelect('online')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Online Payment</h4>
                <p className="text-sm text-gray-500">Card, UPI, Net Banking</p>
                <p className="text-xs text-gray-400 mt-1">
                  {currency === 'INR' ? 'via Razorpay' : 'via Stripe'}
                </p>
              </div>
            </div>
          </button>

          {/* Offline Payment Option */}
          <button
            onClick={() => onSelect('offline')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Offline Payment</h4>
                <p className="text-sm text-gray-500">Bank Transfer / Cash</p>
                <p className="text-xs text-gray-400 mt-1">Upload payment receipt for verification</p>
              </div>
            </div>
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Secure payment processing. Your data is encrypted.
        </p>
      </div>
    </div>
  );
};

export default PaymentSelectionModal;
