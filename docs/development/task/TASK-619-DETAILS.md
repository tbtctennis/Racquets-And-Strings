# TASK-619-DETAILS

|                |                                                 |
| -------------- | ----------------------------------------------- |
| **Task id**    | TASK-619                                        |
| **Title**      | Donation journey test                           |
| **TLDR**       | A test drives donate → webhook → record → badge |
| **Status**     | completed                                       |
| **Tags**       | QA, E2E, Payments, API, Firebase                |
| **Sprint**     | DC06 Spiderman                                  |
| **Legacy ids** | D9-V-T1                                         |
| **Blocked by** | None                                            |

## Detail

**Today.** Nothing exercises the money path end to end

**After.** A test drives donate → webhook → record → badge

**Acceptance.** The journey passes in test mode against the emulator

**Exit adds.** Needs P2-T2 and P6-T1

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

| Date       | Who                 | Note                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · worker | Started. P2-T2 webhook and P6-T1 badge are on spiderman. Journey will drive donate → signed test-mode webhook → payments row → Contributor badge against the emulator. Hosted Stripe Checkout cannot run here without `sk_test_` / `whsec_`; those stay server secrets, never `VITE_`. Coordinator owns the tracker.                                                                                                                |
| 2026-09-11 | Grok Build · worker | Journey covered donate → signed test-mode webhook → payments row → Contributor badge. Hosted Stripe Checkout is not driven: still needs Functions secrets `STRIPE_SECRET_KEY=sk_test_…` and `STRIPE_WEBHOOK_SECRET=whsec_…` (never `VITE_`) plus Stripe CLI forwarding. Tests: `functions/test/donationJourney.test.js`, emulator integration, `tests/e2e/donation-journey.spec.ts`. Coordinator owns tracker and `npm run verify`. |
