# <SPRINT NAME> sprint planning

This document plans the sprint. It does not track task status. The complete task inventory and
all progress belong in `tracking/<SPRINT>.md`.

## Identity

| Field | Value |
| --- | --- |
| Sprint | `<SPRINT NAME>` |
| Branch | `<BRANCH>` |
| Owner | `<OWNER>` |
| Planned start | `<YYYY-MM-DD>` |
| Planned end | `<YYYY-MM-DD or open>` |

## Goal

<Answer what this sprint should make true when it closes.>

## Scope

- In scope: <milestones, product areas, or approved task ranges>
- Explicitly out of scope: <deferred milestones and unsafe operations>
- External prerequisites: <staging project, credentials, approvals, or decisions>

## Source authority

- Product behaviour: `<links to vision/rulings/specifications>`
- Acceptance criteria: `docs/development/task/` and `docs/development/bug/`
- Complete inventory and status: `tracking/<SPRINT>.md`

## Wave plan

| Wave | Objective | Candidate task IDs | Dependencies | Parallel file groups | Gate |
| --- | --- | --- | --- | --- | --- |
| 0 | Bugs/prerequisites | `<IDs>` | `<dependencies>` | `<groups>` | `<tests/evidence>` |
| 1 | `<objective>` | `<IDs>` | `<dependencies>` | `<groups>` | `<gate>` |

## Dispatch rules

- Dispatch at most 10 isolated subagents in one wave.
- Dispatch only dependency-ready items.
- No two workers may edit the same file concurrently.
- The coordinator owns shared docs, manifests, configuration, integration, and the tracker.
- A new wave starts only from the latest verified integrated commit.

## Delivery gates

<List targeted tests, full verification, security/emulator requirements, and deployment holds.>
