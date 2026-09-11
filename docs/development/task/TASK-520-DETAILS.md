# TASK-520-DETAILS

|                |                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Task id**    | TASK-520                                                                                                                                   |
| **Title**      | One result model — server                                                                                                                  |
| **TLDR**       | Both adopt the tournament result model: either player submits, applies immediately, lower margin wins, conflicting winners raise a dispute |
| **Status**     | completed                                                                                                                                  |
| **Tags**       | API, Firebase                                                                                                                              |
| **Sprint**     | DC06 Spiderman                                                                                                                             |
| **Legacy ids** | D6-C15-T1                                                                                                                                  |
| **Blocked by** | None                                                                                                                                       |

## Detail

**Today.** Challenges and rallies each run their own five-state handshake, neither matching how a tournament result is entered

**After.** Both adopt the tournament result model: either player submits, applies immediately, lower margin wins, conflicting winners raise a dispute

**Acceptance.** Either player can submit on a challenge and a rally · no confirmation step remains · a conflicting winner flags a dispute · an unsubmitted rally pays nothing

**Exit adds.** Do with **D6-C21** — same code path

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
| 2026-09-01 | Codex recovery | Implemented the shared challenge/rally result path with immediate application, dispute detection, and correction handling. |
