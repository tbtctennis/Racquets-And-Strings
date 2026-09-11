import { courtKey } from '../../utils/courtKey';
import { ZONE_NAMES, type ZoneName } from '../../utils/zones';

export const COURT_RESOLUTIONS_COLLECTION = 'court_resolutions';
export const COURT_RESOLUTION_AUDIT_COLLECTION = 'court_resolution_audit';

export type CourtResolution = {
  court_key: string;
  name: string;
  zone: ZoneName | string;
  lat?: number;
  lng?: number;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
};

export type CourtResolutionAudit = {
  court_key: string;
  name: string;
  actor_uid: string;
  before: { name: string; zone: string; lat: number | null; lng: number | null } | null;
  after: { name: string; zone: string; lat: number | null; lng: number | null };
  created_at: string;
};

/** Name and court-key lookups so a runtime overlay can win over the shipped roster. */
export function courtResolutionZoneMap(rows: CourtResolution[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (!row.zone) continue;
    map.set(row.court_key, row.zone);
    map.set(row.name.trim().toLowerCase(), row.zone);
  }
  return map;
}

export function courtResolutionNames(rows: CourtResolution[]): string[] {
  return rows.map((row) => row.name).filter(Boolean);
}

export function courtResolutionCoords(rows: CourtResolution[]): Map<string, { lat: number; lng: number }> {
  const map = new Map<string, { lat: number; lng: number }>();
  for (const row of rows) {
    if (!Number.isFinite(row.lat) || !Number.isFinite(row.lng) || row.lat == null || row.lng == null) continue;
    map.set(row.name.trim().toLowerCase(), { lat: row.lat, lng: row.lng });
    map.set(row.court_key, { lat: row.lat, lng: row.lng });
  }
  return map;
}

export function isCourtZoneName(value: string): value is ZoneName {
  return (ZONE_NAMES as readonly string[]).includes(value);
}

export function lookupRuntimeZone(name: string, runtimeZones: Map<string, string>): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return runtimeZones.get(trimmed.toLowerCase()) || runtimeZones.get(courtKey(trimmed)) || '';
}
