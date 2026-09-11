import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';
import { field, fieldLabelCls, fieldRequiredCls } from './Input';
import { popoverRowClassName } from './Popover';
import { Sheet } from './Sheet';

export type SelectSheetOption = { value: string; label: string };

export type SelectSheetProps = {
  /** Visible field label and the modal heading. */
  label: string;
  value: string;
  options: readonly SelectSheetOption[];
  onChange: (value: string) => void;
  /** Trigger text when nothing is selected. Not added as a choice. */
  placeholder?: string;
  /** Extra empty-value choice shown at the top of the modal. */
  emptyLabel?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  /** Extra classes on the trigger button. */
  className?: string;
  /** Extra classes on the outer wrap. */
  wrapperClassName?: string;
  /** Hide the field label. The trigger and modal still use `label` as the accessible name. */
  hideLabel?: boolean;
};

/**
 * Native dropdown replacement: a labelled trigger that opens a modal form of 44px choices.
 * The heading is the accessible name, which closes the unlabelled-select findings.
 */
export const SelectSheet: React.FC<SelectSheetProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder,
  emptyLabel,
  disabled,
  required,
  id,
  className,
  wrapperClassName,
  hideLabel,
}) => {
  const [open, setOpen] = useState(false);
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const selected = options.find((option) => option.value === value);
  const fallback = value === '' ? (emptyLabel ?? placeholder ?? '') : value;
  const display = selected?.label || fallback || placeholder || emptyLabel || label;

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div className={cn(hideLabel ? 'min-w-0' : 'w-full', wrapperClassName)}>
      {!hideLabel && (
        <label htmlFor={triggerId} className={fieldLabelCls}>
          {label}
          {required && <span className={fieldRequiredCls}>*</span>}
        </label>
      )}
      <button
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen(true)}
        className={cn(field, 'flex items-center justify-between gap-2 text-left', className)}
      >
        <span className="min-w-0 truncate">{display}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-fg/70" aria-hidden />
      </button>
      {open && (
        <Sheet onClose={() => setOpen(false)} title={label}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
            }}
            className="space-y-1"
          >
            {emptyLabel != null && (
              <SelectSheetChoice selected={value === ''} onSelect={() => choose('')}>
                {emptyLabel}
              </SelectSheetChoice>
            )}
            {options.map((option) => (
              <SelectSheetChoice
                key={option.value}
                selected={option.value === value}
                onSelect={() => choose(option.value)}
              >
                {option.label}
              </SelectSheetChoice>
            ))}
          </form>
        </Sheet>
      )}
    </div>
  );
};

const SelectSheetChoice: React.FC<{
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}> = ({ selected, onSelect, children }) => (
  <button
    type="button"
    role="option"
    aria-selected={selected}
    onClick={onSelect}
    className={cn(
      'flex w-full items-center text-left text-sm font-semibold text-fg transition-colors hover:bg-clay/20',
      popoverRowClassName,
      selected && 'bg-clay/15',
    )}
  >
    {children}
  </button>
);
