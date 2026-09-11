# TASK-651-DETAILS

|                |                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------ |
| **Task id**    | TASK-651                                                                                   |
| **Title**      | Record non-production migration and reconciliation evidence                                |
| **TLDR**       | Rehearsal records before/after counts, recompute-and-diff, rollback, no production action. |
| **Status**     | completed                                                                                  |
| **Tags**       | Data, QA                                                                                   |
| **Sprint**     | DC06 Spiderman                                                                             |
| **Legacy ids** | BLG0043                                                                                    |
| **Blocked by** | None                                                                                       |

## Detail

**After.** Rehearsal records before/after counts, recompute-and-diff, rollback, no production action.

**Acceptance.** Rehearsal records before/after counts, recompute-and-diff, rollback, no production action.

**Planning source.** `docs/planning/history/BACKLOG-BLG.md` — behaviour lives there. This file tracks status only. No code in this tracker.

## Execute

When **execute sprint spiderman** reaches this item:

1. Set **Status** to `inprogress`. Add a Comments row (date, who, started).
2. Read **Read first**, then the current code those files name. If docs and code disagree, record it in Comments and follow the ruling / current code deliberately.
3. Implement only this item. Do not widen scope.
4. Prove it with the smallest tests that cover the acceptance line, then `npm run verify` before `completed`.
5. **If something fails that this item did not already describe:** open the next free `BUG-n`, set Related task to this id, comment both files, add the bug to `bug/README.md` and the tracker. Leave this item `blocked` if it cannot continue.
6. On success: **Status** `completed`, Comments row, update `docs/development/sprint/tracking/SPIDERMAN-TRACKER.md`.
7. Do not deploy staging or production.

### Read first

- `../../../AGENTS.md`
- `docs/development/sprint/EXECUTE.md`
- `docs/planning/VISION.md`
- `docs/planning/decisions/DECISIONS-2026-08-29.md`
- `docs/planning/specs/2026-08-31-vision-gaps-design.md`
- `docs/planning/history/BACKLOG-BLG.md`
- `docs/planning/deferred/DEFERRED-AND-FUTURE.md`

## Comments

| Date       | Who                    | Note |
| ---------- | ---------------------- | ---- |
| 2026-09-01 | Anuj Raja · Grok Build | Promoted into DC06 Spiderman: can be done on the emulator before M5 staging is live. |
| 2026-09-11 | Grok Build · worker    | Started. BLG0043/D4 data-safety gate: before/after counts, recompute-and-diff, rollback, no production action. Use current planners and TASK-647 `planRecomputeDiff`; do not treat this as a backup drill (TASK-646). |
| 2026-09-11 | Grok Build · worker    | `scripts/lib/migration-rehearsal.mjs` rehearses event-type, loses, draw-hiding, and provider-role on a `rands-local` fixture and writes `docs/engineering/migration-rehearsal-artifact.json`. Evidence: `docs/engineering/MIGRATION_REHEARSAL.md`. Tests: `tests/unit/migrationRehearsal.test.mjs`. Tracker not edited. |
