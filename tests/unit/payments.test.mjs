import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CANCELLATION_STATUSES,
  CANCELLATION_WINDOW_DAYS,
  PAYMENT_CURRENCY,
  PAYMENT_FIELDS,
  PAYMENT_SEASONS,
  PAYMENT_STATES,
  PAYMENT_TIME_ZONE,
  PAYMENT_TYPES,
  PAYMENTS_COLLECTION,
  applyCancellationApproval,
  applyCancellationDecline,
  applyCancellationRequest,
  assertCancellationRequestAllowed,
  assertCancellationReviewAllowed,
  assertNoCardData,
  buildPaymentRecord,
  canOfferCancellation,
  hasContributorBadge,
  seasonFromDate,
} from '../../src/features/payments/paymentDocument.ts';

const member = {
  id: 'donation-succeeded',
  uid: 'member-a',
  user_name: 'Synthetic Member',
  stripe_checkout_session_id: 'cs_test_succeeded',
  stripe_payment_intent_id: 'pi_test_succeeded',
};

test('payments collection records donations and court bookings without card data', () => {
  assert.equal(PAYMENTS_COLLECTION, 'payments');
  assert.deepEqual([...PAYMENT_TYPES], ['donation', 'court booking']);
  assert.deepEqual([...PAYMENT_SEASONS], ['summer', 'winter']);
  assert.deepEqual([...PAYMENT_STATES], ['succeeded', 'refunded']);
  assert.deepEqual([...CANCELLATION_STATUSES], ['requested', 'approved', 'declined']);
  assert.equal(PAYMENT_CURRENCY, 'cad');
  assert.equal(PAYMENT_TIME_ZONE, 'America/Toronto');
  assert.ok(PAYMENT_FIELDS.includes('stripe_payment_intent_id'));
  assert.ok(!PAYMENT_FIELDS.some((field) => /card|cvc|cvv|pan|expir/i.test(field)));
  assert.throws(() => assertNoCardData({ card_number: '4242' }), /card data/);
});

test('a May payment is summer and a January payment is winter', () => {
  assert.equal(seasonFromDate('2026-05-12T15:01:00.000Z'), 'summer');
  assert.equal(seasonFromDate('2026-11-30T23:00:00.000Z'), 'summer');
  assert.equal(seasonFromDate('2026-01-08T15:01:00.000Z'), 'winter');
  assert.equal(seasonFromDate('2026-04-30T20:00:00.000Z'), 'winter');
  assert.equal(seasonFromDate('2026-12-01T05:00:00.000Z'), 'winter');
  // 2026-05-01T03:59:59Z is still 30 April in America/Toronto.
  assert.equal(seasonFromDate('2026-05-01T03:59:59.000Z'), 'winter');
  assert.equal(seasonFromDate('2026-05-01T04:00:00.000Z'), 'summer');
});

