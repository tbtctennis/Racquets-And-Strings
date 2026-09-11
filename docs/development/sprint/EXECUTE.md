# Execute DC06 Spiderman

This is the runbook. Saying **execute sprint spiderman** means: follow this file.

**As of 2026-09-11 on `main`:** waves 0–5 are landed (146 / 167). Remaining work is listed in
[NOW.md](../NOW.md) — do not restart Wave 0. Wave 6 (staging) waits for an isolated Firebase
project. The coordinator still owns dispatch, integration, the tracker, and the gate.

## Files to read first (every session)

Read in this order before touching code:

| Order | File                                                   | Why                                                     |
| ----- | ------------------------------------------------------ | ------------------------------------------------------- |
| 1     | [../../../AGENTS.md](../../../AGENTS.md)               | How this branch works                                   |
| 2     | This file                                              | Waves and failure rule                                  |
| 3     | [SPIDERMAN-PLANNING.md](SPIDERMAN-PLANNING.md)         | Sprint planning and work design                         |
| 4     | [tracking/SPIDERMAN-TRACKER.md](tracking/SPIDERMAN-TRACKER.md) | Complete inventory and current status              |
| 5     | [../LEGACY-TO-MODERN.md](../LEGACY-TO-MODERN.md)       | Claude/D-sprint/BLG → TASK/BUG                          |
| 6     | `docs/planning/VISION.md`                              | Platform, roles, M0–M9, vocabulary                      |
| 7     | `docs/planning/decisions/DECISIONS-2026-08-29.md`      | Behaviour rulings                                       |
| 8     | `docs/planning/specs/2026-08-31-vision-gaps-design.md` | Later rulings                                           |
| 9     | The item’s **Read first** list on its details file     | Job-level before/after                                  |
| 10    | Current code those docs name                           | Docs can be stale; code wins if you record the conflict |

Then open **only** the current `TASK-n-DETAILS.md` or `BUG-n-DETAILS.md`.

## Parallel operating model

At the start of each wave, the coordinator:

1. Reads the planning and tracking files, validates dependencies, and creates a dispatch list containing only unblocked items.
2. Groups work by exclusive file ownership. A worker may receive one item or a tightly coupled group only when the details explicitly require it.
3. Assigns 6–10 workers (or all available capacity), recording item id, worker, branch, worktree, owned files, dependencies, and test command in the dispatch log. No two workers may edit the same file unless the coordinator has explicitly serialized that file.
4. Holds shared planning/tracking files, `AGENTS.md`, runbooks, package manifests, lockfiles, and configuration files for coordinator-only edits. Workers report status and findings to the coordinator; they do not edit shared trackers.
5. Resolves contradictory dependencies or stale status before dispatch. A cycle blocks the affected items until the coordinator records the ruling; it is never bypassed by guessing.

Each worker starts from the latest verified `spiderman` commit in an isolated worktree and branch named `agent/spiderman-w<N>-<item-id>`. Workers must stay within their assigned files, read the item fully, implement only the scoped change, run targeted tests, and commit an issue-sized change. Workers must not push directly to `spiderman`, rebase another worker's branch, or modify another worktree.

The coordinator integrates completed branches one at a time into `spiderman`, in dependency order. Before each integration, the coordinator checks the diff against the ownership assignment. After each batch, the coordinator runs the relevant combined tests and then `npm run verify`; only a green result advances the wave. A conflict, failed test, scope violation, or unexpected finding sends the branch back to its worker for a focused retry. The coordinator records the retry and does not mark the item completed until the integrated branch is green. The root `AGENTS.md` is the only agent contract and the tracker is the only live status board.

Workers may continue independently while the coordinator reviews other completed branches, but the next wave starts only from a verified `spiderman` commit. If an item becomes blocked, release its worker and dispatch another unblocked item; do not leave the wave waiting on an avoidable idle slot.

## Waves (do in order)

### Wave 0 — bugs first

Work remaining Spiderman bugs before any new feature task.

| ID                                   | Title                       | Status    | Notes                                                                    |
| ------------------------------------ | --------------------------- | --------- | ------------------------------------------------------------------------ |
| [BUG-501](../bug/BUG-501-DETAILS.md) | Score e2e used textbox      | completed | Fixed in repo setup commit 01                                            |
| [BUG-503](../bug/BUG-503-DETAILS.md) | Walkover e2e assertion      | completed | Fixed in repo setup commit 01                                            |
| [BUG-504](../bug/BUG-504-DETAILS.md) | Player-Loading placeholders | completed | Local. Ties to knockout gate TASK-502                                    |
| [BUG-505](../bug/BUG-505-DETAILS.md) | `next=` after login         | completed | Local. Pulled from backlog; no staging needed                            |
| [BUG-502](../bug/BUG-502-DETAILS.md) | Coach contact e2e           | blocked   | Needs lesson/coaching UI (TASK-512 / TASK-663). Leave skipped until then |

