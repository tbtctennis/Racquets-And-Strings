export type SkillGroup = 'Beginners' | 'Challengers' | 'Masters' | 'Retired Pro' | 'All';

export type MatchStatus = 'pending' | 'complete';

export type TournamentFormat = 'bracket' | 'rr';

// Divisions a doubles event can be joined in. Kept with tournament-owned types so event and
// tournament screens do not depend on one another for shared business data.
export const DOUBLES_DIVISIONS = ["Men's", "Women's", 'Mixed Doubles'] as const;
export const PLAYER_LOADING = 'Player Loading';
export const BYE = 'BYE';

// A zone bucket is one or more real zones grouped under one tournament draw label.
export type ZoneBucket = { id: string; label: string; zones: string[] };

export type ZoneDrawConfig = {
  enabled: boolean;
  buckets: ZoneBucket[];
  includeUnassigned: boolean;
  reallocatedAt?: string | undefined;
  /** sourceBucketId -> targetBucketId. A source in here produces no draws of its own. */
  merges?: Record<string, string> | undefined;
};

export const UNASSIGNED_ZONE_ID = 'unassigned';

// No contact fields here — ContactOpponentButton resolves channels from `contacts` at display time.
export type TournamentMatch = {
  id: string;
  category?: 'singles' | 'doubles' | 'rally' | 'challenge' | 'score_submission' | undefined;
  event_id: string;
  tournament_choice: 'Singles' | 'Doubles';
  division: string;
  skill_group: SkillGroup;
  // Zone bucket id this match belongs to (see ZoneDrawConfig) — absent for events that never
  // enabled zone draws, or for draws with no zone dimension (doubles).
  zone?: string | undefined;
  drawsize: number;
  match_id: string;
  round: string;
  position: number;
  player_1_slot: number | string;
  player_2_slot: number | string;
  player_1_name: string;
  player_1_uid: string;
  player_2_name: string;
  player_2_uid: string;
  winner_name?: string | undefined;
  winner_uid?: string | undefined;
  set_1_player_1?: number | undefined;
  set_1_player_2?: number | undefined;
  set_2_player_1?: number | undefined;
  set_2_player_2?: number | undefined;
  set_3_player_1?: number | undefined;
  set_3_player_2?: number | undefined;
  next_match_id?: string | undefined;
  next_slot?: 'player_1' | 'player_2' | '' | undefined;
  status: MatchStatus;
  bracket?: string | null | undefined;
  started: boolean;
  created_at?: string | undefined;
  completed_at?: string | undefined;
  score_edited_at?: string | undefined;
  score_disputed?: boolean | undefined;
  format?: TournamentFormat | undefined;
  rr_group?: number | undefined;
  rr_round?: number | undefined;
  rr_advancement_count?: number | undefined;
  rr_group_label?: string | undefined;
  rr_label_custom?: boolean | undefined;
  // Idempotency stamp written on every match of a group in the same batch that pays the group's
  // +5 completion bonus. Its presence is the only proof the bonus was actually paid (the bonus
  // is a separate, best-effort commit) — reversal must check it.
  rr_groupbonus?: boolean | undefined;
  walkover?: boolean | undefined;
  // League points actually paid when the result was applied. The group table reads these.
  points_winner?: number | undefined;
  points_loser?: number | undefined;
  court?: string | undefined;
  // Scheduling — players may edit only these fields (Firestore rules carve-out); scores stay
  // organizer-only. Absent schedule_status is treated as 'unscheduled'.
  schedule_status?: 'unscheduled' | 'scheduled' | undefined;
  proposed_date?: string | undefined; // YYYY-MM-DD
  proposed_slot?: 'AM' | 'PM' | undefined;
  schedule_requested?: boolean | undefined; // player asked the organizer to schedule
};
