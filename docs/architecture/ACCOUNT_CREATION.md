# Account creation

How a member account is created **today** on branch `spiderman`. Product intent that is not in
the code is listed under risks, not as current behaviour.

Diagram: [account creation](diagrams/account-creation.md). The overview sits in
[core data flow](DATA_FLOW.md) §1.

## Current state

`/login` and `/signup` render the same `Signup` screen. There is no email-verification step. The
journey is email gate → password (or Google/Apple) → profile completion. Pre-auth contact lookup
goes through the `checkSignupEmail` callable so the browser never queries `contacts` anonymously.
Missing profile documents are created by `ensureUserProfileDocuments`; the completion step then
overwrites them atomically.

## 1. Email gate

The first phase is `email`. Continue trims the address, requires `EMAIL_REGEX`
(`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), and calls `emailExistsForSignup`. Lookup failures fail closed:
the screen stays on the gate with "We could not securely verify this email. Please try again."
The client does not treat a callable error as "address is free."

`emailExistsForSignup` returns one of three **UI** results (not stored):

| Result      | When                                                                                | Next phase                      |
| ----------- | ----------------------------------------------------------------------------------- | ------------------------------- |
| `primary`   | `contacts.email` matches, or Firebase Auth reports a sign-in method for the address | `login`                         |
| `secondary` | `contacts.secondary_email` matches                                                  | stay on `email`; signup blocked |
| `none`      | neither contacts query hits, and Auth lists no methods                              | `account` (password)            |

The callable itself returns only `{ exists, secondary }` booleans — no names, uids, or other
fields. A second client check, `fetchSignInMethodsForEmail`, runs only after both contact queries
are negative. Email-enumeration protection can make that Auth call return `[]`; a thrown Auth
error is treated as `none`. Mailcheck may suggest a typo; it does not change the lookup.

Google and Apple buttons sit on the same gate. They skip the email lookup and go through
`useOAuthSignIn`.

## 2. Password and Auth account

Phase `account` collects password and confirmation only. Client rules (`validatePassword`):

- length 6–80
- trimmed length at least 3
- rejected if the lowercased value is a substring of `1234567890abcdefghijklmnopqrstuvwxyz`
- confirmation must match

On pass, `createUserWithEmailAndPassword` creates the Firebase Auth user. Persistence is local.
There is no verification mail. The screen sets `sessionStorage` key
`profile-bootstrap-pending:{uid}` (and clears `profile-bootstrap-retry:{uid}`); nothing in this
checkout reads those keys. Auth errors map through `getSignupErrorMessage` (`email-already-in-use`,
weak password, network).

Phase `login` (existing primary address) uses `signInWithEmailAndPassword`. Forgot-password sends
`sendPasswordResetEmail`. If Google/Apple hit `auth/account-exists-with-different-credential`, the
pending OAuth credential is held and linked after a successful password sign-in.

OAuth uses popup, then redirect when the popup is blocked. A **new** provider user is bootstrapped
immediately and sent to `/login` (same `Signup` component), which then opens completion because
`users.name` is still empty. A **returning** provider user goes to the safe `next` path.

## 3. Profile bootstrap and completion

`AuthContext` observes Auth and calls `ensureUserProfileDocuments` (`src/lib/profileBootstrap.ts`).
For each missing document, the owner creates:

| Collection          | Seed                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `users/{uid}`       | `name` from Auth display name (often empty), `avatar` from photo URL, `created_at` ISO, `uid`                                            |
| `stats/{uid}`       | `name`, `skill_level: 2`, `tournament_preference: 'Challengers'`, zeroed counters, `league: ''`, `uid`                                   |
| `preferences/{uid}` | empty courts/tags/favourites, `scheduling_preference: 'I will schedule matches on my own'`, `event_creator: false`, `preferred_zone: ''` |
| `contacts/{uid}`    | Auth email, empty phone/WhatsApp, `preferred_mode_of_contact: []`, `contactable: false`, `updated_at`                                    |

`contacts` is created even for legacy accounts on first sign-in after the contacts split. A
missing contacts document is **not** treated as fatal when reading the profile; missing `users`,
`stats`, or `preferences` is.

Phase `preferences` is one screen (About you, Skill, Courts, League). `handleCompleteProfile`
requires a valid name (3–80 characters, no digits). Phone is optional; if supplied it must be
exactly ten digits. Skill, league, and preferred courts are **not** required. Skill defaults to
`2` in form state, so an unanswered skill is stored as `2.0`. League may stay `''`. Courts may
stay `[]`; zone is derived from selected courts (majority, or a near-border prompt for a single
court) and written as `preferences.preferred_zone` — signup does **not** set
`preferred_zone_manual`. Scheduling preference is not collected on the screen; the default is
written through. `organizer` exists on form state and is unused.

`persistSignupProfile` writes the four projections in one batch:

- `users.name`
- `contacts.email`, `contacts.phone`, `contactable` (true when a phone is present), `updated_at`
- `stats.name`, `stats.skill_level`, and `stats.league` only when a league was chosen (`Men's` /
  `Women's`, plus optional ` Retired Pro` or ` Juniors`)
