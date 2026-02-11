import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Save, TestTube, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import { Card, Button } from '../../../components/ui';
import { showSuccess, showError } from '../../../components/common/Toast';

const API_URL = import.meta.env.VITE_API_URL
  || 'http://localhost:5000/api/v1';

export default function ChatbotSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(null);
  const [newToken, setNewToken] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/chatbot/settings`,
        { headers: getHeaders() }
      );
      setSettings(data.data);
    } catch (err) {
      showError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...settings };
      if (newToken) {
        payload.huggingface_token = newToken;
      }
      await axios.post(
        `${API_URL}/chatbot/settings`,
        payload,
        { headers: getHeaders() }
      );
      showSuccess('Settings saved');
      setNewToken('');
      fetchSettings();
    } catch (err) {
      showError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestToken = async () => {
    setTesting(true);
    setTokenStatus(null);
    try {
      const { data } = await axios.post(
        `${API_URL}/chatbot/settings/test-token`,
        { token: newToken || undefined },
        { headers: getHeaders() }
      );
      setTokenStatus(data);
    } catch (err) {
      setTokenStatus({ valid: false, message: 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  const updateField = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const updateTheme = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value },
    }));
  };

  const updateFeature = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      features: { ...prev.features, [field]: value },
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </AdminLayout>
    );
  }

  if (!settings) {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-gray-500">
          Failed to load settings
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Chatbot Settings
          </h1>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />
            }
            Save Changes
          </Button>
        </div>

        {/* General */}
        <Card>
          <Card.Header>
            <Card.Title>General</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1">
                  Bot Name
                </label>
                <input
                  type="text"
                  value={settings.bot_name}
                  onChange={(e) => updateField(
                    'bot_name', e.target.value
                  )}
                  className="w-full border border-gray-300
                    rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2
                    focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1">
                  Welcome Message
                </label>
                <textarea
                  value={settings.welcome_message}
                  onChange={(e) => updateField(
                    'welcome_message', e.target.value
                  )}
                  rows={3}
                  className="w-full border border-gray-300
                    rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2
                    focus:ring-purple-500"
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Appearance */}
        <Card>
          <Card.Header>
            <Card.Title>Appearance</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ['primary_color', 'Primary Color'],
                ['bot_bubble_color', 'Bot Bubble'],
                ['user_bubble_color', 'User Bubble'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium
                    text-gray-700 mb-1">
                    {label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.theme[key]}
                      onChange={(e) => updateTheme(
                        key, e.target.value
                      )}
                      className="w-10 h-10 rounded border
                        border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.theme[key]}
                      onChange={(e) => updateTheme(
                        key, e.target.value
                      )}
                      className="flex-1 border border-gray-300
                        rounded-lg px-3 py-2 text-sm
                        focus:outline-none focus:ring-2
                        focus:ring-purple-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <Card.Header>
            <Card.Title>Features</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {[
                ['feedback_enabled', 'Enable Feedback'],
                ['suggestions_enabled', 'Enable Suggestions'],
                ['quick_replies_enabled', 'Enable Quick Replies'],
                ['export_enabled', 'Enable Export'],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={settings.features[key]}
                    onChange={(e) => updateFeature(
                      key, e.target.checked
                    )}
                    className="w-4 h-4 text-purple-600
                      border-gray-300 rounded
                      focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* API Configuration */}
        <Card>
          <Card.Header>
            <Card.Title>API Configuration</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1">
                  Current Token
                </label>
                <p className="text-sm text-gray-500 font-mono">
                  {settings.huggingface_token || 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1">
                  New HuggingFace Token
                </label>
                <input
                  type="password"
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  placeholder="hf_..."
                  className="w-full border border-gray-300
                    rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2
                    focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleTestToken}
                  disabled={testing}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {testing
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <TestTube className="w-4 h-4" />
                  }
                  Test Token
                </Button>
                {tokenStatus && (
                  <span className={`flex items-center gap-1
                    text-sm ${tokenStatus.valid
                      ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {tokenStatus.valid
                      ? <CheckCircle className="w-4 h-4" />
                      : <XCircle className="w-4 h-4" />
                    }
                    {tokenStatus.message}
                  </span>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
}
