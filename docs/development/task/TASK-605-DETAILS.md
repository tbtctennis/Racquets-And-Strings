# TASK-605-DETAILS

|                |                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-605                                                                                                       |
| **Title**      | Seeds freeze, unseeded stay movable                                                                            |
| **TLDR**       | Seeding fixes the moment the draw is generated. After that the organizer may move **unseeded** players by hand |
| **Status**     | completed                                                                                                      |
| **Tags**       | API, Data                                                                                                      |
| **Sprint**     | DC06 Spiderman                                                                                                 |
| **Legacy ids** | D8-S4-T1                                                                                                       |
| **Blocked by** | None                                                                                                           |

## Detail

**Today.** Seeds recompute on every join, so a strong late entrant pushes everyone down, and nothing can be adjusted afterwards

**After.** Seeding fixes the moment the draw is generated. After that the organizer may move **unseeded** players by hand

**Acceptance.** Joining an ungenerated draw reorders seeds · joining a generated draw changes no existing seed · the organizer can move an unseeded player to another open position after generation · a seeded player keeps their number and position · reseeding a generated draw stays forbidden

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

| Date       | Who                 | Note                                                                                                                                                                                                                                                                                                                          |
| ---------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · worker | Started TASK-605. Docs describe join-time seed writes; code has `seed` on the player type and `seedCount`, but join cannot update other participants' seeds (rules: manager-only). Freeze is a pure function over ranked entrants; numbers stamp at generation; unseeded may move to open slots; seeded keep number and seat. |
| 2026-09-11 | Grok Build · worker | Freeze rules in `seedFreeze.ts`. Generation stamps seeds via `seedCount`; knockout move/seat refuses to displace a seed; unseeded may take an open slot; regenerating a live draw is forbidden. RR groups untouched. Tests: `tests/unit/seedFreeze.test.mjs`. Tracker left to the coordinator. |
