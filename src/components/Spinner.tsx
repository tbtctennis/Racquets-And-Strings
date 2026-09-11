import React from 'react';
import { clsx } from 'clsx';

const SIZE_CLASS = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-14 w-14 border-4',
} as const;

const TONE_CLASS = {
  clay: 'border-clay',
  current: 'border-current',
} as const;

export type SpinnerSize = keyof typeof SIZE_CLASS;
export type SpinnerTone = keyof typeof TONE_CLASS;

export type SpinnerProps = {
  size?: SpinnerSize;
  /** `clay` on page surfaces; `current` inherits the surrounding text colour (buttons). */
  tone?: SpinnerTone;
  label?: string;
  className?: string;
  'aria-hidden'?: boolean;
};

/** Indeterminate loading ring. Replaces the clay CSS ring and lucide `Loader2`.
 *  `clsx` only — twMerge treats `border-clay` and `border-t-transparent` as the same group. */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'lg',
  tone = 'clay',
  label = 'Loading',
  className,
  'aria-hidden': ariaHidden,
}) => (
  <div
    data-spinner={size}
    role={ariaHidden ? undefined : 'status'}
    aria-live={ariaHidden ? undefined : 'polite'}
    aria-hidden={ariaHidden}
    className={clsx(
      'inline-block shrink-0 animate-spin rounded-full border-t-transparent motion-reduce:animate-none',
      SIZE_CLASS[size],
      TONE_CLASS[tone],
      className,
    )}
  >
    {ariaHidden ? null : <span className="sr-only">{label}</span>}
  </div>
);
