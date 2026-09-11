# Public-field sensitivity contract

Approved classification for every public Firestore surface. Firestore Rules cannot hide a field
on a readable document, so a public collection may only hold fields this contract allows.

Diagram: [authorization boundaries](diagrams/authorization-boundaries.md). Contact-channel
readership is [contact privacy](../domain/CONTACT_PRIVACY.md). Collection access is
[data model](DATA_MODEL.md). Field spelling is [data shape](DATA_SHAPE.md).

## Current state

PD1 / L9 / R7: identity, rankings, events, listings, the services catalog, task progress, and
site aggregates are world-readable. `contacts` and `mailing_list` are not. `preferences` is a
public projection; `public_preferences` is reserved deny-all and is not a live reader path.

Rules enforce the contract two ways:

- Client-writable public documents use `hasOnly()` / `affectedKeys().hasOnly()` allowlists
  (`users`, `stats`, `preferences`, `tasks`, `listings`, event participants, pool membership).
- Surfaces without a full allowlist (`events`, tournament `matches` writes) reject
  `sensitiveContactFields()` on create and refuse to add them on update.

`services.contact_phone` and `contact_email` remain on the world-readable catalog until booking
connections land ([deferred 4.2](../planning/deferred/DEFERRED-AND-FUTURE.md)). That is a
recorded exception, not a model to copy.

**Docs that still disagree.** `docs/engineering/SECURITY_BASELINE.md` and
`docs/runbooks/FIRESTORE_BACKUP_AND_RECOVERY.md` describe `preferences` as private. Current
`firestore.rules` and PD1 make them public. This contract follows the Rules and PD1.

## Classification

| Class                     | Meaning                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| **Public**                | Intended on a world-readable or authenticated-member-wide document                                  |
| **Sensitive**             | Contact, account-recovery, or other PII. Lives on a private collection or an allowlisted projection |
| **Server-owned**          | Functions / Admin SDK write; clients cannot create, update, or delete                               |
| **Compatibility residue** | May exist on live documents; not a grant; clients cannot write it                                   |

Sensitive fields that must not accumulate on a public document:

`email`, `phone`, `secondary_email`, `whatsapp_contact`, `whatsapp_same_as_phone`,
`preferred_mode_of_contact`, `contactable`, `contact_phone`, `contact_email`.

`secondary_email` is account-recovery metadata. It never copies onto a projection.

## World-readable surfaces (`allow read: if true`)

| Path                                 | Public fields                                                                                                  | Sensitive / forbidden on this surface                              | Write owner                                                                                                                       | Compatibility                                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `users/{uid}`                        | `uid`, `name`, `avatar`, `bio`, `display_badges`, `created_at`, `lastActive`, `isVerified`, `welcomeEmailSent` | Contact channels; `age_bracket` is shape-only, not client-writable | Owner create/update of the allowlist; `uid` / `created_at` immutable                                                              | Missing optional fields write. Legacy extra keys may block `hasOnly` updates.                                        |
| `stats/{uid}`                        | Identity, skill, league, counters, rank fields, derived `location`                                             | Contact channels; protected counters after create                  | Owner may edit `skill_level`, `tournament_preference`, `name`, `uid`, `league`. Points, wins, location, rank are Functions-owned. | Zeroed counters on create. Unset `location` is valid. `loses` may still exist; clients cannot write it after create. |
| `preferences/{uid}`                  | Courts, zone, availability, scheduling, favourites, `email_notifications`, `event_creator`                     | Contact channels; leftover `stringer` / `coach` / `*_id` flags     | Owner-safe fields. `event_creator` is not self-assignable.                                                                        | Leftover provider flags are residue, not a grant. `event_creator` stays readable until the PD6 cutover.              |
| `providers/{providerId}`             | `id`, `name`, `roles`, `member_uid`, `area`, `updated_at`                                                      | Contact channels                                                   | Server-only                                                                                                                       | Preference flags never grant this row.                                                                               |
| `events/{eventId}`                   | Catalog, schedule, format, zones, `creator_id`, `organizer_ids`                                                | Contact channels                                                   | Creator create; manager update. `organizer_ids` is callable-owned.                                                                | Nested maps stay application-validated. `events.lesson` is an unratified placeholder.                                |
| `site_stats/{id}`                    | Aggregates, zone-sweep coverage, contributor uids                                                              | Admin metrics (those live on `admin_stats`)                        | Server-only                                                                                                                       | `updatedAt` / `updated_at` both appear in historical docs.                                                           |
| `tasks/{id}`                         | Progress flags, counters, tier ids, `bonusPoints`                                                              | Contact channels; clients cannot write counters or tier flags      | Owner may write the short progress allowlist. Award fields are Functions-owned.                                                   | Offer catalog rows (`type: offer`) are a read-only fallback until `services`.                                        |
| `ranking_history/{uid}/entries/{id}` | `date`, `position`, `direction`                                                                                | Contact channels                                                   | Server-only                                                                                                                       | Append-only.                                                                                                         |
| `services/{serviceId}`               | Catalog, prices, points, provider link, `active`                                                               | **Exception:** `contact_phone`, `contact_email` stay until 4.2     | Server-only                                                                                                                       | Do not add further contact fields. Closing the exception is booking-connection work, not this contract.              |
| `listings/{id}`                      | Kind, title, description, condition, price, pickup, duration, photos, status, owner identity                   | Contact channels                                                   | Owner create/delete; owner or super-admin update of the allowlist                                                                 | Contact is `public_contacts/{uid}`, never this document.                                                             |

