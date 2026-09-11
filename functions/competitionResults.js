const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');
const { REGION, SUPER_ADMIN_UID } = require('./lib/constants');
const { requireAuth, requireTrimmedString } = require('./lib/callable');
const { notify } = require('./lib/notify');
const { assertPlayableLocationPair } = require('./lib/playLocation');
const {
  COMPETITION_CATEGORIES,
  competitionPoints,
  normalizeCompetitionResult,
  scoreFieldPatch,
  storedCompetitionResult,
} = require('./lib/competitionResult');

const db = () => admin.firestore();

function isManager(event, uid) {
  return (
    uid === SUPER_ADMIN_UID ||
    event.creator_id === uid ||
    [event.organizer_ids, event.assigned_organizer_uids, event.organizer_uids].some(
      (value) => Array.isArray(value) && value.includes(uid),
    )
  );
}

exports.challengeResults = onCall({ region: REGION }, async (request) => {
  const callerUid = requireAuth(request);
  const matchId = requireTrimmedString(request.data?.matchId, 'Missing challenge.', { maxLength: 500 });
  const outcome = await db().runTransaction(async (tx) => {
    const challengeRef = db().collection('matches').doc(matchId);
    const challengeSnap = await tx.get(challengeRef);
    if (!challengeSnap.exists || !COMPETITION_CATEGORIES.has(challengeSnap.data().category)) {
      throw new HttpsError('not-found', 'Challenge or rally not found.');
    }
    const match = challengeSnap.data();
    try {
      await assertPlayableLocationPair(db(), match.player_1_uid, match.player_2_uid);
    } catch (error) {
      if (error?.code === 'cross-location') {
        throw new HttpsError('failed-precondition', error.message);
      }
      throw error;
    }
    const eventSnap = match.event_id ? await tx.get(db().collection('events').doc(match.event_id)) : null;
    const manager = eventSnap?.exists && isManager(eventSnap.data(), callerUid);
    const participant = [match.player_1_uid, match.player_2_uid].includes(callerUid);
    if (!participant && !manager) {
      throw new HttpsError('permission-denied', 'Only match participants may submit this result.');
    }
    if (match.applied === true && request.data?.winnerUid === undefined) {
      return { response: { applied: false, duplicate: true }, notice: null };
    }
    if (!['accepted', 'complete'].includes(match.status)) {
      throw new HttpsError('failed-precondition', 'Only an accepted challenge or rally can receive a result.');
    }
    const input =
      request.data?.winnerUid === undefined
        ? {
            winnerUid: match.winner_uid,
            scores: [
              [match.set_1_player_1 ?? 0, match.set_1_player_2 ?? 0],
              [match.set_2_player_1 ?? 0, match.set_2_player_2 ?? 0],
              [match.set_3_player_1 ?? 0, match.set_3_player_2 ?? 0],
            ],
            court: match.court,
          }
        : request.data;
    const result = normalizeCompetitionResult(input, match);
    const oldResult = match.status === 'complete' ? storedCompetitionResult(match) : null;
    const existingSubmission = match.result_submissions?.[callerUid];
    const signature = JSON.stringify({ winnerUid: result.winnerUid, scores: result.scores });
    if (existingSubmission?.signature === signature && existingSubmission.applied === true) {
      return { response: { applied: false, duplicate: true }, notice: null };
    }
    const now = new Date().toISOString();
    const submissions = {
      ...(match.result_submissions || {}),
      [callerUid]: {
        signature,
        winner_uid: result.winnerUid,
        margin: result.margin,
        submitted_at: now,
        applied: false,
      },
    };
    if (oldResult && result.winnerUid !== oldResult.winnerUid && !manager) {
      const alreadyDisputed = match.score_disputed === true;
      tx.update(challengeRef, {
        result_submissions: submissions,
        score_disputed: true,
        score_disputed_at: match.score_disputed_at || now,
      });
      return {
        response: { applied: false, duplicate: false, disputed: true },
        notice: alreadyDisputed
          ? null
          : {
              recipients:
                match.event_id && eventSnap?.exists
                  ? [eventSnap.data().creator_id, ...(eventSnap.data().organizer_ids || [])]
                  : [match.player_1_uid, match.player_2_uid],
              payload: {
                type: 'organizer_score_disputed',
                title: 'Result disputed',
                body: 'Players submitted different winners. The first applied result remains in place.',
                link: match.event_id ? `/tournament?event=${match.event_id}` : '/matches?mode=rallies',
              },
            },
      };
    }
    if (oldResult && result.winnerUid === oldResult.winnerUid && result.margin >= oldResult.margin && !manager) {
      tx.update(challengeRef, { result_submissions: submissions });
      return { response: { applied: false, duplicate: false }, notice: null };
    }
    const winnerUid = result.winnerUid;
    const loserUid = winnerUid === match.player_1_uid ? match.player_2_uid : match.player_1_uid;
    if (!loserUid || loserUid === winnerUid) throw new HttpsError('failed-precondition', 'Match players are invalid.');
    const points = competitionPoints(match.category, winnerUid, loserUid);
    const statRefs = [winnerUid, loserUid].map((uid) => db().collection('stats').doc(uid));
    const statSnaps = await Promise.all(statRefs.map((ref) => tx.get(ref)));
    const oldWinner = oldResult?.winnerUid;
    const oldLoser = oldWinner && (oldWinner === match.player_1_uid ? match.player_2_uid : match.player_1_uid);
    if (oldResult && oldWinner && oldLoser) {
      const oldLoserPoints =
        Number(statSnaps[statRefs.findIndex((ref) => ref.id === oldLoser)].data()?.leaguePoints26) || 0;
      tx.set(
        db().collection('stats').doc(oldWinner),
        {
          leaguePoints26: FieldValue.increment(match.category === 'challenge' ? -3 : -2),
          matchesPlayed: FieldValue.increment(-1),
          wins: FieldValue.increment(-1),
        },
        { merge: true },
      );
      tx.set(
        db().collection('stats').doc(oldLoser),
        {
          leaguePoints26:
            match.category === 'challenge' ? Math.max(0, oldLoserPoints - 1 + 3) : FieldValue.increment(-1),
          matchesPlayed: FieldValue.increment(-1),
        },
        { merge: true },
      );
    }
    tx.set(
      db().collection('stats').doc(winnerUid),
      {
        leaguePoints26: FieldValue.increment(points[winnerUid]),
        matchesPlayed: FieldValue.increment(1),
        wins: FieldValue.increment(1),
      },
      { merge: true },
    );
    tx.set(
      db().collection('stats').doc(loserUid),
      {
        leaguePoints26:
          match.category === 'challenge'
            ? Math.max(
                0,
                (Number(statSnaps[statRefs.findIndex((ref) => ref.id === loserUid)].data()?.leaguePoints26) || 0) +
                  points[loserUid],
              )
            : FieldValue.increment(points[loserUid]),
        matchesPlayed: FieldValue.increment(1),
      },
      { merge: true },
    );
    submissions[callerUid].applied = true;
    tx.update(challengeRef, {
      status: 'complete',
      applied: true,
      completed_at: match.completed_at || now,
      result_at: now,
      ...scoreFieldPatch(result.scores),
      winner_uid: winnerUid,
      winner_name: winnerUid === match.player_1_uid ? match.player_1_name : match.player_2_name,
      ...(result.court ? { court: result.court } : {}),
      score_disputed: false,
      result_submissions: submissions,
    });
    return { response: { applied: true, duplicate: false, reconciled: !!oldResult }, notice: null };
  });
  if (outcome.notice) await notify(outcome.notice.recipients, outcome.notice.payload);
  return outcome.response;
});

