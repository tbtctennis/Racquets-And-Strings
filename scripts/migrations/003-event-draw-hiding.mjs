import { createMigrationDb, finalizeMigration, parseMigrationArgs, printReport } from './lib/cli.mjs';
import { stripEventDrawHiding } from '../lib/event-draw-hiding.mjs';

const options = parseMigrationArgs(process.argv.slice(2));
if (options.help) {
  console.log(
    'Usage: node scripts/migrations/003-event-draw-hiding.mjs --project <id> --key <serviceAccount.json> [--apply]',
  );
  process.exit(0);
}

const db = createMigrationDb(options);
printReport(await finalizeMigration(db, await stripEventDrawHiding(db, options), options), options);
