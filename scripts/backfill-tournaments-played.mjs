/**
 * Recomputes stats/{uid}.tournamentsPlayed from distinct tournament event participation rows.
 * Withdrawn rows still count: the member joined the event. Duplicate rows for one event count once.
 *
 * Dry-run is the default. The report is the approval artifact; re-run with --apply only after
 * reading it. Applying is idempotent and never changes any field other than tournamentsPlayed.
 *
 * Usage:
 *   node scripts/backfill-tournaments-played.mjs --project rands-staging --key serviceAccount.json
 *   node scripts/backfill-tournaments-played.mjs --project rands-staging --key serviceAccount.json --apply
 *
 * Production additionally requires the migration confirmation triple.
 */
import { createMigrationDb, parseMigrationArgs } from './migrations/lib/cli.mjs';
import { backfillTournamentsPlayed } from './lib/tournaments-played.mjs';

const options = parseMigrationArgs(process.argv.slice(2));
if (options.help) {
  console.log(
    'Usage: node scripts/backfill-tournaments-played.mjs --project <id> --key <serviceAccount.json> [--apply]',
  );
  process.exit(0);
}

const db = createMigrationDb(options);
const report = await backfillTournamentsPlayed(db, { dryRun: options.dryRun });

console.log(
  `${report.scanned} stats scanned · ${report.eligible} ${options.dryRun ? 'would be ' : ''}updated · ${report.skipped} already correct`,
);
if (options.dryRun) console.log('Dry run only — review this diff, then re-run with --apply to write it.');
