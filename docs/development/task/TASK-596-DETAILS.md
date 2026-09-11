# TASK-596-DETAILS

|                |                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-596                                                                                          |
| **Title**      | Rows fit 5.8 inches                                                                               |
| **TLDR**       | Every row type is readable on one line at 360px, and a shortened name still identifies the person |
| **Status**     | completed                                                                                         |
| **Tags**       | UI                                                                                                |
| **Sprint**     | DC06 Spiderman                                                                                    |
| **Legacy ids** | D7-G7-T2                                                                                          |
| **Blocked by** | None                                                                                              |

## Detail

**Today.** Rows are checked on desktop previews, and long names truncate to something unreadable

**After.** Every row type is readable on one line at 360px, and a shortened name still identifies the person

**Acceptance.** A long name keeps the **whole first name** and adds the surname initial, so "Annas Tariq" renders "Annas T" and never "Ann..." · a first name too long for the space truncates at 6 or 7 characters with no surname initial · names never wrap · at most two numbers beside the name · the action slot never shrinks the name below about 40% of the row · contact controls are icon only

**Exit adds.** Applies to `PersonRow` densities, `ListRow`, `PersonPairRow`, `PersonOption` and the RR standings row

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

| Date       | Who                       | Note                                                                                                                                                                                                                  |
| ---------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · spiderman-w2 | Started. Compact row names (`Annas T`, 7-char first-name cap) plus `min-w-[40%]` / truncate / `min-w-0` on PersonRow, ListRow, PersonPairRow, PersonOption, and the RR standings wrapper. 78px action slot unchanged. |
| 2026-09-11 | Grok Build · spiderman-w2 | 34 targeted unit tests pass (nameFormatting, PersonRow, ListRow, PersonPairRow, PersonOption, RR standings). Typecheck clean. `npm run verify` left to the coordinator.                                               |
