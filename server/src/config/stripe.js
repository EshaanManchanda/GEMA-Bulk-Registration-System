const Stripe = require('stripe');
const logger = require('../utils/logger');

/**
 * Stripe Configuration (for USD payments)
 * Automatically switches between test and production keys based on NODE_ENV
 */
const isDevelopment = process.env.NODE_ENV !== 'production';

const stripe = new Stripe(
  isDevelopment
    ? process.env.STRIPE_TEST_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY
);

// Export webhook secret based on environment
const STRIPE_WEBHOOK_SECRET = isDevelopment
  ? process.env.STRIPE_TEST_WEBHOOK_SECRET
  : process.env.STRIPE_WEBHOOK_SECRET;

// Log configuration status
const secretKey = isDevelopment ? process.env.STRIPE_TEST_SECRET_KEY : process.env.STRIPE_SECRET_KEY;
if (secretKey) {
  logger.info(`Stripe configured (${isDevelopment ? 'test' : 'production'}) with key: ${secretKey.substring(0, 10)}...`);
} else {
  logger.warn('Stripe API key not configured');
}

module.exports = { stripe, STRIPE_WEBHOOK_SECRET };
