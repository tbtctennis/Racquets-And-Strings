const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { HttpsError } = require('firebase-functions/v2/https');
const {
  COURT_RESOLUTION_AUDIT_COLLECTION,
  COURT_RESOLUTIONS_COLLECTION,
  applyCourtResolution,
  buildCourtResolution,
  zoneForCourt,
} = require('../lib/courtResolution');
const { locationFromPreferredCourts } = require('../lib/memberLocation');

const ADMIN = '7PvfzNtDmsOq5GLMieId7QRT7wH3';
const NOW = '2026-09-11T12:00:00.000Z';
const shipped = require('../courts.json');

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
        set: (ref, data) => writes.push({ path: ref.path, data }),
        commit: async () => {
          for (const write of writes) docs[write.path] = write.data;
        },
      };
    },
  };
}

test('runtime overlay resolves a court zone without the shipped roster', () => {
  assert.equal(zoneForCourt('Unknown Park', { shippedRoster: shipped }), '');
  assert.equal(
    zoneForCourt('Unknown Park', {
      shippedRoster: shipped,
      runtimeResolutions: { 'unknown-park': { zone: 'North York' } },
    }),
    'North York',
  );
  assert.equal(shipped['unknown-park'], undefined);
});

test('runtime overlay wins over a shipped court zone without editing courts.json', () => {
  assert.equal(zoneForCourt('Ramsden Park', { shippedRoster: shipped }), 'Downtown - Midtown');
  assert.equal(
    zoneForCourt('Ramsden Park', {
      shippedRoster: shipped,
      runtimeResolutions: { 'ramsden-park': { zone: 'North York' } },
    }),
    'North York',
  );
  assert.equal(shipped['ramsden-park'], 'Downtown - Midtown');
});

test('adding a court writes the overlay and an actor/before/after/time audit row', async () => {
  const db = mockDb();
  const result = await applyCourtResolution({
    db,
    uid: ADMIN,
    superAdminUid: ADMIN,
    data: { name: '  New Park Tennis  ', zone: 'Etobicoke' },
    nowIso: NOW,
  });

  assert.deepEqual(result, { ok: true, court_key: 'new-park-tennis', zone: 'Etobicoke' });
  const court = db.docs[`${COURT_RESOLUTIONS_COLLECTION}/new-park-tennis`];
  assert.equal(court.name, 'New Park Tennis');
  assert.equal(court.zone, 'Etobicoke');
  assert.equal(court.created_by, ADMIN);
  assert.equal(court.updated_at, NOW);
  const audit = db.docs[`${COURT_RESOLUTION_AUDIT_COLLECTION}/audit-1`];
  assert.equal(audit.actor_uid, ADMIN);
  assert.equal(audit.before, null);
  assert.deepEqual(audit.after, { name: 'New Park Tennis', zone: 'Etobicoke', lat: null, lng: null });
  assert.equal(audit.created_at, NOW);
  assert.equal(shipped['new-park-tennis'], undefined);
});

test('re-resolving a court records the previous zone on the audit row', async () => {
  const db = mockDb({
    [`${COURT_RESOLUTIONS_COLLECTION}/new-park-tennis`]: {
      court_key: 'new-park-tennis',
      name: 'New Park Tennis',
      zone: 'Etobicoke',
      created_by: 'older-admin',
      created_at: '2026-09-01T00:00:00.000Z',
      updated_by: 'older-admin',
      updated_at: '2026-09-01T00:00:00.000Z',
    },
  });
  await applyCourtResolution({
    db,
    uid: ADMIN,
    superAdminUid: ADMIN,
    data: { name: 'New Park Tennis', zone: 'York West' },
    nowIso: NOW,
  });
  const court = db.docs[`${COURT_RESOLUTIONS_COLLECTION}/new-park-tennis`];
  assert.equal(court.zone, 'York West');
  assert.equal(court.created_by, 'older-admin');
  const audit = Object.values(db.docs).find((row) => row.actor_uid === ADMIN);
  assert.equal(audit.before.zone, 'Etobicoke');
  assert.equal(audit.after.zone, 'York West');
});

test('only the super-admin can add a court', async () => {
  await assert.rejects(
    () =>
      applyCourtResolution({
        db: mockDb(),
        uid: 'member-a',
        superAdminUid: ADMIN,
        data: { name: 'New Park Tennis', zone: 'Etobicoke' },
        nowIso: NOW,
      }),
    (error) => error instanceof HttpsError && error.code === 'permission-denied',
  );
});

test('a runtime court earns the Toronto location without a shipped roster entry', () => {
  assert.equal(locationFromPreferredCourts(['Unknown Park']), undefined);
  assert.equal(locationFromPreferredCourts(['Unknown Park'], { 'unknown-park': { zone: 'North York' } }), 'Toronto');
});

test('invalid zone or split coordinates are rejected before write', () => {
  assert.throws(
    () => buildCourtResolution({ name: 'New Park', zone: 'Mars', actorUid: ADMIN, nowIso: NOW }),
    (error) => error instanceof HttpsError && error.code === 'invalid-argument',
  );
  assert.throws(
    () => buildCourtResolution({ name: 'New Park', zone: 'Etobicoke', actorUid: ADMIN, nowIso: NOW, lat: 43.6 }),
    (error) => error instanceof HttpsError && error.code === 'invalid-argument',
  );
});

test('the callable is exported from Functions', () => {
  const callable = readFileSync(join(__dirname, '../courtResolution.js'), 'utf8');
  const index = readFileSync(join(__dirname, '../index.js'), 'utf8');
  assert.match(callable, /exports.resolveCourtZone/);
  assert.match(callable, /applyCourtResolution/);
  assert.match(index, /require\('\.\/courtResolution'\)/);
});
