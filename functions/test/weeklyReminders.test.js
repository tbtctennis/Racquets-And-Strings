const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  GET_ALL_LIMIT,
  boundedReadChunks,
  eventReadIds,
  incompleteMatchNotices,
  opponentReadIds,
  pendingMatchNotices,
  reminderWeekKey,
} = require('../lib/weeklyReminders');

const singles = (over = {}) => ({
  category: 'singles',
  status: 'pending',
  event_id: 'evt-1',
  player_1_uid: 'alex',
  player_1_name: 'Alex',
  player_2_uid: 'blair',
  player_2_name: 'Blair',
  round: 'SF',
  ...over,
});

test('pending reminder lists distinct opponents and dates, not the aggregate deadline', () => {
  const notices = pendingMatchNotices({
    weekKey: '2026-09-15',
    namesByUid: { blair: 'Blair Chen', casey: 'Casey' },
    eventById: { 'evt-1': { round_deadlines: { 'draw-a:SF': '2026-09-20', 'draw-a:F': '2026-09-27' } } },
    matches: [
      singles({ round: 'SF' }),
      singles({ player_2_uid: 'casey', player_2_name: 'Casey', round: 'F', proposed_date: '2026-09-16' }),
      singles({ round: 'SF' }),
    ],
  });
  const alex = notices.find((n) => n.uid === 'alex');
  assert.equal(notices.filter((n) => n.uid === 'alex').length, 1);
  assert.equal(alex.key, 'weekly-pending:2026-09-15');
  assert.equal(alex.payload.type, 'reminder_pending_matches');
  assert.equal(alex.payload.title, 'You have 3 matches to play');
  assert.equal(alex.payload.body, 'vs Casey Sep 16 · vs Blair Chen Sep 20');
  assert.doesNotMatch(alex.payload.body, /Earliest deadline/);
});

test('RR group matches omit round deadlines and undated rows still name the opponent', () => {
  const notices = pendingMatchNotices({
    weekKey: '2026-09-15',
    namesByUid: { blair: 'Blair' },
    eventById: { 'evt-1': { round_deadlines: { RR: '2026-09-01', 'draw-a:RR': '2026-09-01' } } },
    matches: [singles({ round: 'RR', format: 'rr', rr_group: 1 })],
  });
  const alex = notices.find((n) => n.uid === 'alex');
  assert.equal(alex.payload.body, 'vs Blair');
  assert.doesNotMatch(alex.payload.body, /Sep 1/);
});

test('opponent and event reads are distinct and chunked at the getAll bound', () => {
  const matches = [
    singles(),
    singles({ event_id: 'evt-2', player_2_uid: 'casey' }),
    singles({ player_2_uid: 'blair' }),
  ];
  assert.deepEqual(opponentReadIds(matches).sort(), ['alex', 'blair', 'casey']);
  assert.deepEqual(eventReadIds(matches).sort(), ['evt-1', 'evt-2']);
  const ids = Array.from({ length: 250 }, (_, i) => `u${i}`);
  const chunks = boundedReadChunks(ids);
  assert.equal(GET_ALL_LIMIT, 100);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 100);
  assert.equal(chunks[2].length, 50);
  assert.equal(boundedReadChunks([...ids, ...ids]).length, 3);
});

test('weekly reminder keys stay stable for the same Toronto week so notifyOnce dedupes retries', () => {
  const weekKey = reminderWeekKey(new Date('2026-09-15T13:00:00Z'));
  const pending = pendingMatchNotices({
    weekKey,
    namesByUid: { blair: 'Blair' },
    eventById: {},
    matches: [singles({ proposed_date: '2026-09-18' })],
  });
  const incomplete = incompleteMatchNotices({
    weekKey,
    pendingCountByUser: { alex: 1 },
    rallyCountByUser: { alex: 1 },
    challengeCountByUser: {},
  });
  assert.equal(pending[0].key, `weekly-pending:${weekKey}`);
  assert.equal(incomplete[0].key, `weekly-incomplete:${weekKey}`);
  assert.equal(incomplete[0].payload.title, 'You have 2 incomplete matches');
  assert.deepEqual(
    pendingMatchNotices({
      weekKey,
      namesByUid: { blair: 'Blair' },
      eventById: {},
      matches: [singles({ proposed_date: '2026-09-18' })],
    }).map((n) => `${n.key}:${n.uid}`),
    pending.map((n) => `${n.key}:${n.uid}`),
  );
});
