const assert = require('node:assert/strict');
const nodeCrypto = require('node:crypto');
const { test } = require('node:test');
const { processStripeWebhook, verifyStripeSignature } = require('../lib/stripeWebhook');

const SECRET = 'whsec_test_task_613';
const NOW = Date.parse('2026-05-12T15:01:00.000Z');
const TIMESTAMP = Math.floor(NOW / 1000);

const sign = (payload, secret = SECRET, timestamp = TIMESTAMP) => {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const hmac = nodeCrypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return { header: `t=${timestamp},v1=${hmac}`, rawBody: body };
};

const checkoutEvent = (sessionOverrides = {}, eventOverrides = {}) => ({
  id: 'evt_test_donation',
  object: 'event',
  type: 'checkout.session.completed',
  livemode: false,
  created: TIMESTAMP,
  data: {
    object: {
      id: 'cs_test_donation',
      object: 'checkout.session',
      payment_intent: 'pi_test_donation',
      payment_status: 'paid',
      amount_total: 2500,
      currency: 'cad',
      metadata: { uid: 'member-a', user_name: 'Synthetic Member', type: 'donation' },
      ...sessionOverrides,
    },
  },
  ...eventOverrides,
});

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

test('a signed test-mode donation writes its payment from the webhook, not a browser return', async () => {
  const store = memoryStore();
  const event = checkoutEvent();
  const { header, rawBody } = sign(event);

  const outcome = await processStripeWebhook({
    rawBody,
    signature: header,
    secret: SECRET,
    store,
    nowMs: NOW,
  });

  assert.equal(outcome.status, 200);
  assert.equal(outcome.body.received, true);
  assert.equal(outcome.body.ignored, false);
  assert.equal(outcome.body.replayed, false);
  assert.equal(store.payments.size, 1);

  const record = store.payments.get('cs_test_donation');
  assert.equal(record.uid, 'member-a');
  assert.equal(record.user_name, 'Synthetic Member');
  assert.equal(record.type, 'donation');
  assert.equal(record.amount, 25);
  assert.equal(record.currency, 'cad');
  assert.equal(record.season, 'summer');
  assert.equal(record.state, 'succeeded');
  assert.equal(record.stripe_checkout_session_id, 'cs_test_donation');
  assert.equal(record.stripe_payment_intent_id, 'pi_test_donation');
  assert.equal(record.paid_at, '2026-05-12T15:01:00.000Z');
  assert.equal(Object.hasOwn(record, 'card_number'), false);
});

test('closing the tab still records the donation and a replay does not double-record', async () => {
  const store = memoryStore();
  const { header, rawBody } = sign(checkoutEvent());
  const args = { rawBody, signature: header, secret: SECRET, store, nowMs: NOW };

  const first = await processStripeWebhook(args);
  const second = await processStripeWebhook(args);

  assert.equal(first.body.replayed, false);
  assert.equal(second.status, 200);
  assert.equal(second.body.received, true);
  assert.equal(second.body.replayed, true);
  assert.equal(store.payments.size, 1);
});

test('the signature is verified and an unsigned or forged call is rejected', async () => {
  const store = memoryStore();
  const event = checkoutEvent();
  const { header, rawBody } = sign(event);

  await assert.rejects(
    () => processStripeWebhook({ rawBody, signature: undefined, secret: SECRET, store, nowMs: NOW }),
    /Missing Stripe-Signature/,
  );
  await assert.rejects(
    () =>
      processStripeWebhook({ rawBody, signature: header.replace(/v1=/, 'v1=dead'), secret: SECRET, store, nowMs: NOW }),
    /Invalid Stripe-Signature/,
  );
  assert.throws(() => verifyStripeSignature(rawBody, header, 'whsec_other', NOW), /Invalid Stripe-Signature/);
  assert.equal(store.payments.size, 0);
});

test('a live-mode Stripe event is rejected and writes nothing', async () => {
  const store = memoryStore();
  const { header, rawBody } = sign(checkoutEvent({}, { livemode: true }));

  await assert.rejects(
    () => processStripeWebhook({ rawBody, signature: header, secret: SECRET, store, nowMs: NOW }),
    /test mode only/,
  );
  assert.equal(store.payments.size, 0);
});
