# Core data flows

Diagram: [core data flow](diagrams/core-data-flow.md).

## 1. Signup, login, and profile bootstrap

Full journey: [account creation](ACCOUNT_CREATION.md). Diagram: [account creation](diagrams/account-creation.md).

1. `/login` and `/signup` render the same Signup screen. The first step is the email gate.
2. `emailExistsForSignup` calls `checkSignupEmail` so the browser never queries `contacts`
   anonymously. Deployed calls require App Check. The callable allows 30 lookups per 60 seconds
   per hashed source IP; over that it returns `resource-exhausted`. Lookup failures fail closed.
3. The callable queries `contacts.email` and `contacts.secondary_email` and returns only
   `{ exists, secondary }`. `exists` → login; `secondary` → block (merged duplicate, not an Auth
   credential); else create.
4. A new email/password account is `createUserWithEmailAndPassword` after client password rules
   (6–80 characters, not a simple numeric/alpha run). There is no email-verification step.
   Google/Apple use the same bootstrap; an existing password account with a different provider is
   linked after the password is entered.
5. `AuthContext` observes Auth and calls `ensureUserProfileDocuments`, which creates any missing
   `users/{uid}`, `stats/{uid}`, `preferences/{uid}`, and `contacts/{uid}` (contacts seeded with
   the Auth email).
6. Profile completion (`persistSignupProfile`) writes name, optional phone, skill, optional league,
   courts, and derived zone in one batch. An empty `users.name` keeps the member on the completion
   screen. Skill defaults to `2.0` if unanswered.
7. `users.welcomeEmailSent` flips true once the name is set; `sendWelcomeEmail` fires on that
   transition. `users.isVerified` is set true on first signed-in profile load.

Evidence: `src/pages/Signup.tsx`, `src/features/signup/signupValidation.ts`,
`src/features/signup/profilePersistence.ts`, `src/context/AuthContext.tsx`,
`src/lib/profileBootstrap.ts`, `src/features/auth/useOAuthSignIn.ts`, `functions/accountLookup.js`.

## 2. Event join, draw, score, advancement, and stats

1. The member reads public `events` and creates an `event_participants` document.
2. An organizer reads participants and writes event/draw configuration or a nested RR draft.
3. Draw generation creates or updates `matches`; the connection trigger can link real player pairs.
4. Players create untrusted score submissions; an event owner or explicitly assigned organizer
   confirms a result through the `applyTournamentResult` callable.
5. The callable re-reads the event, match, participants, and optional submission, then atomically
   records the bounded score, idempotency marker, established statistics/points deltas, and valid
   next-round advancement. No-show and walkover remain distinct result types.
6. History and rankings read the resulting `matches`, `stats`, and `ranking_history` projections.

Evidence: `src/features/events/hooks/useJoin.ts`, `src/pages/tournament/useTournament.ts`,
`src/features/tournament/services/tournamentResultService.ts`, `functions/tournamentResults.js`,
`functions/lib/tournamentResult.js`, `src/pages/tournament/rrGeneration.ts`.

### Walkover naming along the score path

The walkover flag carries one name for the whole journey. The browser builds a score intent whose
field is `walkover`, the callable validates `input.walkover`, and the stored match document carries
`walkover`. The earlier client-side `isWalkover` intent field is retired, and the `is_walkover`
document spelling is recorded in the retired-field registry rather than left as a silent alias.
This is the owner's one-name-per-thing ruling applied to the field that crosses the most
boundaries: form, domain rule, callable, document, and every downstream reader.

Behaviour is unchanged by the rename. A walkover is still stored as an all-zero score, still
distinct from a no-show, and still recordable only by an event organizer; a walkover carrying a
non-zero score is still rejected. Matchday counting continues to exclude walkovers.

The rename covers the data-carrying field, not every local identifier: presentation code may still
name a derived local flag `isWalkover` where it never leaves the component.

Evidence: `src/features/tournament/domain/scoreSubmission.ts`, `src/pages/tournament/useTournament.ts`,
`functions/lib/tournamentResult.js`, `functions/tournamentResults.js`, `functions/groupAwards.js`,
`tests/fixtures/shape-reference.mjs`.

## 3. Tasks, points, rewards, and redemption

1. A member creates permitted task claims, check-ins, attendance, or photo reports.
2. Firestore triggers validate the event category and award progress/counters in Functions.
3. Group-award triggers maintain deterministic per-recipient ledger documents and aggregate state.
4. The client calls callable Functions for redeem, coupon use/flagging, cancellation, review, and booking transitions (`book`, `racquetDropped`, completion, `cancelLead`). The retired monthly roster has no join or leave callable.
5. The client reads projections such as `offers/{uid}`, notifications, and task progress.

Evidence: `src/features/tasks/**`, `src/features/services/servicesApi.ts`, `functions/taskPoints.js`, `functions/groupAwards.js`, `functions/rewards.js`, `functions/bookings.js`.

## 4. Marketplace listing and contact reveal

1. The member uploads listing images to `listings/{uid}/...` in Storage.
2. The member creates a public `listings` document after upload.
3. `moderateUploadedImage` handles finalized objects; unsafe uploads are removed.
4. `onListingContact` maintains `public_contacts/{uid}` while the seller has a listing.
5. A signed-in buyer can use the listing-mediated contact path; the actual contact document remains protected by Rules.

Evidence: `src/features/marketplace/listingService.ts`, `storage.rules`, `firestore.rules`, `functions/index.js`, `functions/connections.js`.

## 5. Notifications and email