exports.setGroupBonus = onCall({ region: REGION }, async (request) => {
  const callerUid = requireAuth(request);
  const eventId = requireTrimmedString(request.data?.eventId, 'Missing event.', { maxLength: 500 });
  const rrGroup = Number(request.data?.rrGroup);
  if (!Number.isInteger(rrGroup) || rrGroup < 0) throw new HttpsError('invalid-argument', 'Invalid group.');
  const award = request.data?.award === true;
  const tournamentChoice = typeof request.data?.tournamentChoice === 'string' ? request.data.tournamentChoice : null;
  const division = typeof request.data?.division === 'string' ? request.data.division : null;
  const skillGroup = typeof request.data?.skillGroup === 'string' ? request.data.skillGroup : null;
  const zone = request.data?.zone == null ? null : String(request.data.zone);
  return db().runTransaction(async (tx) => {
    const eventSnap = await tx.get(db().collection('events').doc(eventId));
    if (!eventSnap.exists || !isManager(eventSnap.data(), callerUid)) {
      throw new HttpsError('permission-denied', 'Only the event manager may award a group bonus.');
    }
    const matchesSnap = await tx.get(
      db().collection('matches').where('event_id', '==', eventId).where('rr_group', '==', rrGroup),
    );
    const matches = matchesSnap.docs.filter((doc) => {
      const data = doc.data();
      return (
        data.format === 'rr' &&
        data.round === 'RR' &&
        (!tournamentChoice || data.tournament_choice === tournamentChoice) &&
        (!division || data.division === division) &&
        (!skillGroup || data.skill_group === skillGroup) &&
        (zone === null ? !data.zone : (data.zone ?? null) === zone)
      );
    });
    if (matches.length === 0) throw new HttpsError('not-found', 'Round Robin group not found.');
    const alreadyAwarded = matches.some(
      (doc) => doc.data().rr_groupbonus === true || doc.data().rr_group_bonus_v2 === true,
    );
    if (award === alreadyAwarded) return { applied: false, awarded: alreadyAwarded };

    const players = new Set();
    matches.forEach((doc) => {
      const data = doc.data();
      for (const uid of [data.player_1_uid, data.player_2_uid]) {
        if (uid && !['BYE', 'PLAYER_LOADING'].includes(uid)) players.add(uid);
      }
      tx.update(doc.ref, { rr_groupbonus: award, rr_group_bonus_v2: FieldValue.delete() });
    });
    for (const uid of players) {
      tx.set(
        db().collection('stats').doc(uid),
        { leaguePoints26: FieldValue.increment(award ? 5 : -5) },
        { merge: true },
      );
    }
    return { applied: true, awarded: award, players: players.size };
  });
});
