# TASK-649-DETAILS

|                |                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-649                                                                                                       |
| **Title**      | Collect required signup fields before access gates                                                             |
| **TLDR**       | Signup requires league, preferred courts, and an explicit skill choice; unanswered skill is not stored as 2.0. |
| **Status**     | completed                                                                                                      |
| **Tags**       | UI, Auth                                                                                                       |
| **Sprint**     | DC06 Spiderman                                                                                                 |
| **Legacy ids** | BLG0040                                                                                                        |
| **Blocked by** | None                                                                                                           |

## Detail

**After.** Signup requires league, preferred courts, and an explicit skill choice; unanswered skill is not stored as 2.0.

**Acceptance.** Signup requires league, preferred courts, and an explicit skill choice; unanswered skill is not stored as 2.0.

**Planning source.** `docs/planning/history/BACKLOG-BLG.md` — behaviour lives there. This file tracks status only. No code in this tracker.

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

| Date       | Who                    | Note                                                                                                                                                                                                                            |
| ---------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-01 | Anuj Raja · Grok Build | Promoted into DC06 Spiderman: can be done on the emulator before M5 staging is live.                                                                                                                                            |
| 2026-09-11 | Grok Build · worker    | Started. Signup currently defaults skill to 2 and allows empty league/courts; Q-25/(a) requires those three fields and an explicit skill so unanswered is not stored as 2.0.                                                    |
| 2026-09-11 | Grok Build · worker    | Completion requires league, at least one preferred court, and an explicit skill tap. Form skill starts null; unanswered is not stored as 2.0. Tests: `tests/unit/signup.test.mjs`, signup e2e. Tracker left to the coordinator. |
