import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { courtKey } from '../../src/utils/courtKey.ts';
import { zoneFromCourts } from '../../src/utils/zones.ts';
import {
  COURT_RESOLUTION_AUDIT_COLLECTION,
  COURT_RESOLUTIONS_COLLECTION,
  courtResolutionZoneMap,
} from '../../src/features/courts/resolution.ts';

const load = (rel) => readFile(new URL(rel, import.meta.url), 'utf8');

test('runtime overlay resolves a court zone without shipped coordinates', () => {
  const coords = new Map();
  const runtime = courtResolutionZoneMap([
    {
      court_key: 'new-park-tennis',
      name: 'New Park Tennis',
      zone: 'Etobicoke',
      created_by: 'admin',
      created_at: '2026-09-11T12:00:00.000Z',
      updated_by: 'admin',
      updated_at: '2026-09-11T12:00:00.000Z',
    },
  ]);

  assert.equal(zoneFromCourts(['New Park Tennis'], coords), '');
  assert.equal(zoneFromCourts(['New Park Tennis'], coords, runtime), 'Etobicoke');
  assert.equal(runtime.get(courtKey('New Park Tennis')), 'Etobicoke');
});

test('runtime overlay wins over geo-derived zone without editing the shipped CSV', () => {
  const coords = new Map([['ramsden park', { lat: 43.6708, lng: -79.393 }]]);
  const runtime = new Map([['ramsden park', 'North York']]);
  assert.equal(zoneFromCourts(['Ramsden Park'], coords), 'Downtown - Midtown');
  assert.equal(zoneFromCourts(['Ramsden Park'], coords, runtime), 'North York');
});

test('admin Tasks surface adds a court, assigns a zone, and shows the audit trail', async () => {
  const panel = await load('../../src/features/courts/CourtResolutionPanel.tsx');
  const tasks = await load('../../src/pages/Tasks.tsx');
  const service = await load('../../src/features/courts/courtResolutionService.ts');
  const resolution = await load('../../src/features/courts/resolution.ts');
  const rules = await load('../../firestore.rules');

  assert.match(panel, /resolveCourtZone/);
  assert.match(panel, /Court name/);
  assert.match(panel, /Audit/);
  assert.match(tasks, /CourtResolutionPanel/);
  assert.match(service, /httpsCallable\(functions, 'resolveCourtZone'\)/);
  assert.match(resolution, new RegExp(`'${COURT_RESOLUTIONS_COLLECTION}'`));
  assert.match(resolution, new RegExp(`'${COURT_RESOLUTION_AUDIT_COLLECTION}'`));
  assert.match(rules, /match \/court_resolutions\/\{courtKey\}/);
  assert.match(rules, /match \/court_resolution_audit\/\{id\}/);
  assert.match(rules, /allow write: if false/);
});
