# TASK-637-DETAILS

|                |                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-637                                                                                          |
| **Title**      | Choose and implement one Challenge entry point                                                    |
| **TLDR**       | Product decision selects the surviving entry point; blocked reasons appear in the Challenges tab. |
| **Status**     | completed                                                                                         |
| **Tags**       | UI, Planning                                                                                      |
| **Sprint**     | DC06 Spiderman                                                                                    |
| **Legacy ids** | BLG0011                                                                                           |
| **Blocked by** | None                                                                                              |

## Detail

**After.** Product decision selects the surviving entry point; blocked reasons appear in the Challenges tab.

**Acceptance.** Product decision selects the surviving entry point; blocked reasons appear in the Challenges tab.

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

| Date       | Who                    | Note                                                                                                                                                                                                                                                                                                     |
| ---------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-01 | Anuj Raja · Grok Build | Promoted into DC06 Spiderman: can be done on the emulator before M5 staging is live.                                                                                                                                                                                                                     |
| 2026-09-11 | Grok Build · worker    | Started. WDR §2 already picks the Challenges tab; code still sent from Leaderboard too, and Matches hid the block reason. Follow the ruling: one send on Challenges, reasons visible there.                                                                                                              |
| 2026-09-11 | Grok Build · worker    | Surviving send is the Matches Challenges tab. Removed the Leaderboard Challenge button. Block reasons from `challengeBlockReason` / `CHALLENGE_BLOCK_LABEL` show in that tab. Events "Challenge Now" only navigates there. Tests: `tests/unit/challengeEntry.test.mjs`. Tracker left to the coordinator. |
