# TASK-580-DETAILS

|                |                                     |
| -------------- | ----------------------------------- |
| **Task id**    | TASK-580                            |
| **Title**      | Touch targets, in order             |
| **TLDR**       | Gaps widen first, then targets grow |
| **Status**     | completed                          |
| **Tags**       | UI, QA                              |
| **Sprint**     | DC06 Spiderman                      |
| **Legacy ids** | D7-SW-T6                            |
| **Blocked by** | None                                |

## Detail

**Today.** Targets are undersized and gaps are tight

**After.** Gaps widen first, then targets grow

**Acceptance.** Gaps land before targets · no control steals its neighbour's taps

**Exit adds.** **Order is load-bearing** (BT-17 before BT-9/BT-10)

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

| Date       | Who                 | Note                                                                                                                                                                                         |
| ---------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · worker | Started. BT-17 before BT-9/BT-10: widen tappable-neighbour gaps, then grow Button / pills / toggles / icon buttons to min 44px. Exclusive of index.css (576), analytics, charts, FieldError. |
| 2026-09-11 | Grok Build · worker | ReviewQueue already uses ApprovePair `gap-2`. Matches dice/reset still sat at `gap-1.5` + `p-2`. Docs named those two pairs; current code follows ApprovePair on the first.                  |
| 2026-09-11 | Grok Build · worker | Gaps first, then 44px: Contact/Entity/Place/Matches pairs; Button/pills/Switch/icon buttons. Test: `tests/unit/touchTargets.test.mjs`. Left `inprogress` for coordinator verify/integration. |
