import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';

const here = dirname(fileURLToPath(import.meta.url));
const rules = await readFile(resolve(here, '../../firestore.rules'), 'utf8');

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'rands-local',
    firestore: { rules },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

const dbFor = (uid) => testEnv.authenticatedContext(uid).firestore();
const anonDb = () => testEnv.unauthenticatedContext().firestore();
const SUPER_ADMIN = '7PvfzNtDmsOq5GLMieId7QRT7wH3';

const seedDoc = async (path, data) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
};

const donation = {
  id: 'donation-succeeded',
  uid: 'member-a',
  user_name: 'Synthetic Member',
  type: 'donation',
  amount: 25,
  currency: 'cad',
  season: 'summer',
  state: 'succeeded',
  stripe_checkout_session_id: 'cs_test_succeeded',
  stripe_payment_intent_id: 'pi_test_succeeded',
  created_at: '2026-05-12T15:01:00.000Z',
  paid_at: '2026-05-12T15:01:00.000Z',
};

const requested = {
  id: 'donation-cancel-requested',
  uid: 'member-a',
  user_name: 'Synthetic Member',
  type: 'donation',
  amount: 50,
  currency: 'cad',
  season: 'winter',
  state: 'succeeded',
  stripe_checkout_session_id: 'cs_test_requested',
  stripe_payment_intent_id: 'pi_test_requested',
  created_at: '2026-01-08T15:01:00.000Z',
  paid_at: '2026-01-08T15:01:00.000Z',
  cancellation_requested_at: '2026-01-20T12:00:00.000Z',
  cancellation_requested_by: 'member-a',
  cancellation_status: 'requested',
};

const refunded = {
  id: 'donation-refunded',
  uid: 'opponent-a',
  user_name: 'Synthetic Opponent',
  type: 'donation',
  amount: 25,
  currency: 'cad',
  season: 'summer',
  state: 'refunded',
  stripe_checkout_session_id: 'cs_test_refunded',
  stripe_payment_intent_id: 'pi_test_refunded',
  stripe_refund_id: 're_test_refunded',
  created_at: '2026-05-12T16:01:00.000Z',
  paid_at: '2026-05-12T16:01:00.000Z',
  cancellation_requested_at: '2026-05-20T12:00:00.000Z',
  cancellation_requested_by: 'opponent-a',
  cancellation_status: 'approved',
  refunded_at: '2026-05-21T09:00:00.000Z',
  refunded_by: 'organizer-a',
};

const booking = {
  id: 'court-booking',
  uid: 'member-a',
  user_name: 'Synthetic Member',
  type: 'court booking',
  amount: 40,
  currency: 'cad',
  season: 'winter',
  state: 'succeeded',
  stripe_checkout_session_id: 'cs_test_booking',
  stripe_payment_intent_id: 'pi_test_booking',
  created_at: '2026-01-15T15:01:00.000Z',
  paid_at: '2026-01-15T15:01:00.000Z',
};

describe('payments collection authorization', () => {
  test('only a function can create or change a payment record', async () => {
    await seedDoc('payments/donation-succeeded', donation);

    await assertFails(setDoc(doc(dbFor('member-a'), 'payments/client-write'), donation));
    await assertFails(setDoc(doc(dbFor(SUPER_ADMIN), 'payments/admin-write'), donation));
    await assertFails(setDoc(doc(anonDb(), 'payments/anon-write'), donation));
    await assertFails(updateDoc(doc(dbFor('member-a'), 'payments/donation-succeeded'), { state: 'refunded' }));
    await assertFails(
      updateDoc(doc(dbFor('member-a'), 'payments/donation-succeeded'), {
        cancellation_status: 'requested',
      }),
    );
    await assertFails(deleteDoc(doc(dbFor('member-a'), 'payments/donation-succeeded')));
    await assertFails(deleteDoc(doc(dbFor(SUPER_ADMIN), 'payments/donation-succeeded')));

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await assertSucceeds(setDoc(doc(context.firestore(), 'payments/fn-write'), donation));
      await assertSucceeds(updateDoc(doc(context.firestore(), 'payments/fn-write'), { state: 'succeeded' }));
    });
  });

  test('a member reads their own donation, request, refund, and court-booking rows', async () => {
    await seedDoc('payments/donation-succeeded', donation);
    await seedDoc('payments/donation-cancel-requested', requested);
    await seedDoc('payments/donation-refunded', refunded);
    await seedDoc('payments/court-booking', booking);

    const ownDonation = await assertSucceeds(getDoc(doc(dbFor('member-a'), 'payments/donation-succeeded')));
    const ownRequest = await assertSucceeds(getDoc(doc(dbFor('member-a'), 'payments/donation-cancel-requested')));
    const ownBooking = await assertSucceeds(getDoc(doc(dbFor('member-a'), 'payments/court-booking')));
    assertEqual(ownDonation.data().type, 'donation');
    assertEqual(ownDonation.data().season, 'summer');
    assertEqual(ownRequest.data().cancellation_status, 'requested');
    assertEqual(ownRequest.data().season, 'winter');
    assertEqual(ownBooking.data().type, 'court booking');

    await assertFails(getDoc(doc(dbFor('member-a'), 'payments/donation-refunded')));
    await assertSucceeds(getDoc(doc(dbFor('opponent-a'), 'payments/donation-refunded')));
    await assertFails(getDoc(doc(dbFor('member-b'), 'payments/donation-succeeded')));
    await assertFails(getDoc(doc(dbFor(SUPER_ADMIN), 'payments/donation-succeeded')));
    await assertFails(getDoc(doc(anonDb(), 'payments/donation-succeeded')));

    await assertSucceeds(getDocs(query(collection(dbFor('member-a'), 'payments'), where('uid', '==', 'member-a'))));
    await assertFails(getDocs(query(collection(dbFor('member-a'), 'payments'), where('uid', '==', 'opponent-a'))));
    await assertFails(getDocs(collection(dbFor('member-a'), 'payments')));
  });
});

function assertEqual(actual, expected) {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, received ${actual}`);
  }
}
