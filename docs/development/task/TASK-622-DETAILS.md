# TASK-622-DETAILS

|                |                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-622                                                                                                                                                          |
| **Title**      | Stand up the staging Firebase project                                                                                                                             |
| **TLDR**       | An isolated staging project with hosting, rules, and functions deployed, a shareable *.web.app URL, and no production alias as CLI default. Critical path for M5. |
| **Status**     | new                                                                                                                                                               |
| **Tags**       | Staging, Firebase, QA                                                                                                                                             |
| **Sprint**     | DC06 Spiderman                                                                                                                                                    |
| **Legacy ids** | BLG0022, M5, VISION §4 / §11                                                                                                                                      |
| **Blocked by** | None                                                                                                                                                              |

## Detail

**After.** An isolated staging project with hosting, rules, and functions deployed, a shareable *.web.app URL, and no production alias as CLI default. Critical path for M5.

**Acceptance.** Shareable staging URL exists. Deploy is explicit-project and approval-gated. Emulator remains the local bench.

**Planning source.** `docs/planning/VISION.md` — behaviour lives there. This file tracks status only. No code in this tracker.

**Phase.** M5

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

| Date | Who | Note |
| ---- | --- | ---- |
|      |     |      |
