# BUG-505-DETAILS

|                |                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------- |
| **Bug id**     | BUG-505                                                                                        |
| **Title**      | Restore the intended next= path after login                                                    |
| **TLDR**       | Successful authentication should return to the validated in-app destination or a safe default. |
| **Status**     | completed                                                                                      |
| **Tags**       | Auth, UI                                                                                       |
| **Sprint**     | DC06 Spiderman                                                                                 |
| **Legacy ids** | BLG0014, BUG0012                                                                               |

## Detail

**After.** Successful authentication should return to the validated in-app destination or a safe default.

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

| Date       | Who                    | Note                                                                                                                                                            |
| ---------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-01 | Anuj Raja · Grok Build | Pulled from backlog into Wave 0 (bugs first). Local login redirect; no staging required.                                                                        |
| 2026-09-01 | Codex                  | Started BUG-505. Tracing the authenticated login redirect and its validation boundary before changing only the next-destination path.                           |
| 2026-09-01 | Codex                  | Implementation and auth-redirect regression coverage are complete. Required `npm run verify` is blocked by the repository-wide format check tracked by BUG-506. |
| 2026-09-01 | Codex                  | Resumed BUG-505 after BUG-506 completed. Re-running the required full verification for the already implemented redirect behavior.                               |
| 2026-09-01 | Codex                  | Completed. Targeted auth-redirect regression tests and full `npm run verify` passed on `rands-local`; browser smoke passed 8 tests with 1 skipped.              |
