# TASK-618-DETAILS

|                |                                                                      |
| -------------- | -------------------------------------------------------------------- |
| **Task id**    | TASK-618                                                             |
| **Title**      | Contributor Badge                                                    |
| **TLDR**       | A badge on the donor's profile, derived from the payments collection |
| **Status**     | completed                                                            |
| **Tags**       | Payments, UI                                                         |
| **Sprint**     | DC06 Spiderman                                                       |
| **Legacy ids** | D9-P6-T1                                                             |
| **Blocked by** | TASK-556 (D7-CS7-T1)                                                 |

## Detail

**Today.** Donors get no acknowledgement

**After.** A badge on the donor's profile, derived from the payments collection

**Acceptance.** The badge appears from a payment record · it is **derived**, never a separately stored flag that can drift from the money · it rides the shared profile card

**Exit adds.** Needs P1-T1, P4-T2 and **D7-CS7-T1**

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
- `docs/domain/REWARDS_RULES.md`

## Comments

| Date       | Who                 | Note |
| ---------- | ------------------- | ---- |
| 2026-09-11 | Grok Build · worker | Started. TASK-556 ProfileCard is in place. Badge will be derived from payments (succeeded donations only; refunds drop out; pending cancellation leaves it). No stored flag. P5 owner-read means public viewers cannot query another member's payments; the shared card still renders the badge in public mode when records are supplied. Coordinator owns the tracker. |
| 2026-09-11 | Grok Build · worker | Contributor badge derived from succeeded donations on the shared ProfileCard. Own profile wires usePayments. Pending cancellation keeps it; a full refund drops it; one remaining donation of three keeps it. No stored flag. Tests: tests/unit/payments.test.mjs, tests/unit/profileCard.test.mjs, functions/test/payments.test.js. Typecheck pass. Coordinator owns tracker and npm run verify. |
