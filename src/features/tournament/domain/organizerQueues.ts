import type { EventParticipant } from '../../../types';
import type { ScheduleRequest, TournamentMatch, UnplacedEntry, ZoneDrawConfig } from '../types';
import { effectiveZone, skillBand, zoneBucketFor } from './placement';

export type UnplacedPreference = {
  courts: string[];
  zone: string;
  manual: boolean;
};

type Draw = {
  tc: string;
  division: string;
  band: string;
  zone: string;
  done: boolean;
  seats: Set<string>;
};

/** Incomplete schedule-requested matches that belong to the organizer's events. */
export const selectScheduleRequests = (
  matches: TournamentMatch[],
  eventTitleById: ReadonlyMap<string, string>,
): ScheduleRequest[] =>
  matches
    .filter((match) => match.status !== 'complete' && eventTitleById.has(match.event_id))
    .map((match) => ({ ...match, event_title: eventTitleById.get(match.event_id) ?? '' }));

/** Registered, not withdrawn, not removed; one row per event+member. */
export const activeRegistrants = (participants: EventParticipant[]): EventParticipant[] => {
  const seen = new Set<string>();
  const candidates: EventParticipant[] = [];
  for (const participant of participants) {
    const key = `${participant.event_id}|${participant.uid}`;
    if (!participant.uid || participant.removal || participant.status === 'withdrawn' || seen.has(key)) continue;
    seen.add(key);
    candidates.push(participant);
  }
  return candidates;
};

/**
 * Registrants the organizer still needs to seat. Draws, never events: a finished sibling draw
 * must not hide a live one. Zone changes keep existing seats and only resurface singles players
 * when the new zone already has a covering draw they are not in.
 *
 * `effectiveZone` normalizes the key, so a zone-less legacy draw and its Downtown twin count as
 * one draw rather than two. Zone is tested separately from choice/division/band because folding
 * it in listed players the creator had moved across skill groups.
 */
export const selectUnplacedParticipants = ({
  candidates,
  matches,
  preferencesByUid,
  eventTitleById,
  zoneConfigByEventId,
}: {
  candidates: EventParticipant[];
  matches: TournamentMatch[];
  preferencesByUid: ReadonlyMap<string, UnplacedPreference>;
  eventTitleById: ReadonlyMap<string, string>;
  zoneConfigByEventId: ReadonlyMap<string, ZoneDrawConfig>;
}): UnplacedEntry[] => {
  const drawsByEvent = new Map<string, Map<string, Draw>>();
  for (const match of matches) {
    if (match.category !== 'singles' && match.category !== 'doubles') continue;
    const draws = drawsByEvent.get(match.event_id) ?? new Map<string, Draw>();
    const zone = effectiveZone(match.zone);
    const key = `${match.tournament_choice}|${match.division}|${match.skill_group}|${zone}`;
    const draw = draws.get(key) ?? {
      tc: match.tournament_choice,
      division: match.division,
      band: match.skill_group,
      zone,
      done: false,
      seats: new Set<string>(),
    };
    [match.player_1_uid, match.player_2_uid].forEach((id) => id && draw.seats.add(id));
    if (match.round === 'F' && match.status === 'complete' && match.winner_uid) draw.done = true;
    draws.set(key, draw);
    drawsByEvent.set(match.event_id, draws);
  }

  // Choice/division/band only. A 3.5 seated in Masters must not look "missing" from Challengers.
  const covering = (draw: Draw, participant: EventParticipant) => {
    const band = participant.skill_group === 'Retired Pro' ? 'Retired Pro' : skillBand(Number(participant.skill || 0));
    return (
      draw.tc === participant.tournament_choice &&
      (draw.division === participant.division || draw.division === 'All') &&
      (draw.band === band || draw.band === 'All')
    );
  };
  const inZone = (draw: Draw, participant: EventParticipant) =>
    draw.zone ===
    zoneBucketFor(preferencesByUid.get(participant.uid)?.zone, zoneConfigByEventId.get(participant.event_id));

  return candidates
    .filter((participant) => {
      const live = [...(drawsByEvent.get(participant.event_id)?.values() ?? [])].filter((draw) => !draw.done);
      const covered = live.filter((draw) => covering(draw, participant));
      if (covered.length === 0) return false;
      const seats = live.filter((draw) => draw.seats.has(participant.uid));
      // Registered and never placed — any live covering draw is somewhere the organizer could put them.
      if (seats.length === 0) return true;
      // Zone isn't a doubles draw dimension, so a placed doubles player never resurfaces.
      if (participant.tournament_choice === 'Doubles') return false;
      // Zone change only: every current seat is in another zone AND the new zone already has a
      // covering draw they are not in. Existing matches stay; this row is placement in the new zone.
      return (
        !seats.some((draw) => inZone(draw, participant)) &&
        covered.some((draw) => inZone(draw, participant) && !draw.seats.has(participant.uid))
      );
    })
    .map((participant) => {
      const preference = preferencesByUid.get(participant.uid);
      // No courts and no hand-picked zone = genuinely no zone. Downtown is a placement default only.
      return {
        participantId: participant.id,
        uid: participant.uid,
        name: participant.user_name || 'Player',
        eventId: participant.event_id,
        eventTitle: eventTitleById.get(participant.event_id) ?? '',
        division: participant.division,
        tournamentChoice: participant.tournament_choice,
        skill: participant.skill,
        zone:
          participant.zone ||
          (preference && (preference.manual || preference.courts.length > 0) ? preference.zone : ''),
      };
    });
};
