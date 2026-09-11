# Client layer map

Intended dependency direction. The app is partway through this shape: tournament scoring, signup
validation, event registration, courts, partner pool, and rally services already sit under
`src/features/`. Some page modules still keep compatibility exports.

```mermaid
flowchart TB
    pages["src/pages<br/>Home · Events · Tournament · Matches · Profile · Tasks · Marketplace · CourtMap"]
    components["src/components<br/>shared UI primitives"]
    features["src/features/{domain}<br/>hooks · services · domain rules · types"]
    lib["src/lib<br/>firebase · profileBootstrap · analytics"]
    functions["functions/<br/>callables and triggers"]
    firebase["Firebase Auth · Firestore · Storage"]

    pages --> components
    pages --> features
    features --> lib
    features --> functions
    lib --> firebase
    functions --> firebase
```

| Layer            | Owns                                                            | Must not own                                   |
| ---------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| Pages            | Route composition, screen layout                                | Firestore field names, scoring formulas, Rules |
| Feature domain   | Pure rules (scoring, placement, location helpers on the client) | Network calls                                  |
| Feature services | Document reads/writes, callable wrappers                        | JSX                                            |
| Functions        | Privileged transitions, projections, points                     | UI                                             |

Evidence: `docs/engineering/MAINTAINABILITY.md`, `src/features/tournament/`,
`src/features/events/`, `src/features/rallies/`, `src/features/partnerPool/`,
`src/features/courts/`, `src/features/signup/`.
