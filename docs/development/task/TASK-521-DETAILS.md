# TASK-521-DETAILS

|                |                                                             |
| -------------- | ----------------------------------------------------------- |
| **Task id**    | TASK-521                                                    |
| **Title**      | One result model, client and words                          |
| **TLDR**       | The handshake UI is gone and declining notifies the creator |
| **Status**     | completed                                                   |
| **Tags**       | UI, API, Firebase                                           |
| **Sprint**     | DC06 Spiderman                                              |
| **Legacy ids** | D6-C15-T2                                                   |
| **Blocked by** | TASK-520 (D6-C15-T1)                                        |

## Detail

**Today.** The UI carries accept, report, confirm, and `rejected` duplicates `declined`

**After.** The handshake UI is gone and declining notifies the creator

**Acceptance.** `grep -rn "'rejected'" src/ functions/` returns nothing · declining a challenge notifies its creator · `ladder_cancelled` still means the challenger withdrew their own open challenge

**Exit adds.** Needs **D6-C15-T1**. `ladder_cancelled` is a **notification type** (`useNotifications.ts:32`, `notifications.js:362`), not a stored column, so nothing schema level changes

**Planning source.** `docs/planning/tasks/TASKS-D6.md` — behaviour lives there. This file tracks status only. No code in this tracker.

**Phase.** M1

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
- `docs/planning/tasks/TASKS-D6.md`
- `docs/planning/sprints/d6-d9/SPRINT-D6.md`
- `docs/planning/sprints/d1-d5/IMPLEMENTATION-REVIEW.md`
- `docs/domain/TOURNAMENT_RULES.md`
- `docs/domain/SCORING_AND_POINTS.md`
- `docs/architecture/DATA_MODEL.md`
- `firestore.rules`
- `docs/architecture/AUTHORIZATION_MODEL.md`

## Comments

| Date | Who | Note |
| ---- | --- | ---- |
| 2026-09-01 | Codex parallel worker | Unified client rally/challenge result reporting on the callable result model and removed the old confirmation/rejection flow. |
