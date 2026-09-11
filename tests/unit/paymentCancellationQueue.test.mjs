import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const src = (relative) => readFile(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('organizer cancellation queue reuses ReviewPanel and refunds through Functions', async () => {
  const queue = await src('src/features/tasks/ReviewQueue.tsx');
  const hook = await src('src/features/payments/usePayments.ts');
  const callable = await src('functions/payments.js');
  const refund = await src('functions/lib/paymentRefund.js');
  const rules = await src('firestore.rules');

  assert.match(queue, /from '\.\.\/\.\.\/components\/ReviewPanel'/);
  assert.match(queue, /title="Cancellation requests"/);
  assert.match(queue, /listPendingPaymentCancellations/);
  assert.match(queue, /reviewPaymentCancellation/);
  assert.match(queue, /Approve and refund/);
  assert.match(queue, /Decline, leave the payment intact/);
  assert.doesNotMatch(queue, /collection\(db, PAYMENTS_COLLECTION\)|collection\(db, 'payments'\)/);
  assert.doesNotMatch(queue, /setDoc|updateDoc|addDoc/);

  assert.match(hook, /httpsCallable[\s\S]*listPendingPaymentCancellations/);
  assert.match(hook, /httpsCallable[\s\S]*reviewPaymentCancellation/);
  assert.doesNotMatch(hook, /setDoc|updateDoc|addDoc/);

  assert.match(callable, /exports.reviewPaymentCancellation/);
  assert.match(callable, /exports.listPendingPaymentCancellations/);
  assert.match(refund, /STRIPE_REFUNDS_URL/);
  assert.match(refund, /Only an organizer can approve/);
  assert.match(refund, /leaves the request pending|leave the request pending/);

  assert.match(rules, /match \/payments\/\{paymentId\}/);
  assert.match(rules, /resource\.data\.uid == request\.auth\.uid/);
  assert.match(rules, /allow write: if false;/);
});
