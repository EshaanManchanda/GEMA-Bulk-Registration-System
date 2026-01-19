const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatbot/chat.controller');
const analyticsController = require('../controllers/chatbot/chatAnalytics.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// Public routes (with optional auth)
router.post('/message', optionalAuth, chatController.sendMessage);
router.post('/detect-intent', optionalAuth, chatController.detectIntentTest);

// Authenticated routes
router.get('/history/:sessionId', requireAuth, chatController.getHistory);
router.post('/feedback', requireAuth, analyticsController.submitFeedback);
router.get('/export/:sessionId', requireAuth, analyticsController.exportConversation);

// Admin only routes
router.get('/stats', requireAuth, requireAdmin, chatController.getStats);
router.get('/analytics/trends', requireAuth, requireAdmin, analyticsController.getConversationTrends);
router.get('/analytics/performance', requireAuth, requireAdmin, analyticsController.getPerformanceMetrics);

module.exports = router;
