# TASK-568-DETAILS

|                |                               |
| -------------- | ----------------------------- |
| **Task id**    | TASK-568                      |
| **Title**      | `Switch` everywhere           |
| **TLDR**       | All use the existing `Switch` |
| **Status**     | completed                     |
| **Tags**       | UI                            |
| **Sprint**     | DC06 Spiderman                |
| **Legacy ids** | D7-MF13-T1                    |
| **Blocked by** | None                          |

## Detail

**Today.** Three verbatim-duplicated toggles

**After.** All use the existing `Switch`

**Acceptance.** No duplicated toggle remains

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
| 2026-09-11 | Grok worker | Started TASK-568. Three verbatim peer-checked clay pills: RRGroupCard group bonus, ProfileInfo ContactMethodToggle, ProfileInfo Email Notifications. ProfileCard Available/Away is a different pill button, not a duplicate. Tasks.tsx checkboxes left for TASK-567. |
| 2026-09-11 | Grok worker | Migrated the three duplicated toggles onto the existing `Switch`. No peer-checked clay pill remains. Targeted tests in `tests/unit/switch.test.mjs`. `npm run verify` and tracker update left to the coordinator. |
