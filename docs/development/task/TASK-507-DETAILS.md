# TASK-507-DETAILS

|                |                                           |
| -------------- | ----------------------------------------- |
| **Task id**    | TASK-507                                  |
| **Title**      | Strip `loses` from stored data            |
| **TLDR**       | The field no longer exists in stored data |
| **Status**     | completed                                 |
| **Tags**       | Data, Firebase                            |
| **Sprint**     | DC06 Spiderman                            |
| **Legacy ids** | D6-C4-T2                                  |
| **Blocked by** | None                                      |

## Detail

**Today.** Every `stats` document still carries the dead field

**After.** The field no longer exists in stored data

**Acceptance.** Dry run lists the affected documents; after the migration none carries `loses`

**Exit adds.** Owner reads and approves the diff

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

| Date | Who | Note |
| ---- | --- | ---- |
| 2026-09-01 | Codex/coordinator | Implemented and verified the dry-run/apply `loses` migration in `e340cdbb`; full `npm run verify` passed on `04f4d625` after the formatter gate repair. |
