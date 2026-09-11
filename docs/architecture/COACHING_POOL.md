# Coaching pool

How coaching, bookings, and the retired group-lesson path work **today** on branch `spiderman`.
The D8 S5 product target is listed under Target state. Nothing in that target is built.

Diagram: [coaching pool](diagrams/coaching-pool.md). Field-level sketch:
[DATA_SHAPE.md](DATA_SHAPE.md) §9 (lesson add-on, 2026-08-28) and §10 (this target, 2026-08-31).
Product contact rule: [CONTACT_PRIVACY.md](../domain/CONTACT_PRIVACY.md).

## Current state

Coaching is a **catalog category**, not a pool. A member opens Marketplace → Coaches and sees
the same two callables as stringing: **Book** (`book`) and **Redeem a $N discount**
(`redeemReward`). There is no **Book group lesson** action, no `type` on bookings or offers, and
no `lesson_pool` collection. The monthly `group_lessons` collection is gone from Rules and
Functions (TASK-511 / D6 C8). `events.lesson` exists only as an unratified placeholder on the
shape-reference event; no runtime reader uses it.

## 1. Retired group lessons

D6 C8 (TASK-511) deleted the `group_lessons` Rules block and the Functions that read
`group_lessons/{month}`. Owner ruling 2026-08-31: **that collection is not coming back.** A group
lesson, when built, is a booking of **type** group classes — not a revival of the monthly roster.

What remains of the old path:

| Residue                                      | Current role                                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `group_lessons` in `RETIRED_COLLECTIONS`     | Shape-reference registry only                                                                  |
| `group_lesson_contact_access/{documentId}`   | Deny-all Rules match; no client read or write                                                  |
| `LEGACY_COMPAT_FIXTURES` monthly roster docs | Kept so the skipped e2e fixture still seeds; nothing in runtime reads them                     |
| `events.lesson` on the shape-reference event | Unratified minimum block; e2e plants it on `events/e2e-social`; Marketplace does not render it |
| `GROUP_LESSON_COACH_PROVIDER_ID` (`archie`)  | Exported from `functions/lib/constants.js`; no remaining callable imports it                   |
| `scripts/seed-rewards.mjs` comments          | Still name `joinGroupLesson()`; that callable is gone                                          |

`grep` of `firestore.rules` and `functions/` for `group_lessons` and `redemption_locks` is empty.
The skipped browser journey is [BUG-502](../development/bug/BUG-502-DETAILS.md).

## 2. Coaching as a catalog category

`services/{serviceId}` is the live catalog. `category` is `stringing` | `coaching` | `others`.
Public read; client write denied; owner-gated callable write (`upsertService`). Existing
`tasks` rows with `type: offer` remain a read-only compatibility fallback until an authorized
migration. Coupon documents store the service id in `redemptions.reward_id`, so catalog ids stay
stable.

Provider identity is `providers/{providerId}` (roles `stringer` | `coach` | `other`, optional
`member_uid`). That row is the only provider-role authority. Leftover preference flags
`coach` / `coach_id` do not grant a privileged coach Rules predicate.

## 3. Actions on a coaching service today

Every active service card, coaching included, exposes two buttons:

| UI label                 | Callable       | What it writes                                                                                          |
| ------------------------ | -------------- | ------------------------------------------------------------------------------------------------------- |
| **Book**                 | `book`         | `bookings/{id}` at `status: lead`. Then `recordServiceLead` (provider lead row + connection).           |
| **Redeem a $N discount** | `redeemReward` | `redemptions/{code}` coupon; decrements the member's redeemable balance via `offers/{uid}.pointsSpent`. |

There is no third action. The redeem label is the discount amount, not the words "Redeem
discount", but it is the same callable for every category. Book is enabled even when the member
cannot afford the points cost.

## 4. Bookings — one lifecycle, no type

`bookings/{bookingId}` is callable-only write. Member, assigned provider, or super-admin may
read. The document has `service_id`, `provider_id`, `uid`, `user_name`, `status`, optional
`note`, timestamps. It has **no `type`**.

Lifecycle (L11, stamp renamed D6 C6):

```
lead → in_progress → completed
lead → cancelled     (only from lead; points are not involved — this is not a coupon)
```

`marked_completed_at` is a stamp on `in_progress` while the member answers; it is not a fourth
status. The callable names are stringing-shaped (`racquetDropped`, "Got your racquet back?") and
are what a coaching **Book** currently runs through. `flagged` / `cancel_requested` /
`redemption_locks` are not on bookings.

`offers/{uid}` is only the server-owned `pointsSpent` projection. It is not a typed catalog and
does not store group-class / private-class / stringing.

## 5. Event lesson placeholder

The shape-reference `events` document carries:

```
lesson: { coach_provider_id, coach_name, capacity: 4, players: [{ uid, name, joined_at }] }
```

Comment on that block: **PROPOSED, NOT RATIFIED.** Local fixtures copy it onto `events/e2e-social`.
No page, hook, or Function reads `events.lesson`. Batching four players across an event is not
derivable from `event_participants`, which is why the target storage is a separate pool (section
Target state), not this embedded roster.

