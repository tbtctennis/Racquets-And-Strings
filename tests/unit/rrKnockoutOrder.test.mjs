import assert from 'node:assert/strict';
import { test } from 'node:test';
import { orderRRGroupWinners, orderRRKnockout } from '../../src/features/tournament/domain/seeding.ts';
import { buildZoneTierGroups } from '../../src/pages/tournament/rrGeneration.ts';

const p = (uid, name, groupPoints, extra = {}) => ({ uid, name, groupPoints, ...extra });

const standing = (userId, name, points, rank) => ({ userId, name, points, rank });

test('RR knockout order is group points, then P/G won %, then leaderboard rank, then name', () => {
  const ordered = orderRRKnockout([
    p('d', 'Dee', 6, { pointswon: 8, totalPointsPlayed: 10, rankPosition: 1 }),
    p('c', 'Cee', 9, { pointswon: 1, totalPointsPlayed: 10, rankPosition: 1 }),
    p('b', 'Bee', 9, { pointswon: 8, totalPointsPlayed: 10, rankPosition: 5 }),
    p('a', 'Zed', 9, { pointswon: 8, totalPointsPlayed: 10, rankPosition: 2 }),
    p('e', 'Ann', 9, { pointswon: 8, totalPointsPlayed: 10, rankPosition: 2 }),
  ]);
  assert.deepEqual(
    ordered.map((row) => [row.uid, row.seed]),
    [
      ['e', 1],
      ['a', 2],
      ['b', 3],
      ['c', 4],
      ['d', 5],
    ],
  );
});

test('seed 1 is the top player in that draw, not across draws', () => {
  const drawA = orderRRKnockout([p('weak', 'W', 3)]);
  const drawB = orderRRKnockout([p('strong', 'S', 12), p('other', 'O', 4)]);
  assert.equal(drawA[0].uid, 'weak');
  assert.equal(drawA[0].seed, 1);
  assert.equal(drawB[0].uid, 'strong');
  assert.equal(drawB[0].seed, 1);
});

test('group winners are ordered by group points across all groups in the draw', () => {
  const standings = [
    [standing('a1', 'A1', 6, 1), standing('a2', 'A2', 5, 2)],
    [standing('b1', 'B1', 4, 1), standing('b2', 'B2', 2, 2)],
  ];
  assert.deepEqual(
    orderRRGroupWinners(standings, {}, 1).map((row) => row.uid),
    ['a1', 'b1'],
  );
  assert.deepEqual(
    orderRRGroupWinners(standings, {}, 2).map((row) => [row.uid, row.seed]),
    [
      ['a1', 1],
      ['a2', 2],
      ['b1', 3],
      ['b2', 4],
    ],
  );
});

test('RR group formation stays unseeded', () => {
  const seeded = [
    { uid: 'z', name: 'Zoe', participantId: '1', skillLevel: 3, seed: 1 },
    { uid: 'a', name: 'Amy', participantId: '2', skillLevel: 3, seed: 2 },
  ];
  const plain = seeded.map(({ seed: _seed, ...player }) => player);
  assert.deepEqual(
    buildZoneTierGroups(seeded, {}, {}).map((g) => g.players.map((p) => p.uid)),
    buildZoneTierGroups(plain, {}, {}).map((g) => g.players.map((p) => p.uid)),
  );
  assert.deepEqual(
    buildZoneTierGroups(seeded, {}, {})[0].players.map((p) => p.uid),
    ['a', 'z'],
  );
});
