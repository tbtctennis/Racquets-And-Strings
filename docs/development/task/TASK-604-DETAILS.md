# TASK-604-DETAILS

|                |                                                                       |
| -------------- | --------------------------------------------------------------------- |
| **Task id**    | TASK-604                                                              |
| **Title**      | Seed display                                                          |
| **TLDR**       | `(1)` renders before the name in the bracket, draw list and standings |
| **Status**     | completed                                                            |
| **Tags**       | UI                                                                    |
| **Sprint**     | DC06 Spiderman                                                        |
| **Legacy ids** | D8-S3-T1                                                              |
| **Blocked by** | TASK-544 (D7-CS3b-T1)                                                 |

## Detail

**Today.** Seeds are computed but invisible

**After.** `(1)` renders before the name in the bracket, draw list and standings

**Acceptance.** Seeded rows show the number · unseeded rows show nothing, not `(0)` · every row type still fits 360px

**Exit adds.** Needs **D7-CS3b-T1** · the badge replaces one of the two stats, never becomes a third

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
- `docs/planning/tasks/TASKS-D7.md`
- `docs/planning/sprints/d6-d9/SPRINT-D7.md`
- `docs/planning/specs/2026-08-31-m2-uiux-simplification-spec.md`
- `docs/planning/tasks/TASKS-D8.md`
- `docs/planning/sprints/d6-d9/SPRINT-D8.md`
- `docs/architecture/DATA_SHAPE.md`

## Comments

| Date | Who | Note |
| ---- | --- | ---- |
| 2026-09-11 | Grok Build worker | Started. TASK-544 seed slot is in place; wiring `(1)` into bracket MatchCards, the RR draw list, and standings PersonRows. |
| 2026-09-11 | Grok Build worker | Seed badge renders before the name in MatchCard (bracket), PersonPairRow / PersonRow draw lists, and RR standings. Unseeded and `(0)` stay blank. Seed replaces rank so the two-stat budget holds. Tests: `tests/unit/seedDisplay.test.mjs` plus PersonRow / PersonPairRow / RR standings. Tracker and `npm run verify` left to the coordinator. |
