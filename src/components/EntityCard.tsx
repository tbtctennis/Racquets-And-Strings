import React from 'react';
import { cn } from '../lib/cn';

export type EntityCardProps = {
  media?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
  badges?: React.ReactNode;
  body?: React.ReactNode;
  pills?: React.ReactNode;
  footerMeta?: React.ReactNode;
  footerAction?: React.ReactNode;
  className?: string;
  /** Keeps the card visually muted while the entity is no longer active. */
  muted?: boolean;
};

/** Shared shell for event, marketplace, and service entities. */
export const EntityCard: React.FC<EntityCardProps> = ({
  media,
  title,
  children,
  badges,
  body,
  pills,
  footerMeta,
  footerAction,
  className,
  muted,
}) => (
  <article className={cn('rounded-2xl bg-tennis-surface/30 p-4', muted && 'opacity-55', className)}>
    {children ? (
      children
    ) : media || badges ? (
      <div className={cn('flex gap-3', media ? 'items-start' : 'items-center')}>
        {media}
        <div className="min-w-0 flex-1">{badges}</div>
      </div>
    ) : null}
    <div className={cn(media || badges ? 'mt-3' : undefined, 'min-w-0')}>
      <div className="flex min-w-0 items-start justify-between gap-3">{title}</div>
      {body ? <div className="mt-1.5">{body}</div> : null}
      {pills ? <div className="mt-3 flex flex-wrap gap-1.5">{pills}</div> : null}
    </div>
    {footerMeta || footerAction ? (
      <footer className="mt-3 flex items-center justify-between gap-2 border-t border-fg/5 pt-3">
        <div className="min-w-0 flex-1">{footerMeta}</div>
        {footerAction ? <div className="flex shrink-0 items-center gap-2">{footerAction}</div> : null}
      </footer>
    ) : null}
  </article>
);
