# TASK-577-DETAILS

|                |                                             |
| -------------- | ------------------------------------------- |
| **Task id**    | TASK-577                                    |
| **Title**      | Selected states                             |
| **TLDR**       | One selected treatment that reads correctly |
| **Status**     | completed                                  |
| **Tags**       | UI, QA                                      |
| **Sprint**     | DC06 Spiderman                              |
| **Legacy ids** | D7-SW-T3                                    |
| **Blocked by** | None                                        |

## Detail

**Today.** Nine unselected controls read as selected; 13 "selected" treatments

**After.** One selected treatment that reads correctly

**Acceptance.** Unselected reading as selected 9 → 0 · treatments 13 → 1

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

| Date       | Who                 | Note                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · worker | Started. Exclusive: SegmentedControl, tabs, pills, filters. Will not revert TASK-576 page tokens, TASK-578 clay, or TASK-583 map tokens. Will not edit charts or functions. Current code still has six `bg-white text-ink` unselected controls; CompleteProfileModal is gone; SegmentedControl already uses recessed unselected. Follow R-3: selected `bg-clay text-white`, unselected `bg-tennis-deep text-fg`. |
| 2026-09-11 | Grok Build · worker | One `controlChrome` treatment. Unselected-as-selected 9 → 0 (`bg-white text-ink` remains only on ContactOpponentButton's always-white variant). Tabs/pills/filters/SegmentedControl share it. Left Tree, skill grids, calendar cells, PersonOption, Switch. Did not revert page/clay/map tokens. Test: `tests/unit/selectedStates.test.mjs`. Left `inprogress` for coordinator verify/integration.               |
