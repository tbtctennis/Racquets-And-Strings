# TASK-560-DETAILS

|                |                   |
| -------------- | ----------------- |
| **Task id**    | TASK-560          |
| **Title**      | One drawer layout |
| **TLDR**       | One layout        |
| **Status**     | completed         |
| **Tags**       | UI                |
| **Sprint**     | DC06 Spiderman    |
| **Legacy ids** | D7-CS15-T1        |
| **Blocked by** | None              |

## Detail

**Today.** Expanded drawers differ per surface

**After.** One layout

**Acceptance.** Every drawer uses it

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

| Date       | Who         | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok worker | Started. CS-15 cites PlayerCard.tsx:165 (2-col, odd spans) vs RRGroupCard.tsx:260 (fixed 4-col); current code has drifted to PlayerCard ~174 and RRGroupCard ~396. PlayerCard already used StatGrid with custom tiles; RR still uses `grid-cols-4`. Follow CS-15: StatGrid owns the cluster, one drawer layout, four tiles form a 2×2.                                                                                                                                                                                                              |
| 2026-09-11 | Grok worker | TASK-560. Added `DrawerLayout` / `DrawerTile`. StatGrid stays the grid; the layout pins two columns so 4 tiles are 2×2 and an odd trailing tile spans the row. PlayerCard expanded drawers now render through it (Leagues / Matches / Profile inherit). RRGroupCard.tsx is owned by another worker this wave, so its 4-col standings drawer is left for that owner to switch onto `DrawerLayout`. Design-sync registered with light/dark 360px preview. Targeted tests in tests/unit/drawerLayout.test.mjs. npm run verify left to the coordinator. |
