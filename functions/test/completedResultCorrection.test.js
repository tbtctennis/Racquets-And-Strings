const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { HttpsError } = require('firebase-functions/v2/https');
const { COMPLETED_RESULT_AUDIT_COLLECTION, handleCorrectCompletedResult } = require('../lib/completedResultCorrection');

const ADMIN = '7PvfzNtDmsOq5GLMieId7QRT7wH3';
const OWNER = 'organizer-a';
const PLAYER_A = 'player-a';
const PLAYER_B = 'player-b';
const OUTSIDER = 'member-z';
const NOW = '2026-09-11T16:00:00.000Z';
const COMPLETED_AT = '2026-09-10T18:00:00.000Z';

const SCORES_INITIAL = [
  [6, 4],
  [6, 2],
  [0, 0],
];
const SCORES_CORRECTED = [
  [6, 4],
  [7, 5],
  [0, 0],
];

function completedMatch(overrides = {}) {
  return {
    event_id: 'event-1',
    category: 'singles',
    tournament_choice: 'Singles',
    division: "Men's",
    skill_group: 'Beginners',
    format: 'rr',
    round: 'RR',
    status: 'complete',
    player_1_uid: PLAYER_A,
    player_1_name: 'Player A',
    player_2_uid: PLAYER_B,
    player_2_name: 'Player B',
    winner_uid: PLAYER_A,
    winner_name: 'Player A',
    set_1_player_1: 6,
    set_1_player_2: 4,
    set_2_player_1: 6,
    set_2_player_2: 2,
    set_3_player_1: 0,
    set_3_player_2: 0,
    walkover: false,
    completed_at: COMPLETED_AT,
    points_winner: 3,
    points_loser: 1,
    ...overrides,
  };
}

function applySentinel(existing, value) {
  if (!value || typeof value !== 'object') return { set: true, value };
  const name = value.constructor && value.constructor.name;
  if (name === 'DeleteTransform') return { delete: true };
  if (name === 'NumericIncrementTransform') {
    return { set: true, value: (typeof existing === 'number' ? existing : 0) + value.operand };
  }
  return { set: true, value };
}

function applyPatch(existing, patch, merge) {
  const next = merge ? { ...(existing || {}) } : {};
  if (!merge) Object.assign(next, existing || {});
  for (const [key, value] of Object.entries(patch)) {
    const applied = applySentinel(next[key], value);
    if (applied.delete) delete next[key];
    else next[key] = applied.value;
  }
  return next;
}

function mockDb(existing = {}) {
  const docs = { ...existing };
  let auditCount = 0;

  const docRef = (path) => ({
    path,
    id: path.split('/').slice(1).join('/'),
    __type: 'doc',
  });

  const matchesQuery = (collectionName, filters) => {
    const query = {
      __type: 'query',
      collectionName,
      filters,
      where: (field, op, value) => matchesQuery(collectionName, [...filters, { field, op, value }]),
    };
    return query;
  };

  const docsForQuery = (query) =>
    Object.entries(docs)
      .filter(([path]) => path.startsWith(`${query.collectionName}/`))
      .filter(([, data]) => query.filters.every(({ field, op, value }) => op === '==' && data[field] === value))
      .map(([path, data]) => ({
        id: path.split('/').slice(1).join('/'),
        ref: docRef(path),
        data: () => data,
      }));

  return {
    docs,
    collection: (name) => ({
      doc: (id) => docRef(id ? `${name}/${id}` : `${name}/audit-${++auditCount}`),
      where: (field, op, value) => matchesQuery(name, [{ field, op, value }]),
    }),
    runTransaction: async (fn) => {
      const tx = {
        get: async (refOrQuery) => {
          if (refOrQuery.__type === 'query') {
            return { docs: docsForQuery(refOrQuery) };
          }
          return {
            exists: Object.prototype.hasOwnProperty.call(docs, refOrQuery.path),
            data: () => docs[refOrQuery.path],
            id: refOrQuery.id,
            ref: refOrQuery,
          };
        },
        update: (ref, data) => {
          docs[ref.path] = applyPatch(docs[ref.path], data, true);
        },
        set: (ref, data, opts = {}) => {
          docs[ref.path] = applyPatch(docs[ref.path], data, opts.merge === true);
        },
        create: (ref, data) => {
          if (Object.prototype.hasOwnProperty.call(docs, ref.path)) {
            throw new Error(`already exists: ${ref.path}`);
          }
          docs[ref.path] = data;
        },
      };
      return fn(tx);
    },
  };
}

