# Firestore schema assessment

## Current state

The schema is a mature, consolidated application model with explicit privacy rules and server projections, but it has grown through feature additions and migration compatibility fields. `firestore.indexes.json` contains two collection-group indexes for scheduled match queries; other client paths often sort in memory to avoid composite indexes.

## Strengths

- Stable Auth-UID document identity across profile collections.
- Explicit append-only activity patterns for courts and award ledgers.
- Deterministic pair IDs for connection privacy.
- Server-only write gates for sensitive projections and reward lifecycle documents.
- Rules comments document legacy fields and explain why several allowlists are intentionally narrow.

## Findings

| Severity | Finding                                                                                                                          | Evidence / consequence                                                                                                                                                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Major    | Rally-report Rules path is not green.                                                                                            | BUG-507: a valid rally-report update hits a Rules evaluator error. Rally points themselves are server-side (`rallyPoints.js`); the client cannot write `leaguePoints26`.                                                                                               |
| Major    | Global event-creator privilege is broader than the target organizer model.                                                       | `isGlobalEventCreator()` grants event and operational write power based on a preference flag rather than event ownership.                                                                                                                                              |
| Moderate | Rules validation is uneven across collections.                                                                                   | Remaining client-writable sensitive paths now enforce types, bounds, and immutable identity fields; nested event maps and tournament match payloads stay application-validated to keep the Rules expression budget.                                                    |
| Moderate | Public-read collections need an explicit field-sensitivity contract.                                                             | **Approved (TASK-661).** Classification, projection ownership, and compatibility are in [PUBLIC_FIELD_SENSITIVITY.md](PUBLIC_FIELD_SENSITIVITY.md). Remaining recorded exception: `services.contact_phone` / `contact_email` until booking connections (deferred 4.2). |
| Moderate | Rules harnesses and a backup/recovery runbook are checked in, but recovery has not been exercised against a non-production copy. | Authorization is regression-tested locally; operational recovery readiness still depends on an external staging project and restore drill.                                                                                                                             |
| Minor    | Query/index behavior is partly implicit.                                                                                         | The index file has two documented collection-group indexes; query changes should be validated against emulator/staging rather than relying on comments.                                                                                                                |

## Target state

1. Keep the public-field sensitivity contract current as collections change; typed schemas remain the shape reference.
2. Add emulator rules tests covering create/update bypasses, ownership, roles, contacts, Storage, and server-only paths.
3. Consolidate points-moving writes into Functions or a tested server transaction path.
4. Replace global event-creator checks with an authoritative assignment source plus event ownership;
   keep explicit admin override separate from the event-workflow role.
5. Establish scheduled Firestore export/restore runbooks and verify them against a non-production project.

## Compatibility transformation contract

Separating public preference projections or introducing event assignments may require transforming
production-shaped documents. Repository work may add compatibility reads, a dry-run migration,
explicit staging/production instructions, and rollback documentation only; it must not execute the
migration. The migration must preserve stable document IDs, omit private fields from public
projections, be idempotent, and fail closed when ownership cannot be derived. Rollback must remove
only migration-created fields/documents and restore legacy state only from a verified export. The
archive namespace is not a rollback source.

## Open questions

- What exact fields exist in deployed legacy documents, and which compatibility fields can be retired?
- Which public profile fields are intentionally searchable by logged-out visitors?
- The retired `group_lessons` collection is no longer part of the active Rules surface; event add-on blocks need an explicit schema before they are introduced.
- Which Firestore database location/edition and backup policies are currently deployed?
