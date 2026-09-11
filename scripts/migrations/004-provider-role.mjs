import { createMigrationDb, finalizeMigration, parseMigrationArgs, printReport } from './lib/cli.mjs';
import { migrateProviderRoles } from '../lib/provider-role.mjs';

const options = parseMigrationArgs(process.argv.slice(2));
if (options.help) {
  console.log(
    'Usage: node scripts/migrations/004-provider-role.mjs --project <id> --key <serviceAccount.json> [--apply]',
  );
  process.exit(0);
}

const db = createMigrationDb(options);
printReport(await finalizeMigration(db, await migrateProviderRoles(db, options), options), options);
