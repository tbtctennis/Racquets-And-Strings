// Generate functions/courts.json and src/utils/zoneCourtCounts.ts from the shipped court CSV.
//
// The CSV is the canonical roster (Q-12). Run after the CSV or zone boundaries change:
//   node --import tsx scripts/build-court-roster.mjs
// Unit tests fail if the committed derived files drift from the CSV.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  SHIPPED_COURT_CSV,
  COURTS_JSON,
  ZONE_COURT_COUNTS_TS,
  buildCourtRoster,
  renderCourtsJson,
  renderZoneCourtCounts,
} from './lib/court-roster.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const csvPath = path.join(root, SHIPPED_COURT_CSV);
const csvText = readFileSync(csvPath, 'utf8');
const { roster, counts, siteCount, keyCount } = buildCourtRoster(csvText);
const surfaceCount = Object.values(counts).reduce((sum, row) => sum + row.courts, 0);

const jsonPath = path.join(root, COURTS_JSON);
const countsPath = path.join(root, ZONE_COURT_COUNTS_TS);
writeFileSync(jsonPath, renderCourtsJson(roster));
writeFileSync(countsPath, renderZoneCourtCounts(counts, { siteCount, surfaceCount }));

console.log(`[build-court-roster] ${SHIPPED_COURT_CSV}: ${siteCount} sites → ${keyCount} keys, ${surfaceCount} courts`);
console.log(`[build-court-roster] wrote ${COURTS_JSON}`);
console.log(`[build-court-roster] wrote ${ZONE_COURT_COUNTS_TS}`);
