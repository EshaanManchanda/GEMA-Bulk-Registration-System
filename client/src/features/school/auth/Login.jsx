import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { schoolLoginSchema } from '../../../utils/validators';
import { useAuth } from '../../../context/AuthContext';
import { Button, Input, Checkbox, Card } from '../../../components/ui';
import { showError } from '../../../components/common/Toast';

/**
 * School Login Page
 * Handles school authentication with email and password
 */
const SchoolLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginSchool } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schoolLoginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await loginSchool({
        email: data.email,
        password: data.password,
      });

      // Redirect to the page they tried to visit or dashboard
      const from = location.state?.from?.pathname || '/school/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      showError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/assets/images/gema-logo.png" alt="GEMA Events" className="h-16 w-auto mx-auto mb-4" />
          <p className="text-gray-600">School Portal Login</p>
        </div>

        {/* Login Card */}
        <Card>
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

            {/* Password Field */}
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Enter your password"
              error={errors.password?.message}
              required
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
              rightIcon={
                showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )
              }
              onRightIconClick={() => setShowPassword(!showPassword)}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <Checkbox {...register('remember')} label="Remember me" />

              <Link
                to="/school/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button type="submit" variant="primary" fullWidth loading={isLoading}>
              Sign In
            </Button>

            {/* Register Link */}
            <div className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/school/register"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Register here
              </Link>
            </div>
          </form>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SchoolLogin;
