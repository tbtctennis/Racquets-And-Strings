# TASK-614-DETAILS

|                |                                                                                                                                                                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-614                                                                                                                                                                                                                                                                                     |
| **Title**      | Donate from the profile card                                                                                                                                                                                                                                                                 |
| **TLDR**       | A **Support the league** button on the **profile card** opens the donation surface, which says where the money goes: to help us organize more events, provide new tennis balls for matches, get better prizes for winners, and an end of season awards ceremony. It then hands off to Stripe |
| **Status**     | completed                                                                                                                                                                                                                                                                                   |
| **Tags**       | Payments, UI                                                                                                                                                                                                                                                                                 |
| **Sprint**     | DC06 Spiderman                                                                                                                                                                                                                                                                               |
| **Legacy ids** | D9-P3-T1                                                                                                                                                                                                                                                                                     |
| **Blocked by** | TASK-556 (D7-CS7-T1)                                                                                                                                                                                                                                                                         |

## Detail

**Today.** No donation surface exists

**After.** A **Support the league** button on the **profile card** opens the donation surface, which says where the money goes: to help us organize more events, provide new tennis balls for matches, get better prizes for winners, and an end of season awards ceremony. It then hands off to Stripe

**Acceptance.** The button sits on the profile card and reaches checkout · the page carries that wording and names the current season · it uses the shared element set, no bespoke controls · it renders in both themes and on a phone

**Exit adds.** Needs P2-T1 and **D7-CS7-T1**, since the profile card is the surface it lands on

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

| Date       | Who                 | Note                                                                                                                                                                                                                                                        |
| ---------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · worker | Started. TASK-556 ProfileCard and TASK-612 `createCheckoutSession` already on spiderman. Adding Support the league on the own card; surface uses shared Button/Sheet/Input and test-mode checkout. Coordinator owns the tracker.                            |
| 2026-09-11 | Grok Build · worker | Own-card Support the league opens DonationSurface, names the current season, and starts test-mode `createCheckoutSession`. Tests: `tests/unit/donateControl.test.mjs` and `tests/unit/profileCard.test.mjs`. Coordinator owns tracker and `npm run verify`. |
