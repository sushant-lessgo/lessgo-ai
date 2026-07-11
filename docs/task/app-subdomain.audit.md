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

## Phase 2 — env split (NEXT_PUBLIC_DASHBOARD_URL consumers)

**Files changed**
- src/app/api/stripe/create-checkout-session/route.ts
- src/app/api/stripe/create-portal-session/route.ts
- src/app/api/start/route.ts
- src/app/thanks/page.tsx
- src/app/components/WaitlistForm.tsx

**Per-file changes**
- create-checkout-session/route.ts (:74): baseUrl now `process.env.NEXT_PUBLIC_DASHBOARD_URL || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin`. Var unset → identical pre-cutover behavior.
- create-portal-session/route.ts (:32): same treatment as checkout.
- api/start/route.ts (:75): onboarding redirect base now `process.env.NEXT_PUBLIC_DASHBOARD_URL || process.env.NEXT_PUBLIC_SITE_URL`. SITE_URL preserved as deprecated fallback.
- thanks/page.tsx (:15): hardcoded `https://lessgo.ai/dashboard` → `` href={`${process.env.NEXT_PUBLIC_DASHBOARD_URL ?? ''}/dashboard`} `` (unset → relative `/dashboard`).
- WaitlistForm.tsx (:60): same treatment as thanks.

**.env.example**: NOT present in repo (glob found no file). Per plan ("if present; else skip — do NOT create env files with secrets"), skipped. No env doc changes made.

**Deviations**: none.

**Verification**
- `npx tsc --noEmit`: clean except the known pre-existing baseline error `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` — unrelated, not touched by this phase.
- `npm run test:run`: 140 passed | 1 skipped files; 2129 passed | 3 skipped tests. No failures.
- grep-assert: zero `https://lessgo.ai/dashboard` literals remain in `src/`. `NEXT_PUBLIC_APP_URL` still referenced in `htmlGenerator.ts:296` (asset origin, untouched) and the two stripe fallbacks.

**Open risks**: none for this phase. Behavior fully inert until `NEXT_PUBLIC_DASHBOARD_URL` is set (rollout flag per D1).

## Phase 3 — middleware apex→app redirects + Clerk allowedRedirectOrigins

**Files changed**
- `src/middleware.ts` (edit)
- `src/app/layout.tsx` (edit)
- `src/lib/domains/appSplit.test.ts` (edit — phase-3 guard test)

### `src/middleware.ts`
Added `import { getApexToAppRedirect } from '@/lib/domains/appSplit'`.
Inserted the apex→app redirect INSIDE the existing `if (!isApiOrNext)` block, AFTER
Branch B's closing `}` (the `return new NextResponse('Not Found', { status: 404 })`
branch), and BEFORE the block-closing `}` that precedes the terminal
`if (!isPublicRoute(req)) await auth.protect()`. Exact insertion point: between the
end of Branch B and the `}` that closes `if (!isApiOrNext)` (was line ~154).

Code:
```
const appRedirect = getApexToAppRedirect(host, url.pathname + url.search)
if (appRedirect) return NextResponse.redirect(appRedirect, 307)
```
Apex hosts (`lessgo.ai` / `www.lessgo.ai`) are `isLessgoAppHost`, so they skip
Branch A (not a publish subdomain) and Branch B (`!isLessgoAppHost` false) and reach
this fall-through. Query string preserved via `url.pathname + url.search` (matches the
Phase-1 helper signature `getApexToAppRedirect(host, pathAndSearch)`). This is the only
early-return kind added — a redirect, never `NextResponse.next()` (D6-safe). A comment
documents: 307 TEMPORARY by design (spec — may be removed later; never 301), and that
`/api/*` + `/_next/*` are excluded via `isApiOrNext` while `/assets/*` are excluded by
the matcher (apex keeps serving APIs + assets). Did NOT touch Branch A/B, seoRewrite,
stampGeo, the matcher, or the terminal auth block.

**Excluded-path confirmation (no code change):** `/api/*` and `/_next/*` are gated out
by `isApiOrNext` (redirect lives inside `if (!isApiOrNext)`). `/assets/*` are static
files excluded by the config matcher's negative-lookahead (…`\.(?:…js…css…woff2?…)`…).
Apex therefore continues to serve APIs and published assets — verified by reading the
matcher; no route change made.

### `src/app/layout.tsx`
Added `allowedRedirectOrigins={allowedRedirectOrigins}` to `<ClerkProvider>` (above the
existing `signUpForceRedirectUrl`/`signInForceRedirectUrl`, which are unchanged and stay
host-relative). The array is built as a well-typed `string[]`:
`['https://lessgo.ai','https://www.lessgo.ai', process.env.NEXT_PUBLIC_DASHBOARD_URL]`
`.filter((o): o is string => Boolean(o))` — the app origin is only included when the
rollout var is set; falsy filtered, so this is a no-op pre-cutover.

### `src/lib/domains/appSplit.test.ts`
Added a Node-`fs` guard test (vitest node env): reads the top-level route dirs under
`src/app/{dashboard,edit,preview,onboarding,generate,admin,t}` from disk and asserts each
existing dir has a matching `/dir` entry in `APP_PATH_PREFIXES`. Only asserts for dirs
that exist (absent dirs produce a no-op skipped assertion). Guards against a future app
route silently staying un-redirected on apex. Imported `APP_PATH_PREFIXES` for the check.

### Deviations
- None functional. The plan pseudocode wrote `getApexToAppRedirect(host, url)`; the actual
  Phase-1 helper takes a `pathAndSearch` string, so the call passes
  `url.pathname + url.search` (preserves query, matches the tested signature).

### Verification
- `npx tsc --noEmit`: only the known pre-existing `src/app/page.tsx:6` founder.jpg
  error (`@/assets/images/founder.jpg` module not found). No new errors.
- `npx vitest run src/lib/domains/appSplit.test.ts`: 19 passed (incl. new guard test).
- `npm run test:run`: 2135 passed, 1 failed, 3 skipped — the sole failure is the known
  `i18nHonesty.test.ts` full-suite timeout flake (generateStaticHTML 5s timeout under
  load), not a regression.
- `npm run build`: GREEN. Note: the worktree had NO `.env`/`.env.local`, so the first
  build attempt failed at page-data collection with `OPENAI_API_KEY missing` (env gap,
  not a code defect) for `/api/audience/product/generate-copy`. Temporarily copied the
  gitignored `.env` + `.env.local` from the main repo, re-ran → full build succeeded
  (buildPublishedCSS + buildAssets + next build; all routes compiled, `/` static). Temp
  env files removed afterward (they are gitignored; never committed). The founder.jpg
  tsc error does NOT break the webpack build (`/` builds as static content).

### Open risks
- Build requires env vars present in the worktree; CI/Vercel and the main repo have them.
  Worktree builds need `.env.local` copied in (node_modules already installed here).
- Everything remains inert until `NEXT_PUBLIC_DASHBOARD_URL` is set (Phase 4 human gate):
  helper returns null and the Clerk app origin is filtered out, so localhost/e2e/pre-cutover
  behavior is unchanged.
