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

const court = {
  court_key: 'new-park-tennis',
  name: 'New Park Tennis',
  zone: 'Etobicoke',
  created_by: SUPER_ADMIN,
  created_at: '2026-09-11T12:00:00.000Z',
  updated_by: SUPER_ADMIN,
  updated_at: '2026-09-11T12:00:00.000Z',
};

const audit = {
  court_key: 'new-park-tennis',
  name: 'New Park Tennis',
  actor_uid: SUPER_ADMIN,
  before: null,
  after: { name: 'New Park Tennis', zone: 'Etobicoke', lat: null, lng: null },
  created_at: '2026-09-11T12:00:00.000Z',
};

describe('runtime court resolution authorization', () => {
  test('members can read overlay courts and nobody can write them from the client', async () => {
    await seedDoc('court_resolutions/new-park-tennis', court);

    await assertSucceeds(getDoc(doc(dbFor('member-a'), 'court_resolutions/new-park-tennis')));
    await assertFails(getDoc(doc(anonDb(), 'court_resolutions/new-park-tennis')));
    await assertFails(setDoc(doc(dbFor(SUPER_ADMIN), 'court_resolutions/forged'), court));
    await assertFails(updateDoc(doc(dbFor(SUPER_ADMIN), 'court_resolutions/new-park-tennis'), { zone: 'North York' }));
    await assertFails(deleteDoc(doc(dbFor('member-a'), 'court_resolutions/new-park-tennis')));
  });

  test('audit rows are super-admin readable and client-immutable', async () => {
    await seedDoc('court_resolution_audit/audit-1', audit);

    await assertSucceeds(getDoc(doc(dbFor(SUPER_ADMIN), 'court_resolution_audit/audit-1')));
    await assertFails(getDoc(doc(dbFor('member-a'), 'court_resolution_audit/audit-1')));
    await assertFails(setDoc(doc(dbFor(SUPER_ADMIN), 'court_resolution_audit/forged'), audit));
    await assertFails(updateDoc(doc(dbFor(SUPER_ADMIN), 'court_resolution_audit/audit-1'), { actor_uid: 'member-a' }));
  });
});
