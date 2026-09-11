import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { paidAward, statDeltasForResult, storedTournamentResult } = require('../../functions/lib/tournamentResult.js');

export const STAT_FIELDS = Object.freeze(['leaguePoints26', 'matchesPlayed', 'wins', 'pointswon', 'totalPointsPlayed']);

const TOURNAMENT_CATEGORIES = new Set(['singles', 'doubles']);
const GHOST_UIDS = new Set(['BYE', 'PLAYER_LOADING']);

const numeric = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const isGhost = (uid) => !uid || GHOST_UIDS.has(uid);

export const isReplayableTournamentMatch = (match) =>
  Boolean(
    match &&
    TOURNAMENT_CATEGORIES.has(match.category) &&
    match.status === 'complete' &&
    match.winner_uid &&
    !isGhost(match.player_1_uid) &&
    !isGhost(match.player_2_uid) &&
    match.player_1_uid !== match.player_2_uid,
  );

const addNumeric = (target, uid, delta) => {
  if (isGhost(uid) || !delta) return;
  const current = target.get(uid) || {};
  for (const field of STAT_FIELDS) {
    const value = delta[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    current[field] = numeric(current[field]) + value;
  }
  target.set(uid, current);
};

const driftRow = ({ collection, id, field, stored, expected, reason }) => ({
  collection,
  id,
  field,
  stored,
  expected,
  reason,
});

export const formatDrift = ({ collection, id, field, stored, expected }) =>
  `${collection}/${id}.${field}: ${stored ?? '(missing)'} ≠ ${expected ?? '(missing)'}`;

const explains = (row, explained) =>
  explained.some((item) => {
    if (typeof item === 'string') {
      return (
        item === row.field || item === `${row.id}.${row.field}` || item === `${row.collection}/${row.id}.${row.field}`
      );
    }
    return item?.id === row.id && item?.field === row.field;
  });

/** Replay completed tournament matches through the Functions award table. */
export const replayMatchDeltas = (matches) => {
  const totals = new Map();
  const awardDrift = [];

  for (const match of matches) {
    if (!isReplayableTournamentMatch(match)) continue;
    const result = storedTournamentResult(match);
    const paid = paidAward(match, result);
    if (Number.isFinite(match.points_winner) && Number.isFinite(match.points_loser)) {
      if (match.points_winner !== paid.points_winner || match.points_loser !== paid.points_loser) {
        if (match.points_winner !== paid.points_winner) {
          awardDrift.push(
            driftRow({
              collection: 'matches',
              id: match.id,
              field: 'points_winner',
              stored: match.points_winner,
              expected: paid.points_winner,
              reason: 'paidAward',
            }),
          );
        }
        if (match.points_loser !== paid.points_loser) {
          awardDrift.push(
            driftRow({
              collection: 'matches',
              id: match.id,
              field: 'points_loser',
              stored: match.points_loser,
              expected: paid.points_loser,
              reason: 'paidAward',
            }),
          );
        }
      }
    }
    for (const [uid, delta] of statDeltasForResult(match, result)) {
      addNumeric(totals, uid, delta);
    }
  }

  return { totals, awardDrift };
};

export const r6Violations = (stats) =>
  stats.flatMap(({ id, data }) => {
    if (data?.loses === undefined) return [];
    const expected = numeric(data.matchesPlayed) - numeric(data.wins);
    if (data.loses === expected) return [];
    return [
      driftRow({
        collection: 'stats',
        id,
        field: 'loses',
        stored: data.loses,
        expected,
        reason: 'R6',
      }),
    ];
  });

/**
 * Diff stored stats against a match replay.
 * A baseline (including `[]`) makes the stats comparison first-class; without one, pre-2026
 * counters stay authoritative and only award/R6 mismatches are unexplained.
 */
export const planRecomputeDiff = (stats, matches, options = {}) => {
  const explained = options.explained || [];
  const hasBaseline = Object.hasOwn(options, 'baseline');
  const baselineById = new Map((options.baseline || []).map((row) => [row.id, row.data || {}]));
  const { totals, awardDrift } = replayMatchDeltas(matches);
  const invariantDrift = r6Violations(stats);
  const statsDrift = [];

  if (hasBaseline) {
    const seen = new Set();
    for (const { id, data } of stats) {
      seen.add(id);
      const replayed = totals.get(id) || {};
      const base = baselineById.get(id) || {};
      for (const field of STAT_FIELDS) {
        const expected = numeric(base[field]) + numeric(replayed[field]);
        const stored = numeric(data?.[field]);
        if (stored === expected) continue;
        statsDrift.push(
          driftRow({
            collection: 'stats',
            id,
            field,
            stored,
            expected,
            reason: 'baseline+replay',
          }),
        );
      }
    }
    for (const [id, replayed] of totals) {
      if (seen.has(id)) continue;
      const base = baselineById.get(id) || {};
      for (const field of STAT_FIELDS) {
        const expected = numeric(base[field]) + numeric(replayed[field]);
        if (expected === 0) continue;
        statsDrift.push(
          driftRow({
            collection: 'stats',
            id,
            field,
            stored: 0,
            expected,
            reason: 'baseline+replay',
          }),
        );
      }
    }
  }

  const diffs = [...awardDrift, ...invariantDrift, ...statsDrift];
  const unexplained = [...awardDrift, ...invariantDrift, ...statsDrift.filter((row) => !explains(row, explained))];

  return {
    scanned: stats.length,
    replayed: totals.size,
    diffs,
    unexplained,
    ok: unexplained.length === 0,
  };
};

export const unexplainedDriftError = (plan) =>
  `Unexplained stats drift; migration refused: ${(plan?.unexplained || []).map(formatDrift).join(', ')}`;

export const assertReconciled = (plan) => {
  if (!Array.isArray(plan?.unexplained) || plan.unexplained.length || plan.ok === false) {
    throw new Error(unexplainedDriftError(plan));
  }
  return plan;
};

const collectionDocs = async (db, name) => {
  const snap = await db.collection(name).get();
  return snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
};

/** Load stats/matches and plan the recompute-and-diff. Does not throw. */
export const reconcileFromDb = async (db, options = {}) => {
  const [stats, matchDocs] = await Promise.all([collectionDocs(db, 'stats'), collectionDocs(db, 'matches')]);
  const matches = matchDocs.map(({ id, data }) => ({ id, ...(data || {}) }));
  return planRecomputeDiff(stats, matches, options);
};
