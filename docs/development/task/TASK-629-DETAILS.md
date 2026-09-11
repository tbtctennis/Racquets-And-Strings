# TASK-629-DETAILS

|                |                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-629                                                                                                             |
| **Title**      | In-app notification list is the beta channel                                                                         |
| **TLDR**       | Beta is in-app only. Email path already exists but stays off. Members must be able to read notifications in the app. |
| **Status**     | completed                                                                                                           |
| **Tags**       | UI, Firebase, API                                                                                                    |
| **Sprint**     | DC06 Spiderman                                                                                                       |
| **Legacy ids** | VISION §3 / §10.3, BLG0065                                                                                           |
| **Blocked by** | None                                                                                                                 |

## Detail

**After.** Beta is in-app only. Email path already exists but stays off. Members must be able to read notifications in the app.

**Acceptance.** The in-app list shows zone-change, decline, dispute, and result notices. No email is sent on staging unless the allowlist switch is on (it stays off).

**Planning source.** `docs/planning/VISION.md` — behaviour lives there. This file tracks status only. No code in this tracker.

**Phase.** M1

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
- `docs/planning/history/BACKLOG-BLG.md`
- `docs/planning/deferred/DEFERRED-AND-FUTURE.md`
- `firestore.rules`
- `docs/architecture/AUTHORIZATION_MODEL.md`

## Comments

| Date       | Who                | Note |
| ---------- | ------------------ | ---- |
| 2026-09-11 | Grok Build · worker | Started. Beta channel is the in-app Notifications list (VISION §10.3). Push stays TASK-645. Email already gated by `emailDeliveryDecision`; staging stays off unless allowlist switch is on. |
| 2026-09-11 | Grok Build · worker | Wired missing list events: conversion decline (`challenge_conversion_rejected`), challenge result (`ladder_reported`), zone-change to all organizer uids. Client types/fallbacks cover zone-change, decline, dispute, result. Tests: `tests/unit/notificationList.test.mjs`, `functions/test/notifications.test.js`. Left `inprogress` for coordinator verify/integration. Tracker not edited. |
