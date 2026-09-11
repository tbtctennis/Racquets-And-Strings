# TASK-627-DETAILS

|                |                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task id**    | TASK-627                                                                                                                                                        |
| **Title**      | Marketplace listing-mediated posting                                                                                                                            |
| **TLDR**       | Beta block 3 includes marketplace. D7 only touches copy defects. Listing-mediated posting has no D6–D9 row and is required before staging if M3 is in the beta. |
| **Status**     | completed                                                                                                                                                       |
| **Tags**       | UI, Firebase, API                                                                                                                                               |
| **Sprint**     | DC06 Spiderman                                                                                                                                                  |
| **Legacy ids** | VISION §11, M3                                                                                                                                                  |
| **Blocked by** | None                                                                                                                                                            |

## Detail

**After.** Beta block 3 includes marketplace. D7 only touches copy defects. Listing-mediated posting has no D6–D9 row and is required before staging if M3 is in the beta.

**Acceptance.** A member can post a listing through the mediated path. Rules cover the collection.

**Planning source.** `docs/planning/VISION.md` — behaviour lives there. This file tracks status only. No code in this tracker.

**Phase.** M3

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

| Date       | Who                   | Note                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-11 | Grok Build · TASK-627 | Started. Docs (VISION §11, ruling 8, DATA_FLOW) already describe listing-mediated posting via `listings` + `public_contacts`. Code disagreed: `Marketplace.tsx` read private `contacts/{uid}` as a side channel. Following the ruling. Exclusive files: marketplace client, listing rules, listing tests.                                                                   |
| 2026-09-11 | Grok Build · TASK-627 | Member posts through `listings` (`buildListingDocument` / `createListing`). Seller contact reads `public_contacts` only. Rules allowlist listing fields so contact channels cannot ride the public listing. Tests: `tests/unit/listingMediated.test.mjs` (3) and `npm run test:rules` (37, including listing-mediated posting). Typecheck and docs:verify green. No deploy. |
