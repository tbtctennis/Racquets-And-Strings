import React from 'react';
import { cn } from '../lib/cn';
import { formatPersonName } from '../utils/nameFormatting';

export type PersonChipProps = {
  /** The stored name to display. Empty names use the same fallback as PersonRow. */
  name: string;
  /** When supplied, renders the chip's optional remove control. */
  onRemove?: () => void;
  /** Accessible label for the remove control. */
  removeLabel?: string;
  className?: string;
};

/** A compact person reference for selections and other short lists. */
export const PersonChip: React.FC<PersonChipProps> = ({ name, onRemove, removeLabel, className }) => {
  const displayName = formatPersonName(name);

  return (
    <span
      className={cn(
        'inline-flex h-[26px] max-w-full items-center gap-1.5 rounded-full bg-clay/15 px-2.5 text-xs font-bold text-fg',
        className,
      )}
    >
      <span className="truncate">{displayName}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? `Remove ${displayName}`}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-sm leading-none text-fg/70 hover:bg-clay/20 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </span>
  );
};
