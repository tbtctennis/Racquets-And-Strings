import { TennisEvent } from '../types';

/** The only event types that may be offered or persisted by the event editor. */
export const EVENT_TYPES = ['Socials', 'Tournaments', 'Specials', 'League Ladder'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const isEventType = (type: string): type is EventType => (EVENT_TYPES as readonly string[]).includes(type);

export const isTournamentType = (type: string) => type === 'Tournaments';

export const isRecurringWeekly = (event: TennisEvent) =>
  event.recurring_weekly === true || event.recurring === true || event.recurring === 'Yes';

export const isTournamentEvent = (event: TennisEvent) => isTournamentType(event.type);

export const isLadderEvent = (event: TennisEvent) => event.type.toLowerCase().includes('league ladder');

// Events page category split: Tournament/League Ladder/League Event count as "Tournaments";
// everything else (Meetup, Special Event, Social) is "Socials". Takes a raw type string so it
// works for both full TennisEvent objects and lighter list rows that only carry `type`.
export const isTournamentCategoryType = (type: string) => {
  return isEventType(type) && (isTournamentType(type) || type === 'League Ladder');
};

export const isTournamentCategoryEvent = (event: TennisEvent) => isTournamentCategoryType(event.type);

export const isSeasonOpener = (event: TennisEvent) => event.title.toLowerCase().includes('season opener 2026');

export const isWeekendMatchdaysEvent = (event: TennisEvent) => event.title.toLowerCase().includes('weekend matchdays');

export const isTopspinMeetupEvent = (event: TennisEvent) => {
  const title = event.title.toLowerCase();
  return title.includes('topspin tuesdays') || title.includes('topspin thursdays');
};
