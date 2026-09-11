const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { HttpsError } = require('firebase-functions/v2/https');
const { SUPER_ADMIN_UID } = require('../lib/constants');
const { applyCancellationRequest, buildPaymentRecord } = require('../lib/payments');
const {
  ORGANIZER_ONLY,
  STRIPE_REFUNDS_URL,
  listPendingPaymentCancellations,
  reviewPaymentCancellation,
} = require('../lib/paymentRefund');

const now = '2026-09-11T12:00:00.000Z';

const donation = (overrides = {}) =>
  buildPaymentRecord({
    id: 'donation-cancel-requested',
    uid: 'member-a',
    user_name: 'Synthetic Member',
    type: 'donation',
    amount: 50,
    paid_at: '2026-08-01T12:00:00.000Z',
    stripe_checkout_session_id: 'cs_test_requested',
    stripe_payment_intent_id: 'pi_test_requested',
    ...overrides,
  });

const requested = () => applyCancellationRequest(donation(), { uid: 'member-a', now, requestedAt: now });

const memoryStore = (rows) => {
  const payments = new Map(rows.map((row) => [row.id, { ...row }]));
  return {
    payments,
    async getPayment(id) {
      const row = payments.get(id);
      return row ? { ...row } : null;
    },
    async setPayment(record) {
      payments.set(record.id, { ...record });
    },
    async listPending() {
      return [...payments.values()].filter((row) => row.cancellation_status === 'requested');
    },
  };
};

const organizerRequest = (data) => ({ auth: { uid: SUPER_ADMIN_UID }, data });
const memberRequest = (data) => ({ auth: { uid: 'member-a' }, data });

const okRefundFetch = (id = 're_test_616') => {
  const fetchImpl = async (url, init) => {
    fetchImpl.last = { url, init };
    return {
      ok: true,
      json: async () => ({ id, object: 'refund', status: 'succeeded', livemode: false }),
    };
  };
  return fetchImpl;
};

test('an organizer approval refunds in Stripe test mode and stamps the payment', async () => {
  const payment = requested();
  const store = memoryStore([payment]);
  const fetchImpl = okRefundFetch();
  const result = await reviewPaymentCancellation(organizerRequest({ paymentId: payment.id, approve: true }), {
    store,
    getSecret: () => 'sk_test_123',
    now,
    fetch: fetchImpl,
  });

  assert.equal(result.ok, true);
  assert.equal(result.stripe_refund_id, 're_test_616');
  const updated = store.payments.get(payment.id);
  assert.equal(updated.state, 'refunded');
  assert.equal(updated.cancellation_status, 'approved');
  assert.equal(updated.stripe_refund_id, 're_test_616');
  assert.equal(updated.refunded_by, SUPER_ADMIN_UID);
  assert.equal(updated.refunded_at, now);
  assert.equal(fetchImpl.last.url, STRIPE_REFUNDS_URL);
  assert.equal(fetchImpl.last.init.headers.Authorization, 'Bearer sk_test_123');
  assert.match(fetchImpl.last.init.body, /payment_intent=pi_test_requested/);
  assert.equal(fetchImpl.last.init.headers['Idempotency-Key'], `payment-refund-${payment.id}`);
});

