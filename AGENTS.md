# AGENTS.md — Racquets & Strings

This file is the contract for every agent on this checkout. Read it before any work.

This root file is the only agent contract in the repository. Do not look for or create another
`AGENTS.md` under `docs/development/`. The sprint runbook is
`docs/development/sprint/EXECUTE.md`; live sprint status is only in
`docs/development/sprint/tracking/<SPRINT>-TRACKER.md`.

When the team says **execute sprint spiderman**, follow the Execute section below. Do not ask for a new plan.

---

## 1. Project identity

|                         |                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **What this is**        | Public product repo for Racquets & Strings                                                |
| **Team**                | TBTC Tennis                                                                               |
| **GitHub**              | `https://github.com/tbtctennis/Racquets-And-Strings`                                      |
| **origin**              | `tbtctennis/Racquets-And-Strings`                                                         |
| **Default branch**      | `main`                                                                                    |
| **Sprint branch**       | `spiderman` (DC06 Spiderman)                                                              |
| **Production Firebase** | `toronto-tennis-league` — never target it for routine work                                |

Do not force-push. Do not rewrite origin history.

---

## 2. Repository map and documentation authority

| Area                                                              | Purpose                                                               |
| ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/`                                                            | React/Vite client application and reusable UI components              |
| `src/features/`                                                   | Feature hooks, services, domain logic, and types                      |
| `src/pages/`                                                      | Route-level screens and screen-specific presentation                  |
| `functions/`                                                      | Firebase Cloud Functions and unit tests under `functions/test/`       |
| `tests/unit/`, `tests/rules/`, `tests/integration/`, `tests/e2e/` | Fast tests, emulator authorization, integration, and browser journeys |
| `docs/architecture/`                                              | Current system: topology, data, authz, diagrams                       |
| `docs/planning/`                                                  | Vision, rulings, every sprint (DC00–D9), deferred, history            |
| `docs/planning/sprints/d6-d9/`                                    | Current D6–D9 behaviour source                                        |
| `docs/planning/decisions/`                                        | Dated rulings                                                         |
| `docs/domain/`, `docs/engineering/`, `docs/runbooks/`             | Product rules, how we develop, ops procedures                         |
| `docs/development/task/`, `docs/development/bug/`                 | Acceptance criteria and implementation evidence                       |
| `docs/development/sprint/tracking/`                               | Sole live status board for active sprints                             |
| `docs/development/sprint/EXECUTE.md`                              | Sprint execution procedure, not a status board                        |
| `docs/development/BACKLOG.md`                                     | Live post-staging TASK ids                                            |

Authority order: product rulings in `docs/planning/` define behaviour; code defines current
implementation; the active sprint tracker defines status, ownership, and completion. Planning
documents must not duplicate live task rows or progress counts. Task and bug details hold scope,
acceptance criteria, and evidence.

## 3. How we work (recorded 2026-09-01)

1. **Plan first.** The coordinator resolves scope, ids, dependencies, and file ownership before dispatching a wave.
2. **Emulator first.** Local Firebase emulators, project `rands-local`. No staging deploy and no production until the team names an isolated project.
3. **Tracker is `docs/development/`.** Working ids are `TASK-501+` and `BUG-501+`. `docs/planning/` is Rahul’s behaviour source (vision, rulings, D6–D9). Do not add new working ids there.
4. **Parallel by wave.** Dispatch 6–10 non-conflicting items at once when capacity and dependencies permit. Each worker implements only its assigned details file and explicitly owned files; never edit another worker’s files.
5. **Isolate every worker.** Start each assignment from the latest verified `spiderman` commit in its own worktree and branch named `agent/spiderman-w<N>-<item-id>`. Workers commit issue-sized changes and push only their `origin` worker branch. They never push, merge, rebase, or force-push `spiderman`.
6. **Coordinator owns shared state.** The coordinator assigns work, records `inprogress`, serializes updates to indexes and `docs/development/sprint/tracking/SPIDERMAN-TRACKER.md`, reviews worker diffs, merges/rebases in dependency order, and is the only role allowed to close work on `spiderman`.
7. **A failure the item did not already describe is a new bug**, linked to that task, next free `BUG-n` (currently next is **BUG-506**). The coordinator reserves bug ids to prevent collisions.
8. **Status moves with the work:** `new` → `inprogress` → `completed` / `blocked`. A worker updates its owned details file; the coordinator applies the corresponding index/tracker update during integration. Do not claim completion until the integrated `spiderman` branch passes the required gate.
9. **At the end of the sprint**, update `docs/architecture/`, `docs/domain/`, `docs/engineering/`, and `docs/runbooks/` so they match the code.
10. **M5 staging live waits for the team** to name an isolated Firebase project.

---

## 4. Execute sprint spiderman

### Read first, every session, in this order

1. This file (`AGENTS.md`)
2. `docs/development/sprint/EXECUTE.md`
3. `docs/development/sprint/SPIDERMAN-PLANNING.md`
4. `docs/development/sprint/tracking/SPIDERMAN-TRACKER.md`
5. `docs/development/LEGACY-TO-MODERN.md`
6. `docs/planning/VISION.md`
7. `docs/planning/decisions/DECISIONS-2026-08-29.md`
8. `docs/planning/specs/2026-08-31-vision-gaps-design.md`
9. The current item’s details file (including **Read first** and **Execute**)
10. The current code those files name

### Waves (do in order; parallel within each wave)

| Wave  | What                                           | Where                                                                          |
| ----- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| **0** | Bugs first                                     | `BUG-504`, `BUG-505`. Skip `BUG-501`/`BUG-503` (done). Leave `BUG-502` blocked |
| **1** | M1 / D6                                        | `TASK-502` … `TASK-541` (`TASK-501` is completed)                              |
| **2** | M2 / D7                                        | `TASK-542` … `TASK-597`                                                        |
| **3** | M3 / D8 + gaps                                 | `TASK-598` … `TASK-609`, `TASK-626` … `TASK-629`                               |
| **4** | M4 / D9 Stripe **test mode**                   | `TASK-610` … `TASK-621`                                                        |
| **5** | Emulator-local backlog pulled into this sprint | listed in `SPIDERMAN-PLANNING.md` Wave 5                                       |
| **6** | M5 staging live                                | `TASK-622` … `TASK-625` — **stop until the team names a staging project**      |

Skip `completed`. Skip `blocked` unless the blocker is gone. Do not start M6–M9, wallet split, Privacy/Terms, native/PWA, or Resend DNS.

### Per wave and item

1. The coordinator reads every candidate’s **Blocked by** and dispatches only items whose dependencies are completed. Resolve contradictory dependency metadata before dispatch; do not start a cycle.
2. For each assignment, the coordinator records ownership, worktree, branch, and allowed files, then marks the item `inprogress`. Shared indexes and the sprint tracker remain coordinator-owned.
3. Dispatch up to **10** isolated subagents per wave when work is independent. Group work by exclusive file ownership and dependencies; never assign two workers the same file concurrently. Each worker reads the full contract and its item’s **Read first** / **Execute** instructions, implements only that item, runs the smallest covering tests, and reports changed files, tests, blockers, and commit SHA.
4. If something fails that the item did not already describe, the worker reports it immediately. The coordinator reserves the next bug id, assigns creation of `docs/development/bug/BUG-<next>-DETAILS.md` to one worker, and serializes updates to `bug/README.md` and the tracker.
5. The coordinator reviews each branch for scope, canon, ownership, and tests; integrates accepted branches one at a time into `spiderman`. Resolve conflicts in the owning branch whenever possible. Never silently overwrite another worker’s changes.
6. After each integration batch, run the relevant tests; run `npm run verify` at the wave gate and before marking integrated items `completed`. Failed branches return to their worker for repair.
7. When the wave gate is green, the coordinator updates indexes and `docs/development/sprint/tracking/SPIDERMAN-TRACKER.md`, records the integrated commit, cleans up merged worktrees/branches, and dispatches the next wave from that verified `spiderman` SHA.
8. Commit issue-sized. Push `origin` worker branches only; the coordinator may push the verified `spiderman` branch when the team directs.

### End of sprint

Update technical docs to match code: `docs/architecture/`, `docs/domain/`, `docs/engineering/`, runbooks. Record the green `npm run verify` SHA in `docs/development/README.md`.

---

## 5. Environment safety

- Emulators first, staging second, production only after explicit approval.
- Inspect the active Firebase project before any Firebase CLI operation.
- Do not run generic `firebase deploy` from this checkout.
- Do not perform destructive Firestore migrations, production deploys, DNS changes, or provider configuration changes unless the team approved that exact action.
- `.env.local` is emulator-only (`VITE_USE_FIREBASE_EMULATORS=true`, `VITE_FIREBASE_PROJECT_ID=rands-local`). Never put service-account keys, Resend secrets, or Stripe live keys in a `VITE_` variable.

---

## 6. Stack and commands

- React 19, TypeScript 5.8, Vite 6, React Router 7, Tailwind CSS 4.
- Firebase Web SDK 12: Auth, Firestore, Storage, Functions, Analytics.
- Cloud Functions v2 on Node 22.
- Node **22** and Java **21** are pinned in `.mise.toml`.

```bash
mise trust && mise install
node -v    # 22.x
java -version
npm ci
npm --prefix functions ci
npx playwright install chromium
cp .env.example .env.local   # if missing

