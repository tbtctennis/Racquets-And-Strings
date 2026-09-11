/**
 * Accepted rally/challenge cancel. Open retracts stay a client delete so
 * `ladder_cancelled` still means the challenger withdrew an unanswered challenge.
 */

function otherPlayer(match, actorUid) {
  if (!match || !actorUid) return null;
  if (actorUid === match.player_1_uid) {
    return { uid: match.player_2_uid, actorName: match.player_1_name };
  }
  if (actorUid === match.player_2_uid) {
    return { uid: match.player_1_uid, actorName: match.player_2_name };
  }
  return null;
}

function canCancelAccepted(match, actorUid) {
  return (
    !!match &&
    (match.category === 'challenge' || match.category === 'rally') &&
    match.status === 'accepted' &&
    (actorUid === match.player_1_uid || actorUid === match.player_2_uid)
  );
}

function acceptedCancellationNotice(match, actorUid) {
  if (!canCancelAccepted(match, actorUid)) return null;
  const other = otherPlayer(match, actorUid);
  if (!other?.uid) return null;
  const actorName = other.actorName || 'A player';
  if (match.category === 'challenge') {
    return {
      uid: other.uid,
      type: 'ladder_cancelled',
      title: `${actorName} cancelled their challenge`,
      link: '/matches?mode=challenges',
    };
  }
  return {
    uid: other.uid,
    type: 'rally_cancelled',
    title: `${actorName} withdrew their rally request`,
    link: '/matches?mode=rallies',
  };
}

module.exports = {
  acceptedCancellationNotice,
  canCancelAccepted,
};
