# TASK-643-DETAILS

|                |                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-643                                                                                            |
| **Title**      | Past-bookings section                                                                               |
| **TLDR**       | Completed and cancelled bookings appear below open bookings with stable ordering and status labels. |
| **Status**     | completed                                                                                          |
| **Tags**       | UI                                                                                                  |
| **Sprint**     | DC06 Spiderman                                                                                      |
| **Legacy ids** | BLG0018                                                                                             |
| **Blocked by** | None                                                                                                |

## Detail

**After.** Completed and cancelled bookings appear below open bookings with stable ordering and status labels.

**Acceptance.** Completed and cancelled bookings appear below open bookings with stable ordering and status labels.

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

| Date       | Who                    | Note                                                                                                                                                                                                                                                             |
| ---------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-01 | Anuj Raja · Grok Build | Promoted into DC06 Spiderman: can be done on the emulator before M5 staging is live.                                                                                                                                                                             |
| 2026-09-11 | Grok Build · worker    | Started. Services listed open coupons only; bookings had no member list. Follow WDR §8: completed and cancelled under open bookings, stable order, status labels.                                                                                                |
| 2026-09-11 | Grok Build · worker    | Member bookings on Services: open (lead, in_progress) then Past bookings (completed, cancelled). Newest-first with id tie-break. Labels Booked / In progress / Completed / Cancelled. Tests: `tests/unit/bookingList.test.mjs`. Tracker left to the coordinator. |
