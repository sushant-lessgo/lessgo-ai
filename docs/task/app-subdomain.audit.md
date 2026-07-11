# app-subdomain — implementation audit

## Phase 1 — host guards + appSplit helper

**Files changed**
- `src/lib/domains/hosts.ts` (edit)
- `src/lib/domains/appSplit.ts` (new)
- `src/lib/domains/appSplit.test.ts` (new)
- `src/lib/domains/hosts.test.ts` (new)

### `src/lib/domains/hosts.ts`
Replaced the inline `label === 'www' || label === 'lessgo'` reserved-label check in
`matchPublishSubdomain` with a `RESERVED_PUBLISH_LABELS = new Set(['www','lessgo','app'])`
membership test. `app` is now reserved on BOTH publish suffixes (`.lessgo.ai` and
`.lessgo.site`), so `app.lessgo.ai` is no longer swallowed by middleware Branch A as a slug.
No other logic touched.

### `src/lib/domains/appSplit.ts` (new)
Pure, edge-safe module (no 'use client', no React/Node-only imports). Exports:
- `APEX_HOSTS = ['lessgo.ai','www.lessgo.ai']`.
- `APP_HOST` — derived from `NEXT_PUBLIC_DASHBOARD_URL`'s host at module load, literal
  `'app.lessgo.ai'` fallback.
- `appOrigin()` — lazy read of `NEXT_PUBLIC_DASHBOARD_URL` (trailing slashes stripped),
  null when unset. Lazy so `vi.stubEnv` works in tests and the redirect flag stays runtime-evaluated.
- `isApexProdHost` / `isAppProdHost` — exact match, port-stripped, lowercased; localhost and
  *.vercel.app are neither.
- `APP_PATH_PREFIXES` (from the plan's App-path set) + `isAppPath` (exact or `/prefix/...`;
  guards against substring false-positives like `/edited`).
- `getApexToAppRedirect(host, pathAndSearch)` — returns `${origin}${pathAndSearch}` only when
  the dashboard URL is set AND host is apex prod AND path is an app path; else null. Query
  string preserved via caller passing pathname+search (split on `?`/`#` before `isAppPath`).

### Tests
- `hosts.test.ts`: required assertion `matchPublishSubdomain('app.lessgo.ai') === null` plus
  `app.lessgo.site`→null, `www.*`→null, normal slug still matches, multi-label/empty→null,
  `isLessgoAppHost('app.lessgo.ai') === true`.
- `appSplit.test.ts`: apex/app host exactness incl. localhost & vercel.app negatives; isAppPath
  positives/negatives incl. substring guard; redirect null when env unset, null for localhost,
  null for apex marketing paths, target for `/dashboard`,`/edit/abc`,`/t/xyz`,`/sign-in` on both
  apex hosts, query-string preservation, trailing-slash origin normalization. Env stubbed via
  `vi.stubEnv` + `vi.unstubAllEnvs` in afterEach.

### Decisions
- Signature choice: `getApexToAppRedirect(host, pathAndSearch: string)` (path+search as one
  string) rather than a `URL` object — keeps the helper dependency-free and lets the middleware
  pass `url.pathname + url.search`. Tested for query preservation.
- `appOrigin()` reads env lazily (redirect flag is runtime); `APP_HOST` is derived once at load
  (a static label, not on the hot path). Only `appOrigin`/redirect logic is exercised by env stubs.

### Deviations
None.

### Verification
- `npx tsc --noEmit`: no errors in touched files. One pre-existing unrelated error remains
  (`src/app/page.tsx(6,26)` missing `@/assets/images/founder.jpg`) — not in scope.
- `npx vitest run src/lib/domains`: 3 files / 22 tests passed (includes existing liveHosts.test.ts).
- `npm run test:run`: 2128 passed, 3 skipped, 1 failed — the single failure
  (`src/lib/i18n/i18nHonesty.test.ts` generateStaticHTML 5000ms timeout) is a load-related flake
  unrelated to this phase; re-ran in isolation → 15/15 passed. Dispatch/publish/host tests green.
- Required assertion `matchPublishSubdomain('app.lessgo.ai') === null`: PASSES.

### Open risks
- `APP_HOST` is fixed at module load, so it won't reflect a mid-process `vi.stubEnv` — acceptable
  (not on any tested/redirect path; the runtime flag is `appOrigin()`).
