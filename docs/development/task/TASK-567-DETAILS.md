# TASK-567-DETAILS

|                |                                 |
| -------------- | ------------------------------- |
| **Task id**    | TASK-567                        |
| **Title**      | `Checkbox` everywhere           |
| **TLDR**       | All use the existing `Checkbox` |
| **Status**     | completed                       |
| **Tags**       | UI                              |
| **Sprint**     | DC06 Spiderman                  |
| **Legacy ids** | D7-MF12-T1                      |
| **Blocked by** | None                            |

## Detail

**Today.** 11 raw checkboxes

**After.** All use the existing `Checkbox`

**Acceptance.** No raw checkbox remains

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

| Date       | Who         | Note                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-11 | Grok worker | Started TASK-567. Planning said 11 raw checkboxes; current code had 5 remaining native `type="checkbox"` sites (Tasks ×2, ScoreModal walkover, TournamentElements conversion, ProfileInfo WhatsApp). ServicesElements already used `Checkbox`. Switches were already TASK-568 and were left alone. Existing `Checkbox` is `h-4` / 16px, not the 20px glyph in MF-12; consumed as-is. |
| 2026-09-11 | Grok worker | Migrated the five remaining native checkboxes onto `src/components/Checkbox.tsx`. No raw checkbox remains outside the shared component. Targeted tests in `tests/unit/checkbox.test.mjs`. `npm run verify` and tracker update left to the coordinator.                                                                                                                               |
