import { createMigrationDb, emptyReport, finalizeMigration, parseMigrationArgs, printReport } from './lib/cli.mjs';

const options = parseMigrationArgs(process.argv.slice(2));
if (options.help) {
  console.log(
    'Usage: node scripts/migrations/005-recompute-diff.mjs --project <id> --key <serviceAccount.json> [--apply]',
  );
  process.exit(0);
}

printReport(await finalizeMigration(createMigrationDb(options), emptyReport(), options), options);
