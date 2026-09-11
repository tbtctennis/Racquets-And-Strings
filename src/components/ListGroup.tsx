import React, { useId } from 'react';
import { cn } from '../lib/cn';

type ListGroupProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  count?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
};

/** Shared surface for a stack of ListRow elements. */
export const ListGroup: React.FC<ListGroupProps> = ({ title, description, count, children, className, labelledBy }) => {
  const generatedTitleId = useId();
  const titleId = labelledBy ?? generatedTitleId;

  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={cn('overflow-hidden rounded-2xl border border-fg/10 bg-tennis-surface/40', className)}
    >
      {title || count !== undefined || description ? (
        <header className="border-b border-fg/10 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {title ? (
              <h2 id={titleId} className="min-w-0 truncate text-sm font-black text-fg">
                {title}
              </h2>
            ) : (
              <span />
            )}
            {count !== undefined ? (
              <span className="shrink-0 text-xs font-bold tabular-nums text-fg/70">{count}</span>
            ) : null}
          </div>
          {description ? <p className="mt-1 truncate text-xs text-fg/70">{description}</p> : null}
        </header>
      ) : null}
      <div>{children}</div>
    </section>
  );
};
