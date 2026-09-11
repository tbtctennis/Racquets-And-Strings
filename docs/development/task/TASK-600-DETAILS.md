# TASK-600-DETAILS

|                |                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Task id**    | TASK-600                                                                                                           |
| **Title**      | `seedAnchors` and automatic placement                                                                              |
| **TLDR**       | The recursive anchor construction places every seed automatically, so the top two seeds can only meet in the final |
| **Status**     | completed                                                                                                         |
| **Tags**       | API, Data                                                                                                          |
| **Sprint**     | DC06 Spiderman                                                                                                     |
| **Legacy ids** | D8-S1-T3                                                                                                           |
| **Blocked by** | TASK-510 (D6-C7-T1)                                                                                                |

## Detail

**Today.** No placement construction exists, and slots are filled in entry order

**After.** The recursive anchor construction places every seed automatically, so the top two seeds can only meet in the final

**Acceptance.** An 8 draw pairs 1v8, 4v5, 3v6, 2v7, which puts 1 and 2 in opposite halves and sets the semifinals as 1v4 and 2v3 · the same construction generalises to 16 and 32 · byes go to the top seeds · placement needs no organizer input · every function has a unit test

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

| Date       | Who                 | Note                                                                                                                                                                                                                                                                 |
| ---------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · worker | Started. Pure `seedAnchors` (recursive construction) and `assignByes` next to `seedCount`. Did not implement organizer freeze (TASK-605) or place-by-anchors UI (TASK-603).                                                                                          |
| 2026-09-11 | Grok Build · worker | 8-draw is `[1,8,4,5,2,7,3,6]` (pairs 1v8, 4v5, 3v6, 2v7; SFs 1v4 and 2v3). Same construction for 16 and 32. Byes land on the top seeds. Left `inprogress` for coordinator verify/integration. Tracker not edited.                                                     |