npm run emulators
npm run seed:emulator        # after emulators are ready
npm run dev                  # Vite :3000

npm run typecheck
npm run lint
npm run verify               # full local gate; required before completed
```

`npm run verify` includes typecheck (3 GB heap), lint, format, docs:verify, tests, rules, Functions integration, Playwright e2e, and build.

---

## 7. Tracker and status lifecycle

| Path                                                    | Role                                                                    |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| `docs/development/task/TASK-n-DETAILS.md`               | One task: id, title, TLDR, tags, status, comments, execute              |
| `docs/development/bug/BUG-n-DETAILS.md`                 | Same for defects                                                        |
| `docs/development/LEGACY-TO-MODERN.md`                  | `D6-C13-T2` / `BLG0022` → TASK/BUG                                      |
| `docs/development/sprint/tracking/SPIDERMAN-TRACKER.md` | Complete inventory and live board                                       |
| `docs/planning/`                                        | Vision, rulings, D6–D9 behaviour (legacy source, not the working board) |

Status words: `new` · `inprogress` · `completed` · `blocked` · `backlog`. The sprint tracker is
the only current-status authority. When a sprint starts, planning remains a scope charter only;
task rows and progress counts are maintained only in the tracker.
Tags: see `docs/development/TAGS.md`. Multi-tag. Do not invent a tag without adding it there.

---

## 8. Product canon (do not drift)

`docs/planning/VISION.md` outranks sprint docs on vocabulary, roles, and scope. A ruling outranks a sprint doc. The later ruling wins where two collide.

- **`location`, never `league`, for a city.** `league` is Men’s/Women’s.
- **`rally`, never `friendly`.**
- Stored status words: `confirmed`, `declined`, `withdrawn`, `completed`. A member sees only **Pending** or **Done**.
- **One result model** for tournament, challenge, and rally.
- **Connections** unlock contacts and profile cards. Only the global leaderboard is visible across locations.
- Never a paid membership. Stripe test mode only until M6.

## 9. Invariants

- Firestore Rules are the authorization boundary, not UI route guards.
- Points and rewards are Functions-authoritative.
- Super-admin is still a hardcoded uid; staging needs a uid that exists in that project.
- Read current code and rules before changing behaviour. If docs and code disagree, record it and resolve it deliberately.

## 10. Skill routing

- Firebase rules → `.agents/skills/firebase-security-rules-auditor`
- Investigation → `.agents/skills/gstack/investigate/SKILL.md`
- Review → `.agents/skills/gstack/review/SKILL.md`
- QA → `.agents/skills/gstack/qa-only/SKILL.md` when a safe local environment exists

Do not use gstack ship/deploy workflows to deploy production or to push `upstream`.
