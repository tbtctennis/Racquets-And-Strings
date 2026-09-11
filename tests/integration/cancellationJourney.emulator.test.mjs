/**
 * TASK-620 / D9-V-T2 — request → organizer approve → refund → record → badge against the emulator.
 *
 * Hosted Stripe refunds are not called. That still needs Functions secret
 * `STRIPE_SECRET_KEY=sk_test_…` (never a `VITE_` variable). Approval uses the
 * production review helper with a mocked Refunds API so this never hits
 * api.stripe.com or a live key.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, beforeEach, test } from 'node:test';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const requireFromFunctions = createRequire(new URL('../../functions/package.json', import.meta.url));
const { SUPER_ADMIN_UID } = requireFromFunctions('./lib/constants.js');
const { PAYMENTS_COLLECTION, buildPaymentRecord } = requireFromFunctions('./lib/payments.js');
const { listPendingPaymentCancellations, reviewPaymentCancellation } = requireFromFunctions('./lib/paymentRefund.js');
const { hasContributorBadge, isRefundedPayment } = requireFromFunctions('./lib/refundMeaning.js');

const projectId = process.env.GCLOUD_PROJECT;
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const functionsHost = process.env.FUNCTIONS_EMULATOR_HOST;
if (!projectId || !authHost || !functionsHost || !process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Run with npm run test:functions:integration.');
}

const app = initializeApp({ projectId }, 'cancellation-journey');
const db = getFirestore(app);
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const session = async (label, uid) => {
  const email = `${label}-${crypto.randomUUID()}@example.test`;
  const password = 'local-test-password';
  if (uid) await getAuth(app).createUser({ uid, email, password });
  const operation = uid ? 'signInWithPassword' : 'signUp';
  const response = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:${operation}?key=local`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return { uid: body.localId, token: body.idToken };
};

const call = async (name, token, data) => {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`http://${functionsHost}/${projectId}/us-central1/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  return { status: response.status, body: await response.json() };
};

const clear = async () => {
  const response = await fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  assert.equal(response.ok, true, await response.text());
};

const firestoreStore = () => ({
  async getPayment(id) {
    const snap = await db.doc(`${PAYMENTS_COLLECTION}/${id}`).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  },
  async setPayment(record) {
    await db.doc(`${PAYMENTS_COLLECTION}/${record.id}`).set(record);
  },
  async listPending() {
    const snap = await db.collection(PAYMENTS_COLLECTION).where('cancellation_status', '==', 'requested').get();
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  },
});

const seedDonation = async (id, uid, overrides = {}) => {
  const record = buildPaymentRecord({
    id,
    uid,
    user_name: 'Journey Donor',
    type: 'donation',
    amount: 25,
    paid_at: daysAgo(7),
    stripe_checkout_session_id: `cs_${id}`,
    stripe_payment_intent_id: `pi_${id}`,
    ...overrides,
  });
  await db.doc(`${PAYMENTS_COLLECTION}/${id}`).set(record);
  return record;
};

const okRefundFetch =
  (id = 're_test_620') =>
  async (url, init) => {
    assert.match(init.headers.Authorization, /^Bearer sk_test_/);
    assert.equal(String(init.body).includes('sk_live'), false);
    assert.match(url, /\/v1\/refunds$/);
    return {
      ok: true,
      json: async () => ({ id, object: 'refund', status: 'succeeded', livemode: false }),
    };
  };

beforeEach(clear);
after(() => deleteApp(app));

test('cancellation journey: request, approve, refunded record, badge against the emulator', async () => {
  const member = await session('cancel-journey');
  await db.doc(`users/${member.uid}`).set({ name: 'Journey Donor' });
  const onlyId = `donation-only-${member.uid}`;
  const keptId = `donation-kept-${member.uid}`;
  await seedDonation(onlyId, member.uid);
  await seedDonation(keptId, member.uid, { paid_at: daysAgo(3) });

  const requested = await call('requestPaymentCancellation', member.token, { paymentId: onlyId });
  assert.equal(requested.status, 200, JSON.stringify(requested.body));

  const pending = (await db.doc(`${PAYMENTS_COLLECTION}/${onlyId}`).get()).data();
  assert.equal(pending.state, 'succeeded');
  assert.equal(pending.cancellation_status, 'requested');
  assert.equal(pending.cancellation_requested_by, member.uid);
  assert.equal(hasContributorBadge([pending, (await db.doc(`${PAYMENTS_COLLECTION}/${keptId}`).get()).data()]), true);

  const store = firestoreStore();
  const queued = await listPendingPaymentCancellations({ auth: { uid: SUPER_ADMIN_UID }, data: {} }, { store });
  assert.equal(
    queued.items.some((row) => row.id === onlyId),
    true,
  );

  const approved = await reviewPaymentCancellation(
    { auth: { uid: SUPER_ADMIN_UID }, data: { paymentId: onlyId, approve: true } },
    {
      store,
      getSecret: () => 'sk_test_task_620',
      now: new Date().toISOString(),
      fetch: okRefundFetch(),
    },
  );
  assert.equal(approved.ok, true);
  assert.equal(approved.stripe_refund_id, 're_test_620');

  const refundedSnap = await db.doc(`${PAYMENTS_COLLECTION}/${onlyId}`).get();
  const keptSnap = await db.doc(`${PAYMENTS_COLLECTION}/${keptId}`).get();
  const refunded = { id: refundedSnap.id, ...refundedSnap.data() };
  const kept = { id: keptSnap.id, ...keptSnap.data() };
  assert.equal(refunded.state, 'refunded');
  assert.equal(refunded.cancellation_status, 'approved');
  assert.equal(refunded.stripe_refund_id, 're_test_620');
  assert.equal(isRefundedPayment(refunded), true);
  assert.equal(Object.hasOwn(refunded, 'card_number'), false);
  assert.equal(kept.state, 'succeeded');
  assert.equal(hasContributorBadge([refunded]), false);
  assert.equal(hasContributorBadge([refunded, kept]), true);
});

test('emulator refuses a cancellation request older than 90 days', async () => {
  const member = await session('cancel-late');
  const lateId = `donation-late-${member.uid}`;
  await seedDonation(lateId, member.uid, { paid_at: daysAgo(120) });

  const refused = await call('requestPaymentCancellation', member.token, { paymentId: lateId });
  assert.equal(refused.status, 400, JSON.stringify(refused.body));
  assert.equal(refused.body.error.status, 'FAILED_PRECONDITION');
  assert.match(refused.body.error.message || JSON.stringify(refused.body), /90 days/);

  const unchanged = (await db.doc(`${PAYMENTS_COLLECTION}/${lateId}`).get()).data();
  assert.equal(unchanged.state, 'succeeded');
  assert.equal(unchanged.cancellation_status, undefined);
  assert.equal(hasContributorBadge([unchanged]), true);
});

test('a declined emulator request leaves the payment and the badge intact', async () => {
  const member = await session('cancel-decline');
  const paymentId = `donation-declined-${member.uid}`;
  await seedDonation(paymentId, member.uid);

  const requested = await call('requestPaymentCancellation', member.token, { paymentId });
  assert.equal(requested.status, 200, JSON.stringify(requested.body));

  const declined = await reviewPaymentCancellation(
    { auth: { uid: SUPER_ADMIN_UID }, data: { paymentId, approve: false } },
    {
      store: firestoreStore(),
      getSecret: () => 'sk_test_task_620',
      now: new Date().toISOString(),
      fetch: async () => {
        throw new Error('Stripe should not be called');
      },
    },
  );
  assert.equal(declined.ok, true);
  assert.equal(declined.approve, false);

  const row = (await db.doc(`${PAYMENTS_COLLECTION}/${paymentId}`).get()).data();
  assert.equal(row.state, 'succeeded');
  assert.equal(row.cancellation_status, 'declined');
  assert.equal(row.stripe_refund_id, undefined);
  assert.equal(isRefundedPayment(row), false);
  assert.equal(hasContributorBadge([row]), true);
});
