# TASK-543-DETAILS

|                |                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------ |
| **Task id**    | TASK-543                                                                                         |
| **Title**      | `PersonRow` densities                                                                            |
| **TLDR**       | `PersonRow` carries three densities and an `editControls` slot that absorbs the RR standings row |
| **Status**     | completed                                                                                        |
| **Tags**       | UI                                                                                               |
| **Sprint**     | DC06 Spiderman                                                                                   |
| **Legacy ids** | D7-CS3-T1                                                                                        |
| **Blocked by** | None                                                                                             |

## Detail

**Today.** 41 ways of drawing a person

**After.** `PersonRow` carries three densities and an `editControls` slot that absorbs the RR standings row

**Acceptance.** All three densities render · the RR standings row uses the slot · every density fits 360px

**Exit adds.** Needs CS1-T1

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

| Date       | Who                  | Note                                                                                                                                                                                                                                                                                                                                                                 |
| ---------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-02 | Codex                | Component work is merged, but the RR standings call site still needs migration to `PersonRow` with the `editControls` slot; it owns `RRGroupCard.tsx` and must be completed before this task closes.                                                                                                                                                                 |
| 2026-09-11 | Grok worker TASK-543 | Started. Migrating RR standings in `RRGroupCard.tsx` onto `PersonRow` with the `editControls` slot; leaving the zone `<select>` in place (TASK-569).                                                                                                                                                                                                                 |
| 2026-09-11 | Grok worker TASK-543 | RR standings now render through `PersonRow`. Zone-move `<select>` and withdraw sit in `editControls`; expand stays on the identity button so those controls are not nested. Native select left for TASK-569. Compact density, 78px action slot, PLAYER_LOADING filter unchanged. Tests: `tests/unit/personRow.test.mjs`, `tests/unit/rrGroupCardStandings.test.mjs`. |
