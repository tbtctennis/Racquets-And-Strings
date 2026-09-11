// Collection: payments/{paymentId} — donations now, court-booking rows when Book My Court arrives.
// Server-written only (webhook + callables). No card data. Stripe ids are the refund handles.
// Summer is May–November, winter December–April, both in America/Toronto.

export const PAYMENTS_COLLECTION = 'payments';
export const PAYMENT_CURRENCY = 'cad';
export const PAYMENT_TIME_ZONE = 'America/Toronto';

export const PAYMENT_TYPES = ['donation', 'court booking'] as const;
export const PAYMENT_SEASONS = ['summer', 'winter'] as const;
export const PAYMENT_STATES = ['succeeded', 'refunded'] as const;
export const CANCELLATION_STATUSES = ['requested', 'approved', 'declined'] as const;
export const CANCELLATION_WINDOW_DAYS = 90;
const CANCELLATION_WINDOW_MS = CANCELLATION_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export type PaymentType = (typeof PAYMENT_TYPES)[number];
export type PaymentSeason = (typeof PAYMENT_SEASONS)[number];
export type PaymentState = (typeof PAYMENT_STATES)[number];
export type CancellationStatus = (typeof CANCELLATION_STATUSES)[number];

export interface Payment {
  id: string;
  uid: string;
  user_name: string;
  type: PaymentType;
  amount: number;
  currency: typeof PAYMENT_CURRENCY;
  season: PaymentSeason;
  state: PaymentState;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id: string;
  stripe_refund_id?: string | undefined;
  created_at: string;
  paid_at: string;
  cancellation_requested_at?: string | undefined;
  cancellation_requested_by?: string | undefined;
  cancellation_status?: CancellationStatus | undefined;
  refunded_at?: string | undefined;
  refunded_by?: string | undefined;
}

export const PAYMENT_FIELDS = [
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
] as const;

export type PaymentInput = Omit<Payment, 'currency' | 'season' | 'state' | 'created_at'> & {
  currency?: string | undefined;
  season?: PaymentSeason | undefined;
  state?: PaymentState | undefined;
  created_at?: string | undefined;
};

const PAYMENT_FIELD_SET = new Set<string>(PAYMENT_FIELDS);
const CARD_KEY = /card|cvc|cvv|pan|expir/i;

const isPaymentType = (value: unknown): value is PaymentType =>
  typeof value === 'string' && (PAYMENT_TYPES as readonly string[]).includes(value);
const isPaymentState = (value: unknown): value is PaymentState =>
  typeof value === 'string' && (PAYMENT_STATES as readonly string[]).includes(value);
