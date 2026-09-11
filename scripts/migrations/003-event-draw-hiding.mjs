import { createMigrationDb, parseMigrationArgs } from './lib/cli.mjs';
import { stripEventDrawHiding } from '../lib/event-draw-hiding.mjs';

const options = parseMigrationArgs(process.argv.slice(2));
if (options.help) {
  console.log(
    'Usage: node scripts/migrations/003-event-draw-hiding.mjs --project <id> --key <serviceAccount.json> [--apply]',
  );
  process.exit(0);
}

const report = await stripEventDrawHiding(createMigrationDb(options), options);
Object.entries(report).forEach(([key, value]) => {
  if (key !== 'updates') console.log(`${key}: ${value}`);
});
