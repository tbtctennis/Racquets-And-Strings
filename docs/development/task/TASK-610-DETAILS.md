# TASK-610-DETAILS

|                |                                                                                                                                                                                                                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-610                                                                                                                                                                                                                                                                                                                                           |
| **Title**      | The payments collection                                                                                                                                                                                                                                                                                                                            |
| **TLDR**       | One collection records every payment: member, amount, currency, season, **type**, Stripe identifiers, state, and any cancellation request. **Type** carries `donation` now and `court booking` when Book My Court arrives, matching the type column ruled for bookings and offers in D8. **Summer runs May to November, winter December to April** |
| **Status**     | completed                                                                                                                                                                                                                                                                                                                                         |
| **Tags**       | Rules, Firebase, Payments, API                                                                                                                                                                                                                                                                                                                     |
| **Sprint**     | DC06 Spiderman                                                                                                                                                                                                                                                                                                                                     |
| **Legacy ids** | D9-P1-T1                                                                                                                                                                                                                                                                                                                                           |
| **Blocked by** | None                                                                                                                                                                                                                                                                                                                                               |

## Detail

**Today.** The app has never handled money and has nowhere to record it

**After.** One collection records every payment: member, amount, currency, season, **type**, Stripe identifiers, state, and any cancellation request. **Type** carries `donation` now and `court booking` when Book My Court arrives, matching the type column ruled for bookings and offers in D8. **Summer runs May to November, winter December to April**

**Acceptance.** A record covers a donation, a cancellation request and a refund · every payment carries its type and its season, so a May payment reads summer and a January one reads winter · a court booking row fits the same shape · only a function can create or change a record

**Exit adds.** Blocks every other task

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
| 2026-09-11 | Grok Build · worker | Started. DATA_SHAPE already models `payments`; implementing types, season helper, server write contract, and an explicit Rules block (owner read, client write denied). Coordinator owns the tracker. |
| 2026-09-11 | Grok Build · worker | Collection + types + rules landed. Tests: `tests/unit/payments.test.mjs` (4 pass), `functions/test/payments.test.js` (1 pass), `npm run test:rules` (40 pass, including owner-read / client-write-deny). Full unit suite 279 pass. Typecheck pass. Coordinator owns tracker and `npm run verify`. |
