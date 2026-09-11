# TASK-598-DETAILS

|                |                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Task id**    | TASK-598                                                                                                                                                     |
| **Title**      | `seedCount`                                                                                                                                                  |
| **TLDR**       | A pure function returns half the draw capped at 10. **Knockouts only.** Round Robin group formation stays zone, then skill, then courts, and is never seeded |
| **Status**     | completed                                                                                                                                                   |
| **Tags**       | API, Data                                                                                                                                                    |
| **Sprint**     | DC06 Spiderman                                                                                                                                               |
| **Legacy ids** | D8-S1-T1                                                                                                                                                     |
| **Blocked by** | TASK-510 (D6-C7-T1)                                                                                                                                          |

## Detail

**Today.** No seeding exists; R-4 removed ordering entirely

**After.** A pure function returns half the draw capped at 10. **Knockouts only.** Round Robin group formation stays zone, then skill, then courts, and is never seeded

**Acceptance.** Returns 2, 4, 8, 10 for draws of 4, 8, 16, 32 · covered by a unit test with no emulator · group formation is untouched

**Exit adds.** New file, pure, no Firestore

**Planning source.** `docs/planning/tasks/TASKS-D8.md` — behaviour lives there. This file tracks status only. No code in this tracker.

**Phase.** M3

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
- `docs/planning/tasks/TASKS-D8.md`
- `docs/planning/sprints/d6-d9/SPRINT-D8.md`
- `docs/architecture/DATA_SHAPE.md`

## Comments

| Date       | Who                 | Note                                                                                                                                                                                                   |
| ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-11 | Grok Build · worker | Started. Pure `seedCount` only — half the knockout draw, capped at 10. Did not implement seedAnchors or place-by-anchors (TASK-600/603). Group formation untouched.                                    |
| 2026-09-11 | Grok Build · worker | Added `src/features/tournament/domain/seeding.ts` (`seedCount`) and `tests/unit/seedCount.test.mjs` (4→2, 8→4, 16→8, 32→10). Left `inprogress` for coordinator verify/integration. Tracker not edited. |
