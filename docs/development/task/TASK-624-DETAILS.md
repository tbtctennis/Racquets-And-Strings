# TASK-624-DETAILS

|                |                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-624                                                                                                                                            |
| **Title**      | Seed staging from the live snapshot, contacts included                                                                                              |
| **TLDR**       | The migrated snapshot seeds staging as-is. Contact visibility stays gated by connections. Needed to prove download-and-share with real-shaped data. |
| **Status**     | new                                                                                                                                                 |
| **Tags**       | Staging, Data, Firebase                                                                                                                             |
| **Sprint**     | DC06 Spiderman                                                                                                                                      |
| **Legacy ids** | VISION §4, VISION §10.2                                                                                                                             |
| **Blocked by** | TASK-622 (Stand up the staging Firebase project)                                                                                                    |

## Detail

**After.** The migrated snapshot seeds staging as-is. Contact visibility stays gated by connections. Needed to prove download-and-share with real-shaped data.

**Acceptance.** Staging holds the snapshot. A beta member without a connection cannot see another member's contacts.

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
