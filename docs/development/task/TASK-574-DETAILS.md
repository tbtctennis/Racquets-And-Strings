# TASK-574-DETAILS

|                |                        |
| -------------- | ---------------------- |
| **Task id**    | TASK-574               |
| **Title**      | Honest loading         |
| **TLDR**       | Both are indeterminate |
| **Status**     | completed             |
| **Tags**       | UI                     |
| **Sprint**     | DC06 Spiderman         |
| **Legacy ids** | D7-CS34-T1             |
| **Blocked by** | None                   |

## Detail

**Today.** Two loading percentages are fabricated

**After.** Both are indeterminate

**Acceptance.** Neither shows a made-up number

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

| Date       | Who                  | Note |
| ---------- | -------------------- | ---- |
| 2026-09-11 | Grok Build · coordinator | Coordinator: Batch A dispatched on isolated branch agent/spiderman-w2-TASK-574. |
| 2026-09-11 | Grok Build · spiderman | Two fabricated percents: Court Map `useCourtData` 0/40/70/100, Tournament `LoadingBar` 20/45/75. Both are now indeterminate. `Tournament.tsx` was not edited (exclusive); leftover `progress` on `LoadingBar` is ignored so that caller shows no number. Services `pct` is real bounded progress toward `MIN_REWARD_COST` — left alone. Uploads in `PhotoSubmitModal` / marketplace left alone. |
