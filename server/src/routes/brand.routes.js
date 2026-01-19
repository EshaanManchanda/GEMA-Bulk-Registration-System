const express = require('express');
const router = express.Router();
const { getBrandInfo } = require('../controllers/brand.controller');

/**
 * Brand Routes (Public)
 * Base path: /api/v1/brand
 */

// Get brand information (public)
router.get('/', getBrandInfo);

module.exports = router;
