# Current system

This directory is the code-derived record of **how Racquets & Strings works today** on branch
`main`. It distinguishes current behavior from target safety improvements. Product rules live
in [`docs/domain/`](../domain/README.md). How we develop lives in
[`docs/engineering/`](../engineering/README.md). Open work is
[`docs/development/NOW.md`](../development/NOW.md).

Last verified against branch `main` (local emulator evidence; Spiderman waves 0–5 landed
2026-09-11). Staging and production are unverified.

## Start here

1. [System architecture](SYSTEM_ARCHITECTURE.md) — topology, runtime boundaries, Functions surface
2. [Data model](DATA_MODEL.md) — collections, access, location, partner pool
3. [Core data flow](DATA_FLOW.md) — signup, play, rewards, location, rallies, partner pool, coaching/bookings
4. [Account creation](ACCOUNT_CREATION.md) — email gate, password, profile completion, throttling, duplicate-address path
5. [Coaching pool](COACHING_POOL.md) — retired group lessons, Book / Redeem today, typed bookings and `lesson_pool` target
6. [Authorization model](AUTHORIZATION_MODEL.md) — UI role ≠ authz; Rules and callables
7. [Public-field sensitivity](PUBLIC_FIELD_SENSITIVITY.md) — classification, projection ownership, public-surface Rules tests
8. [Firestore schema assessment](FIRESTORE_SCHEMA_ASSESSMENT.md)
9. [Data shape](DATA_SHAPE.md) — field-level contract and test-data pipeline
10. [Environments and delivery](ENVIRONMENTS_AND_DEPLOYMENT.md)
11. [Mobile path recommendation](MOBILE_PATH_RECOMMENDATION.md)
12. [ADR-001: role authorization](ADR-001-role-authorization-model.md)
13. [ADR-002: environment isolation](ADR-002-environment-isolation.md)
14. [Maintainability map](../engineering/MAINTAINABILITY.md)
15. Domain rules: [tournament](../domain/TOURNAMENT_RULES.md) · [Round Robin](../domain/ROUND_ROBIN_RULES.md) · [scoring](../domain/SCORING_AND_POINTS.md) · [contact privacy](../domain/CONTACT_PRIVACY.md) · [preference projection](../domain/PREFERENCE_PROJECTION.md) · [rewards](../domain/REWARDS_RULES.md)
16. [Local development](../engineering/LOCAL_DEVELOPMENT.md)

## What changed on Spiderman (D6 / Wave 1)

| Area             | Current checkout                                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Location         | Derived onto `stats/{uid}.location` from preferred courts. Toronto is the only mapped city. Unset location is allowed. Cross-location challenge/rally results are refused by the `challengeResults` callable. |
| Rally            | Canonical name. `friendly` is retired in runtime source. Points pay on second-party confirmation via `rallyPoints.js`.                                                                                        |
| Partner pool     | `partner_pool/{eventId}/members/{uid}` client-owned membership; `contacts/{uid}` is a server projection.                                                                                                      |
| Join             | Preferred court at join; zone is derived; Unplaced is explicit.                                                                                                                                               |
| Result authority | Tournament, challenge, and rally outcomes go through callables or server triggers. The browser may create the untrusted report; it cannot mint `leaguePoints26`.                                              |

D6 is implementation-complete and not green-closed ([BUG-507](../development/bug/BUG-507-DETAILS.md), [BUG-508](../development/bug/BUG-508-DETAILS.md)). See the [D6 closure report](../planning/sprints/d6-d9/D6-CLOSURE-REPORT.md).

D8 documents the coaching pool; it does not build it. `group_lessons` stayed retired after
TASK-511. Live Marketplace coaching is **Book** and **Redeem discount** with no booking `type`.
The three-action / typed-booking / any-event pool target is [COACHING_POOL.md](COACHING_POOL.md).

## Diagram index

One Mermaid block per file, so diagrams render in GitHub and review without HTML/SVG exports.

| Diagram                     | Answers                                  | Markdown                                              |
| --------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| Current system architecture | What talks to what                       | [Open](diagrams/current-system-architecture.md)       |
| Target safe delivery        | Local → staging → production gates       | [Open](diagrams/target-safe-delivery-architecture.md) |
| Current vs target           | Delivery/authz modernization             | [Open](diagrams/modernization-before-after.md)        |
| Firestore data model        | Collections and relationships            | [Open](diagrams/firestore-data-model.md)              |
| Core data flow              | Main write paths                         | [Open](diagrams/core-data-flow.md)                    |
| Account creation            | Email gate, Auth, bootstrap, completion  | [Open](diagrams/account-creation.md)                  |
| Authorization boundaries    | UI vs Rules vs Functions                 | [Open](diagrams/authorization-boundaries.md)          |
| Location scoping            | How a city is derived and enforced       | [Open](diagrams/location-scoping.md)                  |
| Partner pool                | Join/leave, contacts, doubles            | [Open](diagrams/partner-pool.md)                      |
| Play loops                  | Join/score, challenge, rally, withdrawal | [Open](diagrams/play-loops.md)                        |
| Client layer map            | pages → features → Firebase              | [Open](diagrams/client-layer-map.md)                  |
| Coaching pool               | Book / Redeem today; lesson_pool target  | [Open](diagrams/coaching-pool.md)                     |

## Evidence convention

Every document states current state, target state, evidence, risks, and open questions. Claims
about deployed Firebase state, physical devices, staging, backups, and production are unverified
until exact evidence is available.

## Evidence levels

| Level                 | This repository can provide                                                                                        | It cannot provide                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Local verification    | Clean install, static checks, unit tests, emulator Rules/Functions tests, synthetic fixtures, local browser checks | Deployed configuration or production data shape |
| Source-level security | Reviewed Rules, Functions authorization/validation, migration guards, tests at one source SHA                      | That the reviewed source is deployed            |
| Staging verification  | Isolated Firebase project, deployed reviewed source, synthetic/scrubbed data, recorded smoke/recovery              | Production parity without a separate comparison |
| Production deployment | Explicit approval, selected production project, deploy receipt, post-deploy checks, recovery evidence              | Inferred success from local or staging PASS     |
