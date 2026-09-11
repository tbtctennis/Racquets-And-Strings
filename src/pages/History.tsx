import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { motion } from 'motion/react';
import { fadeUp, staggerDelay } from '../lib/motion';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useUserMatches } from '../features/matches/useUserMatches';
import { getEventDate } from './tournament/utils';
import { normalizeEvent, normalizeTournamentMatch } from '../lib/firestoreNormalization';
import { PersonInline } from '../components/PersonInline';
import { ListGroup } from '../components/ListGroup';
import { ListRow } from '../components/ListRow';
import { StatGrid } from '../components/StatGrid';
import { StatTile } from '../components/StatTile';

type PastEvent = { id: string; title: string; when: Date | null };

// History tab — two sections: My Matches (personal results, newest first) and Past Tournaments
// (the completed-events archive; opening one deep-links into the Tournament page read-only).
export const History: React.FC = () => {
  const { user } = useAuth();
  const { matches, loading } = useUserMatches(user?.uid);
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [eventTitles, setEventTitles] = useState<Record<string, string>>({});
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    document.title = 'History · Racquets & Strings';
  }, []);

  // A tournament is "past" once its final has a confirmed winner — same rule the Tournament
  // page uses to classify events.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getDocs(collection(db, 'events')),
      getDocs(query(collection(db, 'matches'), where('round', '==', 'F'), where('status', '==', 'complete'))),
    ])
      .then(([eventsSnap, finalsSnap]) => {
        if (cancelled) return;
        const completedIds = new Set(
          finalsSnap.docs
            .map((d) => normalizeTournamentMatch(d.id, d.data()))
            .filter((match) => match?.winner_uid)
            .map((match) => match!.event_id),
        );
        const titles: Record<string, string> = {};
        const rows = eventsSnap.docs
          .map((d) => normalizeEvent(d.id, d.data()))
          .map((event) => {
            const title = event.title || 'Tournament';
            titles[event.id] = title;
            return { id: event.id, title, when: getEventDate(event) };
          })
          .filter((event) => completedIds.has(event.id))
          .sort((a, b) => (b.when?.getTime() ?? 0) - (a.when?.getTime() ?? 0));
        setEventTitles(titles);
        setPastEvents(rows);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  if (!user) return null; // private route

  const matchCount = matches.length;
  const wins = matches.filter((m) => m.won).length;
  const winRate = matchCount === 0 ? '—' : `${Math.round((wins / matchCount) * 100)}%`;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-4 md:pt-6">
      {/* Title kept in the DOM for search engines and screen readers, but hidden — the bottom
          nav already shows which tab you're on. */}
      <h1 className="sr-only">History</h1>

      {!loading && (
        <StatGrid className="mb-6">
          <StatTile label="Matches" value={matchCount} />
          <StatTile label="Wins" value={wins} />
          <StatTile label="Win rate" value={winRate} />
        </StatGrid>
      )}

      <p className="text-xs font-bold uppercase tracking-widest text-fg/70 mb-3">My Matches</p>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-tennis-surface/30 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-3xl bg-tennis-surface/30 py-12 text-center">
          <p className="text-sm text-fg/70">No matches yet. Join an event and your results will land here.</p>
        </div>
      ) : (
        <ListGroup title="My Matches" className="rounded-3xl" labelledBy="history-matches-list">
          {matches.map((m, i) => (
            <motion.div key={m.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: staggerDelay(i) }}>
              <ListRow
                leading={
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black ${
                      m.won ? 'bg-green-500/15 text-badge-win' : 'bg-red-500/15 text-badge-loss'
                    }`}
                  >
                    {m.won ? 'W' : 'L'}
                  </span>
                }
                title={
                  <>
                    vs{' '}
                    {m.opponentId ? (
                      <Link to={`/players/${m.opponentId}`}>
                        <PersonInline name={m.opponentName} />
                      </Link>
                    ) : (
                      <PersonInline name={m.opponentName} />
                    )}
                  </>
                }
                description={
                  <>
                    {m.completedAt > 0
                      ? new Date(m.completedAt).toLocaleDateString('en-CA', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : null}
                    {m.eventId && eventTitles[m.eventId] ? (
                      <>
                        {m.completedAt > 0 ? ' · ' : null}
                        <Link to={`/matches?mode=tournament&event=${m.eventId}`}>{eventTitles[m.eventId]}</Link>
                      </>
                    ) : null}
                  </>
                }
                trailing={m.scoreLine || '—'}
              />
            </motion.div>
          ))}
        </ListGroup>
      )}

      <p className="text-xs font-bold uppercase tracking-widest text-fg/70 mb-3 mt-8">Past Tournaments</p>

      {eventsLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-tennis-surface/30 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : pastEvents.length === 0 ? (
        <div className="rounded-3xl bg-tennis-surface/30 py-10 text-center">
          <p className="text-sm text-fg/70">No completed tournaments yet.</p>
        </div>
      ) : (
        <ListGroup title="Past Tournaments" className="rounded-3xl" labelledBy="history-events-list">
          {pastEvents.map((e, i) => (
            <motion.div key={e.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: staggerDelay(i) }}>
              <Link to={`/matches?mode=tournament&event=${e.id}`}>
                <ListRow
                  leading={
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-clay/25 bg-clay/15">
                      <Trophy className="h-4 w-4 text-clay-fg" />
                    </span>
                  }
                  title={e.title}
                  description={
                    e.when ? e.when.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' }) : undefined
                  }
                  trailing={<ChevronRight className="h-4 w-4 text-fg/70" />}
                  className="hover:bg-fg/[0.03]"
                />
              </Link>
            </motion.div>
          ))}
        </ListGroup>
      )}
    </div>
  );
};
