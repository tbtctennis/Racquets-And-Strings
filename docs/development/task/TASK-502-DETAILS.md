# TASK-502-DETAILS

|                |                                                                                 |
| -------------- | ------------------------------------------------------------------------------- |
| **Task id**    | TASK-502                                                                        |
| **Title**      | Unblock the knockout gate                                                       |
| **TLDR**       | Real matches are filtered, not ANDed; unplayed matches warn instead of blocking |
| **Status**     | completed                                                                       |
| **Tags**       | API, Firebase                                                                   |
| **Sprint**     | DC06 Spiderman                                                                  |
| **Legacy ids** | D6-C1-T1                                                                        |

## Detail

**Today.** The `every` demands all group matches complete, and the placeholder guard is ANDed into the predicate, so a one-player group shuts the gate forever

**After.** Real matches are filtered, not ANDed; unplayed matches warn instead of blocking

**Acceptance.** A one-player group can open the knockout · a draw with unplayed matches opens and shows the count · no real group matches still refuses

**Planning source.** `docs/planning/tasks/TASKS-D6.md` — behaviour lives there. This file tracks status only. No code in this tracker.

**Phase.** M1

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
- `docs/planning/tasks/TASKS-D6.md`
- `docs/planning/sprints/d6-d9/SPRINT-D6.md`
- `docs/planning/sprints/d1-d5/IMPLEMENTATION-REVIEW.md`
- `docs/domain/TOURNAMENT_RULES.md`
- `docs/domain/SCORING_AND_POINTS.md`
- `docs/architecture/DATA_MODEL.md`
- `firestore.rules`
- `docs/architecture/AUTHORIZATION_MODEL.md`

## Comments

| Date       | Who   | Note                                                                                                                                                                                                                     |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-01 | Codex | Started TASK-502. The D6-C1 acceptance is implemented by the preceding BUG-504 change; validating the shared knockout-gate behavior without widening scope.                                                              |
| 2026-09-01 | Codex | Targeted tests, typecheck, lint, emulator rules/integration, browser smoke, build, docs, diff, and generated-artifact checks passed. Required `npm run verify` remains blocked by BUG-506’s repository-wide format gate. |
| 2026-09-01 | Codex | Resumed TASK-502 after BUG-506 completed. Re-running the required full verification for the shared D6-C1 acceptance behavior.                                                                                            |
| 2026-09-01 | Codex | Completed. Targeted knockout-readiness tests and full `npm run verify` passed on `rands-local`; browser smoke passed 8 tests with 1 skipped.                                                                             |
