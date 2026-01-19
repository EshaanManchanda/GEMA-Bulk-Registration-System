import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdminProfile, useUpdateAdminProfile } from '../../../hooks/useAuth';
import { Card, Button, Spinner } from '../../../components/ui';
import FormField from '../../../components/forms/FormField';
import { showError, showSuccess } from '../../../components/common/Toast';

/**
 * Admin Profile Edit Schema
 */
const profileSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
});

/**
 * Admin Profile Edit Page
 * Allows admins to edit their profile information
 */
const EditProfile = () => {
  const navigate = useNavigate();
  const { data: admin, isLoading: isLoadingProfile } = useAdminProfile();
  const updateProfile = useUpdateAdminProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(profileSchema),
  });

  // Load profile data into form
  useEffect(() => {
    if (admin) {
      reset({
        name: admin.name || '',
        email: admin.email || '',
      });
    }
  }, [admin, reset]);

  const onSubmit = async (data) => {
    try {
      await updateProfile.mutateAsync(data);
      showSuccess('Profile updated successfully!');
      navigate('/admin/settings/profile');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update profile');
    }
  };

  if (isLoadingProfile) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-1">Update your admin information</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/settings/profile')}
          >
            Cancel
          </Button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Admin Information */}
          <Card>
            <Card.Header>
              <Card.Title>Admin Information</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-6">
                {/* Name */}
                <FormField
                  label="Name"
                  error={errors.name?.message}
                  required
                >
                  <input
                    type="text"
                    {...register('name')}
                    className="input"
                    placeholder="Enter your name"
                  />
                </FormField>

                {/* Email */}
                <FormField
                  label="Email Address"
                  error={errors.email?.message}
                  required
                  helperText="Used for login and notifications"
                >
                  <input
                    type="email"
                    {...register('email')}
                    className="input"
                    placeholder="admin@example.com"
                  />
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
                onClick={() => navigate('/admin/settings/profile')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={updateProfile.isPending}
                disabled={updateProfile.isPending}
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
};

export default EditProfile;
