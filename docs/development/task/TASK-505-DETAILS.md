# TASK-505-DETAILS

|                |                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------ |
| **Task id**    | TASK-505                                                                                   |
| **Title**      | `tournamentsPlayed` backfill                                                               |
| **TLDR**       | Values equal the number of distinct tournament events the member has a participant row for |
| **Status**     | completed                                                                                  |
| **Tags**       | Data, Firebase                                                                             |
| **Sprint**     | DC06 Spiderman                                                                             |
| **Legacy ids** | D6-C3-T2                                                                                   |
| **Blocked by** | None                                                                                       |

## Detail

**Today.** Stored values equal each member's loss count

**After.** Values equal the number of distinct tournament events the member has a participant row for

**Acceptance.** Dry run against the seeded emulator produces a diff; applying it makes every value match the recount

**Exit adds.** Owner reads and approves the diff

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

| Date       | Who   | Note                                                                                                                                                              |
| ---------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-01 | Codex | Started TASK-505. Building a dry-run-first recount of distinct tournament event participation and a bounded, idempotent apply path for `stats.tournamentsPlayed`. |
| 2026-09-01 | Codex | Completed. Seeded `rands-local` dry-run reported 6 diffs, apply reconciled all 6, and a repeat dry-run planned 0; full `npm run verify` passed.                   |
