import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { apiClient, ENDPOINTS } from '../../../api';
import { Button, Input, Card } from '../../../components/ui';
import { showError, showSuccess } from '../../../components/common/Toast';

// Validation schema
const forgotPasswordSchema = yup.object({
  email: yup.string().email('Invalid email address').required('Email is required'),
});

/**
 * School Forgot Password Page
 * Request password reset link
 */
const SchoolForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const email = watch('email');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await apiClient.post(ENDPOINTS.AUTH.SCHOOL_FORGOT_PASSWORD, data);
      setEmailSent(true);
      showSuccess('Password reset link sent! Please check your email.');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Next steps:</strong>
                </p>
                <ol className="list-decimal list-inside text-sm text-blue-700 mt-2 space-y-1">
                  <li>Check your email inbox</li>
                  <li>Click the reset link in the email</li>
                  <li>Create a new password</li>
                </ol>
              </div>

              <div className="space-y-3">
                <Link to="/school/login" className="block">
                  <Button variant="primary" fullWidth>
                    Back to Login
                  </Button>
                </Link>

                <button
                  onClick={() => setEmailSent(false)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Didn't receive the email? Try again
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/assets/images/gema-logo.png" alt="GEMA Events" className="h-16 w-auto mx-auto mb-4" />
          <p className="text-gray-600">Reset Your Password</p>
        </div>

        {/* Forgot Password Card */}
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Forgot Password?</h2>
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <Input
              {...register('email')}
              type="email"
              label="Email Address"
              placeholder="school@example.com"
              error={errors.email?.message}
              required
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            />

            {/* Submit Button */}
            <Button type="submit" variant="primary" fullWidth loading={isLoading}>
              Send Reset Link
            </Button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/school/login"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </Card>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SchoolForgotPassword;
