# TASK-564-DETAILS

|                |                                                        |
| -------------- | ------------------------------------------------------ |
| **Task id**    | TASK-564                                               |
| **Title**      | One banner                                             |
| **TLDR**       | `AlertMessage` is the only banner, with `role="alert"` |
| **Status**     | completed                                              |
| **Tags**       | UI                                                     |
| **Sprint**     | DC06 Spiderman                                         |
| **Legacy ids** | D7-MF9-T1                                              |
| **Blocked by** | None                                                   |

## Detail

**Today.** 13 hand-rolled banners against 2 real consumers; 11 have no box and none announce to a screen reader

**After.** `AlertMessage` is the only banner, with `role="alert"`

**Acceptance.** Hand-rolled banners 13 → 0 · every banner announces

**Planning source.** `docs/planning/tasks/TASKS-D7.md` — behaviour lives there. This file tracks status only. No code in this tracker.

**Phase.** M2

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

## Comments

| Date | Who | Note |
| ---- | --- | ---- |
| 2026-09-11 | Grok worker TASK-564 | Started. `AlertMessage` had no `role="alert"`. 13 hand-rolled banners remained; MatchCard and Tournament already consumed `AlertMessage`. |
| 2026-09-11 | Grok worker TASK-564 | Completed. `AlertMessage` now announces with `role="alert"`. Converted Signup, Events, EventsElements, PhotoSubmitModal, ClaimModal, ServicesElements, MarketplaceElements, ProfileInfo, ReviewQueue. Left field-level errors for TASK-563, W/L pills, danger buttons, Tournament.tsx, the TournamentElements crash fallback, and the RR conversion warning (checkbox). |
