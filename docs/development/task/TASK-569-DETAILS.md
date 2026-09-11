# TASK-569-DETAILS

|                |                                                         |
| -------------- | ------------------------------------------------------- |
| **Task id**    | TASK-569                                                |
| **Title**      | Dropdowns become modals                                 |
| **TLDR**       | Every dropdown is a modal form carrying its own heading |
| **Status**     | completed                                              |
| **Tags**       | UI                                                      |
| **Sprint**     | DC06 Spiderman                                          |
| **Legacy ids** | D7-MF14-T1                                              |
| **Blocked by** | None                                                    |

## Detail

**Today.** 14 native `<select>` across 9 files, nine of them with no accessible label

**After.** Every dropdown is a modal form carrying its own heading

**Acceptance.** Native `<select>` 14 → 0 · every one has an accessible name · closes AX-13

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

| Date       | Who                 | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · worker | Started. Docs listed 14 native dropdowns across 9 files; current `spiderman` already moved MatchCard, RR PlayerPicker, ScoreModal court, and CourtMap multi-filter onto Popover. Remaining JSX dropdowns: AddPlayerPanel, RRGroupCard zone, TournamentElements slot, CourtMap FilterSelect, Events type/skill, Services provider, Marketplace condition, ClaimModal event. Follow current code plus ruling 14: every remaining native dropdown becomes a modal form with its own heading. Popover/Switch/Checkbox left as-is. |
| 2026-09-11 | Grok Build · worker | Added `SelectSheet` (Sheet + heading + 44px choices via popover row chrome). Wired the eight remaining sites. Registered light/dark design-sync. Tests: `tests/unit/selectSheet.test.mjs`. Native dropdown JSX in `src/**/*.{ts,tsx}` is 0. `index.css` still mentions native dropdown popups for third-party widgets (out of scope). Left `inprogress` for coordinator verify/integration.                                                                                                                                   |
