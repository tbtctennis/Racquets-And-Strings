# Play loops

Four loops a member actually runs. Swimlanes are Member, Organizer, Functions.

```mermaid
flowchart TB
    subgraph joinScore["A · Join event → draw → score"]
        direction TB
        m1["Member creates event_participants<br/>picks preferred court"] --> o1["Organizer generates draw / RR"]
        o1 --> f1["participantWorkflow seats where allowed"]
        f1 --> m2["Players submit score intent"]
        m2 --> o2["Organizer or assigned manager confirms"]
        o2 --> f2["applyTournamentResult transaction<br/>stats, points, advancement"]
    end

    subgraph challenge["B · Challenge"]
        direction TB
        c1["Member creates matches category=challenge status=open"] --> c2["Opponent accepts"]
        c2 --> c3["Either player reports score"]
        c3 --> c4["challengeResults callable<br/>location pair + result"]
        c4 --> c5["stats / points / connection"]
    end

    subgraph rally["C · Rally"]
        direction TB
        r1["Member creates matches category=rally status=open"] --> r2["Opponent accepts"]
        r2 --> r3["Either player reports score"]
        r3 --> r4["A different party confirms"]
        r4 --> r5["onRallyConfirmedAwardPoints<br/>winner +2 / loser +1 leaguePoints26"]
    end

    subgraph withdraw["D · Withdrawal and zone change"]
        direction TB
        w1["Member withdraws or changes zone"] --> w2["withdrawalWorkflow / zoneMoves"]
        w2 --> w3["Unplayed fixtures → walkover<br/>completed results unchanged"]
    end
```

| Loop            | Member                                            | Organizer             | Functions                             |
| --------------- | ------------------------------------------------- | --------------------- | ------------------------------------- |
| Join / score    | Join, pick court, report intent                   | Draw, confirm result  | Seating, `applyTournamentResult`      |
| Challenge       | Create, accept, report                            | May submit as manager | `challengeResults` + location check   |
| Rally           | Create, accept, report, **second party confirms** | Admin may confirm     | `rallyPoints` on confirmed transition |
| Withdraw / zone | Request                                           | Notified              | Walkovers for unplayed fixtures       |

Rally confirmation by the same reporter is refused in Rules; that check is what stops
self-minted points. BUG-507 is a Rules evaluator failure on a valid rally-report update.
