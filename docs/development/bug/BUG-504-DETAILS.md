# BUG-504-DETAILS

|                |                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bug id**     | BUG-504                                                                                                                                         |
| **Title**      | Remove Player-Loading placeholder participants                                                                                                  |
| **TLDR**       | Single-player groups should stay visible and movable without persisted placeholder people or matches. Related to the knockout-gate fault D6-C1. |
| **Status**     | completed                                                                                                                                       |
| **Tags**       | API, Firebase, QA                                                                                                                               |
| **Sprint**     | DC06 Spiderman                                                                                                                                  |
| **Legacy ids** | BLG0005, BUG0002                                                                                                                                |

## Detail

**After.** Single-player groups should stay visible and movable without persisted placeholder people or matches. Related to the knockout-gate fault D6-C1.

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
- `docs/planning/history/BACKLOG-BLG.md`
- `docs/planning/deferred/DEFERRED-AND-FUTURE.md`
- `firestore.rules`
- `docs/architecture/AUTHORIZATION_MODEL.md`

## Comments

| Date       | Who   | Note                                                                                                                                                                           |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-01 | Codex | Started BUG-504. Implementing the knockout gate fix so placeholder-only group matches are excluded and unplayed real matches warn without blocking.                            |
| 2026-09-01 | Codex | Implementation and focused regression coverage are complete. Required `npm run verify` is blocked by the repository-wide format check reporting 196 files; tracked as BUG-506. |
| 2026-09-01 | Codex | Resumed BUG-504 after BUG-506 completed. Re-running the required full verification for the already implemented acceptance behavior.                                            |
| 2026-09-01 | Codex | Completed. Targeted Round Robin regression tests and full `npm run verify` passed on `rands-local`; browser smoke passed 8 tests with 1 skipped.                               |
