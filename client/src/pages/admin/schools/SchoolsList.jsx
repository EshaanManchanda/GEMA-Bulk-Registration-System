import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { useSchools, useApproveSchool, useRejectSchool, useSuspendSchool, useActivateSchool, useCreateSchool } from '../../../hooks/useAdmin';
import { Card, Badge, Input, Select, Table, Pagination, Spinner, EmptyState, Button, Modal } from '../../../components/ui';
import { formatDate } from '../../../utils/helpers';
import { BADGE_CLASSES, APPROVAL_STATUS, SCHOOL_STATUS } from '../../../utils/constants';
import { showError, showSuccess } from '../../../components/common/Toast';

/**
 * Schools List Page
 * Admin page for managing schools
 */
const SchoolsList = () => {
  const [filters, setFilters] = useState({
    search: '',
    approval_status: '',
    status: '',
    country: '',
    page: 1,
    limit: 10,
  });

  const [selectedSchool, setSelectedSchool] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    currency_pref: 'INR',
    contact_person: {
      name: '',
      designation: '',
      email: '',
      phone: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    password: '',
    external_docs_link: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const { data, isLoading } = useSchools(filters);
  const approveSchool = useApproveSchool();
  const rejectSchool = useRejectSchool();
  const suspendSchool = useSuspendSchool();
  const activateSchool = useActivateSchool();
  const createSchool = useCreateSchool();

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleApprovalStatusChange = (e) => {
    setFilters({ ...filters, approval_status: e.target.value, page: 1 });
  };

  const handleStatusChange = (e) => {
    setFilters({ ...filters, status: e.target.value, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const handleApprove = async () => {
    try {
      await approveSchool.mutateAsync({
        schoolId: selectedSchool._id,
        notes: actionNotes,
      });
      showSuccess('School approved successfully!');
      setShowApproveModal(false);
      setActionNotes('');
      setSelectedSchool(null);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to approve school');
    }
  };

  const handleReject = async () => {
    if (!actionNotes.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }
    try {
      await rejectSchool.mutateAsync({
        schoolId: selectedSchool._id,
        reason: actionNotes,
      });
      showSuccess('School rejected');
      setShowRejectModal(false);
      setActionNotes('');
      setSelectedSchool(null);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to reject school');
    }
  };

  const handleSuspend = async () => {
    if (!actionNotes.trim()) {
      showError('Please provide a reason for suspension');
      return;
    }
    try {
      await suspendSchool.mutateAsync({
        schoolId: selectedSchool._id,
        reason: actionNotes,
      });
      showSuccess('School suspended');
      setShowSuspendModal(false);
      setActionNotes('');
      setSelectedSchool(null);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to suspend school');
    }
  };

  const handleActivate = async (school) => {
    try {
      await activateSchool.mutateAsync(school._id);
      showSuccess('School activated successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to activate school');
    }
  };

  const handleFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name?.trim()) errors.name = 'School name required';
    if (!formData.country?.trim()) errors.country = 'Country required';
    if (!formData.currency_pref) errors.currency_pref = 'Currency required';
    if (!formData.contact_person.name?.trim()) errors['contact_person.name'] = 'Contact name required';
    if (!formData.contact_person.email?.trim()) errors['contact_person.email'] = 'Email required';
    if (!formData.contact_person.phone?.trim()) errors['contact_person.phone'] = 'Phone required';
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (formData.contact_person.email && !emailRegex.test(formData.contact_person.email)) {
      errors['contact_person.email'] = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSchool = async () => {
    if (!validateForm()) return;

    try {
      await createSchool.mutateAsync(formData);
      showSuccess('School created successfully!');
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create school');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      country: '',
      currency_pref: 'INR',
      contact_person: { name: '', designation: '', email: '', phone: '' },
      address: { street: '', city: '', state: '', postal_code: '', country: '' },
      password: '',
      external_docs_link: ''
    });
    setFormErrors({});
  };

  const approvalStatusOptions = [
    { value: '', label: 'All Approval Status' },
    { value: APPROVAL_STATUS.PENDING, label: 'Pending' },
    { value: APPROVAL_STATUS.APPROVED, label: 'Approved' },
    { value: APPROVAL_STATUS.REJECTED, label: 'Rejected' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: SCHOOL_STATUS.ACTIVE, label: 'Active' },
    { value: SCHOOL_STATUS.SUSPENDED, label: 'Suspended' },
    { value: SCHOOL_STATUS.INACTIVE, label: 'Inactive' },
  ];

  const tableColumns = [
    {
      key: 'school_code',
      label: 'School Code',
      sortable: true,
      render: (value, row) => (
        <Link
          to={`/admin/schools/${row._id}`}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          {value}
        </Link>
      ),
    },
    {
      key: 'name',
      label: 'School Name',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => (
        <span className="text-sm text-gray-600">{value}</span>
      ),
    },
    {
      key: 'country',
      label: 'Country',
      render: (value) => (
        <span className="text-sm text-gray-900">{value}</span>
      ),
    },
    {
      key: 'approval_status',
      label: 'Approval',
      render: (value) => {
        const badgeClass = BADGE_CLASSES[value];
        return (
          <Badge variant={badgeClass?.variant || 'warning'}>
            {value}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const badgeClass = BADGE_CLASSES[value];
        return (
          <Badge variant={badgeClass?.variant || 'info'}>
            {value}
          </Badge>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Registered',
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Link to={`/admin/schools/${row._id}`}>
            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              View
            </button>
          </Link>
          {row.approval_status === APPROVAL_STATUS.PENDING && (
            <>
              <button
                onClick={() => {
                  setSelectedSchool(row);
                  setShowApproveModal(true);
                }}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setSelectedSchool(row);
                  setShowRejectModal(true);
                }}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Reject
              </button>
            </>
          )}
          {row.approval_status === APPROVAL_STATUS.APPROVED && row.status === SCHOOL_STATUS.ACTIVE && (
            <button
              onClick={() => {
                setSelectedSchool(row);
                setShowSuspendModal(true);
              }}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              Suspend
            </button>
          )}
          {row.status === SCHOOL_STATUS.SUSPENDED && (
            <button
              onClick={() => handleActivate(row)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Activate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schools Management</h1>
            <p className="text-gray-600 mt-1">Manage school registrations and approvals</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add School
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {data?.summary?.total || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Schools</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {data?.summary?.pending || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Pending Approval</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {data?.summary?.approved || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Approved</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {data?.summary?.suspended || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Suspended</p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by school name, code, or email..."
              value={filters.search}
              onChange={handleSearchChange}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />

            <Select
              value={filters.approval_status}
              onChange={handleApprovalStatusChange}
              options={approvalStatusOptions}
              placeholder="Filter by Approval Status"
            />

            <Select
              value={filters.status}
              onChange={handleStatusChange}
              options={statusOptions}
              placeholder="Filter by Status"
            />
          </div>
        </Card>

        {/* Schools Table */}
        <Card>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : data?.schools?.length > 0 ? (
            <>
              <Table
                columns={tableColumns}
                data={data.schools}
              />

              {/* Pagination */}
              {data.pagination && data.pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination
                    currentPage={data.pagination.currentPage}
                    totalPages={data.pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              message="No schools found"
              description="No schools match your current filters. Try adjusting your search criteria."
            />
          )}
        </Card>

        {/* Approve Modal */}
        <Modal
          isOpen={showApproveModal}
          onClose={() => {
            setShowApproveModal(false);
            setActionNotes('');
            setSelectedSchool(null);
          }}
          title="Approve School"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                You are about to approve <strong>{selectedSchool?.name}</strong>. This will allow them to register students for events.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={3}
                className="input"
                placeholder="Add any notes about this approval..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApproveModal(false);
                  setActionNotes('');
                  setSelectedSchool(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleApprove}
                loading={approveSchool.isPending}
                disabled={approveSchool.isPending}
                className="flex-1"
              >
                Approve School
              </Button>
            </div>
          </div>
        </Modal>

        {/* Reject Modal */}
        <Modal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setActionNotes('');
            setSelectedSchool(null);
          }}
          title="Reject School"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">
                You are about to reject <strong>{selectedSchool?.name}</strong>. They will be notified and will not be able to access the system.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection <span className="text-red-600">*</span>
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={3}
                className="input"
                placeholder="Explain why this school is being rejected..."
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setActionNotes('');
                  setSelectedSchool(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                loading={rejectSchool.isPending}
                disabled={rejectSchool.isPending}
                className="flex-1"
              >
                Reject School
              </Button>
            </div>
          </div>
        </Modal>

        {/* Suspend Modal */}
        <Modal
          isOpen={showSuspendModal}
          onClose={() => {
            setShowSuspendModal(false);
            setActionNotes('');
            setSelectedSchool(null);
          }}
          title="Suspend School"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-900">
                You are about to suspend <strong>{selectedSchool?.name}</strong>. They will not be able to make new registrations until reactivated.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Suspension <span className="text-red-600">*</span>
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={3}
                className="input"
                placeholder="Explain why this school is being suspended..."
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuspendModal(false);
                  setActionNotes('');
                  setSelectedSchool(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleSuspend}
                loading={suspendSchool.isPending}
                disabled={suspendSchool.isPending}
                className="flex-1"
              >
                Suspend School
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create School Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Create New School"
          size="2xl"
        >
          <div className="space-y-6">
            {/* School Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">School Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Name <span className="text-red-600">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Enter school name"
                    error={formErrors.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country <span className="text-red-600">*</span>
                  </label>
                  <Input
                    value={formData.country}
                    onChange={(e) => handleFormChange('country', e.target.value)}
                    placeholder="Enter country"
                    error={formErrors.country}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Preference <span className="text-red-600">*</span>
                </label>
                <Select
                  value={formData.currency_pref}
                  onChange={(e) => handleFormChange('currency_pref', e.target.value)}
                  options={[
                    { value: 'INR', label: 'INR (₹)' },
                    { value: 'USD', label: 'USD ($)' }
                  ]}
                  error={formErrors.currency_pref}
                />
              </div>
            </div>

            {/* Contact Person */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">Contact Person</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <Input
                    value={formData.contact_person.name}
                    onChange={(e) => handleFormChange('contact_person.name', e.target.value)}
                    placeholder="Contact person name"
                    error={formErrors['contact_person.name']}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation
                  </label>
                  <Input
                    value={formData.contact_person.designation}
                    onChange={(e) => handleFormChange('contact_person.designation', e.target.value)}
                    placeholder="e.g., Principal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.contact_person.email}
                    onChange={(e) => handleFormChange('contact_person.email', e.target.value)}
                    placeholder="email@school.com"
                    error={formErrors['contact_person.email']}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-600">*</span>
                  </label>
                  <Input
                    value={formData.contact_person.phone}
                    onChange={(e) => handleFormChange('contact_person.phone', e.target.value)}
                    placeholder="Phone number"
                    error={formErrors['contact_person.phone']}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">Address (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input
                    value={formData.address.street}
                    onChange={(e) => handleFormChange('address.street', e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                <Input
                  value={formData.address.city}
                  onChange={(e) => handleFormChange('address.city', e.target.value)}
                  placeholder="City"
                />
                <Input
                  value={formData.address.state}
                  onChange={(e) => handleFormChange('address.state', e.target.value)}
                  placeholder="State"
                />
                <Input
                  value={formData.address.postal_code}
                  onChange={(e) => handleFormChange('address.postal_code', e.target.value)}
                  placeholder="Postal code"
                />
                <Input
                  value={formData.address.country}
                  onChange={(e) => handleFormChange('address.country', e.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>

            {/* Security */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">Login Credentials</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Password <span className="text-red-600">*</span>
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFormChange('password', e.target.value)}
                  placeholder="Min 8 characters"
                  error={formErrors.password}
                />
                <p className="text-xs text-gray-500 mt-1">School can change password after first login</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateSchool}
                loading={createSchool.isPending}
                disabled={createSchool.isPending}
                className="flex-1"
              >
                Create School
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default SchoolsList;
