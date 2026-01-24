import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { Card, Button, Spinner } from '../../../components/ui';
import { useBrandInfo, useUpdateBrandInfo } from '../../../hooks/useBrandInfo';
import { showError, showSuccess } from '../../../components/common/Toast';

/**
 * Brand Settings Page
 * Manage company/brand information displayed across the app
 */
const BrandSettings = () => {
  const { data: brand, isLoading } = useBrandInfo();
  const updateBrand = useUpdateBrandInfo();

  const [formData, setFormData] = useState({
    company_name: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    facebook: '',
    instagram: '',
    youtube: '',
    whatsapp: '',
    linkedin: '',
    twitter: '',
    logo_url: '',
    logo_white_url: '',
    favicon_url: '',
    support_email: '',
    support_phone: '',
    support_hours: '',
  });

  useEffect(() => {
    if (brand) {
      setFormData({
        company_name: brand.company_name || '',
        tagline: brand.tagline || '',
        address: brand.address || '',
        phone: brand.phone || '',
        email: brand.email || '',
        website: brand.website || '',
        facebook: brand.facebook || '',
        instagram: brand.instagram || '',
        youtube: brand.youtube || '',
        whatsapp: brand.whatsapp || '',
        linkedin: brand.linkedin || '',
        twitter: brand.twitter || '',
        logo_url: brand.logo_url || '',
        logo_white_url: brand.logo_white_url || '',
        favicon_url: brand.favicon_url || '',
        support_email: brand.support_email || '',
        support_phone: brand.support_phone || '',
        support_hours: brand.support_hours || '',
      });
    }
  }, [brand]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateBrand.mutateAsync(formData);
      showSuccess('Brand information updated successfully');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update brand information');
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Settings</h1>
          <p className="text-gray-600">Manage your company information and branding</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <Card>
            <Card.Header>
              <Card.Title>Company Information</Card.Title>
              <Card.Description>Basic company details displayed across the application</Card.Description>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Contact Information */}
          <Card>
            <Card.Header>
              <Card.Title>Contact Information</Card.Title>
              <Card.Description>Contact details for customers and support</Card.Description>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Link
                  </label>
                  <input
                    type="url"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="https://api.whatsapp.com/send?phone=..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Support Information */}
          <Card>
            <Card.Header>
              <Card.Title>Support Information</Card.Title>
              <Card.Description>Support contact details shown in help sections</Card.Description>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    name="support_email"
                    value={formData.support_email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Support Phone
                  </label>
                  <input
                    type="text"
                    name="support_phone"
                    value={formData.support_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Support Hours
                  </label>
                  <input
                    type="text"
                    name="support_hours"
                    value={formData.support_hours}
                    onChange={handleChange}
                    placeholder="Mon-Fri 9:00 AM - 6:00 PM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Social Media Links */}
          <Card>
            <Card.Header>
              <Card.Title>Social Media Links</Card.Title>
              <Card.Description>Social media profiles for your brand</Card.Description>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    placeholder="https://facebook.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    placeholder="https://instagram.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube
                  </label>
                  <input
                    type="url"
                    name="youtube"
                    value={formData.youtube}
                    onChange={handleChange}
                    placeholder="https://youtube.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/company/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter / X
                  </label>
                  <input
                    type="url"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    placeholder="https://twitter.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Logo Settings */}
          <Card>
            <Card.Header>
              <Card.Title>Logo & Branding</Card.Title>
              <Card.Description>Logo URLs for different contexts</Card.Description>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Main Logo URL
                  </label>
                  <input
                    type="text"
                    name="logo_url"
                    value={formData.logo_url}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  {formData.logo_url && (
                    <div className="mt-2 p-2 bg-gray-100 rounded">
                      <img src={formData.logo_url} alt="Logo Preview" className="h-12 w-auto" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    White Logo URL (for dark backgrounds)
                  </label>
                  <input
                    type="text"
                    name="logo_white_url"
                    value={formData.logo_white_url}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  {formData.logo_white_url && (
                    <div className="mt-2 p-2 bg-gray-800 rounded">
                      <img src={formData.logo_white_url} alt="White Logo Preview" className="h-12 w-auto" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Favicon URL
                  </label>
                  <input
                    type="text"
                    name="favicon_url"
                    value={formData.favicon_url}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={updateBrand.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default BrandSettings;
