import { collection, doc, documentId, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import {
  normalizeEvent,
  normalizeEventParticipant,
  normalizeRoundRobinDraft,
  normalizeTournamentMatch,
  normalizeUserPreferences,
  type RoundRobinDraft,
} from '../../../lib/firestoreNormalization';
import type { EventParticipant, TennisEvent } from '../../../types';
import type { TournamentMatch } from '../types';
import type { UnplacedPreference } from '../domain/organizerQueues';

const FIRESTORE_IN_LIMIT = 30;

const chunk = <T>(values: T[], size: number) =>
  Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, index * size + size),
  );

export const loadTournamentEvents = async (): Promise<TennisEvent[]> => {
  const snapshot = await getDocs(collection(db, 'events'));
  return snapshot.docs.map((doc) => normalizeEvent(doc.id, doc.data()));
};

export const subscribeEventParticipants = (eventId: string, onValue: (items: EventParticipant[]) => void) =>
  onSnapshot(query(collection(db, 'event_participants'), where('event_id', '==', eventId)), (snapshot) =>
    onValue(
      snapshot.docs
        .map((doc) => normalizeEventParticipant(doc.id, doc.data()))
        .filter((item): item is EventParticipant => item !== null),
    ),
  );

export const subscribeTournamentMatches = (eventId: string, onValue: (items: TournamentMatch[]) => void) =>
  onSnapshot(
    query(collection(db, 'matches'), where('event_id', '==', eventId), where('category', 'in', ['singles', 'doubles'])),
    (snapshot) =>
      onValue(
        snapshot.docs
          .map((doc) => normalizeTournamentMatch(doc.id, doc.data()))
          .filter((item): item is TournamentMatch => item !== null),
      ),
  );

export const subscribeRoundRobinDraft = (
  eventId: string,
  drawKey: string,
  onValue: (draft: RoundRobinDraft | null) => void,
) =>
  onSnapshot(
    doc(db, 'events', eventId, 'rr_drafts', drawKey),
    (snapshot) => onValue(snapshot.exists() ? normalizeRoundRobinDraft(snapshot.data()) : null),
    () => onValue(null),
  );

/** A denied or failed read leaves the queue empty rather than stranding a stale list. */
export const subscribeScheduleRequestedMatches = (onValue: (items: TournamentMatch[]) => void) =>
  onSnapshot(
    query(collection(db, 'matches'), where('schedule_requested', '==', true)),
    (snapshot) =>
      onValue(
        snapshot.docs
          .map((matchDoc) => normalizeTournamentMatch(matchDoc.id, matchDoc.data()))
          .filter((item): item is TournamentMatch => item !== null),
      ),
    () => onValue([]),
  );

export const loadEventParticipantsByEventIds = async (eventIds: string[]): Promise<EventParticipant[]> => {
  if (eventIds.length === 0) return [];
  const snapshots = await Promise.all(
    chunk(eventIds, FIRESTORE_IN_LIMIT).map((ids) =>
      getDocs(query(collection(db, 'event_participants'), where('event_id', 'in', ids))),
    ),
  );
  return snapshots.flatMap((snapshot) =>
    snapshot.docs
      .map((participantDoc) => normalizeEventParticipant(participantDoc.id, participantDoc.data()))
      .filter((item): item is EventParticipant => item !== null),
  );
};

export const loadMatchesByEventIds = async (eventIds: string[]): Promise<TournamentMatch[]> => {
  if (eventIds.length === 0) return [];
  const snapshots = await Promise.all(
    chunk(eventIds, FIRESTORE_IN_LIMIT).map((ids) =>
      getDocs(query(collection(db, 'matches'), where('event_id', 'in', ids))),
    ),
  );
  return snapshots.flatMap((snapshot) =>
    snapshot.docs
      .map((matchDoc) => normalizeTournamentMatch(matchDoc.id, matchDoc.data()))
      .filter((item): item is TournamentMatch => item !== null),
  );
};

export const loadPreferencesByUids = async (uids: string[]): Promise<Map<string, UnplacedPreference>> => {
  const uniqueIds = [...new Set(uids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();
  const snapshots = await Promise.all(
    chunk(uniqueIds, FIRESTORE_IN_LIMIT).map((ids) =>
      getDocs(query(collection(db, 'preferences'), where(documentId(), 'in', ids))),
    ),
  );
  const preferences = new Map<string, UnplacedPreference>();
  snapshots.forEach((snapshot) =>
    snapshot.forEach((preferenceDoc) => {
      const preference = normalizeUserPreferences(preferenceDoc.data());
      preferences.set(preferenceDoc.id, {
        courts: preference.preferred_courts,
        zone: preference.preferred_zone,
        manual: preference.preferred_zone_manual === true,
      });
    }),
  );
  return preferences;
};
