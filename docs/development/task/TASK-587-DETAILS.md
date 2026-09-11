# TASK-587-DETAILS

|                |                                                         |
| -------------- | ------------------------------------------------------- |
| **Task id**    | TASK-587                                                |
| **Title**      | Consent line                                            |
| **TLDR**       | Signup and event join each say so in one plain sentence |
| **Status**     | completed                                              |
| **Tags**       | UI, Auth                                                |
| **Sprint**     | DC06 Spiderman                                          |
| **Legacy ids** | D7-CON-T1                                               |
| **Blocked by** | None                                                    |

## Detail

**Today.** A shared draw carries participant contacts and nobody is told

**After.** Signup and event join each say so in one plain sentence

**Acceptance.** Both surfaces carry the line · the wording matches · nothing else on either screen changes

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

| Date       | Who        | Note                                                                                                                                                                                                                          |
| ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build | Started. One shared sentence at signup and JoinEventSheet. Wording follows VISION §10.4 (a shared draw carries contact details) without legalizing in-app channel rules.                                                      |
| 2026-09-11 | Grok Build | Both surfaces import `SHARED_DRAW_CONSENT`. Sentence: "A shared draw includes your contact details so other participants can reach you." Focused test `tests/unit/sharedDrawConsent.test.mjs`. Verify not run per assignment. |
