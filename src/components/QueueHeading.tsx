import React from 'react';

export const formatQueueHeading = (title: string, count: number): string => `${title} (${count})`;

export const QueueHeading: React.FC<{
  title: string;
  count: number;
  className?: string;
}> = ({ title, count, className = '' }) =>
  className ? (
    <span className={className}>{formatQueueHeading(title, count)}</span>
  ) : (
    <>{formatQueueHeading(title, count)}</>
  );
