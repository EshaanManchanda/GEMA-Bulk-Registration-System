import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { Card, Tabs, Button, Spinner, Modal, Badge } from '../../../components/ui';
import {
  useSettings,
  useUpdateSettings,
  useAdminUsers,
  useCreateAdminUser,
  useDeleteAdminUser,
  useExportSchools,
  useExportEvents,
  useExportRegistrations,
  useExportPayments,
  useExportAllData,
  useCreateBackup,
  useBackupStatus
} from '../../../hooks/useSettings';
import { formatDate } from '../../../utils/helpers';
import { showError, showSuccess } from '../../../components/common/Toast';

/**
 * Admin Settings Page
 * Manage system settings, admin users, and configurations
 */
const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newAdminData, setNewAdminData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
  });
  const [settingsData, setSettingsData] = useState({
    system_name: '',
    default_currency: 'INR',
    maintenance_mode: false,
    registration_open: true,
  });

  const { data: settings, isLoading: loadingSettings } = useSettings();
  const { data: admins, isLoading: loadingAdmins } = useAdminUsers();
  const createAdmin = useCreateAdminUser();
  const deleteAdmin = useDeleteAdminUser();
  const updateSettings = useUpdateSettings();

  // Export and backup hooks
  const exportSchools = useExportSchools();
  const exportEvents = useExportEvents();
  const exportRegistrations = useExportRegistrations();
  const exportPayments = useExportPayments();
  const exportAllData = useExportAllData();
  const createBackup = useCreateBackup();
  const { data: backupStatus } = useBackupStatus();

  // Update settingsData when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setSettingsData({
        system_name: settings.system_name || 'GEMA Events',
        default_currency: settings.default_currency || 'INR',
        maintenance_mode: settings.maintenance_mode || false,
        registration_open: settings.registration_open || true,
      });
    }
  }, [settings]);

  const tabs = [
    { id: 'general', label: 'General Settings' },
    { id: 'brand', label: 'Brand & Contact' },
    { id: 'payment', label: 'Payment Settings' },
    { id: 'admins', label: 'Admin Users' },
    { id: 'email', label: 'Email Templates' },
    { id: 'export', label: 'Export & Backup' },
  ];

  const handleCreateAdmin = async () => {
    if (!newAdminData.name || !newAdminData.email || !newAdminData.password) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      await createAdmin.mutateAsync(newAdminData);
      showSuccess('Admin user created successfully!');
      setShowAddAdminModal(false);
      setNewAdminData({ name: '', email: '', password: '', role: 'admin' });
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create admin user');
    }
  };

  const handleDeleteAdmin = async () => {
    try {
      await deleteAdmin.mutateAsync(selectedAdmin._id);
      showSuccess('Admin user deleted successfully!');
      setShowDeleteModal(false);
      setSelectedAdmin(null);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete admin user');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync(settingsData);
      showSuccess('Settings updated successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update settings');
    }
  };

  // Helper function to download blob as file
  const downloadFile = (response, defaultFilename) => {
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Try to get filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = defaultFilename;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // Export handlers
  const handleExportSchools = async () => {
    try {
      const response = await exportSchools.mutateAsync();
      downloadFile(response, 'schools.csv');
      showSuccess('Schools data exported successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to export schools data');
    }
  };

  const handleExportEvents = async () => {
    try {
      const response = await exportEvents.mutateAsync();
      downloadFile(response, 'events.csv');
      showSuccess('Events data exported successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to export events data');
    }
  };

  const handleExportRegistrations = async () => {
    try {
      const response = await exportRegistrations.mutateAsync();
      downloadFile(response, 'registrations.csv');
      showSuccess('Registrations data exported successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to export registrations data');
    }
  };

  const handleExportPayments = async () => {
    try {
      const response = await exportPayments.mutateAsync();
      downloadFile(response, 'payments.csv');
      showSuccess('Payments data exported successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to export payments data');
    }
  };

  const handleExportAllData = async () => {
    try {
      const response = await exportAllData.mutateAsync();
      downloadFile(response, 'export_all.zip');
      showSuccess('All data exported successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to export all data');
    }
  };

  const handleCreateBackup = async () => {
    try {
      await createBackup.mutateAsync();
      showSuccess('Database backup created successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create backup';
      showError(errorMessage);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage system configuration and preferences</p>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
            </Card.Header>
            <Card.Body>
              {loadingSettings ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      System Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={settingsData.system_name}
                      onChange={(e) => setSettingsData({ ...settingsData, system_name: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">The name displayed throughout the system</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Currency
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={settingsData.default_currency}
                      onChange={(e) => setSettingsData({ ...settingsData, default_currency: e.target.value })}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="maintenance"
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      checked={settingsData.maintenance_mode}
                      onChange={(e) => setSettingsData({ ...settingsData, maintenance_mode: e.target.checked })}
                    />
                    <label htmlFor="maintenance" className="text-sm font-medium text-gray-700">
                      Maintenance Mode
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="registration"
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      checked={settingsData.registration_open}
                      onChange={(e) => setSettingsData({ ...settingsData, registration_open: e.target.checked })}
                    />
                    <label htmlFor="registration" className="text-sm font-medium text-gray-700">
                      Registration Open
                    </label>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      variant="primary"
                      onClick={handleSaveSettings}
                      isLoading={updateSettings.isPending}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Brand & Contact Tab */}
        {activeTab === 'brand' && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">Brand & Contact Information</h3>
            </Card.Header>
            <Card.Body>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Brand Settings</h4>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Manage your company information, contact details, social media links, and branding that appears throughout the application.
                </p>
                <Link to="/admin/settings/brand">
                  <Button variant="primary">
                    Manage Brand Settings
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Payment Settings Tab */}
        {activeTab === 'payment' && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">Payment Gateway Settings</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-6">
                {/* Razorpay */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Razorpay</h4>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key ID
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        value="rzp_test_••••••••••••••••"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Secret
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        value="••••••••••••••••••••••••"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {/* Stripe */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Stripe</h4>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Publishable Key
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        value="pk_test_••••••••••••••••"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secret Key
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        value="sk_test_••••••••••••••••"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {/* Offline Payment */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Offline Payment</h4>
                      <p className="text-sm text-gray-600">Allow schools to upload payment receipts</p>
                    </div>
                    <Badge variant="success">Enabled</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button variant="primary" disabled>
                    Update Payment Settings
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Payment configuration is managed via environment variables
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Admin Users Tab */}
        {activeTab === 'admins' && (
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Admin Users</h3>
                <Button variant="primary" onClick={() => setShowAddAdminModal(true)}>
                  Add Admin
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {loadingAdmins ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : !admins || admins.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No admin users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {admins.map((admin) => (
                        <tr key={admin._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{admin.name}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{admin.email}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="info">{admin.role}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={admin.status === 'active' ? 'success' : 'danger'}>
                              {admin.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {formatDate(admin.created_at)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedAdmin(admin);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
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

        {/* Email Templates Tab */}
        {activeTab === 'email' && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">Email Templates & SMTP Settings</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-6">
                {/* SMTP Configuration */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">SMTP Configuration</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure email server settings for sending notifications
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          placeholder="smtp.gmail.com"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Port
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          placeholder="587"
                          disabled
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTP User (Email)
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        placeholder="your-email@gmail.com"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTP Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        placeholder="••••••••••••••••"
                        disabled
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> SMTP settings are configured via environment variables (.env file).
                        Update SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your .env file.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Templates Status */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Email Templates</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Pre-configured email templates for system notifications
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Registration Confirmation</span>
                        <Badge variant="warning">Not Integrated</Badge>
                      </div>
                      <span className="text-xs text-gray-500">Sent after payment confirmation</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Email Verification</span>
                        <Badge variant="warning">Not Integrated</Badge>
                      </div>
                      <span className="text-xs text-gray-500">Sent after school registration</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Password Reset</span>
                        <Badge variant="warning">Not Integrated</Badge>
                      </div>
                      <span className="text-xs text-gray-500">Sent when password reset requested</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Payment Verification</span>
                        <Badge variant="warning">Not Integrated</Badge>
                      </div>
                      <span className="text-xs text-gray-500">Sent when offline payment verified</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Payment Rejection</span>
                        <Badge variant="warning">Not Integrated</Badge>
                      </div>
                      <span className="text-xs text-gray-500">Sent when offline payment rejected</span>
                    </div>
                  </div>
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Status:</strong> Email templates are configured in code but not yet integrated with notification triggers.
                      See server/src/services/email.service.js for implementation.
                    </p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Export & Backup Tab */}
        {activeTab === 'export' && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">Export & Backup</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-6">
                {/* Data Export */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Data Export</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Export system data to Excel or CSV format for analysis and reporting
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Schools Data</span>
                        <Badge variant="info">CSV/Excel</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        All schools with contact details, status, and registration dates
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportSchools}
                        isLoading={exportSchools.isPending}
                        className="w-full"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Schools
                      </Button>
                    </div>

                    <div className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Events Data</span>
                        <Badge variant="info">CSV/Excel</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        All events with pricing, dates, and registration counts
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportEvents}
                        isLoading={exportEvents.isPending}
                        className="w-full"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Events
                      </Button>
                    </div>

                    <div className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Registrations Data</span>
                        <Badge variant="info">CSV/Excel</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        All student registrations with event and school details
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportRegistrations}
                        isLoading={exportRegistrations.isPending}
                        className="w-full"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Registrations
                      </Button>
                    </div>

                    <div className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Payments Data</span>
                        <Badge variant="info">CSV/Excel</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        All payments with transaction details and status
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPayments}
                        isLoading={exportPayments.isPending}
                        className="w-full"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Payments
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Complete Export */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Complete Data Export</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Download all system data in a single archive (includes all schools, events, registrations, and payments)
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleExportAllData}
                    isLoading={exportAllData.isPending}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export All Data (ZIP)
                  </Button>
                </div>

                {/* Database Backup */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Database Backup</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Create a complete MongoDB database backup for disaster recovery
                  </p>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      onClick={handleCreateBackup}
                      isLoading={createBackup.isPending}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Create Backup Now
                    </Button>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-600">
                        <strong>Backup Location:</strong> {backupStatus?.location || '/backups/mongodb/{date}.gz'}<br />
                        <strong>Last Backup:</strong> {backupStatus?.exists ? formatDate(backupStatus.created_at) : 'Not available'}<br />
                        <strong>Backup Size:</strong> {backupStatus?.size || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>


              </div>
            </Card.Body>
          </Card>
        )}

        {/* Add Admin Modal */}
        <Modal
          isOpen={showAddAdminModal}
          onClose={() => {
            setShowAddAdminModal(false);
            setNewAdminData({ name: '', email: '', password: '', role: 'admin' });
          }}
          title="Add Admin User"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter admin name"
                value={newAdminData.name}
                onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="admin@example.com"
                value={newAdminData.email}
                onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter secure password"
                value={newAdminData.password}
                onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newAdminData.role}
                onChange={(e) => setNewAdminData({ ...newAdminData, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddAdminModal(false);
                  setNewAdminData({ name: '', email: '', password: '', role: 'admin' });
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateAdmin}
                isLoading={createAdmin.isPending}
              >
                Create Admin
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Admin Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedAdmin(null);
          }}
          title="Delete Admin User"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">
                Are you sure you want to delete <strong>{selectedAdmin?.name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAdmin(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAdmin}
                isLoading={deleteAdmin.isPending}
              >
                Delete Admin
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Settings;
