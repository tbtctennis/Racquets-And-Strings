import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  countActiveParticipants,
  toJoinedRegistrations,
} from '../../src/features/events/services/eventRegistrationState.ts';

const participant = (overrides = {}) => ({
  id: 'row',
  uid: 'member-a',
  event_id: 'event-a',
  created_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

test('active participant counts skip withdrawn rows and group by event', () => {
  assert.deepEqual(
    countActiveParticipants([
      participant({ id: 'a1', event_id: 'event-a' }),
      participant({ id: 'a2', event_id: 'event-a' }),
      participant({ id: 'a3', event_id: 'event-a', status: 'withdrawn' }),
      participant({ id: 'b1', event_id: 'event-b' }),
    ]),
    { 'event-a': 2, 'event-b': 1 },
  );
});

test('joined registrations keep empty tournamentChoice for regular events', () => {
  assert.deepEqual(
    toJoinedRegistrations([
      participant({ event_id: 'social' }),
      participant({ event_id: 'open', tournament_choice: 'Singles' }),
    ]),
    [
      { eventId: 'social', tournamentChoice: '' },
      { eventId: 'open', tournamentChoice: 'Singles' },
    ],
  );
});
