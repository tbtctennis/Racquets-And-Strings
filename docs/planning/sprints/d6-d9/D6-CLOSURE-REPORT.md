# D6 closure report

> **Status: green-closed.** All D6 implementation and verification gates passed on 2026-09-02.

Date: 2026-09-02
Branch: `spiderman`
Scope: Wave 1 / M1 / D6 (`TASK-502`–`TASK-541`)

## Outcome

All eligible Wave 1 tasks are implemented. The recovered in-progress work shown in `IMG_6779.png`
was reviewed and completed: TASK-530, TASK-531, TASK-537, and TASK-540. Their dependents
TASK-532, TASK-533, and TASK-538 were then completed. BUG-502 remains explicitly blocked because
the coaching UI it requires is out of scope for D6.

BUG-507 was resolved by correcting the rally/challenge create-time location predicate and isolating
the report assertions. The Rules suite now passes 36/36 under Node 22.23.2.

BUG-508 was resolved by making the integration harness carry the real Functions dependencies and
by fixing the rally payout FieldValue import. The Functions integration suite now passes 19/19
under Node 22.23.2.

## Delivered

- Same-location challenge/rally enforcement in Firestore Rules and the result callable, with
  unset-location members allowed within the event scope.
- Complete `friendly` → `rally` runtime migration across services, functions, notifications,
  fixtures, tests, links, and labels.
- Partner-pool membership/contact projections, live hooks, join/leave service, and doubles panel
  using shared `PersonRow` and contact controls.
- Join-sheet preferred-court selection with derived zone and explicit Unplaced fallback.

## Verification evidence

- `npm run typecheck`: passed.
- `npm run lint`: passed with existing warnings, 0 errors.
- `node --test functions/test/*.test.js`: passed, 13 files.
- `npm test`: passed after isolating pool normalization from Firebase initialization.
- `git grep -in 'friendl' -- src functions tests`: clean.
- Firestore Rules tests cover same-location, cross-location, unset-location, and partner-pool
  member/contact access cases.

## Final gate

The full `npm run verify` gate passed under Node 22.23.2 on the final closure commit recorded below.
No staging, production, or cloud migration action was performed.

The repository now routes verification scripts through the exact Node 22.23.2 pin.

Final green commit: `98094ee1945372d0052c7de31391d0a004f181c1`.

The standalone `npm run docs:verify` retry also stopped in this checkout because `origin/dev-anuj`
is not available locally; this is a comparison-base setup issue, not a documentation assertion
failure. The earlier gate run passed documentation freshness before reaching the Rules failure.
