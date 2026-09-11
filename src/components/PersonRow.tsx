import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';
import { compactPersonName, formatPersonName } from '../utils/nameFormatting';
import { Avatar } from './Avatar';

export { compactPersonName, formatPersonName, initialOf } from '../utils/nameFormatting';

const densityClasses = {
  compact: 'h-10',
  default: 'h-[57px]',
  comfortable: 'h-[84px]',
} as const;

export type PersonRowDensity = keyof typeof densityClasses;

/** Positive integers only. Unseeded, zero, and invalid values render nothing — never `(0)`. */
export const seedNumber = (seed?: number): number | undefined =>
  typeof seed === 'number' && Number.isInteger(seed) && seed > 0 ? seed : undefined;

export const seedForUid = (
  uid: string | undefined,
  players: ReadonlyArray<{ uid: string; seed?: number }>,
): number | undefined => {
  if (!uid) return undefined;
  return seedNumber(players.find((player) => player.uid === uid)?.seed);
};

export const SeedBadge: React.FC<{ seed?: number; className?: string }> = ({ seed, className }) => {
  const displaySeed = seedNumber(seed);
  if (displaySeed === undefined) return null;
  return (
    <span aria-label={`Seed ${displaySeed}`} className={cn('mr-1 shrink-0 text-fg/70', className)}>
      ({displaySeed})
    </span>
  );
};

export const PersonRow: React.FC<{
  name: string;
  seed?: number;
  subtitle?: React.ReactNode;
  avatar?: string;
  zone?: React.ReactNode;
  editControls?: React.ReactNode;
  action?: React.ReactNode;
  density?: PersonRowDensity;
  className?: string;
  /** When set, the name opens that member profile. Empty / sentinel uids stay plain text. */
  nameHref?: string;
  /** Expands the identity block; edit controls stay outside this button. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  'aria-expanded'?: boolean;
}> = ({
  name,
  seed,
  subtitle,
  avatar,
  zone,
  editControls,
  action,
  density = 'default',
  className,
  nameHref,
  onClick,
  'aria-expanded': ariaExpanded,
}) => {
  const fullName = formatPersonName(name);
  const identityClassName = 'flex min-w-[40%] flex-1 items-center gap-3 overflow-hidden';
  const nameLabel = nameHref ? (
    <Link
      to={nameHref}
      className="hover:text-clay-fg transition-colors pointer-events-auto"
      onClick={(event) => event.stopPropagation()}
    >
      {compactPersonName(name)}
    </Link>
  ) : (
    compactPersonName(name)
  );
  const identity = (
    <>
      <Avatar src={avatar} name={name} size="row" />
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="truncate whitespace-nowrap text-sm font-bold text-fg" title={fullName}>
          <SeedBadge seed={seed} />
          {nameLabel}
        </p>
        {subtitle && <p className="truncate whitespace-nowrap text-xs text-fg/70">{subtitle}</p>}
      </div>
    </>
  );
  const expandIdentity = onClick && nameHref;
  return (
    <div
      data-density={density}
      className={cn('flex min-w-0 items-center gap-3 border-b border-fg/10', densityClasses[density], className)}
    >
      {onClick && !nameHref ? (
        <button
          type="button"
          onClick={onClick}
          aria-expanded={ariaExpanded}
          className={cn(identityClassName, 'text-left hover:bg-fg/[0.03]')}
        >
          {identity}
        </button>
      ) : expandIdentity ? (
        <div className={cn(identityClassName, 'relative')}>
          <button
            type="button"
            onClick={onClick}
            aria-expanded={ariaExpanded}
            aria-label={`Details for ${fullName}`}
            className="absolute inset-0 z-0 text-left hover:bg-fg/[0.03]"
          />
          <div className="relative z-10 pointer-events-none flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
            {identity}
          </div>
        </div>
      ) : (
        <div className={identityClassName}>{identity}</div>
      )}
      {editControls && (
        <div data-slot="edit-controls" className="flex shrink-0 items-center gap-2">
          {editControls}
        </div>
      )}
      {zone && <span className="shrink-0 text-xs text-fg/70">{zone}</span>}
      {action && <div className="flex w-[78px] shrink-0 justify-end">{action}</div>}
    </div>
  );
};
