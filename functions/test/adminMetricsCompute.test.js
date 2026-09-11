const test = require('node:test');
const assert = require('node:assert/strict');

const { computeMetrics } = require('../lib/adminMetricsCompute');

const data = (matches) => ({
  users: [],
  stats: [],
  events: [],
  event_participants: [],
  matches,
  courts: [],
  tasks: [],
  listings: [],
  connections: [],
  preferences: [],
});

test('admin metrics labels walkovers and played scores without a no-show outcome', () => {
  const metrics = computeMetrics(
    data([
      {
        _id: 'walkover',
        status: 'complete',
        category: 'singles',
        walkover: true,
        completed_at: '2026-01-02T00:00:00.000Z',
      },
      {
        _id: 'played',
        status: 'complete',
        category: 'singles',
        walkover: false,
        player_1_name: 'Player One',
        player_2_name: 'Player Two',
        set_1_player_1: 6,
        set_1_player_2: 4,
        set_2_player_1: 6,
        set_2_player_2: 3,
        completed_at: '2026-01-01T00:00:00.000Z',
      },
    ]),
  );

  assert.equal(metrics.recentMatches[0].score, 'Walkover');
  assert.equal(metrics.recentMatches[1].score, '6-4, 6-3');
  assert.equal(JSON.stringify(metrics).includes('No show'), false);
});
