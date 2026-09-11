# Event-scoped preference projection

## Consent

**Rule:** Cross-member preference disclosure is an explicit, per-event owner write. The owner
creates `events/{eventId}/preference_projections/{uid}` with `consented: true`. Signup, event
join, the shared-draw contact sentence, and an existing `preferences/{uid}` document do not
imply this consent. `public_preferences/{uid}` stays deny-all; it is not an approved global
projection.

**Why:** Preference documents mix play-discovery fields with notification, scheduling, and role
state. A world-readable copy, or a backfill from records that predate this contract, would
publish fields the member never agreed to share.

## Event scope

**Rule:** The projection is nested under one event. `event_id` must match the path. The event
document must exist before a client write. Cross-member reads are allowed only for that event's
manager (including the super-admin bootstrap) or for a member who holds their own live
`consented: true` projection under the same event. A projection on event A never unlocks event B.

**Why:** Doubles-pool nearby/availability decoration is event work. It is not a member directory.

## Allowed fields

**Rule:** Only these keys may appear:

| Field               | Type                      | Required | Purpose                              |
| ------------------- | ------------------------- | -------- | ------------------------------------ |
| `uid`               | string ≤ 128              | yes      | Owner id; must equal the document id |
| `event_id`          | string ≤ 128              | yes      | Must equal the path `eventId`        |
| `consented`         | bool                      | yes      | Live consent flag                    |
| `preferred_courts`  | list ≤ 50                 | no       | Nearby overlap                       |
| `preferred_zone`    | string ≤ 80               | no       | Zone tag                             |
| `availability_tags` | list ≤ 20                 | no       | Doubles-pool availability            |
| `available_to_play` | bool                      | no       | Play-now flag                        |
| `updated_at`        | timestamp or short string | no       | Client stamp                         |

`uid` and `event_id` are immutable after create. These fields never appear: `email_notifications`,
`scheduling_preference`, `event_creator`, leftover `stringer` / `coach` / provider ids,
`favourite_players`, or any contact channel.

**Why:** ADR-001 forbids role flags, notification settings, and provider identifiers on a
preference projection. Availability tags and preferred courts are the consented discovery slice
the doubles pool card needs; they are not a license to copy the private preferences document.

## Revocation

**Rule:** The owner revokes by writing `consented: false` or by deleting the projection. Cross-member
reads fail as soon as consent is false or the document is gone. Revocation does not mutate
`preferences/{uid}`. The owner may still read their own revoked row.

**Why:** Consent has to be withdrawable without a server job and without rewriting the private
source document.

## Fail closed

**Rule:** Anonymous users, members with no live consent on that event, members consented on a
different event, and every `public_preferences` read or write are denied. Extra fields, identity
mutation, and writes to another member's projection are denied.

**Compatibility residue:** `preferences/{uid}` remains world-readable (R7). That public document
is not this contract. Client decoration that needs consented discovery must read the event-scoped
projection; missing or revoked rows fail closed to empty data.

**Code:** `firestore.rules` (`eventPreferenceProjectionFields`, `validEventPreferenceProjectionShape`,
`canReadEventPreferenceProjection`, `/events/{eventId}/preference_projections/{userId}`,
`/public_preferences/{userId}`).

**Regression tests:** `tests/rules/firestore.preferenceProjection.test.mjs`.
