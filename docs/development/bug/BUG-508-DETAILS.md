# BUG-508-DETAILS

|                  |                                                                                  |
| ---------------- | -------------------------------------------------------------------------------- |
| **Bug id**       | BUG-508                                                                          |
| **Title**        | Functions emulator integration gate has four timeout/request failures            |
| **TLDR**         | The final D6 Functions integration run fails in four existing emulator journeys. |
| **Status**       | completed                                                                        |
| **Tags**         | Firebase, QA, E2E                                                                |
| **Sprint**       | DC06 Spiderman                                                                   |
| **Legacy ids**   |                                                                                  |
| **Related task** | TASK-530                                                                         |

## Detail

The final `npm run verify` Functions integration phase loaded the migrated rally function path but
reported four failures in `tests/integration/functions.emulator.test.mjs`:

- line 256: joining an event side effect timed out;
- line 297: approved cancellation returned HTTP 500 instead of 200;
- line 325: rally confirmation side effect timed out;
- line 449: tournament result side effect timed out.

The emulator also logged module/dependency warnings and function-load failures while running under
the host Node 26 runtime instead of the repository-pinned Node 22. This needs isolation and a clean
single-emulator rerun before D6 can be green-closed.

## Comments

| Date       | Who   | Note |
| ---------- | ----- | ---- |
| 2026-09-01 | Codex | Opened during the final D6 `npm run verify` run after the stale rally module path was corrected. Four integration tests failed; 15/19 passed. |
| 2026-09-02 | Codex | Fixed the Functions integration package/runtime harness and the rally payout FieldValue import. `mise exec -- npm run test:functions:integration` passes 19/19 under Node 22.23.2. |
