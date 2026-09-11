import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  normalizeEvent,
  normalizeEventParticipant,
  normalizeProvider,
  normalizeRoundRobinDraft,
  normalizeTournamentMatch,
  normalizeUserPreferences,
  normalizeUserStats,
} from '../../src/lib/firestoreNormalization.ts';

test('event normalization resolves missing and malformed zone buckets safely', () => {
  const event = normalizeEvent('event-1', {
    title: 'Open',
    type: 'Tournament',
    location: 'Toronto',
    image: 7,
    zone_draw_config: { enabled: true, buckets: [{ id: '', zones: 'bad' }] },
  });
  assert.equal(event.id, 'event-1');
  assert.equal(event.image, '');
  assert.ok(event.zone_draw_config.buckets.length > 0);
});

test('provider normalization keeps only known roles and rejects incomplete rows', () => {
  assert.deepEqual(
    normalizeProvider('stringer-1', { name: '  Sam  ', roles: ['stringer', 'stringer', 'root'], member_uid: 4 }),
    {
      id: 'stringer-1',
      name: 'Sam',
      roles: ['stringer'],
    },
  );
  assert.equal(normalizeProvider('', { name: 'Sam', roles: ['stringer'] }), null);
  assert.equal(normalizeProvider('stringer-1', { name: 'Sam', roles: [] }), null);
});

test('participant and match normalization reject documents without stable identity', () => {
  assert.equal(normalizeEventParticipant('p1', { uid: '', event_id: 'event-1' }), null);
  assert.equal(normalizeTournamentMatch('m1', { event_id: 'event-1' }), null);
});

test('participant normalization keeps a finite seed and omits an absent or invalid one', () => {
  assert.equal(normalizeEventParticipant('p1', { uid: 'member-a', event_id: 'event-1', seed: 4 })?.seed, 4);
  assert.equal(normalizeEventParticipant('p1', { uid: 'member-a', event_id: 'event-1' })?.seed, undefined);
  assert.equal(normalizeEventParticipant('p1', { uid: 'member-a', event_id: 'event-1', seed: '1' })?.seed, undefined);
  assert.equal(
    normalizeEventParticipant('p1', { uid: 'member-a', event_id: 'event-1', seed: Number.NaN })?.seed,
    undefined,
  );
});

test('match normalization bounds invalid primitives to safe runtime defaults', () => {
  const match = normalizeTournamentMatch('m1', {
    event_id: 'event-1',
    match_id: 'draw-1',
    drawsize: Number.NaN,
    position: -4,
    tournament_choice: 'invalid',
    status: 'invalid',
    started: 'yes',
  });
  assert.equal(match.drawsize, 0);
  assert.equal(match.position, 0);
  assert.equal(match.tournament_choice, 'Singles');
  assert.equal(match.status, 'pending');
  assert.equal(match.started, false);
});

test('profile normalization does not grant role flags or trust malformed arrays', () => {
  const preferences = normalizeUserPreferences({
    event_creator: 'true',
    preferred_courts: ['A', 1],
    preferred_zone: { trim: 'not callable' },
  });
  assert.equal(preferences.event_creator, false);
  assert.deepEqual(preferences.preferred_courts, ['A']);
  assert.equal(preferences.preferred_zone, '');
  const stats = normalizeUserStats({ skill_level: '5', wins: Number.NaN });
  assert.equal(stats.skill_level, 2);
  assert.equal(stats.wins, 0);
});

test('stats normalization keeps the weekly snapshot rankPosition', () => {
  const stats = normalizeUserStats({ rankPosition: 7, rankMove: 2, rankTrend: 'up' });
  assert.equal(stats.rankPosition, 7);
  assert.equal(normalizeUserStats({ rankPosition: '7' }).rankPosition, undefined);
});

test('profile normalization preserves verified provider roles without coercing them', () => {
  const coach = normalizeUserPreferences({ coach: true, coach_id: 'archie' });
  assert.equal(coach.coach, true);
  assert.equal(coach.coach_id, 'archie');

  const malformed = normalizeUserPreferences({ coach: 'true', coach_id: 7, stringer: 'true', stringer_id: 9 });
  assert.equal(malformed.coach, false);
  assert.equal(malformed.coach_id, undefined);
  assert.equal(malformed.stringer, false);
  assert.equal(malformed.stringer_id, undefined);
});

test('round-robin draft normalization rejects malformed nested values', () => {
  assert.deepEqual(
    normalizeRoundRobinDraft({
      groups: [['member-a', 3], 'member-b,,member-c', { bad: true }],
      custom: [true, 'true', false],
      labels: ['Court 1', 3],
      withdrawn: ['member-d', null],
    }),
    {
      groups: [['member-a'], ['member-b', 'member-c'], []],
      custom: [true, false],
      customLabels: ['Court 1'],
      withdrawn: ['member-d'],
    },
  );
});
