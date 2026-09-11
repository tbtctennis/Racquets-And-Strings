/** Pure challenge lifecycle notices. Rally already emits declined / confirmed / denied
 *  through the in-app channel; challenges used notify() (retries duplicate) and skipped
 *  denied because a dispute does not change status.
 */

const CHALLENGE_LINK = '/matches?mode=challenges';
const SETTLED = new Set(['complete', 'confirmed']);

function playerUids(match) {
  return [...new Set([match.player_1_uid, match.player_2_uid].filter(Boolean))];
}

function challengeLifecycleNotices(before = {}, after = {}, matchId = '') {
  if (after.category !== 'challenge') return [];

  if (before.status === 'open' && after.status === 'declined' && after.player_1_uid) {
    if (after.source) {
      return [
        {
          key: `challenge-conversion-rejected:${matchId}`,
          uid: after.player_1_uid,
          payload: {
            type: 'challenge_conversion_rejected',
            title: `${after.player_2_name || 'That player'} declined the challenge conversion`,
            link: CHALLENGE_LINK,
          },
        },
      ];
    }
    return [
      {
        key: `challenge-declined:${matchId}`,
        uid: after.player_1_uid,
        payload: {
          type: 'ladder_declined',
          title: `${after.player_2_name || 'That player'} declined your challenge`,
          link: CHALLENGE_LINK,
        },
      },
    ];
  }

  if (!SETTLED.has(before.status) && SETTLED.has(after.status)) {
    const winner = after.winner_uid || after.claimed_winner_uid;
    return playerUids(after).map((uid) => ({
      key: `challenge-confirmed:${matchId}`,
      uid,
      payload: {
        type: 'ladder_reported',
        title: 'Challenge result recorded',
        body: uid === winner ? 'You picked up 3 points.' : 'You picked up 1 point.',
        link: CHALLENGE_LINK,
      },
    }));
  }

  if (before.score_disputed !== true && after.score_disputed === true) {
    return playerUids(after).map((uid) => ({
      key: `challenge-denied:${matchId}`,
      uid,
      payload: {
        type: 'ladder_denied',
        title: 'Challenge result denied',
        body: 'Players submitted different winners. The first applied result remains in place.',
        link: CHALLENGE_LINK,
      },
    }));
  }

  return [];
}

module.exports = { challengeLifecycleNotices, CHALLENGE_LINK };
