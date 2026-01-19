import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  useSchoolDetails,
  useApproveSchool,
  useRejectSchool,
  useSuspendSchool,
  useActivateSchool,
  useSchoolRegistrations,
  useSchoolPayments,
} from '../../../hooks/useAdmin';
import { Card, Badge, Tabs, Spinner, Button, Modal } from '../../../components/ui';
import { formatDate, formatCurrency } from '../../../utils/helpers';
import { BADGE_CLASSES, APPROVAL_STATUS, SCHOOL_STATUS } from '../../../utils/constants';
import { showError, showSuccess } from '../../../components/common/Toast';

/**
 * School Details Page
 * Admin page showing detailed information about a school
 */
const SchoolDetails = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useSchoolDetails(schoolId);
  const school = data?.school;
  const statistics = data?.statistics;
  const recentBatches = data?.recent_batches;

  const [activeTab, setActiveTab] = useState('overview');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [regFilters, setRegFilters] = useState({ search: '', status: '' });
  const [payFilters, setPayFilters] = useState({ status: '', payment_mode: '' });

  const approveSchool = useApproveSchool();
  const rejectSchool = useRejectSchool();
  const suspendSchool = useSuspendSchool();
  const activateSchool = useActivateSchool();
  const { data: registrations, isLoading: loadingRegistrations } = useSchoolRegistrations(
    schoolId,
    regFilters
  );
  const { data: payments, isLoading: loadingPayments } = useSchoolPayments(schoolId, payFilters);

  const handleApprove = async () => {
    try {
      await approveSchool.mutateAsync({
        schoolId: school._id,
        notes: actionNotes,
      });
      showSuccess('School approved successfully!');
      setShowApproveModal(false);
      setActionNotes('');
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
        schoolId: school._id,
        reason: actionNotes,
      });
      showSuccess('School rejected');
      setShowRejectModal(false);
      setActionNotes('');
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
        schoolId: school._id,
        reason: actionNotes,
      });
      showSuccess('School suspended');
      setShowSuspendModal(false);
      setActionNotes('');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to suspend school');
    }
  };

  const handleActivate = async () => {
    try {
      await activateSchool.mutateAsync(school._id);
      showSuccess('School activated successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to activate school');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="xl" />
        </div>
      </AdminLayout>
    );
  }

  if (!school) {
    return (
      <AdminLayout>
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">School Not Found</h2>
            <p className="text-gray-600 mb-6">The school you're looking for doesn't exist.</p>
            <Button variant="primary" onClick={() => navigate('/admin/schools')}>
              Back to Schools
            </Button>
          </div>
        </Card>
      </AdminLayout>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'registrations',
      label: 'Registrations',
      count: statistics?.total_registrations || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'payments',
      label: 'Payments',
      count: statistics?.total_payments || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/schools')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{school.name}</h1>
              <p className="text-gray-600 mt-1">School Code: {school.school_code}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={BADGE_CLASSES[school.approval_status]?.variant || 'warning'} size="lg">
              {school.approval_status}
            </Badge>
            <Badge variant={BADGE_CLASSES[school.status]?.variant || 'info'} size="lg">
              {school.status}
            </Badge>
          </div>
        </div>

        {/* Actions Bar */}
        {school.approval_status === APPROVAL_STATUS.PENDING && (
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Pending Approval</p>
                  <p className="text-sm text-gray-600">This school is awaiting your approval decision</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="danger" onClick={() => setShowRejectModal(true)}>
                  Reject
                </Button>
                <Button variant="primary" onClick={() => setShowApproveModal(true)}>
                  Approve School
                </Button>
              </div>
            </div>
          </Card>
        )}

        {school.approval_status === APPROVAL_STATUS.APPROVED && school.status === SCHOOL_STATUS.ACTIVE && (
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Active School</p>
                  <p className="text-sm text-gray-600">This school is approved and active</p>
                </div>
              </div>
              <Button variant="danger" onClick={() => setShowSuspendModal(true)}>
                Suspend School
              </Button>
            </div>
          </Card>
        )}

        {school.status === SCHOOL_STATUS.SUSPENDED && (
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Suspended School</p>
                  <p className="text-sm text-gray-600">
                    {school.suspension_reason || 'This school has been suspended'}
                  </p>
                </div>
              </div>
              <Button variant="primary" onClick={handleActivate} loading={activateSchool.isPending}>
                Reactivate School
              </Button>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
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
                      <p className="text-lg font-medium text-gray-900">{school.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Registration Date</p>
                      <p className="text-lg font-medium text-gray-900">{formatDate(school.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email Verified</p>
                      <Badge variant={school.email_verified ? 'success' : 'warning'}>
                        {school.email_verified ? 'Verified' : 'Not Verified'}
                      </Badge>
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
                      <p className="text-lg font-medium text-gray-900">{school.contact_person_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="text-lg font-medium text-gray-900">{school.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone</p>
                      <p className="text-lg font-medium text-gray-900">{school.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Website</p>
                      {school.website ? (
                        <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-lg font-medium text-purple-600 hover:text-purple-700">
                          Visit Website
                        </a>
                      ) : (
                        <p className="text-lg font-medium text-gray-900">N/A</p>
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
                      <p className="text-lg font-medium text-gray-900">{school?.address?.street || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">City</p>
                      <p className="text-lg font-medium text-gray-900">{school?.address?.city || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">State/Province</p>
                      <p className="text-lg font-medium text-gray-900">{school?.address?.state || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Postal Code</p>
                      <p className="text-lg font-medium text-gray-900">{school?.address?.postal_code || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Country</p>
                      <p className="text-lg font-medium text-gray-900">{school?.address?.country || 'N/A'}</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Statistics */}
              <Card>
                <Card.Header>
                  <Card.Title>Statistics</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{statistics?.total_registrations || 0}</p>
                      <p className="text-sm text-gray-600">Total Registrations</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{statistics?.total_batches || 0}</p>
                      <p className="text-sm text-gray-600">Total Batches</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{statistics?.total_payments || 0}</p>
                      <p className="text-sm text-gray-600">Total Payments</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(statistics?.total_revenue || 0, school?.currency_pref)}
                      </p>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Admin Actions */}
              <Card>
                <Card.Header>
                  <Card.Title>Admin Actions</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    <Link to={`/admin/schools/${schoolId}/registrations`}>
                      <Button variant="outline" fullWidth>
                        View Registrations
                      </Button>
                    </Link>
                    <Link to={`/admin/schools/${schoolId}/payments`}>
                      <Button variant="outline" fullWidth>
                        View Payments
                      </Button>
                    </Link>
                    <Link to={`/admin/schools/${schoolId}/edit`}>
                      <Button variant="outline" fullWidth>
                        Edit School
                      </Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'registrations' && (
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">School Registrations</h3>
                <div className="text-sm text-gray-600">
                  Total: {registrations?.batches?.length || 0} batch
                  {registrations?.batches?.length !== 1 ? 'es' : ''}
                </div>
              </div>

              {/* Filters */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by event name..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={regFilters.search}
                    onChange={(e) => setRegFilters({ ...regFilters, search: e.target.value })}
                  />
                </div>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={regFilters.status}
                  onChange={(e) => setRegFilters({ ...regFilters, status: e.target.value })}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="verified">Verified</option>
                </select>
              </div>
            </Card.Header>

            <Card.Body>
              {loadingRegistrations ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : !registrations?.batches || registrations.batches.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No registrations found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    This school hasn't registered for any events yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Batch Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Students
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {registrations.batches.map((batch) => (
                        <tr key={batch._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {batch.event?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono font-medium text-purple-600">
                              {batch.batch_reference}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {batch.students?.length || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-green-600">
                              {formatCurrency(batch.total_amount, batch.currency)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                batch.payment_status === 'verified'
                                  ? 'success'
                                  : batch.payment_status === 'paid'
                                  ? 'info'
                                  : 'warning'
                              }
                            >
                              {batch.payment_status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{formatDate(batch.created_at)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/school/batches/${batch.batch_reference}`}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'payments' && (
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                <div className="text-sm text-gray-600">
                  Total: {payments?.payments?.length || 0} payment
                  {payments?.payments?.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Filters */}
              <div className="mt-4 flex items-center gap-4">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={payFilters.status}
                  onChange={(e) => setPayFilters({ ...payFilters, status: e.target.value })}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="verified">Verified</option>
                  <option value="failed">Failed</option>
                </select>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={payFilters.payment_mode}
                  onChange={(e) => setPayFilters({ ...payFilters, payment_mode: e.target.value })}
                >
                  <option value="">All Modes</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="stripe">Stripe</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </Card.Header>

            <Card.Body>
              {loadingPayments ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : !payments?.payments || payments.payments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No payments found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    This school hasn't made any payments yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Batch Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Mode
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.payments.map((payment) => (
                        <tr key={payment._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono font-medium text-gray-900">
                              {payment.payment_id || payment._id}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.batch?.event?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-purple-600">
                              {payment.batch?.batch_reference || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-green-600">
                              {formatCurrency(payment.amount, payment.currency)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="secondary">{payment.payment_mode}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                payment.status === 'verified'
                                  ? 'success'
                                  : payment.status === 'paid'
                                  ? 'info'
                                  : payment.status === 'failed'
                                  ? 'danger'
                                  : 'warning'
                              }
                            >
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{formatDate(payment.created_at)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/admin/payments/${payment._id}`}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {formatCurrency(
                          payments?.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
                          'INR'
                        )}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">
                        {registrations?.batches?.length || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Events Participated</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {new Set(registrations?.batches?.map((b) => b.event?._id).filter(Boolean))
                          .size || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">
                        {registrations?.batches?.reduce(
                          (sum, b) => sum + (b.students?.length || 0),
                          0
                        ) || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* Top Events Table */}
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900">Top Events by Registrations</h3>
              </Card.Header>
              <Card.Body>
                {!registrations?.batches || registrations.batches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No registration data available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Event Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Batches
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Students
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Spent
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.values(
                          registrations.batches.reduce((acc, batch) => {
                            const eventId = batch.event?._id;
                            if (!eventId) return acc;
                            if (!acc[eventId]) {
                              acc[eventId] = {
                                name: batch.event?.name || 'Unknown',
                                batches: 0,
                                students: 0,
                                spent: 0,
                              };
                            }
                            acc[eventId].batches += 1;
                            acc[eventId].students += batch.students?.length || 0;
                            acc[eventId].spent += batch.total_amount || 0;
                            return acc;
                          }, {})
                        )
                          .sort((a, b) => b.batches - a.batches)
                          .map((event, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-medium text-gray-900">{event.name}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-semibold text-purple-600">
                                  {event.batches}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-semibold text-gray-900">
                                  {event.students}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-semibold text-green-600">
                                  {formatCurrency(event.spent, 'INR')}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Modals (same as SchoolsList) */}
        <Modal
          isOpen={showApproveModal}
          onClose={() => {
            setShowApproveModal(false);
            setActionNotes('');
          }}
          title="Approve School"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                You are about to approve <strong>{school.name}</strong>. This will allow them to register students for events.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={3}
                className="input"
                placeholder="Add any notes about this approval..."
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowApproveModal(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={handleApprove} loading={approveSchool.isPending} className="flex-1">Approve School</Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setActionNotes('');
          }}
          title="Reject School"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">
                You are about to reject <strong>{school.name}</strong>. They will be notified and will not be able to access the system.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Rejection <span className="text-red-600">*</span></label>
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
              <Button variant="outline" onClick={() => setShowRejectModal(false)} className="flex-1">Cancel</Button>
              <Button variant="danger" onClick={handleReject} loading={rejectSchool.isPending} className="flex-1">Reject School</Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showSuspendModal}
          onClose={() => {
            setShowSuspendModal(false);
            setActionNotes('');
          }}
          title="Suspend School"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-900">
                You are about to suspend <strong>{school.name}</strong>. They will not be able to make new registrations until reactivated.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Suspension <span className="text-red-600">*</span></label>
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
              <Button variant="outline" onClick={() => setShowSuspendModal(false)} className="flex-1">Cancel</Button>
              <Button variant="danger" onClick={handleSuspend} loading={suspendSchool.isPending} className="flex-1">Suspend School</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default SchoolDetails;
