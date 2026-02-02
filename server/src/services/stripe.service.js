const Stripe = require('stripe');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler.middleware');
const { toSmallestUnit, fromSmallestUnit } = require('../utils/helpers');
const Settings = require('../models/Settings');

const isDevelopment = process.env.NODE_ENV !== 'production';

// Fallback environment-based keys
const envStripeSecretKey = isDevelopment
  ? process.env.STRIPE_TEST_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY;

const envWebhookSecret = isDevelopment
  ? process.env.STRIPE_TEST_WEBHOOK_SECRET
  : process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Stripe Payment Service
 * Handles USD and other currency payments through Stripe
 * Uses dynamic configuration from database with fallback to env vars
 */
class StripeService {
  constructor() {
    this.stripeInstance = null;
    this.lastSettingsFetch = 0;
    this.settingsCacheDuration = 5 * 60 * 1000; // 5 minutes

    // Initialize with env key if available immediately
    if (envStripeSecretKey) {
      this.stripeInstance = new Stripe(envStripeSecretKey);
    }
  }

  /**
   * Get Stripe instance with latest configuration
   * @returns {Promise<Object>} Stripe instance
   */
  async getStripe() {
    try {
      // Check if we need to refresh settings
      const now = Date.now();
      if (!this.stripeInstance || (now - this.lastSettingsFetch > this.settingsCacheDuration)) {
        await this.refreshStripeInstance();
      }

      if (!this.stripeInstance) {
        throw new Error('Stripe is not configured. Please check payment settings.');
      }

      return this.stripeInstance;
    } catch (error) {
      logger.error('Failed to get Stripe instance:', error);
      // Fallback to existing instance if available, even if stale
      if (this.stripeInstance) return this.stripeInstance;
      throw new AppError('Payment service configuration error', 500);
    }
  }

  /**
   * Refresh Stripe instance from database settings
   */
  async refreshStripeInstance() {
    try {
      const settings = await Settings.getInstance();
      const stripeConfig = settings.payment_gateway?.stripe;

      // Use DB key if enabled and present, otherwise fallback to env
      // But only if DB is actually configured (to avoid breaking existing env setups)
      let secretKey = envStripeSecretKey;

      if (stripeConfig?.enabled && stripeConfig?.secret_key) {
        secretKey = stripeConfig.secret_key;
      }

      if (secretKey) {
        this.stripeInstance = new Stripe(secretKey);
        this.lastSettingsFetch = Date.now();
        // logger.info('Stripe instance refreshed');
      } else {
        logger.warn('No Stripe secret key found in settings or environment');
      }
    } catch (error) {
      logger.error('Error refreshing Stripe settings:', error);
    }
  }

  /**
   * Create Stripe payment intent
   * @param {Object} intentData - { amount, currency, metadata, customer_email }
   * @returns {Promise<Object>}
   */
  async createPaymentIntent(intentData) {
    try {
      const stripeClient = await this.getStripe();
      const { amount, currency, metadata, customer_email, description } = intentData;

      // Convert to smallest unit (cents for USD)
      const amountInCents = toSmallestUnit(amount, currency);

      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata: metadata || {},
        receipt_email: customer_email,
        description: description || 'GEMA Event Registration',
        automatic_payment_methods: {
          enabled: true
        }
      });

      logger.info(`Stripe payment intent created: ${paymentIntent.id} for amount: ${amount} ${currency}`);

