# TASK-620-DETAILS

|                |                                                                  |
| -------------- | ---------------------------------------------------------------- |
| **Task id**    | TASK-620                                                         |
| **Title**      | Cancellation journey test                                        |
| **TLDR**       | A test drives request, approve, refund, record, badge, per P4-T2 |
| **Status**     | completed                                                        |
| **Tags**       | QA, E2E, Payments, API, Firebase                                 |
| **Sprint**     | DC06 Spiderman                                                   |
| **Legacy ids** | D9-V-T2                                                          |
| **Blocked by** | None                                                             |

## Detail

**Today.** Nothing exercises a cancellation

**After.** A test drives request, approve, refund, record, badge, per P4-T2

**Acceptance.** The journey passes in test mode · a request older than 90 days is refused · a declined request leaves the payment and the badge intact

**Exit adds.** Needs P4-T1 and P4-T3

**Planning source.** `docs/planning/tasks/TASKS-D9.md` — behaviour lives there. This file tracks status only. No code in this tracker.

**Phase.** M4

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
- `docs/planning/tasks/TASKS-D9.md`
- `docs/planning/sprints/d6-d9/SPRINT-D9.md`
- `firestore.rules`
- `docs/architecture/AUTHORIZATION_MODEL.md`
- `docs/domain/REWARDS_RULES.md`

## Comments

| Date       | Who                 | Note                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · worker | Started. P4-T1 request and P4-T3 organizer refund are on spiderman. Journey will drive request → organizer approve → mocked Stripe test-mode refund → record → badge per P4-T2. A late request is refused; a decline leaves the payment and the badge intact. No live Stripe; no deploy. Coordinator owns the tracker.                                                                                                          |
| 2026-09-11 | Grok Build · worker | Journey test: request → organizer approve → mocked Stripe test-mode refund → `refunded` record → badge per P4-T2. Late request refused. Decline leaves payment and badge. Tests: `functions/test/cancellationJourney.test.js` (3 pass), `tests/integration/cancellationJourney.emulator.test.mjs` via `npm run test:functions:integration` (23 pass). No live Stripe; no deploy. Coordinator owns tracker and `npm run verify`. |
