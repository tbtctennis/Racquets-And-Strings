import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PaymentsList } from '../../src/features/payments/PaymentsList.tsx';
import { buildPaymentRecord } from '../../src/features/payments/paymentDocument.ts';

const src = (relative) => readFile(new URL(`../../${relative}`, import.meta.url), 'utf8');

const now = '2026-09-11T12:00:00.000Z';
const member = {
  uid: 'member-a',
  user_name: 'Synthetic Member',
  stripe_checkout_session_id: 'cs_test',
  stripe_payment_intent_id: 'pi_test',
};

const donation = (id, paidAt, amount = 25) =>
  buildPaymentRecord({
    ...member,
    id,
    type: 'donation',
    amount,
    paid_at: paidAt,
    stripe_checkout_session_id: `cs_${id}`,
    stripe_payment_intent_id: `pi_${id}`,
  });

test('Payments sits in the sidebar and lists amount, date, season, type, and state', async () => {
  const menu = await src('src/components/HeaderMenu.tsx');
  const app = await src('src/App.tsx');
  const page = await src('src/pages/Payments.tsx');
  const list = await src('src/features/payments/PaymentsList.tsx');
  const hook = await src('src/features/payments/usePayments.ts');
  const callable = await src('functions/payments.js');
  const rules = await src('firestore.rules');

  assert.match(menu, /to="\/payments"/);
  assert.match(menu, />Payments</);
  assert.match(app, /path="\/payments"/);
  assert.match(page, /<PaymentsList/);
  assert.match(list, /formatPaymentAmount\(payment\.amount/);
  assert.match(list, /formatPaymentDate\(payment\.paid_at\)/);
  assert.match(list, /payment\.season/);
  assert.match(list, /payment\.type/);
  assert.match(list, /describePaymentRefund\(payment\)/);
  assert.match(list, /Request cancellation/);
  assert.match(hook, /where\('uid', '==', user\.uid\)/);
  assert.match(hook, /httpsCallable[\s\S]*requestPaymentCancellation/);
  assert.match(callable, /exports.requestPaymentCancellation/);
  assert.doesNotMatch(hook, /setDoc|updateDoc|addDoc/);
  assert.doesNotMatch(page, /setDoc|updateDoc|addDoc/);
  assert.match(rules, /match \/payments\/\{paymentId\}/);
  assert.match(rules, /resource\.data\.uid == request\.auth\.uid/);
  assert.match(rules, /allow write: if false;/);
});

test('a donation inside 90 days offers Request cancellation; a late donation and a court booking do not', () => {
  const items = [
    donation('inside', '2026-08-01T12:00:00.000Z', 25),
    donation('late', '2026-01-08T12:00:00.000Z', 50),
    buildPaymentRecord({
      ...member,
      id: 'court-booking',
      type: 'court booking',
      amount: 40,
      paid_at: '2026-09-01T12:00:00.000Z',
      stripe_checkout_session_id: 'cs_booking',
      stripe_payment_intent_id: 'pi_booking',
    }),
  ];

  const html = renderToStaticMarkup(React.createElement(PaymentsList, { items, now }));

  assert.match(html, /\$25\.00|CA\$25\.00/);
  assert.match(html, /\$50\.00|CA\$50\.00/);
  assert.match(html, /\$40\.00|CA\$40\.00/);
  assert.match(html, /summer|winter/);
  assert.match(html, /donation/);
  assert.match(html, /court booking/);
  assert.match(html, /succeeded/);
  assert.equal((html.match(/>Request cancellation</g) || []).length, 1);
  assert.match(html, /Request cancellation of (?:CA)?\$25\.00 donation/);
  assert.doesNotMatch(html, /Request cancellation of (?:CA)?\$50\.00/);
  assert.doesNotMatch(html, /Request cancellation of (?:CA)?\$40\.00/);
});

test('a requested cancellation is visible as pending and is not a refund', () => {
  const items = [
    buildPaymentRecord({
      ...member,
      id: 'requested',
      type: 'donation',
      amount: 25,
      paid_at: '2026-08-01T12:00:00.000Z',
      stripe_checkout_session_id: 'cs_requested',
      stripe_payment_intent_id: 'pi_requested',
      cancellation_requested_at: now,
      cancellation_requested_by: 'member-a',
      cancellation_status: 'requested',
    }),
    donation('inside', '2026-08-10T12:00:00.000Z', 30),
  ];

  const html = renderToStaticMarkup(React.createElement(PaymentsList, { items, now }));

  assert.match(html, />pending</);
  assert.doesNotMatch(html, /refunded/);
  assert.doesNotMatch(html, /Request cancellation of (?:CA)?\$25\.00/);
  assert.match(html, /Request cancellation of (?:CA)?\$30\.00 donation/);
  assert.equal((html.match(/>Request cancellation</g) || []).length, 1);
});
