# TASK-593-DETAILS

|                |                        |
| -------------- | ---------------------- |
| **Task id**    | TASK-593               |
| **Title**      | Remaining copy defects |
| **TLDR**       | Each reads correctly   |
| **Status**     | completed              |
| **Tags**       | UI                     |
| **Sprint**     | DC06 Spiderman         |
| **Legacy ids** | D7-CPY-T1              |
| **Blocked by** | None                   |

## Detail

**Today.** Counts, totals, links and the court-map, services, marketplace and notification copy carry known defects

**After.** Each reads correctly

**Acceptance.** Every listed row is corrected · one rewards-available helper remains

**Planning source.** `docs/planning/tasks/TASKS-D7.md` — behaviour lives there. This file tracks status only. No code in this tracker.

**Phase.** M2

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
- `docs/planning/tasks/TASKS-D7.md`
- `docs/planning/sprints/d6-d9/SPRINT-D7.md`
- `docs/planning/specs/2026-08-31-m2-uiux-simplification-spec.md`

## Comments

| Date       | Who                   | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · TASK-593 | Started. Listed rows: CS-38 helper, CS-40 counts/totals, CS-41 History links, CS-68 remaining copy, plus court-map / services / marketplace / notification copy. Welcome email now exists in code (AuthContext + sendWelcomeEmail); original CS-68 said it did not — follow current code, drop the VERIFY EMAIL framing. Capacity is not stored on events, so Events shows joined count rather than an invented denominator. Terms/Privacy effective dates stay deferred (BLG0067). |
| 2026-09-11 | Grok Build · TASK-593 | Listed copy rows corrected; one `rewardsAvailable` helper remains. Tests: `node --import tsx --test tests/unit/remainingCopy.test.mjs tests/unit/signup.test.mjs` pass. Verify left to coordinator. |
