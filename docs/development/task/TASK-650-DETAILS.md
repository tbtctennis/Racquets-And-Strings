# TASK-650-DETAILS

|                |                                                        |
| -------------- | ------------------------------------------------------ |
| **Task id**    | TASK-650                                               |
| **Title**      | Close remaining design-sync debt                       |
| **TLDR**       | Resolve or supersede every carried D1 design-sync row. |
| **Status**     | inprogress                                             |
| **Tags**       | UI, QA                                                 |
| **Sprint**     | DC06 Spiderman                                         |
| **Legacy ids** | BLG0041                                                |
| **Blocked by** | None                                                   |

## Detail

**After.** Resolve or supersede every carried D1 design-sync row.

**Acceptance.** Resolve or supersede every carried D1 design-sync row.

**Planning source.** `docs/planning/history/BACKLOG-BLG.md` — behaviour lives there. This file tracks status only. No code in this tracker.

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
- `docs/planning/history/BACKLOG-BLG.md`
- `docs/planning/deferred/DEFERRED-AND-FUTURE.md`

## Comments

| Date       | Who                    | Note                                                                                 |
| ---------- | ---------------------- | ------------------------------------------------------------------------------------ |
| 2026-09-01 | Anuj Raja · Grok Build | Promoted into DC06 Spiderman: can be done on the emulator before M5 staging is live. |
| 2026-09-11 | Grok Build · worker    | Started. Carried D1 rows: DC-16 Button preview, DC-18 13 previews + light cell + Target44, DC-19 grade Button/Input/PlayerCard. Follow current entry.tsx harness, not the uncommitted previews/ + .cache/review layout. |
| 2026-09-11 | Grok Build · worker    | Registered remaining D1 primitives (Button, Input, PlayerCard, Accordion, AlertMessage, AvailabilityPills, ContactOpponentButton, Fab, LoadingBar, NearbyPill, RacquetIcon, SegmentedControl, Sheet, Toast, Tree) with light/dark cells and Target44. Superseded: Stepper (deleted D2 R-5); DC-19 pendingGrade cache (never committed; current registrations are the living baseline); `.design-sync/previews/*.tsx` layout (superseded by entry.tsx). Button preview has no danger/primary/size=lg (DC-16). Tests: `tests/unit/designSyncD1.test.mjs`. Tracker not edited. |
