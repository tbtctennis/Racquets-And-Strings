# TASK-609-DETAILS

|                |                                                                                 |
| -------------- | ------------------------------------------------------------------------------- |
| **Task id**    | TASK-609                                                                        |
| **Title**      | Update the data shape                                                           |
| **TLDR**       | Seven corrections applied, plus headroom for future collections, payments first |
| **Status**     | completed                                                                      |
| **Tags**       | Data, Firebase, API                                                             |
| **Sprint**     | DC06 Spiderman                                                                  |
| **Legacy ids** | D8-SHP-T1                                                                       |
| **Blocked by** | None                                                                            |

## Detail

**Today.** `shape-reference.mjs` and `build-sample-dataset.mjs` still encode pre-D6 rulings, and carry no room for collections that are coming

**After.** Seven corrections applied, plus headroom for future collections, payments first

**Acceptance.** `pointswon` and `totalPointsPlayed` restored · `tournamentsPlayed` carries its new meaning · `rankPosition` restored · `completion_requested_at` becomes `marked_completed_at` · the partner pool stored, not derived · `result_application` retired · `points_winner` and `points_loser` added · the shape admits future collections, with payments modelled

**Exit adds.** `npm run dataset:build` stays green

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
- `docs/planning/tasks/TASKS-D8.md`
- `docs/planning/sprints/d6-d9/SPRINT-D8.md`
- `docs/architecture/DATA_SHAPE.md`
- `firestore.rules`
- `docs/architecture/AUTHORIZATION_MODEL.md`

## Comments

| Date       | Who                 | Note                                                                                                                                                                                                                                 |
| ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-11 | Grok Build · worker | Started. Aligning `shape-reference.mjs`, `build-sample-dataset.mjs`, canonical fixtures, and `DATA_SHAPE.md` with post-D6/D7 code. Docs that still encode L14/DC-11/DC-12 give way to current writers. Coordinator owns the tracker. |
| 2026-09-11 | Grok Build · worker | Seven corrections + modelled `payments` on the existing Firestore (not a new database). Tests: `node --import tsx --test tests/unit/fixtureShape.test.mjs` (10 pass). `npm run dataset:build` needs the gitignored `analysis/snapshots/` dump; none is present in this worktree. Left `inprogress` for coordinator. |
