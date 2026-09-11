/**
 * Organizer review of a donation cancellation. Approval calls Stripe test-mode refunds
 * first; the payment record is updated only after Stripe succeeds. A Stripe failure
 * leaves the request pending. Client writes stay denied.
 */
const { HttpsError } = require('firebase-functions/v2/https');
const { SUPER_ADMIN_UID } = require('./constants');
const { requireAuth, requireTrimmedString } = require('./callable');
const { encodeStripeForm, readStripeSecret, requireStripeTestSecret } = require('./checkoutSession');
const {
  applyCancellationApproval,
  applyCancellationDecline,
  assertCancellationReviewAllowed,
  assertNoCardData,
  buildPaymentRecord,
} = require('./payments');

const STRIPE_REFUNDS_URL = 'https://api.stripe.com/v1/refunds';
const ORGANIZER_ONLY = 'Only an organizer can approve.';

function requireOrganizer(request) {
  const uid = requireAuth(request);
  if (uid !== SUPER_ADMIN_UID) {
    throw new HttpsError('permission-denied', ORGANIZER_ONLY);
  }
  return uid;
}

function refuseCardData(data) {
  try {
    assertNoCardData(data || {});
  } catch (error) {
    throw new HttpsError('invalid-argument', error.message);
  }
}

function publicRefund(refund) {
  if (!refund || typeof refund !== 'object') {
    throw new HttpsError('internal', 'Stripe did not return a refund.');
  }
  const { id, status, livemode } = refund;
  if (typeof id !== 'string' || !id.startsWith('re_')) {
    throw new HttpsError('internal', 'Stripe did not return a refund.');
  }
  if (livemode === true) {
    throw new HttpsError('failed-precondition', 'Stripe test-mode refund is required.');
  }
  if (status && status !== 'succeeded' && status !== 'pending') {
    throw new HttpsError('failed-precondition', 'Stripe refund failed.');
  }
  return { id, status: status || 'succeeded' };
}

async function createStripeRefund(secretKey, { paymentIntentId, paymentId }, fetchImpl = fetch) {
  requireStripeTestSecret(secretKey);
  const response = await fetchImpl(STRIPE_REFUNDS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': `payment-refund-${paymentId}`,
    },
    body: encodeStripeForm({ payment_intent: paymentIntentId }).join('&'),
  });
  if (!response.ok) {
    throw new HttpsError('failed-precondition', 'Stripe refund failed.');
  }
  try {
    return publicRefund(await response.json());
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Stripe did not return a refund.');
  }
}

function asPayment(row, id) {
  try {
    return buildPaymentRecord({ ...(row || {}), id });
  } catch {
    return null;
  }
}

function asHttpsError(error) {
  if (error instanceof HttpsError) return error;
  const message = error instanceof Error ? error.message : 'Cancellation review failed.';
  if (message.includes('another member') || message.includes('organizer')) {
    return new HttpsError('permission-denied', message.includes('organizer') ? ORGANIZER_ONLY : message);
  }
  return new HttpsError('failed-precondition', message);
}

async function listPendingPaymentCancellations(request, deps = {}) {
  try {
    requireOrganizer(request);
    refuseCardData(request.data);
    const rows = deps.store ? await deps.store.listPending() : [];
    return {
      items: rows
        .map((row) => asPayment(row, row.id))
        .filter(Boolean)
        .filter((row) => row.cancellation_status === 'requested' && row.state === 'succeeded')
        .sort(
          (a, b) =>
            new Date(b.cancellation_requested_at || 0).getTime() - new Date(a.cancellation_requested_at || 0).getTime(),
        ),
    };
  } catch (error) {
    throw asHttpsError(error);
  }
}

async function reviewPaymentCancellation(request, deps = {}) {
  try {
    const uid = requireOrganizer(request);
    refuseCardData(request.data);
    const paymentId = requireTrimmedString(request.data?.paymentId, 'Payment is required.');
    const approve = request.data?.approve === true;
    const now = deps.now ?? new Date();
    const at = now instanceof Date ? now.toISOString() : String(now);
    const store = deps.store;
    if (!store) throw new HttpsError('internal', 'Payment store is required.');

    const raw = await store.getPayment(paymentId);
    if (!raw) throw new HttpsError('not-found', 'Payment not found.');
    const current = asPayment(raw, paymentId) || raw;

    if (!approve) {
      const declined = applyCancellationDecline(current);
      await store.setPayment(declined);
      return { ok: true, approve: false, payment: declined };
    }

    if (current.state === 'refunded' && current.cancellation_status === 'approved' && current.stripe_refund_id) {
      return { ok: true, approve: true, payment: current, stripe_refund_id: current.stripe_refund_id };
    }

    assertCancellationReviewAllowed(current);
    const secretKey = requireStripeTestSecret(deps.getSecret ? deps.getSecret() : readStripeSecret());
    const refund = await createStripeRefund(
      secretKey,
      { paymentIntentId: current.stripe_payment_intent_id, paymentId },
      deps.fetch,
    );
    const refunded = applyCancellationApproval(current, {
      stripe_refund_id: refund.id,
      refunded_at: at,
      refunded_by: uid,
    });
    await store.setPayment(refunded);
    return { ok: true, approve: true, payment: refunded, stripe_refund_id: refund.id };
  } catch (error) {
    throw asHttpsError(error);
  }
}

module.exports = {
  STRIPE_REFUNDS_URL,
  ORGANIZER_ONLY,
  requireOrganizer,
  publicRefund,
  createStripeRefund,
  listPendingPaymentCancellations,
  reviewPaymentCancellation,
};
