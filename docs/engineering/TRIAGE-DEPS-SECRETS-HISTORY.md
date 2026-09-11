# TASK-657: Dependencies, secrets, and repository history

Evidence-backed triage of lockfiles, tracked files, Git history, and ignore rules.
This is a review artifact, not a production security certification and not a license to
rewrite history or mass-upgrade dependencies.

|                  |                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Date**         | 2026-09-11                                                                                                                                                                     |
| **Audited tree** | `origin/spiderman` @ `d5387434` (this change sits on top)                                                                                                                      |
| **Remote**       | `https://github.com/tbtctennis/Racquets-And-Strings` (public)                                                                                                                  |
| **Method**       | `npm audit` on root and `functions/`; regex scan of tracked files; `git log -G` / `git show` across all origin refs; blob-size inventory; `.gitignore` / `.env.example` review |
| **Non-goals**    | History rewrite, `npm audit fix`, major upgrades, staging/production deploys, inventing new TASK ids                                                                           |

Values that look like credentials are **not** copied here. Historical Firebase web API keys
are identified by commit SHA, path, and a SHA-256 fingerprint prefix only.

## Summary

| ID  | Area         | Severity                 | Status                  | Finding                                                                                                                                                                                                                |
| --- | ------------ | ------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Dependencies | High (advisory Critical) | Open follow-up          | `maplibre-gl@5.24.0` is in GHSA-jrc7-96c5-q579 / CVE-2026-85061 (`<=6.4.0`). Patch is `6.4.1` (major from 5.x).                                                                                                        |
| D2  | Dependencies | Medium                   | Open follow-up          | Functions `firebase-admin@12.7.0` vs root dev `13.10.0`; audit wants `14.4.0` (major).                                                                                                                                 |
| D3  | Dependencies | Low                      | Open follow-up          | Dev-only `@playwright/test@1.55.0` / `playwright@1.55.0` GHSA-7mvr-c777-76hp.                                                                                                                                          |
| D4  | Dependencies | Low                      | Open follow-up          | Functions transitive `brace-expansion@2.1.2` GHSA-mh99-v99m-4gvg (DoS).                                                                                                                                                |
| D5  | Dependencies | Info                     | Do not apply            | `npm audit` “fix” for `firebase-tools@15.27.0` points at `10.1.1`. Blind `npm audit fix` is unsafe.                                                                                                                    |
| S1  | Secrets      | Medium                   | Open follow-up          | Production Firebase **web** API key is still in reachable history (`origin/dev-anuj`, `origin/version-0`). Current HEAD has no fallback. Do not rewrite history. Restrict/rotate in Cloud Console.                     |
| S2  | Secrets      | Info                     | Closed on HEAD          | Tracked tree has no private key, service-account JSON, Resend key, Stripe live/test secret, or GitHub token. Stripe `sk_test_*` / `sk_live_abc` hits are test fixtures.                                                |
| S3  | Secrets      | Info                     | Closed on HEAD          | Vendored gstack renderer embeds an **Excalidraw** Firebase web config (`excalidraw-room-persistence`), not this project.                                                                                               |
| S4  | Secrets      | Low                      | Tiny fix in this change | `.gitignore` did not name common credential droppings (`google-services.json`, `*-firebase-adminsdk-*.json`, `.gstack/`, `*.p8`, `firebase-applet-config.json`). `.env*` was already ignored.                          |
| S5  | Secrets      | Low                      | Open follow-up          | CI has no secret scan and no `npm audit` step. No `.gitleaks.toml`.                                                                                                                                                    |
| H1  | History      | Medium                   | Open follow-up          | `origin/dev-anuj` (369 commits) and `origin/version-0` remain on the public remote. Deleted `public/PXL_*.jpg` and historical `node_modules` blobs are still reachable. Unpublish unused branches; do not filter-repo. |
| H2  | History      | Info                     | Accepted                | `data/Registered Programs.csv` (~9.0 MiB) is the City of Toronto export the build slices; not member PII. Court CSV `Phone` values are facility/311 numbers.                                                           |
| H3  | History      | Info                     | Out of scope            | Hard-coded `SUPER_ADMIN_UID` is an identity literal, not a credential. Already tracked as BLG0055.                                                                                                                     |

## 1. Dependencies

Commands (2026-09-11, this checkout):

```bash
npm audit --omit=dev --json    # root production
npm audit --json               # root including dev
npm --prefix functions audit --omit=dev --json
```

