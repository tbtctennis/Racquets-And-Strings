import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const here = dirname(fileURLToPath(import.meta.url));
const rules = await readFile(resolve(here, '../../firestore.rules'), 'utf8');
const SUPER_ADMIN = '7PvfzNtDmsOq5GLMieId7QRT7wH3';

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

const seedDoc = async (path, data) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
};

const projectionPath = (eventId, uid) => `events/${eventId}/preference_projections/${uid}`;

const consentedSlice = (uid, eventId, extra = {}) => ({
  uid,
  event_id: eventId,
  consented: true,
  preferred_courts: ['synthetic-court'],
  preferred_zone: 'north',
  availability_tags: ['weekday-evenings'],
  available_to_play: true,
  ...extra,
});

describe('consent-based event-scoped preference projection', () => {
  test('owner can write a consented slice; cross-member reads fail closed without same-event consent', async () => {
    await seedDoc('events/doubles-event', { creator_id: 'organizer-a' });
    const path = projectionPath('doubles-event', 'member-a');

    await assertSucceeds(setDoc(doc(dbFor('member-a'), path), consentedSlice('member-a', 'doubles-event')));
    await assertSucceeds(getDoc(doc(dbFor('member-a'), path)));
    await assertFails(getDoc(doc(dbFor('member-b'), path)));
    await assertFails(getDoc(doc(anonDb(), path)));
  });

  test('same-event consented members and event managers can read; other events stay closed', async () => {
    await seedDoc('events/doubles-event', { creator_id: 'organizer-a', organizer_ids: ['organizer-b'] });
    await seedDoc('events/other-event', { creator_id: 'organizer-a' });
    const pathA = projectionPath('doubles-event', 'member-a');
    const pathB = projectionPath('doubles-event', 'member-b');
    const otherPath = projectionPath('other-event', 'member-c');

    await assertSucceeds(setDoc(doc(dbFor('member-a'), pathA), consentedSlice('member-a', 'doubles-event')));
    await assertSucceeds(setDoc(doc(dbFor('member-b'), pathB), consentedSlice('member-b', 'doubles-event')));
    await assertSucceeds(setDoc(doc(dbFor('member-c'), otherPath), consentedSlice('member-c', 'other-event')));

    await assertSucceeds(getDoc(doc(dbFor('member-b'), pathA)));
    await assertSucceeds(getDoc(doc(dbFor('organizer-a'), pathA)));
    await assertSucceeds(getDoc(doc(dbFor('organizer-b'), pathA)));
    await assertSucceeds(getDoc(doc(dbFor(SUPER_ADMIN), pathA)));
    await assertFails(getDoc(doc(dbFor('member-c'), pathA)));
    await assertFails(getDoc(doc(dbFor('member-a'), otherPath)));
  });

  test('revocation and missing consent fail closed for cross-member reads', async () => {
    await seedDoc('events/doubles-event', { creator_id: 'organizer-a' });
    const pathA = projectionPath('doubles-event', 'member-a');
    const pathB = projectionPath('doubles-event', 'member-b');

    await assertSucceeds(setDoc(doc(dbFor('member-a'), pathA), consentedSlice('member-a', 'doubles-event')));
    await assertSucceeds(setDoc(doc(dbFor('member-b'), pathB), consentedSlice('member-b', 'doubles-event')));
    await assertSucceeds(updateDoc(doc(dbFor('member-a'), pathA), { consented: false }));

    await assertSucceeds(getDoc(doc(dbFor('member-a'), pathA)));
    await assertFails(getDoc(doc(dbFor('member-b'), pathA)));
    await assertFails(getDoc(doc(dbFor('organizer-a'), pathA)));

    await assertSucceeds(updateDoc(doc(dbFor('member-a'), pathA), { consented: true }));
    await assertSucceeds(deleteDoc(doc(dbFor('member-a'), pathA)));
    await assertFails(getDoc(doc(dbFor('member-b'), pathA)));
  });

  test('writes reject extra fields, identity mutation, missing events, and other owners', async () => {
    await seedDoc('events/doubles-event', { creator_id: 'organizer-a' });
    const path = projectionPath('doubles-event', 'member-a');
    const owner = dbFor('member-a');

    await assertFails(
      setDoc(doc(owner, projectionPath('missing-event', 'member-a')), consentedSlice('member-a', 'missing-event')),
    );
    await assertFails(setDoc(doc(dbFor('member-b'), path), consentedSlice('member-a', 'doubles-event')));
    await assertFails(
      setDoc(doc(owner, path), {
        ...consentedSlice('member-a', 'doubles-event'),
        email_notifications: false,
      }),
    );
    await assertFails(
      setDoc(doc(owner, path), {
        ...consentedSlice('member-a', 'doubles-event'),
        event_creator: true,
      }),
    );
    await assertFails(
      setDoc(doc(owner, path), {
        ...consentedSlice('member-a', 'doubles-event'),
        event_id: 'other-event',
      }),
    );
    await assertFails(
      setDoc(doc(owner, path), {
        uid: 'member-a',
        event_id: 'doubles-event',
      }),
    );
    await assertFails(
      setDoc(doc(owner, path), {
        ...consentedSlice('member-a', 'doubles-event'),
        availability_tags: Array.from({ length: 21 }, (_, index) => `tag-${index}`),
      }),
    );

    await assertSucceeds(setDoc(doc(owner, path), consentedSlice('member-a', 'doubles-event')));
    await assertFails(updateDoc(doc(owner, path), { event_id: 'other-event' }));
    await assertFails(updateDoc(doc(owner, path), { uid: 'member-b' }));
    await assertFails(updateDoc(doc(owner, path), { scheduling_preference: 'weeknights' }));
    await assertFails(deleteDoc(doc(dbFor('member-b'), path)));
    await assertFails(deleteDoc(doc(dbFor('organizer-a'), path)));
  });

  test('public_preferences remains deny-all', async () => {
    await seedDoc('public_preferences/member-a', {
      uid: 'member-a',
      preferred_courts: ['synthetic-court'],
    });
    await assertFails(getDoc(doc(anonDb(), 'public_preferences/member-a')));
    await assertFails(getDoc(doc(dbFor('member-a'), 'public_preferences/member-a')));
    await assertFails(getDoc(doc(dbFor('member-b'), 'public_preferences/member-a')));
    await assertFails(
      setDoc(doc(dbFor('member-a'), 'public_preferences/member-a'), {
        uid: 'member-a',
        consented: true,
      }),
    );
  });
});
