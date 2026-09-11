/**
 * TASK-619 / D9-V-T1 — donate → webhook → payment row → Contributor badge.
 *
 * Hosted Stripe Checkout is not driven here. That still needs Functions secrets
 * `STRIPE_SECRET_KEY=sk_test_…` and `STRIPE_WEBHOOK_SECRET=whsec_…` (never a `VITE_`
 * variable) plus Stripe CLI forwarding or a test-mode endpoint. This journey mocks
 * the Checkout API, signs a test-mode `checkout.session.completed` event, and
 * never calls api.stripe.com or uses a live key.
 */

const assert = require('node:assert/strict');
const nodeCrypto = require('node:crypto');
const { test } = require('node:test');
const { createCheckoutSession } = require('../lib/checkoutSession');
const { processStripeWebhook } = require('../lib/stripeWebhook');
const { hasContributorBadge } = require('../lib/payments');

const SECRET = 'whsec_test_task_619';
const NOW = Date.parse('2026-09-11T16:00:00.000Z');
const TIMESTAMP = Math.floor(NOW / 1000);

const sign = (payload, secret = SECRET, timestamp = TIMESTAMP) => {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const hmac = nodeCrypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return { header: `t=${timestamp},v1=${hmac}`, rawBody: body };
};

const memoryStore = () => {
  const payments = new Map();
  return {
    payments,
    async lookupUserName() {
      return '';
    },
    async createPayment(record) {
      if (payments.has(record.id)) return false;
      payments.set(record.id, { ...record });
      return true;
    },
  };
};

test('donate → webhook → payment row → Contributor badge in Stripe test mode', async () => {
  const store = memoryStore();
  let stripeCalls = 0;
  const session = await createCheckoutSession(
    {
      auth: { uid: 'member-journey' },
      data: {
        amount: 25,
        type: 'donation',
        success_url: 'http://localhost:3000/profile?donation=success',
        cancel_url: 'http://localhost:3000/profile?donation=cancel',
      },
    },
    {
      getSecret: () => 'sk_test_task_619',
      loadUserName: async () => 'Journey Donor',
      now: new Date(NOW),
      fetch: async (_url, init) => {
        stripeCalls += 1;
        assert.match(init.headers.Authorization, /^Bearer sk_test_/);
        assert.equal(String(init.body).includes('sk_live'), false);
        return {
          ok: true,
          json: async () => ({
            id: 'cs_test_journey_619',
            url: 'https://checkout.stripe.com/c/pay/cs_test_journey_619',
          }),
        };
      },
    },
  );

  assert.equal(stripeCalls, 1);
  assert.equal(session.id, 'cs_test_journey_619');
  assert.equal(session.url.startsWith('https://checkout.stripe.com/'), true);
  assert.equal(Object.keys(session).join(','), 'id,url');

  // Browser return from Checkout is not a writer. The signed webhook is.
  const event = {
    id: 'evt_test_journey_619',
    object: 'event',
    type: 'checkout.session.completed',
    livemode: false,
    created: TIMESTAMP,
    data: {
      object: {
        id: session.id,
        object: 'checkout.session',
        payment_intent: 'pi_test_journey_619',
        payment_status: 'paid',
        amount_total: 2500,
        currency: 'cad',
        metadata: { uid: 'member-journey', user_name: 'Journey Donor', type: 'donation' },
      },
    },
  };
  const { header, rawBody } = sign(event);
  const first = await processStripeWebhook({
    rawBody,
    signature: header,
    secret: SECRET,
    store,
    nowMs: NOW,
  });
  const replay = await processStripeWebhook({
    rawBody,
    signature: header,
    secret: SECRET,
    store,
    nowMs: NOW,
  });

  assert.equal(first.status, 200);
  assert.equal(first.body.replayed, false);
  assert.equal(replay.body.replayed, true);
  assert.equal(store.payments.size, 1);

  const record = store.payments.get(session.id);
  assert.equal(record.uid, 'member-journey');
  assert.equal(record.type, 'donation');
  assert.equal(record.amount, 25);
  assert.equal(record.currency, 'cad');
  assert.equal(record.season, 'summer');
  assert.equal(record.state, 'succeeded');
  assert.equal(record.stripe_checkout_session_id, session.id);
  assert.equal(record.stripe_payment_intent_id, 'pi_test_journey_619');
  assert.equal(Object.hasOwn(record, 'card_number'), false);
  assert.equal(hasContributorBadge([record]), true);
  assert.equal(hasContributorBadge([]), false);
});