Locked versions at `d5387434`:

| Package                  | Where                | Locked                                 |
| ------------------------ | -------------------- | -------------------------------------- |
| `maplibre-gl`            | root prod            | `5.24.0`                               |
| `react-map-gl`           | root prod            | `8.1.1` (peer `maplibre-gl >= 1.13.0`) |
| `firebase`               | root prod            | `12.17.1`                              |
| `firebase-admin`         | root **dev**         | `13.10.0`                              |
| `firebase-tools`         | root dev             | `15.27.0`                              |
| `@playwright/test`       | root dev             | `1.55.0`                               |
| `firebase-admin`         | functions prod       | `12.7.0`                               |
| `firebase-functions`     | functions prod       | `7.3.2`                                |
| `@google-cloud/bigquery` | functions prod       | `7.9.4`                                |
| `@google-cloud/vision`   | functions prod       | `4.3.3`                                |
| `googleapis`             | functions prod       | `173.0.0`                              |
| `resend`                 | functions prod       | `3.5.0`                                |
| `brace-expansion`        | functions transitive | `2.1.2`                                |

Root production audit: **1 critical**. Root all: 1 critical, 6 high, 20 moderate, 1 low. Functions production: **1 high, 11 moderate**.

### D1 — `maplibre-gl` XSS sanitizer bypass