function seedCorrectionDb(matchOverrides = {}, extraDocs = {}) {
  return mockDb({
    'matches/m1': completedMatch(matchOverrides),
    'events/event-1': { id: 'event-1', creator_id: OWNER, title: 'Open', organizer_ids: [] },
    'event_participants/p1': { event_id: 'event-1', uid: PLAYER_A, status: 'active' },
    'event_participants/p2': { event_id: 'event-1', uid: PLAYER_B, status: 'active' },
    [`stats/${PLAYER_A}`]: { leaguePoints26: 3, matchesPlayed: 1, wins: 1, pointswon: 12, totalPointsPlayed: 18 },
    [`stats/${PLAYER_B}`]: { leaguePoints26: 1, matchesPlayed: 1, pointswon: 6, totalPointsPlayed: 18 },
    ...extraDocs,
  });
}

function correctionData(overrides = {}) {
  return {
    matchId: 'm1',
    winnerUid: PLAYER_A,
    scores: SCORES_CORRECTED,
    reason: 'Scorecard showed 7-5 in the second set.',
    ...overrides,
  };
}

function callCorrection(db, uid, data) {
  return handleCorrectCompletedResult({ auth: uid ? { uid } : null, data }, { db, superAdminUid: ADMIN, nowIso: NOW });
}

test('unauthenticated correction is rejected before any write', async () => {
  const db = seedCorrectionDb();
  await assert.rejects(
    () => callCorrection(db, null, correctionData()),
    (error) => error instanceof HttpsError && error.code === 'unauthenticated',
  );
  assert.equal(db.docs[`${COMPLETED_RESULT_AUDIT_COLLECTION}/audit-1`], undefined);
  assert.deepEqual(db.docs['matches/m1'].set_2_player_1, 6);
  assert.deepEqual(db.docs['matches/m1'].set_2_player_2, 2);
});

test('unauthorized callers cannot correct a completed result', async () => {
  const outsiderDb = seedCorrectionDb();
  await assert.rejects(
    () => callCorrection(outsiderDb, OUTSIDER, correctionData()),
    (error) => error instanceof HttpsError && error.code === 'permission-denied',
  );
  assert.equal(outsiderDb.docs[`${COMPLETED_RESULT_AUDIT_COLLECTION}/audit-1`], undefined);

  const playerDb = seedCorrectionDb();
  await assert.rejects(
    () => callCorrection(playerDb, PLAYER_A, correctionData()),
    (error) => error instanceof HttpsError && error.code === 'permission-denied',
  );
  assert.equal(playerDb.docs['matches/m1'].set_2_player_2, 2);
});

test('malformed correction input is rejected without mutating state', async () => {
  const missingReason = seedCorrectionDb();
  await assert.rejects(
    () => callCorrection(missingReason, OWNER, correctionData({ reason: '   ' })),
    (error) => error instanceof HttpsError && error.code === 'invalid-argument',
  );

  const pending = seedCorrectionDb({ status: 'pending', winner_uid: '' });
  await assert.rejects(
    () => callCorrection(pending, OWNER, correctionData()),
    (error) => error instanceof HttpsError && error.code === 'failed-precondition',
  );

  const badScores = seedCorrectionDb();
  await assert.rejects(
    () =>
      callCorrection(
        badScores,
        OWNER,
        correctionData({
          scores: [
            [100, 0],
            [0, 0],
            [0, 0],
          ],
        }),
      ),
    (error) => error instanceof HttpsError && error.code === 'invalid-argument',
  );

  const missing = seedCorrectionDb();
  await assert.rejects(
    () => callCorrection(missing, OWNER, correctionData({ matchId: 'missing' })),
    (error) => error instanceof HttpsError && error.code === 'not-found',
  );

  assert.equal(missingReason.docs[`${COMPLETED_RESULT_AUDIT_COLLECTION}/audit-1`], undefined);
  assert.equal(pending.docs['matches/m1'].status, 'pending');
  assert.equal(badScores.docs['matches/m1'].set_2_player_2, 2);
});

