# Planning

This is the single program tree: vision, rulings, every sprint, deferred work, and dated history.
Nothing here is evidence of staging or production release.

Live status is **not** here. It lives in
[`docs/development/sprint/tracking/SPIDERMAN-TRACKER.md`](../development/sprint/tracking/SPIDERMAN-TRACKER.md).
Working ids are `TASK-501+` and `BUG-501+` under [`docs/development/`](../development/README.md).
Do not add new working ids in this folder.

## Program map

| Id    | Name                                    | Status                                                                | Phase | Where                                                                       |
| ----- | --------------------------------------- | --------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------- |
| DC00  | Foundation / takeover                   | closed                                                                | —     | [sprints/d0-foundation/](sprints/d0-foundation/DC00-DEV-ANUJ-FOUNDATION.md) |
| D1–D5 | Closed delivery program                 | closed                                                                | M0    | [sprints/d1-d5/](sprints/d1-d5/README.md)                                   |
| D6    | Corrections + partner pool              | in progress — Wave 1 implemented, not green-closed (BUG-507, BUG-508) | M1    | [sprints/d6-d9/SPRINT-D6.md](sprints/d6-d9/SPRINT-D6.md)                    |
| D7    | Shared component set                    | planned / Wave 2                                                      | M2    | [sprints/d6-d9/SPRINT-D7.md](sprints/d6-d9/SPRINT-D7.md)                    |
| D8    | Seeding, coaching pool, workflow record | planned                                                               | M3    | [sprints/d6-d9/SPRINT-D8.md](sprints/d6-d9/SPRINT-D8.md)                    |
| D9    | Donations + payment gateway (test mode) | planned                                                               | M4    | [sprints/d6-d9/SPRINT-D9.md](sprints/d6-d9/SPRINT-D9.md)                    |
| M5–M9 | Staging → second location               | deferred                                                              | M5–M9 | [deferred/](deferred/DEFERRED-AND-FUTURE.md)                                |

[Sprint index](sprints/README.md) repeats this table next to the files.

## How the documents fit together

**[VISION.md](VISION.md)** says what the product is and sequences delivery as phases M0–M9.
**Rulings** in [decisions/DECISIONS-2026-08-29.md](decisions/DECISIONS-2026-08-29.md),
[specs/2026-08-31-vision-gaps-design.md](specs/2026-08-31-vision-gaps-design.md), and the
[2026-09-02 repository decisions](decisions/DECISIONS-2026-09-02.md) say how behaviour and delivery
must work; a ruling outranks a sprint doc, and the later ruling wins where two collide.
**Sprints** hold the jobs. **[tasks/](tasks/README.md)** is the frozen D6–D9 behaviour-source
register (Rahul’s original breakdown). New work is tracked as TASK-501+ in `docs/development/`.

## Other registers

- [Deferred work](deferred/DEFERRED-AND-FUTURE.md) — ruled out of D6–D9, plus merged future-work rows
- [History](history/planning-2026-08-23/README.md) — dated 2026-08-23 notes, not sprints
- [Frozen BLG backlog](history/BACKLOG-BLG.md) — pre-Spiderman `BLG####` register; look up modern ids in [LEGACY-TO-MODERN.md](../development/LEGACY-TO-MODERN.md)
- [Live backlog](../development/BACKLOG.md) — post-staging TASK ids

## Source contract

Code baseline for _current-system_ claims is branch `spiderman` (see `docs/architecture/`).
Line-number citations inside D6–D9 sprint prose were originally read at `dev-anuj` @ `ac4dfb1`;
re-check before editing those files. D6 and D7 must not be reported as complete until their
acceptance and validation gates have passed.
