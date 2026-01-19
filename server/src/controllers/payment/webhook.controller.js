const logger = require('../../utils/logger');
const Payment = require('../../models/Payment');
const Batch = require('../../models/Batch');
const Registration = require('../../models/Registration');
const WebhookLog = require('../../models/WebhookLog');
const School = require('../../models/School');
const Event = require('../../models/Event');
const stripeService = require('../../services/stripe.service');
const emailService = require('../../services/email.service');
const invoiceService = require('../../services/invoice.service');
const { PAYMENT_STATUS, BATCH_STATUS } = require('../../utils/constants');

/**
 * @desc    Handle Stripe webhook
 * @route   POST /api/v1/webhooks/stripe
 * @access  Public (Stripe webhook)
 */
exports.handleStripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const rawBody = req.rawBody; // Need raw body for signature verification

    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(rawBody, signature);

    if (!event) {
      logger.warn('Invalid Stripe webhook signature');
      return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    // Check for duplicate webhook (idempotency)
    const webhookId = event.id;
    const existingLog = await WebhookLog.findOne({ webhook_id: webhookId });

    if (existingLog && existingLog.processed) {
      logger.info(`Duplicate Stripe webhook ignored: ${webhookId}`);
      return res.status(200).json({ status: 'ok', message: 'Already processed' });
    }

    // Create webhook log entry
    const webhookLog = await WebhookLog.create({
      gateway: 'stripe',
      event_type: event.type,
      webhook_id: webhookId,
      payload: event
    });

    logger.info(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleStripePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handleStripePaymentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleStripeRefund(event.data.object);
        break;

      case 'checkout.session.completed':
        await handleStripeCheckoutCompleted(event.data.object);
        break;

      default:
        logger.info(`Unhandled Stripe webhook event: ${event.type}`);
    }

    // Mark webhook as processed
    webhookLog.processed = true;
    webhookLog.processed_at = new Date();
    await webhookLog.save();

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    logger.error('Stripe webhook error:', error);

    // Log error in webhook log if exists
    if (webhookLog) {
      webhookLog.error = error.message;
      await webhookLog.save();
    }

    res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
  }
};

/**
 * Handle Stripe payment success
 * @private
 */
async function handleStripePaymentSuccess(paymentIntent) {
  try {
    const paymentIntentId = paymentIntent.id;

    // Find payment record
    const payment = await Payment.findOne({
      gateway_order_id: paymentIntentId,
      payment_gateway: 'stripe'
    }).populate('batch_id');

    if (!payment) {
      logger.warn(`Payment record not found for Stripe payment intent: ${paymentIntentId}`);
      return;
    }

    // Update payment record
    payment.gateway_payment_id = paymentIntent.charges?.data[0]?.id || paymentIntentId;
    payment.payment_status = PAYMENT_STATUS.COMPLETED;
    payment.gateway_response = paymentIntent;
    payment.paid_at = new Date();
    await payment.save();

    // Update all registrations in batch to CONFIRMED
    const batch = payment.batch_id;
    await Registration.bulkConfirmByBatch(batch._id);

    // Update batch
    batch.payment_status = PAYMENT_STATUS.COMPLETED;
    batch.status = BATCH_STATUS.SUBMITTED;
    await batch.save();

    logger.info(`Stripe payment success webhook processed: ${paymentIntentId}`);

    // Trigger invoice generation and send confirmation email (non-blocking)
    setImmediate(async () => {
      try {
        const school = await School.findById(payment.school_id);
        const event = await Event.findById(payment.event_id);

        // Generate invoice
        const invoice = await invoiceService.generateInvoice(payment._id);
        logger.info(`Invoice generated for payment: ${payment.payment_reference}`);

        // Send payment confirmation email with invoice
        await emailService.sendPaymentConfirmation(school.contact_person.email, {
          schoolName: school.name,
          eventName: event.title,
          amount: payment.amount,
          currency: payment.currency,
          transactionId: payment.gateway_payment_id,
          invoiceUrl: invoice.invoice_url
        });
        logger.info(`Payment confirmation email sent to: ${school.contact_person.email}`);
      } catch (emailError) {
        logger.error('Failed to generate invoice or send confirmation email:', emailError);
      }
    });

  } catch (error) {
    logger.error('Handle Stripe payment success error:', error);
  }
}

