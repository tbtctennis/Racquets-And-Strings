# TASK-603-DETAILS

|                |                                                   |
| -------------- | ------------------------------------------------- |
| **Task id**    | TASK-603                                          |
| **Title**      | Place by anchors                                  |
| **TLDR**       | It places by `seedAnchors`, byes to the top seeds |
| **Status**     | completed                                        |
| **Tags**       | API, Data                                         |
| **Sprint**     | DC06 Spiderman                                    |
| **Legacy ids** | D8-S2-T3                                          |
| **Blocked by** | TASK-502 (D6-C1-T1)                               |

## Detail

**Today.** `buildRRKnockoutDocs` places in fill order

**After.** It places by `seedAnchors`, byes to the top seeds

**Acceptance.** Seed 1 top and seed 2 in the opposite half · 3 and 4 anchor the other quarters · byes land on top seeds · regenerating produces the same bracket · group formation is byte-identical to D7

**Exit adds.** `buildZoneTierGroups` is **not** touched

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

| Date       | Who                 | Note                                                                                                                                                                                                      |
| ---------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · worker | Started. TASK-502/598/599/600/605 helpers exist. Wire knockout generation through `seedAnchors`/`assignByes` so 1 and 2 meet only in the final. Do not rewrite freeze. `buildZoneTierGroups` not touched. |
| 2026-09-11 | Grok Build · worker | `placeByAnchors` uses `assignByes`. `fallbackTemplate` first-round pairs come from `seedAnchors` (32 now opposite-half). `buildRRKnockoutDocs` and knockout `generateDraw` place by anchors; RR first gen orders group advancers. Freeze not rewritten. Tests: `tests/unit/placeByAnchors.test.mjs`. Tracker left to the coordinator. |
