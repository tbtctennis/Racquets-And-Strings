import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

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

const seedDoc = async (path, data) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
};

const audit = {
  event_id: 'owned-a',
  actor_uid: 'organizer-a',
  target_uids: ['organizer-b'],
  before: [],
  after: ['organizer-b'],
  created_at: '2026-09-11T12:00:00.000Z',
};

describe('organizer assignment authorization', () => {
  test('clients cannot write organizer_ids on create or update', async () => {
    await seedDoc('preferences/organizer-a', { uid: 'organizer-a', event_creator: true });
    await seedDoc('events/owned-a', {
      id: 'owned-a',
      creator_id: 'organizer-a',
      title: 'Owned A',
    });

    await assertFails(
      setDoc(doc(dbFor('organizer-a'), 'events/new-assigned'), {
        id: 'new-assigned',
        creator_id: 'organizer-a',
        title: 'New',
        organizer_ids: ['organizer-b'],
      }),
    );
    await assertFails(
      updateDoc(doc(dbFor('organizer-a'), 'events/owned-a'), {
        organizer_ids: ['organizer-b'],
      }),
    );
    await assertFails(
      updateDoc(doc(dbFor(SUPER_ADMIN), 'events/owned-a'), {
        organizer_ids: ['organizer-b'],
      }),
    );
    await assertSucceeds(updateDoc(doc(dbFor('organizer-a'), 'events/owned-a'), { title: 'Still owned' }));
  });

  test('audit rows are super-admin readable and client-immutable', async () => {
    await seedDoc('organizer_assignment_audit/audit-1', audit);

    await assertSucceeds(getDoc(doc(dbFor(SUPER_ADMIN), 'organizer_assignment_audit/audit-1')));
    await assertFails(getDoc(doc(dbFor('organizer-a'), 'organizer_assignment_audit/audit-1')));
    await assertFails(setDoc(doc(dbFor(SUPER_ADMIN), 'organizer_assignment_audit/forged'), audit));
    await assertFails(
      updateDoc(doc(dbFor(SUPER_ADMIN), 'organizer_assignment_audit/audit-1'), { actor_uid: 'member-a' }),
    );
  });
});
