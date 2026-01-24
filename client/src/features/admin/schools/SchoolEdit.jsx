import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSchoolDetails } from '../../../hooks/useAdmin';
import SchoolForm from './SchoolForm';
import AdminLayout from '../../../layouts/AdminLayout';
import { Spinner } from '../../../components/ui';

/**
 * Edit School Page
 * Wrapper that loads school data and passes to form
 */
const SchoolEdit = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useSchoolDetails(schoolId);
  const school = data?.school;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="large" />
        </div>
      </AdminLayout>
    );
  }

  if (!school) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">School Not Found</h2>
            <p className="text-gray-600">The school you're trying to edit doesn't exist.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit School</h1>
          <p className="text-gray-600 mt-1">
            Update school information for {school.name}
          </p>
        </div>

        {/* Form */}
        <SchoolForm
          initialData={school}
          mode="edit"
          onSuccess={() => {
            navigate(`/admin/schools/${schoolId}`);
          }}
        />
      </div>
    </AdminLayout>
  );
};

export default SchoolEdit;
