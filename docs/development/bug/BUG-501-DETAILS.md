# BUG-501-DETAILS

|                |                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bug id**     | BUG-501                                                                                                                                       |
| **Title**      | Organizer score-entry browser journey used the wrong control role                                                                             |
| **TLDR**       | Score fields are input type=number (spinbutton), but the e2e looked for textbox and timed out. Fixed on private main in repo setup commit 01. |
| **Status**     | completed                                                                                                                                     |
| **Tags**       | QA, E2E, UI                                                                                                                                   |
| **Sprint**     | DC06 Spiderman                                                                                                                                |
| **Legacy ids** | BLG0046, BUG e2e:91                                                                                                                           |
| **Blocked by** | None                                                                                                                                          |

## Detail

**After.** Score fields are input type=number (spinbutton), but the e2e looked for textbox and timed out. Fixed on private main in repo setup commit 01.

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

| Date       | Who                    | Note                                                                    |
| ---------- | ---------------------- | ----------------------------------------------------------------------- |
| 2026-09-01 | Anuj Raja · Grok Build | Changed the e2e to getByRole('spinbutton'). Journey passes on 255f902a. |
