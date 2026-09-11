const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { HttpsError } = require('firebase-functions/v2/https');
const { GROUP_BONUS_POINTS, RR_GROUP_BONUS_AUDIT_COLLECTION, applyGroupBonus } = require('../lib/groupBonus');

const ADMIN = '7PvfzNtDmsOq5GLMieId7QRT7wH3';
const OWNER = 'organizer-a';
const ASSIGNED = 'organizer-b';
const MEMBER = 'member-a';
const PLAYER_A = 'player-a';
const PLAYER_B = 'player-b';
const NOW = '2026-09-11T12:00:00.000Z';

function applyPatch(current, patch, merge) {
  const next = merge ? { ...(current || {}) } : {};
  for (const [key, value] of Object.entries(patch)) {
    if (value?.constructor?.name === 'DeleteTransform') {
      delete next[key];
      continue;
    }
    if (value && typeof value === 'object' && typeof value.operand === 'number') {
      next[key] = (typeof next[key] === 'number' ? next[key] : 0) + value.operand;
      continue;
    }
    next[key] = value;
  }
  return next;
}

function mockDb(existing = {}) {
  const docs = { ...existing };
  let auditCount = 0;

  const docRef = (path) => ({
    path,
    id: path.split('/')[1],
  });

  const collection = (name) => {
    const whereFilters = [];
    const query = {
      filters: whereFilters,
      where: (field, op, value) => {
        whereFilters.push({ field, op, value });
        return query;
      },
    };
    return {
      doc: (id) => (id ? docRef(`${name}/${id}`) : docRef(`${name}/audit-${++auditCount}`)),
      where: (field, op, value) => {
        whereFilters.push({ field, op, value });
        return query;
      },
    };
  };

  return {
    docs,
    collection,
    runTransaction: async (fn) => {
      const tx = {
        get: async (refOrQuery) => {
          if (refOrQuery.path) {
            return {
              exists: Object.prototype.hasOwnProperty.call(docs, refOrQuery.path),
              data: () => docs[refOrQuery.path],
              id: refOrQuery.id,
              ref: refOrQuery,
            };
          }
          const hits = Object.entries(docs).filter(([path, data]) => {
            if (!path.startsWith('matches/')) return false;
            return (refOrQuery.filters || []).every(({ field, op, value }) => {
              if (op === '==') return data[field] === value;
              return false;
            });
          });
          return {
            docs: hits.map(([path, data]) => ({
              id: path.split('/')[1],
              ref: docRef(path),
              data: () => data,
            })),
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

function rrMatch({ id, bonus, player2 = PLAYER_B, extra = {} }) {
  return {
    [`matches/${id}`]: {
      event_id: 'event-1',
      format: 'rr',
      round: 'RR',
      rr_group: 0,
      tournament_choice: 'Singles',
      division: "Men's",
      player_1_uid: PLAYER_A,
      player_2_uid: player2,
      ...(bonus === true ? { rr_groupbonus: true } : {}),
      ...extra,
    },
  };
}

function eventDoc(overrides = {}) {
  return {
    'events/event-1': {
      id: 'event-1',
      creator_id: OWNER,
      title: 'Open',
      ...overrides,
    },
  };
}

function call(db, { uid = OWNER, data = { eventId: 'event-1', rrGroup: 0, award: true } } = {}) {
  return applyGroupBonus({
    db,
    uid,
    superAdminUid: ADMIN,
    data,
    nowIso: NOW,
  });
}

test('awarding a group pays each member +5 once, stamps every match, and writes an audit row', async () => {
  const db = mockDb({
    ...eventDoc(),
    ...rrMatch({ id: 'm1' }),
    ...rrMatch({ id: 'm2', player2: 'player-c' }),
    'stats/player-a': { leaguePoints26: 10 },
    'stats/player-b': { leaguePoints26: 4 },
    'stats/player-c': { leaguePoints26: 0 },
  });

  const result = await call(db);

  assert.deepEqual(result, {
    applied: true,
    awarded: true,
    duplicate: false,
    reconciled: true,
    players: 3,
    points_delta: GROUP_BONUS_POINTS,
  });
  assert.equal(db.docs['matches/m1'].rr_groupbonus, true);
  assert.equal(db.docs['matches/m2'].rr_groupbonus, true);
  assert.equal(db.docs['stats/player-a'].leaguePoints26, 15);
  assert.equal(db.docs['stats/player-b'].leaguePoints26, 9);
  assert.equal(db.docs['stats/player-c'].leaguePoints26, 5);

  const audit = db.docs[`${RR_GROUP_BONUS_AUDIT_COLLECTION}/audit-1`];
  assert.equal(audit.actor_uid, OWNER);
  assert.equal(audit.event_id, 'event-1');
  assert.equal(audit.rr_group, 0);
  assert.equal(audit.action, 'award');
  assert.deepEqual(audit.before, { awarded: false, mixed: false });
  assert.deepEqual(audit.after, { awarded: true, mixed: false });
  assert.deepEqual(audit.player_uids, ['player-a', 'player-b', 'player-c']);
  assert.equal(audit.points_delta, 5);
  assert.equal(audit.created_at, NOW);
});

test('a second award of the same group is a no-op and writes no audit row', async () => {
  const db = mockDb({
    ...eventDoc(),
    ...rrMatch({ id: 'm1', bonus: true }),
    ...rrMatch({ id: 'm2', bonus: true }),
    'stats/player-a': { leaguePoints26: 15 },
    'stats/player-b': { leaguePoints26: 9 },
  });

  const result = await call(db);
  assert.deepEqual(result, { applied: false, awarded: true, duplicate: true, reconciled: false });
  assert.equal(db.docs[`${RR_GROUP_BONUS_AUDIT_COLLECTION}/audit-1`], undefined);
  assert.equal(db.docs['stats/player-a'].leaguePoints26, 15);
});

test('reversing a fully stamped group removes exactly +5 and records before/after', async () => {
  const db = mockDb({
    ...eventDoc(),
    ...rrMatch({ id: 'm1', bonus: true }),
    ...rrMatch({ id: 'm2', bonus: true }),
    'stats/player-a': { leaguePoints26: 15 },
    'stats/player-b': { leaguePoints26: 9 },
  });

  const result = await call(db, { data: { eventId: 'event-1', rrGroup: 0, award: false } });
  assert.equal(result.applied, true);
  assert.equal(result.awarded, false);
  assert.equal(result.points_delta, -GROUP_BONUS_POINTS);
  assert.equal(db.docs['matches/m1'].rr_groupbonus, false);
  assert.equal(db.docs['stats/player-a'].leaguePoints26, 10);
  assert.equal(db.docs['stats/player-b'].leaguePoints26, 4);
  const audit = db.docs[`${RR_GROUP_BONUS_AUDIT_COLLECTION}/audit-1`];
  assert.equal(audit.actor_uid, OWNER);
  assert.equal(audit.action, 'reverse');
  assert.deepEqual(audit.before, { awarded: true, mixed: false });
  assert.deepEqual(audit.after, { awarded: false, mixed: false });
});

test('mixed stamps are unified without a second payout', async () => {
  const db = mockDb({
    ...eventDoc(),
    ...rrMatch({ id: 'm1', bonus: true }),
    ...rrMatch({ id: 'm2' }),
    'stats/player-a': { leaguePoints26: 15 },
    'stats/player-b': { leaguePoints26: 9 },
  });

  const result = await call(db);
  assert.equal(result.applied, true);
  assert.equal(result.reconciled, true);
  assert.equal(result.points_delta, 0);
  assert.equal(db.docs['matches/m1'].rr_groupbonus, true);
  assert.equal(db.docs['matches/m2'].rr_groupbonus, true);
  assert.equal(db.docs['stats/player-a'].leaguePoints26, 15);
  const audit = db.docs[`${RR_GROUP_BONUS_AUDIT_COLLECTION}/audit-1`];
  assert.deepEqual(audit.before, { awarded: false, mixed: true });
  assert.equal(audit.points_delta, 0);
});

test('BYE and PLAYER_LOADING slots are not paid', async () => {
  const db = mockDb({
    ...eventDoc(),
    ...rrMatch({ id: 'm1', player2: 'BYE' }),
    ...rrMatch({ id: 'm2', player2: 'PLAYER_LOADING' }),
  });
  const result = await call(db);
  assert.equal(result.players, 1);
  assert.equal(db.docs['stats/player-a'].leaguePoints26, 5);
  assert.equal(db.docs['stats/BYE'], undefined);
  assert.equal(db.docs['stats/PLAYER_LOADING'], undefined);
});

test('assigned organizers and the super-admin may award; other members may not', async () => {
  const assignedDb = mockDb({
    ...eventDoc({ organizer_ids: [ASSIGNED] }),
    ...rrMatch({ id: 'm1' }),
  });
  const assigned = await call(assignedDb, { uid: ASSIGNED });
  assert.equal(assigned.applied, true);

  const adminDb = mockDb({
    ...eventDoc(),
    ...rrMatch({ id: 'm1' }),
  });
  const admin = await call(adminDb, { uid: ADMIN });
  assert.equal(admin.applied, true);

  await assert.rejects(
    () =>
      call(mockDb({ ...eventDoc(), ...rrMatch({ id: 'm1' }) }), {
        uid: MEMBER,
      }),
    (error) => error instanceof HttpsError && error.code === 'permission-denied',
  );
});

test('missing events, missing groups, and malformed input fail closed', async () => {
  await assert.rejects(
    () => call(mockDb(), { data: { eventId: 'missing', rrGroup: 0, award: true } }),
    (error) => error instanceof HttpsError && error.code === 'not-found',
  );
  await assert.rejects(
    () =>
      call(mockDb({ ...eventDoc(), ...rrMatch({ id: 'm1' }) }), {
        data: { eventId: 'event-1', rrGroup: 9, award: true },
      }),
    (error) => error instanceof HttpsError && error.code === 'not-found' && /group/.test(error.message),
  );
  await assert.rejects(
    () =>
      call(mockDb({ ...eventDoc() }), {
        data: { eventId: 'event-1', rrGroup: -1, award: true },
      }),
    (error) => error instanceof HttpsError && error.code === 'invalid-argument',
  );
  await assert.rejects(
    () =>
      call(mockDb({ ...eventDoc() }), {
        data: { eventId: 'event-1', rrGroup: 0, award: 'yes' },
      }),
    (error) => error instanceof HttpsError && error.code === 'invalid-argument',
  );
});

test('the callable is exported from Functions', () => {
  const callable = readFileSync(join(__dirname, '../competitionResults.js'), 'utf8');
  const index = readFileSync(join(__dirname, '../index.js'), 'utf8');
  assert.match(callable, /exports.setGroupBonus/);
  assert.match(callable, /applyGroupBonus/);
  assert.match(index, /require\('\.\/competitionResults'\)/);
});
