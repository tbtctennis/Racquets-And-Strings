import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { ZONE_COURT_COUNTS } from '../../src/utils/zoneCourtCounts.ts';
import {
  SHIPPED_COURT_CSV,
  COURTS_JSON,
  ZONE_COURT_COUNTS_TS,
  assertRosterInSync,
  buildCourtRoster,
  renderCourtsJson,
  renderZoneCourtCounts,
} from '../../scripts/lib/court-roster.mjs';

const load = (rel) => readFile(new URL(rel, import.meta.url), 'utf8');

test('shipped CSV is the canonical roster and derived lists stay in sync', async () => {
  const csvText = await load(`../../${SHIPPED_COURT_CSV}`);
  const courtsJson = JSON.parse(await load(`../../${COURTS_JSON}`));
  const built = assertRosterInSync({ csvText, courtsJson, zoneCourtCounts: ZONE_COURT_COUNTS });

  assert.equal(built.siteCount, 174);
  assert.equal(built.keyCount, 174);
  assert.equal(
    Object.values(built.counts).reduce((sum, row) => sum + row.courts, 0),
    580,
  );
  assert.equal(renderCourtsJson(built.roster), await load(`../../${COURTS_JSON}`));
  assert.equal(
    renderZoneCourtCounts(built.counts, {
      siteCount: built.siteCount,
      surfaceCount: Object.values(built.counts).reduce((sum, row) => sum + row.courts, 0),
    }),
    await load(`../../${ZONE_COURT_COUNTS_TS}`),
  );
});

test('colliding CSV dropdowns become two roster keys so site counts cannot hide a court', async () => {
  const csvText = await load(`../../${SHIPPED_COURT_CSV}`);
  const { roster, counts } = buildCourtRoster(csvText);
  assert.equal(roster['parkway-valley-tennis-club'], undefined);
  assert.equal(roster['parkway-valley-tennis-club-cassandra-park'], 'North Scarborough');
  assert.equal(roster['parkway-valley-tennis-club-three-valleys-park'], 'North York');
  assert.equal(counts['North Scarborough'].sites, 24);
  assert.equal(counts['North York'].sites, 34);
});

test('validation fails when courts.json or ZONE_COURT_COUNTS drift from the CSV', async () => {
  const csvText = await load(`../../${SHIPPED_COURT_CSV}`);
  const courtsJson = JSON.parse(await load(`../../${COURTS_JSON}`));
  const missingKey = { ...courtsJson };
  delete missingKey['agincourt-tennis-club'];
  assert.throws(
    () => assertRosterInSync({ csvText, courtsJson: missingKey, zoneCourtCounts: ZONE_COURT_COUNTS }),
    /drifted/,
  );

  const driftedCounts = {
    ...ZONE_COURT_COUNTS,
    'North Scarborough': {
      courts: ZONE_COURT_COUNTS['North Scarborough'].courts,
      sites: ZONE_COURT_COUNTS['North Scarborough'].sites - 1,
    },
  };
  assert.throws(() => assertRosterInSync({ csvText, courtsJson, zoneCourtCounts: driftedCounts }), /drifted/);
});
