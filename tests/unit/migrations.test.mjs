import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseMigrationArgs, PRODUCTION_PROJECT } from '../../scripts/migrations/lib/cli.mjs';
import { planLosesStrips, stripLoses } from '../../scripts/lib/strip-loses.mjs';
import { planTournamentPlayedUpdates, tournamentParticipationCounts } from '../../scripts/lib/tournaments-played.mjs';
import { planEventDrawHidingStrips, stripEventDrawHiding } from '../../scripts/lib/event-draw-hiding.mjs';
import {
  EVENT_TYPES,
  migrateEventTypes,
  normalizeEventType,
  planEventTypeUpdates,
} from '../../scripts/lib/event-type-casing.mjs';
import { migrateProviderRoles, planProviderRoleMigration } from '../../scripts/lib/provider-role.mjs';

test('migration arguments require an explicit project and default to dry-run', () => {
  assert.throws(() => parseMigrationArgs([]), /Missing explicit --project/);
  assert.deepEqual(parseMigrationArgs(['--project', 'rands-local']), {
    project: 'rands-local',
    key: null,
    dryRun: true,
    apply: false,
    limit: null,
    resume: null,
    help: false,
  });
});

test('migration arguments support bounded apply intent and resume cursors', () => {
  assert.deepEqual(
    parseMigrationArgs(
      ['--project', 'rands-staging', '--key', 'staging.json', '--apply', '--limit', '20', '--resume', 'user-100'],
      { supportsPaging: true },
    ),
    {
      project: 'rands-staging',
      key: 'staging.json',
      dryRun: false,
      apply: true,
      limit: 20,
      resume: 'user-100',
      help: false,
    },
  );
});

test('migration arguments reject paging flags unless the migration implements them', () => {
  assert.throws(
    () => parseMigrationArgs(['--project', 'rands-staging', '--limit', '20']),
    /--limit\/--resume are not supported/,
  );
});

test('production migration requires an explicit confirmation triple', () => {
  assert.throws(() => parseMigrationArgs(['--project', PRODUCTION_PROJECT]), /Refusing migration against production/);
});

test('loses migration plans only stats documents carrying the retired field', () => {
  assert.deepEqual(
    planLosesStrips([
      { id: 'member-a', data: { wins: 2, loses: 1 } },
      { id: 'member-b', data: { wins: 3 } },
      { id: 'member-c', data: { loses: 0 } },
    ]),
    [
      { id: 'member-a', current: 1 },
      { id: 'member-c', current: 0 },
    ],
  );
});

test('loses migration dry-run reports a diff and apply is idempotent', async () => {
  const docs = new Map([
    ['member-a', { wins: 2, loses: 1 }],
    ['member-b', { wins: 3 }],
  ]);
  const logs = [];
  const db = {
    collection: () => ({
      get: async () => ({ docs: [...docs].map(([id, data]) => ({ id, data: () => data })) }),
    }),
    doc: (path) => ({ path }),
    batch: () => {
      const updates = [];
      return {
        update: (ref, patch) => updates.push({ ref, patch }),
        commit: async () => updates.forEach(({ ref }) => delete docs.get(ref.path.split('/')[1]).loses),
      };
    },
  };

  const dryRun = await stripLoses(db, { dryRun: true, logger: { log: (line) => logs.push(line) } });
  assert.equal(dryRun.planned, 1);
  assert.deepEqual(logs, ['[dry-run] stats/member-a.loses: 1 → (removed)']);
  assert.equal(docs.get('member-a').loses, 1);

  const applied = await stripLoses(db, { dryRun: false, logger: { log() {} } });
  assert.equal(applied.changed, 1);
  assert.equal(docs.get('member-a').loses, undefined);
  assert.equal((await stripLoses(db, { dryRun: true, logger: { log() {} } })).planned, 0);
});

test('tournaments played recounts distinct tournament events, including withdrawn rows', () => {
  const events = [
    { id: 'tournament-a', data: { type: 'Tournaments' } },
    { id: 'tournament-b', data: { type: 'Tournaments' } },
    { id: 'ladder', data: { type: 'League Ladder' } },
  ];
  const participants = [
    { uid: 'member-a', event_id: 'tournament-a', status: 'active' },
    { uid: 'member-a', event_id: 'tournament-a', status: 'withdrawn' },
    { uid: 'member-a', event_id: 'tournament-b', status: 'withdrawn' },
    { uid: 'member-a', event_id: 'ladder', status: 'active' },
    { uid: 'member-b', event_id: 'ladder', status: 'active' },
  ];
  assert.deepEqual(tournamentParticipationCounts(participants, events), new Map([['member-a', 2]]));
  assert.deepEqual(
    planTournamentPlayedUpdates(
      [
        { id: 'member-a', data: { tournamentsPlayed: 1 } },
        { id: 'member-b', data: { tournamentsPlayed: 0 } },
      ],
      participants,
      events,
    ),
    [
      { id: 'member-a', current: 1, expected: 2 },
      { id: 'member-b', current: 0, expected: 0 },
    ],
  );
});

test('event type migration normalizes legacy values to the four canonical values', () => {
  assert.deepEqual(EVENT_TYPES, ['Socials', 'Tournaments', 'Specials', 'League Ladder']);
  assert.equal(normalizeEventType('tournament'), 'Tournaments');
  assert.deepEqual(
    planEventTypeUpdates([
      { id: 'lowercase', data: { type: 'tournament' } },
      { id: 'social', data: { type: 'Social' } },
      { id: 'canonical', data: { type: 'League Ladder' } },
    ]),
    {
      updates: [
        { id: 'lowercase', current: 'tournament', normalized: 'Tournaments' },
        { id: 'social', current: 'Social', normalized: 'Socials' },
      ],
      invalid: [],
      skipped: 1,
    },
  );
});

