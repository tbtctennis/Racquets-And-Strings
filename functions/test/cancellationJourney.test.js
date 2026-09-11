/**
 * TASK-620 / D9-V-T2 — request → organizer approve → refund → record → badge, per P4-T2.
 *
 * Hosted Stripe refunds are not driven here. That still needs Functions secret
 * `STRIPE_SECRET_KEY=sk_test_…` (never a `VITE_` variable). This journey mocks the
 * Refunds API, never calls api.stripe.com, and never uses a live key.
 */

const assert = require('node:assert/strict');
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
const { hasContributorBadge, isRefundedPayment } = require('../lib/refundMeaning');

const now = '2026-09-11T12:00:00.000Z';

const donation = (id, overrides = {}) =>
  buildPaymentRecord({
    id,
    uid: 'member-journey',
    user_name: 'Journey Donor',
    type: 'donation',
    amount: 25,
    paid_at: '2026-08-01T12:00:00.000Z',
    stripe_checkout_session_id: `cs_${id}`,
    stripe_payment_intent_id: `pi_${id}`,
    ...overrides,
  });

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

const requestCancellation = async (store, { paymentId, uid, at }) => {
  const current = await store.getPayment(paymentId);
  if (!current) throw new Error('Payment not found.');
  const updated = applyCancellationRequest(current, { uid, now: at, requestedAt: at });
  await store.setPayment(updated);
  return updated;
};

const organizerRequest = (data) => ({ auth: { uid: SUPER_ADMIN_UID }, data });
const memberRequest = (data) => ({ auth: { uid: 'member-journey' }, data });

const okRefundFetch = (id = 're_test_620') => {
  const fetchImpl = async (url, init) => {
    fetchImpl.last = { url, init };
    assert.match(init.headers.Authorization, /^Bearer sk_test_/);
    assert.equal(String(init.body).includes('sk_live'), false);
    return {
      ok: true,
      json: async () => ({ id, object: 'refund', status: 'succeeded', livemode: false }),
    };
  };
  return fetchImpl;
};

test('request → organizer approve → Stripe test-mode refund → record → badge, per P4-T2', async () => {
  const only = donation('donation-only');
  const keptA = donation('donation-kept-a', { paid_at: '2026-08-08T12:00:00.000Z' });
  const keptB = donation('donation-kept-b', { paid_at: '2026-08-15T12:00:00.000Z' });
  const onlyStore = memoryStore([only]);
  const threeStore = memoryStore([only, keptA, keptB]);

  assert.equal(hasContributorBadge([...onlyStore.payments.values()]), true);
  assert.equal(hasContributorBadge([...threeStore.payments.values()]), true);

  const pendingOnly = await requestCancellation(onlyStore, {
    paymentId: only.id,
    uid: 'member-journey',
    at: now,
  });
  const pendingThree = await requestCancellation(threeStore, {
    paymentId: only.id,
    uid: 'member-journey',
    at: now,
  });

  assert.equal(pendingOnly.state, 'succeeded');
  assert.equal(pendingOnly.cancellation_status, 'requested');
  assert.equal(pendingOnly.cancellation_requested_by, 'member-journey');
  assert.equal(isRefundedPayment(pendingOnly), false);
  assert.equal(hasContributorBadge([...onlyStore.payments.values()]), true);
  assert.equal(hasContributorBadge([...threeStore.payments.values()]), true);
  assert.equal(pendingThree.cancellation_status, 'requested');

  const queued = await listPendingPaymentCancellations(organizerRequest({}), { store: onlyStore });
  assert.equal(queued.items.length, 1);
  assert.equal(queued.items[0].id, only.id);
  await assert.rejects(
    () => listPendingPaymentCancellations(memberRequest({}), { store: onlyStore }),
    (error) => error instanceof HttpsError && error.code === 'permission-denied' && error.message === ORGANIZER_ONLY,
  );

  const fetchImpl = okRefundFetch();
  const approved = await reviewPaymentCancellation(organizerRequest({ paymentId: only.id, approve: true }), {
    store: onlyStore,
    getSecret: () => 'sk_test_task_620',
    now,
    fetch: fetchImpl,
  });
  await reviewPaymentCancellation(organizerRequest({ paymentId: only.id, approve: true }), {
    store: threeStore,
    getSecret: () => 'sk_test_task_620',
    now,
    fetch: okRefundFetch('re_test_620_kept'),
  });

  assert.equal(approved.ok, true);
  assert.equal(approved.stripe_refund_id, 're_test_620');
  const refunded = onlyStore.payments.get(only.id);
  assert.equal(refunded.state, 'refunded');
  assert.equal(refunded.cancellation_status, 'approved');
  assert.equal(refunded.stripe_refund_id, 're_test_620');
  assert.equal(refunded.refunded_by, SUPER_ADMIN_UID);
  assert.equal(refunded.refunded_at, now);
  assert.equal(isRefundedPayment(refunded), true);
  assert.equal(Object.hasOwn(refunded, 'card_number'), false);
  assert.equal(fetchImpl.last.url, STRIPE_REFUNDS_URL);
  assert.equal(fetchImpl.last.init.headers.Authorization, 'Bearer sk_test_task_620');
  assert.match(fetchImpl.last.init.body, /payment_intent=pi_donation-only/);
  assert.equal(fetchImpl.last.init.headers['Idempotency-Key'], `payment-refund-${only.id}`);

  assert.equal(hasContributorBadge([...onlyStore.payments.values()]), false);
  assert.equal(hasContributorBadge([...threeStore.payments.values()]), true);
  assert.equal(threeStore.payments.get(keptA.id).state, 'succeeded');
  assert.equal(threeStore.payments.get(keptB.id).state, 'succeeded');
  assert.equal((await listPendingPaymentCancellations(organizerRequest({}), { store: onlyStore })).items.length, 0);
});

test('a request older than 90 days is refused', async () => {
  const late = donation('donation-late', { paid_at: '2026-06-13T11:59:59.999Z' });
  const store = memoryStore([late]);
  await assert.rejects(
    () => requestCancellation(store, { paymentId: late.id, uid: 'member-journey', at: now }),
    /90 days/,
  );
  const unchanged = store.payments.get(late.id);
  assert.equal(unchanged.state, 'succeeded');
  assert.equal(unchanged.cancellation_status, undefined);
  assert.equal(hasContributorBadge([...store.payments.values()]), true);
});

test('a declined request leaves the payment and the badge intact', async () => {
  const row = donation('donation-declined');
  const store = memoryStore([row]);
  await requestCancellation(store, { paymentId: row.id, uid: 'member-journey', at: now });
  assert.equal(hasContributorBadge([...store.payments.values()]), true);

  let fetched = 0;
  const result = await reviewPaymentCancellation(organizerRequest({ paymentId: row.id, approve: false }), {
    store,
    getSecret: () => 'sk_test_task_620',
    now,
    fetch: async () => {
      fetched += 1;
      throw new Error('Stripe should not be called');
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.approve, false);
  assert.equal(fetched, 0);
  const declined = store.payments.get(row.id);
  assert.equal(declined.state, 'succeeded');
  assert.equal(declined.cancellation_status, 'declined');
  assert.equal(declined.stripe_refund_id, undefined);
  assert.equal(declined.refunded_at, undefined);
  assert.equal(isRefundedPayment(declined), false);
  assert.equal(hasContributorBadge([...store.payments.values()]), true);
});
