# TASK-548-DETAILS

|                |                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-548                                                                                                                        |
| **Title**      | `initialOf` and avatars                                                                                                         |
| **TLDR**       | One `initialOf`. **Every player row shows a 24px avatar before the name**, and the profile card uses 96px. No other size exists |
| **Status**     | completed                                                                                                                        |
| **Tags**       | UI                                                                                                                              |
| **Sprint**     | DC06 Spiderman                                                                                                                  |
| **Legacy ids** | D7-CS17-T1                                                                                                                      |
| **Blocked by** | None                                                                                                                            |

## Detail

**Today.** Three first-initial implementations. Navbar avatars are 20px and provider 24px, and player rows carry no avatar at all

**After.** One `initialOf`. **Every player row shows a 24px avatar before the name**, and the profile card uses 96px. No other size exists

**Acceptance.** One implementation remains · every player row renders a 24px avatar ahead of the name · the profile card renders 96px · no third size appears · rows still fit 360px with the avatar in place

**Exit adds.** Needs CS1-T1

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
| 2026-09-02 | Codex | Unified row/profile avatar rendering and `initialOf`; verified 24px row and 96px profile sizes with focused tests and typecheck. |
