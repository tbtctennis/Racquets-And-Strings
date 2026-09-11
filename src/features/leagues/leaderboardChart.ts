export const LAST_FIVE_MATCHES = 5;

export type RankSnapshot = { at: number; rank: number };

export type MatchForChart = { completedAt: number; myGames: number; oppGames: number };

export type ProgressPoint = {
  pgWonPct: number;
  rank: number;
};

export const pgWonLabel = (pct: number) => `${Math.round(pct)}% P/G won`;

export const rankLabel = (rank: number) => `rank #${rank}`;

// Career P/G after each match, then the last five of those points. Rank at the newest point is
// the live board; earlier points take the latest snapshot at or before that match.
export function lastFiveProgressPoints(
  matches: MatchForChart[],
  currentRank: number,
  history: RankSnapshot[] = [],
): ProgressPoint[] {
  const chronological = [...matches].sort((a, b) => a.completedAt - b.completedAt);
  let won = 0;
  let played = 0;
  const running: { completedAt: number; pgWonPct: number }[] = [];
  for (const match of chronological) {
    won += match.myGames;
    played += match.myGames + match.oppGames;
    running.push({
      completedAt: match.completedAt,
      pgWonPct: played > 0 ? (won / played) * 100 : 0,
    });
  }

  const window = running.slice(-LAST_FIVE_MATCHES);
  const snaps = [...history].filter((snap) => snap.rank > 0).sort((a, b) => a.at - b.at);

  return window.map((point, index) => {
    const isLatest = index === window.length - 1;
    if (isLatest && currentRank > 0) return { pgWonPct: point.pgWonPct, rank: currentRank };

    let rank = currentRank > 0 ? currentRank : 0;
    for (const snap of snaps) {
      if (snap.at <= point.completedAt) rank = snap.rank;
    }
    return { pgWonPct: point.pgWonPct, rank: rank > 0 ? rank : Math.max(currentRank, 0) };
  });
}

export function rankSnapshotsFromEntries(entries: { date?: unknown; position?: unknown }[]): RankSnapshot[] {
  return entries
    .map((entry) => ({
      at: Date.parse(String(entry.date ?? '')) || 0,
      rank: typeof entry.position === 'number' ? entry.position : 0,
    }))
    .filter((snap) => snap.at > 0 && snap.rank > 0);
}
