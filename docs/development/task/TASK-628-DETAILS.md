# TASK-628-DETAILS

|                |                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| **Task id**    | TASK-628                                                                                                     |
| **Title**      | Tasks and rewards pay out server-side                                                                        |
| **TLDR**       | Beta block 3 includes tasks and rewards. No feature row in D6–D9. Payouts must stay Functions-authoritative. |
| **Status**     | completed                                                                                                   |
| **Tags**       | API, Firebase, QA                                                                                            |
| **Sprint**     | DC06 Spiderman                                                                                               |
| **Legacy ids** | VISION §11, M3                                                                                               |
| **Blocked by** | None                                                                                                         |

## Detail

**After.** Beta block 3 includes tasks and rewards. No feature row in D6–D9. Payouts must stay Functions-authoritative.

**Acceptance.** Task completion pays on the server. A client cannot write its own balance. Rules tests cover the path.

**Planning source.** `docs/planning/VISION.md` — behaviour lives there. This file tracks status only. No code in this tracker.

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
- `docs/planning/history/BACKLOG-BLG.md`
- `docs/planning/deferred/DEFERRED-AND-FUTURE.md`
- `firestore.rules`
- `docs/architecture/AUTHORIZATION_MODEL.md`

## Comments

| Date       | Who                 | Note |
| ---------- | ------------------- | ---- |
| 2026-09-11 | Grok Build · worker | Started. Audit client writes to `leaguePoints26` / task payout flags / `pointsSpent`. Payouts stay Functions-authoritative; rules must deny client balance writes. |
| 2026-09-11 | Grok Build · worker | Closed the Initiation payout gap: `onTaskProgressAwardSetupComplete` awards `setupComplete` when the last flag is a client-writable trust task. Removed unused client `bumpCounter`. Rules tests deny `setupComplete` / tier flags / counters / `leaguePoints26` / `pointsSpent` / `redemptions` writes. Remaining client writes that are not payouts: honor-system Initiation flags; stats bootstrap zeros (`leaguePoints26: 0`); pending `task_claims`. Tests: `npm --prefix functions test`, `npm run test:rules`, `tests/unit/payoutAuthority.test.mjs`. Left inprogress for coordinator. |
