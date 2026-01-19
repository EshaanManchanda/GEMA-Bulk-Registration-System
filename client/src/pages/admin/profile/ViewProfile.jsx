import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdminProfile } from '../../../hooks/useAuth';
import { Card, Badge, Spinner, Button } from '../../../components/ui';
import { formatDate } from '../../../utils/helpers';

/**
 * Admin Profile View Page
 * Displays admin profile information
 */
const ViewProfile = () => {
  const { data: admin, isLoading } = useAdminProfile();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="xl" />
        </div>
      </AdminLayout>
    );
  }

  if (!admin) {
    return (
      <AdminLayout>
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600">Unable to load profile information.</p>
          </div>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">View and manage your admin information</p>
          </div>
          <Link to="/admin/settings/profile/edit">
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
          <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <Card.Title>Admin Information</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="text-lg font-medium text-gray-900">{admin.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="text-lg font-medium text-gray-900">{admin.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Role</p>
                    <Badge variant="info">
                      {admin.role === 'super_admin' ? 'Super Admin' : admin.role === 'moderator' ? 'Moderator' : 'Admin'}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <Badge variant={admin.status === 'active' ? 'success' : 'danger'}>
                      {admin.status}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Member Since</p>
                    <p className="text-lg font-medium text-gray-900">{formatDate(admin.created_at)}</p>
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
                  <Link to="/admin/settings/profile/edit">
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

                  <Link to="/admin/settings/change-password">
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
                  {admin.status === 'active' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-green-900 mb-1">Account Active</p>
                          <p className="text-sm text-green-800">
                            Your admin account is active and has full access to the system.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {admin.status !== 'active' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-red-900 mb-1">Account Inactive</p>
                          <p className="text-sm text-red-800">
                            Your admin account is currently inactive. Contact a super admin for assistance.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ViewProfile;
