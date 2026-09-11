# TASK-579-DETAILS

|                |                                                  |
| -------------- | ------------------------------------------------ |
| **Task id**    | TASK-579                                         |
| **Title**      | Clay borders off buttons                         |
| **TLDR**       | The border is gone and the two variants collapse |
| **Status**     | completed                                       |
| **Tags**       | UI, QA                                           |
| **Sprint**     | DC06 Spiderman                                   |
| **Legacy ids** | D7-SW-T5                                         |
| **Blocked by** | None                                             |

## Detail

**Today.** Buttons carry a clay border; `outline` and `ghost` differ only by it

**After.** The border is gone and the two variants collapse

**Acceptance.** The three border sites are cleared · the box does not move · `Input` focus border and spinner rings are **kept**

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
| 2026-09-11 | Grok Build · worker | Started. Three clay-border sites: `Button` outline, `ContactOpponentButton` outline pill, CourtMap Report. `Input` focus and spinner rings stay. |
| 2026-09-11 | Grok Build · worker | Docs said outline/ghost differed only by the clay border; current outline also used `text-clay-fg hover:bg-clay hover:text-white`. Followed the ruling and collapsed both to ghost chrome. Cleared the three sites; kept `border-transparent` so the box does not move. Test: `tests/unit/buttonClayBorder.test.mjs`. Left `inprogress` for coordinator verify/integration. |
