import React from 'react';
import { cn } from '../lib/cn';
import { initialOf } from '../utils/nameFormatting';

const sizeClasses = {
  row: {
    frame: 'h-6 w-6',
    text: 'text-xs',
  },
  profile: {
    frame: 'h-24 w-24',
    text: 'text-4xl',
  },
} as const;

export type AvatarSize = keyof typeof sizeClasses;

export type AvatarProps = {
  name: string;
  src?: string | undefined;
  size?: AvatarSize | undefined;
  alt?: string | undefined;
  className?: string | undefined;
  onError?: (() => void) | undefined;
};

/** The only person avatar primitive: 24px in rows and 96px on profile cards. */
export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'row', alt = '', className, onError }) => {
  const styles = sizeClasses[size];
  const frameClass = cn(styles.frame, 'shrink-0 rounded-full object-cover', className);

  return src ? (
    <img src={src} alt={alt} className={frameClass} referrerPolicy="no-referrer" onError={onError} />
  ) : (
    <span
      aria-label={alt || undefined}
      className={cn(
        styles.frame,
        'flex shrink-0 items-center justify-center rounded-full bg-clay/15 font-black text-clay-fg',
        styles.text,
        className,
      )}
    >
      {initialOf(name)}
    </span>
  );
};
