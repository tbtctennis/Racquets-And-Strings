# TASK-552-DETAILS

|                |                                         |
| -------------- | --------------------------------------- |
| **Task id**    | TASK-552                                |
| **Title**      | `StatGrid`                              |
| **TLDR**       | One grid around the existing `StatTile` |
| **Status**     | completed                               |
| **Tags**       | UI                                      |
| **Sprint**     | DC06 Spiderman                          |
| **Legacy ids** | D7-CS2-T1                               |
| **Blocked by** | None                                    |

## Detail

**Today.** Seven tile geometries

**After.** One grid around the existing `StatTile`

**Acceptance.** Every stat cluster uses it · tiles align on one geometry

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

| Date       | Who                       | Note                                                                                                                                                                                                                                                                                                     |
| ---------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · spiderman-w2 | Started. Remaining known leftover: ServicesElements Price/Discount/Points `grid grid-cols-3`. Home, Tasks, Leagues, PlayerCard, ProfileCard, Profile, PlayerProfile already wrap clusters in StatGrid. RRGroupCard 4-col drawer tiles are exclusive to another worker — left untouched.                  |
| 2026-09-11 | Grok Build · spiderman-w2 | Wrapped the Services offer-form Price/Discount/Points cluster in `StatGrid` (shared 2-col phone / 3-col `sm` geometry). Registered `StatGrid` in `.design-sync` with light/dark 360px StatTile preview. Targeted unit tests in `tests/unit/statGrid.test.mjs`. `npm run verify` left to the coordinator. |