Anonymous visitors can read every row in this table. That is intentional for leaderboards,
events, listings, and the catalog.

## Authenticated member-wide surfaces

Readable by any signed-in member; not by anonymous users. Same field rule: no contact channels
except on an allowlisted projection.

| Path                                   | Public-to-members fields                         | Sensitive                                                     | Write owner                                                                    |
| -------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `event_participants/{id}`              | Roster identity, zone, doubles, status           | Contact channels                                              | Participant or event manager; field allowlist                                  |
| `partner_pool/{eventId}/members/{uid}` | `uid`, `name`, `category`, `skill`, `created_at` | Contact channels                                              | Own create/delete; manager delete; no update                                   |
| `matches/{id}`                         | Fixture, score, schedule, points paid            | Contact channels                                              | State-specific player/manager writes; no `no_show` / group-bonus client writes |
| `courts/{id}`                          | Check-in, attendance, approved reports           | `email`; EXIF GPS is stored and member-readable (privacy 4.1) | Append-only creates; no update/delete                                          |
| `court_resolutions/{courtKey}`         | Court name / zone overlay                        | —                                                             | Server-only                                                                    |
| `public_contacts/{uid}`                | Listing-safe contact projection                  | `secondary_email` must never appear                           | Server-only; authenticated read                                                |

`courts` reports may still carry EXIF GPS from the photo pipeline. That is disclosed as deferred
Privacy Policy work, not as a field this contract makes public-by-design.

## Private surfaces (not public)

| Path                                    | Readers                              | Notes                                |
| --------------------------------------- | ------------------------------------ | ------------------------------------ |
| `contacts/{uid}`                        | Owner or `connections/{pair}` holder | Source of truth for contact channels |
| `mailing_list/{id}`                     | Super-admin                          | Anonymous bounded create             |
| `bookings/{id}`                         | Member, linked provider, super-admin | Callable-owned                       |
| `payments/{id}`                         | Owner                                | No card data                         |
| `offers/{uid}`                          | Owner or super-admin                 | `pointsSpent` only                   |
| `redemptions/{code}`                    | Owner, linked provider, super-admin  | Server-only writes                   |
| `notifications/{id}`                    | Recipient                            | Server create                        |
| `connections/{pair}`                    | The two uids                         | Server-only writes                   |
| `admin_stats/{id}`                      | Super-admin                          | Must not move onto `site_stats`      |
| `task_claims/{id}`                      | Owner, event manager, super-admin    |                                      |
| `partner_pool/{eventId}/contacts/{uid}` | Current pool members                 | Server projection                    |
| `events/{eventId}/rr_drafts/{drawKey}`  | Event creator                        | Unpublished organizer workspace      |
| `*_audit/{id}`                          | Super-admin                          | Append-only                          |
| `public_preferences/{uid}`              | Nobody                               | Reserved deny-all                    |
| `_archive_database_consolidation/**`    | Nobody                               | Admin SDK only                       |
| `group_lesson_contact_access/{id}`      | Nobody                               | Retired                              |

