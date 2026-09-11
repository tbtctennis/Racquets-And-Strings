import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assignByes, seedAnchors } from '../../src/features/tournament/domain/seeding.ts';

const pairs = (order) => {
  const out = [];
  for (let i = 0; i < order.length; i += 2) out.push([order[i], order[i + 1]]);
  return out;
};

const pairSet = (order) =>
  new Set(
    pairs(order).map(([a, b]) => {
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      return `${lo}v${hi}`;
    }),
  );

const projectedSemifinals = (order) => {
  const q = order.length / 4;
  const best = (slice) => Math.min(...slice);
  return [
    [best(order.slice(0, q)), best(order.slice(q, 2 * q))],
    [best(order.slice(2 * q, 3 * q)), best(order.slice(3 * q))],
  ];
};

const byeRecipients = (placed) => {
  const got = [];
  for (let i = 0; i < placed.length; i += 2) {
    const a = placed[i];
    const b = placed[i + 1];
    if (a == null && b != null) got.push(b);
    if (b == null && a != null) got.push(a);
  }
  return got.sort((x, y) => x - y);
};

test('seedAnchors 8-draw is 1v8, 4v5, 2v7, 3v6 with 1 and 2 in opposite halves', () => {
  const order = seedAnchors(8);
  assert.deepEqual(order, [1, 8, 4, 5, 2, 7, 3, 6]);
  assert.deepEqual([...pairSet(order)].sort(), ['1v8', '2v7', '3v6', '4v5']);
  assert.ok(order.slice(0, 4).includes(1));
  assert.ok(order.slice(4).includes(2));
  assert.deepEqual(projectedSemifinals(order), [
    [1, 4],
    [2, 3],
  ]);
});

test('seedAnchors 16-draw generalises: 1 opposite 2, SFs 1v4 and 2v3', () => {
  const order = seedAnchors(16);
  assert.deepEqual(order, [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11]);
  assert.ok(order.slice(0, 8).includes(1));
  assert.ok(order.slice(8).includes(2));
  assert.deepEqual(projectedSemifinals(order), [
    [1, 4],
    [2, 3],
  ]);
});

test('seedAnchors 32-draw generalises: 1 opposite 2, SFs 1v4 and 2v3', () => {
  const order = seedAnchors(32);
  assert.deepEqual(
    order,
    [
      1, 32, 16, 17, 8, 25, 9, 24, 4, 29, 13, 20, 5, 28, 12, 21, 2, 31, 15, 18, 7, 26, 10, 23, 3, 30, 14, 19, 6, 27, 11,
      22,
    ],
  );
  assert.ok(order.slice(0, 16).includes(1));
  assert.ok(order.slice(16).includes(2));
  assert.deepEqual(projectedSemifinals(order), [
    [1, 4],
    [2, 3],
  ]);
});

test('assignByes gives first-round byes to the top seeds', () => {
  assert.deepEqual(assignByes(8, 8), [1, 8, 4, 5, 2, 7, 3, 6]);
  assert.deepEqual(byeRecipients(assignByes(8, 6)), [1, 2]);
  assert.deepEqual(byeRecipients(assignByes(16, 12)), [1, 2, 3, 4]);
  assert.deepEqual(byeRecipients(assignByes(32, 24)), [1, 2, 3, 4, 5, 6, 7, 8]);
});
