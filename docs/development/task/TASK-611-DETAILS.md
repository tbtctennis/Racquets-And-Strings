# TASK-611-DETAILS

|                |                                                                                                                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-611                                                                                                                                                                                                                                                                            |
| **Title**      | Payments in the sidebar, and their rules                                                                                                                                                                                                                                            |
| **TLDR**       | Reads are owner scoped and every client write is denied. A **Payments** entry in the sidebar (`src/components/HeaderMenu.tsx`) shows the member own record of past payments, one list with a **type** on each row, and offers **Request cancellation** on a donation inside 90 days |
| **Status**     | completed                                                                                                                                                                                                                                                                                 |
| **Tags**       | Rules, Firebase, Payments, UI                                                                                                                                                                                                                                                       |
| **Sprint**     | DC06 Spiderman                                                                                                                                                                                                                                                                      |
| **Legacy ids** | D9-P5-T1                                                                                                                                                                                                                                                                            |
| **Blocked by** | None                                                                                                                                                                                                                                                                                |

## Detail

**Today.** `firestore.rules` has no payments block, so the collection falls through to deny, safe but unverifiable, the same trap C12 fixed for `services`. A member also has nowhere to see what they paid

**After.** Reads are owner scoped and every client write is denied. A **Payments** entry in the sidebar (`src/components/HeaderMenu.tsx`) shows the member own record of past payments, one list with a **type** on each row, and offers **Request cancellation** on a donation inside 90 days

**Acceptance.** A member reads their own payment records · a member reading another member records is denied · every client write is denied, so a request goes through a function · the list shows amount, date, season, type and state · a donation inside 90 days offers Request cancellation · a donation past 90 days does not · a court booking row never does, and the server refuses one either way

**Exit adds.** Needs P1-T1, do **before** any write path exists

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
| 2026-09-11 | Grok Build · worker | Started. TASK-610 already landed owner-read / client-write-deny rules. This item adds the sidebar Payments list, 90-day Request cancellation offer, and a server refusal for court-booking cancellations. Coordinator owns the tracker. |
| 2026-09-11 | Grok Build · worker | Sidebar Payments list + owner-read rules + requestPaymentCancellation callable. Tests: tests/unit/payments.test.mjs, tests/unit/paymentsList.test.mjs, tests/unit/listComponents.test.mjs, functions/test/payments.test.js. Typecheck and lint pass. Coordinator owns tracker and npm run verify. |