test('one record covers a donation, a cancellation request, a refund, and a court booking', () => {
  const donation = buildPaymentRecord({
    ...member,
    type: 'donation',
    amount: 25,
    paid_at: '2026-05-12T15:01:00.000Z',
  });
  assert.equal(donation.type, 'donation');
  assert.equal(donation.season, 'summer');
  assert.equal(donation.state, 'succeeded');
  assert.equal(donation.currency, 'cad');
  assert.equal(donation.cancellation_status, undefined);

  const requested = buildPaymentRecord({
    ...member,
    id: 'donation-cancel-requested',
    type: 'donation',
    amount: 50,
    paid_at: '2026-01-08T15:01:00.000Z',
    stripe_checkout_session_id: 'cs_test_requested',
    stripe_payment_intent_id: 'pi_test_requested',
    cancellation_requested_at: '2026-01-20T12:00:00.000Z',
    cancellation_requested_by: 'member-a',
    cancellation_status: 'requested',
  });
  assert.equal(requested.season, 'winter');
  assert.equal(requested.state, 'succeeded');
  assert.equal(requested.cancellation_status, 'requested');

  const refunded = buildPaymentRecord({
    ...member,
    id: 'donation-refunded',
    uid: 'opponent-a',
    user_name: 'Synthetic Opponent',
    type: 'donation',
    amount: 25,
    paid_at: '2026-05-12T16:01:00.000Z',
    state: 'refunded',
    stripe_checkout_session_id: 'cs_test_refunded',
    stripe_payment_intent_id: 'pi_test_refunded',
    stripe_refund_id: 're_test_refunded',
    cancellation_requested_at: '2026-05-20T12:00:00.000Z',
    cancellation_requested_by: 'opponent-a',
    cancellation_status: 'approved',
    refunded_at: '2026-05-21T09:00:00.000Z',
    refunded_by: 'organizer-a',
  });
  assert.equal(refunded.state, 'refunded');
  assert.equal(refunded.season, 'summer');
  assert.equal(refunded.stripe_refund_id, 're_test_refunded');

  const booking = buildPaymentRecord({
    ...member,
    id: 'court-booking',
    type: 'court booking',
    amount: 40,
    paid_at: '2026-01-15T15:01:00.000Z',
    stripe_checkout_session_id: 'cs_test_booking',
    stripe_payment_intent_id: 'pi_test_booking',
  });
  assert.equal(booking.type, 'court booking');
  assert.equal(booking.season, 'winter');
  assert.deepEqual(Object.keys(booking).sort(), [
    'amount',
    'created_at',
    'currency',
    'id',
    'paid_at',
    'season',
    'state',
    'stripe_checkout_session_id',
    'stripe_payment_intent_id',
    'type',
    'uid',
    'user_name',
  ]);
});

test('the builder rejects card fields, a forged season, and a court-booking cancellation', () => {
  assert.throws(
    () =>
      buildPaymentRecord({
        ...member,
        type: 'donation',
        amount: 25,
        paid_at: '2026-05-12T15:01:00.000Z',
        card_cvc: '123',
      }),
    /card data/,
  );
  assert.throws(
    () =>
      buildPaymentRecord({
        ...member,
        type: 'donation',
        amount: 25,
        paid_at: '2026-05-12T15:01:00.000Z',
        season: 'winter',
      }),
    /must be summer/,
  );
  assert.throws(
    () =>
      buildPaymentRecord({
        ...member,
        type: 'court booking',
        amount: 40,
        paid_at: '2026-01-15T15:01:00.000Z',
        cancellation_status: 'requested',
        cancellation_requested_at: '2026-01-16T00:00:00.000Z',
        cancellation_requested_by: 'member-a',
      }),
    /no cancellation path/,
  );
});

const now = '2026-09-11T12:00:00.000Z';
const donationAt = (paidAt) =>
  buildPaymentRecord({
    ...member,
    type: 'donation',
    amount: 25,
    paid_at: paidAt,
  });

test('a donation inside 90 days can request cancellation and a court booking cannot', () => {
  assert.equal(CANCELLATION_WINDOW_DAYS, 90);
  const inside = donationAt('2026-08-01T12:00:00.000Z');
  const exact = donationAt('2026-06-13T12:00:00.000Z');
  const past = donationAt('2026-06-13T11:59:59.999Z');
  const booking = buildPaymentRecord({
    ...member,
    id: 'court-booking',
    type: 'court booking',
    amount: 40,
    paid_at: '2026-09-01T12:00:00.000Z',
    stripe_checkout_session_id: 'cs_test_booking',
    stripe_payment_intent_id: 'pi_test_booking',
  });

  assert.equal(canOfferCancellation(inside, now), true);
  assert.equal(canOfferCancellation(exact, now), true);
  assert.equal(canOfferCancellation(past, now), false);
  assert.equal(canOfferCancellation(booking, now), false);

  const requested = applyCancellationRequest(inside, { uid: 'member-a', now, requestedAt: now });
  assert.equal(requested.cancellation_status, 'requested');
  assert.equal(requested.cancellation_requested_by, 'member-a');
  assert.equal(requested.state, 'succeeded');

  assert.throws(() => assertCancellationRequestAllowed(booking, { uid: 'member-a', now }), /no cancellation path/);
  assert.throws(() => applyCancellationRequest(booking, { uid: 'member-a', now }), /no cancellation path/);
  assert.throws(() => applyCancellationRequest(past, { uid: 'member-a', now }), /90 days/);
  assert.throws(() => applyCancellationRequest(inside, { uid: 'member-b', now }), /another member/);
});

