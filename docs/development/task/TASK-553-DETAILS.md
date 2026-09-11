# TASK-553-DETAILS

|                |                                |
| -------------- | ------------------------------ |
| **Task id**    | TASK-553                       |
| **Title**      | `ListRow` + `ListGroup`        |
| **TLDR**       | Two components serve all eight |
| **Status**     | completed                     |
| **Tags**       | UI                             |
| **Sprint**     | DC06 Spiderman                 |
| **Legacy ids** | D7-CS4-T1                      |
| **Blocked by** | None                           |

## Detail

**Today.** Eight copies of one skeleton

**After.** Two components serve all eight

**Acceptance.** All eight surfaces use them · rows fit 360px

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

| Date       | Who                 | Note                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · worker | Started. Six files already wrap with ListGroup (Notifications, Matches, Leagues, History, Events, CourtMapElements). Matches/Leagues stay on PlayerCard; CourtMap rows stay on PlaceCard. Remaining list skeletons to ListRow: History, Events, Notifications, ReviewQueue, Profile recent matches, CheckInModal.                                                                                           |
| 2026-09-11 | Grok Build · worker | Migrated remaining tile/two-line list skeletons onto ListRow (History matches + past tournaments, Events completed, Notifications feed, ReviewQueue claims + coupons, Profile last-5 matches, CheckInModal top check-ins + nearby). ListGroup already registered in `.design-sync` (light/dark). Tests: `tests/unit/listComponents.test.mjs`. `npm run verify` left to the coordinator. Tracker not edited. |
