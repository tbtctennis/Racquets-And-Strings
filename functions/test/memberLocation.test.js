const assert = require('node:assert/strict');
const { test } = require('node:test');
const { locationFromPreferredCourts, memberLocation } = require('../lib/memberLocation');
const { assertPlayableLocationPair } = require('../lib/playLocation');

test('preferred Toronto courts earn the Toronto location', () => {
  assert.equal(locationFromPreferredCourts(['Ramsden Park']), 'Toronto');
  assert.equal(locationFromPreferredCourts(['ramsden-park']), 'Toronto');
  assert.equal(locationFromPreferredCourts(['Parkway Valley Tennis Club']), 'Toronto');
});

test('empty and unmapped preferred courts leave location unset', () => {
  assert.equal(locationFromPreferredCourts([]), undefined);
  assert.equal(locationFromPreferredCourts(['Unknown Court']), undefined);
  assert.equal(locationFromPreferredCourts(undefined), undefined);
});

test('a runtime court overlay maps an otherwise unknown court to Toronto', () => {
  assert.equal(locationFromPreferredCourts(['Unknown Court'], { 'unknown-court': { zone: 'Etobicoke' } }), 'Toronto');
});

test('member location reads the derived stats field and treats missing or malformed values as unset', async () => {
  const docs = new Map([
    ['member-a', { exists: true, data: () => ({ location: ' Toronto ' }) }],
    ['member-b', { exists: true, data: () => ({ location: 7 }) }],
  ]);
  const db = { doc: (path) => ({ get: async () => docs.get(path.split('/')[1]) || { exists: false } }) };

  assert.equal(await memberLocation(db, 'member-a'), 'Toronto');
  assert.equal(await memberLocation(db, 'member-b'), undefined);
  assert.equal(await memberLocation(db, 'member-c'), undefined);
  assert.equal(await memberLocation(db, ''), undefined);
});

test('play location allows same-location and unset members but rejects different locations', async () => {
  const docs = new Map([
    ['toronto-a', { exists: true, data: () => ({ location: 'Toronto' }) }],
    ['toronto-b', { exists: true, data: () => ({ location: 'Toronto' }) }],
    ['markham', { exists: true, data: () => ({ location: 'Markham' }) }],
    ['unset', { exists: true, data: () => ({}) }],
  ]);
  const db = { doc: (path) => ({ get: async () => docs.get(path.split('/')[1]) || { exists: false } }) };

  await assert.doesNotReject(() => assertPlayableLocationPair(db, 'toronto-a', 'toronto-b'));
  await assert.doesNotReject(() => assertPlayableLocationPair(db, 'toronto-a', 'unset'));
  await assert.rejects(
    () => assertPlayableLocationPair(db, 'toronto-a', 'markham'),
    (error) => error.code === 'cross-location',
  );
});