test('the Contributor badge is derived from unrefunded donations, never a stored flag', () => {
  assert.ok(!PAYMENT_FIELDS.some((field) => /contributor|badge/i.test(field)));
  assert.equal(hasContributorBadge([]), false);
  assert.equal(hasContributorBadge(undefined), false);

  const donation = donationAt('2026-08-01T12:00:00.000Z');
  const requested = applyCancellationRequest(donation, { uid: 'member-a', now, requestedAt: now });
  const refunded = buildPaymentRecord({
    ...member,
    id: 'donation-refunded',
    type: 'donation',
    amount: 25,
    paid_at: '2026-05-12T16:01:00.000Z',
    state: 'refunded',
    stripe_checkout_session_id: 'cs_test_refunded',
    stripe_payment_intent_id: 'pi_test_refunded',
    stripe_refund_id: 're_test_refunded',
    cancellation_requested_at: '2026-05-20T12:00:00.000Z',
    cancellation_requested_by: 'member-a',
    cancellation_status: 'approved',
    refunded_at: '2026-05-21T09:00:00.000Z',
    refunded_by: 'organizer-a',
  });
  const booking = buildPaymentRecord({
    ...member,
    id: 'court-booking',
    type: 'court booking',
    amount: 40,
    paid_at: '2026-09-01T12:00:00.000Z',
    stripe_checkout_session_id: 'cs_test_booking',
    stripe_payment_intent_id: 'pi_test_booking',
  });
  const kept = donationAt('2026-07-01T12:00:00.000Z');
  const second = buildPaymentRecord({
    ...member,
    id: 'donation-second',
    type: 'donation',
    amount: 10,
    paid_at: '2026-06-01T12:00:00.000Z',
    stripe_checkout_session_id: 'cs_test_second',
    stripe_payment_intent_id: 'pi_test_second',
  });

  assert.equal(hasContributorBadge([donation]), true);
  assert.equal(hasContributorBadge([requested]), true);
  assert.equal(hasContributorBadge([refunded]), false);
  assert.equal(hasContributorBadge([booking]), false);
  assert.equal(hasContributorBadge([refunded, kept, second]), true);
  assert.equal(hasContributorBadge([refunded, booking]), false);
  assert.ok(!('contributor' in donation));
  assert.ok(!('badge' in donation));
});

test('approval stamps a refund and decline leaves the payment succeeded', () => {
  const requested = applyCancellationRequest(donationAt('2026-08-01T12:00:00.000Z'), {
    uid: 'member-a',
    now,
    requestedAt: now,
  });
  assert.doesNotThrow(() => assertCancellationReviewAllowed(requested));

  const declined = applyCancellationDecline(requested);
  assert.equal(declined.state, 'succeeded');
  assert.equal(declined.cancellation_status, 'declined');
  assert.equal(declined.stripe_refund_id, undefined);

  const refunded = applyCancellationApproval(requested, {
    stripe_refund_id: 're_test_616',
    refunded_at: now,
    refunded_by: 'organizer-a',
  });
  assert.equal(refunded.state, 'refunded');
  assert.equal(refunded.cancellation_status, 'approved');
  assert.equal(refunded.stripe_refund_id, 're_test_616');
  assert.equal(refunded.refunded_by, 'organizer-a');

  assert.throws(
    () =>
      applyCancellationApproval(declined, {
        stripe_refund_id: 're_test_616',
        refunded_at: now,
        refunded_by: 'organizer-a',
      }),
    /pending cancellation request/,
  );
  assert.throws(() => applyCancellationDecline(donationAt('2026-08-01T12:00:00.000Z')), /pending cancellation request/);
});
