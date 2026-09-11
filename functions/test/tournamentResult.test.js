const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  mergeStatDeltas,
  normalizeTournamentResult,
  statDeltasForResult,
  storedTournamentResult,
  tournamentAward,
  paidAward,
} = require('../lib/tournamentResult');

const match = {
  event_id: 'event-1',
  tournament_choice: 'Singles',
  division: "Men's",
  format: 'rr',
  round: 'RR',
  status: 'pending',
  player_1_uid: 'player-a',
  player_1_name: 'Player A',
  player_2_uid: 'player-b',
  player_2_name: 'Player B',
};

test('stored results produce exact inverse deltas for reset and cancellation', () => {
  const stored = {
    ...match,
    winner_uid: 'player-a',
    set_1_player_1: 6,
    set_1_player_2: 4,
    set_2_player_1: 6,
    set_2_player_2: 2,
    status: 'complete',
  };
  const reversed = mergeStatDeltas(new Map(), statDeltasForResult(stored, storedTournamentResult(stored)), -1);
  assert.equal(reversed.get('player-a').leaguePoints26, -3);
  assert.equal(reversed.get('player-a').wins, -1);
  assert.equal(reversed.get('player-b').leaguePoints26, -1);
  assert.equal(reversed.get('player-b').tournamentsPlayed, undefined);
});

