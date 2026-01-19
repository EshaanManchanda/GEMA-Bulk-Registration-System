import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { Card, Button } from '../../../components/ui';

/**
 * Payment Failure Page
 * Displayed when payment fails or is cancelled
 */
const PaymentFailure = () => {
  const navigate = useNavigate();

  return (
    <SchoolLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-2xl w-full">
          <div className="text-center py-8">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
            <p className="text-lg text-gray-600 mb-8">
              Unfortunately, your payment could not be processed. Please try again.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <p className="text-sm text-yellow-900 font-medium mb-2">Common Reasons:</p>
              <ul className="text-sm text-yellow-800 space-y-2 text-left max-w-md mx-auto">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Insufficient funds in your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Card expired or declined by bank</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Incorrect card details entered</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>Payment cancelled by you</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-blue-900">
                <strong>Need Help?</strong> If you continue to experience issues, please contact our support team or try an offline payment method.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(-1)}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
              >
                Try Again
              </Button>
              <Link to="/school/batches">
                <Button variant="outline" size="lg">
                  Back to Batches
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </SchoolLayout>
  );
};

export default PaymentFailure;
