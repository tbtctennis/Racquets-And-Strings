# TASK-576-DETAILS

|                |                                                 |
| -------------- | ----------------------------------------------- |
| **Task id**    | TASK-576                                        |
| **Title**      | Page backgrounds and tints                      |
| **TLDR**       | Five tints, one hairline, tokenised backgrounds |
| **Status**     | completed                                      |
| **Tags**       | UI, QA                                          |
| **Sprint**     | DC06 Spiderman                                  |
| **Legacy ids** | D7-SW-T2                                        |
| **Blocked by** | None                                            |

## Detail

**Today.** 42 page-coloured backgrounds across 22 files; 38 surface tints; seven hairline opacities

**After.** Five tints, one hairline, tokenised backgrounds

**Acceptance.** Tints 38 → 5 · hairlines 7 → 1 · no page-coloured background remains

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

| Date       | Who                 | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · worker | Started. Exclusive files: `src/index.css` page/body/surface tokens and page wrappers (`Layout.tsx`, `App.tsx`). Will not revert TASK-578 clay or TASK-583 map tokens; will not edit Button, Spinner, charts. Current code (D3) already remapped `--color-tennis-dark` to the page (`#0b3027` / `#deded5`) rather than retiring it as DEC-3 first said — follow current code.                                                                            |
| 2026-09-11 | Grok Build · worker | Tokenised `--color-page` (dark `#0b3027`, light `#deded5`) and applied `bg-page` on body, Layout, and the App loading wrapper. Five tints + one hairline in `@theme` (follow fg/surface/clay). Did not sweep the remaining `bg-tennis-dark` call sites (Navbar, CourtMap, fields, …) — out of exclusive files. Did not revert clay or map tokens. Test: `tests/unit/pageBackgroundTint.test.mjs`. Left `inprogress` for coordinator verify/integration. |
