import type { SkillGroup } from '../../features/tournament/types';

export type { MatchStatus, SkillGroup, TournamentFormat, TournamentMatch } from '../../features/tournament/types';
export { BYE, DOUBLES_DIVISIONS, PLAYER_LOADING, UNASSIGNED_ZONE_ID } from '../../features/tournament/types';
export type { ZoneBucket, ZoneDrawConfig } from '../../features/tournament/types';

export type DrawTab = 'mens' | 'womens' | 'doubles';
// 'Retired Pro' is age-based (55+, chosen at join time via participant.skill_group), not derived
// from skill_level like Challengers/Masters.
// Adjacency order for skill-group merging: only neighboring bands may be merged together
// (Beginners+Challengers, or Challengers+Masters — never Beginners+Masters, never all three).
export const MATCHES_COL = 'matches';
export const SKILL_GROUP_ORDER: readonly SkillGroup[] = ['Beginners', 'Challengers', 'Masters'];
export type SkillMergePair = 'Beginners+Challengers' | 'Challengers+Masters' | 'Beginners+Challengers+Masters';

export type TemplateMatch = {
  match_id: string;
  round: string;
  player_1: number | string;
  player_2: number | string;
  next_match_id?: string | undefined;
  next_slot?: 'player_1' | 'player_2' | undefined;
};

// No contact fields here — ContactOpponentButton resolves channels from `contacts` at display time.
export type TournamentPlayer = {
  uid: string;
  name: string;
  participantId: string;
  skillLevel?: number | undefined;
  preferredCourts?: string[] | undefined;
  seed?: number | undefined;
};

export type { ScheduleRequest, UnplacedEntry } from '../../features/tournament/types';

/** An empty slot in the current draw that an unplaced player can be seated into. */
export type OpenDrawSlot = { matchId: string; slot: 'player_1' | 'player_2'; label: string };

export type ScoreForm = {
  matchDocId: string;
  winnerUserId: string;
  sets: Array<{ mine: string; opponent: string }>;
  court: string;
  /** Legacy field retained for old drafts; new submissions reject no-show results. */
  noShow?: boolean | undefined;
  /** Organizer-only zero-score walkover. */
  walkover?: boolean | undefined;
};

export type ScoreSubmission = {
  claimed_winner_name: string;
  claimed_winner_uid: string;
  set_1_player_1: number;
  set_1_player_2: number;
  set_2_player_1: number;
  set_2_player_2: number;
  set_3_player_1: number;
  set_3_player_2: number;
  court?: string | undefined;
};

export type RRConfig = {
  advancementCount: 1 | 2;
};

export type RRStandingRow = {
  name: string;
  userId: string;
  matchWins: number;
  matchLosses: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
  rank: number;
};

export type DrawConfig = {
  tab: DrawTab;
  label: string;
  tournamentChoice: 'Singles' | 'Doubles';
  division: string;
  skillGroup: SkillGroup;
  // Set only on a merged singles skill draw (skillGroup: 'All') — which adjacent pair it merges,
  // so participant-inclusion and BYE-ordering know which two bands to pull from.
  mergedFrom?: SkillMergePair | undefined;
  // Zone bucket id (see ZoneDrawConfig) — undefined means the event has no zone dimension, so
  // this draw's key/behavior is byte-identical to how it worked before zones existed.
  zone?: string | undefined;
};
