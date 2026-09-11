# TASK-534-DETAILS

|                |                                                                |
| -------------- | -------------------------------------------------------------- |
| **Task id**    | TASK-534                                                       |
| **Title**      | Beta notifications stay in-app                                 |
| **TLDR**       | Nothing leaves the app; the in-app record is the only delivery |
| **Status**     | completed                                                      |
| **Tags**       | API, Firebase                                                  |
| **Sprint**     | DC06 Spiderman                                                 |
| **Legacy ids** | D6-C23-T1                                                      |
| **Blocked by** | None                                                           |

## Detail

**Today.** Server-side email paths can fire during the beta

**After.** Nothing leaves the app; the in-app record is the only delivery

**Acceptance.** No beta-triggered path sends email · in-app notifications still record and display · a test asserts the outbound path is not called

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

| Date       | Who               | Note                                                                                           |
| ---------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| 2026-09-01 | Codex/coordinator | Removed outbound email from notification triggers; weekly reminders now deliver in-app only. |
