const assert = require('node:assert/strict');
const { test } = require('node:test');
const { computeRankUpdates } = require('../rankSnapshotCompute');

test('snapshot writes rankPosition from league-points order', () => {
  const ops = computeRankUpdates([
    { uid: 'a', league: "Men's", points: 50, rankPosition: 2 },
    { uid: 'b', league: "Men's", points: 30, rankPosition: 1 },
  ]);

  assert.deepEqual(
    ops.map((op) => ({ uid: op.uid, position: op.position, trend: op.trend, move: op.move })),
    [
      { uid: 'a', position: 1, trend: 'up', move: 1 },
      { uid: 'b', position: 2, trend: 'down', move: 1 },
    ],
  );
});

test('snapshot skips a player whose rankPosition is already current', () => {
  assert.deepEqual(computeRankUpdates([{ uid: 'a', league: "Men's", points: 40, rankPosition: 1 }]), []);
});

test('first snapshot records rankPosition as a baseline with no history', () => {
  const ops = computeRankUpdates([{ uid: 'a', league: "Women's", points: 12, rankPosition: null }]);
  assert.deepEqual(ops, [{ uid: 'a', position: 1, trend: 'flat', move: 0, historyDir: null }]);
});
