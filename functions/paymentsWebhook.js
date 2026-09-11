/**
 * Stripe test-mode payments webhook.
 *
 * checkout.session.completed writes payments/{checkoutSessionId} through buildPaymentRecord.
 * The browser returning from Checkout never writes. A replay of the same session is a no-op.
 * Live-mode events are rejected. The Stripe-Signature header is required. No card data.
 *
 * Checkout metadata must carry uid (or client_reference_id). user_name and type (`donation`)
 * should be on metadata; missing user_name falls back to users/{uid}.name.
 *
 * Deployment is environment-gated. Follow docs/architecture/ENVIRONMENTS_AND_DEPLOYMENT.md;
 * do not use a bare Firebase deploy command from this checkout.
 */
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { REGION } = require('./lib/constants');
const { firestorePaymentStore, processStripeWebhook } = require('./lib/stripeWebhook');
const { safeId } = require('./lib/logging');

const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

exports.stripeWebhook = onRequest(
  {
    region: REGION,
    secrets: [stripeWebhookSecret],
    invoker: 'public',
    cors: false,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const outcome = await processStripeWebhook({
        rawBody: req.rawBody,
        signature: req.headers['stripe-signature'],
        secret: stripeWebhookSecret.value(),
        store: firestorePaymentStore(admin.firestore()),
      });
      const record = outcome.result && outcome.result.record;
      logger.info('stripe webhook', {
        ignored: outcome.body.ignored,
        replayed: outcome.body.replayed,
        session: record ? safeId(record.stripe_checkout_session_id) : undefined,
      });
      res.status(outcome.status).json(outcome.body);
    } catch (error) {
      logger.warn('stripe webhook rejected', { message: error.message });
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  },
);