/**
 * Handle Stripe payment failed
 * @private
 */
async function handleStripePaymentFailed(paymentIntent) {
  try {
    const paymentIntentId = paymentIntent.id;

    // Find payment record
    const payment = await Payment.findOne({
      gateway_order_id: paymentIntentId,
      payment_gateway: 'stripe'
    }).populate('batch_id');

    if (!payment) {
      logger.warn(`Payment record not found for Stripe payment intent: ${paymentIntentId}`);
      return;
    }

    // Update payment record
    payment.payment_status = PAYMENT_STATUS.FAILED;
    payment.gateway_response = paymentIntent;
    await payment.save();

    // Update batch
    const batch = payment.batch_id;
    batch.payment_status = PAYMENT_STATUS.FAILED;
    await batch.save();

    logger.info(`Stripe payment failed webhook processed: ${paymentIntentId}`);

    // Send failure notification email (non-blocking)
    setImmediate(async () => {
      try {
        const school = await School.findById(payment.school_id);
        const event = await Event.findById(payment.event_id);

        await emailService.sendPaymentFailure(school.contact_person.email, {
          schoolName: school.name,
          eventName: event.title,
          amount: payment.amount,
          currency: payment.currency,
          reason: 'Payment failed or was declined by the payment gateway'
        });
        logger.info(`Payment failure email sent to: ${school.contact_person.email}`);
      } catch (emailError) {
        logger.error('Failed to send payment failure email:', emailError);
      }
    });

  } catch (error) {
    logger.error('Handle Stripe payment failed error:', error);
  }
}

/**
 * Handle Stripe refund
 * @private
 */
async function handleStripeRefund(charge) {
  try {
    const chargeId = charge.id;

    // Find payment record
    const payment = await Payment.findOne({
      gateway_payment_id: chargeId,
      payment_gateway: 'stripe'
    }).populate('batch_id');

    if (!payment) {
      logger.warn(`Payment record not found for Stripe charge: ${chargeId}`);
      return;
    }

    // Update payment record
    payment.refunded = true;
    payment.refund_amount = charge.amount_refunded / 100; // Convert cents to dollars
    payment.gateway_response = {
      ...payment.gateway_response,
      refund_details: charge
    };
    await payment.save();

    logger.info(`Stripe refund webhook processed: ${chargeId}`);

    // Send refund notification email (non-blocking)
    setImmediate(async () => {
      try {
        const school = await School.findById(payment.school_id);
        const event = await Event.findById(payment.event_id);

        await emailService.sendRefundNotification(school.contact_person.email, {
          schoolName: school.name,
          eventName: event.title,
          amount: payment.refund_amount,
          currency: payment.currency,
          transactionId: payment.gateway_payment_id
        });
        logger.info(`Refund notification email sent to: ${school.contact_person.email}`);
      } catch (emailError) {
        logger.error('Failed to send refund notification email:', emailError);
      }
    });

  } catch (error) {
    logger.error('Handle Stripe refund error:', error);
  }
}

/**
 * Handle Stripe checkout session completed
 * @private
 */
async function handleStripeCheckoutCompleted(session) {
  try {
    const sessionId = session.id;
    const paymentIntentId = session.payment_intent;

    if (!paymentIntentId) {
      logger.warn('No payment intent in checkout session');
      return;
    }

    // Find payment by metadata if available
    const batchReference = session.metadata?.batch_reference;

    if (batchReference) {
      const batch = await Batch.findOne({ batch_reference: batchReference });

      if (batch) {
        const payment = await Payment.findOne({
          batch_id: batch._id,
          payment_gateway: 'stripe'
        });

        if (payment) {
          payment.gateway_order_id = paymentIntentId;
          payment.payment_status = PAYMENT_STATUS.COMPLETED;
          payment.paid_at = new Date();
          await payment.save();

          // Update all registrations in batch to CONFIRMED
          await Registration.bulkConfirmByBatch(batch._id);

          batch.payment_status = PAYMENT_STATUS.COMPLETED;
          batch.status = BATCH_STATUS.SUBMITTED;
          await batch.save();

          logger.info(`Stripe checkout completed webhook processed: ${sessionId}`);
        }
      }
    }

  } catch (error) {
    logger.error('Handle Stripe checkout completed error:', error);
  }
}

module.exports = exports;
