# TASK-656-DETAILS

|                |                                                              |
| -------------- | ------------------------------------------------------------ |
| **Task id**    | TASK-656                                                     |
| **Title**      | Bounded server operation for manual Round Robin bonus awards |
| **TLDR**       | Authorized, idempotent, auditable, reconciled, tested.       |
| **Status**     | completed                                                    |
| **Tags**       | API, Firebase                                                |
| **Sprint**     | DC06 Spiderman                                               |
| **Legacy ids** | BLG0053                                                      |
| **Blocked by** | None                                                         |

## Detail

**After.** Authorized, idempotent, auditable, reconciled, tested.

**Acceptance.** Authorized, idempotent, auditable, reconciled, tested.

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

| Date       | Who                    | Note                                                                                 |
| ---------- | ---------------------- | ------------------------------------------------------------------------------------ |
| 2026-09-01 | Anuj Raja · Grok Build | Promoted into DC06 Spiderman: can be done on the emulator before M5 staging is live. |
| 2026-09-11 | Grok Build · worker    | Started. `setGroupBonus` already stamped/paid in one transaction but had no audit, no tests, mixed-stamp `.some()` could no-op a partial group, and clients could write `rr_groupbonus`. Followed current callable + D2 stamp-as-receipt; did not add `leagueEarnedTotal` (VISION seven writes, not this item). |
| 2026-09-11 | Grok Build · worker    | `setGroupBonus` now authorizes event managers, no-ops identical stamps, unifies mixed stamps without a second payout, writes `rr_group_bonus_audit`, and clients cannot write `rr_groupbonus`. Tests: `functions/test/groupBonus.test.js`, `tests/unit/groupBonus.test.mjs`, `tests/rules/firestore.groupBonus.test.mjs`. Tracker left to the coordinator. No deploy. |
