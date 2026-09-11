import { createMigrationDb, parseMigrationArgs, scanCollection } from './lib/cli.mjs';
import { EVENT_TYPES, normalizeEventType, planEventTypeUpdates } from '../lib/event-type-casing.mjs';

const options = parseMigrationArgs(process.argv.slice(2), { supportsPaging: true });
if (options.help) {
  console.log(
    'Usage: node scripts/migrations/002-event-type-casing.mjs --project <id> --key <serviceAccount.json> [--apply]',
  );
  process.exit(0);
}

const db = createMigrationDb(options);
const snapshot = await scanCollection(db, 'events', options);
const plan = planEventTypeUpdates(snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })));
if (plan.invalid.length) {
  throw new Error(
    `Unknown event type(s); migration refused: ${plan.invalid.map(({ id, current }) => `events/${id}=${current ?? '(missing)'}`).join(', ')}`,
  );
}

plan.updates.forEach(({ id, current, normalized }) => {
  console.log(`${options.dryRun ? '[dry-run] ' : ''}events/${id}.type: ${current} → ${normalized}`);
});

if (!options.dryRun) {
  for (let index = 0; index < plan.updates.length; index += 400) {
    const batch = db.batch();
    plan.updates.slice(index, index + 400).forEach(({ id, normalized }) => {
      batch.update(db.doc(`events/${id}`), { type: normalized });
    });
    await batch.commit();
  }
}

console.log(`scanned: ${snapshot.size}`);
console.log(`eligible: ${plan.updates.length}`);
console.log(`changed: ${options.dryRun ? 0 : plan.updates.length}`);
console.log(`skipped: ${plan.skipped}`);
console.log('failed: 0');
if (options.dryRun) console.log(`planned: ${plan.updates.length}`);
console.log(`allowed values: ${EVENT_TYPES.join(', ')}`);
console.log(`normalizer available: ${typeof normalizeEventType === 'function'}`);
