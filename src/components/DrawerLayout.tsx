import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/cn';
import { StatGrid } from './StatGrid';

export type DrawerStat = {
  label: string;
  value: React.ReactNode;
};

/**
 * One expanded-drawer tile. Dense chrome (not StatTile) so a player row can
 * reveal four stats as a 2×2 on a phone. An odd trailing tile spans the row.
 */
export const DrawerTile: React.FC<{
  label: string;
  value: React.ReactNode;
  span?: boolean;
  className?: string;
}> = ({ label, value, span, className }) => (
  <div className={cn('flex flex-col rounded-xl bg-fg/[0.03] px-2 py-2 text-center', span && 'col-span-2', className)}>
    <div className="flex flex-1 items-center justify-center text-sm font-bold text-fg">{value}</div>
    {!!label && <p className="mt-0.5 text-xs uppercase tracking-wide text-fg/70">{label}</p>}
  </div>
);

/**
 * Shared expanded-drawer body. StatGrid owns the cluster; this layout pins two
 * columns at every breakpoint so four tiles form a 2×2 instead of a 3+1 remainder.
 */
export const DrawerLayout: React.FC<{
  id?: string;
  open: boolean;
  pills?: React.ReactNode;
  stats?: DrawerStat[];
  /** Offset the body under a leading rank column (`w-6` + `gap-3` = `pl-9`). */
  indent?: boolean;
  children?: React.ReactNode;
  className?: string;
}> = ({ id, open, pills, stats, indent = false, children, className }) => (
  <AnimatePresence initial={false}>
    {open && (
      <motion.div
        id={id}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className={cn(indent ? 'pl-9' : 'pl-0', 'space-y-2 border-t border-fg/5 pr-3 pt-1 pb-3', className)}>
          {pills ? <div className="flex flex-wrap items-center gap-1.5">{pills}</div> : null}
          {!!stats?.length && (
            <StatGrid className="sm:grid-cols-2">
              {stats.map((stat, index) => (
                <DrawerTile
                  key={index}
                  label={stat.label}
                  value={stat.value}
                  span={stats.length % 2 === 1 && index === stats.length - 1}
                />
              ))}
            </StatGrid>
          )}
          {children}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
