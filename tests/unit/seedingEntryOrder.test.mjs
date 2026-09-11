import assert from 'node:assert/strict';
import { test } from 'node:test';
import { orderEntrants } from '../../src/features/tournament/domain/seeding.ts';

const e = (overrides = {}) => ({
  uid: 'u',
  name: 'N',
  leaguePoints26: 10,
  pointswon: 5,
  totalPointsPlayed: 10,
  ...overrides,
});

test('entry order is live leaguePoints26, then P/G won %, then name', () => {
  const ordered = orderEntrants([
    e({ uid: 'n', name: 'Bea', leaguePoints26: 10, pointswon: 1, totalPointsPlayed: 10 }),
    e({ uid: 'p', name: 'Ada', leaguePoints26: 10, pointswon: 9, totalPointsPlayed: 10 }),
    e({ uid: 'q', name: 'Zoe', leaguePoints26: 30, pointswon: 0, totalPointsPlayed: 10 }),
  ]);
  assert.deepEqual(
    ordered.map((p) => p.uid),
    ['q', 'p', 'n'],
  );
});

test('two players on equal points and equal P/G % order alphabetically', () => {
  const ordered = orderEntrants([e({ uid: 'b', name: 'Zed' }), e({ uid: 'a', name: 'ada' })]);
  assert.deepEqual(
    ordered.map((p) => [p.name, p.seed]),
    [
      ['ada', 1],
      ['Zed', 2],
    ],
  );
});

test('a third joining above both renumbers them 2 and 3 with unique seeds', () => {
  const field = [e({ uid: 'b', name: 'Zed' }), e({ uid: 'a', name: 'Ada' })];
  assert.deepEqual(
    orderEntrants(field).map((p) => [p.name, p.seed]),
    [
      ['Ada', 1],
      ['Zed', 2],
    ],
  );

  const withJoiner = orderEntrants([...field, e({ uid: 'c', name: 'Mo', leaguePoints26: 20 })]);
  assert.deepEqual(
    withJoiner.map((p) => [p.name, p.seed]),
    [
      ['Mo', 1],
      ['Ada', 2],
      ['Zed', 3],
    ],
  );
  assert.equal(new Set(withJoiner.map((p) => p.seed)).size, withJoiner.length);
});