test('withdrawal-style walkovers award points without counting a match or win', () => {
  const deltas = statDeltasForResult(
    { ...match, format: 'knockout', round: 'QF' },
    {
      winnerUid: 'player-a',
      walkover: true,
      scores: [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    },
  );
  assert.equal(deltas.get('player-a').matchesPlayed, undefined);
  assert.equal(deltas.get('player-a').wins, undefined);
  assert.equal(deltas.get('player-b').matchesPlayed, undefined);
  assert.equal(deltas.get('player-b').wins, undefined);
  assert.equal(deltas.get('player-b').leaguePoints26, 3);
});

test('normalizes a bounded result whose winner belongs to the match', () => {
  const result = normalizeTournamentResult(
    {
      winnerUid: 'player-a',
      scores: [
        [6, 4],
        [6, 2],
        [0, 0],
      ],
    },
    match,
  );
  assert.deepEqual(result.scores, [
    [6, 4],
    [6, 2],
    [0, 0],
  ]);
  assert.equal(result.winnerUid, 'player-a');
  assert.equal(result.walkover, false);
});

test('rejects an unrelated winner and malformed or unbounded scores', () => {
  assert.throws(
    () =>
      normalizeTournamentResult(
        {
          winnerUid: 'outsider',
          scores: [
            [6, 4],
            [6, 2],
            [0, 0],
          ],
        },
        match,
      ),
    (error) => error.code === 'invalid-argument',
  );
  assert.throws(
    () =>
      normalizeTournamentResult(
        {
          winnerUid: 'player-a',
          scores: [
            [100, 0],
            [0, 0],
            [0, 0],
          ],
        },
        match,
      ),
    (error) => error.code === 'invalid-argument',
  );
  assert.throws(
    () =>
      normalizeTournamentResult(
        {
          winnerUid: 'player-b',
          scores: [
            [6, 4],
            [6, 2],
            [0, 0],
          ],
        },
        match,
      ),
    (error) => error.code === 'invalid-argument',
  );
});

test('uses 21 as the score-margin threshold', () => {
  const result = (first, second) =>
    normalizeTournamentResult(
      {
        winnerUid: 'player-a',
        scores: [
          [first, second],
          [6, 4],
          [0, 0],
        ],
      },
      match,
    );

  assert.equal(result(21, 19).winnerUid, 'player-a');
  assert.throws(() => result(22, 19), /above 21/);
  assert.equal(result(12, 2).winnerUid, 'player-a');
});

test('accepts organizer walkovers and rejects no-show results', () => {
  const walkover = normalizeTournamentResult(
    {
      winnerUid: 'player-b',
      walkover: true,
      scores: [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    },
    match,
  );
  assert.equal(walkover.walkover, true);
  assert.equal(walkover.noShow, false);

  assert.throws(
    () =>
      normalizeTournamentResult(
        {
          noShow: true,
          scores: [
            [0, 0],
            [0, 0],
            [0, 0],
          ],
        },
        match,
      ),
    (error) => error.code === 'invalid-argument',
  );
});

test('preserves established tournament point awards', () => {
  assert.deepEqual(tournamentAward({ ...match, winner_uid: 'player-a' }), {
    winnerPoints: 3,
    loserPoints: 1,
    winnerPointsApply: true,
    isFinal: false,
  });
  assert.deepEqual(tournamentAward({ ...match, format: 'bracket', round: 'SF', winner_uid: 'player-a' }), {
    winnerPoints: 20,
    loserPoints: 5,
    winnerPointsApply: false,
    isFinal: false,
  });
});

test('paidAward stores the league points actually paid, including walkovers and rescores', () => {
  assert.deepEqual(paidAward(match, { walkover: false }), { points_winner: 3, points_loser: 1 });
  assert.deepEqual(paidAward(match, { walkover: true }), { points_winner: 1, points_loser: 1 });
  assert.deepEqual(paidAward({ ...match, format: 'bracket', round: 'SF' }, { walkover: false }), {
    points_winner: 0,
    points_loser: 5,
  });
  assert.deepEqual(paidAward({ ...match, format: 'bracket', round: 'F' }, { walkover: false }), {
    points_winner: 20,
    points_loser: 10,
  });
  assert.deepEqual(paidAward({ ...match, format: 'bracket', round: 'QF' }, { walkover: true }), {
    points_winner: 0,
    points_loser: 3,
  });
  const first = paidAward(match, { walkover: false });
  const rescore = paidAward(match, { walkover: true });
  assert.notDeepEqual(rescore, first);
  assert.deepEqual(rescore, { points_winner: 1, points_loser: 1 });
});

test('builds first-application stat deltas and walkover awards', () => {
  const scored = statDeltasForResult(
    match,
    normalizeTournamentResult(
      {
        winnerUid: 'player-a',
        scores: [
          [6, 4],
          [6, 2],
          [0, 0],
        ],
      },
      match,
    ),
  );
  assert.equal(scored.get('player-a').leaguePoints26, 3);
  assert.equal(scored.get('player-a').matchesPlayed, 1);
  assert.equal(scored.get('player-a').pointswon, 12);
  assert.equal(scored.get('player-a').totalPointsPlayed, 18);
  assert.equal(scored.get('player-b').leaguePoints26, 1);
  assert.deepEqual(Object.keys(scored.get('player-b')).sort(), [
    'league',
    'leaguePoints26',
    'matchesPlayed',
    'pointswon',
    'totalPointsPlayed',
  ]);
  assert.equal(scored.get('player-b').pointswon, 6);
  assert.equal(scored.get('player-b').totalPointsPlayed, 18);
  assert.equal(scored.get('player-a').tournamentsPlayed, undefined);
  assert.equal(scored.get('player-b').tournamentsPlayed, undefined);

  const oldResult = normalizeTournamentResult(
    {
      winnerUid: 'player-a',
      scores: [
        [6, 4],
        [6, 2],
        [0, 0],
      ],
    },
    match,
  );
  const rescore = normalizeTournamentResult(
    {
      winnerUid: 'player-a',
      scores: [
        [6, 3],
        [7, 5],
        [0, 0],
      ],
    },
    match,
  );
  const oldDeltas = statDeltasForResult(match, oldResult);
  const freshDeltas = statDeltasForResult(match, rescore);
  const reconciled = mergeStatDeltas(new Map(), oldDeltas, -1);
  mergeStatDeltas(reconciled, freshDeltas);
  assert.deepEqual(
    mergeStatDeltas(oldDeltas, reconciled),
    freshDeltas,
    'applying a rescore delta should equal a fresh recompute of the replacement result',
  );

  const walkover = statDeltasForResult(
    match,
    normalizeTournamentResult(
      {
        winnerUid: 'player-a',
        walkover: true,
        scores: [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
      },
      match,
    ),
  );
  assert.deepEqual(walkover.get('player-a'), { leaguePoints26: 1, league: "Men's" });
  assert.deepEqual(walkover.get('player-b'), { leaguePoints26: 1, league: "Men's" });
  assert.equal(walkover.get('player-a').pointswon, undefined);
  assert.equal(walkover.get('player-a').totalPointsPlayed, undefined);
});
