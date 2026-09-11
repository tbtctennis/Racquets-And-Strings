# TASK-583-DETAILS

|                |                                 |
| -------------- | ------------------------------- |
| **Task id**    | TASK-583                        |
| **Title**      | Colour literals                 |
| **TLDR**       | Every colour comes from a token |
| **Status**     | completed                      |
| **Tags**       | UI, QA                          |
| **Sprint**     | DC06 Spiderman                  |
| **Legacy ids** | D7-SW-T9                        |
| **Blocked by** | None                            |

## Detail

**Today.** The court map holds 60 hex literals; eight raw-hex badges; chart colours are ad hoc

**After.** Every colour comes from a token

**Acceptance.** No hex literal remains in the swept files · chart colours are tokenised

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
| 2026-09-11 | Grok Build · worker | Started. Court-map hex slice only: `CourtMap.tsx`, `courtmap/*`, map tokens in `src/index.css`. Did not touch Button, Spinner, analytics, Profile, Tournament bracket, or TASK-578 clay. |
| 2026-09-11 | Grok Build · worker | Replaced marker hexes `#15803d` `#eab308` `#f97316` `#94a3b8` (and court-map `#3b82f6`) with `--color-map-*` tokens aliased to the Tailwind palette. Shared `MARKER_COLOR` between legend and SVG. List/popup badges now use `text-badge-win` / `text-badge` / `text-fg/70` (plus clay/open tokens). Chart `#3b82f6` in `Leagues.tsx` is out of file ownership. Test: `tests/unit/courtMapColors.test.mjs`. Left `inprogress` for coordinator verify/integration. |
