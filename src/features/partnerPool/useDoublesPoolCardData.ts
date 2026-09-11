import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import {
  normalizeEventParticipant,
  normalizeTournamentMatch,
  normalizeUserPreferences,
  normalizeUserStats,
} from '../../lib/firestoreNormalization';
import { pgWinPct } from '../leagues/useStandings';
import { sharesCourt } from '../../utils/courtOverlap';
import {
  doublesWinsFor,
  partnersFor,
  type DoublesPoolMatchRef,
  type DoublesPoolParticipantRef,
} from './doublesPoolStats';
import type { DoublesPoolCardValues } from './DoublesPoolCard';

const emptyValues = (): DoublesPoolCardValues => ({
  wins: 0,
  pgWonPct: '—',
  partners: [],
  availabilityTags: [],
  nearby: false,
});

const toMatchRef = (id: string, data: unknown): DoublesPoolMatchRef | null => {
  const match = normalizeTournamentMatch(id, data);
  if (match) {
    return {
      eventId: match.event_id,
      player1Uid: match.player_1_uid,
      player2Uid: match.player_2_uid,
      winnerUid: match.winner_uid,
      status: match.status,
      category: match.category,
      tournamentChoice: match.tournament_choice,
    };
  }
  const raw = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const player1Uid = typeof raw.player_1_uid === 'string' ? raw.player_1_uid : '';
  const player2Uid = typeof raw.player_2_uid === 'string' ? raw.player_2_uid : '';
  if (!player1Uid && !player2Uid) return null;
  return {
    eventId: typeof raw.event_id === 'string' ? raw.event_id : '',
    player1Uid,
    player2Uid,
    winnerUid: typeof raw.winner_uid === 'string' ? raw.winner_uid : undefined,
    status: typeof raw.status === 'string' ? raw.status : '',
    category: typeof raw.category === 'string' ? raw.category : undefined,
    tournamentChoice: typeof raw.tournament_choice === 'string' ? raw.tournament_choice : undefined,
  };
};

const toParticipantRef = (id: string, data: unknown): DoublesPoolParticipantRef | null => {
  const participant = normalizeEventParticipant(id, data);
  if (!participant) return null;
  return {
    uid: participant.uid,
    eventId: participant.event_id,
    userName: participant.user_name,
    partnerUid: participant.partner_uid,
    partnerName: participant.partner_name,
    tournamentChoice: participant.tournament_choice,
  };
};

export function useDoublesPoolCardData(memberUids: string[]): Record<string, DoublesPoolCardValues> {
  const { profile } = useAuth();
  const myCourts = useMemo(
    () => new Set(profile?.preferences.preferred_courts ?? []),
    [profile?.preferences.preferred_courts],
  );
  const [byUid, setByUid] = useState<Record<string, DoublesPoolCardValues>>({});
  const uidsKey = memberUids.join(',');

  useEffect(() => {
    const uids = uidsKey ? uidsKey.split(',').filter(Boolean) : [];
    if (uids.length === 0) {
      setByUid({});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const rows = await Promise.all(
          uids.map(async (uid) => {
            const [statsSnap, prefSnap, asPlayer, asPartner, asP1, asP2] = await Promise.all([
              getDoc(doc(db, 'stats', uid)),
              getDoc(doc(db, 'preferences', uid)),
              getDocs(query(collection(db, 'event_participants'), where('uid', '==', uid))),
              getDocs(query(collection(db, 'event_participants'), where('partner_uid', '==', uid))),
              getDocs(query(collection(db, 'matches'), where('player_1_uid', '==', uid))),
              getDocs(query(collection(db, 'matches'), where('player_2_uid', '==', uid))),
            ]);

            const stats = statsSnap.exists() ? normalizeUserStats(statsSnap.data()) : undefined;
            const preferences = prefSnap.exists() ? normalizeUserPreferences(prefSnap.data()) : undefined;
            const participants = [...asPlayer.docs, ...asPartner.docs].flatMap((document) => {
              const participant = toParticipantRef(document.id, document.data());
              return participant ? [participant] : [];
            });
            const seenMatches = new Set<string>();
            const matches = [...asP1.docs, ...asP2.docs].flatMap((document) => {
              if (seenMatches.has(document.id)) return [];
              seenMatches.add(document.id);
              const match = toMatchRef(document.id, { match_id: document.id, ...document.data() });
              return match ? [match] : [];
            });

            const values: DoublesPoolCardValues = {
              wins: doublesWinsFor(uid, matches, participants),
              pgWonPct: stats ? pgWinPct(stats) : '—',
              partners: partnersFor(uid, participants),
              availabilityTags: preferences?.availability_tags ?? [],
              nearby: sharesCourt(preferences?.preferred_courts, myCourts),
            };
            return [uid, values] as const;
          }),
        );
        if (!cancelled) setByUid(Object.fromEntries(rows));
      } catch {
        if (!cancelled) {
          setByUid(Object.fromEntries(uids.map((uid) => [uid, emptyValues()])));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [myCourts, uidsKey]);

  return byUid;
}

export { emptyValues };
