# TASK-652-DETAILS

|                |                                                                                    |
| -------------- | ---------------------------------------------------------------------------------- |
| **Task id**    | TASK-652                                                                           |
| **Title**      | Reconcile unique residual commits from stale local planning worktrees              |
| **TLDR**       | Compare unique commits with the working branch; keep only missing valid behaviour. |
| **Status**     | completed                                                                          |
| **Tags**       | Docs, Planning                                                                     |
| **Sprint**     | DC06 Spiderman                                                                     |
| **Legacy ids** | BLG0045                                                                            |
| **Blocked by** | None                                                                               |

## Detail

**After.** Compare unique commits with the working branch; keep only missing valid behaviour.

**Acceptance.** Compare unique commits with the working branch; keep only missing valid behaviour.

**Planning source.** `docs/planning/history/BACKLOG-BLG.md` — behaviour lives there. This file tracks status only. No code in this tracker.

## Findings

Compared unique commits from the legacy `codex/*` planning worktrees and the leftover
`docs/planning` continuation against the original BLG0045 baseline (`origin/dev-anuj` @
`ac4dfb1c`) and the current working branch (`spiderman` @ `44553f6b`). No missing valid
behaviour. Nothing cherry-picked.

### Sources checked

| Ref                        | Tip        | Unique vs `dev-anuj` | Unique vs successor / `dev-anuj` |
| -------------------------- | ---------- | -------------------: | -------------------------------- |
| `origin/codex/sprint-1-d1` | `6e5234cd` |                    0 | 0 vs D2 (`9325b3a6`)             |
| `origin/codex/sprint-2-d2` | `9325b3a6` |                    0 | 0 vs D3                          |
| `origin/codex/sprint-3-d3` | `a92be2d0` |                    0 | 0 vs D4                          |
| `origin/codex/sprint-4-d4` | `a44ab8a4` |                    0 | 0 vs D5                          |
| `origin/codex/sprint-5-d5` | `1d97d56f` |                    0 | 0 vs `dev-anuj`                  |
| `origin/docs/planning`     | `cc9709a6` |                   12 | post-D5 planning corpus          |

No leftover local `codex/*` worktrees or unpushed planning branches exist in this environment.
Sprint D1–D5 merge records already fast-forwarded each isolated branch into `dev-anuj`. Histories
do not share SHAs with `spiderman` (public-repo snapshot), so uniqueness was judged by ancestry
against `dev-anuj` plus file-level leftovers against current `spiderman`.

### Unique commits on `origin/docs/planning` vs `dev-anuj`

These twelve commits are the 2026-08-25…31 planning continuation (VISION, 2026-08-29 rulings,
D6–D9, architecture/verify repairs). Their living files are already on `spiderman` at the
reorganized paths (`docs/planning/decisions/`, `docs/planning/deferred/`,
`docs/planning/sprints/d6-d9/`, `docs/planning/sprints/d1-d5/IMPLEMENTATION-REVIEW.md`).

| SHA        | Subject                                                                     | Disposition                                      |
| ---------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| `3bd6b0e3` | docs: review of sprints D1-D5, and two follow-up sprints                    | Kept as `sprints/d1-d5/IMPLEMENTATION-REVIEW.md` |
| `473499f3` | emulator setup + sprint changes                                             | Code and DATA_SHAPE already on `spiderman`       |
| `3c420fe0` | merge: emulator setup + sprint changes                                      | Merge of the above                               |
| `d9816c6f` | decisions: record the 2026-08-29 rulings and revise D6-D8                   | Current `decisions/DECISIONS-2026-08-29.md`      |
| `f9e15e0a` | decisions: streak derived, no inactive state, unplayed rally pays nothing   | Same rulings file                                |
| `9d2c495a` | plan: fold the code review findings into the rulings and sprints            | Same; `shape-reference.mjs` present              |
| `070227f1` | decisions: correct the withdrawal payout                                    | Same                                             |
| `f930dc0a` | docs: merge the gap rulings into the vision                                 | Current `VISION.md`                              |
| `12a02029` | docs: reconcile the design documents with the final vision                  | Current architecture/domain docs                 |
| `23ee8e19` | plan: break jobs into tasks and wire the agents to the vision               | Current D6–D9 / tasks package                    |
| `2f5e3ad2` | plan: break every sprint into tasks with acceptance and exit criteria       | Current `tasks/TASKS-D*.md` and specs            |
| `cc9709a6` | docs: correct the architecture record and repair the verification baselines | Current architecture + `comparison-base.mjs`     |

### Discarded or superseded leftovers

Files that still exist on a stale tip but not on `spiderman` were compared against current code
and later Spiderman tasks. None is missing valid behaviour.

| Leftover                                                             | Why discarded                                                                             |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `docs/ACTION-REPORT.md` and other D1–D5 originals                    | Archived under `docs/planning/history/planning-2026-08-23/` (BLG0044)                     |
| `docs/planning/IMPLEMENTATION-REVIEW.md`                             | Same review at `docs/planning/sprints/d1-d5/IMPLEMENTATION-REVIEW.md` (links/format only) |
| `src/pages/NotFound.tsx`                                             | Removed by TASK-516 / D6-C11-T1; catch-all is `<Navigate to="/" replace />`               |
| `functions/lib/groupLessonAccess.js` + tests                         | Removed by TASK-511 / D6-C8-T1                                                            |
| `functions/lib/redemptionLock.js` + tests                            | Removed by TASK-511 / D6-C8-T1                                                            |
| `functions/test/friendlyResult.test.js`                              | Vocabulary ruling: `friendly` → `rally`; current `functions/test/rallyResult.test.js`     |
| `src/components/Stepper.tsx` (D1 only)                               | Deleted D2 R-5; already recorded superseded on TASK-650                                   |
| `src/features/profile/components/CompleteProfileModal.tsx` (D3 only) | Removed when Matches stopped gating on profile completion                                 |

`origin/version-0` is not a planning worktree. No `staging-setup` branch and no
`ELEMENT-DESIGN-BRIEFS.md` are present on this origin; that deferred note is unchanged.

### Docs vs current code (recorded, not restored)

Follow current code. Restoring the leftovers would reverse completed D6 work.

- `docs/domain/REWARDS_RULES.md` still names `functions/lib/redemptionLock.js`.
- `docs/engineering/MAINTAINABILITY.md` D5 note still says "a real 404 route".

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

| Date       | Who                    | Note                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-01 | Anuj Raja · Grok Build | Promoted into DC06 Spiderman: can be done on the emulator before M5 staging is live.                                                                                                                                                                                                                                                                          |
| 2026-09-11 | Grok Build · worker    | Started. BLG0045: compare unique `codex/*` residual commits with the working branch; keep only missing valid behaviour. Coordinator owns the tracker.                                                                                                                                                                                                         |
| 2026-09-11 | Grok Build · worker    | Compared `origin/codex/sprint-1-d1`…`sprint-5-d5` and `origin/docs/planning` with `dev-anuj` and `spiderman`. All five sprint branches have 0 unique commits vs `dev-anuj`. The 12 unique `docs/planning` commits are already the current planning corpus. Leftover files are archived or reversed by TASK-511 / TASK-516. Nothing taken. Tracker not edited. |
