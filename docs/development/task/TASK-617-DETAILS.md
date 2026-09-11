# TASK-617-DETAILS

|                |                                                                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Task id**    | TASK-617                                                                                                                                                                                                                                               |
| **Title**      | What a refund means                                                                                                                                                                                                                                    |
| **TLDR**       | A cancelled donation is a refunded donation and drops out of the badge calculation. The badge follows the **refund**, not the request, so a pending request changes nothing. A member keeps the badge while any donation of theirs is still unrefunded |
| **Status**     | completed                                                                                                                                                                                                                                              |
| **Tags**       | Payments, API, Firebase                                                                                                                                                                                                                                |
| **Sprint**     | DC06 Spiderman                                                                                                                                                                                                                                         |
| **Legacy ids** | D9-P4-T2                                                                                                                                                                                                                                               |
| **Blocked by** | None                                                                                                                                                                                                                                                   |

## Detail

**Today.** Whether a refunded donor keeps the badge is implied, not decided

**After.** A cancelled donation is a refunded donation and drops out of the badge calculation. The badge follows the **refund**, not the request, so a pending request changes nothing. A member keeps the badge while any donation of theirs is still unrefunded

**Acceptance.** Cancel and refund are one event · a pending request leaves the badge alone · refunding a member only donation removes the badge · a member with three donations who has one refunded keeps it · the rule is written into the sprint document

**Exit adds.** Decide it here, do not leave it implied

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

| Date       | Who                 | Note                                                                                                                                                                                             |
| ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-11 | Grok Build · worker | Started. Encoding refund meaning: cancelled = refunded (`state` + `stripe_refund_id` together). Badge follows the refund, not a pending request. Stripe test mode. Coordinator owns the tracker. |
| 2026-09-11 | Grok Build · worker | Landed. `applyRefund` stamps `state: refunded` + `stripe_refund_id` as one event. Badge helpers ignore pending requests. Tests: `tests/unit/refundMeaning.test.mjs` (5 pass), `functions/test/payments.test.js` (3 pass). Stripe test mode; no deploy. Coordinator owns tracker and `npm run verify`. |
