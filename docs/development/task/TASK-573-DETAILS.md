# TASK-573-DETAILS

|                |                                           |
| -------------- | ----------------------------------------- |
| **Task id**    | TASK-573                                  |
| **Title**      | `ProgressRing` reuse                      |
| **TLDR**       | All three use the existing `ProgressRing` |
| **Status**     | completed                                 |
| **Tags**       | UI                                        |
| **Sprint**     | DC06 Spiderman                            |
| **Legacy ids** | D7-CS30-T1                                |
| **Blocked by** | TASK-502 (D6-C1-T1)                       |

## Detail

**Today.** Tasks header, Initiation accordion and RR group card each draw their own progress

**After.** All three use the existing `ProgressRing`

**Acceptance.** All three use it

**Exit adds.** The RR ring needs **D6-C1-T1** — no ring beside a shut gate

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
- `docs/planning/tasks/TASKS-D6.md`
- `docs/planning/sprints/d6-d9/SPRINT-D6.md`
- `docs/planning/sprints/d1-d5/IMPLEMENTATION-REVIEW.md`
- `docs/domain/TOURNAMENT_RULES.md`
- `docs/domain/SCORING_AND_POINTS.md`
- `docs/architecture/DATA_MODEL.md`
- `docs/planning/tasks/TASKS-D7.md`
- `docs/planning/sprints/d6-d9/SPRINT-D7.md`
- `docs/planning/specs/2026-08-31-m2-uiux-simplification-spec.md`

## Comments

| Date       | Who                  | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-11 | Grok worker TASK-573 | Started. Docs vs code: CS-31 named the Tasks _category_ header; D7-CS30-T1 / SPRINT-D7 name the Tasks _page_ header. Current code already uses `ProgressRing` there (`Member progress`). Category headers still show pts totals — left alone. CS-30's 36×36 / `size="sm"` API is not the shipped component (`viewBox 0 0 44 44`, numeric `size`, default 44). Followed current `ProgressRing` and passed `size={32}` in compact slots. Initiation accordion lived in `Tasks.tsx`, not a separate file. |
| 2026-09-11 | Grok worker TASK-573 | Completed. Tasks header, Initiation accordion, and RR group-card header now all consume `ProgressRing`. RR ring uses `realRoundRobinMatches` so a one-player placeholder cannot read 100% (D6-C1-T1 / TASK-502). Bonus `Switch` and `PersonRow` unchanged. Tests in `tests/unit/progressRing.test.mjs`. Tracker update and `npm run verify` left to the coordinator.                                                                                                                                   |
