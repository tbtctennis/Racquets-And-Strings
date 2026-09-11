# TASK-570-DETAILS

|                |                  |
| -------------- | ---------------- |
| **Task id**    | TASK-570         |
| **Title**      | Field chrome     |
| **TLDR**       | One field chrome |
| **Status**     | completed       |
| **Tags**       | UI               |
| **Sprint**     | DC06 Spiderman   |
| **Legacy ids** | D7-MF7-T1        |
| **Blocked by** | None             |

## Detail

**Today.** Label, asterisk, hint, error and spacing differ per form

**After.** One field chrome

**Acceptance.** Every field follows it

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

| Date       | Who                 | Note |
| ---------- | ------------------- | ---- |
| 2026-09-11 | Grok Build · worker | Started. Native dropdowns are already SelectSheet (TASK-569). Remaining mix is label/asterisk/hint/error/spacing plus hand-rolled text field classes. Use Input `field` chrome for remaining text fields. Do not revert SelectSheet; do not edit index.css, map/clay tokens, functions, or charts. |
| 2026-09-11 | Grok Build · worker | Exported `fieldHintCls` / `fieldRequiredCls` / `fieldErrorBorderCls` from Input; Signup passwords use Input `endAdornment`. Remaining text fields (except map overlay, hidden files, and transparent bracket deadlines) consume `field`. Tests: `tests/unit/fieldChrome.test.mjs`. Tracker and `npm run verify` left to the coordinator. |
