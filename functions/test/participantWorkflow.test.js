const assert = require('node:assert/strict');
const test = require('node:test');

const { choosePlacement, isReactivation } = require('../participantWorkflow');

const participant = {
  uid: 'player-a',
  status: 'active',
  tournament_choice: 'Singles',
  division: "Men's",
  skill_group: 'Beginners',
  zone: 'Downtown',
};

test('reactivation is only detected for withdrawn-to-active transitions', () => {
  assert.equal(isReactivation({ status: 'withdrawn' }, { ...participant }), true);
  assert.equal(isReactivation({ status: 'active' }, { ...participant }), false);
  assert.equal(isReactivation({ removal: true, status: 'active' }, { ...participant, removal: false }), true);
  assert.equal(isReactivation({ status: 'withdrawn' }, { ...participant, status: 'withdrawn' }), false);
});

test('a reactivated player takes an open Round Robin group slot without moving existing players', () => {
  const matches = [
    {
      id: 'rr-a',
      format: 'rr',
      round: 'RR',
      rr_group: 0,
      category: 'singles',
      tournament_choice: 'Singles',
      division: "Men's",
      skill_group: 'Beginners',
      zone: 'Downtown',
      player_1_uid: 'player-b',
      player_1_name: 'Player B',
      player_2_name: 'Player Loading',
      status: 'pending',
    },
  ];
  assert.deepEqual(choosePlacement(participant, matches, 'Downtown'), { matchId: 'rr-a', slot: 'player_2' });
  assert.equal(matches[0].player_1_uid, 'player-b');
});

test('a reactivated player takes an open knockout draw slot, but a generated bracket is untouched', () => {
  const openBracket = [
    {
      id: 'ko-a',
      format: 'knockout',
      round: 'R16',
      category: 'singles',
      tournament_choice: 'Singles',
      division: "Men's",
      skill_group: 'Beginners',
      zone: 'Downtown',
      player_1_uid: 'player-b',
      player_1_name: 'Player B',
      player_2_name: 'Player Loading',
      status: 'pending',
    },
  ];
  assert.deepEqual(choosePlacement(participant, openBracket, 'Downtown'), { matchId: 'ko-a', slot: 'player_2' });

  const generatedBracket = [{ ...openBracket[0], player_2_uid: 'player-c', player_2_name: 'Player C' }];
  assert.equal(choosePlacement(participant, generatedBracket, 'Downtown'), null);
  assert.equal(generatedBracket[0].player_1_uid, 'player-b');
  assert.equal(generatedBracket[0].player_2_uid, 'player-c');
});
