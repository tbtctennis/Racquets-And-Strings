/**
 * Refund meaning for payments/{paymentId}. A cancelled donation is a refunded donation:
 * state `refunded` and `stripe_refund_id` are one event. The badge follows that refund,
 * not a pending cancellation request. Keep in lockstep with src/features/payments/refundMeaning.ts.
 */

const { buildPaymentRecord } = require('./payments');

const isRefundedPayment = (payment) =>
  Boolean(payment) && payment.state === 'refunded' && Boolean(payment.stripe_refund_id);

const countsTowardContributorBadge = (payment) =>
  Boolean(payment) && payment.type === 'donation' && !isRefundedPayment(payment);

const hasContributorBadge = (payments) => (payments || []).some(countsTowardContributorBadge);

const describePaymentRefund = (payment) =>
  isRefundedPayment(payment) ? `refunded · ${payment.stripe_refund_id}` : payment?.state;

const applyRefund = (payment, { stripeRefundId, refundedBy, refundedAt, now } = {}) => {
  if (!payment || payment.type !== 'donation') {
    throw new Error('Court booking payments have no cancellation path');
  }
  if (isRefundedPayment(payment) || payment.state === 'refunded') {
    throw new Error('Payment is already refunded');
  }
  if (payment.state !== 'succeeded') {
    throw new Error('Only a succeeded donation can be refunded');
  }
  if (payment.cancellation_status === 'declined') {
    throw new Error('A declined request leaves the payment intact');
  }
  const at = refundedAt ?? (now instanceof Date ? now.toISOString() : now) ?? new Date().toISOString();
  return buildPaymentRecord({
    ...payment,
    state: 'refunded',
    stripe_refund_id: stripeRefundId,
    refunded_at: at,
    refunded_by: refundedBy,
    cancellation_status: 'approved',
    cancellation_requested_at: payment.cancellation_requested_at ?? at,
    cancellation_requested_by: payment.cancellation_requested_by ?? payment.uid,
  });
};

module.exports = {
  isRefundedPayment,
  countsTowardContributorBadge,
  hasContributorBadge,
  describePaymentRefund,
  applyRefund,
};
