import React from 'react';
import { Button } from './Button';
import { Sheet } from './Sheet';

export type ConfirmSheetProps = {
  /** The visible heading for the confirmation dialog. */
  title: string;
  /** Context that explains what the member is about to confirm. */
  message: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  confirmDisabled?: boolean;
};

/**
 * Shared yes/no confirmation surface for actions that need an explicit choice.
 *
 * The surrounding Sheet owns focus management, scroll locking, and Escape-to-close.
 * Keeping confirmation as a form also makes Enter activate the affirmative action
 * when the caller is using a keyboard.
 */
export const ConfirmSheet: React.FC<ConfirmSheetProps> = ({
  title,
  message,
  onConfirm,
  onClose,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  confirmDisabled = false,
}) => {
  const disabled = isLoading || confirmDisabled;

  return (
    <Sheet onClose={onClose} title={title} maxWidthClassName="max-w-md">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled) onConfirm();
        }}
        className="space-y-5"
      >
        <div className="text-sm leading-relaxed text-fg/75">{message}</div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            {cancelLabel}
          </Button>
          <Button type="submit" disabled={disabled} isLoading={isLoading} className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Sheet>
  );
};
