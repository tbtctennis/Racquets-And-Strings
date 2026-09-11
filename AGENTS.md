# AGENTS.md — Racquets & Strings

This file is the contract for every agent on this checkout. Read it before any work.

This root file is the only agent contract in the repository. Do not look for or create another
`AGENTS.md` under `docs/development/`. The sprint runbook for an active sprint is
`docs/development/sprint/EXECUTE.md`. Live sprint status is only in
`docs/development/sprint/tracking/<SPRINT>-TRACKER.md`.

Sprint-specific execute instructions (wave order, item ids, worker branch names) live on the
sprint branch and in that sprint's execute/tracker files. Do not copy a closed sprint's wave
table into this file.

---

## 1. Project identity

|                         |                                                      |
| ----------------------- | ---------------------------------------------------- |
| **What this is**        | Public product repo for Racquets & Strings           |
| **Team**                | TBTC Tennis                                          |
| **GitHub**              | `https://github.com/tbtctennis/Racquets-And-Strings` |
| **origin**              | `tbtctennis/Racquets-And-Strings`                    |
| **Default branch**      | `main`                                               |
| **Production Firebase** | `toronto-tennis-league` — never target it for routine work |

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
| `docs/planning/sprints/`                                          | Behaviour source for completed and current sprints                    |
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

## 3. How we work

1. **Plan first.** Resolve scope, ids, dependencies, and file ownership before dispatching work.
2. **Emulator first.** Local Firebase emulators, project `rands-local`. No staging deploy and no production until the team names an isolated project.
3. **Tracker is `docs/development/`.** Working ids are `TASK-n` and `BUG-n`. `docs/planning/` is the behaviour source (vision, rulings, sprint docs). Do not add new working ids there.
4. **Parallel when independent.** Dispatch non-conflicting items together when capacity and dependencies permit. Each worker implements only its assigned details file and explicitly owned files; never edit another worker’s files.
5. **Isolate every worker.** Start each assignment from the latest verified default-branch commit in its own worktree and a dedicated agent branch. Workers commit issue-sized changes and push only their worker branch. They never push, merge, rebase, or force-push `main`.
6. **Coordinator owns shared state.** The coordinator assigns work, records `inprogress`, serializes updates to indexes and the active tracker, reviews worker diffs, merges in dependency order, and is the only role allowed to close work on `main`.
7. **A failure the item did not already describe is a new bug**, linked to that task. The coordinator reserves bug ids to prevent collisions.
8. **Status moves with the work:** `new` → `inprogress` → `completed` / `blocked`. A worker updates its owned details file; the coordinator applies the corresponding index/tracker update during integration. Do not claim completion until the integrated branch passes the required gate.
9. **When a slice of work lands**, update `docs/architecture/`, `docs/domain/`, `docs/engineering/`, and `docs/runbooks/` so they match the code.
10. **Staging live waits for the team** to name an isolated Firebase project.

---

## 4. Executing an active sprint

If the team names an active sprint, follow `docs/development/sprint/EXECUTE.md` and that sprint's
tracker. Do not invent a new plan when those files already define the work.

### Read first, every session, in this order

1. This file (`AGENTS.md`)
2. `docs/development/sprint/EXECUTE.md` (if a sprint is active)
3. The active `docs/development/sprint/tracking/<SPRINT>-TRACKER.md`
4. `docs/planning/VISION.md`
5. `docs/planning/decisions/` (latest rulings)
6. The current item’s details file (including **Read first** and **Execute**)
7. The current code those files name

### Per item

1. Dispatch only items whose **Blocked by** dependencies are completed.
2. Record ownership and allowed files, then mark the item `inprogress`.
3. Each worker implements only that item, runs the smallest covering tests, and reports changed files, tests, blockers, and commit SHA.
4. If something fails that the item did not already describe, report it immediately as a new bug.
5. Integrate accepted branches one at a time into `main`. Never silently overwrite another worker’s changes.
6. After each integration batch, run the relevant tests; run `npm run verify` at a wave or sprint gate before marking items `completed`.
7. Commit issue-sized. Push worker branches only; push `main` when the team directs.

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

| Path                                      | Role                                                       |
| ----------------------------------------- | ---------------------------------------------------------- |
| `docs/development/task/TASK-n-DETAILS.md` | One task: id, title, TLDR, tags, status, comments, execute |
| `docs/development/bug/BUG-n-DETAILS.md`   | Same for defects                                           |
| `docs/development/LEGACY-TO-MODERN.md`    | Legacy sprint/BLG ids → TASK/BUG                           |
| `docs/development/sprint/tracking/`       | Live board for the active sprint                           |
| `docs/planning/`                          | Vision, rulings, sprint behaviour (not the working board)  |

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

Do not use gstack ship/deploy workflows to deploy production.
