import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/cn';
import { tapScale } from '../lib/motion';
import { omitUndefined } from '../lib/exactOptional';
import { Spinner } from './Spinner';

interface ButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'
> {
  variant?: 'secondary' | 'outline' | 'ghost' | 'clay' | 'white' | undefined;
  size?: 'sm' | 'md' | 'lg' | undefined;
  isLoading?: boolean | undefined;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'clay',
  size = 'md',
  isLoading,
  children,
  disabled,
  ...props
}) => {
  const quiet = 'hover:bg-fg/10 text-fg';
  const variants = {
    secondary: 'bg-tennis-surface hover:bg-tennis-surface/80 text-fg border border-fg/10',
    outline: quiet,
    ghost: quiet,
    clay: 'bg-clay hover:bg-clay-press text-white shadow-lg shadow-clay/20',
    white: 'bg-white hover:bg-white/90 text-ink shadow-lg shadow-black/10',
  };

  const sizes = {
    sm: 'h-11 min-h-11 px-6 rounded-2xl text-base',
    md: 'h-11 min-h-11 px-6 rounded-2xl text-base',
    lg: 'h-11 min-h-11 px-6 rounded-2xl text-base',
  };

  return (
    <motion.button
      {...(omitUndefined({
        ...props,
        ...(disabled || isLoading ? {} : { whileTap: tapScale.whileTap }),
        ...(isLoading ? { 'aria-busy': true as const } : {}),
      }) as React.ComponentProps<typeof motion.button>)}
      transition={tapScale.transition}
      type={props.type ?? 'button'}
      className={cn(
        'inline-flex items-center justify-center rounded-2xl border border-transparent font-semibold transition-colors duration-motion disabled:cursor-not-allowed focus-visible',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={!!(disabled || isLoading)}
    >
      {isLoading ? <Spinner size="sm" tone="current" className="mr-2" aria-hidden /> : null}
      {children}
    </motion.button>
  );
};
