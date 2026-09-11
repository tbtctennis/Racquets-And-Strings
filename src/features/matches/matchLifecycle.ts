/** Shared rally/challenge reject and cancel rules. Keep in lockstep with functions/lib/matchCancel.js. */

export type LifecycleMatch = {
  id?: string;
  status: string;
  player_1_uid: string;
  player_2_uid: string;
};

/** Senders this viewer declined. Stored `declined` keeps them off the tab after refresh. */
export function declinedSenderUids(items: readonly LifecycleMatch[], viewerUid: string | undefined): Set<string> {
  const ids = new Set<string>();
  if (!viewerUid) return ids;
  for (const item of items) {
    if (item.status === 'declined' && item.player_2_uid === viewerUid && item.player_1_uid) {
      ids.add(item.player_1_uid);
    }
  }
  return ids;
}

export function isCancellableMatch(match: LifecycleMatch, actorUid: string): boolean {
  if (match.status === 'open') return match.player_1_uid === actorUid;
  if (match.status === 'accepted') {
    return match.player_1_uid === actorUid || match.player_2_uid === actorUid;
  }
  return false;
}

export function findCancellableMatch<T extends LifecycleMatch>(
  items: readonly T[],
  actorUid: string,
  opponentUid: string,
): T | undefined {
  return items.find((item) => {
    const pair =
      (item.player_1_uid === actorUid && item.player_2_uid === opponentUid) ||
      (item.player_2_uid === actorUid && item.player_1_uid === opponentUid);
    return pair && isCancellableMatch(item, actorUid);
  });
}
