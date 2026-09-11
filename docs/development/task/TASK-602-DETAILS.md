# TASK-602-DETAILS

|                |                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-602                                                                                                                                                            |
| **Title**      | RR knockout ordering                                                                                                                                                |
| **TLDR**       | The knockout generated from Round Robin groups **is** a knockout, so it is seeded: group points across all groups, then P/G won %, then leaderboard rank, then name |
| **Status**     | completed                                                                                                                                                          |
| **Tags**       | API, Data                                                                                                                                                           |
| **Sprint**     | DC06 Spiderman                                                                                                                                                      |
| **Legacy ids** | D8-S2-T2                                                                                                                                                            |
| **Blocked by** | None                                                                                                                                                                |

## Detail

**Today.** Knockout order comes from fill order

**After.** The knockout generated from Round Robin groups **is** a knockout, so it is seeded: group points across all groups, then P/G won %, then leaderboard rank, then name

**Acceptance.** The four criteria apply in order · scope is one draw, so seed 1 is the top player in that bracket · the groups themselves remain unseeded

**Exit adds.** Needs S1-T2

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
- `docs/planning/tasks/TASKS-D8.md`
- `docs/planning/sprints/d6-d9/SPRINT-D8.md`
- `docs/architecture/DATA_SHAPE.md`

## Comments

| Date       | Who                 | Note                                                                                                                                                                                                                                                               |
| ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-11 | Grok Build · worker | Started. RR knockout order is group points across the draw, then P/G won %, then snapshot rank, then name. Did not own seedCount (TASK-598) or seedAnchors placement (TASK-603).                                                                                   |
| 2026-09-11 | Grok Build · worker | `orderRRKnockout` / `orderRRGroupWinners` in `seeding.ts`. Seed 1 is per-draw. Groups stay unseeded (`buildZoneTierGroups` ignores seed). Tests: `tests/unit/rrKnockoutOrder.test.mjs`. `npm test` 280 pass. Left `inprogress` for coordinator verify/integration. |
