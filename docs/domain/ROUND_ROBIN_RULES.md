# Round Robin rules

## Group sizing

**Rule:** `splitEvenly(n)` uses `ceil(n / 5)` groups, balances sizes so they differ by at most one,
and puts larger groups first. Fewer than three players retain the existing single-group behavior.

**Why:** The draw should stay within the intended group size without introducing a new format.

**Important exception:** A one-player group can remain visible as a placeholder when every other
group is at capacity.

**Code:** `src/features/tournament/domain/roundRobin.ts`, `src/pages/tournament/rrGeneration.ts`.

**Regression test:** `tests/unit/domain.test.mjs`.

## Pairings and standings

**Rule:** Pairings use the circle method; every unique pair is scheduled once, with a ghost bye for
an odd group. Standings consume the same `matchAward` function used by score persistence.

**Why:** Pairing and point calculations must not drift between rendering and persistence.

**Important exception:** A no-show gives both players one point, but creates no winner, win, loss,
or game totals.

**Code:** `src/features/tournament/domain/roundRobin.ts`,
`src/features/tournament/domain/scoring.ts`, `src/pages/tournament/rrGeneration.ts`.

**Regression test:** `tests/unit/domain.test.mjs`.

## Group bonus

**Rule:** An event manager may award or reverse a +5 group bonus through `setGroupBonus`. The
`rr_groupbonus` stamp on every match in the group is the only payment receipt. Repeating the same
state is a no-op. Mixed stamps are unified without a second payout. Each change writes
`rr_group_bonus_audit` with actor, before/after, points delta, and time.

**Why:** The bonus is manual, never automatic. A client stamp would mint league points without a
server receipt; a second +5 on a corrected match was the recorded surplus.

**Important exception:** Reversal does not require the group to be complete. Ghost `BYE` and
`PLAYER_LOADING` slots are not paid.

**Code:** `functions/lib/groupBonus.js`, `functions/competitionResults.js`.

**Regression test:** `functions/test/groupBonus.test.js`.
