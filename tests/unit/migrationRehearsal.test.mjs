import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  PRODUCTION_PROJECT,
  REHEARSAL_PROJECT,
  applyRehearsalPlans,
  countSnapshot,
  formatRehearsalArtifact,
  nonProductionRehearsalFixture,
  recomputeAndDiff,
  rehearseNonProductionMigrations,
  rollbackRehearsalPlans,
  writeRehearsalArtifact,
} from '../../scripts/lib/migration-rehearsal.mjs';

const load = (relativePath) => readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

const BEFORE_COUNTS = {
  events: 3,
  stats: 3,
  matches: 1,
  preferences: 2,
  providers: 0,
  eventTypeLegacy: 1,
  statsWithLoses: 3,
  drawHidingFields: 1,
  providersLinked: 0,
};

const AFTER_COUNTS = {
  ...BEFORE_COUNTS,
  eventTypeLegacy: 0,
  statsWithLoses: 0,
  drawHidingFields: 0,
  providers: 1,
  providersLinked: 1,
};

test('non-production rehearsal records before/after counts, recompute-and-diff, and rollback', () => {
  const evidence = rehearseNonProductionMigrations({ project: REHEARSAL_PROJECT });

  assert.equal(evidence.project, 'rands-local');
  assert.equal(evidence.productionAction, false);
  assert.deepEqual(evidence.before, BEFORE_COUNTS);
  assert.deepEqual(evidence.after, AFTER_COUNTS);

  assert.equal(evidence.reconciliation.before.ok, true);
  assert.equal(evidence.reconciliation.after.ok, true);
  assert.equal(evidence.reconciliation.before.unexplainedDrift, false);
  assert.equal(evidence.reconciliation.after.unexplainedDrift, false);
  assert.equal(evidence.reconciliation.before.scanned, 3);
  assert.equal(evidence.reconciliation.before.replayed, 2);
  assert.deepEqual(evidence.reconciliation.before.unexplained, []);
  assert.deepEqual(evidence.reconciliation.after.unexplained, []);
  assert.deepEqual(evidence.reconciliation.after.diffs, []);

  assert.equal(evidence.rollback.restored, true);
  assert.deepEqual(evidence.rollback.after, BEFORE_COUNTS);
});

test('rollback inverts event-type, loses, draw-hiding, and provider-role writes', () => {
  const snapshot = nonProductionRehearsalFixture();
  const applied = applyRehearsalPlans(snapshot);
  assert.equal(applied.snapshot.events.find((row) => row.id === 'legacy-tournament').data.type, 'Tournaments');
  assert.equal(applied.snapshot.stats.find((row) => row.id === 'player-a').data.loses, undefined);
  assert.equal(
    Object.hasOwn(applied.snapshot.events.find((row) => row.id === 'draw-hide').data, 'hide_seniors'),
    false,
  );
  assert.equal(applied.snapshot.providers.find((row) => row.id === 'karan').data.member_uid, 'player-a');

  const restored = rollbackRehearsalPlans(applied.snapshot, applied.plans);
  assert.deepEqual(countSnapshot(restored), countSnapshot(snapshot));
  assert.equal(restored.events.find((row) => row.id === 'legacy-tournament').data.type, 'tournament');
  assert.equal(restored.stats.find((row) => row.id === 'player-a').data.loses, 0);
  assert.equal(restored.events.find((row) => row.id === 'draw-hide').data.hide_seniors, true);
  assert.deepEqual(restored.providers, []);
  assert.equal(snapshot.preferences.find((row) => row.id === 'player-a').data.stringer, true);
});

test('recompute-and-diff reports unexplained R6 drift', () => {
  const snapshot = nonProductionRehearsalFixture();
  snapshot.stats.find((row) => row.id === 'player-a').data.loses = 99;
  const diff = recomputeAndDiff(snapshot);
  assert.equal(diff.ok, false);
  assert.equal(diff.unexplainedDrift, true);
  assert.equal(diff.unexplained[0].id, 'player-a');
  assert.equal(diff.unexplained[0].field, 'loses');
  assert.equal(diff.unexplained[0].reason, 'R6');
});

test('rehearsal refuses the production project and records no production action', () => {
  assert.throws(
    () => rehearseNonProductionMigrations({ project: PRODUCTION_PROJECT }),
    /Refusing migration against production project toronto-tennis-league/,
  );
  assert.throws(
    () => rehearseNonProductionMigrations({ project: 'some-other' }),
    /Rehearsal is emulator-only; refusing project some-other/,
  );
  assert.equal(rehearseNonProductionMigrations({ project: REHEARSAL_PROJECT }).productionAction, false);
});

test('script produces the checked-in rehearsal artifact', async () => {
  const evidence = rehearseNonProductionMigrations({ project: REHEARSAL_PROJECT });
  const artifact = formatRehearsalArtifact(evidence);
  const checkedIn = JSON.parse(await load('docs/engineering/migration-rehearsal-artifact.json'));
  assert.deepEqual(artifact, checkedIn);
  assert.equal(artifact.productionAction, false);
  assert.equal(artifact.project, 'rands-local');
  assert.equal(artifact.rollback.restored, true);
  assert.equal(artifact.reconciliation.after.unexplainedDrift, false);

  const dir = await mkdtemp(path.join(tmpdir(), 'migration-rehearsal-'));
  const out = path.join(dir, 'artifact.json');
  try {
    writeRehearsalArtifact(out, evidence);
    assert.deepEqual(JSON.parse(await readFile(out, 'utf8')), checkedIn);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('environment docs record the non-production rehearsal evidence', async () => {
  const evidence = await load('docs/engineering/MIGRATION_REHEARSAL.md');
  const environments = await load('docs/architecture/ENVIRONMENTS_AND_DEPLOYMENT.md');
  const maintainability = await load('docs/engineering/MAINTAINABILITY.md');
  const runbook = await load('docs/runbooks/FIRESTORE_BACKUP_AND_RECOVERY.md');
  const local = await load('docs/engineering/LOCAL_DEVELOPMENT.md');
  const framework = await load('scripts/migrations/README.md');

  for (const doc of [evidence, environments, maintainability, runbook, local, framework]) {
    const text = doc.replace(/\s+/g, ' ');
    assert.match(text, /migration-rehearsal/i);
    assert.match(text, /before\/after counts/);
    assert.match(text, /recompute-and-diff/);
    assert.match(text, /rollback/);
    assert.match(text, /rands-local/);
    assert.match(text, /no production action|not a production action|never a production action/i);
  }
});