`awards` is declared in the shape contract and is not a live Rules surface; it denies by default.

## Projection ownership

A projection is a server-written document copied from a private source for a specific audience.
Clients never write one. Empty or private-only channels are omitted at write time.

| Projection                              | Writer                                    | Audience                                              | Source                         | Copies                                                                                                                                                  | Never copies                                          |
| --------------------------------------- | ----------------------------------------- | ----------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `public_contacts/{uid}`                 | `onListingContact`, `onContactProjection` | Authenticated members, while the seller has a listing | `contacts/{uid}`               | `email`, `phone`, `preferred_mode_of_contact`, `whatsapp_contact`, `whatsapp_same_as_phone`, `contactable`, plus `uid`, `reason: listing`, `updated_at` | `secondary_email`                                     |
| `partner_pool/{eventId}/contacts/{uid}` | `onPartnerPoolJoin`; deleted on leave     | Members of that event's pool                          | `contacts/{uid}`               | Present channels only                                                                                                                                   | `secondary_email`, blanks, unrelated account metadata |
| `stats/{uid}.location`                  | `onPreferredCourtsChanged`                | World (on `stats`)                                    | `preferences.preferred_courts` | City string                                                                                                                                             | Court GPS                                             |
| `ranking_history/{uid}/entries/{id}`    | `rankSnapshot`                            | World                                                 | `stats` rank fields            | Date, position, direction                                                                                                                               | Identity beyond the path uid                          |
| `site_stats/{id}`                       | aggregate Functions                       | World                                                 | Counts and coverage            | Aggregates                                                                                                                                              | `admin_stats` metrics                                 |
| `providers/{id}`                        | Admin SDK / owner-gated callables         | World                                                 | Issued identity                | Roles, optional `member_uid`                                                                                                                            | Preference stringer/coach flags                       |
| `public_preferences/{uid}`              | None                                      | Deny-all                                              | —                              | —                                                                                                                                                       | Everything. Do not backfill.                          |

Cross-member preference decoration fails closed until a product-approved event-scoped or
consented projection exists (BLG0051). Posting a listing is the consent that creates
`public_contacts`. Joining a doubles pool is the consent that creates the pool contact row.

## Compatibility behavior

- **Missing optional fields remain writable.** Bootstrap documents without `bio`, empty court
  lists, or unset `location` must succeed.
- **Clients cannot add sensitive fields** to a public or member-wide document.
- **Legacy extra keys** on a `hasOnly()` document are visible (Rules cannot field-filter) and may
  block later client updates. They are not a reason to widen the allowlist. Strip them only with
  an approved migration.
- **Do not backfill `public_preferences`.** Existing `preferences` rows do not prove consent for a
  narrower projection, and the live collection is already world-readable.
- **Leftover `preferences.stringer` / `coach` / `*_id`** are residue. Authority is
  `providers/{id}.member_uid`.
- **`event_creator`** stays on public `preferences` until the PD6 cutover. It is not
  self-assignable.
- **`services.contact_*`** stay until booking connections replace them. New public collections
  must not put contact channels on the document.
- Rollback of a projection deletes only the projection. It does not rewrite the private source.

## Target state

Keep world-readable leaderboards, events, listings, and catalogs. Keep contact channels on
`contacts` plus named projections. Replace the services-catalog contact exception with a
booking-connection projection when that work is scheduled. Replace leftover preference role
flags with the provider/organizer registries already in use.

## Evidence

- `firestore.rules` — `sensitiveContactFields`, collection allowlists, projection write denies
- `functions/connections.js` — `publicContactFields`
- `functions/lib/partnerPool.js` — `contactProjection`
- `src/features/marketplace/listingDocument.ts` — listing allowlist; `normalizeListingContact`
- `tests/rules/firestore.publicFields.test.mjs`
- `tests/rules/firestore.listings.test.mjs`, `tests/rules/firestore.rules.test.mjs`

## Open questions

- Exact fields on deployed legacy documents, and which compatibility keys can be retired
  (staging: TASK-660).
- Which public profile fields are intentionally searchable by logged-out visitors beyond the
  world-readable collections named here.
- Booking-connection replacement for `services.contact_*` (deferred 4.2).
- Event-scoped or consented preference projection (BLG0051). Until then, `public_preferences`
  stays deny-all.
