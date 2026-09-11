# TASK-566-DETAILS

|                |                                                     |
| -------------- | --------------------------------------------------- |
| **Task id**    | TASK-566                                            |
| **Title**      | `Popover`                                           |
| **TLDR**       | One `Popover` with 44px rows, absolutely positioned |
| **Status**     | completed                                          |
| **Tags**       | UI                                                  |
| **Sprint**     | DC06 Spiderman                                      |
| **Legacy ids** | D7-MF11-T1                                          |
| **Blocked by** | None                                                |

## Detail

**Today.** Three popovers sit in flow and shift the layout

**After.** One `Popover` with 44px rows, absolutely positioned

**Acceptance.** All three are absolutely positioned · rows are 44px · Escape closes

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

| Date | Who | Note |
| ---- | --- | ---- |
| 2026-09-11 | Grok Build · worker | Started. Three pickers (ScoreModal court, MatchCard PlayerSelect, RRGroupCard PlayerPicker) are already `absolute`; they still use ad-hoc surfaces, sub-44px rows, and no Escape. Following current code plus MF-11: one `Popover`, 44px rows, Escape via overlay stack. |
| 2026-09-11 | Grok Build · worker | Added `src/components/Popover.tsx` (absolute `rounded-2xl p-1 shadow-2xl` surface, `min-h-11 py-3` rows, Escape via `registerOverlay`). Wired ScoreModal, MatchCard PlayerSelect, RRGroupCard PlayerPicker. Registered light/dark design-sync. Tests: `tests/unit/popover.test.mjs` (4 pass). Left `inprogress` for coordinator verify/integration. |
