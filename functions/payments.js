/**
 * Stripe test-mode Checkout. The webhook (not the browser return) writes the payment record.
 * Deployment is environment-gated. Follow docs/architecture/ENVIRONMENTS_AND_DEPLOYMENT.md;
 * do not use a bare Firebase deploy command from this checkout.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { REGION } = require('./lib/constants');
const { requireAuth, requireTrimmedString } = require('./lib/callable');
const { safeId } = require('./lib/logging');
const { createCheckoutSession, readStripeSecret } = require('./lib/checkoutSession');
const { notify } = require('./lib/notify');
const { PAYMENTS_COLLECTION, applyCancellationRequest, buildPaymentRecord } = require('./lib/payments');
const { listPendingPaymentCancellations, reviewPaymentCancellation } = require('./lib/paymentRefund');

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const db = () => admin.firestore();

function firestorePaymentStore() {
  return {
    async getPayment(id) {
      const snap = await db().doc(`${PAYMENTS_COLLECTION}/${id}`).get();
      if (!snap.exists) return null;
      return { id: snap.id, ...snap.data() };
    },
    async setPayment(record) {
      const ref = db().doc(`${PAYMENTS_COLLECTION}/${record.id}`);
      await db().runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) throw new HttpsError('not-found', 'Payment not found.');
        const current = { id: snap.id, ...snap.data() };
        if (record.state === 'refunded') {
          if (current.state === 'refunded') return;
          if (current.state !== 'succeeded') {
            throw new HttpsError('failed-precondition', 'This payment cannot be refunded.');
          }
        } else if (record.cancellation_status === 'declined') {
          if (current.cancellation_status !== 'requested' || current.state !== 'succeeded') {
            throw new HttpsError('failed-precondition', 'This request is no longer pending.');
          }
        }
        tx.set(ref, record);
      });
    },
    async listPending() {
      const snap = await db().collection(PAYMENTS_COLLECTION).where('cancellation_status', '==', 'requested').get();
      return snap.docs
        .map((docSnap) => {
          try {
            return buildPaymentRecord({ id: docSnap.id, ...docSnap.data() });
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    },
  };
}

exports.createCheckoutSession = onCall({ region: REGION, secrets: [stripeSecretKey] }, async (request) => {
  const session = await createCheckoutSession(request, {
    getSecret: () => readStripeSecret(stripeSecretKey),
    loadUserName: async (uid) => {
      const snap = await db().doc(`users/${uid}`).get();
      return snap.exists ? String(snap.data()?.name || '') : '';
    },
  });
  logger.info('checkout session created', { uid: safeId(request.auth?.uid), session: session.id });
  return session;
});

function asHttpsError(error) {
  if (error instanceof HttpsError) return error;
  const message = error instanceof Error ? error.message : 'Cancellation request failed.';
  if (message.includes('another member')) return new HttpsError('permission-denied', message);
  return new HttpsError('failed-precondition', message);
}

// Client writes on payments/{id} are denied. A cancellation request is this callable.
exports.requestPaymentCancellation = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request);
  const paymentId = requireTrimmedString(request.data?.paymentId, 'Payment is required.');
  const ref = db().doc(`${PAYMENTS_COLLECTION}/${paymentId}`);

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Payment not found.');
    const now = new Date();
    try {
      const updated = applyCancellationRequest({ id: snap.id, ...snap.data() }, { uid, now });
      tx.set(ref, updated);
    } catch (error) {
      throw asHttpsError(error);
    }
  });

  return { ok: true };
});

// Owner-scoped payment reads deny the organizer client. The queue is this callable.
exports.listPendingPaymentCancellations = onCall({ region: REGION }, async (request) =>
  listPendingPaymentCancellations(request, { store: firestorePaymentStore() }),
);

// Approval executes the Stripe refund; a Stripe failure leaves the request pending.
exports.reviewPaymentCancellation = onCall({ region: REGION, secrets: [stripeSecretKey] }, async (request) => {
  const result = await reviewPaymentCancellation(request, {
    getSecret: () => readStripeSecret(stripeSecretKey),
    store: firestorePaymentStore(),
  });
  const payment = result.payment;
  if (payment?.uid) {
    await notify(payment.uid, {
      type: result.approve ? 'payment_cancellation_approved' : 'payment_cancellation_declined',
      title: result.approve ? 'Donation refunded' : 'Cancellation declined',
      body: result.approve
        ? 'Your donation was refunded.'
        : 'Your cancellation request was declined. The payment is unchanged.',
      link: '/payments',
    }).catch(() => {
      /* best-effort */
    });
  }
  logger.info('payment cancellation reviewed', {
    uid: safeId(request.auth?.uid),
    payment: safeId(payment?.id),
    approve: result.approve,
  });
  return { ok: true, stripe_refund_id: result.stripe_refund_id };
});
