/**
 * payments/{paymentId} write contract. Cloud Functions are the only writers; this module
 * is the shape they stamp. Keep in lockstep with src/features/payments/paymentDocument.ts.
 * Summer is May–November, winter December–April, both in America/Toronto. No card data.
 */

const PAYMENTS_COLLECTION = 'payments';
const PAYMENT_CURRENCY = 'cad';
const PAYMENT_TIME_ZONE = 'America/Toronto';
const PAYMENT_TYPES = Object.freeze(['donation', 'court booking']);
const PAYMENT_SEASONS = Object.freeze(['summer', 'winter']);
const PAYMENT_STATES = Object.freeze(['succeeded', 'refunded']);
const CANCELLATION_STATUSES = Object.freeze(['requested', 'approved', 'declined']);
const CANCELLATION_WINDOW_DAYS = 90;
const CANCELLATION_WINDOW_MS = CANCELLATION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const PAYMENT_FIELDS = Object.freeze([
  'id',
  'uid',
  'user_name',
  'type',
  'amount',
  'currency',
  'season',
  'state',
  'stripe_checkout_session_id',
  'stripe_payment_intent_id',
  'stripe_refund_id',
  'created_at',
  'paid_at',
  'cancellation_requested_at',
  'cancellation_requested_by',
  'cancellation_status',
  'refunded_at',
  'refunded_by',
]);

const PAYMENT_FIELD_SET = new Set(PAYMENT_FIELDS);
const CARD_KEY = /card|cvc|cvv|pan|expir/i;

