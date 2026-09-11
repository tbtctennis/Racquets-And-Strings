import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../lib/cn';

export type ApprovePairProps = {
  /** Called when the positive action is activated. */
  onApprove: () => void;
  /** Called when the negative action is activated. */
  onReject: () => void;
  /** Accessible name for the positive action. */
  approveLabel?: string;
  /** Accessible name for the negative action. */
  rejectLabel?: string;
  /** Disables both actions, for example while a request is in flight. */
  disabled?: boolean;
  /** Indicates that one of the actions is currently being processed. */
  busy?: boolean;
  className?: string;
};

/**
 * The shared two-action control for review rows.
 *
 * Both buttons deliberately share the same target size, spacing, and disabled behavior. Consumers
 * can provide more specific labels for actions such as confirming a result or refunding a coupon.
 */
export const ApprovePair: React.FC<ApprovePairProps> = ({
  onApprove,
  onReject,
  approveLabel = 'Approve',
  rejectLabel = 'Reject',
  disabled = false,
  busy = false,
  className,
}) => {
  const isDisabled = disabled || busy;

  const buttonClass =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className={cn('flex shrink-0 gap-2', className)} aria-busy={busy || undefined}>
      <button
        type="button"
        disabled={isDisabled}
        onClick={onApprove}
        aria-label={approveLabel}
        className={cn(buttonClass, 'bg-green-500/15 text-badge-win hover:bg-green-500/25')}
      >
        <Check className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        disabled={isDisabled}
        onClick={onReject}
        aria-label={rejectLabel}
        className={cn(buttonClass, 'bg-red-500/15 text-badge-loss hover:bg-red-500/25')}
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
};
