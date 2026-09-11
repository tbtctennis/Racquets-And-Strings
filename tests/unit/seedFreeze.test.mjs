import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { seedCount } from '../../src/features/tournament/domain/seeding.ts';
import {
  assignSeedsOnJoin,
  canMoveInDraw,
  canReseedDraw,
  freezeSeedsAtGeneration,
  isOpenDrawPosition,
  seedMoveBlockedMessage,
} from '../../src/features/tournament/domain/seedFreeze.ts';

const entry = (uid, seed) => (seed ? { uid, seed } : { uid });

test('joining an ungenerated draw reorders seeds', () => {
  const before = assignSeedsOnJoin([entry('ada'), entry('bea')], false, seedCount(8));
  assert.deepEqual(before, [
    { uid: 'ada', seed: 1 },
    { uid: 'bea', seed: 2 },
  ]);
  assert.deepEqual(assignSeedsOnJoin([entry('cam'), entry('ada'), entry('bea')], false, seedCount(8)), [
    { uid: 'cam', seed: 1 },
    { uid: 'ada', seed: 2 },
    { uid: 'bea', seed: 3 },
  ]);
});

test('joining a generated draw changes no existing seed', () => {
  assert.deepEqual(
    assignSeedsOnJoin([entry('cam'), entry('ada', 1), entry('bea', 2), entry('dot')], true, seedCount(8)),
    [{ uid: 'cam' }, { uid: 'ada', seed: 1 }, { uid: 'bea', seed: 2 }, { uid: 'dot' }],
  );
});

test('after generation an unseeded player can move to an open position', () => {
  assert.equal(isOpenDrawPosition('', 'Player Loading'), true);
  assert.deepEqual(
    canMoveInDraw({
      generated: true,
      playerUid: 'dot',
      playerAlreadySeated: true,
      targetOpen: true,
    }),
    { ok: true },
  );
});

test('a seeded player keeps their number and position', () => {
  const frozen = freezeSeedsAtGeneration(['ada', 'bea', 'cam', 'dot', 'eve'], seedCount(8));
  assert.equal(frozen.get('ada'), 1);
  assert.equal(frozen.get('dot'), 4);
  assert.equal(frozen.has('eve'), false);
  assert.deepEqual(
    canMoveInDraw({
      generated: true,
      playerUid: 'ada',
      playerSeed: 1,
      playerAlreadySeated: true,
      occupantUid: 'open',
      targetOpen: true,
    }),
    { ok: false, reason: 'seeded-player' },
  );
  assert.deepEqual(
    canMoveInDraw({
      generated: true,
      playerUid: 'dot',
      playerAlreadySeated: true,
      occupantUid: 'ada',
      occupantSeed: 1,
      targetOpen: false,
    }),
    { ok: false, reason: 'seeded-occupant' },
  );
  assert.equal(seedMoveBlockedMessage('seeded-player'), 'Seeded players keep their place in the draw.');
});

test('reseeding a generated draw stays forbidden', () => {
  assert.equal(canReseedDraw(false), true);
  assert.equal(canReseedDraw(true), false);
  assert.equal(seedMoveBlockedMessage('reseed-forbidden'), 'Seeds are frozen once the draw is generated.');
});

test('organizer draw writes consult the freeze rules', async () => {
  const source = await readFile(new URL('../../src/pages/tournament/useTournament.ts', import.meta.url), 'utf8');
  assert.match(source, /assignSeedsOnJoin|canMoveInDraw/);
  assert.match(source, /canReseedDraw/);
  assert.match(source, /freezeSeedsAtGeneration/);
});
