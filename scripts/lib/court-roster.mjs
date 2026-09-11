/**
 * Authoritative court roster derived from the shipped CSV.
 *
 * Canonical source: public/Tennis Courts Facilities - 4326.csv (Q-12 / CS-39).
 * Derived: functions/courts.json and src/utils/zoneCourtCounts.ts.
 * Runtime court_resolutions overlay zones without editing the CSV.
 */
import { parseCourts } from '../../src/features/courts/csv.ts';
import { ZONE_NAMES } from '../../src/utils/zones.ts';

export const SHIPPED_COURT_CSV = 'public/Tennis Courts Facilities - 4326.csv';
export const COURTS_JSON = 'functions/courts.json';
export const ZONE_COURT_COUNTS_TS = 'src/utils/zoneCourtCounts.ts';

const emptyCounts = () => Object.fromEntries(ZONE_NAMES.map((zone) => [zone, { courts: 0, sites: 0 }]));

const ident = (zone) => (/[^A-Za-z0-9_$]/.test(zone) ? `'${zone}'` : zone);

export function buildCourtRoster(csvText) {
  const courts = parseCourts(csvText);
  const roster = {};
  const counts = emptyCounts();
  for (const court of courts) {
    if (!court.key) {
      throw new Error(`court roster drifted: empty key for ${court.dropdown || court.name || '(unnamed)'}`);
    }
    if (roster[court.key]) {
      throw new Error(`court roster drifted: duplicate key ${court.key}`);
    }
    if (!ZONE_NAMES.includes(court.zone)) {
      throw new Error(`court roster drifted: unknown zone ${court.zone} for ${court.key}`);
    }
    roster[court.key] = court.zone;
    counts[court.zone].sites += 1;
    counts[court.zone].courts += court.numCourts;
  }
  const siteCount = courts.length;
  const keyCount = Object.keys(roster).length;
  if (siteCount !== keyCount) {
    throw new Error(`court roster drifted: ${keyCount} keys vs ${siteCount} CSV sites`);
  }
  return { courts, roster, counts, siteCount, keyCount };
}

export function renderCourtsJson(roster) {
  return `${JSON.stringify(roster, null, 2)}\n`;
}

export function renderZoneCourtCounts(counts, { siteCount, surfaceCount }) {
  const body = ZONE_NAMES.map((zone) => {
    const { courts, sites } = counts[zone];
    return `  ${ident(zone)}: { courts: ${courts}, sites: ${sites} },`;
  }).join('\n');
  return `import { ZoneName } from './zones';

/**
 * Courts and sites per zone, shown to players when they pick a zone to move to — the number of
 * courts is the practical reason to prefer one zone over another.
 *
 * Generated from \`${SHIPPED_COURT_CSV}\` by \`scripts/build-court-roster.mjs\`. Do not edit by
 * hand. Coverage denominators use \`.sites\` (CSV rows), never \`.courts\` (playing surfaces).
 * Last generated: ${surfaceCount} courts across ${siteCount} sites.
 */
export const ZONE_COURT_COUNTS: Record<ZoneName, { courts: number; sites: number }> = {
${body}
};

export const totalCourtsIn = (zone: string): number => ZONE_COURT_COUNTS[zone as ZoneName]?.courts ?? 0;
`;
}

export function assertRosterInSync({ csvText, courtsJson, zoneCourtCounts }) {
  const built = buildCourtRoster(csvText);
  const jsonKeys = Object.keys(courtsJson);
  if (jsonKeys.length !== built.keyCount) {
    throw new Error(`court roster drifted: courts.json has ${jsonKeys.length} keys vs ${built.keyCount} CSV sites`);
  }
  for (const [key, zone] of Object.entries(built.roster)) {
    if (courtsJson[key] !== zone) {
      throw new Error(`court roster drifted: courts.json ${key} is ${courtsJson[key] ?? '(missing)'} vs CSV ${zone}`);
    }
  }
  for (const key of jsonKeys) {
    if (!built.roster[key]) {
      throw new Error(`court roster drifted: courts.json has extra key ${key}`);
    }
  }
  let sitesSum = 0;
  let courtsSum = 0;
  for (const zone of ZONE_NAMES) {
    const expected = built.counts[zone];
    const actual = zoneCourtCounts[zone];
    if (!actual) {
      throw new Error(`court roster drifted: ZONE_COURT_COUNTS missing ${zone}`);
    }
    if (actual.sites !== expected.sites || actual.courts !== expected.courts) {
      throw new Error(
        `court roster drifted: ${zone} is ${actual.courts} courts / ${actual.sites} sites vs CSV ${expected.courts} / ${expected.sites}`,
      );
    }
    sitesSum += actual.sites;
    courtsSum += actual.courts;
  }
  if (sitesSum !== built.siteCount) {
    throw new Error(`court roster drifted: ZONE_COURT_COUNTS sites sum ${sitesSum} vs ${built.siteCount} CSV sites`);
  }
  const expectedSurfaces = Object.values(built.counts).reduce((sum, row) => sum + row.courts, 0);
  if (courtsSum !== expectedSurfaces) {
    throw new Error(`court roster drifted: ZONE_COURT_COUNTS courts sum ${courtsSum} vs CSV ${expectedSurfaces}`);
  }
  return built;
}
