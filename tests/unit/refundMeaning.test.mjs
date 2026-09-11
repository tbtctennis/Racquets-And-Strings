import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { PaymentsList } from '../../src/features/payments/PaymentsList.tsx';
import { applyCancellationRequest, buildPaymentRecord } from '../../src/features/payments/paymentDocument.ts';
import {
  applyRefund,
  countsTowardContributorBadge,
  describePaymentRefund,
  hasContributorBadge,
  isRefundedPayment,
} from '../../src/features/payments/refundMeaning.ts';

const member = {
  uid: 'member-a',
  user_name: 'Synthetic Member',
};

const donation = (id, extras = {}) =>
  buildPaymentRecord({
    ...member,
    id,
    type: 'donation',
    amount: 25,
    paid_at: '2026-08-01T12:00:00.000Z',
    stripe_checkout_session_id: `cs_${id}`,
    stripe_payment_intent_id: `pi_${id}`,
    ...extras,
  });

const now = '2026-09-11T12:00:00.000Z';

test('cancel and refund are one event: state refunded with stripe_refund_id', () => {
  const succeeded = donation('only');
  assert.equal(isRefundedPayment(succeeded), false);
  assert.equal(succeeded.state, 'succeeded');
  assert.equal(succeeded.stripe_refund_id, undefined);

  const requested = applyCancellationRequest(succeeded, { uid: 'member-a', now });
  assert.equal(requested.state, 'succeeded');
  assert.equal(requested.cancellation_status, 'requested');
  assert.equal(isRefundedPayment(requested), false);

  const refunded = applyRefund(requested, {
    stripeRefundId: 're_test_only',
    refundedBy: 'organizer-a',
    refundedAt: now,
  });
  assert.equal(refunded.state, 'refunded');
  assert.equal(refunded.stripe_refund_id, 're_test_only');
  assert.equal(refunded.cancellation_status, 'approved');
  assert.equal(isRefundedPayment(refunded), true);
  assert.equal(describePaymentRefund(refunded), 'refunded · re_test_only');

  assert.throws(
    () =>
      buildPaymentRecord({
        ...succeeded,
        state: 'refunded',
        refunded_at: now,
        refunded_by: 'organizer-a',
      }),
    /stripe_refund_id/,
  );
  assert.throws(
    () =>
      buildPaymentRecord({
        ...requested,
        cancellation_status: 'approved',
      }),
    /one event/,
  );
  assert.throws(
    () =>
      buildPaymentRecord({
        ...succeeded,
        stripe_refund_id: 're_orphan',
      }),
    /stripe_refund_id is only set/,
  );
});

test('a pending request leaves the badge alone; refunding the only donation removes it', () => {
  const only = donation('only');
  assert.equal(hasContributorBadge([only]), true);

  const pending = applyCancellationRequest(only, { uid: 'member-a', now });
  assert.equal(pending.cancellation_status, 'requested');
  assert.equal(countsTowardContributorBadge(pending), true);
  assert.equal(hasContributorBadge([pending]), true);

  const refunded = applyRefund(pending, {
    stripeRefundId: 're_test_only',
    refundedBy: 'organizer-a',
    refundedAt: now,
  });
  assert.equal(countsTowardContributorBadge(refunded), false);
  assert.equal(hasContributorBadge([refunded]), false);
});

test('a member with three donations who has one refunded keeps the badge', () => {
  const first = donation('one');
  const second = donation('two', { paid_at: '2026-08-08T12:00:00.000Z' });
  const third = donation('three', { paid_at: '2026-08-15T12:00:00.000Z' });
  const requested = applyCancellationRequest(second, { uid: 'member-a', now });
  const refunded = applyRefund(requested, {
    stripeRefundId: 're_test_two',
    refundedBy: 'organizer-a',
    refundedAt: now,
  });

  assert.equal(hasContributorBadge([first, refunded, third]), true);
  assert.equal(countsTowardContributorBadge(first), true);
  assert.equal(countsTowardContributorBadge(refunded), false);
  assert.equal(countsTowardContributorBadge(third), true);

  const booking = buildPaymentRecord({
    ...member,
    id: 'court-booking',
    type: 'court booking',
    amount: 40,
    paid_at: '2026-09-01T12:00:00.000Z',
    stripe_checkout_session_id: 'cs_booking',
    stripe_payment_intent_id: 'pi_booking',
  });
  assert.equal(countsTowardContributorBadge(booking), false);
  assert.equal(hasContributorBadge([refunded, booking]), false);
});

test('the payments list displays refunded and stripe_refund_id', () => {
  const refunded = applyRefund(applyCancellationRequest(donation('shown'), { uid: 'member-a', now }), {
    stripeRefundId: 're_test_shown',
    refundedBy: 'organizer-a',
    refundedAt: now,
  });
  const html = renderToStaticMarkup(React.createElement(PaymentsList, { items: [refunded], now }));
  assert.match(html, /refunded/);
  assert.match(html, /re_test_shown/);
  assert.doesNotMatch(html, /Request cancellation/);
});

test('the sprint document writes the refund-and-badge rule', async () => {
  const sprint = await readFile(new URL('../../docs/planning/sprints/d6-d9/SPRINT-D9.md', import.meta.url), 'utf8');
  assert.match(
    sprint,
    /Cancel and refund are\none event: `state` becomes `refunded` and `stripe_refund_id` is set together/s,
  );
  assert.match(sprint, /The\nbadge follows the \*\*refund\*\*, not the request, so a pending request changes nothing/s);
  assert.match(sprint, /A member\nkeeps the badge while any donation of theirs is still unrefunded/s);
});
