/**
 * Bounded organizer correction of a completed tournament result.
 * Validates current state, records actor/reason/before/after, and recomputes
 * stats/points in one transaction. Clients never write this trail.
 */
const nodeCrypto = require('node:crypto');
const { HttpsError } = require('firebase-functions/v2/https');
const { FieldValue } = require('firebase-admin/firestore');
const { requireAuth, requireTrimmedString } = require('./callable');
const {
  TournamentResultError,
  mergeStatDeltas,
  normalizeTournamentResult,
  scoreFieldPatch,
  statDeltasForResult,
  storedTournamentResult,
  paidAward,
} = require('./tournamentResult');

const COMPLETED_RESULT_AUDIT_COLLECTION = 'tournament_result_audit';
const REASON_MAX_LENGTH = 500;

function sameDraw(left, right) {
  return (
    (left.bracket ?? null) === (right.bracket ?? null) &&
    left.tournament_choice === right.tournament_choice &&
    left.division === right.division &&
    left.skill_group === right.skill_group &&
    (left.zone ?? null) === (right.zone ?? null)
  );
}

function isEventOrganizer(event, uid, superAdminUid) {
  return (
    uid === superAdminUid ||
    event.creator_id === uid ||
    (Array.isArray(event.organizer_ids) && event.organizer_ids.includes(uid))
  );
}

function resultHash(matchId, result) {
  return nodeCrypto
    .createHash('sha256')
    .update(JSON.stringify({ matchId, winnerUid: result.winnerUid, scores: result.scores, walkover: result.walkover }))
    .digest('hex');
}

function persistedScores(scores) {
  return Object.fromEntries(
    scores.map(([playerOne, playerTwo], index) => [`set_${index + 1}`, { player_1: playerOne, player_2: playerTwo }]),
  );
}

function persistedResult(result) {
  return result ? { ...result, scores: persistedScores(result.scores) } : null;
}

function submissionRecord(uid, result, now, hash) {
  return {
    winner_uid: result.winnerUid,
    sets: persistedScores(result.scores),
    margin: result.margin,
    submitted_at: now,
    hash,
    submitted_by: uid,
    applied: true,
  };
}

function hasAppliedSubmission(submissions) {
  return Object.values(submissions || {}).some((submission) => submission?.applied === true);
}

function activeParticipantMap(snapshot) {
  return new Map(
    snapshot.docs
      .map((doc) => doc.data())
      .filter(
        (participant) =>
          participant.removal !== true &&
          participant.active !== false &&
          !['withdrawn', 'removed', 'inactive'].includes(String(participant.status || '').toLowerCase()),
      )
      .filter((participant) => participant.uid)
      .map((participant) => [participant.uid, participant]),
  );
}

async function nextTarget(tx, db, match) {
  if (!match.next_match_id) return null;
  const nextQuery = db
    .collection('matches')
    .where('event_id', '==', match.event_id)
    .where('match_id', '==', match.next_match_id);
  const nextSnap = await tx.get(nextQuery);
  const candidate = nextSnap.docs.find((doc) => sameDraw(doc.data(), match));
  if (!candidate) throw new HttpsError('failed-precondition', 'Advancement target does not exist in this draw.');
  let slot = match.next_slot;
  if (slot !== 'player_1' && slot !== 'player_2') {
    const siblingsQuery = db
      .collection('matches')
      .where('event_id', '==', match.event_id)
      .where('next_match_id', '==', match.next_match_id);
    const siblingsSnap = await tx.get(siblingsQuery);
    const siblings = siblingsSnap.docs
      .filter((doc) => sameDraw(doc.data(), match))
      .sort((a, b) => (a.data().position ?? 0) - (b.data().position ?? 0));
    slot = siblings.findIndex((doc) => doc.id === match.id) <= 0 ? 'player_1' : 'player_2';
  }
  return { ref: candidate.ref, data: candidate.data(), slot };
}

function applyStatDeltas(tx, db, deltas) {
  for (const [uid, delta] of deltas) {
    const values = Object.fromEntries(
      Object.entries(delta).map(([key, value]) => [
        key,
        typeof value === 'number' ? FieldValue.increment(value) : value,
      ]),
    );
    tx.set(db.collection('stats').doc(uid), values, { merge: true });
  }
}

function combinedStatDeltas(match, oldResult, nextResult, partnerUidByCaptain) {
  const deltas = new Map();
  if (oldResult) mergeStatDeltas(deltas, statDeltasForResult(match, oldResult, partnerUidByCaptain), -1);
  mergeStatDeltas(deltas, statDeltasForResult(match, nextResult, partnerUidByCaptain), 1);
  return deltas;
}

function mapError(error) {
  if (error instanceof HttpsError) return error;
  if (error instanceof TournamentResultError) return new HttpsError(error.code, error.message);
  return error;
}

function buildCorrectionAudit({ eventId, matchId, actorUid, reason, before, after, nowIso }) {
  return {
    event_id: eventId,
    match_id: matchId,
    actor_uid: actorUid,
    action: 'correct',
    reason,
    before: persistedResult(before),
    after: persistedResult(after),
    recorded_at: nowIso,
  };
}

