/**
 * Weekly snapshot rank written by `functions/rankSnapshot.js`.
 *
 * The three display readers (Leagues, Profile, useStandings) and D8 seeding both consume this.
 * Entry order (D8-S1-T2) stays on live `leaguePoints26` so a join is not seeded on a rank up to
 * six days stale; RR knockout ordering (D8-S2-T2) reads this as the leaderboard-rank tiebreak.
 */
export const snapshotRank = (stats?: { rankPosition?: number } | null): number | undefined =>
  typeof stats?.rankPosition === 'number' && Number.isFinite(stats.rankPosition) ? stats.rankPosition : undefined;
