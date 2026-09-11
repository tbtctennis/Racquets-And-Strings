/**
 * Runtime court → zone overlay. Shipped `courts.json` and the CSV stay immutable; admins add
 * a court and its zone here, with an append-only audit row for every change.
 */
const { HttpsError } = require('firebase-functions/v2/https');
const { courtKey } = require('./memberLocation');
const { requireTrimmedString } = require('./callable');

const COURT_RESOLUTIONS_COLLECTION = 'court_resolutions';
const COURT_RESOLUTION_AUDIT_COLLECTION = 'court_resolution_audit';
const ZONE_NAMES = Object.freeze([
  'York West',
  'Etobicoke',
  'Etobicoke - Lakeshore',
  'North York',
  'Downtown - Midtown',
  'North Scarborough',
  'East York and South Scarborough',
]);

function optionalCoord(value, min, max, label) {
  if (value == null || value === '') return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new HttpsError('invalid-argument', `${label} is invalid.`);
  }
  return number;
}

function snapshotFields(data) {
  if (!data) return null;
  return {
    name: typeof data.name === 'string' ? data.name : '',
    zone: typeof data.zone === 'string' ? data.zone : '',
    lat: Number.isFinite(data.lat) ? data.lat : null,
    lng: Number.isFinite(data.lng) ? data.lng : null,
  };
}

function buildCourtResolution({ name, zone, actorUid, nowIso, existing, lat, lng }) {
  const trimmedName = requireTrimmedString(name, 'Court name is required.', { maxLength: 120 });
  const trimmedZone = requireTrimmedString(zone, 'Zone is required.', { maxLength: 80 });
  if (!ZONE_NAMES.includes(trimmedZone)) {
    throw new HttpsError('invalid-argument', 'Zone is required.');
  }
  const key = courtKey(trimmedName);
  if (!key) throw new HttpsError('invalid-argument', 'Court name is required.');

  const parsedLat = optionalCoord(lat, -90, 90, 'Latitude');
  const parsedLng = optionalCoord(lng, -180, 180, 'Longitude');
  if ((parsedLat == null) !== (parsedLng == null)) {
    throw new HttpsError('invalid-argument', 'Latitude and longitude are required together.');
  }

  const after = {
    name: trimmedName,
    zone: trimmedZone,
    lat: parsedLat ?? null,
    lng: parsedLng ?? null,
  };
  const court = {
    court_key: key,
    name: trimmedName,
    zone: trimmedZone,
    created_by: existing?.created_by || actorUid,
    created_at: existing?.created_at || nowIso,
    updated_by: actorUid,
    updated_at: nowIso,
  };
  if (parsedLat != null && parsedLng != null) {
    court.lat = parsedLat;
    court.lng = parsedLng;
  }

  return {
    court,
    audit: {
      court_key: key,
      name: trimmedName,
      actor_uid: actorUid,
      before: snapshotFields(existing),
      after,
      created_at: nowIso,
    },
  };
}

function zoneForCourt(name, { shippedRoster = {}, runtimeResolutions = {} } = {}) {
  const key = courtKey(name);
  if (!key) return '';
  const runtime = runtimeResolutions[key];
  if (runtime && typeof runtime.zone === 'string' && runtime.zone.trim()) return runtime.zone.trim();
  const shipped = shippedRoster[key];
  return typeof shipped === 'string' ? shipped : '';
}

async function applyCourtResolution({ db, uid, superAdminUid, data, nowIso }) {
  if (uid !== superAdminUid) {
    throw new HttpsError('permission-denied', 'Only an admin can add a court.');
  }
  const name = requireTrimmedString(data?.name, 'Court name is required.', { maxLength: 120 });
  const key = courtKey(name);
  const ref = db.doc(`${COURT_RESOLUTIONS_COLLECTION}/${key}`);
  const existingSnap = await ref.get();
  const built = buildCourtResolution({
    name,
    zone: data?.zone,
    actorUid: uid,
    nowIso,
    existing: existingSnap.exists ? existingSnap.data() : null,
    lat: data?.lat,
    lng: data?.lng,
  });
  const batch = db.batch();
  batch.set(ref, built.court);
  batch.set(db.collection(COURT_RESOLUTION_AUDIT_COLLECTION).doc(), built.audit);
  await batch.commit();
  return { ok: true, court_key: built.court.court_key, zone: built.court.zone };
}

async function runtimeResolutionMap(db, preferredCourts) {
  const keys = [...new Set((Array.isArray(preferredCourts) ? preferredCourts : []).map(courtKey).filter(Boolean))];
  if (!keys.length) return {};
  const snaps = await Promise.all(keys.map((key) => db.doc(`${COURT_RESOLUTIONS_COLLECTION}/${key}`).get()));
  const map = {};
  snaps.forEach((snap) => {
    if (snap.exists) map[snap.id] = snap.data();
  });
  return map;
}

module.exports = {
  COURT_RESOLUTION_AUDIT_COLLECTION,
  COURT_RESOLUTIONS_COLLECTION,
  ZONE_NAMES,
  applyCourtResolution,
  buildCourtResolution,
  runtimeResolutionMap,
  zoneForCourt,
};
