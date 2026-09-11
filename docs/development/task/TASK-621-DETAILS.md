# TASK-621-DETAILS

|                |                                  |
| -------------- | -------------------------------- |
| **Task id**    | TASK-621                         |
| **Title**      | No-leak check                    |
| **TLDR**       | A check asserts both             |
| **Status**     | completed                       |
| **Tags**       | QA, E2E, Payments, API, Firebase |
| **Sprint**     | DC06 Spiderman                   |
| **Legacy ids** | D9-V-T3                          |
| **Blocked by** | None                             |

## Detail

**Today.** Nothing proves card data and keys stay out

**After.** A check asserts both

**Acceptance.** No card data appears in the app or database · no Stripe key appears in any `VITE_` variable or the client bundle

**Exit adds.** Runs in CI

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

| Date       | Who                 | Note                                                                                                                                                                                                 |
| ---------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · worker | Started. Grep/unit check that Stripe keys stay out of `VITE_` and the client, payment documents store no card data, and `STRIPE_WEBHOOK_SECRET` is a Functions `defineSecret`. Coordinator owns the tracker. |
| 2026-09-11 | Grok Build · worker | Check landed in `tests/unit/paymentsNoLeak.test.mjs` (3 pass). No `VITE_` Stripe keys, no card fields on payment docs/fixtures/shape, webhook secret server-only. Coordinator owns tracker and `npm run verify`. |
