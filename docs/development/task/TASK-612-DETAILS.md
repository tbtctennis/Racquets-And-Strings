# TASK-612-DETAILS

|                |                                                                                     |
| -------------- | ----------------------------------------------------------------------------------- |
| **Task id**    | TASK-612                                                                            |
| **Title**      | Checkout session                                                                    |
| **TLDR**       | A server-created Stripe Checkout session supporting cards, Google Pay and Apple Pay |
| **Status**     | completed                                                                          |
| **Tags**       | Payments, API, Firebase                                                             |
| **Sprint**     | DC06 Spiderman                                                                      |
| **Legacy ids** | D9-P2-T1                                                                            |
| **Blocked by** | None                                                                                |

## Detail

**Today.** No gateway exists

**After.** A server-created Stripe Checkout session supporting cards, Google Pay and Apple Pay

**Acceptance.** A test-mode session is created server-side · all three payment methods are offered · no key reaches the client

**Exit adds.** Needs P1-T1

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

| Date       | Who                 | Note                                                                                                                                                                                                                             |
| ---------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · worker | Started. TASK-610 payment types already on spiderman. Implementing a test-mode `createCheckoutSession` callable; hosted Checkout offers card, Google Pay, and Apple Pay; secret stays server-side. Coordinator owns the tracker. |
| 2026-09-11 | Grok Build · worker | Callable landed. Tests: `functions/test/checkoutSession.test.js` (3 pass) plus `functions/test/payments.test.js` (1 pass). Live keys, live session ids, card data, and anonymous callers refused; client gets `{id, url}` only. Coordinator owns tracker and `npm run verify`. |
