# TASK-638-DETAILS

|                |                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-638                                                                                            |
| **Title**      | Runtime-editable court and zone resolution                                                          |
| **TLDR**       | Admins can add a court, resolve its zone, and audit the change without editing shipped source data. |
| **Status**     | completed                                                                                           |
| **Tags**       | Data, Firebase, UI                                                                                  |
| **Sprint**     | DC06 Spiderman                                                                                      |
| **Legacy ids** | BLG0012                                                                                             |
| **Blocked by** | None                                                                                                |

## Detail

**After.** Admins can add a court, resolve its zone, and audit the change without editing shipped source data.

**Acceptance.** Admins can add a court, resolve its zone, and audit the change without editing shipped source data.

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
- `firestore.rules`
- `docs/architecture/AUTHORIZATION_MODEL.md`

## Comments

| Date       | Who                    | Note                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-01 | Anuj Raja · Grok Build | Promoted into DC06 Spiderman: can be done on the emulator before M5 staging is live.                                                                                                                                                                                                                                                                                                |
| 2026-09-11 | Grok Build · worker    | Started. Shipped CSV/`courts.json` remain the static roster; `courts/{id}` is check-ins, not the map. Runtime overlay is `court_resolutions` plus audit. Unmapped-court notification is still absent (D6 F2); this item is the admin add/resolve/audit path.                                                                                                                        |
| 2026-09-11 | Grok Build · worker    | Super-admin callable `resolveCourtZone` writes `court_resolutions` + `court_resolution_audit`. Zone/location overlay the shipped roster. Tasks panel adds a court, assigns a zone, and lists the audit. Tests: `tests/unit/courtResolution.test.mjs`, `functions/test/courtResolution.test.js`, `tests/rules/firestore.courtResolutions.test.mjs`. Tracker left to the coordinator. |
