import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronDown, Minus } from 'lucide-react';
import { Avatar } from './Avatar';
import { DrawerLayout, type DrawerStat } from './DrawerLayout';
import { formatPersonName } from '../utils/nameFormatting';

// Rank movement since the last weekly snapshot. Lives here rather than on a page because it now
// renders on every surface that shows a player row.
export const RankMove: React.FC<{ t?: 'up' | 'down' | 'flat'; move?: number }> = ({ t, move }) =>
  t === 'up' ? (
    <span className="inline-flex items-center gap-0.5 text-badge-win" aria-label={`rising${move ? ` ${move}` : ''}`}>
      <ArrowUp className="w-3 h-3" />
      {!!move && <span className="text-xs font-bold">{move}</span>}
    </span>
  ) : t === 'down' ? (
    <span className="inline-flex items-center gap-0.5 text-badge-loss" aria-label={`falling${move ? ` ${move}` : ''}`}>
      <ArrowDown className="w-3 h-3" />
      {!!move && <span className="text-xs font-bold">{move}</span>}
    </span>
  ) : (
    <Minus className="w-3 h-3 text-fg/70 inline" aria-label="no change" />
  );

// Where a row came from, as a single letter on the name line: T tournament, C challenge,
// R rally (rally). Clay for the two competitive sources, plain foreground for rallies —
// which is white in dark theme and dark green in light, from the --color-fg token.
export const SourceLetter: React.FC<{ source: 'tournament' | 'challenge' | 'rally' }> = ({ source }) => (
  <span
    className={`text-xs font-black ${source === 'rally' ? 'text-fg' : 'text-clay-fg'}`}
    aria-label={source === 'tournament' ? 'Tournament' : source === 'challenge' ? 'Challenge' : 'Rally'}
  >
    {source === 'tournament' ? 'T' : source === 'challenge' ? 'C' : 'R'}
  </span>
);

// One compact, expandable player row shared by the leaderboards, challenges, rallies and
// tournament groups — each had grown its own copy, which is why the boards drifted apart.
//
// Presentational: owns no open state and fetches nothing. The parent keeps its `Set<string>` of
// open ids and passes `open`/`onToggle`, so migrating a surface never changes how it loads data.
// Row identity is normalised here — callers pass `user_id` or `uid` as `id`.

export type PlayerCardStat = DrawerStat;

export type PlayerCardProps = {
  id: string;
  name: string;
  /** Optional profile photo; the 24px initial avatar is used when absent. */
  avatar?: string;
  /** Secondary line under the name, e.g. "Skill 3.5". */
  subtitle?: React.ReactNode;
  /** Makes the name a link. Surfaces gate this on an accepted challenge or rally existing. */
  nameHref?: string;
  /** Leading position number. Omit on non-ranked surfaces. */
  rank?: number;
  /** Marks the signed-in user's own row. */
  isYou?: boolean;
  /** Right-aligned headline figure, e.g. league points. */
  primary?: React.ReactNode;
  /** Slot after `primary`, e.g. a rank-trend arrow. */
  trailing?: React.ReactNode;
  /**
   * Small marker on the name line, before the name — the single-letter source tag (T/C/R).
   * Kept out of `pills`: a full-width pill row made every row two lines tall just to say which
   * kind of match it was.
   */
  nameBadge?: React.ReactNode;
  /** Pills shown on the collapsed row (availability, nearby, …). */
  pills?: React.ReactNode;
  /** Extra pills revealed only when expanded. */
  expandedPills?: React.ReactNode;
  /** Stat tiles in the drawer. */
  stats?: PlayerCardStat[];
  /**
   * Fixed-width action slot on the collapsed row. Space is reserved even when empty, so names stay
   * in one vertical line down the list.
   */
  action?: React.ReactNode;
  /**
   * Width of that slot. Defaults to the leaderboards' single-button column; a multi-control stack
   * (randomize / reset / score) passes its own so the row doesn't squash.
   */
  actionClassName?: string;
  /** Extra drawer content below the stats grid. */
  children?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  className?: string;
};

export const PlayerCard: React.FC<PlayerCardProps> = ({
  id,
  name,
  avatar,
  subtitle,
  nameHref,
  rank,
  isYou,
  primary,
  trailing,
  nameBadge,
  pills,
  expandedPills,
  stats,
  action,
  actionClassName = 'w-[78px]',
  children,
  open,
  onToggle,
  className = '',
}) => {
  const displayName = formatPersonName(name);
  const hasDrawer = !!(stats?.length || expandedPills || children);

  return (
    <div className={`${isYou ? 'bg-clay/10' : ''} min-h-11 px-3 py-2.5 ${className}`}>
      <div className="flex items-center gap-3">
        {rank !== undefined && <span className="text-fg/70 font-mono text-xs w-6 shrink-0">{rank}</span>}

        <Avatar src={avatar} name={displayName} size="row" />

        <div className="min-w-0 flex-1">
          <p className="text-fg font-semibold text-sm truncate">
            {nameBadge ? <span className="mr-1.5">{nameBadge}</span> : null}
            {nameHref ? (
              <Link to={nameHref} className="hover:text-clay-fg transition-colors">
                {displayName}
              </Link>
            ) : (
              displayName
            )}
            {isYou ? <span className="ml-1 text-clay-fg text-xs">(you)</span> : null}
          </p>
          {subtitle ? <p className="text-fg/70 text-xs">{subtitle}</p> : null}
          {pills ? <div className="flex items-center gap-1.5 flex-wrap mt-1">{pills}</div> : null}
        </div>

        {action !== undefined && <div className={`${actionClassName} shrink-0 flex justify-center`}>{action}</div>}
        {primary !== undefined && <span className="font-black text-fg text-sm shrink-0 w-8 text-right">{primary}</span>}
        {trailing !== undefined && <span className="shrink-0 w-7 flex justify-center">{trailing}</span>}

        {hasDrawer && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={`player-card-${id}`}
            aria-label={`Stats for ${displayName}`}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center"
          >
            <ChevronDown className={`w-4 h-4 text-fg/70 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {hasDrawer && (
        <DrawerLayout
          id={`player-card-${id}`}
          open={open}
          pills={expandedPills}
          stats={stats}
          indent={rank !== undefined}
        >
          {children}
        </DrawerLayout>
      )}
    </div>
  );
};
