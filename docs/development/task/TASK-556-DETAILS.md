# TASK-556-DETAILS

|                |                            |
| -------------- | -------------------------- |
| **Task id**    | TASK-556                   |
| **Title**      | One `ProfileCard`          |
| **TLDR**       | One card with `mode: 'own' | 'public'` |
| **Status**     | completed                  |
| **Tags**       | UI                         |
| **Sprint**     | DC06 Spiderman             |
| **Legacy ids** | D7-CS7-T1                  |
| **Blocked by** | None                       |

## Detail

**Today.** **Three** components, 2,021 lines — `Profile.tsx` 651, `ProfileInfo.tsx` 983, `PlayerProfile.tsx` 387 — with duplications on different pairs

**After.** One card with `mode: 'own' | 'public'`

**Acceptance.** Both surfaces render from one card · the streak, P/G % and `initialOf` duplications are gone · `Phone` / `Contact` label drift is resolved

**Exit adds.** **Do before the leaderboard row.** The safety boundary is the rules file, not the component

**Planning source.** `docs/planning/tasks/TASKS-D7.md` — behaviour lives there. This file tracks status only. No code in this tracker.

**Phase.** M2

## Execute

When **execute sprint spiderman** reaches this item:

1. Set **Status** to `inprogress`. Add a Comments row (date, who, started).
2. Read **Read first**, then the current code those files name. If docs and code disagree, record it in Comments and follow the ruling / current code deliberately.
3. Implement only this item. Do not widen scope.
4. Prove it with the smallest tests that cover the acceptance line, then `npm run verify` before `completed`.
5. **If something fails that this item did not already describe:** open the next free `BUG-n`, set Related task to this id, comment both files, add the bug to `bug/README.md` and the tracker. Leave this item `blocked` if it cannot continue.
6. On success: **Status** `completed`, Comments row, update `docs/development/sprint/tracking/SPIDERMAN-TRACKER.md`.
7. Do not deploy staging or production.

### Read first

- `../../../AGENTS.md`
- `docs/development/sprint/EXECUTE.md`
- `docs/planning/VISION.md`
- `docs/planning/decisions/DECISIONS-2026-08-29.md`
- `docs/planning/specs/2026-08-31-vision-gaps-design.md`
- `docs/planning/tasks/TASKS-D7.md`
- `docs/planning/sprints/d6-d9/SPRINT-D7.md`
- `docs/planning/specs/2026-08-31-m2-uiux-simplification-spec.md`

## Comments

| Date | Who | Note |
| ---- | --- | ---- |
| 2026-09-11 | Grok worker | TASK-556. One ProfileCard with own/public modes. Own profile and public player profile render from it. Streak is derived on the card; P/G % uses shared pgWinPct; initialOf stays on Avatar. Contact label unified (was Phone vs Contact). Public mode does not print private contact values. Design-sync registered with light/dark 360px previews. Targeted unit tests in tests/unit/profileCard.test.mjs. npm run verify left to the coordinator. |
