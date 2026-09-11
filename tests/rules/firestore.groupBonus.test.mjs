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

const event = {
  id: 'owned-a',
  creator_id: 'organizer-a',
  title: 'Owned A',
};

const match = {
  event_id: 'owned-a',
  category: 'singles',
  tournament_choice: 'Singles',
  format: 'rr',
  round: 'RR',
  rr_group: 0,
  status: 'pending',
  player_1_uid: 'member-a',
  player_2_uid: 'member-b',
};

const audit = {
  event_id: 'owned-a',
  rr_group: 0,
  actor_uid: 'organizer-a',
  action: 'award',
  before: { awarded: false, mixed: false },
  after: { awarded: true, mixed: false },
  player_uids: ['member-a', 'member-b'],
  match_ids: ['rr-1'],
  points_delta: 5,
  created_at: '2026-09-11T12:00:00.000Z',
};

describe('Round Robin group bonus authorization', () => {
  test('clients cannot stamp or unstamp rr_groupbonus', async () => {
    await seedDoc('preferences/organizer-a', { uid: 'organizer-a', event_creator: true });
    await seedDoc('events/owned-a', event);
    await seedDoc('matches/rr-1', match);
    await seedDoc('matches/rr-stamped', { ...match, rr_groupbonus: true });

    await assertFails(setDoc(doc(dbFor('organizer-a'), 'matches/rr-new'), { ...match, rr_groupbonus: true }));
    await assertFails(updateDoc(doc(dbFor('organizer-a'), 'matches/rr-1'), { rr_groupbonus: true }));
    await assertFails(updateDoc(doc(dbFor('organizer-a'), 'matches/rr-stamped'), { rr_groupbonus: false }));
    await assertSucceeds(updateDoc(doc(dbFor('organizer-a'), 'matches/rr-stamped'), { rr_group_label: 'Group A' }));
  });

  test('audit rows are super-admin readable and client-immutable', async () => {
    await seedDoc('rr_group_bonus_audit/audit-1', audit);

    await assertSucceeds(getDoc(doc(dbFor(SUPER_ADMIN), 'rr_group_bonus_audit/audit-1')));
    await assertFails(getDoc(doc(dbFor('organizer-a'), 'rr_group_bonus_audit/audit-1')));
    await assertFails(setDoc(doc(dbFor(SUPER_ADMIN), 'rr_group_bonus_audit/forged'), audit));
    await assertFails(updateDoc(doc(dbFor(SUPER_ADMIN), 'rr_group_bonus_audit/audit-1'), { actor_uid: 'member-a' }));
  });
});