- `preferences.preferred_courts`, `preferred_zone`, `available_to_play: true`,
  `scheduling_preference`

A persistence failure keeps the member on the form; it does not flip the UI to `done`. On
success, Firebase Auth `displayName` is updated, the profile is refreshed, and phase `done`
thanks the member. A welcome email fires when `users.welcomeEmailSent` flips false → true, which
`AuthContext` does only after `users.name` is non-empty. `users.isVerified` is set true on the
first successful signed-in profile load. Both flags are client-owned one-way booleans.

The consent line on the completion screen is `SHARED_DRAW_CONSENT`: "A shared draw includes your
contact details so other participants can reach you."

Location is not a signup field. `onPreferredCourtsChanged` later derives `stats.location` from
preferred courts (Toronto only). Unset location is allowed.

## 4. Duplicate-address path

`contacts.secondary_email` is the merge marker. It is set only by the account-merge admin
script when two signups (different emails) are the same person. It is not shown or edited in
any UI.

`checkSignupEmail` queries `contacts` where `email ==` the candidate **and** where
`secondary_email ==` the candidate (each `limit 1`). Comparison is the trimmed string as
submitted; the callable does not lowercase. If `secondary` is true, the gate blocks with:

> This email is linked to an existing account under a different address. Please sign in with
> the email you originally registered with.

That address is not an Auth credential, so sending the member to `login` would fail. The block
prevents a third Auth user for the same person.

Owner rules allow `secondary_email` in the contacts field allowlist (so an owner write of an
existing document does not fail closed on that key). The signup batch does not write it.

## 5. Throttling

`checkSignupEmail` is a `us-central1` callable.

| Control     | Current code                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| App Check   | Enforced when `FUNCTIONS_EMULATOR !== 'true'`. The Functions emulator bypasses it for synthetic tests |
| Input       | Trimmed string, max 320 characters                                                                    |
| Rate window | 60 seconds                                                                                            |
| Rate limit  | 30 successful lookups per window                                                                      |
| Actor key   | SHA-256 of the first `X-Forwarded-For` hop, else request IP, hex-sliced to 32 characters              |
| Store       | `_account_lookup_rate_limits/{actorKey}` via Admin SDK (`window_start_ms`, `count`, `expires_at`)     |
| Over limit  | `HttpsError('resource-exhausted', 'Please wait before checking another email.')`                      |

The rate-limit collection has no Rules match; clients fall through to deny. Only the Admin SDK
writes it. Exceeding the window is the only throttle; there is no per-email lockout and no
client-side debounce beyond the Continue button's loading state.

## 6. Status vocabulary

