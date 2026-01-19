import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SchoolLayout from '../../../layouts/SchoolLayout';
import { useSchoolProfile, useUpdateSchoolProfile } from '../../../hooks/useAuth';
import { Card, Button, Spinner } from '../../../components/ui';
import FormField from '../../../components/forms/FormField';
import { showError, showSuccess } from '../../../components/common/Toast';
import { COUNTRIES, CURRENCIES } from '../../../utils/constants';

/**
 * Profile Edit Schema
 */
const profileSchema = yup.object().shape({
  name: yup.string().required('School name is required'),
  contact_person_name: yup.string().required('Contact person name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  website: yup.string().url('Invalid URL').nullable(),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State/Province is required'),
  postal_code: yup.string().required('Postal code is required'),
  country: yup.string().required('Country is required'),
  currency: yup.string().required('Currency is required'),
});

/**
 * Profile Edit Page
 * Allows schools to edit their profile information
 */
const EditProfile = () => {
  const navigate = useNavigate();
  const { data: school, isLoading: isLoadingProfile } = useSchoolProfile();
  const updateProfile = useUpdateSchoolProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(profileSchema),
  });

  const selectedCountry = watch('country');

  // Load profile data into form
  useEffect(() => {
    if (school) {
      reset({
        name: school.name || '',
        contact_person_name: school.contact_person?.name || '',
        email: school.contact_person?.email || school.email || '',
        phone: school.contact_person?.phone || '',
        website: school.external_docs_link || '',
        address: school.address?.street || '',
        city: school.address?.city || '',
        state: school.address?.state || '',
        postal_code: school.address?.postal_code || '',
        country: school.country || '',
        currency: school.currency_pref || school.currency || '',
      });
    }
  }, [school, reset]);

  const onSubmit = async (data) => {
    try {
      // Structure the data to match backend schema
      const formattedData = {
        contact_person: {
          name: data.contact_person_name,
          phone: data.phone,
          // email cannot be updated via this endpoint usually, or if it is, careful with nesting
        },
        address: {
          street: data.address,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          country: data.country
        },
        external_docs_link: data.website
      };

      await updateProfile.mutateAsync(formattedData);
      showSuccess('Profile updated successfully!');
      navigate('/school/profile');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update profile');
    }
  };

  if (isLoadingProfile) {
    return (
      <SchoolLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="xl" />
        </div>
      </SchoolLayout>
    );
  }

  return (
    <SchoolLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-1">Update your school information</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/school/profile')}
          >
            Cancel
          </Button>
        </div>

        {/* Info Banner */}
        <Card>
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Important Note</h3>
              <p className="text-sm text-gray-600 mt-1">
                Some fields like School Code and Country cannot be changed. If you need to update these, please contact support.
              </p>
            </div>
          </div>
        </Card>

        {/* Edit Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* School Information */}
          <Card>
            <Card.Header>
              <Card.Title>School Information</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* School Code (Read-only) */}
                <FormField
                  label="School Code"
                  helperText="Cannot be changed"
                >
                  <input
                    type="text"
                    value={school?.school_code || ''}
                    disabled
                    className="input opacity-60 cursor-not-allowed"
                  />
                </FormField>

                <FormField
                  label="School Name"
                  helperText="Cannot be changed"
                >
                  <input
                    type="text"
                    value={school?.name || ''}
                    disabled
                    className="input opacity-60 cursor-not-allowed"
                  />
                </FormField>

                {/* Country (Read-only) */}
                <FormField
                  label="Country"
                  helperText="Cannot be changed"
                >
                  <input
                    type="text"
                    value={school?.country || ''}
                    disabled
                    className="input opacity-60 cursor-not-allowed"
                  />
                </FormField>

                {/* Currency */}
                <FormField
                  label="Preferred Currency"
                  helperText="Cannot be changed"
                >
                  <input
                    type="text"
                    value={school?.currency_pref || school?.currency || ''}
                    disabled
                    className="input opacity-60 cursor-not-allowed uppercase"
                  />
                </FormField>
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
                {/* Contact Person */}
                <FormField
                  label="Contact Person Name"
                  error={errors.contact_person_name?.message}
                  required
                >
                  <input
                    type="text"
                    {...register('contact_person_name')}
                    className="input"
                    placeholder="Enter contact person name"
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
                    placeholder="school@example.com"
                  />
                </FormField>

                {/* Phone */}
                <FormField
                  label="Phone Number"
                  error={errors.phone?.message}
                  required
                >
                  <input
                    type="tel"
                    {...register('phone')}
                    className="input"
                    placeholder="+1234567890"
                  />
                </FormField>

                {/* Website */}
                <FormField
                  label="Website"
                  error={errors.website?.message}
                  helperText="Optional"
                >
                  <input
                    type="url"
                    {...register('website')}
                    className="input"
                    placeholder="https://www.yourschool.com"
                  />
                </FormField>
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
                {/* Street Address */}
                <FormField
                  label="Street Address"
                  error={errors.address?.message}
                  required
                  className="md:col-span-2"
                >
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="input"
                    placeholder="Enter full address"
                  />
                </FormField>

                {/* City */}
                <FormField
                  label="City"
                  error={errors.city?.message}
                  required
                >
                  <input
                    type="text"
                    {...register('city')}
                    className="input"
                    placeholder="Enter city"
                  />
                </FormField>

                {/* State/Province */}
                <FormField
                  label="State/Province"
                  error={errors.state?.message}
                  required
                >
                  <input
                    type="text"
                    {...register('state')}
                    className="input"
                    placeholder="Enter state or province"
                  />
                </FormField>

                {/* Postal Code */}
                <FormField
                  label="Postal Code"
                  error={errors.postal_code?.message}
                  required
                >
                  <input
                    type="text"
                    {...register('postal_code')}
                    className="input"
                    placeholder="Enter postal code"
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
                onClick={() => navigate('/school/profile')}
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
    </SchoolLayout>
  );
};

export default EditProfile;