### Wave 1 — M1 / D6 (TASK-502 … TASK-541)

Five non-negotiables, location, one result model, partner pool. TASK-501 is already completed.

Source: `docs/planning/tasks/TASKS-D6.md`, `docs/planning/sprints/d6-d9/SPRINT-D6.md`.

### Wave 2 — M2 / D7 (TASK-542 … TASK-597)

Shared component set, consent line, download draw.

Source: `docs/planning/tasks/TASKS-D7.md`, `docs/planning/sprints/d6-d9/SPRINT-D7.md`, `docs/planning/specs/2026-08-31-m2-uiux-simplification-spec.md`.

### Wave 3 — M3 / D8 plus gaps (TASK-598 … TASK-609, TASK-626 … TASK-629)

Seeding, plus marketplace posting, tasks/rewards server payout, EXIF strip, in-app notification list.

Source: `docs/planning/tasks/TASKS-D8.md`, `docs/planning/sprints/d6-d9/SPRINT-D8.md`, VISION §11.

### Wave 4 — M4 / D9 (TASK-610 … TASK-621)

Stripe **test mode** only. No live money. No card data in the app. No Stripe key in `VITE_`.

Source: `docs/planning/tasks/TASKS-D9.md`, `docs/planning/sprints/d6-d9/SPRINT-D9.md`.

### Wave 5 — emulator-local backlog (promoted into this sprint)

Work that does **not** need a live staging project. Do after Waves 0–4, or in parallel only when it does not collide with an in-progress D6–D9 file.

Listed in [SPIDERMAN-PLANNING.md](SPIDERMAN-PLANNING.md) under Wave 5.

### Wave 6 — M5 staging live (wait)

Do **not** start until the owner names an isolated Firebase project id:

- TASK-622 stand up staging
- TASK-623 staging super-admin uid
- TASK-624 seed staging
- TASK-625 PWA on the staging URL

## Wave execution loop

1. Pick all `new` items in the current wave whose **Blocked by** is all `completed`; dispatch a non-conflicting batch to isolated workers.
2. The coordinator sets each dispatched item to `inprogress` and records date, worker, branch/worktree, ownership, and start status. Workers do not update the shared tracker.
3. Every worker reads its details file in full, then its **Read first** files, then the code named there.
4. Each worker implements only its assigned item and runs its targeted tests. It reports the test command, result, changed files, commit, and any blocker to the coordinator.
5. The coordinator reviews and integrates eligible commits into `spiderman`, resolving conflicts only when the resolution is mechanical and within the assigned scope.
6. Run the combined tests for the batch, then `npm run verify`. On failure, identify the responsible item, return it for a focused retry, and rerun the gate after reintegration.
7. **If something fails that the item did not already describe:**
   - Create `docs/development/bug/BUG-<next>-DETAILS.md`
   - Title the failure
   - Set **Related task** to the TASK/BUG you were on
   - Status `new`
   - Add a Comments row on both files
   - Add the bug to `bug/README.md` and the tracker
   - Leave the original item `blocked` if it cannot continue, else keep `inprogress` and fix in-place if it is the same scope
8. On success, the coordinator sets status `completed`, adds the completion comment, and updates tracker counts. Workers may not declare completion based on an unintegrated branch.
9. Repeat dispatch and integration until every eligible item in the wave is completed or explicitly blocked. Clean up merged worktrees/branches only after the integrated commit and tracker update are verified.

## End of sprint (after waves 0–5, and 6 if staging was given)

Update technical docs so they match the code, in one coordinator-owned pass after all eligible waves:

- `docs/architecture/` (system, data model, data flow, authorization, environments)
- `docs/domain/` (tournament, RR, scoring, rewards, contact privacy)
- `docs/engineering/` (local development, security baseline, maintainability)
- `docs/runbooks/` if a runbook changed
- `README.md` if setup commands changed

Do not rewrite `docs/planning/` history. Add a short note in `docs/development/README.md` that the sprint closed, with the commit SHA of the final green `npm run verify`. The coordinator closes Spiderman only when all in-scope items are `completed` or explicitly `blocked` with a documented external prerequisite, all integrated work is on `spiderman`, and the final verification is green.

## Never

- `git push upstream`
- `firebase deploy` without an explicit approved project
- Production project `toronto-tennis-league`
- Widening a task because a nearby file looks messy
- Inventing a `BLG####` or `D6-…` as a new working id
- Direct worker pushes or force-pushes to `spiderman`
- Letting multiple workers edit a shared tracker or the same file without serialization
- Marking an item completed before its commit is integrated and verified on `spiderman`
