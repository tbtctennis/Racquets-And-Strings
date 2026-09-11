import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  activeRegistrants,
  selectScheduleRequests,
  selectUnplacedParticipants,
} from '../../src/features/tournament/domain/organizerQueues.ts';
import { resolveZoneConfig, zoneBucketId } from '../../src/features/tournament/domain/placement.ts';

const DOWNTOWN = zoneBucketId('Downtown - Midtown');
const NORTH_YORK = zoneBucketId('North York');
const zoneConfig = resolveZoneConfig(undefined);
const titles = new Map([
  ['event-a', 'Open'],
  ['event-b', 'Other'],
]);
const configs = new Map([['event-a', zoneConfig]]);

const match = (overrides = {}) => ({
  id: 'm1',
  category: 'singles',
  event_id: 'event-a',
  tournament_choice: 'Singles',
  division: "Men's",
  skill_group: 'Challengers',
  zone: DOWNTOWN,
  drawsize: 8,
  match_id: 'M1',
  round: 'R16',
  position: 0,
  player_1_slot: 1,
  player_2_slot: 2,
  player_1_name: 'One',
  player_1_uid: 'p1',
  player_2_name: 'Two',
  player_2_uid: 'p2',
  status: 'pending',
  started: true,
  ...overrides,
});

const participant = (overrides = {}) => ({
  id: 'row-a',
  uid: 'late',
  user_name: 'Late Joiner',
  event_id: 'event-a',
  created_at: '2026-01-01T00:00:00.000Z',
  tournament_choice: 'Singles',
  division: "Men's",
  skill: 3.5,
  ...overrides,
});

const unplaced = (candidates, matches, preferencesByUid = new Map()) =>
  selectUnplacedParticipants({
    candidates,
    matches,
    preferencesByUid,
    eventTitleById: titles,
    zoneConfigByEventId: configs,
  });

test('schedule requests keep incomplete matches for owned events and drop the rest', () => {
  const rows = selectScheduleRequests(
    [
      match({ id: 'open', event_id: 'event-a', status: 'pending' }),
      match({ id: 'done', event_id: 'event-a', status: 'complete' }),
      match({ id: 'other', event_id: 'event-c', status: 'pending' }),
    ],
    titles,
  );
  assert.deepEqual(
    rows.map((row) => ({ id: row.id, event_title: row.event_title })),
    [{ id: 'open', event_title: 'Open' }],
  );
});

test('active registrants drop withdrawn, removed, empty uid, and duplicate event+member rows', () => {
  const rows = activeRegistrants([
    participant({ id: 'keep', uid: 'a' }),
    participant({ id: 'withdrawn', uid: 'b', status: 'withdrawn' }),
    participant({ id: 'removed', uid: 'c', removal: true }),
    participant({ id: 'no-uid', uid: '' }),
    participant({ id: 'dup', uid: 'a' }),
  ]);
  assert.deepEqual(
    rows.map((row) => row.id),
    ['keep'],
  );
});

test('never-placed registrant in a live covering draw is unplaced', () => {
  const rows = unplaced([participant()], [match({ player_1_uid: 'p1', player_2_uid: 'p2' })]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].uid, 'late');
  assert.equal(rows[0].eventTitle, 'Open');
  assert.equal(rows[0].zone, '');
});

test('a finished sibling draw does not hide a live covering draw', () => {
  const rows = unplaced(
    [participant()],
    [
      match({
        id: 'womens-final',
        division: "Women's",
        skill_group: 'Masters',
        round: 'F',
        status: 'complete',
        winner_uid: 'p1',
      }),
      match({ id: 'mens-live', player_1_uid: 'p1', player_2_uid: 'p2' }),
    ],
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].uid, 'late');
});

test('placed doubles players never resurface', () => {
  const rows = unplaced(
    [participant({ uid: 'p1', tournament_choice: 'Doubles', division: 'Mixed Doubles' })],
    [
      match({
        category: 'doubles',
        tournament_choice: 'Doubles',
        division: 'Mixed Doubles',
        skill_group: 'All',
        player_1_uid: 'p1',
        player_2_uid: 'p2',
      }),
    ],
  );
  assert.equal(rows.length, 0);
});

test('singles zone change resurfaces only when the new zone already has a covering draw', () => {
  const seatedDowntown = [
    match({ id: 'downtown', zone: DOWNTOWN, player_1_uid: 'mover', player_2_uid: 'p2' }),
    match({ id: 'north', zone: NORTH_YORK, player_1_uid: 'p3', player_2_uid: 'p4' }),
  ];
  const preferences = new Map([['mover', { courts: ['c1'], zone: 'North York', manual: false }]]);
  const moved = unplaced([participant({ uid: 'mover', user_name: 'Mover' })], seatedDowntown, preferences);
  assert.equal(moved.length, 1);
  assert.equal(moved[0].zone, 'North York');

  const noNewDraw = unplaced(
    [participant({ uid: 'mover', user_name: 'Mover' })],
    [match({ id: 'downtown', zone: DOWNTOWN, player_1_uid: 'mover', player_2_uid: 'p2' })],
    preferences,
  );
  assert.equal(noNewDraw.length, 0);
});

test('no covering live draw keeps a registrant off the unplaced list', () => {
  const rows = unplaced(
    [participant({ skill: 4.2 })],
    [match({ skill_group: 'Challengers', player_1_uid: 'p1', player_2_uid: 'p2' })],
  );
  assert.equal(rows.length, 0);
});

test('display zone stays empty when the player never chose courts or a manual zone', () => {
  const rows = unplaced(
    [participant()],
    [match()],
    new Map([['late', { courts: [], zone: 'Downtown - Midtown', manual: false }]]),
  );
  assert.equal(rows[0].zone, '');
});
