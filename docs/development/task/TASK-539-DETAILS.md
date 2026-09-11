# TASK-539-DETAILS

|                |                                                                                         |
| -------------- | --------------------------------------------------------------------------------------- |
| **Task id**    | TASK-539                                                                                |
| **Title**      | Courts, not zones, at join                                                              |
| **TLDR**       | A member picks courts and the zone is derived; an unmapped court lands them in Unplaced |
| **Status**     | completed                                                                               |
| **Tags**       | API, Firebase                                                                           |
| **Sprint**     | DC06 Spiderman                                                                          |
| **Legacy ids** | D6-F2-T1                                                                                |
| **Blocked by** | TASK-526 (D6-C19-T1)                                                                    |

## Detail

**Today.** A member with no courts chosen is silently assigned to Downtown-Midtown, and zone is picked directly

**After.** A member picks courts and the zone is derived; an unmapped court lands them in Unplaced

**Acceptance.** The five zone conditions hold · an unmapped court lands in Unplaced · no member is silently assigned

**Exit adds.** Carries **D6-C19-T1**

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
| 2026-09-01 | Codex recovery | Join now uses profile preferred courts as the source of truth, removes direct zone selection, and leaves unmapped/no-court members unplaced instead of silently defaulting downtown. |
