import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { tapScale } from '../../lib/motion';
import { controlChrome } from '../../lib/controlChrome';
import { ListGroup } from '../../components/ListGroup';
import { SelectSheet } from '../../components/SelectSheet';
import { Spinner } from '../../components/Spinner';
import {
  formatDateRange,
  formatDist,
  getProgramStatus,
  hasPublicHours,
  type CourtWithCount,
  type NearestCourt,
  type NearestProgram,
  type PickleballEntry,
} from './courtMapUtils';

// Court Locator presentation: filter controls, badges, map popup, result lists.
// Data loading lives in useCourtData.ts; parsing and geo helpers in courtMapUtils.ts.

// ─── Badges and filter controls ───────────────────────────────────────────────────────────────

const badgeClass = 'inline-block rounded-xl px-1.5 py-0.5 text-xs font-semibold tracking-wide leading-snug';

export const Badge: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={`${badgeClass} ${className}`}>{children}</span>
);

const BADGE_NEUTRAL = 'bg-fg/10 text-fg/70';
const BADGE_AMBER = 'bg-badge/15 text-badge';
const BADGE_OPEN = 'bg-map-open/20 text-fg';
const BADGE_CLAY = 'bg-clay/15 text-clay-fg';
const BADGE_WIN = 'bg-badge-win/15 text-badge-win';
const BADGE_MUTED = 'bg-fg/5 text-fg/70';

