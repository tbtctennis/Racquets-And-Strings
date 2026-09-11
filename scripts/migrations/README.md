# Firestore migration framework

Migrations are operational tools, not application startup code. The target project must always be
named explicitly; `.firebaserc` is never used as an implicit destination.

## Safety contract

- Start with `--dry-run` (the default) and review the full report before applying anything.
- Use `--project <id>` on every invocation. A service-account `--key` must belong to that project.
- Use `--limit` for bounded pages and `--resume <document-id>` to continue a document-ID cursor.
- Applying requires `--apply`; the example migration refuses to apply because it is synthetic.
- Completion always runs recompute-and-diff (`finalizeMigration` / `completeMigration`). Unexplained
  award, R6, or baseline+replay drift refuses the run; explained stats exceptions must be named.
- Production additionally requires `--allow-production`, `ALLOW_PRODUCTION_MIGRATION=true`, and
  `--confirm-production I_UNDERSTAND_PRODUCTION_MIGRATION` in an approved execution environment.
- Back up and validate in staging before production. Keep the migration's source SHA, target
  project, operator, dry-run report, apply report, and rollback plan outside the application data.

Example, with no Firebase access or writes:

```bash
node scripts/migrations/001-example.mjs --project rands-local --dry-run
node scripts/migrations/001-example.mjs --project rands-local --limit 1 --dry-run
node scripts/migrations/001-example.mjs --project rands-local --resume example-001 --dry-run

# Event-type casing migration: review the report first; --apply is opt-in.
node scripts/migrations/002-event-type-casing.mjs --project rands-local --key serviceAccount.json --dry-run

# Remove retired per-event draw-hiding fields after reviewing the dry-run report.
node scripts/migrations/003-event-draw-hiding.mjs --project rands-local --key serviceAccount.json --dry-run

# Lift leftover preference stringer/coach flags onto providers/{id}.member_uid.
node scripts/migrations/004-provider-role.mjs --project rands-local --key serviceAccount.json --dry-run

# Standalone recompute-and-diff: replay paid awards, check R6, and refuse unexplained drift.
node scripts/migrations/005-recompute-diff.mjs --project rands-local --key serviceAccount.json --dry-run
```

## Authoring a real migration

Copy `001-example.mjs`, import `createMigrationDb` and `scanCollection`, and keep the migration
bounded and idempotent. For each document, increment `scanned`, then `eligible`, `changed`,
`skipped`, or `failed` as appropriate. Never hide a failed write behind a best-effort catch. Use
Admin SDK transactions or batches with a clear maximum batch size, and record a deterministic
marker when a migration may be resumed safely. Finish through `finalizeMigration` (or
`completeMigration` when the scan is synthetic) so unexplained drift cannot be reported as done.

## Legacy Admin scripts

The older operational scripts in `scripts/` use the same guard now. This includes contact,
cleanup, provider, reward, rank, connection, doubles, setup, zone, repair, and season-restore
scripts. Each requires `--project <id>` and `--key <service-account.json>`, defaults to dry-run,
and requires `--apply` for writes. Production additionally requires the confirmation triple
above. Do not restore direct `firebase-admin` initialization in an operational script.

## Rollback

Every migration must document whether rollback is possible. Prefer additive or reversible writes.
For destructive changes, require a verified backup or export and a tested restore path before an
apply mode is implemented. The `_archive_database_consolidation` collection is not a backup.

## Non-production rehearsal

`scripts/lib/migration-rehearsal.mjs` rehearses event-type casing, `loses` strip, draw-hiding
strip, and provider-role lift against a synthetic `rands-local` snapshot. It records before/after
counts, recompute-and-diff output from `planRecomputeDiff` (TASK-647), and rollback restoration.
The confirmation triple still refuses `toronto-tennis-league`; this is never a production action.
Evidence: [MIGRATION_REHEARSAL.md](../../docs/engineering/MIGRATION_REHEARSAL.md) and
`tests/unit/migrationRehearsal.test.mjs`. This is not a backup/restore drill.
