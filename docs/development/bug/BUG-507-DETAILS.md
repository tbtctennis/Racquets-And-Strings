# BUG-507-DETAILS

|                  |                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Bug id**       | BUG-507                                                                                 |
| **Title**        | Firestore Rules rally-report authorization hits evaluator failure                       |
| **TLDR**         | The D6 Rules suite cannot authorize a valid rally report after the location contract changes. |
| **Status**       | completed                                                                               |
| **Tags**         | Rules, Firebase, QA                                                                     |
| **Sprint**       | DC06 Spiderman                                                                          |
| **Legacy ids**   |                                                                                         |
| **Related task** | TASK-530                                                                                |

## Detail

During the final Wave 1 gate, `npm run test:rules` failed in
`tests/rules/firestore.rules.test.mjs:722` (`rally reports bind the reporter and winner to the
match players`). The emulator returned `PERMISSION_DENIED` with an evaluator error for valid rally
result updates. The location-create coverage and partner-pool Rules coverage passed in the same
run. D6 cannot be green-closed until this is resolved and re-tested.

## Comments

| Date       | Who   | Note |
| ---------- | ----- | ---- |
| 2026-09-01 | Codex | Opened from TASK-530 during the final D6 Rules gate. Reproduced repeatedly with `npm run test:rules`; 35/36 Rules tests passed and the valid rally-report case failed. |
| 2026-09-02 | Codex | Fixed the rally/challenge create-time location predicate and isolated each report assertion to its own match document. `mise exec -- npm run test:rules` passes 36/36. |
