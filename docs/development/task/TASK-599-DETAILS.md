# TASK-599-DETAILS

|                |                                                                                     |
| -------------- | ----------------------------------------------------------------------------------- |
| **Task id**    | TASK-599                                                                            |
| **Title**      | Entry ordering                                                                      |
| **TLDR**       | Order is live `leaguePoints26`, then P/G won %, then name ascending — a total order |
| **Status**     | completed                                                                           |
| **Tags**       | API, Data                                                                           |
| **Sprint**     | DC06 Spiderman                                                                      |
| **Legacy ids** | D8-S1-T2                                                                            |
| **Blocked by** | TASK-503 (D6-C2-T1)                                                                 |

## Detail

**Today.** Nothing orders entrants; `stats.rankPosition` is a weekly snapshot that would seed on rank up to six days stale

**After.** Order is live `leaguePoints26`, then P/G won %, then name ascending — a total order

**Acceptance.** Two players on equal points and equal P/G % order alphabetically · a third joining above both renumbers them 2 and 3 · no two players share a seed

**Exit adds.** Needs **D6-C2-T1** for P/G %

**Planning source.** `docs/planning/tasks/TASKS-D8.md` — behaviour lives there. This file tracks status only. No code in this tracker.

**Phase.** M3

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
- `docs/planning/tasks/TASKS-D8.md`
- `docs/planning/sprints/d6-d9/SPRINT-D8.md`
- `docs/architecture/DATA_SHAPE.md`

## Comments

| Date       | Who         | Note                                                                                                                                                                                                 |
| ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok worker | Started TASK-599. Ruling is live `leaguePoints26` desc, then P/G won % (`pointswon` / `totalPointsPlayed`) desc, then name asc case-insensitive. `seedCompare` in `utils.ts` still uses matchesPlayed; left that for S2 wiring. rankPosition stays the S2 tiebreak via `snapshotRank`. Did not add seedAnchors. seedCount already on this branch from TASK-598. |
| 2026-09-11 | Grok worker | Pure `orderEntrants` in `src/features/tournament/domain/seeding.ts`. Tests: `tests/unit/seedingEntryOrder.test.mjs`. Tracker left to the coordinator. |
