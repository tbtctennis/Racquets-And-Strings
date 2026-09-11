import React from 'react';
import { cn } from '../lib/cn';
import { FieldError } from './FieldError';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: React.ReactNode;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

/** One field chrome: 44px control, 16px value, clay focus, badge-loss error. */
export const field =
  'w-full min-h-11 rounded-2xl bg-tennis-surface/50 border border-fg/25 px-4 py-2.5 text-base text-fg placeholder-fg/70 transition-all duration-motion focus:border-clay focus:ring-2 focus:ring-clay/20 outline-none';
export const fieldLabelCls = 'block text-xs font-bold uppercase tracking-widest text-fg/70 mb-1.5';
export const fieldHintCls = 'text-xs text-fg/70';
export const fieldRequiredCls = 'text-clay-fg ml-0.5';
export const fieldErrorBorderCls = 'border-badge-loss focus:border-badge-loss focus:ring-badge-loss/20';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, required, startAdornment, endAdornment, id, ...props },
  ref,
) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className={fieldLabelCls}>
          {label}
          {required && <span className={fieldRequiredCls}>*</span>}
        </label>
      )}
      <div className="relative">
        {startAdornment && <span className="absolute left-3 top-1/2 -translate-y-1/2">{startAdornment}</span>}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            field,
            startAdornment && 'pl-10',
            endAdornment && 'pr-10',
            error && fieldErrorBorderCls,
            className,
          )}
          {...props}
        />
        {endAdornment && <span className="absolute right-3 top-1/2 -translate-y-1/2">{endAdornment}</span>}
      </div>
      {hint ? (
        <p id={hintId} className={fieldHintCls}>
          {hint}
        </p>
      ) : null}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
});
