const assert = require('node:assert/strict');
const { test } = require('node:test');
const { acceptedCancellationNotice, canCancelAccepted } = require('../lib/matchCancel');

const accepted = {
  category: 'challenge',
  status: 'accepted',
  player_1_uid: 'alex',
  player_1_name: 'Alex',
  player_2_uid: 'sam',
  player_2_name: 'Sam',
};

test('accepted cancellations notify the other player', () => {
  const fromChallenger = acceptedCancellationNotice(accepted, 'alex');
  assert.equal(fromChallenger.uid, 'sam');
  assert.equal(fromChallenger.type, 'ladder_cancelled');
  assert.match(fromChallenger.title, /Alex cancelled their challenge/);

  const fromOpponent = acceptedCancellationNotice(accepted, 'sam');
  assert.equal(fromOpponent.uid, 'alex');
  assert.match(fromOpponent.title, /Sam cancelled their challenge/);

  const rally = acceptedCancellationNotice({ ...accepted, category: 'rally' }, 'sam');
  assert.equal(rally.uid, 'alex');
  assert.equal(rally.type, 'rally_cancelled');
});

test('open retracts and outsiders cannot use the accepted-cancel path', () => {
  assert.equal(canCancelAccepted({ ...accepted, status: 'open' }, 'alex'), false);
  assert.equal(acceptedCancellationNotice({ ...accepted, status: 'open' }, 'alex'), null);
  assert.equal(acceptedCancellationNotice(accepted, 'outsider'), null);
  assert.equal(canCancelAccepted(accepted, 'alex'), true);
});
