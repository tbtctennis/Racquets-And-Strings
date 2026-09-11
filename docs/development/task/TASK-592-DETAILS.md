# TASK-592-DETAILS

|                |                             |
| -------------- | --------------------------- |
| **Task id**    | TASK-592                    |
| **Title**      | The last `initialOf`        |
| **TLDR**       | It points at the shared one |
| **Status**     | completed                         |
| **Tags**       | UI                          |
| **Sprint**     | DC06 Spiderman              |
| **Legacy ids** | D7-INI-T1                   |
| **Blocked by** | TASK-548 (D7-CS17-T1)       |

## Detail

**Today.** `ServicesElements.tsx:595` keeps its own copy, out of reach of the profile consolidation

**After.** It points at the shared one

**Acceptance.** No second implementation remains

**Exit adds.** Needs **D7-CS17-T1**

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
|      |     |      |
