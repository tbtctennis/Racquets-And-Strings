import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';
import { memberProfileHref } from '../features/members/memberProfileHref';
import { compactPersonName, formatPersonName } from '../utils/nameFormatting';
import { SeedBadge } from './PersonRow';

/** The small amount of identity a pair row needs; the uid is optional for display-only pairs. */
export type PersonPairMember = {
  uid?: string | undefined;
  name: string;
  seed?: number | undefined;
};

export type PersonPairRowProps = {
  player1: PersonPairMember;
  player2: PersonPairMember;
  /** The winning member's uid. The value is ignored when either member has no uid. */
  winnerId?: string | undefined;
  /** A score, status, or other supporting detail shown below the pair. */
  meta?: React.ReactNode | undefined;
  /** A score, approve action, or other trailing control. */
  action?: React.ReactNode | undefined;
  density?: 'compact' | 'default' | 'comfortable' | undefined;
  className?: string | undefined;
};

const paddingByDensity = {
  compact: 'py-2',
  default: 'py-3',
  comfortable: 'py-4',
} as const;

/**
 * The shared presentation for a pairing and its verdict.
 *
 * Both name cells are flex items with `min-w-0`, so a long name truncates within the row instead
 * of wrapping or pushing the metadata/action slot off a 360px viewport. Names render as
 * first-plus-initial so "Annas Tariq" stays "Annas T". The action column stays fixed-width
 * wherever a consumer supplies one, matching the other shared row components.
 */
export const PersonPairRow: React.FC<PersonPairRowProps> = ({
  player1,
  player2,
  winnerId,
  meta,
  action,
  density = 'default',
  className,
}) => {
  const player1FullName = formatPersonName(player1.name);
  const player2FullName = formatPersonName(player2.name);
  const player1Name = compactPersonName(player1.name);
  const player2Name = compactPersonName(player2.name);
  const player1Won = !!winnerId && !!player1.uid && winnerId === player1.uid;
  const player2Won = !!winnerId && !!player2.uid && winnerId === player2.uid;
  const player1Href = memberProfileHref(player1.uid);
  const player2Href = memberProfileHref(player2.uid);

  return (
    <div className={cn('flex min-w-0 items-center gap-3 border-b border-fg/10', paddingByDensity[density], className)}>
      <div className="min-w-[40%] flex-1 overflow-hidden">
        <p className="flex min-w-0 items-center whitespace-nowrap text-sm text-fg">
          <span className={cn('min-w-0 flex-1 truncate', player1Won && 'font-bold')} title={player1FullName}>
            <SeedBadge seed={player1.seed} />
            {player1Href ? (
              <Link to={player1Href} className="hover:text-clay-fg transition-colors">
                {player1Name}
              </Link>
            ) : (
              player1Name
            )}
          </span>
          <span className="mx-1.5 shrink-0 text-fg/70" aria-hidden="true">
            vs
          </span>
          <span className={cn('min-w-0 flex-1 truncate', player2Won && 'font-bold')} title={player2FullName}>
            <SeedBadge seed={player2.seed} />
            {player2Href ? (
              <Link to={player2Href} className="hover:text-clay-fg transition-colors">
                {player2Name}
              </Link>
            ) : (
              player2Name
            )}
          </span>
        </p>
        {meta ? <div className="truncate whitespace-nowrap text-xs text-fg/70">{meta}</div> : null}
      </div>
      {action ? <div className="flex w-[78px] shrink-0 justify-end">{action}</div> : null}
    </div>
  );
};
