const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const {
  PAYMENT_CURRENCY,
  PAYMENT_TYPES,
  PAYMENTS_COLLECTION,
  applyCancellationRequest,
  assertCancellationRequestAllowed,
  buildPaymentRecord,
  canOfferCancellation,
  hasContributorBadge,
  seasonFromDate,
} = require('../lib/payments');

test('Functions payment helper stamps type and season and refuses card data', () => {
  assert.equal(PAYMENTS_COLLECTION, 'payments');
  assert.deepEqual([...PAYMENT_TYPES], ['donation', 'court booking']);
  assert.equal(PAYMENT_CURRENCY, 'cad');
  assert.equal(seasonFromDate('2026-05-12T15:01:00.000Z'), 'summer');
  assert.equal(seasonFromDate('2026-01-08T15:01:00.000Z'), 'winter');

  const donation = buildPaymentRecord({
    id: 'donation-succeeded',
    uid: 'member-a',
    user_name: 'Synthetic Member',
    type: 'donation',
    amount: 25,
    paid_at: '2026-05-12T15:01:00.000Z',
    stripe_checkout_session_id: 'cs_test_succeeded',
    stripe_payment_intent_id: 'pi_test_succeeded',
  });
  assert.equal(donation.season, 'summer');
  assert.equal(donation.state, 'succeeded');

  const booking = buildPaymentRecord({
    id: 'court-booking',
    uid: 'member-a',
    user_name: 'Synthetic Member',
    type: 'court booking',
    amount: 40,
    paid_at: '2026-01-15T15:01:00.000Z',
    stripe_checkout_session_id: 'cs_test_booking',
    stripe_payment_intent_id: 'pi_test_booking',
  });
  assert.equal(booking.type, 'court booking');
  assert.equal(booking.season, 'winter');

  assert.throws(
    () =>
      buildPaymentRecord({
        id: 'bad',
        uid: 'member-a',
        user_name: 'Synthetic Member',
        type: 'donation',
        amount: 25,
        paid_at: '2026-05-12T15:01:00.000Z',
        stripe_checkout_session_id: 'cs_test',
        stripe_payment_intent_id: 'pi_test',
        card_number: '4242424242424242',
      }),
    /card data/,
  );
});

test('the server refuses a court-booking cancellation either way', () => {
  const now = '2026-09-11T12:00:00.000Z';
  const donation = buildPaymentRecord({
    id: 'donation-succeeded',
    uid: 'member-a',
    user_name: 'Synthetic Member',
    type: 'donation',
    amount: 25,
    paid_at: '2026-08-01T12:00:00.000Z',
    stripe_checkout_session_id: 'cs_test_succeeded',
    stripe_payment_intent_id: 'pi_test_succeeded',
  });
  const booking = buildPaymentRecord({
    id: 'court-booking',
    uid: 'member-a',
    user_name: 'Synthetic Member',
    type: 'court booking',
    amount: 40,
    paid_at: '2026-09-01T12:00:00.000Z',
    stripe_checkout_session_id: 'cs_test_booking',
    stripe_payment_intent_id: 'pi_test_booking',
  });
  const late = buildPaymentRecord({
    id: 'donation-late',
    uid: 'member-a',
    user_name: 'Synthetic Member',
    type: 'donation',
    amount: 25,
    paid_at: '2026-01-01T12:00:00.000Z',
    stripe_checkout_session_id: 'cs_test_late',
    stripe_payment_intent_id: 'pi_test_late',
  });

  assert.equal(canOfferCancellation(donation, now), true);
  assert.equal(canOfferCancellation(booking, now), false);
  assert.doesNotThrow(() => assertCancellationRequestAllowed(donation, { uid: 'member-a', now }));
  assert.throws(() => assertCancellationRequestAllowed(booking, { uid: 'member-a', now }), /no cancellation path/);
  assert.throws(() => applyCancellationRequest(booking, { uid: 'member-a', now }), /no cancellation path/);
  assert.throws(() => applyCancellationRequest(late, { uid: 'member-a', now }), /90 days/);
  assert.equal(applyCancellationRequest(donation, { uid: 'member-a', now }).cancellation_status, 'requested');
  assert.equal(hasContributorBadge([donation]), true);
  assert.equal(hasContributorBadge([applyCancellationRequest(donation, { uid: 'member-a', now })]), true);
  assert.equal(hasContributorBadge([booking]), false);

  assert.throws(() => applyCancellationRequest(donation, { uid: 'member-b', now }), /another member/);
  const pending = applyCancellationRequest(donation, { uid: 'member-a', now });
  assert.throws(
    () => applyCancellationRequest(pending, { uid: 'member-a', now }),
    /Only a succeeded donation with no cancellation request can be cancelled/,
  );

  const callable = readFileSync(join(__dirname, '../payments.js'), 'utf8');
  const index = readFileSync(join(__dirname, '../index.js'), 'utf8');
  assert.match(callable, /exports.requestPaymentCancellation/);
  assert.match(callable, /applyCancellationRequest/);
  assert.match(index, /require\('\.\/payments'\)/);
});

test('cancel and refund are one event and the badge follows the refund', () => {
  const {
    applyRefund,
    countsTowardContributorBadge,
    hasContributorBadge,
    isRefundedPayment,
  } = require('../lib/refundMeaning');

  const donation = buildPaymentRecord({
    id: 'donation-succeeded',
    uid: 'member-a',
    user_name: 'Synthetic Member',
    type: 'donation',
    amount: 25,
    paid_at: '2026-08-01T12:00:00.000Z',
    stripe_checkout_session_id: 'cs_test_succeeded',
    stripe_payment_intent_id: 'pi_test_succeeded',
  });
  const now = '2026-09-11T12:00:00.000Z';
  const pending = applyCancellationRequest(donation, { uid: 'member-a', now });
  assert.equal(hasContributorBadge([pending]), true);
  assert.equal(isRefundedPayment(pending), false);

  const refunded = applyRefund(pending, {
    stripeRefundId: 're_test_fn',
    refundedBy: 'organizer-a',
    refundedAt: now,
  });
  assert.equal(refunded.state, 'refunded');
  assert.equal(refunded.stripe_refund_id, 're_test_fn');
  assert.equal(refunded.cancellation_status, 'approved');
  assert.equal(countsTowardContributorBadge(refunded), false);
  assert.equal(hasContributorBadge([refunded]), false);
  assert.equal(
    hasContributorBadge([
      donation,
      refunded,
      buildPaymentRecord({
        ...donation,
        id: 'donation-three',
        paid_at: '2026-08-15T12:00:00.000Z',
        stripe_checkout_session_id: 'cs_three',
        stripe_payment_intent_id: 'pi_three',
      }),
    ]),
    true,
  );
});
