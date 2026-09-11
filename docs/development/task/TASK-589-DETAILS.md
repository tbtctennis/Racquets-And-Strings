# TASK-589-DETAILS

|                |                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-589                                                                                                                      |
| **Title**      | The stats a member sees                                                                                                       |
| **TLDR**       | Leaderboard, RR table and the **upcoming matches stat cards** all show exactly the ruled stats, and the streak rides the card |
| **Status**     | completed                                                                                                                     |
| **Tags**       | UI                                                                                                                            |
| **Sprint**     | DC06 Spiderman                                                                                                                |
| **Legacy ids** | D7-STA-T1                                                                                                                     |
| **Blocked by** | TASK-556 (D7-CS7-T1)                                                                                                          |

## Detail

**Today.** Surfaces show different stat sets, the streak is derived twice, and upcoming matches are presented inconsistently

**After.** Leaderboard, RR table and the **upcoming matches stat cards** all show exactly the ruled stats, and the streak rides the card

**Acceptance.** The leaderboard row shows matches won, P/G won %, rank move and streak · the RR table shows its four · the upcoming matches stat cards show the member pending fixtures and nothing else · no surface adds a stat of its own

**Exit adds.** Needs **D7-CS7-T1**, so there is no helper to extract

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

## Comments

| Date       | Who         | Note                                                                                                                                                                                                                                                                                                 |
| ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok worker | Started TASK-589. Leaderboard drawer is matches won / P/G won % / rank move / streak (streak from ProfileCard; other rows — until their matches are loaded). RR tiles are group wins / overall P/G won % / pending / contact. Upcoming PlayerCards drop career tiles and show pending fixtures only. |
| 2026-09-11 | Grok worker | Completed TASK-589. Smallest tests in tests/unit/memberFacingStats.test.mjs. Tracker left to the coordinator.                                                                                                                                                                                        |
