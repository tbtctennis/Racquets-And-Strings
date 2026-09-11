import React from 'react';
import { cn } from '../lib/cn';

/** Height and radius copied from the element the skeleton replaces. */
const SKELETON_TARGETS = {
  row: { height: 'h-11', radius: '' },
  ListRow: { height: 'h-11', radius: '' },
  PersonRow: { height: 'h-[57px]', radius: '' },
  block: { height: 'h-40', radius: 'rounded-3xl' },
  EntityCard: { height: 'h-40', radius: 'rounded-2xl' },
} as const;

export type SkeletonAs = keyof typeof SKELETON_TARGETS;

export type SkeletonProps = {
  /** Which target shape to inherit. `row` and `block` are the CS-35 presets. */
  as?: SkeletonAs;
  /** Override the target's height utility, e.g. `h-16`. */
  height?: string;
  /** Override or supply the host's radius utility, e.g. `rounded-3xl`. */
  radius?: string;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
};

/** Loading placeholder that inherits the radius and height of its target. */
export const Skeleton: React.FC<SkeletonProps> = ({
  as = 'row',
  height,
  radius,
  className,
  'aria-label': ariaLabel = 'Loading',
  'aria-hidden': ariaHidden,
}) => {
  const target = SKELETON_TARGETS[as];
  return (
    <div
      data-skeleton={as}
      role={ariaHidden ? undefined : 'status'}
      aria-busy={ariaHidden ? undefined : true}
      aria-label={ariaHidden ? undefined : ariaLabel}
      aria-hidden={ariaHidden}
      className={cn('w-full animate-pulse bg-fg/10', height ?? target.height, radius ?? target.radius, className)}
    />
  );
};
