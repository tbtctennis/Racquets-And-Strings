import React, { useCallback, useState } from 'react';
import { ConfirmSheet } from './ConfirmSheet';

type Confirmation = {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
};

/** Keeps confirmation state local to the screen while sharing one accessible sheet surface. */
export const useConfirmSheet = () => {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const close = useCallback(() => setConfirmation(null), []);
  const ask = useCallback((next: Confirmation) => setConfirmation(next), []);

  const sheet = confirmation ? (
    <ConfirmSheet
      title={confirmation.title}
      message={confirmation.message}
      confirmLabel={confirmation.confirmLabel}
      onClose={close}
      onConfirm={() => {
        close();
        void confirmation.onConfirm();
      }}
    />
  ) : null;

  return { ask, close, sheet };
};
