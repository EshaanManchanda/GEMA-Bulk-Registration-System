import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { useSchoolChangePassword } from '../../../hooks/useAuth';
import { Card, Button } from '../../../components/ui';
import FormField from '../../../components/forms/FormField';
import { showError, showSuccess } from '../../../components/common/Toast';

/**
 * Password Change Schema
 */
const changePasswordSchema = yup.object().shape({
  old_password: yup.string().required('Current password is required'),
  new_password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[@$!%*?&#]/, 'Password must contain at least one special character')
    .required('New password is required'),
  confirm_password: yup
    .string()
    .oneOf([yup.ref('new_password')], 'Passwords must match')
    .required('Please confirm your password'),
});

/**
 * Password Strength Component
 */
const PasswordStrength = ({ password }) => {
  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[@$!%*?&#]/.test(pwd)) score++;

    const levels = [
      { score: 0, label: '', color: '' },
      { score: 1, label: 'Weak', color: 'bg-red-500' },
      { score: 2, label: 'Fair', color: 'bg-yellow-500' },
      { score: 3, label: 'Good', color: 'bg-blue-500' },
      { score: 4, label: 'Strong', color: 'bg-green-500' },
      { score: 5, label: 'Very Strong', color: 'bg-green-600' },
    ];

    return levels[Math.min(score, 5)];
  };

  const strength = calculateStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">Password Strength:</span>
        <span className={`text-xs font-medium ${strength.color.replace('bg-', 'text-')}`}>
          {strength.label}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${(strength.score / 5) * 100}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Change Password Page
 * Allows schools to change their password
 */
const ChangePassword = () => {
  const navigate = useNavigate();
  const changePassword = useSchoolChangePassword();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
  });

  const newPassword = watch('new_password', '');

  const onSubmit = async (data) => {
    try {
      await changePassword.mutateAsync({
        old_password: data.old_password,
        new_password: data.new_password,
      });
      showSuccess('Password changed successfully! Please login again with your new password.');
      reset();
      // Optionally logout and redirect to login
      setTimeout(() => {
        navigate('/school/profile');
      }, 2000);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to change password');
    }
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { label: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { label: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { label: 'One number', test: (pwd) => /[0-9]/.test(pwd) },
    { label: 'One special character (@$!%*?&#)', test: (pwd) => /[@$!%*?&#]/.test(pwd) },
  ];

  return (
    <SchoolLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
            <p className="text-gray-600 mt-1">Update your account password</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/school/profile')}
          >
            Back to Profile
          </Button>
        </div>

        {/* Security Notice */}
        <Card>
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Security Tips</h3>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Choose a strong, unique password</li>
                <li>• Don't reuse passwords from other accounts</li>
                <li>• Consider using a password manager</li>
                <li>• Change your password regularly</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Change Password Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>Password Information</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-6">
                {/* Current Password */}
                <FormField
                  label="Current Password"
                  error={errors.old_password?.message}
                  required
                >
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      {...register('old_password')}
                      className="input pr-10"
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showOldPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </FormField>

                <div className="border-t border-gray-200" />

                {/* New Password */}
                <FormField
                  label="New Password"
                  error={errors.new_password?.message}
                  required
                >
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      {...register('new_password')}
                      className="input pr-10"
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <PasswordStrength password={newPassword} />
                </FormField>

                {/* Password Requirements */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-3">Password Requirements:</p>
                  <ul className="space-y-2">
                    {passwordRequirements.map((req, index) => {
                      const isMet = req.test(newPassword);
                      return (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          {isMet ? (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className={isMet ? 'text-green-700' : 'text-gray-600'}>
                            {req.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Confirm Password */}
                <FormField
                  label="Confirm New Password"
                  error={errors.confirm_password?.message}
                  required
                >
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirm_password')}
                      className="input pr-10"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </FormField>
              </div>
            </Card.Body>
          </Card>

          {/* Action Buttons */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/school/profile')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={changePassword.isPending}
                disabled={changePassword.isPending}
              >
                Change Password
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </SchoolLayout>
  );
};

export default ChangePassword;
