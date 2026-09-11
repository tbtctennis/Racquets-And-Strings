# TASK-606-DETAILS

|                |                                                                                                                                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-606                                                                                                                                                                                                                                                         |
| **Title**      | Coaching pool documented                                                                                                                                                                                                                                         |
| **TLDR**       | §15.3 documents the target. A coaching service offers three actions, **Book group lesson**, **Book**, and **Redeem discount**. Pooling is not limited to socials, and bookings and offers gain a **type**: group classes, private classes, stringing, extensible |
| **Status**     | completed                                                                                                                                                                                                                                                        |
| **Tags**       | Docs                                                                                                                                                                                                                                                             |
| **Sprint**     | DC06 Spiderman                                                                                                                                                                                                                                                   |
| **Legacy ids** | D8-S5-T1                                                                                                                                                                                                                                                         |
| **Blocked by** | TASK-511 (D6-C8-T1)                                                                                                                                                                                                                                              |

## Detail

**Today.** The coaching pool exists in no workflow record, and it inherits five unanswered questions from DATA_SHAPE §9

**After.** §15.3 documents the target. A coaching service offers three actions, **Book group lesson**, **Book**, and **Redeem discount**. Pooling is not limited to socials, and bookings and offers gain a **type**: group classes, private classes, stringing, extensible

**Acceptance.** The section is **appended**, not inserted · no section is renumbered · no cross-reference breaks · the three actions and the type list are recorded · pooling is described for any event, not only socials

**Exit adds.** Documents the target, does not build it. **The old `group_lessons` collection is never revived.** D6-C8-T1 deletes it; a group lesson becomes a booking of type group classes

**Planning source.** `docs/planning/tasks/TASKS-D8.md` — behaviour lives there. This file tracks status only. No code in this tracker.

**Phase.** M3

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
- `docs/planning/tasks/TASKS-D6.md`
- `docs/planning/sprints/d6-d9/SPRINT-D6.md`
- `docs/planning/sprints/d1-d5/IMPLEMENTATION-REVIEW.md`
- `docs/domain/TOURNAMENT_RULES.md`
- `docs/domain/SCORING_AND_POINTS.md`
- `docs/architecture/DATA_MODEL.md`
- `docs/planning/tasks/TASKS-D8.md`
- `docs/planning/sprints/d6-d9/SPRINT-D8.md`
- `docs/architecture/DATA_SHAPE.md`

## Comments

| Date       | Who                  | Note                                                                                                                                                                                                                                                                                                                                                                 |
| ---------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok worker TASK-606 | Started. Planning named WORKFLOW-STATES §15.3; owner instruction is current-code docs in architecture/domain, not planning history. TASK-511 retired `group_lessons`. Reading services, bookings, contacts, shape-reference.                                                                                                                                         |
| 2026-09-11 | Grok worker TASK-606 | Done. Live record is `docs/architecture/COACHING_POOL.md` (current Book/Redeem, retired group_lessons, D8 S5 three actions + types + any-event pool). DATA_SHAPE §10 appended. CONTACT_PRIVACY coach path updated. Tests: `tests/unit/coachingPoolDocs.test.mjs`. `npm run verify` left to the coordinator. Tracker not edited.                                      |
