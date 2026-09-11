# TASK-524-DETAILS

|                |                                                  |
| -------------- | ------------------------------------------------ |
| **Task id**    | TASK-524                                         |
| **Title**      | Event type casing migration                      |
| **TLDR**       | Every event carries one of the four exact values |
| **Status**     | completed                                        |
| **Tags**       | Data, Firebase, API                              |
| **Sprint**     | DC06 Spiderman                                   |
| **Legacy ids** | D6-C17-T2                                        |
| **Blocked by** | None                                             |

## Detail

**Today.** Live data holds five values across ten events, including `tournament` beside `Tournament`

**After.** Every event carries one of the four exact values

**Acceptance.** Dry run finds the lower-case row; after migration no event is outside the four

**Exit adds.** Owner approves the diff · closes BLG0019

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
- `docs/planning/history/BACKLOG-BLG.md`
- `docs/planning/deferred/DEFERRED-AND-FUTURE.md`
- `firestore.rules`
- `docs/architecture/AUTHORIZATION_MODEL.md`

## Comments

| Date       | Who               | Note                                                                                                                     |
| ---------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-01 | Codex/coordinator | Dry-run/apply migration added with bounded paging, unknown-value refusal, idempotence coverage, and focused tests green; runtime tournament readers now use `Tournaments`. |
