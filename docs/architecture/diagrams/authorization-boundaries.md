# Authorization boundaries

Identity, UI role state, Rules, and Functions provide different guarantees. Only the backend
controls grant privileged authority.

```mermaid
flowchart LR
    subgraph untrusted["Untrusted client"]
        ui["React UI<br/>role/view selection"]
        authToken["Firebase Auth token<br/>identifies UID"]
        ui -. does not grant .-> authToken
    end

    subgraph clientBoundary["Client authorization boundary"]
        rules["Firestore / Storage Rules<br/>ownership · field diffs · privacy"]
        locationHelper["playableLocationPair helper<br/>reads stats.location"]
        poolRules["partner_pool members: own create/delete<br/>contacts: pool-member read, no client write"]
        publicData["Allowed public and member data"]
    end

    subgraph privileged["Server-controlled boundary"]
        functions["Callable / trigger Functions"]
        locFn["onPreferredCourtsChanged writes stats.location"]
        results["tournamentResults · challengeResults · rallyPoints"]
        poolFn["partnerPool contact projection"]
        adminSdk["Admin SDK writes<br/>projections and ledgers"]
        restricted["Restricted data<br/>contacts · rewards · metrics · location"]
    end

    authToken --> rules
    ui --> rules
    rules --> locationHelper
    rules --> poolRules
    rules --> publicData
    rules --> functions
    functions --> locFn
    functions --> results
    functions --> poolFn
    functions --> adminSdk
    adminSdk --> restricted

    roleRegistry["Target: server-managed claims<br/>or authoritative role registry"] -. replaces broad preference flags .-> functions
    ownerScope["Target: resource ownership<br/>event and provider scope"] -. narrows .-> rules

    classDef untrustedNode fill:#fff7ed,stroke:#c2410c,color:#431407
    classDef ruleNode fill:#eff6ff,stroke:#2563eb,color:#172554
    classDef serverNode fill:#fef2f2,stroke:#b91c1c,color:#450a0a
    classDef targetNode fill:#f0fdf4,stroke:#15803d,color:#14532d
    class ui,authToken untrustedNode
    class rules,locationHelper,poolRules,publicData ruleNode
    class functions,locFn,results,poolFn,adminSdk,restricted serverNode
    class roleRegistry,ownerScope targetNode
```

`stats.location` is not client-writable. Cross-location play is enforced on the
`challengeResults` callable today. The Rules helper exists; wire it into match `allow create`
before claiming create-time refusal in production Rules.
