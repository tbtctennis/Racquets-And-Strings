const assert = require('node:assert/strict');
const { test } = require('node:test');
const { challengeLifecycleNotices } = require('../lib/challengeNotifications');

const base = {
  category: 'challenge',
  player_1_uid: 'challenger',
  player_1_name: 'Alex',
  player_2_uid: 'opponent',
  player_2_name: 'Blair',
};

const types = (notices) => notices.map((n) => n.payload.type);
const keys = (notices) => notices.map((n) => `${n.key}:${n.uid}`);

test('declined challenge notifies the creator with a stable dedupe key', () => {
  const notices = challengeLifecycleNotices({ ...base, status: 'open' }, { ...base, status: 'declined' }, 'ch-1');
  assert.deepEqual(types(notices), ['ladder_declined']);
  assert.deepEqual(
    notices.map((n) => n.uid),
    ['challenger'],
  );
  assert.equal(notices[0].key, 'challenge-declined:ch-1');
  assert.equal(notices[0].payload.link, '/matches?mode=challenges');
  assert.deepEqual(
    keys(notices),
    keys(challengeLifecycleNotices({ ...base, status: 'open' }, { ...base, status: 'declined' }, 'ch-1')),
  );
});

test('confirmed challenge (complete or confirmed) notifies both players once', () => {
  const after = { ...base, status: 'complete', winner_uid: 'challenger' };
  const complete = challengeLifecycleNotices({ ...base, status: 'accepted' }, after, 'ch-2');
  const confirmed = challengeLifecycleNotices(
    { ...base, status: 'accepted' },
    { ...after, status: 'confirmed' },
    'ch-2',
  );
  assert.deepEqual(types(complete), ['ladder_reported', 'ladder_reported']);
  assert.deepEqual(
    complete.map((n) => n.uid),
    ['challenger', 'opponent'],
  );
  assert.equal(complete[0].payload.body, 'You picked up 3 points.');
  assert.equal(complete[1].payload.body, 'You picked up 1 point.');
  assert.deepEqual(keys(complete), ['challenge-confirmed:ch-2:challenger', 'challenge-confirmed:ch-2:opponent']);
  assert.deepEqual(keys(complete), keys(confirmed));
  assert.deepEqual(challengeLifecycleNotices(after, after, 'ch-2'), []);
});

test('denied challenge (score_disputed) notifies both players without a status change', () => {
  const before = { ...base, status: 'complete', winner_uid: 'challenger' };
  const after = { ...before, score_disputed: true };
  const notices = challengeLifecycleNotices(before, after, 'ch-3');
  assert.deepEqual(types(notices), ['ladder_denied', 'ladder_denied']);
  assert.deepEqual(
    notices.map((n) => n.uid),
    ['challenger', 'opponent'],
  );
  assert.deepEqual(keys(notices), ['challenge-denied:ch-3:challenger', 'challenge-denied:ch-3:opponent']);
  assert.equal(notices[0].payload.title, 'Challenge result denied');
  assert.deepEqual(challengeLifecycleNotices(after, after, 'ch-3'), []);
});