Functions create recipient-scoped `notifications` documents. `notify.js` separately loads profile/preferences/contact data, respects the email opt-out, and sends email through Resend using the configured branded sender/reply-to. Email failures are logged without blocking the in-app notification.

Evidence: `functions/lib/notify.js`, `functions/lib/constants.js`, `src/features/notifications/useNotifications.ts`.

## 6. Location derivation

1. The member writes `preferences.preferred_courts`.
2. `onPreferredCourtsChanged` maps those courts through `functions/courts.json`.
3. If any court is a known Toronto court, Functions merge `{ location: 'Toronto' }` onto `stats/{uid}`; otherwise they delete the field.
4. Challenge and rally **results** call `assertPlayableLocationPair`. Two different cities fail; an unset member may play.

The shipped CSV `public/Tennis Courts Facilities - 4326.csv` is the canonical court roster. `functions/courts.json` (courtKey → zone) and `src/utils/zoneCourtCounts.ts` (per-zone `.sites` / `.courts`) are generated from it by `scripts/build-court-roster.mjs`. Validation fails when site or key counts drift. Coverage denominators use `.sites` (CSV rows), never `.courts` (playing surfaces). Runtime `court_resolutions` overlay a zone without editing the shipped CSV.

Diagram: [location scoping](diagrams/location-scoping.md).

Evidence: `functions/location.js`, `functions/lib/memberLocation.js`, `functions/lib/playLocation.js`, `functions/competitionResults.js`.

## 7. Challenge and rally

1. A member creates an open `matches` document with `category` `challenge` or `rally` and themselves as `player_1_uid`.
2. `player_2_uid` accepts or declines. Decline persists `status: declined`, so the request stays off the rejector's tab after refresh.
3. Either player may cancel an **accepted** match through `cancelMatch`, which deletes the document and notifies the other player. Retracting an **open** request remains a sender delete.
4. Either player reports a bounded score. Challenge/rally **results** go through `challengeResults`. Rally **points** pay when a different party confirms, via `onRallyConfirmedAwardPoints` (winner +2, loser +1 `leaguePoints26`).
5. The reporter cannot confirm their own rally report.

Diagram: [play loops](diagrams/play-loops.md).

Evidence: `firestore.rules` matches match, `src/features/rallies/`, `src/features/matches/matchLifecycle.ts`, `functions/competitionResults.js`, `functions/matchCancel.js`, `functions/lib/matchCancel.js`, `functions/lib/challengeNotifications.js`, `functions/rallyPoints.js`, `functions/lib/rallyResult.js`.

## 8. Partner pool

1. A member creates `partner_pool/{eventId}/members/{uid}` with allowlisted keys.
2. `onPartnerPoolJoin` writes the contact projection and notifies same-category members.
3. Pool members read `partner_pool/{eventId}/contacts/{uid}`.
4. Leave or manager-remove deletes membership; `onPartnerPoolLeave` drops the projection.

Diagram: [partner pool](diagrams/partner-pool.md).

Evidence: `src/features/events/services/partnerPool.ts`, `src/features/partnerPool/usePool.ts`, `functions/partnerPool.js`, `firestore.rules`.

## 9. Coaching services, bookings, and the pool

Full record: [coaching pool](COACHING_POOL.md). Diagram: [coaching pool](diagrams/coaching-pool.md).

1. Marketplace lists active `services` by `category` (`stringing` | `coaching` | `others`).
2. **Book** calls `book` and creates `bookings/{id}` at `lead` with no `type`. **Redeem a $N
   discount** calls `redeemReward`. Coaching has no third action.
3. `recordServiceLead` writes `providers/{id}/leads/{uid}` and, when the provider has
   `member_uid`, a `connections` pair with reason `service-lead`. That pair is the live
   coach↔player contacts path.
4. There is no `lesson_pool` collection and no **Book group lesson** action. `group_lessons`
   is retired (TASK-511). `events.lesson` is an unratified placeholder read by nothing.
5. Target (not built): pooling on **any event** that offers coaching, stored at
   `lesson_pool/{eventId}/members/{uid}`; bookings/offers gain type group classes, private
   classes, stringing (extensible). A group lesson is a booking of type group classes.

Evidence: `src/pages/services/ServicesElements.tsx`, `src/features/services/servicesApi.ts`,
`functions/bookings.js`, `functions/lib/serviceLeads.js`, `functions/rewards.js`,
`firestore.rules`.

## Target state, risks, and open questions

- Tournament result application now has one server-authoritative transaction. Challenge results
  use `challengeResults`. Rally points use `onRallyConfirmedAwardPoints`. Manual Round Robin group
  bonuses use `setGroupBonus`: event-manager authorized, stamp-idempotent, audited, and
  stats-reconciled in one transaction. The browser still refuses completed-result reset/cancellation;
  that control can be re-enabled only through a bounded server operation.
- BUG-507: a valid rally-report update currently hits a Rules evaluator error. Do not treat the
  rally-report Rules path as green.
- BUG-508: Functions emulator integration still has timeout/request failures on the final gate.
- Accepted result flow: the client submits result intent; an idempotent callable or server trigger
  validates caller authentication, event ownership/assignment, match identity and current state,
  both participants, winner membership, bounded set scores, distinct no-show/walkover semantics,
  advancement target, and exact stats/points deltas before one transaction applies the outcome.
- Established scoring values do not change as part of moving authority. Compatibility reads may
  support historical match shapes, but clients may not use compatibility as a protected write path.
- Target: run the same flows against emulators, then staging, with seed data and rules/function integration tests.
- Open: confirm deployed trigger versions and whether historical documents contain all fields assumed by current readers.
