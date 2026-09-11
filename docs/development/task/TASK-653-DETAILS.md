# TASK-653-DETAILS

|                |                                                                                     |
| -------------- | ----------------------------------------------------------------------------------- |
| **Task id**    | TASK-653                                                                            |
| **Title**      | Obtain four independent same-SHA approvals                                          |
| **TLDR**       | Engineering, security, QA, and onboarding reviews approve the same verified commit. |
| **Status**     | backlog                                                                             |
| **Tags**       | QA, Planning                                                                        |
| **Sprint**     | backlog                                                                             |
| **Legacy ids** | BLG0050                                                                             |
| **Blocked by** | None                                                                                |

## Detail

**After.** Engineering, security, QA, and onboarding reviews approve the same verified commit.

**Acceptance.** Engineering, security, QA, and onboarding reviews approve the same verified commit.

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

| Date | Who | Note |
| ---- | --- | ---- |
|      |     |      |
