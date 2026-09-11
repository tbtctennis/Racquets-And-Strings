import { formatPersonName } from '../../utils/nameFormatting';

/** Ruled doubles-pool card stats. Do not add a sixth. */
export const DOUBLES_POOL_STAT_LABELS = ['Wins', 'P/G Won %', 'Partners', 'Availability', 'Nearby'] as const;

export type DoublesPoolMatchRef = {
  eventId: string;
  player1Uid: string;
  player2Uid: string;
  winnerUid?: string | undefined;
  status: string;
  category?: string | undefined;
  tournamentChoice?: string | undefined;
};

export type DoublesPoolParticipantRef = {
  uid: string;
  eventId: string;
  userName?: string | undefined;
  partnerUid?: string | undefined;
  partnerName?: string | undefined;
  tournamentChoice?: string | undefined;
};

export const isDoublesMatch = (match: Pick<DoublesPoolMatchRef, 'category' | 'tournamentChoice'>): boolean =>
  match.category === 'doubles' || match.tournamentChoice === 'Doubles';

export const numberPartners = (names: string[]): string => {
  if (names.length === 0) return '—';
  return names.map((name, index) => `${index + 1}. ${formatPersonName(name)}`).join(' · ');
};

export const partnersFor = (uid: string, participants: DoublesPoolParticipantRef[]): string[] => {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const participant of participants) {
    if (participant.tournamentChoice && participant.tournamentChoice !== 'Doubles') continue;
    let raw: string | undefined;
    if (participant.uid === uid) raw = participant.partnerName;
    else if (participant.partnerUid === uid) raw = participant.userName;
    const name = (raw ?? '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(formatPersonName(name));
  }
  return names;
};

export const doublesWinsFor = (
  uid: string,
  matches: DoublesPoolMatchRef[],
  participants: DoublesPoolParticipantRef[],
): number => {
  const captainsByEvent = new Map<string, Set<string>>();
  for (const participant of participants) {
    if (participant.partnerUid !== uid) continue;
    if (participant.tournamentChoice && participant.tournamentChoice !== 'Doubles') continue;
    const captains = captainsByEvent.get(participant.eventId) ?? new Set<string>();
    captains.add(participant.uid);
    captainsByEvent.set(participant.eventId, captains);
  }

  let wins = 0;
  for (const match of matches) {
    if (!isDoublesMatch(match) || match.status !== 'complete' || !match.winnerUid) continue;
    const onCourt = match.player1Uid === uid || match.player2Uid === uid;
    if (onCourt && match.winnerUid === uid) {
      wins += 1;
      continue;
    }
    const captains = captainsByEvent.get(match.eventId);
    const winnerOnCourt = match.player1Uid === match.winnerUid || match.player2Uid === match.winnerUid;
    if (captains?.has(match.winnerUid) && winnerOnCourt) {
      wins += 1;
    }
  }
  return wins;
};
