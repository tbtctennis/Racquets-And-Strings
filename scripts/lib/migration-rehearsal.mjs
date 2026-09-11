import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseMigrationArgs, PRODUCTION_PROJECT } from '../migrations/lib/cli.mjs';
import { EVENT_TYPES, planEventTypeUpdates } from './event-type-casing.mjs';
import { planEventDrawHidingStrips } from './event-draw-hiding.mjs';
import { planLosesStrips } from './strip-loses.mjs';
import { planProviderRoleMigration } from './provider-role.mjs';
import { planRecomputeDiff } from './recompute-diff.mjs';

export { PRODUCTION_PROJECT };
export const REHEARSAL_PROJECT = 'rands-local';
export const REHEARSAL_USAGE = [
  'Usage: node scripts/lib/migration-rehearsal.mjs --project rands-local [--out <file.json>]',
  'In-memory non-production rehearsal. Never a Firestore write. Production is refused.',
].join('\n');

const cloneSnapshot = (snapshot) => structuredClone(snapshot);

const rowById = (rows, id) => {
  const row = rows.find((entry) => entry.id === id);
  if (!row) throw new Error(`Rehearsal snapshot is missing ${id}.`);
  return row;
};

const countsEqual = (left, right) =>
  Object.keys(left).length === Object.keys(right).length && Object.keys(left).every((key) => left[key] === right[key]);

/** Synthetic non-production snapshot: legacy event types, loses, draw-hiding, leftover provider flags. */
export const nonProductionRehearsalFixture = () => ({
  events: [
    { id: 'legacy-tournament', data: { type: 'tournament', title: 'Legacy Open' } },
    { id: 'canonical', data: { type: 'Tournaments', title: 'Canonical Open' } },
    { id: 'draw-hide', data: { type: 'Socials', title: 'Hidden draw', hide_seniors: true, hide_beginners: false } },
  ],
  stats: [
    { id: 'player-a', data: { wins: 1, matchesPlayed: 1, leaguePoints26: 3, loses: 0 } },
    { id: 'player-b', data: { wins: 0, matchesPlayed: 1, leaguePoints26: 1, loses: 1 } },
    {
      id: 'player-legacy',
      data: { wins: 10, matchesPlayed: 14, leaguePoints26: 0, loses: 4, historyBaseline: 'pre-2026' },
    },
  ],
  matches: [
    {
      id: 'm1',
      data: {
        category: 'singles',
        format: 'rr',
        round: 'RR',
        status: 'complete',
        tournament_choice: 'Singles',
        division: "Men's",
        player_1_uid: 'player-a',
        player_2_uid: 'player-b',
        winner_uid: 'player-a',
        walkover: false,
        set_1_player_1: 6,
        set_1_player_2: 4,
        set_2_player_1: 6,
        set_2_player_2: 2,
        set_3_player_1: 0,
        set_3_player_2: 0,
        points_winner: 3,
        points_loser: 1,
        completed_at: '2026-06-01T12:00:00.000Z',
      },
    },
  ],
  preferences: [
    { id: 'player-a', data: { uid: 'player-a', stringer: true, stringer_id: 'karan' } },
    { id: 'player-b', data: { uid: 'player-b', preferred_zone: 'north' } },
  ],
  providers: [],
});

export const countSnapshot = (snapshot) => ({
  events: snapshot.events.length,
  stats: snapshot.stats.length,
  matches: snapshot.matches.length,
  preferences: snapshot.preferences.length,
  providers: snapshot.providers.length,
  eventTypeLegacy: snapshot.events.filter(({ data }) => data?.type && !EVENT_TYPES.includes(data.type)).length,
  statsWithLoses: snapshot.stats.filter(({ data }) => data?.loses !== undefined).length,
  drawHidingFields: snapshot.events.filter(
    ({ data }) => Object.hasOwn(data || {}, 'hide_seniors') || Object.hasOwn(data || {}, 'hide_beginners'),
  ).length,
  providersLinked: snapshot.providers.filter(({ data }) => Boolean(data?.member_uid)).length,
});

const matchRecords = (snapshot) => snapshot.matches.map(({ id, data }) => ({ id, ...(data || {}) }));

/** Replay paid awards via TASK-647 `planRecomputeDiff`. No baseline: pre-2026 counters stay authoritative. */
export const recomputeAndDiff = (snapshot) => {
  const plan = planRecomputeDiff(snapshot.stats, matchRecords(snapshot));
  return {
    ok: plan.ok,
    scanned: plan.scanned,
    replayed: plan.replayed,
    unexplained: plan.unexplained,
    diffs: plan.diffs,
    unexplainedDrift: !plan.ok,
  };
};

