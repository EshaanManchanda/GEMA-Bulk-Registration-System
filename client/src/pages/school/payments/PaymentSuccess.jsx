import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { Card, Button } from '../../../components/ui';

/**
 * Payment Success Page
 * Displayed after successful payment
 */
const PaymentSuccess = () => {
  useEffect(() => {
    // Optional: Confetti animation
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const colors = ['#2563eb', '#16a34a', '#dc2626'];

    (function frame() {
      if (typeof window.confetti === 'function') {
        window.confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        window.confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });
      }

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <SchoolLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-2xl w-full">
          <div className="text-center py-8">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-lg text-gray-600 mb-8">
              Your payment has been processed successfully. Your batch is now confirmed!
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <p className="text-sm text-green-900 font-medium mb-2">What's Next?</p>
              <ul className="text-sm text-green-800 space-y-2 text-left max-w-md mx-auto">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>You'll receive a confirmation email with invoice</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>View your batch details and student list</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Download invoice from the invoices section</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/school/batches">
                <Button variant="primary" size="lg">
                  View My Batches
                </Button>
              </Link>
              <Link to="/school/payments">
                <Button variant="outline" size="lg">
                  View Payments
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </SchoolLayout>
  );
};

export default PaymentSuccess;
