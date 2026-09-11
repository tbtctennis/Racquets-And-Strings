/**
 * Manual Round Robin group-bonus awards. The `rr_groupbonus` stamp is the only payment
 * receipt; setGroupBonus is the only writer. One transaction stamps the group, pays or
 * reverses +5, and appends an actor/before/after audit row.
 */
const { HttpsError } = require('firebase-functions/v2/https');
const { FieldValue } = require('firebase-admin/firestore');
const { requireTrimmedString } = require('./callable');

const RR_GROUP_BONUS_AUDIT_COLLECTION = 'rr_group_bonus_audit';
const GROUP_BONUS_POINTS = 5;
const GHOST_UIDS = new Set(['BYE', 'PLAYER_LOADING']);

function isManager(event, uid, superAdminUid) {
  return (
    uid === superAdminUid ||
    event.creator_id === uid ||
    [event.organizer_ids, event.assigned_organizer_uids, event.organizer_uids].some(
      (value) => Array.isArray(value) && value.includes(uid),
    )
  );
}

function isBonusStamped(data) {
  return data?.rr_groupbonus === true || data?.rr_group_bonus_v2 === true;
}

function optionalDrawString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeZone(value) {
  return value == null ? null : String(value);
}

function matchesDraw(data, { tournamentChoice, division, skillGroup, zone }) {
  return (
    data.format === 'rr' &&
    data.round === 'RR' &&
    (!tournamentChoice || data.tournament_choice === tournamentChoice) &&
    (!division || data.division === division) &&
    (!skillGroup || data.skill_group === skillGroup) &&
    (zone === null ? !data.zone : (data.zone ?? null) === zone)
  );
}

function collectPlayers(matches) {
  const players = new Set();
  for (const doc of matches) {
    const data = doc.data();
    for (const uid of [data.player_1_uid, data.player_2_uid]) {
      if (uid && !GHOST_UIDS.has(uid)) players.add(uid);
    }
  }
  return [...players].sort();
}

function bonusState(matches) {
  const stamped = matches.map((doc) => isBonusStamped(doc.data()));
  const awarded = stamped.length > 0 && stamped.every(Boolean);
  const mixed = stamped.some(Boolean) && !awarded;
  return { awarded, mixed };
}

function requireBoolean(value, message) {
  if (typeof value !== 'boolean') throw new HttpsError('invalid-argument', message);
  return value;
}

function requireGroupNumber(value) {
  const rrGroup = Number(value);
  if (!Number.isInteger(rrGroup) || rrGroup < 0) {
    throw new HttpsError('invalid-argument', 'Invalid group.');
  }
  return rrGroup;
}

function buildGroupBonusAudit({
  eventId,
  rrGroup,
  actorUid,
  award,
  before,
  after,
  playerUids,
  matchIds,
  pointsDelta,
  draw,
  nowIso,
}) {
  return {
    event_id: eventId,
    rr_group: rrGroup,
    tournament_choice: draw.tournamentChoice,
    division: draw.division,
    skill_group: draw.skillGroup,
    zone: draw.zone,
    actor_uid: actorUid,
    action: award ? 'award' : 'reverse',
    before,
    after,
    player_uids: playerUids,
    match_ids: matchIds,
    points_delta: pointsDelta,
    created_at: nowIso,
  };
}

async function applyGroupBonus({ db, uid, superAdminUid, data, nowIso }) {
  const eventId = requireTrimmedString(data?.eventId, 'Missing event.', { maxLength: 500 });
  const rrGroup = requireGroupNumber(data?.rrGroup);
  const award = requireBoolean(data?.award, 'Award must be true or false.');
  const draw = {
    tournamentChoice: optionalDrawString(data?.tournamentChoice),
    division: optionalDrawString(data?.division),
    skillGroup: optionalDrawString(data?.skillGroup),
    zone: normalizeZone(data?.zone),
  };

  return db.runTransaction(async (tx) => {
    const eventRef = db.collection('events').doc(eventId);
    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists) throw new HttpsError('not-found', 'Event not found.');
    if (!isManager(eventSnap.data(), uid, superAdminUid)) {
      throw new HttpsError('permission-denied', 'Only the event manager may award a group bonus.');
    }

    const matchesSnap = await tx.get(
      db.collection('matches').where('event_id', '==', eventId).where('rr_group', '==', rrGroup),
    );
    const matches = matchesSnap.docs.filter((doc) => matchesDraw(doc.data(), draw));
    if (matches.length === 0) throw new HttpsError('not-found', 'Round Robin group not found.');

    const before = bonusState(matches);
    if (award === before.awarded && !before.mixed) {
      return { applied: false, awarded: before.awarded, duplicate: true, reconciled: false };
    }

    const playerUids = collectPlayers(matches);
    const matchIds = matches.map((doc) => doc.id).sort();
    // Mixed stamps are inconsistent receipts. Unify them to the requested state, but only
    // move league points on a clean none↔all transition so a partial stamp cannot double-pay
    // or reverse points nobody received.
    const pay = award && !before.awarded && !before.mixed;
    const reverse = !award && before.awarded;
    const pointsDelta = pay ? GROUP_BONUS_POINTS : reverse ? -GROUP_BONUS_POINTS : 0;

    for (const doc of matches) {
      tx.update(doc.ref, { rr_groupbonus: award, rr_group_bonus_v2: FieldValue.delete() });
    }
    if (pointsDelta !== 0) {
      for (const playerUid of playerUids) {
        tx.set(
          db.collection('stats').doc(playerUid),
          { leaguePoints26: FieldValue.increment(pointsDelta) },
          { merge: true },
        );
      }
    }

    const after = { awarded: award, mixed: false };
    tx.create(
      db.collection(RR_GROUP_BONUS_AUDIT_COLLECTION).doc(),
      buildGroupBonusAudit({
        eventId,
        rrGroup,
        actorUid: uid,
        award,
        before,
        after,
        playerUids,
        matchIds,
        pointsDelta,
        draw,
        nowIso,
      }),
    );

    return {
      applied: true,
      awarded: award,
      duplicate: false,
      reconciled: before.mixed || pointsDelta !== 0,
      players: playerUids.length,
      points_delta: pointsDelta,
    };
  });
}

module.exports = {
  GROUP_BONUS_POINTS,
  RR_GROUP_BONUS_AUDIT_COLLECTION,
  applyGroupBonus,
  bonusState,
  buildGroupBonusAudit,
  isBonusStamped,
  isManager,
};
