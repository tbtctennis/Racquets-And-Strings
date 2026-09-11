# TASK-544-DETAILS

|                |                                                                  |
| -------------- | ---------------------------------------------------------------- |
| **Task id**    | TASK-544                                                         |
| **Title**      | `seed` slot                                                      |
| **TLDR**       | `PersonRow` renders `(1)` before the name when a seed is present |
| **Status**     | completed                                                         |
| **Tags**       | UI                                                               |
| **Sprint**     | DC06 Spiderman                                                   |
| **Legacy ids** | D7-CS3b-T1                                                       |
| **Blocked by** | None                                                             |

## Detail

**Today.** No slot exists for a seed number

**After.** `PersonRow` renders `(1)` before the name when a seed is present

**Acceptance.** A seeded row shows the number · an unseeded row shows nothing, not `(0)` · the badge counts against the two-stat budget

**Exit adds.** **Unblocks D8-S3**

**Planning source.** `docs/planning/tasks/TASKS-D7.md` — behaviour lives there. This file tracks status only. No code in this tracker.

**Phase.** M2

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
- `docs/planning/tasks/TASKS-D7.md`
- `docs/planning/sprints/d6-d9/SPRINT-D7.md`
- `docs/planning/specs/2026-08-31-m2-uiux-simplification-spec.md`
- `docs/planning/tasks/TASKS-D8.md`
- `docs/planning/sprints/d6-d9/SPRINT-D8.md`
- `docs/architecture/DATA_SHAPE.md`

## Comments

| Date | Who | Note |
| ---- | --- | ---- |
| 2026-09-02 | Codex | Implemented and verified positive seed rendering, zero/invalid seed omission, and the two-stat budget in focused PersonRow tests. |
