import React, { useState } from 'react';
import { Accordion } from './Accordion';
import { QueueHeading } from './QueueHeading';

export type ReviewPanelProps = {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

/** Shared collapsible chrome for organizer/admin queues that need a decision. */
export const ReviewPanel: React.FC<ReviewPanelProps> = ({
  title,
  count,
  children,
  defaultOpen = false,
  className = '',
}) => {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0) return null;
  return (
    <Accordion
      id={title}
      title={<QueueHeading title={title} count={count} />}
      open={open}
      onToggle={() => setOpen((value) => !value)}
      tone="amber"
      className={className}
      titleClassName="text-xs font-bold uppercase tracking-widest"
      bodyClassName=""
    >
      {children}
    </Accordion>
  );
};
