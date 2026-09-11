import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { motion } from 'motion/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { pgWinPct, snapshotRank, useStandings } from '../features/leagues/useStandings';
import { formatPersonName } from '../utils/nameFormatting';
import { useUserMatches } from '../features/matches/useUserMatches';
import { TOTAL_MILESTONES, TOTAL_TASKS, useCommunityStandings } from '../features/tasks/useTasks';
import { Accordion } from '../components/Accordion';
import { SegmentedControl } from '../components/SegmentedControl';
import { Spinner } from '../components/Spinner';
import { PlayerCard, RankMove } from '../components/PlayerCard';
import { streakFromMatches } from '../components/ProfileCard';
import { ListGroup } from '../components/ListGroup';
import { StatGrid } from '../components/StatGrid';
import { LeaderboardChart } from '../features/leagues/LeaderboardChart';
import {
  lastFiveProgressPoints,
  rankSnapshotsFromEntries,
  type RankSnapshot,
} from '../features/leagues/leaderboardChart';
import { useExpandedRow } from '../lib/expandedRow';
import { fadeUp, staggerDelay } from '../lib/motion';
import { skillBand } from './tournament/utils';

// Two boards on the Leaderboard: Tournament (playing points — one flat list across all
// divisions) and Community (the "Community Member Starter" — completing it awards SETUP_POINTS).
type Board = 'tournament' | 'community';

