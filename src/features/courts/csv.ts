import { parseCsvLine } from '../../utils/csv';
import { courtKey } from '../../utils/courtKey';
import { getZone } from '../../utils/zones';
import type { CsvCourt } from './types';

type ParsedCourt = Omit<CsvCourt, 'key'>;

/** One roster key per CSV site. Colliding dropdowns are disambiguated with the park name. */
export function assignRosterKeys(courts: ParsedCourt[]): CsvCourt[] {
  const freq = new Map<string, number>();
  for (const court of courts) {
    const base = courtKey(court.dropdown);
    freq.set(base, (freq.get(base) ?? 0) + 1);
  }
  const used = new Set<string>();
  return courts.map((court) => {
    const base = courtKey(court.dropdown);
    let key = (freq.get(base) ?? 0) > 1 ? courtKey(`${court.dropdown} ${court.name}`) : base;
    if (!key || used.has(key)) {
      key = courtKey(`${court.dropdown} ${court.name} ${court.lat} ${court.lng}`);
    }
    used.add(key);
    return { ...court, key };
  });
}

/** Parse the source court export into the normalized shape used by map and task flows. */
export function parseCourts(csvText: string): CsvCourt[] {
  const [headerLine, ...lines] = csvText.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(headerLine);
  const idx = (col: string) => headers.indexOf(col);
  const iName = idx('Name'),
    iDropdown = idx('Dropdown'),
    iType = idx('Type');
  const iLights = idx('Lights'),
    iCourts = idx('Courts');
  const iAddress = idx('LocationAddress'),
    iGeom = idx('geometry');
  const iClubInfo = idx('ClubInfo');
  const iWinterPlay = idx('WinterPlay');
  const iWebsite = idx('ClubWebsite');
  const iBooking = idx('BookingUrl');

  const courts: ParsedCourt[] = [];
  for (const line of lines) {
    const cells = parseCsvLine(line);
    const geomRaw = cells[iGeom];
    if (!geomRaw) continue;
    try {
      const geom = JSON.parse(geomRaw) as { coordinates: [[number, number]] };
      const [lng, lat] = geom.coordinates[0];
      const dropdown = cells[iDropdown]?.trim() || cells[iName]?.trim() || '';
      if (!dropdown || !lat || !lng) continue;
      courts.push({
        name: cells[iName]?.trim() || dropdown,
        dropdown,
        lat,
        lng,
        address: cells[iAddress]?.trim() || '',
        courtType: cells[iType]?.trim() || '',
        numCourts: parseInt(cells[iCourts]) || 0,
        lights: cells[iLights]?.trim().toLowerCase() === 'yes',
        winterPlay: iWinterPlay >= 0 && cells[iWinterPlay]?.trim().toLowerCase() === 'yes',
        website: iWebsite >= 0 ? cells[iWebsite]?.trim() || '' : '',
        clubInfo: iClubInfo >= 0 ? cells[iClubInfo]?.trim() || '' : '',
        zone: getZone(lat, lng),
        bookingUrl: iBooking >= 0 ? cells[iBooking]?.trim() || undefined : undefined,
      });
    } catch {
      /* skip malformed */
    }
  }
  return assignRosterKeys(courts);
}
