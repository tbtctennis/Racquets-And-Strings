# docs/development — structure

Approved 2026-09-01. Branch **`spiderman`**. Working ids start at **TASK-501** and **BUG-501**.

```
docs/development/
  README.md
  STRUCTURE.md
  LEGACY-TO-MODERN.md
  BACKLOG.md                    # live post-staging TASK ids (the only live backlog)
  TAGS.md
  sprint/
    EXECUTE.md
    SPIDERMAN-PLANNING.md
    WAVE-1-CLOSEOUT-D7-READINESS.md
    templates/
    tracking/
      README.md
      SPIDERMAN-TRACKER.md      # sole live status board
  task/
    README.md
    TEMPLATE.md
    TASK-501-DETAILS.md … TASK-674-DETAILS.md
  bug/
    README.md
    TEMPLATE.md
    BUG-501-DETAILS.md … BUG-508-DETAILS.md
```

D6 closure lives with the sprint: `docs/planning/sprints/d6-d9/D6-CLOSURE-REPORT.md`.

| Rule            |                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Sprint          | DC06 Spiderman on git branch `spiderman`                                                         |
| Execute         | `docs/development/sprint/EXECUTE.md` — bugs first, then waves. Say **execute sprint spiderman**. |
| Failures        | New unexpected failure → next `BUG-n` related to the current task                                |
| Spiderman scope | Before M5 Staging live: D6–D9, M5 staging, vision gaps that block staging, M0 e2e defects        |
| Backlog         | M6–M9, wallet split, privacy rewrite, native/PWA, leftover BLG rows not in D6–D9                 |
| Working ids     | `TASK-n` and `BUG-n` only                                                                        |
| Legacy ids      | Mapping table plus a field on each details file                                                  |
| Status          | Live status exists only in `sprint/tracking/`; details files hold acceptance/evidence             |
| Tags            | multi-tag, see TAGS.md                                                                           |
| Code            | Not in this folder. Planning docs hold behaviour. Architecture docs hold current system.         |
