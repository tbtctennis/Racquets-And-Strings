import React from 'react';
import { cn } from '../lib/cn';

/**
 * The shared layout for groups of StatTile components.
 *
 * Two columns keep a cluster readable on a phone; three columns make the same
 * cluster compact on wider surfaces. Grid items are allowed to shrink and are
 * stretched to the same height so labels and values stay aligned when a tile
 * contains a hint or other variable-height content.
 */
export const StatGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3 [&>*]:h-full [&>*]:min-w-0', className)}>{children}</div>
);