test('event type migration refuses unknown values before writing', async () => {
  const writes = [];
  const db = {
    collection: () => ({
      orderBy: () => ({
        startAfter: () => ({
          limit: () => ({ get: async () => ({ docs: [{ id: 'bad', data: () => ({ type: 'Other' }) }] }) }),
        }),
      }),
    }),
    batch: () => ({ update: (...args) => writes.push(args), commit: async () => {} }),
    doc: (path) => ({ path }),
  };
  await assert.rejects(() => migrateEventTypes(db), /Unknown event type/);
  assert.deepEqual(writes, []);
});

test('event type migration dry-run is idempotent after applying its plan', async () => {
  const docs = new Map([['legacy', { type: 'tournament' }]]);
  const db = {
    collection: () => ({
      orderBy: () => ({
        startAfter: () => ({
          limit: () => ({ get: async () => ({ docs: [...docs].map(([id, data]) => ({ id, data: () => data })) }) }),
        }),
      }),
    }),
    doc: (path) => ({ path }),
    batch: () => ({
      update: (ref, patch) => docs.set(ref.path.split('/')[1], { ...docs.get(ref.path.split('/')[1]), ...patch }),
      commit: async () => {},
    }),
  };
  const dryRun = await migrateEventTypes(db, { dryRun: true, logger: { log() {} } });
  assert.equal(dryRun.planned, 1);
  const applied = await migrateEventTypes(db, { dryRun: false, logger: { log() {} } });
  assert.equal(applied.changed, 1);
  assert.equal(docs.get('legacy').type, 'Tournaments');
  assert.equal((await migrateEventTypes(db, { dryRun: true, logger: { log() {} } })).planned, 0);
});

test('provider-role migration lifts inferred preference flags onto providers rows', () => {
  assert.deepEqual(
    planProviderRoleMigration({
      preferences: [
        { id: 'member-a', data: { uid: 'member-a', stringer: true, stringer_id: 'karan' } },
        { id: 'member-b', data: { uid: 'member-b', coach: true, coach_id: 'archie' } },
        { id: 'member-c', data: { uid: 'member-c', preferred_zone: 'north' } },
      ],
      providers: [{ id: 'archie', data: { id: 'archie', name: 'Archie', roles: ['coach'] } }],
    }),
    {
      updates: [
        {
          id: 'karan',
          name: 'karan',
          roles: ['stringer'],
          member_uid: 'member-a',
          action: 'create',
        },
        {
          id: 'archie',
          name: 'Archie',
          roles: ['coach'],
          member_uid: 'member-b',
          action: 'merge',
        },
      ],
      invalid: [],
      inferredClaims: 2,
      skippedClaims: 0,
      skipped: 1,
    },
  );
});

test('provider-role migration is idempotent and refuses a conflicting member link', async () => {
  const store = {
    preferences: new Map([
      ['member-a', { uid: 'member-a', stringer: true, stringer_id: 'karan' }],
      ['member-b', { uid: 'member-b', preferred_zone: 'north' }],
    ]),
    providers: new Map(),
  };
  const db = {
    collection: (name) => ({
      get: async () => ({ docs: [...store[name]].map(([id, data]) => ({ id, data: () => data })) }),
    }),
    doc: (path) => ({ path }),
    batch: () => ({
      set: (ref, patch) => {
        const [, id] = ref.path.split('/');
        store.providers.set(id, { ...(store.providers.get(id) || {}), ...patch });
      },
      commit: async () => {},
    }),
  };

  const dryRun = await migrateProviderRoles(db, { dryRun: true, logger: { log() {} } });
  assert.equal(dryRun.planned, 1);
  assert.equal(store.providers.size, 0);

  const applied = await migrateProviderRoles(db, { dryRun: false, logger: { log() {} } });
  assert.equal(applied.changed, 1);
  assert.equal(store.providers.get('karan').member_uid, 'member-a');
  assert.deepEqual(store.providers.get('karan').roles, ['stringer']);
  assert.equal(store.preferences.get('member-a').stringer_id, 'karan');
  assert.equal((await migrateProviderRoles(db, { dryRun: true, logger: { log() {} } })).planned, 0);

  store.preferences.set('member-c', { uid: 'member-c', stringer: true, stringer_id: 'karan' });
  await assert.rejects(() => migrateProviderRoles(db, { dryRun: true, logger: { log() {} } }), /already linked/);
});

test('event draw-hiding migration plans only retired fields and is idempotent', async () => {
  const docs = new Map([
    ['legacy', { hide_seniors: true, hide_beginners: false, title: 'Legacy' }],
    ['canonical', { title: 'Canonical' }],
  ]);
  assert.deepEqual(planEventDrawHidingStrips([...docs].map(([id, data]) => ({ id, data }))), [
    { id: 'legacy', fields: ['hide_seniors', 'hide_beginners'] },
  ]);
  const db = {
    collection: () => ({ get: async () => ({ docs: [...docs].map(([id, data]) => ({ id, data: () => data })) }) }),
    doc: (path) => ({ path }),
    batch: () => ({
      update: (ref, patch) => {
        const id = ref.path.split('/')[1];
        const next = { ...docs.get(id) };
        Object.keys(patch).forEach((field) => delete next[field]);
        docs.set(id, next);
      },
      commit: async () => {},
    }),
  };
  assert.equal((await stripEventDrawHiding(db, { dryRun: true, logger: { log() {} } })).planned, 1);
  assert.equal((await stripEventDrawHiding(db, { dryRun: false, logger: { log() {} } })).changed, 1);
  assert.deepEqual(docs.get('legacy'), { title: 'Legacy' });
  assert.equal((await stripEventDrawHiding(db, { dryRun: true, logger: { log() {} } })).planned, 0);
});
