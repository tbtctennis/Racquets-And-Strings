# Development tracker

This folder is the **working** tracker from DC06 Spiderman onward.

| File                                                         | Role                                               |
| ------------------------------------------------------------ | -------------------------------------------------- |
| [STRUCTURE.md](STRUCTURE.md)                                 | Layout and rules                                   |
| [LEGACY-TO-MODERN.md](LEGACY-TO-MODERN.md)                   | Claude/BLG/D-sprint id → TASK/BUG                  |
| [sprint/EXECUTE.md](sprint/EXECUTE.md)                       | Runbook for **execute sprint spiderman**           |
| [sprint/SPIDERMAN-PLANNING.md](sprint/SPIDERMAN-PLANNING.md) | Spiderman sprint planning and work design          |
| [sprint/tracking/SPIDERMAN-TRACKER.md](sprint/tracking/SPIDERMAN-TRACKER.md) | Complete inventory and progress board |
| [sprint/WAVE-1-CLOSEOUT-D7-READINESS.md](sprint/WAVE-1-CLOSEOUT-D7-READINESS.md) | Wave 1 closeout checklist |
| [sprint/templates/SPRINT-PLANNING-TEMPLATE.md](sprint/templates/SPRINT-PLANNING-TEMPLATE.md) | Future sprint planning template |
| [sprint/templates/SPRINT-TRACKING-TEMPLATE.md](sprint/templates/SPRINT-TRACKING-TEMPLATE.md) | Future sprint tracking template |
| [task/](task/)                                               | One `TASK-n-DETAILS.md` per task from **TASK-501** |
| [bug/](bug/)                                                 | One `BUG-n-DETAILS.md` per bug from **BUG-501**    |
| [BACKLOG.md](BACKLOG.md)                                     | Post-Spiderman work as TASK ids                    |
| [TAGS.md](TAGS.md)                                           | Allowed tags                                       |

`docs/planning/` remains the vision, rulings, and D6–D9 behaviour source. Do not add new working ids there.
`docs/architecture/` is how the system works today. Update it when architecture-sensitive code lands.

The repository root `AGENTS.md` is the only agent contract. The sprint tracker is the only live
status source; this folder contains acceptance details, durable references, and execution support.

Opened 2026-09-01 on branch `spiderman` by Anuj Raja with Grok Build.