- Advisory: [GHSA-jrc7-96c5-q579](https://github.com/advisories/GHSA-jrc7-96c5-q579) / CVE-2026-85061.
- Affected: `<= 6.4.0`. Patched: `6.4.1`. npm’s suggested latest was `6.9.0` (`isSemVerMajor: true`).
- `DOM.sanitize()` skipped adjacent event-handler attributes while iterating a live `NamedNodeMap`. Untrusted attribution HTML can execute in the attribution control without a click.
- This app loads a **static** public style (`https://tiles.openfreemap.org/styles/liberty` in `src/pages/CourtMap.tsx`) and has **no** `customAttribution` usage under `src/`.
- Exploitability here is therefore the third-party style JSON, not a member-controlled field. Still a production library in the affected range.
- **Do not** fold this into a general upgrade wave. Follow-up: bump `maplibre-gl` to `6.4.1` or a current 6.x, rebuild, and visually check CourtMap. `react-map-gl@8.1.1` already allows MapLibre `>=1.13.0`.

### D2 — `firebase-admin` skew and uuid/gax advisories

Functions lock `12.7.0`; root Rules-test devDep `13.10.0`; audit fixAvailable `14.4.0` (major) via `uuid` GHSA-w5hq-g745-h8pq and `retry-request` / `teeny-request`. Those fire when a caller passes a too-small buffer into uuid v3/v5/v6, which this repo does not do directly. A Functions major is still a real follow-up, not a drive-by.

`@google-cloud/vision`, `@google-cloud/bigquery`, and `googleapis` **are** imported (`functions/index.js`, `functions/adminMetrics.js`). Do not remove them as “unused.”

### D3 / D4 — narrower high advisories

- Playwright GHSA-7mvr-c777-76hp: browser download authenticity below `1.55.1`. Dev/CI only. Bump `@playwright/test` when convenient; not a hosted runtime issue.
- `brace-expansion@2.1.2` in Functions: glob ReDoS/DoS. No user-controlled glob path found. Prefer `npm --prefix functions update brace-expansion` only if it stays on 2.x.

### D5 — do not trust `npm audit fix`

`firebase-tools@15.27.0` is reported moderate via `@google-cloud/pubsub` / `csv-parse` / `gaxios`, with **fixAvailable `10.1.1`**. That is a downgrade. `hono`, `re2`, `js-yaml`, `fast-uri`, `browserslist` sit behind the CLI or other dev trees. Never `npm audit fix --force`. Pin and review one package at a time.

CI (`.github/workflows/ci.yml`) runs `npm ci` + `npm --prefix functions ci` + `npm run verify`. It does **not** run `npm audit`. Adding a failing audit gate before D1 is patched would red the pipeline on the MapLibre advisory. Cache key is only root `package-lock.json`; Functions lockfile is uncached.

## 2. Secrets

### Current tracked tree (S2)

Scanned tracked files (skipping binaries) for PEM/PKCS8, `"type": "service_account"`, `AKIA…`, `sk_live_`, long `sk_test_`, `whsec_`, `re_`, `ghp_`, `github_pat_`, `AIza…`.

Hits were:

- Unit-test placeholders: `sk_test_123`, `sk_test_task_619`, `sk_test_task_620`, and a **rejected** `sk_live_abc` in `functions/test/checkoutSession.test.js` / `paymentRefund.test.js`.
- gstack test fixtures and redact-pattern samples (`AKIAABCDEFGHIJKLMNOP`, `ghp_abcd…`, `-----BEGIN PRIVATE KEY-----` as a pattern string). Not live credentials.
- Server secrets are declared, not inlined: `defineSecret('STRIPE_SECRET_KEY')`, `defineSecret('STRIPE_WEBHOOK_SECRET')`, `defineSecret('RESEND_API_KEY')`.
- Client Firebase config is env-only (`src/lib/firebase.ts`). `.env.example` is emulator placeholders. `.env*` is gitignored; `!.env.example` is the only env file tracked.
- `SUPER_ADMIN_UID = '7PvfzNtDmsOq5GLMieId7QRT7wH3'` in `functions/lib/constants.js` is a Firebase Auth uid used as bootstrap authority. Not a secret; rotation is BLG0055.

### Historical production web API key (S1)

`git log --all -G 'AIza'` then `git show` with the key redacted:

| Commit                 | Path                                                  | Project                 |
| ---------------------- | ----------------------------------------------------- | ----------------------- |
| `6426af64` Version 2.0 | `src/lib/firebase.ts` `fallbackFirebaseConfig.apiKey` | `toronto-tennis-league` |
| `d01fd91b` redesign    | `firebase-applet-config.json`                         | `toronto-tennis-league` |

Same key fingerprint `sha256[:16]=058e41381355466b`. Later commits removed the fallback from HEAD (`src/lib/firebase.ts` now uses only `import.meta.env.VITE_FIREBASE_*`). `6d92dbe7 Remove unused config files` deleted `firebase-applet-config.json`.

Those commits **are** ancestors of `origin/dev-anuj` and `origin/version-0`. They are **not** ancestors of `origin/main` or `origin/spiderman`. Anyone who fetches the leftover branches can recover the production **web** API key. Firebase web keys are expected in client apps, but this one was a hardcoded production fallback. Follow-up is Cloud Console restriction (HTTP referrers, API allowlist), App Check, and optional key rotation. **Do not rewrite git history.**

### Vendored gstack key (S3)

`.agents/skills/gstack/lib/diagram-render/dist/diagram-render.html` (~9.2 MiB) contains `VITE_APP_FIREBASE_CONFIG` for `excalidraw-room-persistence.firebaseapp.com`. That is upstream Excalidraw’s public demo config, not `toronto-tennis-league`. SECURITY_BASELINE already called this out. Leave it; do not treat it as an application secret.

### Ignore gaps closed here (S4)

Already ignored: `.env*`, `serviceAccount*.json`, `*.pem`, `*.p12`, `*.key`, `functions/.runtimeconfig.json`, `functions/.secret.local`, `*.local`.

Missing names that operators actually drop next to a Firebase repo: `google-services.json`, `GoogleService-Info.plist`, `*-firebase-adminsdk-*.json`, `firebase-applet-config.json`, `*.p8`, `.secret.local`, `.gstack/` (local CSO reports). Added in this change.

`.env.example` already forbade `RESEND_API_KEY` and `STRIPE_SECRET_KEY`. This change also names `STRIPE_WEBHOOK_SECRET`. `tests/unit/paymentsNoLeak.test.mjs` still matches the original substring.

### CI secret scanning (S5)

No `.gitleaks.toml`, no Secretlint, no workflow step. GitHub push protection may still catch some live key formats; that was not verified here (no admin access). Follow-up: add a read-only gitleaks/secret-scan job, or enable GitHub secret scanning + push protection, after confirming it ignores gstack fixtures.

External stores (Firebase Functions secrets, GitHub Actions secrets, Resend, Stripe) were **not** listed. TASK-667 covers Resend/DNS staging.

## 3. Repository history

`git rev-list --count`:

| Ref                         | Commits                 | Notes                                                           |
| --------------------------- | ----------------------- | --------------------------------------------------------------- |
| `HEAD` / `origin/spiderman` | 28                      | Public working branch after `2edd1900` snapshot                 |
| `origin/main`               | 7                       | Ancestor of HEAD                                                |
| `origin/dev-anuj`           | 369                     | Still a remote head (`ac4dfb1c`)                                |
| `origin/version-0`          | (reachable)             | Contains the same pre-snapshot history                          |
| `origin/docs/planning`      | 12 unique vs `dev-anuj` | Planning continuation; TASK-652 already reconciled living files |
| All refs                    | 412                     |                                                                 |

Pack size ~232 MiB. Largest **current** tracked files: gstack `diagram-render.html` (~9.2 MiB), `data/Registered Programs.csv` (~9.0 MiB), gstack `icon.icns` (~1.0 MiB). Largest **historical** blobs still in the object database: `node_modules/@esbuild/win32-x64/esbuild.exe` (~11 MiB, added `b990cea7`, deleted `d474c2ba`), many `public/PXL_*.jpg` / `public/2026*.jpg` (added `b990cea7` / `d01fd91b` / `dd6c0a67`, deleted in the 2026-04-17 “Remove unnecessary images” series). Those photo blobs remain reachable (`git cat-file -e` on a sample PXL object succeeds). Current trees of `HEAD` and `origin/dev-anuj` contain **zero** jpeg files.

This is a public repository. Unpublishing unused remote branches (`dev-anuj`, `version-0`, `docs/planning` if retired) reduces casual `git fetch --all` exposure. It is **not** a history rewrite and does not purge objects while any ref or fork still points at them. Do **not** run `git filter-repo`, BFG, or force-push `main` / `spiderman`.

`data/Registered Programs.csv` is the City of Toronto registered-programs export; `scripts/build-programs-csv.mjs` slices tennis rows into `public/programs-tennis.csv`. Court CSVs expose a `Phone` column of facility numbers (including `311`), not member contacts. Sample-dataset output under `tests/fixtures/dataset/` is already gitignored because `--real-names` can contain live member data.

Remote heads on origin at audit time also included several `agent/main-TASK-*` and `agent/spiderman-TASK-652`. Coordinator hygiene; not a secret issue.

## 4. Tiny fixes in this change

1. `.gitignore` — ignore common credential droppings and local `.gstack/` reports.
2. `.env.example` — name `STRIPE_WEBHOOK_SECRET` on the do-not-place line.

No lockfile, runtime, or Functions contract change.

## 5. Narrow follow-ups

Do not invent TASK ids here. Coordinator can promote any of these into the next free TASK when scheduling. Each item is independently shippable.

1. **MapLibre patch (D1).** Upgrade `maplibre-gl` from `5.24.0` to `6.4.1` or current 6.x only. Visual-check CourtMap (zones, markers, OpenFreeMap liberty style). No other dependency bumps in the same PR.
2. **CI audit after D1.** Add `npm audit --omit=dev --audit-level=high` at root and `npm --prefix functions audit --omit=dev --audit-level=high`. Allowlist remaining firebase-admin majors until follow-up 3. Never `audit fix --force`. Cache `functions/package-lock.json` as well as the root lockfile.
3. **Functions `firebase-admin` (D2).** Bounded bump `12.7.0` → tested 13.x or 14.x with Functions unit + emulator integration. Keep root Rules-test `firebase-admin` aligned afterwards.
4. **Playwright 1.55.1+ (D3).** Dev-only; can ride with an otherwise-green CI change.
5. **Restrict/rotate the historical Firebase web API key (S1).** In Google Cloud / Firebase console for `toronto-tennis-league`: HTTP-referrer restriction, API restriction, App Check. Rotate if the key is unrestricted. Confirm no server APIs are enabled on that key. Do not put a production fallback back into source.
6. **Secret scanning (S5).** gitleaks or GitHub secret scanning + push protection. Exclude gstack fixture strings.
7. **Unpublish unused historical remote branches (H1).** If `dev-anuj`, `version-0`, and `docs/planning` are retired, delete those remote heads. Do not force-push. Do not filter history. Record that photo and `node_modules` blobs may remain in forks until GitHub GC.
8. **Optional vendor slim.** gstack’s 9 MiB renderer HTML is upstream build output. Not a secret. Only shrink if the team wants a smaller clone; not a security gate.

## 6. Limits

- No live call was made to Stripe, Resend, Google, or GitHub to test whether historical keys still work.
- GitHub org secret-scanning settings and Firebase Console key restrictions are outside this checkout.
- `npm audit` is advisory metadata, not a proof of exploitability.
- This document must not be used as a reason to rewrite origin history.
