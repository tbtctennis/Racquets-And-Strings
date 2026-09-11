# TASK-639-DETAILS

|                |                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-639                                                                                                      |
| **Title**      | One authoritative court roster from the shipped CSV                                                           |
| **TLDR**       | Decide the canonical source, generate derived lists, fail validation when counts drift. Duplicate of BLG0031. |
| **Status**     | completed                                                                                                     |
| **Tags**       | Data, QA                                                                                                      |
| **Sprint**     | DC06 Spiderman                                                                                                |
| **Legacy ids** | BLG0013                                                                                                       |
| **Blocked by** | None                                                                                                          |

## Detail

**After.** Decide the canonical source, generate derived lists, fail validation when counts drift. Duplicate of BLG0031.

**Acceptance.** Decide the canonical source, generate derived lists, fail validation when counts drift. Duplicate of BLG0031.

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
| 2026-09-11 | Grok Build · worker    | Started. Q-12: shipped CSV is canonical; generate `functions/courts.json` and `ZONE_COURT_COUNTS` from it. TASK-638 overlay stays off the CSV. Current drift: CSV 174 sites vs `courts.json` 173 keys (Parkway Valley Tennis Club is two parks). Follow CSV. |
| 2026-09-11 | Grok Build · worker    | CSV is the roster. `scripts/build-court-roster.mjs` writes the two derived files; tests fail on count drift. Colliding dropdowns get unique site keys. Check-in stamps those keys. Runtime overlay unchanged. Tests: `tests/unit/courtRoster.test.mjs`, `functions/test/memberLocation.test.js`. Tracker left to the coordinator. |
