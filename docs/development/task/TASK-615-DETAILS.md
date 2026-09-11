# TASK-615-DETAILS

|                |                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-615                                                                                                                                                                      |
| **Title**      | Request a cancellation                                                                                                                                                        |
| **TLDR**       | From the payments list a member **requests** cancellation of their own donation, within **90 days** of paying. The request is a record with its own state, it is not a refund |
| **Status**     | completed                                                                                                                                                                     |
| **Tags**       | Payments, UI                                                                                                                                                                  |
| **Sprint**     | DC06 Spiderman                                                                                                                                                                |
| **Legacy ids** | D9-P4-T1                                                                                                                                                                      |
| **Blocked by** | None                                                                                                                                                                          |

## Detail

**Today.** A donation cannot be undone

**After.** From the payments list a member **requests** cancellation of their own donation, within **90 days** of paying. The request is a record with its own state, it is not a refund

**Acceptance.** A member can request cancellation of their own donation · the control is gone once the payment is more than 90 days old, and the server refuses a late request even if the client offers one · a member cannot request cancellation of another member donation · a court booking payment has no request path · the request is visible to the member as pending

**Exit adds.** Needs P2-T2

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
- `docs/domain/REWARDS_RULES.md`

## Comments

| Date       | Who                 | Note |
| ---------- | ------------------- | ---- |
| 2026-09-11 | Grok Build · worker | Started. TASK-611 already landed the Payments list, 90-day Request cancellation offer, and `requestPaymentCancellation`. Hole: a requested cancellation was not visible to the member as pending. Coordinator owns the tracker. |
| 2026-09-11 | Grok Build · worker | Member list shows a requested cancellation as pending (not a refund). Tests: tests/unit/paymentsList.test.mjs, tests/unit/payments.test.mjs, functions/test/payments.test.js. Coordinator owns tracker and npm run verify. |
