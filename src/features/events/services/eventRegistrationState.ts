import type { EventParticipant } from '../../../types';
import type { JoinedRegistration } from '../types';

/** Live roster size per event. Withdrawn rows do not count. */
export const countActiveParticipants = (participants: EventParticipant[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const participant of participants) {
    if (participant.status === 'withdrawn') continue;
    counts[participant.event_id] = (counts[participant.event_id] ?? 0) + 1;
  }
  return counts;
};

/** The current member's registrations, including empty tournamentChoice for regular events. */
export const toJoinedRegistrations = (participants: EventParticipant[]): JoinedRegistration[] =>
  participants.map((participant) => ({
    eventId: participant.event_id,
    tournamentChoice: participant.tournament_choice ?? '',
  }));
