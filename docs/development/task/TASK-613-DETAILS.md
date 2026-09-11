# TASK-613-DETAILS

|                |                                                                                        |
| -------------- | -------------------------------------------------------------------------------------- |
| **Task id**    | TASK-613                                                                               |
| **Title**      | The webhook                                                                            |
| **TLDR**       | The webhook writes the payment record — the browser returning from checkout never does |
| **Status**     | completed                                                                              |
| **Tags**       | Payments, API, Firebase                                                                |
| **Sprint**     | DC06 Spiderman                                                                         |
| **Legacy ids** | D9-P2-T2                                                                               |
| **Blocked by** | None                                                                                   |

## Detail

**Today.** Nothing confirms a payment

**After.** The webhook writes the payment record — the browser returning from checkout never does

**Acceptance.** A test-mode donation writes its record **from the webhook** · closing the tab after paying still records it · a replayed webhook does not double-record · the signature is verified and an unsigned call is rejected

**Exit adds.** Needs P2-T1 · **the webhook is the source of truth**

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

| Date       | Who                 | Note |
| ---------- | ------------------- | ---- |
| 2026-09-11 | Grok Build · worker | Started. TASK-610 `functions/lib/payments.js` is the write contract (untouched). P2-T1 (TASK-612 checkout) is still `new`; webhook is implemented as the source of truth and expects Checkout `metadata.uid` (or `client_reference_id`), `user_name`, and `type`. Coordinator owns the tracker. |
| 2026-09-11 | Grok Build · worker | Test-mode `stripeWebhook` writes `payments/{checkoutSessionId}` via `buildPaymentRecord`. Replay is create-if-absent. Unsigned/forged signatures and live-mode events are rejected. No Stripe SDK (HMAC via `node:crypto`); no deploy. Tests: `functions/test/stripeWebhook.test.js` (4 pass). `npm --prefix functions test` 57 pass. Coordinator owns tracker and `npm run verify`. |
