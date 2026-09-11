# TASK-571-DETAILS

|                |                                                         |
| -------------- | ------------------------------------------------------- |
| **Task id**    | TASK-571                                                |
| **Title**      | `Skeleton`                                              |
| **TLDR**       | A skeleton inherits the radius and height of its target |
| **Status**     | completed                                              |
| **Tags**       | UI                                                      |
| **Sprint**     | DC06 Spiderman                                          |
| **Legacy ids** | D7-CS35-T1                                              |
| **Blocked by** | None                                                    |

## Detail

**Today.** Loading states do not match what they replace

**After.** A skeleton inherits the radius and height of its target

**Acceptance.** Each skeleton matches its target's shape

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
| 2026-09-11 | Grok Build · coordinator | Coordinator: Batch A dispatched on isolated branch agent/spiderman-w2-TASK-571. |
| 2026-09-11 | Grok Build · worker | Started. CS-35 specified fill `bg-fg/5`; dispatch asked for pulse tokens like `bg-fg/10`. Using `bg-fg/10` so the placeholder reads in light and dark. |
| 2026-09-11 | Grok Build · worker | Implemented `Skeleton` with `row`/`block` presets and `as` targets for ListRow/PersonRow/EntityCard. Registered in `.design-sync` (light and dark). Call site: Notifications list loading. Tests: `tests/unit/skeleton.test.mjs` (7 pass). Left `inprogress` for coordinator verify/integration. |
