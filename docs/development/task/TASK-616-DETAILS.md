# TASK-616-DETAILS

|                |                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Task id**    | TASK-616                                                                                                                                                     |
| **Title**      | Organizer approves, refund runs                                                                                                                              |
| **TLDR**       | The organizer sees pending cancellation requests in a queue and approves or declines. **Approval is what executes the Stripe refund** and updates the record |
| **Status**     | completed                                                                                                                                                    |
| **Tags**       | Payments, UI, API, Firebase                                                                                                                                  |
| **Sprint**     | DC06 Spiderman                                                                                                                                               |
| **Legacy ids** | D9-P4-T3                                                                                                                                                     |
| **Blocked by** | TASK-555 (D7-CS6-T1)                                                                                                                                         |

## Detail

**Today.** Nothing reverses a payment, and no organizer surface exists to judge a request

**After.** The organizer sees pending cancellation requests in a queue and approves or declines. **Approval is what executes the Stripe refund** and updates the record

**Acceptance.** An organizer approves a request and the test-mode refund processes · a declined request leaves the payment intact and tells the member · only an organizer can approve · the queue reuses the shared review panel from D7 rather than a new chrome · an approval that fails at Stripe leaves the request pending, never silently refunded

**Exit adds.** Needs P4-T1, and **D7-CS6-T1** for the queue chrome

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
- `docs/planning/tasks/TASKS-D7.md`
- `docs/planning/sprints/d6-d9/SPRINT-D7.md`
- `docs/planning/specs/2026-08-31-m2-uiux-simplification-spec.md`
- `docs/planning/tasks/TASKS-D9.md`
- `docs/planning/sprints/d6-d9/SPRINT-D9.md`
- `firestore.rules`
- `docs/architecture/AUTHORIZATION_MODEL.md`
- `docs/domain/REWARDS_RULES.md`

## Comments

| Date | Who | Note |
| ---- | --- | ---- |
| 2026-09-11 | Grok Build · worker | Started. TASK-555 ReviewPanel is on spiderman. Payment reads stay owner-scoped, so the organizer queue is a callable, not a client query. |
| 2026-09-11 | Grok Build · worker | Organizer `reviewPaymentCancellation` refunds via Stripe test mode, then stamps the payment. Decline leaves `succeeded` and notifies the member. Stripe failure leaves `requested`. Queue reuses ReviewPanel. Tests: functions/test/paymentRefund.test.js, tests/unit/paymentCancellationQueue.test.mjs, tests/unit/payments.test.mjs, tests/unit/reviewPanel.test.mjs. Coordinator owns tracker and npm run verify. |
