const express = require('express');
const router = express.Router();
const {
  getPublicEvents,
  getEventById,
  getEventBySlug,
} = require('../controllers/event.controller');

/**
 * Public Event Routes
 * Base path: /api/v1/events
 */

// Get all active public events
router.get('/', getPublicEvents);

// Get event by slug (must come before /:eventId to avoid conflict)
router.get('/slug/:eventSlug', getEventBySlug);

// Get event by ID
router.get('/:eventId', getEventById);

// Fetch certificate by email (public endpoint for students)
router.post('/:eventId/fetch-certificate', require('../controllers/event.controller').fetchCertificate);

module.exports = router;
