import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { apiClient, ENDPOINTS } from '../../../api';
import { Button, Card } from '../../../components/ui';
import Spinner from '../../../components/ui/Spinner';
import { showError, showSuccess } from '../../../components/common/Toast';

/**
 * School Verify Email Page
 * Handles email verification via token from URL
 */
const SchoolVerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailFromState = location.state?.email;

  const [status, setStatus] = useState('verifying'); // verifying, success, error, waiting
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else if (!emailFromState) {
      setStatus('error');
      setMessage('Invalid verification link');
    } else {
      setStatus('waiting');
    }
  }, [token, emailFromState]);

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.SCHOOL_VERIFY_EMAIL, {
        token: verificationToken,
      });
      setStatus('success');
      setMessage(response.data?.message || 'Email verified successfully!');
      showSuccess('Email verified! You can now login.');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/school/login');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.message || 'Verification failed. The link may have expired.'
      );
      showError(message);
    }
  };

  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      await apiClient.post(ENDPOINTS.AUTH.SCHOOL_RESEND_VERIFICATION);
      showSuccess('Verification email sent! Please check your inbox.');
    } catch (error) {
      if (error.response?.status === 401) {
        showError('Please login to your account to resend the verification email.');
        navigate('/school/login');
      } else {
        const message = error.response?.data?.message || 'Failed to send verification email.';
        showError(message);
      }
    } finally {
      setIsResending(false);
    }
  };

  // Verifying state
  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <div className="text-center py-8">
              <Spinner size="lg" className="mb-4 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Verifying Your Email...
              </h2>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <div className="text-center">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-600 mb-6">{message}</p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  Your account is now active. You can login and start using GEMA Events.
                </p>
              </div>

              <Link to="/school/login">
                <Button variant="primary" fullWidth>
                  Go to Login
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <div className="text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>

              <div className="space-y-3">
                {emailFromState && (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleResendEmail}
                    loading={isResending}
                  >
                    Resend Verification Email
                  </Button>
                )}

                <Link to="/school/login" className="block">
                  <Button variant="outline" fullWidth>
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Waiting state (after registration)
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="text-center">
            {/* Email Icon */}
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification email to <strong>{emailFromState}</strong>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
              <p className="text-sm text-blue-800">
                <strong>Next steps:</strong>
              </p>
              <ol className="list-decimal list-inside text-sm text-blue-700 mt-2 space-y-1">
                <li>Check your email inbox</li>
                <li>Click the verification link in the email</li>
                <li>You'll be redirected to login</li>
              </ol>
            </div>

            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={handleResendEmail}
              >
                Resend Verification Email
              </Button>

              <Link to="/school/login" className="block">
                <Button variant="outline" fullWidth>
                  Back to Login
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Didn't receive the email? Check your spam folder. The verification email was sent automatically when you registered.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SchoolVerifyEmail;
