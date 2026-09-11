# Wave 1 closeout and Wave 2 readiness plan

Status: Wave 1 implementation complete; BUG-507 and BUG-508 resolved; final D6 closeout verification pending.
Branch: `spiderman`
Scope: D6/M1 (`TASK-502`–`TASK-541`) before D7 dispatch

## Close Wave 1

- [x] Review the recovered `IMG_6779.png` worker state and preserve the in-progress work.
- [x] Complete the remaining eligible D6 tasks: TASK-530–533, TASK-537–538, TASK-540.
- [x] Add location scoping for challenge/rally creation and result handling.
- [x] Complete the runtime `friendly` → `rally` migration.
- [x] Add partner-pool service, hooks, contact projection, join/leave behavior, and panel.
- [x] Add court selection and derived-zone behavior to the join sheet.
- [x] Update task details and the live Spiderman tracker.
- [x] Record the Rules failure as [BUG-507](../bug/BUG-507-DETAILS.md).
- [x] Resolve the missing docs comparison base: `ARCHITECTURE_BASE_SHA=origin/dev-anuj npm run docs:verify` passes.
- [x] Resolve BUG-507, or explicitly carry it as a release-blocking defect with owner/date.
- [x] Resolve BUG-508 with a clean pinned-Node/single-emulator integration run.
- [x] Run `npm run verify` successfully on the final integrated commit.
- [x] Update the D6 closure report with the final green SHA.
- [x] Commit the complete D6 closeout on `spiderman`.

### Current verification facts

- TypeScript, lint, formatting, design checks, Functions syntax, root tests, and Functions unit
  tests pass locally.
- Firestore Rules tests pass 35/36; the valid rally-report test fails with a Rules evaluator
  error. The same failure reproduces at the prior `c71147b7` checkpoint, so BUG-507 predates the
  recovered worker changes and remains a pre-existing D6 gate defect.
- `docs:verify` passes with `ARCHITECTURE_BASE_SHA=origin/dev-anuj`.
- Functions integration loads the renamed rally module but currently has 4/19 failures/timeouts;
  BUG-508 records the exact cases and the Node 26/emulator warnings.
- No staging, production, deploy, migration, or external push is authorized by this plan.

## Prepare Wave 2 without dispatching it

- [ ] Start only from the verified D6 `spiderman` commit.
- [ ] Read the D7 charter, D7 tracker rows, current UI source, and each task’s Read first list.
- [ ] Reconcile already-completed D7 tasks and skip them unless the D6 merge invalidates evidence.
- [ ] Inventory shared-file ownership before assigning workers; serialize `src/index.css`, shared
  components, tracker files, manifests, and documentation.
- [ ] Capture a D7 baseline: typecheck, lint, unit tests, emulator tests, build, and browser smoke.
- [ ] Define the D7 wave gate as the same local `npm run verify` gate plus visual QA for light mode,
  touch targets, keyboard labels, dialogs, 5.8-inch layouts, and the partner-pool card.
- [ ] Prepare worker branches/worktrees from the verified D6 SHA; do not create or dispatch them
  until the D6 gate is green.

## D7 sequencing to use after the gate

1. Person foundation: TASK-542, then TASK-543–551.
2. Cards, tiles, and rows: TASK-552–561.
3. Overlays, forms, and loading states: TASK-563–574.
4. Light-theme and accessibility sweeps: TASK-575–585, serializing shared stylesheets.
5. Vocabulary, partner-pool card, stats, labels, and copy: TASK-586–589 and TASK-591–597.
6. Draw download: TASK-590 after draw surfaces stabilize.

Wave 2 begins only after BUG-507 and BUG-508 are resolved or formally accepted as explicit blockers
and the final D6 verification record is complete.
