const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { HttpsError } = require('firebase-functions/v2/https');
const {
  ORGANIZER_ASSIGNMENT_AUDIT_COLLECTION,
  applyOrganizerAssignment,
  normalizeOrganizerIds,
} = require('../lib/organizerAssignment');

const ADMIN = '7PvfzNtDmsOq5GLMieId7QRT7wH3';
const OWNER = 'organizer-a';
const ASSIGNED = 'organizer-b';
const NOW = '2026-09-11T12:00:00.000Z';

function mockDb(existing = {}) {
  const docs = { ...existing };
  let auditCount = 0;
  return {
    docs,
    doc: (path) => ({
      path,
      get: async () => ({
        exists: Object.prototype.hasOwnProperty.call(docs, path),
        data: () => docs[path],
        id: path.split('/')[1],
      }),
    }),
    collection: (name) => ({
      doc: () => ({ path: `${name}/audit-${++auditCount}` }),
    }),
    batch: () => {
      const writes = [];
      return {
        set: (ref, data) => writes.push({ path: ref.path, data, merge: false }),
        update: (ref, data) => writes.push({ path: ref.path, data, merge: true }),
        commit: async () => {
          for (const write of writes) {
            docs[write.path] = write.merge ? { ...docs[write.path], ...write.data } : write.data;
          }
        },
      };
    },
  };
}

test('assigning organizers records actor, target, before/after, and time', async () => {
  const db = mockDb({
    'events/event-1': { id: 'event-1', creator_id: OWNER, title: 'Open' },
  });
  const result = await applyOrganizerAssignment({
    db,
    uid: OWNER,
    superAdminUid: ADMIN,
    data: { eventId: 'event-1', organizerIds: ['  organizer-b  '] },
    nowIso: NOW,
  });

  assert.deepEqual(result, {
    ok: true,
    event_id: 'event-1',
    organizer_ids: [ASSIGNED],
    changed: true,
  });
  assert.deepEqual(db.docs['events/event-1'].organizer_ids, [ASSIGNED]);
  const audit = db.docs[`${ORGANIZER_ASSIGNMENT_AUDIT_COLLECTION}/audit-1`];
  assert.equal(audit.actor_uid, OWNER);
  assert.equal(audit.event_id, 'event-1');
  assert.deepEqual(audit.target_uids, [ASSIGNED]);
  assert.deepEqual(audit.before, []);
  assert.deepEqual(audit.after, [ASSIGNED]);
  assert.equal(audit.created_at, NOW);
});

test('replacing organizers records the previous and next lists on one audit row', async () => {
  const db = mockDb({
    'events/event-1': {
      id: 'event-1',
      creator_id: OWNER,
      organizer_ids: [ASSIGNED],
    },
  });
  await applyOrganizerAssignment({
    db,
    uid: ADMIN,
    superAdminUid: ADMIN,
    data: { eventId: 'event-1', organizerIds: ['member-a'] },
    nowIso: NOW,
  });
  const audit = db.docs[`${ORGANIZER_ASSIGNMENT_AUDIT_COLLECTION}/audit-1`];
  assert.equal(audit.actor_uid, ADMIN);
  assert.deepEqual(audit.target_uids, ['member-a', ASSIGNED]);
  assert.deepEqual(audit.before, [ASSIGNED]);
  assert.deepEqual(audit.after, ['member-a']);
  assert.equal(audit.created_at, NOW);
});

test('an identical organizer set does not write an audit row', async () => {
  const db = mockDb({
    'events/event-1': {
      id: 'event-1',
      creator_id: OWNER,
      organizer_ids: [ASSIGNED],
    },
  });
  const result = await applyOrganizerAssignment({
    db,
    uid: OWNER,
    superAdminUid: ADMIN,
    data: { eventId: 'event-1', organizerIds: [ASSIGNED] },
    nowIso: NOW,
  });
  assert.equal(result.changed, false);
  assert.equal(db.docs[`${ORGANIZER_ASSIGNMENT_AUDIT_COLLECTION}/audit-1`], undefined);
});

test('assigned organizers cannot change organizer_ids', async () => {
  await assert.rejects(
    () =>
      applyOrganizerAssignment({
        db: mockDb({
          'events/event-1': {
            id: 'event-1',
            creator_id: OWNER,
            organizer_ids: [ASSIGNED],
          },
        }),
        uid: ASSIGNED,
        superAdminUid: ADMIN,
        data: { eventId: 'event-1', organizerIds: [ASSIGNED, 'member-a'] },
        nowIso: NOW,
      }),
    (error) => error instanceof HttpsError && error.code === 'permission-denied',
  );
});

test('missing events and malformed ids are rejected before write', () => {
  assert.throws(
    () => normalizeOrganizerIds('organizer-b'),
    (error) => error instanceof HttpsError && error.code === 'invalid-argument',
  );
  assert.throws(
    () => normalizeOrganizerIds(['']),
    (error) => error instanceof HttpsError && error.code === 'invalid-argument',
  );
});

test('a missing event is not-found', async () => {
  await assert.rejects(
    () =>
      applyOrganizerAssignment({
        db: mockDb(),
        uid: OWNER,
        superAdminUid: ADMIN,
        data: { eventId: 'missing', organizerIds: [ASSIGNED] },
        nowIso: NOW,
      }),
    (error) => error instanceof HttpsError && error.code === 'not-found',
  );
});

test('the callable is exported from Functions', () => {
  const callable = readFileSync(join(__dirname, '../organizerAssignment.js'), 'utf8');
  const index = readFileSync(join(__dirname, '../index.js'), 'utf8');
  assert.match(callable, /exports.assignEventOrganizers/);
  assert.match(callable, /applyOrganizerAssignment/);
  assert.match(index, /require\('\.\/organizerAssignment'\)/);
});