      return {
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: fromSmallestUnit(paymentIntent.amount, currency),
        currency: paymentIntent.currency.toUpperCase(),
        status: paymentIntent.status,
        created_at: new Date(paymentIntent.created * 1000),
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      logger.error('Stripe create payment intent error:', error);
      throw new AppError('Failed to create payment intent', 500);
    }
  }

  /**
   * Retrieve payment intent
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>}
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const stripeClient = await this.getStripe();
      const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

      return {
        payment_intent_id: paymentIntent.id,
        amount: fromSmallestUnit(paymentIntent.amount, paymentIntent.currency.toUpperCase()),
        currency: paymentIntent.currency.toUpperCase(),
        status: paymentIntent.status,
        payment_method: paymentIntent.payment_method,
        charge_id: paymentIntent.charges?.data[0]?.id,
        receipt_url: paymentIntent.charges?.data[0]?.receipt_url,
        created_at: new Date(paymentIntent.created * 1000),
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      logger.error('Stripe retrieve payment intent error:', error);
      throw new AppError('Failed to retrieve payment intent', 500);
    }
  }

  /**
   * Confirm payment intent
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @param {Object} confirmData - { payment_method, return_url }
   * @returns {Promise<Object>}
   */
  async confirmPaymentIntent(paymentIntentId, confirmData) {
    try {
      const stripeClient = await this.getStripe();
      const { payment_method, return_url } = confirmData;

      const paymentIntent = await stripeClient.paymentIntents.confirm(paymentIntentId, {
        payment_method: payment_method,
        return_url: return_url || `${process.env.FRONTEND_URL}/payment/complete`
      });

      logger.info(`Payment intent confirmed: ${paymentIntent.id}`);

      return {
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        amount: fromSmallestUnit(paymentIntent.amount, paymentIntent.currency.toUpperCase()),
        currency: paymentIntent.currency.toUpperCase()
      };
    } catch (error) {
      logger.error('Stripe confirm payment intent error:', error);
      throw new AppError('Failed to confirm payment', 500);
    }
  }

  /**
   * Cancel payment intent
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>}
   */
  async cancelPaymentIntent(paymentIntentId) {
    try {
      const stripeClient = await this.getStripe();
      const paymentIntent = await stripeClient.paymentIntents.cancel(paymentIntentId);

      logger.info(`Payment intent cancelled: ${paymentIntent.id}`);

      return {
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        cancellation_reason: paymentIntent.cancellation_reason
      };
    } catch (error) {
      logger.error('Stripe cancel payment intent error:', error);
      throw new AppError('Failed to cancel payment', 500);
    }
  }

  /**
   * Cancel payment intent safely (no-throw for terminal states)
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object|null>} - Result or null if already terminal
   */
  async safeCancelPaymentIntent(paymentIntentId) {
    try {
      return await this.cancelPaymentIntent(paymentIntentId);
    } catch (error) {
      logger.warn(
        `safeCancelPaymentIntent: could not cancel ${paymentIntentId}`,
        error.message
      );
      return null;
    }
  }

  /**
   * Create refund
   * @param {string} chargeId - Stripe charge ID
   * @param {number} amount - Amount to refund (optional, full refund if not provided)
   * @param {string} currency - Currency code
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>}
   */
  async createRefund(chargeId, amount = null, currency = 'USD', reason = null) {
    try {
      const stripeClient = await this.getStripe();
      const refundData = {
        charge: chargeId
      };

      if (amount) {
        refundData.amount = toSmallestUnit(amount, currency);
      }

      if (reason) {
        refundData.reason = reason; // 'duplicate', 'fraudulent', 'requested_by_customer'
      }

      const refund = await stripeClient.refunds.create(refundData);

      logger.info(`Refund created: ${refund.id} for charge: ${chargeId}`);

      return {
        refund_id: refund.id,
        charge_id: refund.charge,
        amount: fromSmallestUnit(refund.amount, currency),
        currency: refund.currency.toUpperCase(),
        status: refund.status,
        reason: refund.reason,
        created_at: new Date(refund.created * 1000)
      };
    } catch (error) {
      logger.error('Stripe create refund error:', error);
      throw new AppError('Failed to create refund', 500);
    }
  }

  /**
   * Retrieve refund
   * @param {string} refundId - Stripe refund ID
   * @returns {Promise<Object>}
   */
  async getRefund(refundId) {
    try {
      const stripeClient = await this.getStripe();
      const refund = await stripeClient.refunds.retrieve(refundId);

      return {
        refund_id: refund.id,
        charge_id: refund.charge,
        amount: fromSmallestUnit(refund.amount, refund.currency.toUpperCase()),
        currency: refund.currency.toUpperCase(),
        status: refund.status,
        reason: refund.reason,
        created_at: new Date(refund.created * 1000)
      };
    } catch (error) {
      logger.error('Stripe retrieve refund error:', error);
      throw new AppError('Failed to retrieve refund', 500);
    }
  }

  /**
   * Create customer
   * @param {Object} customerData - { email, name, phone, metadata }
   * @returns {Promise<Object>}
   */
  async createCustomer(customerData) {
    try {
      const stripeClient = await this.getStripe();
      const { email, name, phone, metadata } = customerData;

      const customer = await stripeClient.customers.create({
        email: email,
        name: name,
        phone: phone,
        metadata: metadata || {}
      });

      logger.info(`Stripe customer created: ${customer.id}`);

      return {
        customer_id: customer.id,
        email: customer.email,
        name: customer.name,
        created_at: new Date(customer.created * 1000)
      };
    } catch (error) {
      logger.error('Stripe create customer error:', error);
      throw new AppError('Failed to create customer', 500);
    }
  }

  /**
   * Retrieve customer
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>}
   */
  async getCustomer(customerId) {
    try {
      const stripeClient = await this.getStripe();
      const customer = await stripeClient.customers.retrieve(customerId);

      return {
        customer_id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        created_at: new Date(customer.created * 1000),
        metadata: customer.metadata
      };
    } catch (error) {
      logger.error('Stripe retrieve customer error:', error);
      throw new AppError('Failed to retrieve customer', 500);
    }
  }

  /**
   * Create checkout session
   * @param {Object} sessionData - Checkout session data
   * @returns {Promise<Object>}
   */
  async createCheckoutSession(sessionData) {
    try {
      const stripeClient = await this.getStripe();
      const {
        line_items,
        customer_email,
        success_url,
        cancel_url,
        metadata,
        mode = 'payment'
      } = sessionData;

      const session = await stripeClient.checkout.sessions.create({
        line_items: line_items.map(item => ({
          price_data: {
            currency: item.currency.toLowerCase(),
            product_data: {
              name: item.name,
              description: item.description
            },
            unit_amount: toSmallestUnit(item.amount, item.currency)
          },
          quantity: item.quantity || 1
        })),
        mode: mode,
        customer_email: customer_email,
        success_url: success_url || `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancel_url || `${process.env.FRONTEND_URL}/payment/cancelled`,
        metadata: metadata || {},
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes
      });

      logger.info(`Checkout session created: ${session.id}`);

      return {
        session_id: session.id,
        url: session.url,
        payment_status: session.payment_status,
        customer_email: session.customer_email,
        expires_at: new Date(session.expires_at * 1000)
      };
    } catch (error) {
      logger.error('Stripe create checkout session error:', error);
      throw new AppError('Failed to create checkout session', 500);
    }
  }

  /**
   * Retrieve checkout session
   * @param {string} sessionId - Stripe checkout session ID
   * @returns {Promise<Object>}
   */
  async getCheckoutSession(sessionId) {
    try {
      const stripeClient = await this.getStripe();
      const session = await stripeClient.checkout.sessions.retrieve(sessionId);

      return {
        session_id: session.id,
        payment_status: session.payment_status,
        payment_intent: session.payment_intent,
        amount_total: fromSmallestUnit(session.amount_total, session.currency?.toUpperCase() || 'USD'),
        currency: session.currency?.toUpperCase(),
        customer_email: session.customer_email,
        created_at: new Date(session.created * 1000),
        metadata: session.metadata
      };
    } catch (error) {
      logger.error('Stripe retrieve checkout session error:', error);
      throw new AppError('Failed to retrieve checkout session', 500);
    }
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Webhook signature from headers
   * @returns {Object|null} - Event object if valid, null otherwise
   */
  verifyWebhookSignature(payload, signature) {
    // Note: Webhook secret is currently static/env based. 
    // Dynamic webhook secrets would require storing them in DB too.
    // For now, continuing to use env var for webhook secret.
    try {
      // NOTE: stripe.webhooks doesn't depend on the instance, but the library itself.
      // However, for consistency we can valid from the instance, but constructEvent is static-like.
      // The `stripe` variable here refers to the loaded module if we used `require('stripe')`, but we are inside the class.
      // We need to use `Stripe.webhooks`.

      const event = Stripe.webhooks.constructEvent(
        payload,
        signature,
        envWebhookSecret
      );

      logger.info(`Webhook signature verified: ${event.type}`);
      return event;
    } catch (error) {
      logger.error('Stripe webhook signature verification failed:', error.message);
      return null;
    }
  }

  /**
   * List all charges for a customer
   * @param {string} customerId - Stripe customer ID
   * @param {number} limit - Number of charges to retrieve
   * @returns {Promise<Array>}
   */
  async listCustomerCharges(customerId, limit = 10) {
    try {
      const stripeClient = await this.getStripe();
      const charges = await stripeClient.charges.list({
        customer: customerId,
        limit: limit
      });

      return charges.data.map(charge => ({
        charge_id: charge.id,
        amount: fromSmallestUnit(charge.amount, charge.currency.toUpperCase()),
        currency: charge.currency.toUpperCase(),
        status: charge.status,
        paid: charge.paid,
        receipt_url: charge.receipt_url,
        created_at: new Date(charge.created * 1000)
      }));
    } catch (error) {
      logger.error('Stripe list charges error:', error);
      throw new AppError('Failed to list charges', 500);
    }
  }

  /**
   * Retrieve charge
   * @param {string} chargeId - Stripe charge ID
   * @returns {Promise<Object>}
   */
  async getCharge(chargeId) {
    try {
      const stripeClient = await this.getStripe();
      const charge = await stripeClient.charges.retrieve(chargeId);

      return {
        charge_id: charge.id,
        amount: fromSmallestUnit(charge.amount, charge.currency.toUpperCase()),
        currency: charge.currency.toUpperCase(),
        status: charge.status,
        paid: charge.paid,
        refunded: charge.refunded,
        receipt_url: charge.receipt_url,
        payment_method_details: charge.payment_method_details,
        billing_details: charge.billing_details,
        created_at: new Date(charge.created * 1000),
        metadata: charge.metadata
      };
    } catch (error) {
      logger.error('Stripe retrieve charge error:', error);
      throw new AppError('Failed to retrieve charge', 500);
    }
  }
}

// Export singleton instance
module.exports = new StripeService();
