/**
 * The one place that decides whether you may challenge someone. The Challenges tab is the
 * surviving send entry (TASK-637 / WDR §2); these rules feed the block reasons shown there.
 *
 * Note on "hasn't set their skill": there is no such state to detect. Every account is
 * bootstrapped with `skill_level: 2`, so a player who never touched it is indistinguishable
 * from one who deliberately picked 2.0. The readiness gate is therefore league + preferred
 * courts, the same pair `isReadyForMatches` has always used on the Matches page.
 */
export const isReadyForMatches = (
  profile: { stats: { league: string }; preferences: { preferred_courts: string[] } } | null | undefined,
) => !!profile && profile.stats.league !== '' && profile.preferences.preferred_courts.length > 0;

export type ChallengeBlockReason =
  | null // go ahead
  | 'self' // that's you
  | 'not-ready' // no league and/or no preferred courts set
  | 'no-ladder' // no active ladder event right now
  | 'other-division' // they play in a different league
  | 'unsupported' // doubles / Retired Pro — the ladder has no such division
  | 'pending' // a challenge between you two is already open
  | 'cooldown' // played them too recently
  | 'active-limit' // already have 3 sent challenges open/accepted
  | 'conflict'; // already drawn against them in another live event

export const CHALLENGE_BLOCK_LABEL: Record<Exclude<ChallengeBlockReason, null>, string> = {
  self: 'This is you',
  'not-ready': 'Set your league and preferred courts to challenge',
  'no-ladder': 'No active ladder right now',
  'other-division': 'Different league',
  unsupported: 'Challenges run in singles only',
  pending: 'Challenge already open',
  cooldown: 'Played recently',
  'active-limit': 'You can only have 3 open or accepted challenges at once. Finish or wait on one to send another.',
  conflict: 'Already drawn against them',
};

export type ChallengeBlockContext = {
  userId?: string | null;
  ready: boolean;
  myDivision: 'mens' | 'womens' | 'doubles' | null;
  hasLadder: boolean;
  hasConflict: boolean;
  state: 'available' | 'pending' | 'cooldown';
  activeChallengesLeft: number;
  otherDivision?: boolean;
  supported?: boolean;
};

/** Why this player can't be challenged, or null if they can. */
export function challengeBlockReason(opponent: { user_id: string }, ctx: ChallengeBlockContext): ChallengeBlockReason {
  if (!ctx.userId || opponent.user_id === ctx.userId) return 'self';
  if (ctx.supported === false) return 'unsupported';
  if (!ctx.ready || !ctx.myDivision) return 'not-ready';
  if (!ctx.hasLadder) return 'no-ladder';
  if (ctx.otherDivision) return 'other-division';
  if (ctx.hasConflict) return 'conflict';
  if (ctx.state === 'pending') return 'pending';
  if (ctx.state === 'cooldown') return 'cooldown';
  if (ctx.activeChallengesLeft === 0) return 'active-limit';
  return null;
}
