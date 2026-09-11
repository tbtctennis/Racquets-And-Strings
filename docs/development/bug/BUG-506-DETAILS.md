# BUG-506-DETAILS

|                  |                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bug id**       | BUG-506                                                                                                                                      |
| **Title**        | Repository-wide format gate fails before sprint item verification                                                                            |
| **TLDR**         | `npm run verify` cannot complete because `format:check` reports repository files needing formatting, including unrelated pre-existing files. |
| **Status**       | completed                                                                                                                                    |
| **Tags**         | QA                                                                                                                                           |
| **Sprint**       | DC06 Spiderman                                                                                                                               |
| **Legacy ids**   |                                                                                                                                              |
| **Related task** | BUG-504                                                                                                                                      |

## Detail

The formatter gate now checks every tracked working file while protecting the behavior-source `docs/planning/` history from mechanical rewrites. The in-scope working files were normalized once, and the emulator-first `npm run verify` gate passes end to end.

## Comments

| Date       | Who   | Note                                                                                                                                                                                                         |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-01 | Codex | Opened from BUG-504 after the required escalated `npm run verify` failed only at the repository-wide format check. Related task: BUG-504.                                                                    |
| 2026-09-01 | Codex | Reproduced while verifying BUG-505: all functional and emulator gates passed, while the repository-wide format check reported 198 files. BUG-505 is also blocked by this same gate; no duplicate bug opened. |
| 2026-09-01 | Codex | Started BUG-506. Restoring the documented tracked-working-file formatting contract while protecting `docs/planning/` history from mechanical rewrites.                                                       |
| 2026-09-01 | Codex | Completed formatter scope and working-file normalization. `npm run verify` passed on `rands-local`: all configured local gates green, with 8 browser tests passed and 1 skipped.                             |
| 2026-09-02 | Codex | Reapplied the formatter to the remaining 12 tracked documentation files reported by the final D6 gate. `npm run format:check`, working-tree diff check, and comparison diff check now pass. |
