import { buildPaymentRecord, type Payment } from './paymentDocument';

type RefundFields = Pick<Payment, 'type' | 'state' | 'stripe_refund_id' | 'cancellation_status'>;

/** A cancelled donation is a refunded donation: `state` and `stripe_refund_id` together. */
export function isRefundedPayment(payment: Pick<Payment, 'state' | 'stripe_refund_id'>): boolean {
  return payment.state === 'refunded' && Boolean(payment.stripe_refund_id);
}

/** Donations still unrefunded count. A pending request does not. Court bookings never do. */
export function countsTowardContributorBadge(payment: RefundFields): boolean {
  return payment.type === 'donation' && !isRefundedPayment(payment);
}

/** A member keeps the badge while any donation of theirs is still unrefunded. */
export function hasContributorBadge(payments: RefundFields[]): boolean {
  return payments.some(countsTowardContributorBadge);
}

/** Member-facing refund label. Refunded rows also show `stripe_refund_id`. */
export function describePaymentRefund(payment: Pick<Payment, 'state' | 'stripe_refund_id'>): string {
  return isRefundedPayment(payment) ? `refunded · ${payment.stripe_refund_id}` : payment.state;
}

type ApplyRefundInput = {
  stripeRefundId: string;
  refundedBy: string;
  refundedAt?: string;
  now?: Date | string;
};

/**
 * Cancel and refund are one event. Stamps `state: refunded` with `stripe_refund_id` and
 * `cancellation_status: approved` together. Stripe test-mode ids only.
 */
export function applyRefund(payment: Payment, input: ApplyRefundInput): Payment {
  if (payment.type !== 'donation') {
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
  const at =
    input.refundedAt ?? (input.now instanceof Date ? input.now.toISOString() : input.now) ?? new Date().toISOString();
  return buildPaymentRecord({
    ...payment,
    state: 'refunded',
    stripe_refund_id: input.stripeRefundId,
    refunded_at: at,
    refunded_by: input.refundedBy,
    cancellation_status: 'approved',
    cancellation_requested_at: payment.cancellation_requested_at ?? at,
    cancellation_requested_by: payment.cancellation_requested_by ?? payment.uid,
  });
}
