# TASK-594-DETAILS

|                |                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------- |
| **Task id**    | TASK-594                                                                                  |
| **Title**      | Store what was paid                                                                       |
| **TLDR**       | The server records `points_winner` / `points_loser` on the match and the table reads them |
| **Status**     | completed                                                                                 |
| **Tags**       | UI                                                                                        |
| **Sprint**     | DC06 Spiderman                                                                            |
| **Legacy ids** | D7-G6-T1                                                                                  |
| **Blocked by** | None                                                                                      |

## Detail

**Today.** Two payout tables straddle the server/browser boundary, and the group table adds a bonus nobody received

**After.** The server records `points_winner` / `points_loser` on the match and the table reads them

**Acceptance.** `matchAward` is gone from `src/` · the group table reads stored figures · a rescore updates them · one payout table remains

**Exit adds.** **Do last** — it touches the scoring path; keep it away from the visual sweeps

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

| Date       | Who                   | Note |
| ---------- | --------------------- | ---- |
| 2026-09-11 | Grok Build · TASK-594 | Started. D7-G6-T1: store `points_winner` / `points_loser` from the server payout, drop `matchAward` from `src/`. |
| 2026-09-11 | Grok Build · TASK-594 | Server writes `points_winner` / `points_loser` on apply and withdrawal; group table reads stored figures; `matchAward` removed from `src/`. Tests: `node --import tsx --test tests/unit/domain.test.mjs` and `node --test functions/test/tournamentResult.test.js` pass. Verify left to coordinator. |
