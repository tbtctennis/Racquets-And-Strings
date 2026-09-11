# TASK-550-DETAILS

|                |                                           |
| -------------- | ----------------------------------------- |
| **Task id**    | TASK-550                                  |
| **Title**      | Expanded-row behaviour                    |
| **TLDR**       | One expanded-row behaviour; one highlight |
| **Status**     | completed                                  |
| **Tags**       | UI                                        |
| **Sprint**     | DC06 Spiderman                            |
| **Legacy ids** | D7-CS21-T1                                |
| **Blocked by** | None                                      |

## Detail

**Today.** Expanded rows behave differently per surface and the member's own row highlights twice

**After.** One expanded-row behaviour; one highlight

**Acceptance.** Expansion behaves identically across surfaces · the own-row highlight appears once

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
| 2026-09-02 | Codex | Wave 2 dispatch gate cleared by the green D6 verification commit; ready for dispatch after TASK-542. |
| 2026-09-11 | Grok worker TASK-550 | Started. Aligning one-at-a-time expansion across player-row lists and removing the Community board's extra own-row tint. Planning CS-21 suggested a `Set`; Matches, RR, and Profile already use a single id — follow current code. Leaderboard rows keep `PlayerCard` (rank, `isYou`, stats drawer shared with Matches); `PersonRow` expand stays on RR (out of file ownership). |
| 2026-09-11 | Grok worker TASK-550 | Done. `useExpandedRow` is the one disclosure (single id, tap again to close) on Leagues tournament/community and Matches. Community board uses the same `ListGroup` as tournament; wrapper `bg-tennis-surface/30` and duplicate `bg-clay/10` removed so `PlayerCard isYou` is the only own-row tint. Tests: `tests/unit/expandedRow.test.mjs`. `npm run verify` left to the coordinator. Tracker not edited. |
