# TASK-635-DETAILS

|                |                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------- |
| **Task id**    | TASK-635                                                                                  |
| **Title**      | Make reject and cancel semantics durable                                                  |
| **TLDR**       | Rejected items stay hidden after refresh; accepted cancellations notify the other player. |
| **Status**     | completed                                                                                 |
| **Tags**       | API, Firebase                                                                             |
| **Sprint**     | DC06 Spiderman                                                                            |
| **Legacy ids** | BLG0009                                                                                   |
| **Blocked by** | None                                                                                      |

## Detail

**After.** Rejected items stay hidden after refresh; accepted cancellations notify the other player.

**Acceptance.** Rejected items stay hidden after refresh; accepted cancellations notify the other player.

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
- `firestore.rules`
- `docs/architecture/AUTHORIZATION_MODEL.md`

## Comments

| Date       | Who                    | Note                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-01 | Anuj Raja · Grok Build | Promoted into DC06 Spiderman: can be done on the emulator before M5 staging is live.                                                                                                                                                                                                                                                                                  |
| 2026-09-11 | Grok Build · worker    | Started. WDR §2: rejected items stay gone after refresh; cancel after accept notifies the other player. Code already persisted `declined` and notified on open retract, but declined senders still returned in the Matches pool, and accepted cancel was a no-op (UI gated or Rules-blocked delete). Follow WDR; keep `ladder_cancelled` on open retracts (TASK-521). |
| 2026-09-11 | Grok Build · worker    | Decline stays a stored `declined` write; Matches excludes those senders from the tab so they stay hidden after refresh. Accepted cancel goes through `cancelMatch` and notifies the other player. Open retracts remain sender delete. Tests: `tests/unit/matchLifecycle.test.mjs`, `functions/test/matchCancel.test.js`. Tracker left to the coordinator.             |
