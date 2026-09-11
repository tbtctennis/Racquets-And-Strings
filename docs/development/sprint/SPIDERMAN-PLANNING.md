# DC06 Spiderman sprint charter

This file is the planning document for the sprint: its goals, work design, dependencies, wave
strategy, and delivery rules. It is not the progress board. The complete task inventory and all
current status, ownership, completion, blockers, and wave progress live only in
[`tracking/SPIDERMAN-TRACKER.md`](tracking/SPIDERMAN-TRACKER.md).

## Scope

The sprint is designed to complete all work that can safely be done before live staging: D6/M1, D7/M2, D8/M3, D9/M4 in
Stripe test mode, the emulator-local backlog promoted into this sprint, and the M5 staging tasks
when the owner supplies an isolated Firebase project.

Behaviour comes from the source documents in `docs/planning/` (vision, rulings, D6–D9 task and
sprint documents, and dated specifications). Working acceptance criteria live in
`docs/development/task/` and `docs/development/bug/`.

## Work design

- Use the complete task inventory in the tracker; do not copy task rows or status counts here.
- Resolve dependencies before dispatching work. Each task detail file remains the acceptance
  criteria and implementation-evidence record.
- Split work by exclusive file ownership and dispatch independent items in parallel.
- Reserve shared files, integration, status changes, and final verification for the coordinator.

## Waves

| Wave | Scope | Gate |
| --- | --- | --- |
| 0 | Bugs first | Complete or explicitly document blockers |
| 1 | M1 / D6, `TASK-501`–`TASK-541` | Emulator tests and `npm run verify` |
| 2 | M2 / D7, `TASK-542`–`TASK-597` | Emulator tests and `npm run verify` |
| 3 | M3 / D8 plus gaps, `TASK-598`–`TASK-609`, `TASK-626`–`TASK-629` | Emulator tests and `npm run verify` |
| 4 | M4 / D9, `TASK-610`–`TASK-621`, test mode only | Emulator tests and `npm run verify` |
| 5 | Emulator-local backlog listed by the tracker | Emulator tests and `npm run verify` |
| 6 | M5 staging, `TASK-622`–`TASK-625` | Stop until the owner names an isolated staging project |

## Operating rules

- Read root `AGENTS.md`, this charter, the active tracker, the relevant source documents, and the
  current item details before coding.
- Dispatch up to 10 isolated subagents per wave when dependencies and file ownership permit.
- The coordinator owns shared documentation, manifests, configuration, integration, the tracker,
  and the final verification gate.
- Workers use isolated worktrees, make issue-sized commits, and never push directly to
  `spiderman`.
- Do not begin a new wave until the previous wave has a verified integrated commit.
- Do not start M6–M9, wallet split, Privacy/Terms, native/PWA decisions, push, Resend DNS, or
  production work in this sprint.
