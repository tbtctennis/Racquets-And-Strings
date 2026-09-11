import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { ArrowLeft, Mail, Phone, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { fadeUp, staggerDelay } from '../lib/motion';
import { db } from '../lib/firebase';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { ProfileCard } from '../components/ProfileCard';
import { StatGrid } from '../components/StatGrid';
import { MemberInfo, UserPreferences, UserStats } from '../types';
import type { TournamentMatch } from './tournament/types';
import { useCommunityStandings } from '../features/tasks/useTasks';
import { pgWinPct } from '../features/leagues/useStandings';
import {
  normalizeContactData,
  normalizeEvent,
  normalizeTournamentMatch,
  normalizeUserData,
  normalizeUserPreferences,
  normalizeUserStats,
} from '../lib/firestoreNormalization';

// Furthest-round derivation for Best Finish / Best Result from a player's tournament matches.
const ROUND_ORDER = ['R64', 'R32', 'R16', 'QF', 'SF', 'F'];
const ROUND_LABEL: Record<string, string> = {
  R64: 'Round of 64',
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarterfinal',
  SF: 'Semifinal',
  F: 'Final',
};

const deriveResults = (mine: TournamentMatch[], uid: string) => {
  let bestIdx = -1;
  let wonFinal = false;
  for (const m of mine) {
    const idx = ROUND_ORDER.indexOf(m.round);
    if (idx < 0) continue;
    if (idx > bestIdx) bestIdx = idx;
    if (m.round === 'F' && m.status === 'complete' && m.winner_uid === uid) wonFinal = true;
  }
  const bestFinish = bestIdx >= 0 ? ROUND_LABEL[ROUND_ORDER[bestIdx]] : '—';
  let bestResult = '—';
  if (wonFinal) bestResult = 'Champion';
  else if (bestIdx >= 0) {
    const r = ROUND_ORDER[bestIdx];
    bestResult = r === 'F' ? 'Finalist' : r === 'SF' ? 'Semifinalist' : r === 'QF' ? 'Quarterfinalist' : ROUND_LABEL[r];
  }
  return { bestFinish, bestResult };
};

// Read-only view of another player's profile — mirrors the user's own profile page
// (vertical, centred Profile Card + match stats + availability) with no edit controls.
export const PlayerProfile: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event') || null;

  const [player, setPlayer] = useState<MemberInfo | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [organizer, setOrganizer] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({ bestFinish: '—', bestResult: '—' });
  const [completedMatches, setCompletedMatches] = useState<{ won: boolean }[]>([]);
  const { rows: communityRows } = useCommunityStandings();
  const rsPoints = userId ? (communityRows.find((r) => r.uid === userId)?.points ?? 0) : 0;

  useEffect(() => {
    document.title = 'Player Profile · Racquets & Strings';
  }, []);

  useEffect(() => {
    const loadPlayer = async () => {
      setLoading(true);
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        // Contact details are a separate, sign-in-gated doc. A signed-out visitor still sees the
        // public card (name, badges, stats) — the contacts read just fails and resolves to null.
        const [userDoc, statsDoc, prefsDoc, contactsDoc] = await Promise.all([
          getDoc(doc(db, 'users', userId)),
          getDoc(doc(db, 'stats', userId)),
          getDoc(doc(db, 'preferences', userId)),
          getDoc(doc(db, 'contacts', userId)).catch(() => null),
        ]);

        const playerData = userDoc.exists()
          ? {
              ...normalizeUserData(userDoc.data()),
              ...(contactsDoc?.exists() ? normalizeContactData(contactsDoc.data()) : {}),
            }
          : null;
        setPlayer(playerData);
        if (playerData?.name) document.title = `${playerData.name} · Racquets & Strings`;
        setStats(statsDoc.exists() ? normalizeUserStats(statsDoc.data()) : null);
        setPreferences(prefsDoc.exists() ? normalizeUserPreferences(prefsDoc.data()) : null);

        // Best Finish / Best Result stay page-level. Streak is derived on ProfileCard from the
        // same completed-match list so own and public cards do not recompute it separately.
        try {
          const [m1, m2] = await Promise.all([
            getDocs(query(collection(db, 'matches'), where('player_1_uid', '==', userId))),
            getDocs(query(collection(db, 'matches'), where('player_2_uid', '==', userId))),
          ]);
          const byId = new Map<string, TournamentMatch>();
          [...m1.docs, ...m2.docs].forEach((d) => {
            const match = normalizeTournamentMatch(d.id, d.data());
            if (match) byId.set(d.id, match);
          });
          const mine = [...byId.values()];
          const completed = mine
            .filter((m) => m.status === 'complete' && m.winner_uid)
            .sort((a, b) => (Date.parse(b.completed_at || '') || 0) - (Date.parse(a.completed_at || '') || 0))
            .map((m) => ({ won: m.winner_uid === userId }));
          setCompletedMatches(completed);
          setResults(deriveResults(mine, userId));
        } catch {
          setCompletedMatches([]);
          setResults({ bestFinish: '—', bestResult: '—' });
        }

        // Reset before resolving — otherwise a previous player's organizer can keep showing
        // if this player has no event/organizer to resolve (switching :userId doesn't remount).
        setOrganizer(null);
        if (eventId) {
          const eventDoc = await getDoc(doc(db, 'events', eventId));
          if (eventDoc.exists()) {
            const eventData = normalizeEvent(eventDoc.id, eventDoc.data());
            if (eventData.creator_id) {
              const [creatorDoc, creatorContacts] = await Promise.all([
                getDoc(doc(db, 'users', eventData.creator_id)),
                getDoc(doc(db, 'contacts', eventData.creator_id)).catch(() => null),
              ]);
              if (creatorDoc.exists()) {
                setOrganizer({
                  ...normalizeUserData(creatorDoc.data()),
                  ...(creatorContacts?.exists() ? normalizeContactData(creatorContacts.data()) : {}),
                });
              }
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadPlayer();
  }, [userId, eventId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-3xl font-black text-fg mb-3">Player Not Found</h1>
        <p className="text-fg mb-6">This player profile is not available.</p>
        <Button variant="outline" onClick={() => navigate('/matches?mode=tournament')}>
          Back to Tournament
        </Button>
      </div>
    );
  }

  const s = stats as (UserStats & { matchesPlayed?: number; leaguePoints26?: number }) | null;
  const statTiles = [
    { label: 'RS Points', value: `${rsPoints}`, accent: 'text-fg' },
    { label: 'League Points', value: `${s?.leaguePoints26 ?? 0}`, accent: 'text-fg' },
    { label: 'Matches', value: `${s?.matchesPlayed ?? 0}`, accent: 'text-fg' },
    { label: 'Best Finish', value: results.bestFinish, accent: 'text-fg' },
    { label: 'Best Result', value: results.bestResult, accent: 'text-fg' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20 pt-8 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="px-2">
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back
      </Button>

      <ProfileCard
        mode="public"
        name={player.name}
        avatar={player.avatar}
        avatarAlt={player.name}
        bio={player.bio}
        skillLevel={stats?.skill_level}
        league={stats?.league}
        displayBadges={player.display_badges}
        courts={preferences?.preferred_courts}
        favourites={preferences?.favourite_players}
        phone={player.phone}
        email={player.email}
        whatsappContact={player.whatsapp_contact}
        preferred={player.preferred_mode_of_contact}
        matches={completedMatches}
        pgWonPct={pgWinPct(stats ?? {})}
      />

      {/* Match Stats — read-only mirror of ProfileStats */}
      <div className="bg-tennis-surface/30 rounded-3xl card-shadow p-6">
        <h2 className="text-lg font-bold text-fg flex items-center mb-4">
          <Star className="w-5 h-5 mr-2 text-clay-fg" />
          Match Stats
        </h2>
        <StatGrid className="gap-3">
          {statTiles.map((t, i) => (
            <motion.div
              key={t.label}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: staggerDelay(i) }}
              className="rounded-2xl bg-fg/5 px-3 py-4 text-center"
            >
              <p className={`text-2xl font-black ${t.accent}`}>{t.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-fg/70 mt-1">{t.label}</p>
            </motion.div>
          ))}
        </StatGrid>
      </div>

      {organizer && (
        <div className="rounded-3xl bg-tennis-surface/30 card-shadow p-6">
          <h2 className="text-base font-black text-fg mb-3">Contact organizer if you require any assistance</h2>
          <div className="flex flex-wrap gap-6">
            {organizer.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-clay-fg shrink-0" />
                <span className="text-fg font-semibold break-all">{organizer.email}</span>
              </div>
            )}
            {organizer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-clay-fg shrink-0" />
                <span className="text-fg font-semibold">{organizer.phone}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
