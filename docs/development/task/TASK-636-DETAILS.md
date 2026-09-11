# TASK-636-DETAILS

|                |                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-636                                                                                                 |
| **Title**      | Give challenge notifications rally parity                                                                |
| **TLDR**       | Declined, confirmed, and denied challenge events are deduplicated and visible through approved channels. |
| **Status**     | completed                                                                                                |
| **Tags**       | API, Firebase                                                                                            |
| **Sprint**     | DC06 Spiderman                                                                                           |
| **Legacy ids** | BLG0010                                                                                                  |
| **Blocked by** | None                                                                                                     |

## Detail

**After.** Declined, confirmed, and denied challenge events are deduplicated and visible through approved channels.

**Acceptance.** Declined, confirmed, and denied challenge events are deduplicated and visible through approved channels.

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
| 2026-09-11 | Grok Build · worker    | Started. WDR §2 wants declined/confirmed/denied challenge events at rally parity, deduped, in-app (VISION §10.3). Ruling 2 stores settled results as `confirmed`; `challengeResults` still writes `complete` — follow current code and treat both as confirmed. Denied is `score_disputed`; the trigger used to skip it because status does not change. Tracker left to the coordinator. |
| 2026-09-11 | Grok Build · worker    | Declined, confirmed (`complete`/`confirmed` → `ladder_reported`), and denied (`score_disputed` → `ladder_denied`) use `notifyOnce` and the in-app beta channel. Tests: `functions/test/challengeNotifications.test.js`, `functions/test/notifications.test.js`, `tests/unit/notificationList.test.mjs`. Tracker not edited. |
