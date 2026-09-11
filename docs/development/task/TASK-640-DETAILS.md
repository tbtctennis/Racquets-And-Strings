# TASK-640-DETAILS

|                |                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------ |
| **Task id**    | TASK-640                                                                                         |
| **Title**      | Support change-email for OAuth-only accounts                                                     |
| **TLDR**       | Reauthentication and email change work for supported OAuth providers with clear recovery errors. |
| **Status**     | completed                                                                                        |
| **Tags**       | Auth, Firebase                                                                                   |
| **Sprint**     | DC06 Spiderman                                                                                   |
| **Legacy ids** | BLG0015                                                                                          |
| **Blocked by** | None                                                                                             |

## Detail

**After.** Reauthentication and email change work for supported OAuth providers with clear recovery errors.

**Acceptance.** Reauthentication and email change work for supported OAuth providers with clear recovery errors.

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
| 2026-09-11 | Grok Build · worker    | Started. Current `changeEmail` always reauthenticates with EmailAuthProvider; OAuth-only Google/Apple accounts have no password. Follow current code: keep password reauth when a password provider exists, add Google/Apple popup reauth (redirect fallback) and recovery errors. |
| 2026-09-11 | Grok Build · worker    | Google/Apple-only accounts reauthenticate via popup (redirect fallback), then `verifyBeforeUpdateEmail`. Password accounts keep the current-password field. Unsupported providers get a recovery error instead of a password prompt. Tests: `tests/unit/changeEmail.test.mjs`. Tracker left to the coordinator. |