const SEL_BG = 'var(--color-tennis-deep)';

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean | undefined;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${disabled ? 'opacity-35 pointer-events-none' : ''}`}>
      <SelectSheet
        label={label}
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled}
        emptyLabel="All"
        hideLabel
        className="rounded-xl border-0 bg-tennis-deep px-2 py-1.5 text-xs"
      />
    </div>
  );
}

// Multi-select twin of FilterSelect: a checklist popover instead of a native dropdown. An empty set
// means "all", so the label falls back to `allLabel` and no filtering is applied by the caller.
export function MultiFilterSelect({
  label,
  allLabel,
  selected,
  options,
  onChange,
}: {
  label: string;
  allLabel: string;
  selected: Set<string>;
  options: { value: string; label: string }[];
  onChange: (s: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const text =
    selected.size === 0
      ? allLabel
      : options
          .filter((o) => selected.has(o.value))
          .map((o) => o.label)
          .join(', ');

  const rowCls = (on: boolean) =>
    `w-full text-left text-xs rounded-xl px-2 py-1.5 transition-colors flex items-center gap-1.5 ${controlChrome(on)}`;

  return (
    <div className="flex flex-col gap-0.5 relative">
      <span className="text-fg/70 text-xs uppercase tracking-wide">{label}</span>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        style={{ background: SEL_BG }}
        // Borderless, matching FilterSelect — the filled background carries the affordance.
        className="w-full text-left text-xs text-fg rounded-xl px-2 py-1.5 flex items-center justify-between
                   focus:outline-none focus:ring-2 focus:ring-clay/40 cursor-pointer"
      >
        <span className="truncate">{text}</span>
        <span className="text-fg/70 ml-1 text-xs shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 z-50 mt-0.5 rounded-2xl p-1 space-y-0.5
                       max-h-56 overflow-y-auto shadow-2xl border border-fg/20"
            style={{ background: SEL_BG }}
          >
            <button type="button" onClick={() => onChange(new Set())} className={rowCls(selected.size === 0)}>
              <span className="w-3 shrink-0 text-clay-fg">{selected.size === 0 ? '✓' : ''}</span>
              {allLabel}
            </button>
            {options.map((o) => {
              const on = selected.has(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    const next = new Set(selected);
                    if (on) next.delete(o.value);
                    else next.add(o.value);
                    onChange(next);
                  }}
                  className={rowCls(on)}
                >
                  <span className="w-3 shrink-0 text-clay-fg">{on ? '✓' : ''}</span>
                  <span className="truncate">{o.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const PickleballBadges = React.memo(function PickleballBadges({ entries }: { entries: PickleballEntry[] }) {
  if (!entries.length) return null;

  return (
    <>
      {entries.map((pb, idx) => {
        const suffix =
          pb.netType === 'No Net'
            ? ' · BRING OWN NET'
            : pb.netType === 'Tennis'
              ? ' · USE TENNIS COURTS'
              : pb.netType === 'Adjustable'
                ? ' · ADJUSTABLE NET'
                : '';
        const label = `PICKLEBALL ${pb.numCourts} CT${suffix}`;

        return (
          <Badge key={idx} className={BADGE_CLAY}>
            {label}
          </Badge>
        );
      })}
    </>
  );
});

// ─── Result lists ─────────────────────────────────────────────────────────────────────────────

interface CourtResultsProps {
  courts: NearestCourt[];
  totalCourts: number;
  loading: boolean;
  userCoords: { lat: number; lng: number } | null;
  membersOnly?: boolean | undefined;
  onSelectCourt: (court: CourtWithCount) => void;
  /** Drill into this court's programs. Same action as the map popup's button. */
  onViewPrograms: (court: CourtWithCount) => void;
}

// Memoized — CourtMap re-renders on every search keystroke.
export const CourtResultsList: React.FC<CourtResultsProps> = React.memo(
  ({ courts, loading, userCoords, membersOnly, onSelectCourt, onViewPrograms }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <Spinner size="sm" />
        </div>
      );
    }

    return (
      <>
        {courts.length === 0 ? (
          <p className="text-fg/70 text-sm text-center py-8">
            {membersOnly
              ? 'Showing courts with members. Switch to All Courts to see the rest.'
              : 'No courts match the current filters.'}
          </p>
        ) : (
          <ListGroup title="Courts" className="rounded-2xl" labelledBy="court-results-list">
            {courts.map((c) => (
              // The row is a div, not one big button: Book Online and Programs are real controls
              // inside it, and nesting those in a button is invalid and swallows their clicks.
              <div
                key={`${c.dropdown}-${c.lat}`}
                className="flex items-start justify-between gap-2 px-4 py-3 hover:bg-fg/10 transition-colors"
              >
                <motion.button
                  onClick={() => onSelectCourt(c)}
                  whileTap={tapScale.whileTap}
                  transition={tapScale.transition}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="font-semibold text-fg text-sm leading-snug mb-1">{c.dropdown || c.name}</p>
                  {c.address && <p className="text-fg text-xs mb-1.5">{c.address}</p>}
                  <div className="flex flex-wrap gap-1">
                    <Badge className={BADGE_NEUTRAL}>{c.courtType.toUpperCase()}</Badge>
                    {c.numCourts > 0 && <Badge className={BADGE_NEUTRAL}>{c.numCourts} CT</Badge>}
                    {c.lights && <Badge className={BADGE_AMBER}>LIGHTS</Badge>}
                    {hasPublicHours(c) && <Badge className={BADGE_OPEN}>OPEN HOURS</Badge>}
                    {c.bookingUrl && <Badge className={BADGE_CLAY}>BOOKABLE</Badge>}
                    {c.count > 0 && (
                      <Badge className={BADGE_WIN}>
                        {c.count} player{c.count !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    <PickleballBadges entries={c.pickleballEntries} />
                  </div>
                  {c.clubInfo && <p className="text-fg text-xs mt-1 leading-snug">{c.clubInfo}</p>}
                </motion.button>
                {/* Distance, then the same actions the map bubble offers, stacked beneath it. */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {userCoords && <span className="text-clay-fg font-medium text-xs">{formatDist(c.distKm)}</span>}
                  {c.bookingUrl && (
                    <a
                      href={c.bookingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-clay px-2 py-0.5 text-xs font-bold text-white hover:bg-clay-press transition-colors"
                    >
                      Book Online
                    </a>
                  )}
                  {c.hasPrograms && (
                    <button
                      type="button"
                      onClick={() => onViewPrograms(c)}
                      className="rounded-xl bg-fg/10 px-2 py-0.5 text-xs font-bold text-fg hover:bg-fg/20 transition-colors"
                    >
                      Programs
                    </button>
                  )}
                </div>
              </div>
            ))}
          </ListGroup>
        )}
      </>
    );
  },
);

interface ProgramResultsProps {
  programs: NearestProgram[];
  totalPrograms: number;
  loading: boolean;
  userCoords: { lat: number; lng: number } | null;
  status: string;
  onStatusChange: (v: string) => void;
}

const STATUS_PILLS = [
  { value: '', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'past', label: 'Past' },
];

// Memoized, same as CourtResultsList.
export const ProgramResultsList: React.FC<ProgramResultsProps> = React.memo(
  ({ programs, totalPrograms, loading, userCoords, status: statusFilter, onStatusChange }) => {
    const today = useMemo(() => new Date(), []);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <Spinner size="sm" />
        </div>
      );
    }

    return (
      <>
        {/* Programs have no filter panel of their own — the status filter lives on this header.
          No back control by design: Reset in the filter sheet is what returns you to the courts. */}
        <div className="px-4 py-2 border-b border-fg/5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-fg/70 text-xs shrink-0">
              Showing {programs.length} of {totalPrograms} programs
            </span>
            <div className="flex items-center gap-1">
              {STATUS_PILLS.map((s) => (
                <button
                  key={s.value || 'all'}
                  type="button"
                  onClick={() => onStatusChange(s.value)}
                  className={`rounded-xl px-2 py-0.5 text-xs font-bold transition-colors ${controlChrome(statusFilter === s.value)}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {programs.length === 0 ? (
          <p className="text-fg/70 text-sm text-center py-8">No programs match the current filters.</p>
        ) : (
          <ListGroup title="Programs" className="rounded-2xl" labelledBy="court-programs-list">
            {programs.map((p) => {
              const status = getProgramStatus(p.dateRange, today);
              return (
                // The program's own title leads. Showing only the location made every row at a
                // multi-program park read identically, with nothing to tell the sessions apart.
                <div key={p.courseId} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="font-semibold text-fg text-sm leading-snug min-w-0">{p.title || p.locationName}</p>
                    {p.distKm !== null && userCoords && (
                      <span className="text-clay-fg font-medium text-xs shrink-0">{formatDist(p.distKm)}</span>
                    )}
                  </div>
                  {!!p.title && <p className="text-fg/70 text-xs">{p.locationName}</p>}
                  {!!p.timeRange && <p className="text-fg text-xs mt-0.5">{p.timeRange}</p>}
                  <p className="text-fg text-xs mb-1.5">{formatDateRange(p.dateRange)}</p>
                  <div className="flex items-center justify-between gap-2">
                    {/* Days and age are pills here rather than filter controls — the panel versions
                      were removed; you read them off the row instead. */}
                    <div className="flex flex-wrap items-center gap-1 min-w-0">
                      {status === 'ongoing' && <Badge className={BADGE_WIN}>ONGOING</Badge>}
                      {status === 'upcoming' && <Badge className={BADGE_AMBER}>UPCOMING</Badge>}
                      {status === 'past' && <Badge className={BADGE_MUTED}>PAST</Badge>}
                      {!!p.days && <Badge className={BADGE_OPEN}>{p.days.toUpperCase()}</Badge>}
                      {!!p.ageRange && <Badge className={BADGE_NEUTRAL}>{p.ageRange.toUpperCase()}</Badge>}
                    </div>
                    {p.activityUrl && (
                      <a
                        href={p.activityUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 inline-flex items-center rounded-xl bg-clay px-2.5 py-1
                                  text-xs font-bold text-white hover:bg-clay-press transition-colors"
                      >
                        View Activity
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </ListGroup>
        )}
      </>
    );
  },
);
