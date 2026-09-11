import { ZoneName } from './zones';

/**
 * Courts and sites per zone, shown to players when they pick a zone to move to — the number of
 * courts is the practical reason to prefer one zone over another.
 *
 * Generated from `public/Tennis Courts Facilities - 4326.csv` by `scripts/build-court-roster.mjs`. Do not edit by
 * hand. Coverage denominators use `.sites` (CSV rows), never `.courts` (playing surfaces).
 * Last generated: 580 courts across 174 sites.
 */
export const ZONE_COURT_COUNTS: Record<ZoneName, { courts: number; sites: number }> = {
  'York West': { courts: 72, sites: 28 },
  Etobicoke: { courts: 87, sites: 28 },
  'Etobicoke - Lakeshore': { courts: 72, sites: 24 },
  'North York': { courts: 118, sites: 34 },
  'Downtown - Midtown': { courts: 77, sites: 17 },
  'North Scarborough': { courts: 84, sites: 24 },
  'East York and South Scarborough': { courts: 70, sites: 19 },
};

export const totalCourtsIn = (zone: string): number => ZONE_COURT_COUNTS[zone as ZoneName]?.courts ?? 0;
