# TASK-582-DETAILS

|                |                                                            |
| -------------- | ---------------------------------------------------------- |
| **Task id**    | TASK-582                                                   |
| **Title**      | Typography floor                                           |
| **TLDR**       | Nothing below 12px, one label treatment, two heading sizes |
| **Status**     | completed                                                 |
| **Tags**       | UI, QA                                                     |
| **Sprint**     | DC06 Spiderman                                             |
| **Legacy ids** | D7-SW-T8                                                   |
| **Blocked by** | None                                                       |

## Detail

**Today.** **161 sites below the 12px floor**; 12 label treatments; heading sizes proliferate

**After.** Nothing below 12px, one label treatment, two heading sizes

**Acceptance.** Sub-12px 161 → 0 · labels 12 → 1 · two heading sizes only

**Exit adds.** Do **not** let the sweep touch the 16px control size — it re-opens iOS zoom-on-focus on 58 fields

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

| Date       | Who                 | Note                                                                                                                                                                                                 |
| ---------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · worker | Started. TY-1 12px floor only: className sweep of `text-[9px]`/`text-[10px]`/`text-[11px]` → `text-xs`. Did not touch heading sizes, label-role collapse, index.css tokens, functions, or `text-base`. |
| 2026-09-11 | Grok Build · worker | 143 remaining sub-12px utilities across 38 files → 0. Q-11: BottomNav stays at `text-xs` with `truncate` (no 10px exception). Test: `tests/unit/typeFloor.test.mjs`. Left `inprogress` for coordinator verify/integration. |
