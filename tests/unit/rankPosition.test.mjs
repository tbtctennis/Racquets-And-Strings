import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { snapshotRank } from '../../src/features/leagues/snapshotRank.ts';

const load = (rel) => readFile(new URL(rel, import.meta.url), 'utf8');

test('snapshotRank reads the weekly stored rankPosition for seeding', () => {
  assert.equal(snapshotRank({ rankPosition: 4 }), 4);
  assert.equal(snapshotRank({ rankPosition: 1 }), 1);
  assert.equal(snapshotRank({}), undefined);
  assert.equal(snapshotRank(null), undefined);
  assert.equal(snapshotRank({ rankPosition: Number.NaN }), undefined);
});

test('the three rankPosition readers still consume the field', async () => {
  const standings = await load('../../src/features/leagues/useStandings.ts');
  const leagues = await load('../../src/pages/Leagues.tsx');
  const profile = await load('../../src/pages/Profile.tsx');

  assert.match(standings, /rankPosition: snapshotRank\(s\)/);
  assert.match(leagues, /snapshotRank\(userRow\)/);
  assert.match(leagues, /snapshotRank\(userStats\)/);
  assert.match(profile, /snapshotRank\(profile\?\.stats\)/);
});

test('the snapshot writer still writes rankPosition', async () => {
  const writer = await load('../../functions/rankSnapshot.js');
  assert.match(writer, /computeRankUpdates\(players\)/);
  assert.match(writer, /rankPosition: op\.position/);
});
