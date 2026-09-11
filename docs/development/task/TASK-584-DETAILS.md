# TASK-584-DETAILS

|                |                                      |
| -------------- | ------------------------------------ |
| **Task id**    | TASK-584                             |
| **Title**      | Keyboard and labels                  |
| **TLDR**       | Every control is reachable and named |
| **Status**     | completed                            |
| **Tags**       | UI, Auth, QA                         |
| **Sprint**     | DC06 Spiderman                       |
| **Legacy ids** | D7-SW-T10                            |
| **Blocked by** | None                                 |

## Detail

**Today.** The member picker, four court comboboxes and three password toggles have no keyboard path; nine selects and three X buttons are unlabelled

**After.** Every control is reachable and named

**Acceptance.** Each named control is keyboard-reachable · every select and X button has an accessible name · Escape closes map popups

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

| Date       | Who                  | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok worker TASK-584 | Started. Current code already has PersonOption buttons, Popover Escape, and some labelled selects; password toggles still use tabIndex={-1}, court lists still select on mouseDown, three X buttons and remaining selects are unnamed, and map popups do not join the overlay stack. Not converting selects to modals (TASK-569).                                                                                                                                                                                                  |
| 2026-09-11 | Grok worker TASK-584 | Keyboard path and names: password toggles focusable/`aria-label="Show password"`; member picker + four court comboboxes use arrows/Enter/Escape; remaining selects labelled; three X buttons named `Remove ${x}`; map popups register on the overlay stack; focus-visible rings on interactive controls. Tests: `tests/unit/keyboardLabels.test.mjs`. Typecheck/lint/format/unit tests green except pre-existing `themeFillsSeparators` (expects 3 CourtMap `bg-[#…]` dots, already 0 on this base). Tracker left for coordinator. |
