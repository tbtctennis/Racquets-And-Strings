export type LeagueRow = {
  user_id: string;
  name: string;
  skill_level: number;
  tournamentsPlayed: number;
  matchesPlayed: number;
  wins: number;
  leaguePoints26: number;
  league: string;
  /** Competition community derived from the member's preferred courts. */
  location?: string;
  pointswon?: number;
  totalPointsPlayed?: number;
  /** Weekly snapshot rank from `functions/rankSnapshot.js`. */
  rankPosition?: number;
  rankTrend: 'up' | 'down' | 'flat';
  rankMove: number;
};