async function applyCompletedResultCorrection({ db, uid, superAdminUid, data, nowIso }) {
  const matchId = requireTrimmedString(data?.matchId, 'Missing match.', { maxLength: 500 });
  const reason = requireTrimmedString(data?.reason, 'A correction reason is required.', {
    maxLength: REASON_MAX_LENGTH,
  });

  return db.runTransaction(async (tx) => {
    const matchRef = db.collection('matches').doc(matchId);
    const matchSnap = await tx.get(matchRef);
    if (!matchSnap.exists) throw new HttpsError('not-found', 'Match not found.');
    const match = { ...matchSnap.data(), id: matchSnap.id };
    if (
      !match.event_id ||
      !['singles', 'doubles'].includes(match.category) ||
      !['Singles', 'Doubles'].includes(match.tournament_choice)
    ) {
      throw new HttpsError('invalid-argument', 'Target must be an official tournament match.');
    }
    if (match.status !== 'complete' || !match.winner_uid) {
      throw new HttpsError('failed-precondition', 'Only a completed result can be corrected.');
    }

    const eventSnap = await tx.get(db.collection('events').doc(match.event_id));
    if (!eventSnap.exists) throw new HttpsError('not-found', 'Event not found.');
    const event = eventSnap.data();
    if (!isEventOrganizer(event, uid, superAdminUid)) {
      throw new HttpsError('permission-denied', 'Only the event organizer may correct a completed result.');
    }
    if (!match.player_1_uid || !match.player_2_uid || match.player_1_uid === match.player_2_uid) {
      throw new HttpsError('failed-precondition', 'Match participants are invalid.');
    }

    const participantSnap = await tx.get(db.collection('event_participants').where('event_id', '==', match.event_id));
    const participantsByUid = activeParticipantMap(participantSnap);
    if (!participantsByUid.has(match.player_1_uid) || !participantsByUid.has(match.player_2_uid)) {
      throw new HttpsError('failed-precondition', 'Both match players must be active event participants.');
    }

    const result = normalizeTournamentResult(data, match);
    const oldResult = storedTournamentResult(match);
    const hash = resultHash(matchId, result);
    if (hash === resultHash(matchId, oldResult)) {
      return {
        applied: false,
        duplicate: true,
        advanced: !!match.next_match_id,
        needsManual: false,
        reconciled: false,
      };
    }

    const target = await nextTarget(tx, db, match);
    const nextHasResult =
      target && (target.data.status === 'complete' || hasAppliedSubmission(target.data.result_submissions));
    if (result.winnerUid !== oldResult.winnerUid && nextHasResult) {
      throw new HttpsError('failed-precondition', 'Cannot change the winner after the next match has a result.');
    }

    const partnerUidByCaptain = new Map();
    if (match.tournament_choice === 'Doubles') {
      for (const captainUid of [match.player_1_uid, match.player_2_uid]) {
        const participant = participantsByUid.get(captainUid);
        if (participant?.partner_uid && participantsByUid.has(participant.partner_uid)) {
          partnerUidByCaptain.set(captainUid, participant.partner_uid);
        }
      }
    }

    applyStatDeltas(tx, db, combinedStatDeltas(match, oldResult, result, partnerUidByCaptain));
    const paid = paidAward(match, result);
    const submissions = {
      ...(match.result_submissions || {}),
      [uid]: submissionRecord(uid, result, nowIso, hash),
    };
    tx.update(matchRef, {
      winner_uid: result.winnerUid,
      winner_name: result.winnerUid === match.player_1_uid ? match.player_1_name : match.player_2_name,
      ...scoreFieldPatch(result.scores),
      status: 'complete',
      result_at: nowIso,
      completed_at: match.completed_at || nowIso,
      walkover: result.walkover,
      score_disputed: false,
      score_disputed_at: FieldValue.delete(),
      result_submissions: submissions,
      score_pending: FieldValue.delete(),
      points_winner: paid.points_winner,
      points_loser: paid.points_loser,
      ...(result.court ? { court: result.court } : {}),
    });
    tx.create(
      db.collection(COMPLETED_RESULT_AUDIT_COLLECTION).doc(),
      buildCorrectionAudit({
        eventId: match.event_id,
        matchId,
        actorUid: uid,
        reason,
        before: oldResult,
        after: result,
        nowIso,
      }),
    );
    if (target && result.winnerUid !== oldResult.winnerUid) {
      tx.update(target.ref, {
        [`${target.slot}_uid`]: result.winnerUid,
        [`${target.slot}_name`]: result.winnerUid === match.player_1_uid ? match.player_1_name : match.player_2_name,
        [`${target.slot}_previous_uid`]: oldResult.winnerUid,
      });
    }
    return { applied: true, duplicate: false, advanced: !!target, needsManual: false, reconciled: true };
  });
}

async function handleCorrectCompletedResult(request, { db, superAdminUid, nowIso }) {
  const uid = requireAuth(request);
  try {
    return await applyCompletedResultCorrection({
      db,
      uid,
      superAdminUid,
      data: request.data || {},
      nowIso,
    });
  } catch (error) {
    throw mapError(error);
  }
}

module.exports = {
  COMPLETED_RESULT_AUDIT_COLLECTION,
  REASON_MAX_LENGTH,
  applyCompletedResultCorrection,
  buildCorrectionAudit,
  handleCorrectCompletedResult,
};
