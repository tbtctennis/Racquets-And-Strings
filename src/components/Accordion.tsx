import React from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/cn';

// Collapsible card section — extracted from the Tasks page's inline `Section` so brackets,
// RR groups, and profile sections share one pattern. Controlled: the parent owns open state,
// which supports both single-open (accordion) and independently-open groups.
export const Accordion: React.FC<{
  id: string;
  title: React.ReactNode;
  right?: React.ReactNode | undefined;
  open: boolean;
  onToggle: (id: string) => void;
  locked?: boolean | undefined;
  highlight?: boolean | undefined; // clay border — "this is the live/current section"
  /** `amber` is the organizer-queue tone (ReviewPanel). */
  tone?: 'default' | 'amber' | undefined;
  className?: string | undefined;
  titleClassName?: string | undefined;
  bodyClassName?: string | undefined;
  children: React.ReactNode;
}> = ({
  id,
  title,
  right,
  open,
  onToggle,
  locked,
  highlight,
  tone = 'default',
  className,
  titleClassName = 'font-bold text-sm',
  bodyClassName = 'mt-2',
  children,
}) => (
  <div
    className={cn(
      'rounded-3xl border',
      locked
        ? 'bg-tennis-surface/15 border-fg/5'
        : tone === 'amber'
          ? 'bg-amber-500/5 border-amber-500/20'
          : highlight
            ? 'bg-tennis-surface/30 border-clay/40'
            : 'bg-tennis-surface/30 border-fg/5',
      className,
    )}
  >
    <button
      type="button"
      onClick={() => onToggle(id)}
      disabled={locked}
      className="w-full min-h-11 flex items-center justify-between gap-3 px-4 py-3 text-left"
      aria-expanded={open}
    >
      <h2 className={cn(titleClassName, locked ? 'text-fg/70' : tone === 'amber' ? 'text-badge' : 'text-fg')}>
        {title}
      </h2>
      <span className="flex items-center gap-2 shrink-0">
        {right}
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            tone === 'amber' ? 'text-badge' : 'text-fg/70',
            open && 'rotate-180',
          )}
        />
      </span>
    </button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={cn('px-4 pb-4', bodyClassName)}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
