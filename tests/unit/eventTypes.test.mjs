import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EVENT_TYPES, isEventType, isTournamentType } from '../../src/utils/eventTypes.ts';

test('event editor exposes exactly the four canonical event types', () => {
  assert.deepEqual(EVENT_TYPES, ['Socials', 'Tournaments', 'Specials', 'League Ladder']);
  assert.equal(new Set(EVENT_TYPES).size, 4);
  assert.equal(isEventType('Tournaments'), true);
  assert.equal(isEventType('Tournament'), false);
  assert.equal(isEventType('Meetup'), false);
});

test('only the canonical tournaments type enables tournament configuration', () => {
  assert.equal(isTournamentType('Tournaments'), true);
  assert.equal(isTournamentType('Tournament'), false);
  assert.equal(isTournamentType('Specials'), false);
});
