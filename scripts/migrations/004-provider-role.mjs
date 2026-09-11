import { createMigrationDb, parseMigrationArgs } from './lib/cli.mjs';
import { migrateProviderRoles } from '../lib/provider-role.mjs';

const options = parseMigrationArgs(process.argv.slice(2));
if (options.help) {
  console.log(
    'Usage: node scripts/migrations/004-provider-role.mjs --project <id> --key <serviceAccount.json> [--apply]',
  );
  process.exit(0);
}

const report = await migrateProviderRoles(createMigrationDb(options), options);
Object.entries(report).forEach(([key, value]) => {
  if (key !== 'updates') console.log(`${key}: ${value}`);
});