## 6. Coach ↔ player contacts

Contacts read as **owner or `isConnectedTo`**. There is no `isCurrentGroupLessonCoachFor`
predicate and no monthly roster reader.

A **Book** on a service whose provider has `member_uid` writes `connections/{pair}` with
`reason: 'service-lead'` (`functions/lib/serviceLeads.js`). That is the live coach↔player
contact path: it is the same marker as an accepted rally, challenge, or tournament fixture.
Rules do not inspect `reason`; any existing pair document is enough.

The rules unit test plants `reason: 'coaching session'` to prove the mutual read. **No Function
in this checkout writes that reason string.** Booking a coaching service uses `service-lead`.
Joining a coaching session as an event add-on has no writer, because that join does not exist.

`group_lesson_contact_access` remains a closed collection. Partner-pool contacts are a third,
event-scoped projection and are unrelated to coaching.

## 7. Status vocabulary

| Domain               | Current code                                                          | Target (not built)                                             |
| -------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| Service category     | `stringing` · `coaching` · `others`                                   | Unchanged as the catalog split                                 |
| Service actions      | **Book** · **Redeem a $N discount**                                   | **Book group lesson** · **Book** · **Redeem discount**         |
| Booking / offer type | Absent                                                                | `group classes` · `private classes` · `stringing` · extensible |
| Booking status       | `lead` · `in_progress` · `completed` · `cancelled` (from `lead` only) | Same lifecycle; type distinguishes the job                     |
| Coupon status        | `active` · `used` · `flagged` · `cancel_requested` · `cancelled`      | Unchanged; coupons stay separate from bookings                 |
| Coaching pool        | No collection                                                         | `lesson_pool/{eventId}/members/{uid}`                          |
| Retired roster       | `group_lessons` gone; deny-all on `group_lesson_contact_access`       | Never revived                                                  |
| Connection reason    | `service-lead` on Book; test-only `coaching session`                  | Coaching-session join writes the same `connections` marker     |

## Target state

Documented by D8 S5 (TASK-606). **Not built.** [TASK-663](../development/task/TASK-663-DETAILS.md)
is the later schema-approval row.

A coaching service offers three actions: **Book group lesson**, **Book**, and **Redeem
discount**. Pooling is **not limited to socials** — it applies to any event that offers coaching.
A member who chooses coaching at event sign-up is pooled; coaches take a batch of four.

Bookings and offers gain a **type**: group classes, private classes, stringing, with room for
more. **Book group lesson** is an action on a coaching service; the resulting job is a booking
of type group classes.

Storage follows the partner-pool precedent (D6 F1): `lesson_pool/{eventId}/members/{uid}`.
Batching four players across an event is not derivable from a participant row the way the
doubles pool also could not be. The old `group_lessons` collection is never revived. Nothing
reads or writes it again.

The five unanswered questions in [DATA_SHAPE.md](DATA_SHAPE.md) §9 still block a ratified
schema: $20 vs $15 tiers, the "free 15/hr" contradiction, where the add-on fee sits against
`services` and `bookings`, whether "games" hold state, and (now recorded) that the pool lives
at `lesson_pool/{eventId}/members/{uid}` when it is built.

## Evidence

- `src/pages/services/ServicesElements.tsx` — OfferCard **Book** and redeem; comment that group
  lessons are retired.
- `src/features/services/types.ts` — `ServiceCategory`, `Booking` (no `type`), coupon statuses.
- `src/features/services/servicesApi.ts` — `book`, `redeemReward`, stringing-shaped booking
  transitions.
- `functions/bookings.js` — `book` creates `lead` with no type; `recordServiceLead`.
- `functions/lib/serviceLeads.js` — `connections` reason `service-lead`.
- `functions/rewards.js` — `redeemReward`.
- `firestore.rules` — `services` public read / client write denied; `bookings` callable-only
  write; contacts `isOwner \|\| isConnectedTo`; `group_lesson_contact_access` deny-all; no
  `group_lessons` match; no `lesson_pool` match.
- `tests/fixtures/shape-reference.mjs` — unratified `events.lesson`; `group_lessons` retired.
- `tests/e2e/local-emulator.spec.ts` — skipped coach-contact journey (BUG-502).
- `tests/rules/firestore.rules.test.mjs` — coaching-session connection mutual read.

## Risks and open questions

- Staging and production documents were not inspected. Do not infer that live data still
  contains `group_lessons/{month}` rows, or that it does not.
- `GROUP_LESSON_COACH_PROVIDER_ID` and the `seed-rewards.mjs` `joinGroupLesson` comment are
  leftover names. They are not a revival of the collection.
- Booking copy and callables are racquet-specific. A coaching **Book** today still runs
  `racquetDropped` / "Is your racquet back?".
- `services.contact_phone` / `contact_email` are world-readable. Provider contact through a
  booking connection stays deferred (D6 C12).
- No Function writes `reason: 'coaching session'`. Mutual coach contact after a Book depends on
  the provider row carrying `member_uid`.
- Building the pool is [TASK-663](../development/task/TASK-663-DETAILS.md) / BLG0061, after the
  five §9 questions are answered. This document does not answer them.
