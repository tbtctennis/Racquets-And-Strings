import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapParticipantsToPlayers } from '../../src/pages/tournament/utils.ts';

const participant = (overrides = {}) => ({
  id: 'p1',
  uid: 'u1',
  event_id: 'e1',
  created_at: '2026-01-01T00:00:00.000Z',
  user_name: 'Ada',
  ...overrides,
});

test('mapParticipantsToPlayers copies a persisted seed onto TournamentPlayer', () => {
  assert.deepEqual(mapParticipantsToPlayers([participant({ seed: 1 })], {}), [
    { uid: 'u1', name: 'Ada', participantId: 'p1', seed: 1 },
  ]);
});

test('mapParticipantsToPlayers omits seed when the participant has none', () => {
  const [player] = mapParticipantsToPlayers([participant()], {});
  assert.equal('seed' in player, false);
});
