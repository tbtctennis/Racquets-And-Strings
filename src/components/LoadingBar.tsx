import React from 'react';

// Shared loading overlay: dark backdrop, label, slim bar. Originated on the Courts page
// (CourtMap.tsx). Page-load is indeterminate — staged literals are not measurements. A leftover
// `progress` prop is accepted so existing callers typecheck, but it is never shown.
export const LoadingBar: React.FC<{
  label: string;
  progress?: number;
  className?: string;
}> = ({ label, className }) => (
  <div
    className={className ?? 'absolute inset-0 z-20 bg-tennis-dark flex flex-col items-center justify-center gap-4'}
    aria-busy="true"
  >
    <p className="text-fg font-semibold text-sm tracking-wide">{label}</p>
    <div className="w-56 h-1.5 bg-fg/10 rounded-full overflow-hidden" role="progressbar" aria-label={label}>
      <div className="h-full w-1/3 bg-clay rounded-full animate-pulse" />
    </div>
  </div>
);
