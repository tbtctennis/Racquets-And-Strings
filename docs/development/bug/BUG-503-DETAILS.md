# BUG-503-DETAILS

|                |                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Bug id**     | BUG-503                                                                                                                                 |
| **Title**      | Round Robin walkover browser assertion was ambiguous                                                                                    |
| **TLDR**       | getByText('Walkover') matched three nodes (label, helper, busy button). Fixed to assert the success toast and an exact Walkover target. |
| **Status**     | completed                                                                                                                               |
| **Tags**       | QA, E2E, UI                                                                                                                             |
| **Sprint**     | DC06 Spiderman                                                                                                                          |
| **Legacy ids** | BLG0048, BUG e2e:159                                                                                                                    |
| **Blocked by** | None                                                                                                                                    |

## Detail

**After.** getByText('Walkover') matched three nodes (label, helper, busy button). Fixed to assert the success toast and an exact Walkover target.

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
- `docs/planning/history/BACKLOG-BLG.md`
- `docs/planning/deferred/DEFERRED-AND-FUTURE.md`

## Comments

| Date       | Who                    | Note                                           |
| ---------- | ---------------------- | ---------------------------------------------- |
| 2026-09-01 | Anuj Raja · Grok Build | Assertion updated on 255f902a. Journey passes. |