const isCancellationStatus = (value: unknown): value is CancellationStatus =>
  typeof value === 'string' && (CANCELLATION_STATUSES as readonly string[]).includes(value);

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Payment ${field} is required`);
  }
  return value.trim();
}

function requirePositiveAmount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error('Payment amount must be a positive number in major units');
  }
  return value;
}

/** Month in America/Toronto. Summer is May (5) through November (11). */
export function seasonFromDate(value: Date | string): PaymentSeason {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid payment date');
  }
  const month = Number(
    new Intl.DateTimeFormat('en-CA', { timeZone: PAYMENT_TIME_ZONE, month: 'numeric' }).format(date),
  );
  return month >= 5 && month <= 11 ? 'summer' : 'winter';
}

export function assertNoCardData(data: Record<string, unknown>): void {
  for (const key of Object.keys(data)) {
    if (CARD_KEY.test(key)) {
      throw new Error(`Payment records must not store card data (${key})`);
    }
  }
}

function toTime(value: Date | string): number {
  return (value instanceof Date ? value : new Date(value)).getTime();
}

type CancellationCandidate = Pick<Payment, 'type' | 'state' | 'paid_at'> &
  Partial<Pick<Payment, 'uid' | 'cancellation_status'>>;

export const CONTRIBUTOR_BADGE_NAME = 'Contributor';

export type ContributorBadgePayment = Pick<Payment, 'type' | 'state'>;

/** True while any donation is still unrefunded. Pending cancellation does not drop the badge. */
export function hasContributorBadge(payments: readonly ContributorBadgePayment[] | null | undefined): boolean {
  return (payments ?? []).some((payment) => payment.type === 'donation' && payment.state === 'succeeded');
}

/** Donations inside 90 days of paying. Court bookings never offer a request. */
export function canOfferCancellation(payment: CancellationCandidate, now: Date | string = new Date()): boolean {
  if (payment.type !== 'donation') return false;
  if (payment.state !== 'succeeded') return false;
  if (payment.cancellation_status) return false;
  const paidAt = toTime(payment.paid_at);
  const nowMs = toTime(now);
  if (Number.isNaN(paidAt) || Number.isNaN(nowMs)) return false;
  return nowMs - paidAt <= CANCELLATION_WINDOW_MS;
}

/** Server gate for a cancellation request. Client writes stay denied. */
export function assertCancellationRequestAllowed(
  payment: CancellationCandidate | null | undefined,
  { uid, now = new Date() }: { uid?: string; now?: Date | string } = {},
): void {
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
}

/** Stamps a requested cancellation. Court bookings and late donations throw. */
export function applyCancellationRequest(
  payment: Payment,
  { uid, now, requestedAt }: { uid: string; now?: Date | string; requestedAt?: string },
): Payment {
  const at = requestedAt ?? (now instanceof Date ? now.toISOString() : now) ?? new Date().toISOString();
  assertCancellationRequestAllowed(payment, { uid, now: now ?? at });
  return buildPaymentRecord({
    ...payment,
    cancellation_requested_at: at,
    cancellation_requested_by: uid,
    cancellation_status: 'requested',
  });
}

/** Organizer review is only valid while the donation is still succeeded and requested. */
export function assertCancellationReviewAllowed(payment: CancellationCandidate | null | undefined): void {
  if (!payment || payment.type !== 'donation') {
    throw new Error('Court booking payments have no cancellation path');
  }
  if (payment.state !== 'succeeded' || payment.cancellation_status !== 'requested') {
    throw new Error('Only a pending cancellation request can be reviewed');
  }
}

/** Decline leaves the payment succeeded. The request record is not a refund. */
export function applyCancellationDecline(payment: Payment): Payment {
  assertCancellationReviewAllowed(payment);
  return buildPaymentRecord({
    ...payment,
    cancellation_status: 'declined',
  });
}

/** Approval stamps the refund. Callers must already have a Stripe refund id. */
export function applyCancellationApproval(
  payment: Payment,
  {
    stripe_refund_id,
    refunded_at,
    refunded_by,
  }: { stripe_refund_id: string; refunded_at?: string; refunded_by: string },
): Payment {
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
}

/** Builds a payments/{id} document. Season is derived from paid_at; callers cannot override it. */
export function buildPaymentRecord(input: PaymentInput): Payment {
  const data = input as unknown as Record<string, unknown>;
  assertNoCardData(data);
  for (const key of Object.keys(data)) {
    if (data[key] !== undefined && !PAYMENT_FIELD_SET.has(key)) {
      throw new Error(`Unknown payment field ${key}`);
    }
  }

  const type = input.type;
  if (!isPaymentType(type)) {
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
  if (!isPaymentState(state)) {
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
    if (!isCancellationStatus(cancellationStatus)) {
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

  const record: Payment = {
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

  if (input.stripe_refund_id)
    record.stripe_refund_id = requireNonEmptyString(input.stripe_refund_id, 'stripe_refund_id');
  if (hasCancellation) {
    record.cancellation_requested_at = requireNonEmptyString(cancellationAt, 'cancellation_requested_at');
    record.cancellation_requested_by = requireNonEmptyString(cancellationBy, 'cancellation_requested_by');
    record.cancellation_status = cancellationStatus;
  }
  if (input.refunded_at) record.refunded_at = requireNonEmptyString(input.refunded_at, 'refunded_at');
  if (input.refunded_by) record.refunded_by = requireNonEmptyString(input.refunded_by, 'refunded_by');
  return record;
}