UI phases and lookup results are not Firestore fields. Stored account-creation flags:

| Domain               | Values / field                                         | Role                                                                                |
| -------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Signup screen phase  | `email` · `login` · `account` · `preferences` · `done` | Client-only `AuthPhase`. Not stored.                                                |
| Email-gate result    | `primary` · `secondary` · `none`                       | Client-only. Drives login vs create vs block.                                       |
| Callable payload     | `exists` · `secondary` (booleans)                      | Pre-auth answer. Never returns member data.                                         |
| Lookup throttle      | `resource-exhausted`                                   | Callable error when the hashed source exceeds 30 / 60s.                             |
| Profile completeness | `users.name` empty vs non-empty                        | Empty name after sign-in reopens the completion screen.                             |
| Welcome mail         | `users.welcomeEmailSent` `false` → `true`              | One-shot; trigger `sendWelcomeEmail` on that transition.                            |
| Verified             | `users.isVerified`                                     | Set true once signed in. No email-verification step exists.                         |
| Merge marker         | `contacts.secondary_email`                             | Former address of a merged duplicate. Blocks a third signup.                        |
| Contactable          | `contacts.contactable`                                 | Set true when a phone is supplied at completion. Consent to offer a Contact button. |
| Play availability    | `preferences.available_to_play`                        | Signup completion writes `true`.                                                    |
| League               | `stats.league`                                         | `''` or `Men's` / `Women's` plus optional ` Retired Pro` / ` Juniors`.              |

## Target state

Keep the email gate on a callable (no anonymous `contacts` reads). Keep App Check and the hashed
source window on deployed instances. Do not revive an email-verification step unless a later
ruling says so. Completeness should remain "name present"; required league, courts, and an
explicit unanswered skill are backlog, not current code.

## Evidence

- `src/pages/Signup.tsx` — phases, gate, password, completion, OAuth entry, fail-closed lookup.
- `src/features/signup/signupValidation.ts` — `checkSignupEmail` wrapper and `primary` /
  `secondary` / `none`.
- `src/features/signup/signupForm.ts` — password and completion rules.
- `src/features/signup/signupProfileDocuments.ts`, `profilePersistence.ts` — four-document batch.
- `src/lib/profileBootstrap.ts`, `src/context/AuthContext.tsx` — document create and welcome flag.
- `src/features/auth/useOAuthSignIn.ts` — Google/Apple, linking, bootstrap.
- `src/types.ts` — `contacts.secondary_email` contract.
- `functions/accountLookup.js` — callable, App Check, throttle, dual contacts query.
- `functions/index.js` — `sendWelcomeEmail` on `users.welcomeEmailSent`.
- `firestore.rules` — owner create of `users` / `stats` / `preferences` / `contacts`.
- Tests: `tests/unit/signup.test.mjs`, `tests/integration/functions.emulator.test.mjs`
  (`signup lookup throttles repeated pre-auth enumeration`).

## Risks and open questions

- Staging and production App Check, throttle metrics, and merge-script operation are unverified
  here (local emulator evidence only).
- `secondary_email` matching is exact-trimmed, not case-folded. A casing mismatch against the
  stored merge marker would miss the duplicate-address path.
- `fetchSignInMethodsForEmail` is a best-effort fallback and can under-report when Firebase
  email-enumeration protection is on; the contacts queries are the real gate.
- `sessionStorage` `profile-bootstrap-pending` / `profile-bootstrap-retry` are written and never
  read in this checkout.
- Unanswered skill is stored as `2.0`; empty league and empty courts are allowed. That is the
  current completion contract, not an accidental omission in this document.
- Owner rules still allow a client to write `contacts.secondary_email`. No UI does; a crafted
  client write would still pass the allowlist.
- `_account_lookup_rate_limits` is Admin-SDK-only and has no TTL worker; `expires_at` is stored
  but not enforced by a scheduled delete in this checkout.
