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
  match_id: 'm1',
  actor_uid: 'organizer-a',
  action: 'correct',
  reason: 'Scorecard showed a different second set.',
  before: { winnerUid: 'member-a' },
  after: { winnerUid: 'member-a' },
  recorded_at: '2026-09-11T16:00:00.000Z',
};

describe('completed-result correction authorization', () => {
  test('clients cannot write completed match scores or forged audit rows', async () => {
    await seedDoc('preferences/organizer-a', { uid: 'organizer-a', event_creator: true });
    await seedDoc('events/owned-a', {
      id: 'owned-a',
      creator_id: 'organizer-a',
      title: 'Owned A',
    });
    await seedDoc('matches/m1', {
      event_id: 'owned-a',
      category: 'singles',
      tournament_choice: 'Singles',
      status: 'complete',
      winner_uid: 'member-a',
      player_1_uid: 'member-a',
      player_2_uid: 'member-b',
      set_1_player_1: 6,
      set_1_player_2: 4,
    });

    await assertFails(
      updateDoc(doc(dbFor('organizer-a'), 'matches/m1'), {
        winner_uid: 'member-b',
        set_1_player_1: 4,
        set_1_player_2: 6,
      }),
    );
    await assertFails(setDoc(doc(dbFor('organizer-a'), 'tournament_result_audit/forged'), audit));
    await assertFails(setDoc(doc(dbFor(SUPER_ADMIN), 'tournament_result_audit/forged'), audit));
  });

  test('audit rows are super-admin readable and client-immutable', async () => {
    await seedDoc('tournament_result_audit/audit-1', audit);

    await assertSucceeds(getDoc(doc(dbFor(SUPER_ADMIN), 'tournament_result_audit/audit-1')));
    await assertFails(getDoc(doc(dbFor('organizer-a'), 'tournament_result_audit/audit-1')));
    await assertFails(updateDoc(doc(dbFor(SUPER_ADMIN), 'tournament_result_audit/audit-1'), { actor_uid: 'member-a' }));
  });
});
