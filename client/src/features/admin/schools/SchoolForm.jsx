import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Select, Textarea } from '../../../components/ui';
import { showError, showSuccess } from '../../../components/common/Toast';
import { COUNTRIES } from '../../../utils/constants';
import api from '../../../api';

/**
 * School Form Component
 * Reusable form for creating/editing schools
 */
const SchoolForm = ({ initialData = null, mode = 'create', onSuccess }) => {
  const navigate = useNavigate();

  // Validation schema
  const schoolSchema = yup.object({
    name: yup.string().max(200, 'Max 200 characters').required('School name is required'),
    contact_person: yup.object({
      name: yup.string().required('Contact person name is required'),
      email: yup.string().email('Invalid email').required('Email is required'),
      phone: yup.string().matches(/^[+]?[0-9]{10,15}$/, 'Invalid phone number').required('Phone is required'),
      designation: yup.string().max(100, 'Max 100 characters'),
    }),
    address: yup.object({
      street: yup.string().max(200, 'Max 200 characters'),
      city: yup.string().max(100, 'Max 100 characters'),
      state: yup.string().max(100, 'Max 100 characters'),
      postal_code: yup.string().max(20, 'Max 20 characters'),
      country: yup.string().required('Country is required'),
    }),
    admin_notes: yup.string().max(1000, 'Max 1000 characters'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schoolSchema),
    defaultValues: initialData || {
      name: '',
      contact_person: {
        name: '',
        email: '',
        phone: '',
        designation: '',
      },
      address: {
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'IN',
      },
      admin_notes: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      if (mode === 'edit' && initialData?._id) {
        // Update school
        await api.put(`/admin/schools/${initialData._id}`, data);
        showSuccess('School updated successfully');
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(`/admin/schools/${initialData._id}`);
        }
      } else {
        // Create school (if you have this endpoint)
        const response = await api.post('/admin/schools', data);
        showSuccess('School created successfully');
        if (onSuccess) {
          onSuccess(response.data.data.school);
        } else {
          navigate(`/admin/schools/${response.data.data.school._id}`);
        }
      }
    } catch (error) {
      showError(error.response?.data?.message || `Failed to ${mode} school`);
    }
  };

  const countryOptions = Object.values(COUNTRIES).map((country) => ({
    value: country.code,
    label: country.name,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

        <div className="space-y-4">
          <Input
            label="School Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Enter school name"
            required
          />

          <Textarea
            label="Admin Notes"
            {...register('admin_notes')}
            error={errors.admin_notes?.message}
            placeholder="Internal notes about this school (optional)"
            rows={3}
          />
        </div>
      </Card>

      {/* Contact Person */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Person</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name"
            {...register('contact_person.name')}
            error={errors.contact_person?.name?.message}
            placeholder="Contact person name"
            required
          />

          <Input
            label="Designation"
            {...register('contact_person.designation')}
            error={errors.contact_person?.designation?.message}
            placeholder="e.g., Principal, Admin"
          />

          <Input
            label="Email"
            type="email"
            {...register('contact_person.email')}
            error={errors.contact_person?.email?.message}
            placeholder="email@school.com"
            required
          />

          <Input
            label="Phone"
            {...register('contact_person.phone')}
            error={errors.contact_person?.phone?.message}
            placeholder="+1234567890"
            required
          />
        </div>
      </Card>

      {/* Address */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>

        <div className="space-y-4">
          <Input
            label="Street Address"
            {...register('address.street')}
            error={errors.address?.street?.message}
            placeholder="Street address"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="City"
              {...register('address.city')}
              error={errors.address?.city?.message}
              placeholder="City"
            />

            <Input
              label="State/Province"
              {...register('address.state')}
              error={errors.address?.state?.message}
              placeholder="State or Province"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Postal Code"
              {...register('address.postal_code')}
              error={errors.address?.postal_code?.message}
              placeholder="Postal code"
            />

            <Select
              label="Country"
              {...register('address.country')}
              error={errors.address?.country?.message}
              options={countryOptions}
              required
            />
          </div>
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update School' : 'Create School'}
        </Button>
      </div>
    </form>
  );
};

export default SchoolForm;
