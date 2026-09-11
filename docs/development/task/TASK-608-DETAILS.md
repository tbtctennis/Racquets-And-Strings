# TASK-608-DETAILS

|                |                                                          |
| -------------- | -------------------------------------------------------- |
| **Task id**    | TASK-608                                                 |
| **Title**      | Restore `rankPosition`                                   |
| **TLDR**       | The field is restored, with seeding as a second consumer |
| **Status**     | completed                                                |
| **Tags**       | API, Data                                                |
| **Sprint**     | DC06 Spiderman                                           |
| **Legacy ids** | D8-RNK-T1                                                |
| **Blocked by** | None                                                     |

## Detail

**Today.** DC-11 deleted it as "rendered nowhere", but three files read it and a function writes it

**After.** The field is restored, with seeding as a second consumer

**Acceptance.** The three readers work · the snapshot writes it · seeding can read it

**Exit adds.** DC-11's premise was wrong

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

## Comments

| Date       | Who         | Note                                                                                                                                                                                                 |
| ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok worker | Started TASK-608. Docs say DC-11 deleted rankPosition; code still typed and wrote it, but Leagues.tsx, Profile.tsx and useStandings.ts did not read it. DATA_SHAPE.md still lists DC-11 delete; followed the 2026-08-29 Keep ruling. Shape fixtures left to TASK-609. |
| 2026-09-11 | Grok worker | Restored the three readers (`useStandings.ts`, `Leagues.tsx`, `Profile.tsx`), snapshot writes via `computeRankUpdates`, seeding reads `snapshotRank`. Tests: `tests/unit/rankPosition.test.mjs`, `functions/test/rankSnapshot.test.js`. Tracker left to the coordinator. |
