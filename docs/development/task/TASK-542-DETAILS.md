# TASK-542-DETAILS

|                |                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| **Task id**    | TASK-542                                                                                                     |
| **Title**      | One name formatter                                                                                           |
| **TLDR**       | One formatter title-cases, keeps the fallback, and keeps the `PLAYER_LOADING` / `BYE` / `Winner of …` guards |
| **Status**     | completed                                                                                                    |
| **Tags**       | UI                                                                                                           |
| **Sprint**     | DC06 Spiderman                                                                                               |
| **Legacy ids** | D7-CS1-T1                                                                                                    |
| **Blocked by** | None                                                                                                         |

## Detail

**Today.** Three formatters exist. `formatPersonName` trims but does **not** title-case, so six members render `blake bell` on a row and `Blake Bell` on the leaderboard

**After.** One formatter title-cases, keeps the fallback, and keeps the `PLAYER_LOADING` / `BYE` / `Winner of …` guards

**Acceptance.** Every surface renders `Blake Bell` · the bracket still renders `BYE` and `Winner of QF1`, not `Bye` / `Winner Of Qf1` · `toTitleCase` and `formatPlayerName` are deleted and every call site moved

**Exit adds.** **Blocks six components — do first**

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
| 2026-09-02 | Codex | Verified the canonical formatter title-cases ordinary names, preserves fallback and bracket sentinels, and all call sites use it. Focused name-formatting tests pass. |