export const applyRehearsalPlans = (snapshot) => {
  const working = cloneSnapshot(snapshot);
  const eventType = planEventTypeUpdates(working.events);
  if (eventType.invalid.length) {
    throw new Error(
      `Unknown event type(s); rehearsal refused: ${eventType.invalid
        .map(({ id, current }) => `events/${id}=${current ?? '(missing)'}`)
        .join(', ')}`,
    );
  }
  for (const { id, normalized } of eventType.updates) {
    rowById(working.events, id).data.type = normalized;
  }

  const loses = planLosesStrips(working.stats);
  for (const { id } of loses) {
    delete rowById(working.stats, id).data.loses;
  }

  const hiding = planEventDrawHidingStrips(working.events).map(({ id, fields }) => {
    const row = rowById(working.events, id);
    const prior = Object.fromEntries(fields.map((field) => [field, row.data[field]]));
    for (const field of fields) delete row.data[field];
    return { id, fields, prior };
  });

  const provider = planProviderRoleMigration({
    preferences: working.preferences,
    providers: working.providers,
  });
  if (provider.invalid.length) {
    throw new Error(
      `Provider-role rehearsal refused: ${provider.invalid
        .map(
          ({ id, memberUid, currentMemberUid }) =>
            `providers/${id} already linked to ${currentMemberUid}, inferred ${memberUid}`,
        )
        .join('; ')}`,
    );
  }
  const priorProviders = Object.fromEntries(working.providers.map((row) => [row.id, structuredClone(row.data)]));
  for (const row of provider.updates) {
    const next = {
      id: row.id,
      name: row.name,
      roles: row.roles,
      member_uid: row.member_uid,
      ...(row.area ? { area: row.area } : {}),
    };
    const existing = working.providers.find((entry) => entry.id === row.id);
    if (existing) existing.data = { ...existing.data, ...next };
    else working.providers.push({ id: row.id, data: next });
  }

  return {
    snapshot: working,
    plans: { eventType, loses, hiding, provider, priorProviders },
  };
};

export const rollbackRehearsalPlans = (snapshot, plans) => {
  const working = cloneSnapshot(snapshot);
  for (const { id, current } of plans.eventType.updates) {
    rowById(working.events, id).data.type = current;
  }
  for (const { id, current } of plans.loses) {
    rowById(working.stats, id).data.loses = current;
  }
  for (const { id, prior } of plans.hiding) {
    Object.assign(rowById(working.events, id).data, prior);
  }
  for (const row of plans.provider.updates) {
    if (row.action === 'create') {
      working.providers = working.providers.filter((entry) => entry.id !== row.id);
      continue;
    }
    rowById(working.providers, row.id).data = structuredClone(plans.priorProviders[row.id]);
  }
  return working;
};

const compactReconciliation = (report) => ({
  ok: report.ok,
  scanned: report.scanned,
  replayed: report.replayed,
  unexplainedDrift: report.unexplainedDrift,
  unexplained: report.unexplained,
  diffs: report.diffs,
});

/** Stable JSON artifact: before/after counts, recompute-and-diff, rollback, no production action. */
export const formatRehearsalArtifact = (evidence) => ({
  task: 'TASK-651',
  legacyId: 'BLG0043',
  project: evidence.project,
  productionProject: PRODUCTION_PROJECT,
  productionAction: evidence.productionAction,
  mode: 'in-memory rands-local fixture; no Firestore writes',
  before: evidence.before,
  after: evidence.after,
  reconciliation: {
    before: compactReconciliation(evidence.reconciliation.before),
    after: compactReconciliation(evidence.reconciliation.after),
  },
  rollback: evidence.rollback,
});

export const writeRehearsalArtifact = (filePath, evidence) => {
  const json = `${JSON.stringify(formatRehearsalArtifact(evidence), null, 2)}\n`;
  writeFileSync(filePath, json);
  return json;
};

const flagValue = (argv, flag) => {
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
  return value;
};

/** In-memory rehearsal: apply, recompute-and-diff, rollback. Never a production action. */
export const rehearseNonProductionMigrations = ({ project, snapshot = nonProductionRehearsalFixture() } = {}) => {
  parseMigrationArgs(['--project', project]);
  if (project !== REHEARSAL_PROJECT) {
    throw new Error(
      project === PRODUCTION_PROJECT
        ? `Rehearsal is never a production action; refusing ${PRODUCTION_PROJECT}.`
        : `Rehearsal is emulator-only; refusing project ${project}. Use --project ${REHEARSAL_PROJECT}.`,
    );
  }
  const before = countSnapshot(snapshot);
  const beforeReconciliation = recomputeAndDiff(snapshot);
  const applied = applyRehearsalPlans(snapshot);
  const after = countSnapshot(applied.snapshot);
  const afterReconciliation = recomputeAndDiff(applied.snapshot);
  const restoredSnapshot = rollbackRehearsalPlans(applied.snapshot, applied.plans);
  const restored = countSnapshot(restoredSnapshot);
  return {
    project,
    productionAction: false,
    before,
    after,
    reconciliation: { before: beforeReconciliation, after: afterReconciliation },
    rollback: { restored: countsEqual(before, restored), after: restored },
  };
};

const main = () => {
  const argv = process.argv.slice(2);
  const args = parseMigrationArgs(argv);
  if (args.help) {
    console.log(REHEARSAL_USAGE);
    return;
  }
  if (args.apply) {
    throw new Error('Rehearsal never writes; --apply is refused.');
  }
  const evidence = rehearseNonProductionMigrations({ project: args.project });
  const json = `${JSON.stringify(formatRehearsalArtifact(evidence), null, 2)}\n`;
  const out = flagValue(argv, '--out');
  if (out) writeFileSync(path.resolve(out), json);
  else process.stdout.write(json);
};

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
