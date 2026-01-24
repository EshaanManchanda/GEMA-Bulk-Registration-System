import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { Card, Badge, Spinner, Button } from '../../../components/ui';
import ContactSupportModal from '../../../components/common/ContactSupportModal';
import { formatDate } from '../../../utils/helpers';
import { BADGE_CLASSES } from '../../../utils/constants';
import { useSchoolProfile, useSendOtp, useVerifyOtp } from '../../../hooks/useAuth';
import { useNotificationStore } from '../../../stores/notificationStore';

/**
 * Profile View Page
 * Displays school profile information
 */
const ViewProfile = () => {
  const { data: school, isLoading } = useSchoolProfile();
  const { showSuccess, showError } = useNotificationStore();
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);

  const handleSendOtp = async () => {
    try {
      await sendOtp.mutateAsync();
      showSuccess('OTP sent to your email address');
      setIsOtpModalOpen(true);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifyOtp.mutateAsync({ otp });
      showSuccess('Email verified successfully');
      setIsOtpModalOpen(false);
      setOtp('');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to verify OTP');
    }
  };

  if (isLoading) {
    return (
      <SchoolLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="xl" />
        </div>
      </SchoolLayout>
    );
  }

  if (!school) {
    return (
      <SchoolLayout>
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600">Unable to load profile information.</p>
          </div>
        </Card>
      </SchoolLayout>
    );
  }

  return (
    <SchoolLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">View and manage your school information</p>
          </div>
          <Link to="/school/profile/edit">
            <Button variant="primary" leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }>
              Edit Profile
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* School Information */}
            <Card>
              <Card.Header>
                <Card.Title>School Information</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">School Code</p>
                    <p className="text-lg font-medium text-gray-900">{school.school_code}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">School Name</p>
                    <p className="text-lg font-medium text-gray-900">{school.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Country</p>
                    <p className="text-lg font-medium text-gray-900">{school.country}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Currency</p>
                    <p className="text-lg font-medium text-gray-900">{school.currency_pref}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Account Status</p>
                    <Badge variant={school.is_active ? 'success' : 'error'}>
                      {school.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email Verified</p>
                    <Badge variant={school.is_verified ? 'success' : 'warning'}>
                      {school.is_verified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Member Since</p>
                    <p className="text-lg font-medium text-gray-900">{formatDate(school.created_at)}</p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Contact Information */}
            <Card>
              <Card.Header>
                <Card.Title>Contact Information</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Contact Person</p>
                    <p className="text-lg font-medium text-gray-900">
                      {school.contact_person?.name || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email Address</p>
                    <p className="text-lg font-medium text-gray-900">
                      {school.contact_person?.email || 'Not provided'}
                      {!school.is_verified && (
                        <button
                          onClick={handleSendOtp}
                          disabled={sendOtp.isPending}
                          className="ml-2 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                        >
                          {sendOtp.isPending ? 'Sending...' : 'Verify Now'}
                        </button>
                      )}
                      {school.is_verified && (
                        <span className="ml-2 text-sm text-green-600 font-medium">Verified</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                    <p className="text-lg font-medium text-gray-900">
                      {school.contact_person?.phone || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Website</p>
                    {school.external_docs_link ? (
                      <a
                        href={school.external_docs_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-medium text-primary-600 hover:text-primary-700"
                      >
                        Visit Website
                      </a>
                    ) : (
                      <p className="text-lg font-medium text-gray-900">Not provided</p>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Address */}
            <Card>
              <Card.Header>
                <Card.Title>Address</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Street Address</p>
                    <p className="text-lg font-medium text-gray-900">
                      {school.address?.street || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">City</p>
                    <p className="text-lg font-medium text-gray-900">{school.address?.city || 'Not provided'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">State/Province</p>
                    <p className="text-lg font-medium text-gray-900">{school.address?.state || 'Not provided'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Postal Code</p>
                    <p className="text-lg font-medium text-gray-900">
                      {school.address?.postal_code || 'Not provided'}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <Card.Header>
                <Card.Title>Quick Actions</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  <Link to="/school/profile/edit">
                    <Button
                      variant="outline"
                      fullWidth
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      }
                    >
                      Edit Profile
                    </Button>
                  </Link>

                  <Link to="/school/profile/change-password">
                    <Button
                      variant="outline"
                      fullWidth
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      }
                    >
                      Change Password
                    </Button>
                  </Link>
                </div>
              </Card.Body>
            </Card>

            {/* Account Status */}
            <Card>
              <Card.Header>
                <Card.Title>Account Status</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {!school.is_verified && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-blue-900 mb-1">Email Not Verified</p>
                          <p className="text-sm text-blue-800">
                            Please verify your email address to ensure you receive important notifications.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Help */}
            <Card>
              <Card.Header>
                <Card.Title>Need Help?</Card.Title>
              </Card.Header>
              <Card.Body>
                <p className="text-sm text-gray-600 mb-4">
                  If you need to update your school code or have any questions about your account, please contact our support team.
                </p>
                <Button variant="outline" fullWidth onClick={() => setShowContactModal(true)}>
                  Contact Support
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {
        isOtpModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Enter Verification Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                We have sent a 6-digit verification code to your email address.
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                maxLength={6}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsOtpModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={verifyOtp.isPending || !otp}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {verifyOtp.isPending ? 'Verifying...' : 'Verify'}
                </button>
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={handleSendOtp}
                  disabled={sendOtp.isPending}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Contact Support Modal */}
      <ContactSupportModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </SchoolLayout >
  );
};

export default ViewProfile;
