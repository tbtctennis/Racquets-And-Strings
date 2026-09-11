/**
 * Per-event organizer assignment. `events.organizer_ids` is callable-owned so every change
 * can carry an append-only actor / target / before / after / time row.
 */
const { HttpsError } = require('firebase-functions/v2/https');
const { requireTrimmedString } = require('./callable');

const ORGANIZER_ASSIGNMENT_AUDIT_COLLECTION = 'organizer_assignment_audit';
const MAX_ORGANIZER_IDS = 50;

function normalizeOrganizerIds(value) {
  if (!Array.isArray(value)) {
    throw new HttpsError('invalid-argument', 'Organizer ids are required.');
  }
  if (value.length > MAX_ORGANIZER_IDS) {
    throw new HttpsError('invalid-argument', 'Organizer ids are required.');
  }
  const seen = new Set();
  const ids = [];
  for (const item of value) {
    const uid = requireTrimmedString(item, 'Organizer ids are required.', { maxLength: 128 });
    if (seen.has(uid)) continue;
    seen.add(uid);
    ids.push(uid);
  }
  return ids;
}

function sameIds(before, after) {
  if (before.length !== after.length) return false;
  const set = new Set(before);
  return after.every((id) => set.has(id));
}

function changedUids(before, after) {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  return [...after.filter((id) => !beforeSet.has(id)), ...before.filter((id) => !afterSet.has(id))];
}

function snapshotIds(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((id) => typeof id === 'string' && id.trim()).map((id) => id.trim());
}

function buildOrganizerAssignmentAudit({ eventId, actorUid, before, after, nowIso }) {
  return {
    event_id: eventId,
    actor_uid: actorUid,
    target_uids: changedUids(before, after),
    before,
    after,
    created_at: nowIso,
  };
}

function canAssignOrganizers(event, uid, superAdminUid) {
  return uid === superAdminUid || event?.creator_id === uid;
}

async function applyOrganizerAssignment({ db, uid, superAdminUid, data, nowIso }) {
  const eventId = requireTrimmedString(data?.eventId, 'Event is required.', { maxLength: 128 });
  const organizerIds = normalizeOrganizerIds(data?.organizerIds);
  const eventRef = db.doc(`events/${eventId}`);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) throw new HttpsError('not-found', 'Event not found.');
  const event = eventSnap.data();
  if (!canAssignOrganizers(event, uid, superAdminUid)) {
    throw new HttpsError('permission-denied', 'Only the event owner can assign organizers.');
  }

  const before = snapshotIds(event.organizer_ids);
  if (sameIds(before, organizerIds)) {
    return { ok: true, event_id: eventId, organizer_ids: before, changed: false };
  }

  const audit = buildOrganizerAssignmentAudit({
    eventId,
    actorUid: uid,
    before,
    after: organizerIds,
    nowIso,
  });
  const batch = db.batch();
  batch.update(eventRef, { organizer_ids: organizerIds });
  batch.set(db.collection(ORGANIZER_ASSIGNMENT_AUDIT_COLLECTION).doc(), audit);
  await batch.commit();
  return { ok: true, event_id: eventId, organizer_ids: organizerIds, changed: true };
}

module.exports = {
  ORGANIZER_ASSIGNMENT_AUDIT_COLLECTION,
  applyOrganizerAssignment,
  buildOrganizerAssignmentAudit,
  normalizeOrganizerIds,
};
