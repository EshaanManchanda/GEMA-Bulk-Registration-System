const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');

/**
 * Public Media Routes
 * Base path: /api/v1/media
 * No authentication required - public access
 */

// Serve media file by ID (hides storage implementation)
router.get('/serve/:id', mediaController.serveMedia);

module.exports = router;
