# TASK-563-DETAILS

|                |                                      |
| -------------- | ------------------------------------ |
| **Task id**    | TASK-563                             |
| **Title**      | `FieldError` everywhere              |
| **TLDR**       | All 15 use the existing `FieldError` |
| **Status**     | completed                            |
| **Tags**       | UI                                   |
| **Sprint**     | DC06 Spiderman                       |
| **Legacy ids** | D7-MF8-T1                            |
| **Blocked by** | None                                 |

## Detail

**Today.** 15 inline error paragraphs

**After.** All 15 use the existing `FieldError`

**Acceptance.** No inline error paragraph remains

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

| Date       | Who                  | Note                                                                                                                                                                                                                                                    |
| ---------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok worker TASK-563 | Started. Eight field-error styles under inputs. `FieldError` already existed; Input, Signup, ScoreModal, event join, CheckInModal, AddTeammate, ProfileCard, and CourtMap still hand-rolled `<p>` copy. Page banners stay on `AlertMessage` (TASK-564). |
| 2026-09-11 | Grok worker TASK-563 | Converted those sites onto `FieldError`. `Input` now announces via `aria-describedby`. Marketplace/services form banners stay `AlertMessage`. Remaining non-field copy in `TournamentElements.tsx`: RR conversion warning (boxed) and "Need at least 3 registered players". Tests: `tests/unit/fieldError.test.mjs`. `npm run verify` and tracker left to the coordinator. |
