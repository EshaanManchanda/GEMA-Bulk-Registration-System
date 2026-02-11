const axios = require('axios');
const asyncHandler = require('../../middleware/async.middleware');

// In-memory settings storage (replace with database model in production)
let settings = {
  bot_name: 'GEMA Bot',
  welcome_message: 'Hi! I can help you with certificates, event details, and registration. How can I assist you today?',
  theme: {
    primary_color: '#2563eb',
    bot_bubble_color: '#f3f4f6',
    user_bubble_color: '#2563eb'
  },
  features: {
    feedback_enabled: true,
    suggestions_enabled: true,
    quick_replies_enabled: true,
    export_enabled: true
  },
  huggingface_token: process.env.HF_TOKEN || ''
};

/**
 * Get chatbot settings
 * @route   GET /api/v1/chatbot/settings
 * @access  Private (Admin)
 */
exports.getSettings = asyncHandler(async (req, res) => {
  // Mask sensitive token
  const safeSettings = {
    ...settings,
    huggingface_token: settings.huggingface_token
      ? `${settings.huggingface_token.substring(0, 4)}...${settings.huggingface_token.substring(settings.huggingface_token.length - 4)}`
      : ''
  };

  res.json({
    success: true,
    data: safeSettings
  });
});

/**
 * Update chatbot settings
 * @route   POST /api/v1/chatbot/settings
 * @access  Private (Admin)
 */
exports.updateSettings = asyncHandler(async (req, res) => {
  const updates = req.body;

  // Deep merge settings
  settings = {
    ...settings,
    ...updates,
    theme: { ...settings.theme, ...updates.theme },
    features: { ...settings.features, ...updates.features },
    // Only update token if provided and not empty/masked
    huggingface_token: (updates.huggingface_token && !updates.huggingface_token.includes('...'))
      ? updates.huggingface_token
      : settings.huggingface_token
  };

  res.json({
    success: true,
    data: settings,
    message: 'Settings updated successfully'
  });
});

/**
 * Test Hugging Face token
 * @route   POST /api/v1/chatbot/settings/test-token
 * @access  Private (Admin)
 */
exports.testHuggingFaceToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const tokenToTest = token || settings.huggingface_token;

  if (!tokenToTest) {
    return res.status(400).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    // Test with a lightweight API call
    const response = await axios.get('https://huggingface.co/api/whoami-v2', {
      headers: {
        Authorization: `Bearer ${tokenToTest}`
      }
    });

    res.json({
      success: true,
      valid: true,
      username: response.data.name,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('HF Token Check Error:', error.message);
    res.status(400).json({
      success: false,
      valid: false,
      message: 'Invalid Hugging Face token'
    });
  }
});