test('authorized correction records actor/reason/before/after and recomputes atomically', async () => {
  const db = seedCorrectionDb();
  const result = await callCorrection(db, OWNER, correctionData());

  assert.deepEqual(result, {
    applied: true,
    duplicate: false,
    advanced: false,
    needsManual: false,
    reconciled: true,
  });

  const match = db.docs['matches/m1'];
  assert.equal(match.winner_uid, PLAYER_A);
  assert.equal(match.set_2_player_1, 7);
  assert.equal(match.set_2_player_2, 5);
  assert.equal(match.status, 'complete');
  assert.equal(match.completed_at, COMPLETED_AT);
  assert.equal(match.points_winner, 3);
  assert.equal(match.points_loser, 1);
  assert.equal(match.score_disputed, false);
  assert.equal(match.score_disputed_at, undefined);

  const audit = db.docs[`${COMPLETED_RESULT_AUDIT_COLLECTION}/audit-1`];
  assert.equal(audit.actor_uid, OWNER);
  assert.equal(audit.reason, 'Scorecard showed 7-5 in the second set.');
  assert.equal(audit.action, 'correct');
  assert.equal(audit.match_id, 'm1');
  assert.equal(audit.event_id, 'event-1');
  assert.equal(audit.recorded_at, NOW);
  assert.equal(audit.before.winnerUid, PLAYER_A);
  assert.deepEqual(audit.before.scores, {
    set_1: { player_1: 6, player_2: 4 },
    set_2: { player_1: 6, player_2: 2 },
    set_3: { player_1: 0, player_2: 0 },
  });
  assert.equal(audit.after.winnerUid, PLAYER_A);
  assert.deepEqual(audit.after.scores, {
    set_1: { player_1: 6, player_2: 4 },
    set_2: { player_1: 7, player_2: 5 },
    set_3: { player_1: 0, player_2: 0 },
  });

  assert.equal(db.docs[`stats/${PLAYER_A}`].leaguePoints26, 3);
  assert.equal(db.docs[`stats/${PLAYER_A}`].matchesPlayed, 1);
  assert.equal(db.docs[`stats/${PLAYER_A}`].wins, 1);
  assert.equal(db.docs[`stats/${PLAYER_A}`].pointswon, 13);
  assert.equal(db.docs[`stats/${PLAYER_A}`].totalPointsPlayed, 22);
  assert.equal(db.docs[`stats/${PLAYER_B}`].leaguePoints26, 1);
  assert.equal(db.docs[`stats/${PLAYER_B}`].pointswon, 9);
  assert.equal(db.docs[`stats/${PLAYER_B}`].totalPointsPlayed, 22);
});

test('an assigned organizer can correct; a locked next-round winner cannot change', async () => {
  const assigned = seedCorrectionDb(
    {},
    { 'events/event-1': { id: 'event-1', creator_id: 'someone-else', organizer_ids: [OWNER] } },
  );
  const applied = await callCorrection(assigned, OWNER, correctionData());
  assert.equal(applied.applied, true);
  assert.equal(assigned.docs['matches/m1'].set_2_player_2, 5);

  const locked = seedCorrectionDb({
    format: 'knockout',
    round: 'SF',
    next_match_id: 'F',
    next_slot: 'player_1',
  });
  locked.docs['matches/m2'] = {
    event_id: 'event-1',
    match_id: 'F',
    category: 'singles',
    tournament_choice: 'Singles',
    division: "Men's",
    skill_group: 'Beginners',
    status: 'complete',
    winner_uid: PLAYER_A,
    player_1_uid: PLAYER_A,
  };
  await assert.rejects(
    () =>
      callCorrection(
        locked,
        OWNER,
        correctionData({
          winnerUid: PLAYER_B,
          scores: [
            [4, 6],
            [2, 6],
            [0, 0],
          ],
        }),
      ),
    (error) => error instanceof HttpsError && error.code === 'failed-precondition',
  );
  assert.equal(locked.docs['matches/m1'].winner_uid, PLAYER_A);
});

test('the callable is exported from Functions', () => {
  const callable = readFileSync(join(__dirname, '../completedResultCorrection.js'), 'utf8');
  const index = readFileSync(join(__dirname, '../index.js'), 'utf8');
  assert.match(callable, /exports.correctCompletedResult/);
  assert.match(callable, /handleCorrectCompletedResult/);
  assert.match(index, /require\('\.\/completedResultCorrection'\)/);
});
