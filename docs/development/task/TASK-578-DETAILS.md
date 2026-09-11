# TASK-578-DETAILS

|                |                                                     |
| -------------- | --------------------------------------------------- |
| **Task id**    | TASK-578                                            |
| **Title**      | Light-mode clay                                     |
| **TLDR**       | One line adds it; `--color-clay-fg` stays `#9e2d12` |
| **Status**     | completed                                          |
| **Tags**       | UI, QA                                              |
| **Sprint**     | DC06 Spiderman                                      |
| **Legacy ids** | D7-SW-T4                                            |
| **Blocked by** | None                                                |

## Detail

**Today.** `--color-clay` is missing from the light block, so clay surfaces fall back

**After.** One line adds it; `--color-clay-fg` stays `#9e2d12`

**Acceptance.** Every `bg-clay` / `shadow-clay` / `accent-clay` inherits · text contrast stays above 4.5:1

**Exit adds.** Do **not** change `--color-clay-fg` — #ff6b35 is 2.8:1 on light

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
| 2026-09-11 | Grok Build · worker | Started. Light `--color-clay` is missing; `--color-clay-fg` must stay `#9e2d12`. |
| 2026-09-11 | Grok Build · worker | Added `--color-clay: #ff6b35` to the light block in `src/index.css`. `--color-clay-fg` remains `#9e2d12`. Dark `@theme` clay stays `#e84a27`. Test: `tests/unit/lightClayToken.test.mjs`. Left `inprogress` for coordinator verify/integration. `scripts/verify-design-d3.mjs` still forbids `#ff6b35` literals (D3); coordinator should relax that check for the light token. |
