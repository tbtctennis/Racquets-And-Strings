import React from 'react';

export const Switch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean | undefined;
}> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay disabled:opacity-50"
  >
    <span className={`relative h-6 w-10 rounded-full transition-colors ${checked ? 'bg-clay' : 'bg-fg/20'}`}>
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'left-5' : 'left-1'}`}
      />
    </span>
  </button>
);
