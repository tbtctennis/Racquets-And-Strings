import React from 'react';
import { AvailabilityPills } from '../../components/AvailabilityPills';
import { NearbyPill } from '../../components/NearbyPill';
import { PlayerCard, type PlayerCardStat } from '../../components/PlayerCard';
import { DOUBLES_POOL_STAT_LABELS, numberPartners } from './doublesPoolStats';

export type DoublesPoolCardValues = {
  wins: number;
  pgWonPct: string;
  partners: string[];
  availabilityTags: string[];
  nearby: boolean;
};

export type DoublesPoolCardProps = {
  id: string;
  name: string;
  subtitle?: React.ReactNode;
  isYou?: boolean;
  action?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  values: DoublesPoolCardValues;
};

const EMPTY = '—';

const doublesPoolDrawerStats = (values: DoublesPoolCardValues): PlayerCardStat[] => [
  { label: DOUBLES_POOL_STAT_LABELS[0], value: `${values.wins}` },
  { label: DOUBLES_POOL_STAT_LABELS[1], value: values.pgWonPct || EMPTY },
  { label: DOUBLES_POOL_STAT_LABELS[2], value: numberPartners(values.partners) },
  {
    label: DOUBLES_POOL_STAT_LABELS[3],
    value: values.availabilityTags.length > 0 ? <AvailabilityPills tags={values.availabilityTags} /> : EMPTY,
  },
  {
    label: DOUBLES_POOL_STAT_LABELS[4],
    value: values.nearby ? <NearbyPill show={true} /> : EMPTY,
  },
];

/**
 * Expandable doubles-pool row. Reuses PlayerCard (the leaderboard drawer) with the five
 * ruled stats and no sixth.
 */
export const DoublesPoolCard: React.FC<DoublesPoolCardProps> = ({
  id,
  name,
  subtitle,
  isYou,
  action,
  open,
  onToggle,
  values,
}) => {
  const stats = doublesPoolDrawerStats(values);
  return (
    <div data-doubles-pool-card="" data-stat-count={stats.length}>
      <PlayerCard
        id={id}
        name={name}
        subtitle={subtitle}
        isYou={isYou}
        action={action}
        open={open}
        onToggle={onToggle}
        stats={stats}
      />
    </div>
  );
};
