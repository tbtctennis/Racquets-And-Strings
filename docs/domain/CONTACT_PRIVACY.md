# Contact privacy

## Read access

**Rule:** A contact document is readable by its owner or by an authenticated member who holds a
server-owned `connections/{pair}` document with them. Anonymous users cannot read contacts.
Rules do not inspect `reason`; any existing pair is enough.

**Why:** The app shares contact details for real coordination, but a public member directory must
not become a phone-number directory.

**Important exceptions:** Event creators do not receive general contact access except through a
connection the participant trigger writes for that event's managers (`reason: event-organizer`).
A marketplace listing exposes only an allowlisted projection through `public_contacts/{uid}` to
authenticated members; it does not unlock the private `contacts/{uid}` document. The monthly
`group_lessons` roster and `isCurrentGroupLessonCoachFor` are gone (TASK-511). Coach↔player
access uses the same connection marker: a **Book** on a service whose provider row has
`member_uid` writes `reason: service-lead`. Preference stringer/coach flags do not identify
the provider. There is no live writer of `reason: coaching session`.
**Partner-pool contacts** are a third projection: `partner_pool/{eventId}/contacts/{uid}`,
written by Functions, readable only by members of that event's pool. Empty channels are omitted.
See [partner-pool diagram](../architecture/diagrams/partner-pool.md) and
[coaching pool](../architecture/COACHING_POOL.md).

**Ruled change (2026-08-31, organizer download not yet implemented):** Ruling 8 gives an event
organizer the contacts of everyone who joined their _own_ event, and the September beta ships a
draw download that carries participant contacts outside the app
([VISION.md](../planning/VISION.md) §4 block 1). The participant-join connection covers in-app
organizer reads; the out-of-app download is a separate surface. A later coaching-session join
(D8 S5 / TASK-663) must write the same `connections` marker — not revive `group_lessons`.

**Code:** `firestore.rules`, `functions/connections.js`, `functions/lib/serviceLeads.js`,
`functions/partnerPool.js`, `functions/index.js`.

**Regression tests:** `tests/rules/firestore.rules.test.mjs` (`contacts become readable...` and
`coaching-session connections allow mutual contact reads...`).

## Writes and sensitive fields

**Rule:** Only the owner can create or update their contact document, and only the allowlisted
contact fields may change. Server-owned connection markers and points remain outside client writes.

**Why:** Field-level rules prevent a legitimate profile edit from becoming a privilege-escalation
path.

**Important exception:** No client delete path exists for contacts.

**Code:** `firestore.rules` (`ownerContactFields`, `/contacts/{userId}`).

**Regression test:** `tests/rules/firestore.rules.test.mjs`.
