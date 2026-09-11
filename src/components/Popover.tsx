import React, { useEffect } from 'react';
import { cn } from '../lib/cn';
import { registerOverlay } from '../lib/overlayStack';

/** 44px picker row: 12px padding + 20px text-sm line, floored at min-h-11. */
export const popoverRowClassName = 'min-h-11 rounded-xl px-3 py-3';

export type PopoverProps = {
  onClose: () => void;
  children: React.ReactNode;
  /** When false the surface is unmounted and Escape is unregistered. Defaults to open. */
  open?: boolean;
  className?: string;
  id?: string;
  role?: React.AriaRole;
  'aria-label'?: string;
};

/**
 * Shared picker surface. Absolutely positioned so opening it does not shift the form.
 * Escape closes through the overlay stack.
 */
export const Popover: React.FC<PopoverProps> = ({
  open = true,
  onClose,
  children,
  className,
  id,
  role = 'listbox',
  'aria-label': ariaLabel,
}) => {
  useEffect(() => {
    if (!open) return;
    return registerOverlay(onClose);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      id={id}
      role={role}
      aria-label={ariaLabel}
      className={cn(
        'absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-2xl bg-tennis-deep p-1 shadow-2xl',
        className,
      )}
    >
      {children}
    </div>
  );
};

export type PopoverRowProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/** 44px row used by text pickers (courts). Person pickers pass `popoverRowClassName` to PersonOption. */
export const PopoverRow: React.FC<PopoverRowProps> = ({
  className,
  type = 'button',
  role = 'option',
  onMouseDown,
  ...props
}) => (
  <button
    type={type}
    role={role}
    onMouseDown={(event) => {
      event.preventDefault();
      onMouseDown?.(event);
    }}
    className={cn(
      'flex w-full items-center text-left text-sm font-semibold text-fg transition-colors hover:bg-clay/20 focus-visible',
      popoverRowClassName,
      className,
    )}
    {...props}
  />
);
