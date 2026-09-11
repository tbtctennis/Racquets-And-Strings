import React from 'react';
import { cn } from '../lib/cn';
import { compactPersonName, formatPersonName } from '../utils/nameFormatting';

export type PersonOptionVariant = 'row' | 'card';
export type PersonOptionSelectionRole = 'option' | 'radio';

export type PersonOptionProps = {
  /** The stored name to display. Empty names use the shared player fallback. */
  name: string;
  /** Supporting text such as an email, skill level, or guest status. */
  meta?: React.ReactNode;
  /** Whether this option is the current choice in its picker. */
  selected?: boolean;
  /** Called by both pointer activation and the native keyboard activation of the button. */
  onSelect: () => void;
  /** `row` is the compact 36px picker item; `card` is the 90px radio-card presentation. */
  variant?: PersonOptionVariant;
  /** Use `radio` when the parent presents cards as a radio group; rows default to listbox options. */
  selectionRole?: PersonOptionSelectionRole;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

/**
 * The shared person choice used by member pickers.
 *
 * A real button keeps Enter and Space selection available without requiring every picker to
 * duplicate keyboard handlers. The role is opt-in for radio cards because the surrounding
 * picker decides whether its collection is a listbox or a radio group.
 */
export const PersonOption: React.FC<PersonOptionProps> = ({
  name,
  meta,
  selected = false,
  onSelect,
  variant = 'row',
  selectionRole = 'option',
  disabled = false,
  ariaLabel,
  className,
}) => {
  const displayName = formatPersonName(name);
  const compactName = compactPersonName(name);
  const isCard = variant === 'card';
  const role = selectionRole;

  return (
    <button
      type="button"
      role={role}
      aria-label={ariaLabel ?? displayName}
      aria-selected={role === 'option' ? selected : undefined}
      aria-checked={role === 'radio' ? selected : undefined}
      aria-pressed={role === 'option' ? selected : undefined}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full min-w-0 items-center gap-3 text-left text-sm text-fg transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isCard
          ? cn(
              'min-h-[90px] rounded-2xl border px-4 py-3',
              selected ? 'border-clay bg-clay/15' : 'border-fg/10 bg-tennis-surface hover:border-clay/40',
            )
          : cn('min-h-9 rounded-xl px-3 py-1.5', selected ? 'bg-clay/15 font-bold' : 'bg-tennis-deep hover:bg-clay/10'),
        className,
      )}
    >
      <span className="min-w-[40%] flex-1 overflow-hidden">
        <span className="block truncate whitespace-nowrap font-semibold" title={displayName}>
          {compactName}
        </span>
        {meta ? <span className="block truncate whitespace-nowrap text-xs font-normal text-fg/70">{meta}</span> : null}
      </span>
      {selected ? (
        <span aria-hidden="true" className="shrink-0 text-clay-fg">
          ✓
        </span>
      ) : null}
    </button>
  );
};
