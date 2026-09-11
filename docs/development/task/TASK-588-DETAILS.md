# TASK-588-DETAILS

|                |                                      |
| -------------- | ------------------------------------ |
| **Task id**    | TASK-588                             |
| **Title**      | Doubles pool card                    |
| **TLDR**       | One card carrying exactly five stats |
| **Status**     | completed                            |
| **Tags**       | UI                                   |
| **Sprint**     | DC06 Spiderman                       |
| **Legacy ids** | D7-DPC-T1                            |
| **Blocked by** | TASK-556 (D7-CS7-T1)                 |

## Detail

**Today.** No doubles pool card exists

**After.** One card carrying exactly five stats

**Acceptance.** The five render · it reuses the shared card · no sixth stat appears

**Exit adds.** Needs **D7-CS7-T1**

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
| 2026-09-11 | Grok worker | Started TASK-588. Ruling (VISION §10.1 / 2026-08-31): five stats are doubles matches won, P/G won %, numbered partners, availability tag, nearby tag. VISION puts all five on the expandable PlayerCard drawer (same card as the leaderboard); the older gaps note about inline tags is superseded. |
| 2026-09-11 | Grok worker | DoublesPoolCard composes PlayerCard with exactly those five drawer stats. Partner pool panel consumes it. Tests: `node --import tsx --test tests/unit/doublesPoolCard.test.mjs`. Coordinator owns `npm run verify` and the tracker. |