const requireNonEmptyString = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Payment ${field} is required`);
  }
  return value.trim();
};

const requirePositiveAmount = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error('Payment amount must be a positive number in major units');
  }
  return value;
};

const seasonFromDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid payment date');
  }
  const month = Number(
    new Intl.DateTimeFormat('en-CA', { timeZone: PAYMENT_TIME_ZONE, month: 'numeric' }).format(date),
  );
  return month >= 5 && month <= 11 ? 'summer' : 'winter';
};

const assertNoCardData = (data) => {
  for (const key of Object.keys(data || {})) {
    if (CARD_KEY.test(key)) {
      throw new Error(`Payment records must not store card data (${key})`);
    }
  }
};

const toTime = (value) => (value instanceof Date ? value : new Date(value)).getTime();

const hasContributorBadge = (payments) =>
  (payments || []).some((payment) => payment && payment.type === 'donation' && payment.state === 'succeeded');

const canOfferCancellation = (payment, now = new Date()) => {
  if (!payment || payment.type !== 'donation') return false;
  if (payment.state !== 'succeeded') return false;
  if (payment.cancellation_status) return false;
  const paidAt = toTime(payment.paid_at);
  const nowMs = toTime(now);
  if (Number.isNaN(paidAt) || Number.isNaN(nowMs)) return false;
  return nowMs - paidAt <= CANCELLATION_WINDOW_MS;
};

const assertCancellationRequestAllowed = (payment, { uid, now = new Date() } = {}) => {
  if (!payment || payment.type !== 'donation') {
    throw new Error('Court booking payments have no cancellation path');
  }
  if (uid && payment.uid && payment.uid !== uid) {
    throw new Error('Cannot request cancellation of another member donation');
  }
  if (payment.state !== 'succeeded' || payment.cancellation_status) {
    throw new Error('Only a succeeded donation with no cancellation request can be cancelled');
  }
  const paidAt = toTime(payment.paid_at);
  const nowMs = toTime(now);
  if (Number.isNaN(paidAt) || Number.isNaN(nowMs) || nowMs - paidAt > CANCELLATION_WINDOW_MS) {
    throw new Error('Cancellation requests are only allowed within 90 days of paying');
  }
};

const applyCancellationRequest = (payment, { uid, now, requestedAt } = {}) => {
  const at = requestedAt ?? (now instanceof Date ? now.toISOString() : now) ?? new Date().toISOString();
  assertCancellationRequestAllowed(payment, { uid, now: now ?? at });
  return buildPaymentRecord({
    ...payment,
    cancellation_requested_at: at,
    cancellation_requested_by: uid,
    cancellation_status: 'requested',
  });
};

const assertCancellationReviewAllowed = (payment) => {
  if (!payment || payment.type !== 'donation') {
    throw new Error('Court booking payments have no cancellation path');
  }
  if (payment.state !== 'succeeded' || payment.cancellation_status !== 'requested') {
    throw new Error('Only a pending cancellation request can be reviewed');
  }
};

const applyCancellationDecline = (payment) => {
  assertCancellationReviewAllowed(payment);
  return buildPaymentRecord({
    ...payment,
    cancellation_status: 'declined',
  });
};

const applyCancellationApproval = (payment, { stripe_refund_id, refunded_at, refunded_by } = {}) => {
  assertCancellationReviewAllowed(payment);
  const at = refunded_at ?? new Date().toISOString();
  return buildPaymentRecord({
    ...payment,
    cancellation_status: 'approved',
    state: 'refunded',
    stripe_refund_id,
    refunded_at: at,
    refunded_by,
  });
};

const buildPaymentRecord = (input = {}) => {
  assertNoCardData(input);
  for (const key of Object.keys(input)) {
    if (input[key] !== undefined && !PAYMENT_FIELD_SET.has(key)) {
      throw new Error(`Unknown payment field ${key}`);
    }
  }

  const type = input.type;
  if (!PAYMENT_TYPES.includes(type)) {
    throw new Error('Payment type must be donation or court booking');
  }

  const paidAt = requireNonEmptyString(input.paid_at, 'paid_at');
  const season = seasonFromDate(paidAt);
  if (input.season && input.season !== season) {
    throw new Error(`Payment season must be ${season} for paid_at ${paidAt}`);
  }

  const currency = input.currency ?? PAYMENT_CURRENCY;
  if (currency !== PAYMENT_CURRENCY) {
    throw new Error(`Payment currency must be ${PAYMENT_CURRENCY}`);
  }

  const state = input.state ?? 'succeeded';
  if (!PAYMENT_STATES.includes(state)) {
    throw new Error('Payment state must be succeeded or refunded');
  }

  const cancellationStatus = input.cancellation_status;
  const cancellationAt = input.cancellation_requested_at;
  const cancellationBy = input.cancellation_requested_by;
  const hasCancellation = Boolean(cancellationStatus || cancellationAt || cancellationBy);
  if (hasCancellation) {
    if (type !== 'donation') {
      throw new Error('Court booking payments have no cancellation path');
    }
    if (!CANCELLATION_STATUSES.includes(cancellationStatus)) {
      throw new Error('Payment cancellation_status must be requested, approved, or declined');
    }
    requireNonEmptyString(cancellationAt, 'cancellation_requested_at');
    requireNonEmptyString(cancellationBy, 'cancellation_requested_by');
  }

  if (state === 'refunded') {
    requireNonEmptyString(input.stripe_refund_id, 'stripe_refund_id');
    requireNonEmptyString(input.refunded_at, 'refunded_at');
    requireNonEmptyString(input.refunded_by, 'refunded_by');
    if (cancellationStatus !== 'approved') {
      throw new Error('Cancel and refund are one event');
    }
  }
  if (cancellationStatus === 'approved' && state !== 'refunded') {
    throw new Error('Cancel and refund are one event');
  }
  if (input.stripe_refund_id && state !== 'refunded') {
    throw new Error('stripe_refund_id is only set on a refunded payment');
  }

  const record = {
    id: requireNonEmptyString(input.id, 'id'),
    uid: requireNonEmptyString(input.uid, 'uid'),
    user_name: requireNonEmptyString(input.user_name, 'user_name'),
    type,
    amount: requirePositiveAmount(input.amount),
    currency: PAYMENT_CURRENCY,
    season,
    state,
    stripe_checkout_session_id: requireNonEmptyString(input.stripe_checkout_session_id, 'stripe_checkout_session_id'),
    stripe_payment_intent_id: requireNonEmptyString(input.stripe_payment_intent_id, 'stripe_payment_intent_id'),
    created_at: requireNonEmptyString(input.created_at ?? paidAt, 'created_at'),
    paid_at: paidAt,
  };

  if (input.stripe_refund_id) {
    record.stripe_refund_id = requireNonEmptyString(input.stripe_refund_id, 'stripe_refund_id');
  }
  if (hasCancellation) {
    record.cancellation_requested_at = requireNonEmptyString(cancellationAt, 'cancellation_requested_at');
    record.cancellation_requested_by = requireNonEmptyString(cancellationBy, 'cancellation_requested_by');
    record.cancellation_status = cancellationStatus;
  }
  if (input.refunded_at) record.refunded_at = requireNonEmptyString(input.refunded_at, 'refunded_at');
  if (input.refunded_by) record.refunded_by = requireNonEmptyString(input.refunded_by, 'refunded_by');
  return record;
};

module.exports = {
  PAYMENTS_COLLECTION,
  PAYMENT_CURRENCY,
  PAYMENT_TIME_ZONE,
  PAYMENT_TYPES,
  PAYMENT_SEASONS,
  PAYMENT_STATES,
  CANCELLATION_STATUSES,
  CANCELLATION_WINDOW_DAYS,
  PAYMENT_FIELDS,
  seasonFromDate,
  assertNoCardData,
  canOfferCancellation,
  assertCancellationRequestAllowed,
  applyCancellationRequest,
  assertCancellationReviewAllowed,
  applyCancellationDecline,
  applyCancellationApproval,
  buildPaymentRecord,
  hasContributorBadge,
};
