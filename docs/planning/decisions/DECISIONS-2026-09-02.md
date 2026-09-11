# Repository decisions — 2026-09-02

> Repository-level delivery rulings made while closing BUG-507 and BUG-508. These decisions
> govern local verification and CI; they do not change product behaviour.

|            |                                      |
| ---------- | ------------------------------------ |
| **Date**   | 2026-09-02                           |
| **Scope**  | Local verification and emulator runs |
| **Status** | Accepted and implemented             |

## 1 · Verification runs on exact Node 22.23.2

**Problem.** `.mise.toml` pinned Node 22.23.2, but npm scripts inherited the shell's active Node.
On a machine whose global mise alias resolved to Node 26, the Functions emulator ignored the
package's Node 22 engine and printed `Using node@26 from host`. The generated integration-test
package also omitted its runtime dependencies, which caused repeated function-parse warnings.
The repository therefore declared one runtime while verification silently exercised another.

**Ruling.** Node 22.23.2 is the exact runtime for repository verification, emulator tests, and
Functions unit tests. Official npm verification and emulator commands run through
`scripts/run-with-pinned-node.mjs`. The wrapper reads `.mise.toml`; when the invoking shell is on
another Node version, it resolves the repository tool with `mise which node`, verifies that the
resolved binary is exactly 22.23.2, prepends its directory to the child `PATH`, and only then runs
the command. If mise or the pinned tool is unavailable, the command fails before testing with an
actionable setup message.

The Functions integration harness copies the real Functions package's `engines` and
`dependencies` into its temporary package. CI installs exact Node 22.23.2. No global shell,
profile, or user-level mise configuration is modified.

**Rationale.** A repo-scoped wrapper makes the checked-in command deterministic without changing
other projects or relying on interactive shell activation. Exact matching prevents a future
major Node alias from silently changing emulator behaviour. Keeping `.mise.toml` as the source of
truth avoids a second independently maintained runtime setting in executable code.

**Verification commands.** Run from the repository root:

```bash
mise exec -- node -v
npm run test:rules
npm run test:functions:integration
mise exec -- npm run typecheck
mise exec -- npm run lint
mise exec -- npm run format:check
mise exec -- npm run verify
```

The first command must print `v22.23.2`. The npm emulator commands must use Node 22 even when
`node -v` in the parent shell reports Node 26. The full `verify` command remains the release gate.
