# Current versus target modernization

The target preserves the product topology while making environments, authority, and evidence
explicit. D6 on `spiderman` moved several “after” items into the current checkout without
claiming staging or production.

```mermaid
flowchart LR
    subgraph before["Before Spiderman / D6"]
        oneProject["One default Firebase project"]
        friendlyName["friendly vocabulary in runtime"]
        noLocation["No member location field"]
        clientStats["Some client-side score / stats writes"]
        oneProject --> friendlyName --> noLocation --> clientStats
    end

    subgraph afterD6["Current checkout — spiderman D6"]
        locationField["stats.location derived from preferred courts"]
        rallyName["rally is the runtime name"]
        partnerPool["partner_pool members + contact projection"]
        serverResults["Tournament / challenge / rally results via callables or triggers"]
        locationField --> rallyName --> partnerPool --> serverResults
    end

    subgraph target["Still target — not claimed"]
        environments["Explicit local / staging / production projects"]
        scopedRoles["Server-managed roles with resource scope"]
        evidence["Staging smoke · CI · recovery drill"]
        environments --> scopedRoles --> evidence
    end

    before --> afterD6 --> target

    classDef beforeNode fill:#fff7ed,stroke:#c2410c,color:#431407
    classDef afterNode fill:#eff6ff,stroke:#2563eb,color:#172554
    classDef targetNode fill:#f0fdf4,stroke:#15803d,color:#14532d
    class oneProject,friendlyName,noLocation,clientStats beforeNode
    class locationField,rallyName,partnerPool,serverResults afterNode
    class environments,scopedRoles,evidence targetNode
```

This is not a claim that staging, complete rules coverage, or production deployment readiness
already exists. D6 is implementation-complete and not green-closed (BUG-507, BUG-508).
