# Documentation

**Start here.** This file is the map of `docs/` and the high-level status of current work.

| Folder | Purpose | Open when |
| --- | --- | --- |
| **[development/](development/README.md)** | What we are **doing**: live TASK/BUG ids, sprint board, open work | You need status, next work, or a task file |
| **[planning/](planning/README.md)** | What we **intend**: vision, rulings, D0–D9 behaviour | You need why something should work a certain way |
| **[architecture/](architecture/README.md)** | How the system works **today** | You need data, authz, Functions, or diagrams |
| **[domain/](domain/README.md)** | Product rules (scoring, RR, rewards, privacy) | You need a rule, not a ticket |
| **[engineering/](engineering/README.md)** | How we develop (local, verify, security) | You are setting up or checking quality |
| **[runbooks/](runbooks/README.md)** | Ops procedures (backup, Resend) | You are doing an approved ops action |
| **[archive/](archive/README.md)** | Pointer only | Old paths; files now live under `planning/` |

Live status is **not** in planning. It lives in [development/NOW.md](development/NOW.md) (open work only) and [development/sprint/tracking/SPIDERMAN-TRACKER.md](development/sprint/tracking/SPIDERMAN-TRACKER.md) (full board).

---

## DC06 Spiderman — high level

Branch for this work: **`main`** (sprint branch `spiderman` still exists with sprint-specific `AGENTS.md`).

| | |
| --- | --- |
| **Updated** | 2026-09-11 |
| **Sprint board** | 146 / 167 closed (**87%**) |
| **Tasks** | 139 completed · **20 open** · 15 backlog |
| **Bugs** | 7 completed · **1 blocked** |

| Still open | Count | Where |
| --- | --- | --- |
| Blocked | 1 | [BUG-502](development/bug/BUG-502-DETAILS.md) — no group-lesson coach UI |
| Needs a staging Firebase project | 4 | [TASK-622](development/task/TASK-622-DETAILS.md)–[625](development/task/TASK-625-DETAILS.md) |
| Open on `main` (can do without staging) | 16 | listed in [NOW.md](development/NOW.md) |
| Later (M6–M9, legal, PWA, live email) | 15 | [BACKLOG.md](development/BACKLOG.md) |

**Waves 0–5 landed** (D6–D9, vision gaps that block staging, emulator backlog). **Wave 6 (M5 staging live) is stopped** until the team names an isolated Firebase project.

---

## Navigate in this order

1. **This file** — map and numbers.
2. **[Open work](development/NOW.md)** — only pending / blocked / backlog.
3. The **details file** for the item you pick (`docs/development/task/` or `bug/`).
4. **Planning / architecture / domain** if you need behaviour or current system.

Agents: follow root [`AGENTS.md`](../AGENTS.md). Do not add new TASK/BUG ids under `docs/planning/`.
