# Documentation

Three doors. Architecture is how the system works **today**. Planning is what we intend and what
we already closed. Development is what we are **doing**.

## Start here

| Door           | Open when you need                                                                             | Link                                             |
| -------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Current system | Topology, data, authz, diagrams, how location / rallies / partner pool / account creation / coaching pool work | [architecture/README.md](architecture/README.md) |
| Planning       | Vision, rulings, every sprint from DC00 through D9, deferred work                              | [planning/README.md](planning/README.md)         |
| Doing          | Live TASK/BUG status on DC06 Spiderman                                                         | [development/README.md](development/README.md)   |

Also:

- [Domain rules](domain/README.md) — tournament, scoring, Round Robin, rewards, contact privacy
- [Engineering](engineering/README.md) — local development, maintainability, security, skills
- [Runbooks](runbooks/README.md) — approval-gated recovery and Resend
- [Live backlog](development/BACKLOG.md) — post-staging / M6–M9 TASK ids
- [Deferred work](planning/deferred/DEFERRED-AND-FUTURE.md) — ruled out of D6–D9
- [Archive pointer](archive/README.md) — historical files now live under `docs/planning/`

## Maintenance contract

- Update the relevant active document whenever architecture-sensitive source, Rules, Functions,
  migrations, or environment tooling changes.
- Keep diagrams as Mermaid Markdown under [`architecture/diagrams/`](architecture/diagrams/) so
  they render directly and remain reviewable with the source.
- Run `npm run docs:verify` before closing a documentation or architecture-sensitive change.
- Live status exists only in `docs/development/sprint/tracking/`. Planning documents must not
  duplicate task rows or progress counts.
- Archive only dated, completed, or superseded evidence. Any unfinished outcome must first have a
  permanent TASK/BUG id.