export const Leagues: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { rows, loading } = useStandings();
  const { matches: userMatches } = useUserMatches(user?.uid);
  const { rows: communityRows, loading: communityLoading, reload: reloadCommunity } = useCommunityStandings();
  const [rankHistory, setRankHistory] = useState<RankSnapshot[]>([]);

  useEffect(() => {
    document.title = 'Leaderboard · Racquets & Strings';
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setRankHistory([]);
      return;
    }
    let cancelled = false;
    getDocs(collection(db, 'ranking_history', user.uid, 'entries'))
      .then((snap) => {
        if (cancelled) return;
        setRankHistory(rankSnapshotsFromEntries(snap.docs.map((d) => d.data())));
      })
      .catch(() => {
        if (!cancelled) setRankHistory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);
  const [board, setBoard] = useState<Board>('tournament');
  // Same one-at-a-time disclosure Matches and other player-row lists use. A Set would let two
  // drawers stay open across the tournament/community boards; one id keeps the behaviour identical.
  const { expandedId, toggle } = useExpandedRow();
  const [progressOpen, setProgressOpen] = useState(true);

  // The "still in an active tournament" lookup that used to live here has been removed along with
  // the asterisk it fed. It read the whole `events` collection plus every participant and
  // completed match across up to 30 tournaments, purely to mark one character next to a number.

  // Single flat ranked list — all divisions, ordered by league points. Logged-out visitors see
  // the top 15; signed-in members see the full table.
  // Points filter lives here, not in useStandings: that hook now returns every member so the
  // Matches page can surface brand-new signups, but a leaderboard of people on 0 points isn't a
  // leaderboard.
  const flatRows = useMemo(
    () =>
      rows
        .filter((r) => r.leaguePoints26 > 0)
        .sort(
          (a, b) =>
            b.leaguePoints26 - a.leaguePoints26 || b.matchesPlayed - a.matchesPlayed || a.name.localeCompare(b.name),
        ),
    [rows],
  );
  const shownRows = user ? flatRows : flatRows.slice(0, 15);
  const communityVisible = user ? communityRows : communityRows.slice(0, 15);

  // Your Progress (signed-in): rank in the flat board + own stats + last-five chart.
  // Live list position wins; the weekly `rankPosition` snapshot is the fallback when the member
  // is off the points board (D8 restored the field — DC-11's "rendered nowhere" premise was wrong).
  const userRankIdx = user ? flatRows.findIndex((r) => r.user_id === user.uid) : -1;
  const userStats = profile?.stats;
  const userRow = user ? rows.find((r) => r.user_id === user.uid) : undefined;
  const liveRank = userRankIdx >= 0 ? userRankIdx + 1 : (snapshotRank(userRow) ?? snapshotRank(userStats) ?? 0);
  const chartPoints = useMemo(
    () => lastFiveProgressPoints(userMatches, liveRank, rankHistory),
    [userMatches, liveRank, rankHistory],
  );
  const userStreak = useMemo(() => streakFromMatches(userMatches), [userMatches]);

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 pb-20 pt-4">
      <h1 className="sr-only">Leaderboard</h1>

      {/* Compact header (wireframe 1h): one band — board toggle + division chips */}
      <div className="space-y-2.5 mb-5">
        <SegmentedControl<Board>
          options={[
            { value: 'tournament', label: 'Tournament' },
            { value: 'community', label: 'RS Points' },
          ]}
          value={board}
          onChange={setBoard}
          className="max-w-xs"
        />
      </div>

      {board === 'tournament' && (
        <>
          {/* Your Progress — collapsible so the list sits higher up */}
          {user && userStats && userRankIdx >= 0 && (
            <Accordion
              id="progress"
              title="Progress"
              open={progressOpen}
              onToggle={() => setProgressOpen((v) => !v)}
              titleClassName="text-lg font-bold"
              className="mb-6"
            >
              <StatGrid className="grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Rank', value: userRankIdx >= 0 ? `#${userRankIdx + 1}` : '—' },
                  { label: 'Matches', value: `${userStats.matchesPlayed ?? 0}` },
                  {
                    label: 'P/G Won %',
                    value: pgWinPct(userStats),
                  },
                ].map((t) => (
                  <div key={t.label} className="rounded-2xl bg-fg/[0.03] px-3 py-3 text-center">
                    <p className="text-2xl font-black text-fg">{t.value}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-fg/70 mt-1">{t.label}</p>
                  </div>
                ))}
              </StatGrid>
              <LeaderboardChart points={chartPoints} className="w-full h-40" />
            </Accordion>
          )}

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-tennis-surface/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <ListGroup title="Standings" className="rounded-3xl" labelledBy="league-standings-list">
              {shownRows.length === 0 ? (
                <p className="text-sm text-fg/70 py-6 text-center">Standings appear once matches are played.</p>
              ) : (
                shownRows.map((row, i) => {
                  const isUser = user?.uid === row.user_id;
                  const isOpen = expandedId === row.user_id;
                  return (
                    <motion.div
                      key={row.user_id}
                      {...fadeUp}
                      transition={{ ...fadeUp.transition, delay: staggerDelay(i) }}
                    >
                      <PlayerCard
                        id={row.user_id}
                        name={formatPersonName(row.name)}
                        subtitle={`Skill ${row.skill_level} · ${skillBand(row.skill_level)}`}
                        rank={i + 1}
                        isYou={isUser}
                        primary={row.leaguePoints26}
                        open={isOpen}
                        onToggle={() => toggle(row.user_id)}
                        stats={[
                          { label: 'Wins', value: `${row.wins}` },
                          { label: 'P/G Won %', value: pgWinPct(row) },
                          { label: 'Rank Move', value: <RankMove t={row.rankTrend} move={row.rankMove} /> },
                          { label: 'Streak', value: isUser ? userStreak : '—' },
                        ]}
                      />
                    </motion.div>
                  );
                })
              )}
            </ListGroup>
          )}

          {/* Footnotes */}
          <div className="mt-4 space-y-1">
            <p className="text-xs text-fg/70">
              <span className="font-semibold text-fg/70">P/G</span> is Points or Games, depending on the match format
              chosen by the players.
            </p>
          </div>
        </>
      )}

      {/* ── Community board: points from completing tasks (Tasks tab) ── */}
      {board === 'community' &&
        (communityLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-tennis-surface/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : communityVisible.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl font-bold text-fg">No RS Points yet</p>
            <p className="text-fg/70 mt-1 text-sm">
              Complete tasks in the{' '}
              <Link to="/tasks" className="text-clay-fg font-semibold">
                Tasks
              </Link>{' '}
              tab to earn points.
            </p>
          </div>
        ) : (
          <ListGroup title="Standings" className="rounded-3xl" labelledBy="community-standings-list">
            {communityVisible.map((row, i) => {
              const isUser = user?.uid === row.uid;
              const isOpen = expandedId === row.uid;
              return (
                <motion.div key={row.uid} {...fadeUp} transition={{ ...fadeUp.transition, delay: staggerDelay(i) }}>
                  <PlayerCard
                    id={row.uid}
                    name={formatPersonName(row.name || '')}
                    subtitle={`${row.tasksCompleted} tasks · ${row.milestones} milestones`}
                    rank={i + 1}
                    isYou={isUser}
                    primary={row.points}
                    open={isOpen}
                    onToggle={() => toggle(row.uid)}
                    stats={[
                      { label: 'Tasks Completed', value: `${row.tasksCompleted}/${TOTAL_TASKS}` },
                      { label: 'Milestones', value: `${row.milestones}/${TOTAL_MILESTONES}` },
                    ]}
                  />
                </motion.div>
              );
            })}
          </ListGroup>
        ))}
    </div>
  );
};
