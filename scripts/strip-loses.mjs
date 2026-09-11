/**
 * Removes the retired `loses` field from stats documents.
 *
 * Dry-run is the default. Review the listed diff, then re-run with --apply.
 * Usage:
 *   node scripts/strip-loses.mjs --project rands-staging --key serviceAccount.json
 *   node scripts/strip-loses.mjs --project rands-staging --key serviceAccount.json --apply
 *
 * Production additionally requires the migration confirmation triple.
 */
import { createMigrationDb, parseMigrationArgs } from './migrations/lib/cli.mjs';
import { stripLoses } from './lib/strip-loses.mjs';

const options = parseMigrationArgs(process.argv.slice(2));
if (options.help) {
  console.log('Usage: node scripts/strip-loses.mjs --project <id> --key <serviceAccount.json> [--apply]');
  process.exit(0);
}

const db = createMigrationDb(options);
const report = await stripLoses(db, { dryRun: options.dryRun });

console.log(
  `${report.scanned} stats scanned · ${report.eligible} ${options.dryRun ? 'would be ' : ''}stripped · ${report.skipped} already clean`,
);
if (options.dryRun) console.log('Dry run only — review this diff, then re-run with --apply to write it.');
