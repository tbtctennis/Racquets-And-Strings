# TASK-590-DETAILS

|                |                                                                                  |
| -------------- | -------------------------------------------------------------------------------- |
| **Task id**    | TASK-590                                                                         |
| **Title**      | Download Draw                                                                    |
| **TLDR**       | A real organizer control gives the draw **and** participant contacts in one file |
| **Status**     | completed                                                                        |
| **Tags**       | UI                                                                               |
| **Sprint**     | DC06 Spiderman                                                                   |
| **Legacy ids** | D7-DDW-T1                                                                        |
| **Blocked by** | None                                                                             |

## Detail

**Today.** The only "Download the draw" is an error-boundary fallback

**After.** A real organizer control gives the draw **and** participant contacts in one file

**Acceptance.** The organizer downloads draw plus contacts · a non-organizer cannot · the fallback is untouched

**Exit adds.** Beta ships this simple version. The **View Draw** remodel, several versions of the same draw each with its own download, is a during or post beta change, not a reason to hold this

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

| Date       | Who                   | Note                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · TASK-590 | Started. Current `Tournament.tsx` already has the organizer Download Draw sheet (`downloadRoundAsPng` / `downloadRRGroupsAsPng` with `userMap`, "Names and contacts"). `TournamentHeader` is `isCreator`-only at the component and the call site (`!pastMode && isCreator`). Error-boundary copy in `TournamentElements` is untouched. Contacts already live on `RRContactMap` in `bracketImage.ts`. |
| 2026-09-11 | Grok Build · TASK-590 | Already complete — no product-code change. Proof: `node --import tsx --test tests/unit/downloadDraw.test.mjs`. Organizer sees Manage Draw / Download Draw; non-organizer gets empty header; round and group PNG SVG include phone; fallback still reads "Download the draw to view it offline." Verify left to coordinator.                                                                          |