test('a declined request leaves the payment intact and does not call Stripe', async () => {
  const payment = requested();
  const store = memoryStore([payment]);
  let fetched = 0;
  const result = await reviewPaymentCancellation(organizerRequest({ paymentId: payment.id, approve: false }), {
    store,
    getSecret: () => 'sk_test_123',
    now,
    fetch: async () => {
      fetched += 1;
      throw new Error('Stripe should not be called');
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.approve, false);
  assert.equal(fetched, 0);
  const updated = store.payments.get(payment.id);
  assert.equal(updated.state, 'succeeded');
  assert.equal(updated.cancellation_status, 'declined');
  assert.equal(updated.stripe_refund_id, undefined);
  assert.equal(updated.refunded_at, undefined);
});

test('only an organizer can approve or list pending cancellation requests', async () => {
  const payment = requested();
  const store = memoryStore([payment]);
  await assert.rejects(
    () =>
      reviewPaymentCancellation(memberRequest({ paymentId: payment.id, approve: true }), {
        store,
        getSecret: () => 'sk_test_123',
        fetch: okRefundFetch(),
      }),
    (error) => error instanceof HttpsError && error.code === 'permission-denied' && error.message === ORGANIZER_ONLY,
  );
  await assert.rejects(
    () => listPendingPaymentCancellations(memberRequest({}), { store }),
    (error) => error instanceof HttpsError && error.code === 'permission-denied' && error.message === ORGANIZER_ONLY,
  );
  assert.equal(store.payments.get(payment.id).cancellation_status, 'requested');
  assert.equal(store.payments.get(payment.id).state, 'succeeded');

  const listed = await listPendingPaymentCancellations(organizerRequest({}), { store });
  assert.equal(listed.items.length, 1);
  assert.equal(listed.items[0].id, payment.id);
});

test('an approval that fails at Stripe leaves the request pending', async () => {
  const payment = requested();
  const store = memoryStore([payment]);
  await assert.rejects(
    () =>
      reviewPaymentCancellation(organizerRequest({ paymentId: payment.id, approve: true }), {
        store,
        getSecret: () => 'sk_test_123',
        now,
        fetch: async () => ({
          ok: false,
          json: async () => ({ error: { message: 'card declined' } }),
        }),
      }),
    (error) =>
      error instanceof HttpsError && error.code === 'failed-precondition' && /Stripe refund failed/.test(error.message),
  );
  const unchanged = store.payments.get(payment.id);
  assert.equal(unchanged.state, 'succeeded');
  assert.equal(unchanged.cancellation_status, 'requested');
  assert.equal(unchanged.stripe_refund_id, undefined);
});

test('live Stripe keys and live-mode refunds are refused before the record changes', async () => {
  const payment = requested();
  const store = memoryStore([payment]);
  await assert.rejects(
    () =>
      reviewPaymentCancellation(organizerRequest({ paymentId: payment.id, approve: true }), {
        store,
        getSecret: () => 'sk_live_abc',
        now,
        fetch: okRefundFetch(),
      }),
    (error) => error instanceof HttpsError && error.code === 'failed-precondition',
  );
  await assert.rejects(
    () =>
      reviewPaymentCancellation(organizerRequest({ paymentId: payment.id, approve: true }), {
        store,
        getSecret: () => 'sk_test_123',
        now,
        fetch: async () => ({
          ok: true,
          json: async () => ({ id: 're_live_1', object: 'refund', status: 'succeeded', livemode: true }),
        }),
      }),
    (error) => error instanceof HttpsError && error.code === 'failed-precondition',
  );
  assert.equal(store.payments.get(payment.id).state, 'succeeded');
  assert.equal(store.payments.get(payment.id).cancellation_status, 'requested');
});

test('anonymous callers cannot list or review payment cancellations', async () => {
  const store = memoryStore([]);
  await assert.rejects(
    () => listPendingPaymentCancellations({ auth: null, data: {} }, { store }),
    (error) => error instanceof HttpsError && error.code === 'unauthenticated',
  );
  await assert.rejects(
    () =>
      reviewPaymentCancellation(
        { auth: null, data: { paymentId: 'donation-cancel-requested', approve: true } },
        { store, getSecret: () => 'sk_test_123', fetch: okRefundFetch() },
      ),
    (error) => error instanceof HttpsError && error.code === 'unauthenticated',
  );
});

test('malformed review input is rejected and a second approval is idempotent', async () => {
  const payment = requested();
  const store = memoryStore([payment]);
  await assert.rejects(
    () => reviewPaymentCancellation(organizerRequest({ approve: true }), { store, getSecret: () => 'sk_test_123' }),
    (error) => error instanceof HttpsError && error.code === 'invalid-argument',
  );
  await assert.rejects(
    () =>
      reviewPaymentCancellation(organizerRequest({ paymentId: payment.id, approve: true, card_number: '4242' }), {
        store,
        getSecret: () => 'sk_test_123',
        fetch: okRefundFetch(),
      }),
    (error) => error instanceof HttpsError && error.code === 'invalid-argument',
  );
  assert.equal(store.payments.get(payment.id).state, 'succeeded');

  const first = await reviewPaymentCancellation(organizerRequest({ paymentId: payment.id, approve: true }), {
    store,
    getSecret: () => 'sk_test_123',
    now,
    fetch: okRefundFetch('re_test_dup'),
  });
  assert.equal(first.stripe_refund_id, 're_test_dup');
  let fetched = 0;
  const second = await reviewPaymentCancellation(organizerRequest({ paymentId: payment.id, approve: true }), {
    store,
    getSecret: () => 'sk_test_123',
    now,
    fetch: async () => {
      fetched += 1;
      throw new Error('Stripe should not be called again');
    },
  });
  assert.equal(second.ok, true);
  assert.equal(second.stripe_refund_id, 're_test_dup');
  assert.equal(fetched, 0);
  assert.equal(store.payments.get(payment.id).state, 'refunded');
});

test('payments callables export organizer review and do not write from the client', () => {
  const callable = readFileSync(join(__dirname, '../payments.js'), 'utf8');
  const index = readFileSync(join(__dirname, '../index.js'), 'utf8');
  assert.match(callable, /exports.reviewPaymentCancellation/);
  assert.match(callable, /exports.listPendingPaymentCancellations/);
  assert.match(callable, /createStripeRefund|reviewPaymentCancellation/);
  assert.match(index, /require\('\.\/payments'\)/);
});
