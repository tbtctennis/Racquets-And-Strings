import { addDoc, collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { EventParticipant } from '../../../types';
import type { TournamentMatch } from '../../tournament/types';
import type { JoinedRegistration } from '../types';
import { buildEventParticipantData, type EventParticipantWrite } from './eventParticipant';
import { countActiveParticipants, toJoinedRegistrations } from './eventRegistrationState';
import { normalizeEventParticipant, normalizeTournamentMatch } from '../../../lib/firestoreNormalization';

/** Firestore boundary for event registration and the tournament-slot lookup used by the join flow. */
export const loadTournamentMatches = async (eventId: string): Promise<TournamentMatch[]> => {
  const snapshot = await getDocs(
    query(collection(db, 'matches'), where('event_id', '==', eventId), where('category', 'in', ['singles', 'doubles'])),
  );
  return snapshot.docs
    .map((matchDoc) => normalizeTournamentMatch(matchDoc.id, matchDoc.data()))
    .filter((match): match is TournamentMatch => match !== null);
};

export const createEventParticipant = async (input: EventParticipantWrite) =>
  addDoc(collection(db, 'event_participants'), buildEventParticipantData(input));

export const subscribeEventParticipantCounts = (onValue: (counts: Record<string, number>) => void) =>
  onSnapshot(
    collection(db, 'event_participants'),
    (snapshot) => {
      onValue(
        countActiveParticipants(
          snapshot.docs
            .map((participantDoc) => normalizeEventParticipant(participantDoc.id, participantDoc.data()))
            .filter((participant): participant is EventParticipant => participant !== null),
        ),
      );
    },
    () => onValue({}),
  );

export const subscribeJoinedRegistrations = (uid: string, onValue: (items: JoinedRegistration[]) => void) =>
  onSnapshot(query(collection(db, 'event_participants'), where('uid', '==', uid)), (snapshot) => {
    onValue(
      toJoinedRegistrations(
        snapshot.docs
          .map((participantDoc) => normalizeEventParticipant(participantDoc.id, participantDoc.data()))
          .filter((participant): participant is EventParticipant => participant !== null),
      ),
    );
  });
