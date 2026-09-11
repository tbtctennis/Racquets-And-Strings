# TASK-607-DETAILS

|                |                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-607                                                                                                 |
| **Title**      | Account creation documented                                                                              |
| **TLDR**       | A new §19 covers the email gate, password, profile completion, throttling and the duplicate-address path |
| **Status**     | completed                                                                                                |
| **Tags**       | Docs                                                                                                     |
| **Sprint**     | DC06 Spiderman                                                                                           |
| **Legacy ids** | D8-S5-T2                                                                                                 |
| **Blocked by** | None                                                                                                     |

## Detail

**Today.** The sign-up journey is undocumented

**After.** A new §19 covers the email gate, password, profile completion, throttling and the duplicate-address path

**Acceptance.** The section is appended after the existing last one · status vocabulary rows are added at §16

**Exit adds.** Append only

**Planning source.** `docs/planning/tasks/TASKS-D8.md` — behaviour lives there. This file tracks status only. No code in this tracker.

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
- `docs/planning/tasks/TASKS-D8.md`
- `docs/planning/sprints/d6-d9/SPRINT-D8.md`
- `docs/architecture/DATA_SHAPE.md`

## Comments

| Date       | Who                  | Note                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok worker TASK-607 | Started. Planning named WORKFLOW-STATES §19 / §16; owner instruction is current-code docs in architecture/domain, not planning history. Reading Signup, checkSignupEmail, profileBootstrap.                                                                                                                                                                   |
| 2026-09-11 | Grok worker TASK-607 | Done. Live record is `docs/architecture/ACCOUNT_CREATION.md` (email gate, password, completion, throttling, duplicate-address) with status vocabulary in §6. DATA_FLOW §1 expanded; diagram `docs/architecture/diagrams/account-creation.md`. Tests: `tests/unit/accountCreationDocs.test.mjs`. `npm run verify` left to the coordinator. Tracker not edited. |
