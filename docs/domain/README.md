# Domain rules

These documents describe the product rules that application code, Firebase Rules, Functions, and
tests must preserve.

## Reference index

- [Tournament rules](TOURNAMENT_RULES.md)
- [Scoring and points](SCORING_AND_POINTS.md)
- [Round Robin rules](ROUND_ROBIN_RULES.md)
- [Rewards rules](REWARDS_RULES.md)
- [Contact privacy](CONTACT_PRIVACY.md) — includes the post-TASK-511 coach path; the coaching-pool product target lives in [architecture](../architecture/COACHING_POOL.md)
- [Event-scoped preference projection](PREFERENCE_PROJECTION.md) — consent, event scope, allowed fields, revocation; `public_preferences` stays deny-all

When behavior changes, update the affected rule document in the same reviewed change and reconcile
any unfinished outcome into the [live backlog](../development/BACKLOG.md).
