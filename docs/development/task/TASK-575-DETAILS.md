# TASK-575-DETAILS

|                |                                             |
| -------------- | ------------------------------------------- |
| **Task id**    | TASK-575                                    |
| **Title**      | Light-theme fills and rules                 |
| **TLDR**       | Separators and fills resolve in both themes |
| **Status**     | completed                                  |
| **Tags**       | UI, QA                                      |
| **Sprint**     | DC06 Spiderman                              |
| **Legacy ids** | D7-SW-T1                                    |
| **Blocked by** | None                                        |

## Detail

**Today.** 12 row separators vanish on light cards so eight list surfaces read as one block; 9 surfaces have no light fill at all, including six Profile stat tiles

**After.** Separators and fills resolve in both themes

**Acceptance.** Separators that do not flip 12 → 0 · surfaces with no light fill 9 → 0

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
| 2026-09-11 | Grok Build · worker | Started. Remaining theme-blind fills/rules: 4 `divide-white/5`, 6 `bg-white/[0.0x]` sites (4 Profile tiles, PlayerProfile cluster, CourtMap hover), 1 dark-only `bg-[#1a1a2e]`. |
| 2026-09-11 | Grok Build · worker | Swapped separators to `divide-fg/10` and fills to `bg-fg/5` / `hover:bg-fg/10`. AddPlayerPanel navy panel → `bg-tennis-deep border-fg/10`. CourtMap legend hex dots left for TASK-583. Test: `tests/unit/themeFillsSeparators.test.mjs`. Counts after: divide-white 4→0, white-alpha fills 6→0, hex class fills 4→3 allowed exceptions. Left `inprogress` for coordinator verify/integration. |
