const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const chatController = require('../controllers/chatbot/chat.controller');
const analyticsController = require('../controllers/chatbot/chatAnalytics.controller');
const settingsController = require('../controllers/chatbot/settings.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');

const { requireAdmin } = require('../middleware/role.middleware');
const { verifyChatbotApiKey } = require('../middleware/chatbotAuth.middleware');

const chatMessageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    message: 'Too many messages. Please wait a moment.',
    suggestions: ['Try again in a minute']
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes (with optional auth, now with chatbot API key auth)
router.post('/message', chatMessageLimiter, verifyChatbotApiKey, optionalAuth, chatController.sendMessage);
router.get('/event-data', verifyChatbotApiKey, chatController.getEventData);
router.post('/detect-intent', verifyChatbotApiKey, optionalAuth, chatController.detectIntentTest);
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'chatbot' }));

// Authenticated routes
router.get('/history/:sessionId', optionalAuth, chatController.getHistory);
router.post('/feedback', requireAuth, analyticsController.submitFeedback);
router.get('/export/:sessionId', requireAuth, analyticsController.exportConversation);

// Admin only routes
router.get('/stats', requireAuth, requireAdmin, chatController.getStats);
router.get('/analytics/trends', requireAuth, requireAdmin, analyticsController.getConversationTrends);
router.get('/analytics/performance', requireAuth, requireAdmin, analyticsController.getPerformanceMetrics);

// FAQ Routes (Public)
// FAQ Controller
const faqController = require('../controllers/chatbot/faq.controller');

// FAQ Routes (Admin)
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Admin routes first to avoid conflicts
// Note: These must come before /faqs/:id to ensure specific paths are matched first
router.post('/faqs', requireAuth, requireAdmin, faqController.createFAQ);
router.post('/faqs/import-csv', requireAuth, requireAdmin, upload.single('file'), faqController.importCSV);
router.get('/faqs/export', requireAuth, requireAdmin, faqController.exportCSV);
router.post('/faqs/generate-embeddings', requireAuth, requireAdmin, faqController.generateEmbeddings);
router.put('/faqs/:id', requireAuth, requireAdmin, faqController.updateFAQ);
router.delete('/faqs/:id', requireAuth, requireAdmin, faqController.deleteFAQ);

// FAQ Routes (Public)
router.get('/faqs', verifyChatbotApiKey, faqController.getFAQs);
router.get('/faqs/search', verifyChatbotApiKey, faqController.searchFAQs);
router.post('/faqs/similar', verifyChatbotApiKey, faqController.findSimilar);
// Generic ID route MUST be last
router.get('/faqs/:id', faqController.getFAQ);

// Dashboard
router.get('/dashboard', requireAuth, requireAdmin, chatController.getDashboardStats);

// Settings routes (Admin only)
router.get('/settings', requireAuth, requireAdmin, settingsController.getSettings);
router.post('/settings', requireAuth, requireAdmin, settingsController.updateSettings);
router.post('/settings/test-token', requireAuth, requireAdmin, settingsController.testHuggingFaceToken);

module.exports = router;
