# Non-production migration rehearsal (TASK-651 / BLG0043)

Checked-in evidence that current migration planners were rehearsed on a synthetic `rands-local`
fixture. The rehearsal records before/after counts, recompute-and-diff output, rollback restoration,
and no production action.

This is not a backup/restore drill (TASK-646). Recompute-and-diff is the TASK-647 planner
(`scripts/lib/recompute-diff.mjs`); this rehearsal records its output. It does not authorize
staging or production. It never writes to Firestore.

Machine artifact: [migration-rehearsal-artifact.json](migration-rehearsal-artifact.json).

## How to reproduce

```bash
node scripts/lib/migration-rehearsal.mjs --project rands-local --out docs/engineering/migration-rehearsal-artifact.json
node --test tests/unit/migrationRehearsal.test.mjs
```

`--project toronto-tennis-league` is refused by the same confirmation triple as every other
migration. `--apply` is refused because this rehearsal never writes.

## What was rehearsed

| Planner            | Source                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Event-type casing  | `scripts/lib/event-type-casing.mjs`                                                                                    |
| `loses` strip      | `scripts/lib/strip-loses.mjs`                                                                                          |
| Draw-hiding strip  | `scripts/lib/event-draw-hiding.mjs`                                                                                    |
| Provider-role lift | `scripts/lib/provider-role.mjs`                                                                                        |
| Recompute-and-diff | `scripts/lib/recompute-diff.mjs` (`paidAward` replay plus R6; pre-2026 counters stay authoritative without a baseline) |

## Before / after counts

| Count            | Before | After | After rollback |
| ---------------- | -----: | ----: | -------------: |
| events           |      3 |     3 |              3 |
| stats            |      3 |     3 |              3 |
| matches          |      1 |     1 |              1 |
| preferences      |      2 |     2 |              2 |
| providers        |      0 |     1 |              0 |
| eventTypeLegacy  |      1 |     0 |              1 |
| statsWithLoses   |      3 |     0 |              3 |
| drawHidingFields |      1 |     0 |              1 |
| providersLinked  |      0 |     1 |              0 |

Document counts stay stable. Eligible fields are normalized or stripped. The provider-role lift is
additive (`providers/karan.member_uid = player-a`). Rollback restores the before snapshot.

## Recompute-and-diff

`planRecomputeDiff` scanned 3 stats docs and replayed 2 players from one completed RR match.
Award points matched `paidAward` (`points_winner: 3`, `points_loser: 1`). R6 held while `loses`
was present (`loses = matchesPlayed − wins`). After the strip, R6 has nothing to check because
the retired field is gone. No baseline was supplied, so pre-2026 counters stayed authoritative.
`ok` is true and `unexplained` is empty before and after.

## Rollback

`rollback.restored` is true. Restored counts equal the before snapshot, including the leftover
`stringer` preference flag, the legacy `tournament` event type, `loses` fields, and draw-hiding
fields. The created provider row is removed.

## No production action

- `productionAction` is `false`.
- `toronto-tennis-league` is refused.
- The rehearsal is emulator-only: any project other than `rands-local` is refused.
- `--apply` is refused. There is no Firestore client in this path.
