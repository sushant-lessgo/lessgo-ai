# app-subdomain — implementation plan

- **Branch:** `feature/app-subdomain-2` (slice-1 merged to main; slice-2 continues on this fresh branch/worktree — original `feature/app-subdomain` cleaned up)
- **Worktree root:** `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain-2`
- All Files-touched paths below are under that worktree root. Implementers/reviewers run there.
- Spec: `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/docs/task/app-subdomain.spec.md`

## Overview

Move the product app to `app.lessgo.ai`; apex `lessgo.ai` becomes marketing-only and is wired as "customer #0" (a published page assigned to `lessgo.ai` takes over apex `/` via KV route alone, zero further code). Slice 1 lands host wiring + apex→app redirects + env split behind an env flag, then a human config gate (Vercel/DNS/Clerk) makes it live. Slice 2 adds app-host noindex, apex `/p/{slug}` 301s, the apex KV branch, and reserved-slug hardening. Hard constraint throughout: apex keeps serving `/api/*` + `/assets/*` — nothing in `src/lib/staticExport/**` or `src/app/p/**` gets repointed.

## Progress log

- phase 1 host guards + appSplit helper: done (commit f3c6d4db, review loops 1)
- phase 2 env split (NEXT_PUBLIC_DASHBOARD_URL): done (commit 17543df2, review loops 1)
- phase 3 middleware apex→app redirects + Clerk prop: done (commit 13c4436a, review loops 1)
- phase 4 HUMAN GATE — Vercel/DNS/Clerk/env cutover + live verify: DONE (slice-1 merged to main + pushed; cutover live + verified per orchestrator 2026-07-12)
- phase 5 app-host noindex + apex /p 301: done (commit 5ff80d0c, review loops 1)
- phase 6 apex customer-#0 KV branch: done (review loops 1, ship) — commit pending
- phase 7 reserved-slug hardening + asset-base regression guard: pending
- phase 8 HUMAN GATE — slice-2 live verify: pending

## Key decisions (read before implementing)

### D1 — env overload resolved: new var, no rename
`NEXT_PUBLIC_APP_URL` today serves two masters: published-asset origin (`src/lib/staticExport/htmlGenerator.ts:296` — MUST stay `https://lessgo.ai`) and Stripe return URLs (want `app.lessgo.ai`). Decision:

- **`NEXT_PUBLIC_APP_URL` stays `https://lessgo.ai`** — meaning is now "apex / published-asset origin". Do NOT rename, do NOT repoint. Consumers that keep it: `src/lib/staticExport/htmlGenerator.ts:296` only.
- **New var `NEXT_PUBLIC_DASHBOARD_URL`** (`https://app.lessgo.ai` in prod; unset locally) = app-host origin. It doubles as the **rollout flag**: unset → zero behavior change (no redirects, old URLs), so all code merges safely before DNS/Clerk exist.
- Consumers switching to `NEXT_PUBLIC_DASHBOARD_URL` (complete list):
  1. `src/app/api/stripe/create-checkout-session/route.ts:74` (was APP_URL; keep `?? req.nextUrl.origin` fallback)
  2. `src/app/api/stripe/create-portal-session/route.ts:32` (same)
  3. `src/app/api/start/route.ts:75` (was `NEXT_PUBLIC_SITE_URL`; fallback to `NEXT_PUBLIC_SITE_URL` then origin, so nothing breaks pre-cutover)
  4. `src/app/thanks/page.tsx:15` (was hardcoded `https://lessgo.ai/dashboard`; fallback relative `/dashboard`)
  5. `src/app/components/WaitlistForm.tsx:60` (same treatment)
  6. Middleware/appSplit redirect target (new code, phase 3)
- `NEXT_PUBLIC_SITE_URL`: only consumer in `src/` was `api/start`; after phase 2 it's a deprecated fallback — note in `.env.example`, don't delete from envs.

### D2 — metadataBase stays apex
`src/app/layout.tsx:28-73` canonical/OG = `https://lessgo.ai`. Root layout wraps both marketing and app pages; app pages get noindex (phase 5) so duplicate-canonical is moot. **No change to layout metadata.**

### D3 — pure-helper pattern for middleware logic
All new host/path decisions live in a plain module `src/lib/domains/appSplit.ts` (pure functions, unit-testable); `src/middleware.ts` only calls them. Keeps edge middleware thin and gives us the required tests without middleware harness gymnastics.

### D4 — localhost/e2e invariant
`localhost` matches `isLessgoAppHost` exactly and is treated as an **app host with no apex counterpart**: every new behavior (redirects, noindex, /p 301, apex KV) is keyed on explicit prod host strings (`lessgo.ai`, `www.lessgo.ai`, `app.lessgo.ai`) and/or `NEXT_PUBLIC_DASHBOARD_URL` being set. Localhost + Playwright (`playwright.config.ts` baseURL `localhost:{E2E_PORT}`, `auth.setup.ts` Backend-API auth) see zero change.

### D5 — regression guard (DO NOT TOUCH list)
No phase may edit URL origins in: `src/lib/staticExport/**` (assetBase, baseURL defaults), `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx:252,260` (hardcoded `https://lessgo.ai/assets/form.v1.js` and `https://lessgo.ai/assets/a.v2.js`), `src/app/p/**` (baseUrl `'https://lessgo.ai'`), `src/app/api/blob-proxy/**`, `src/lib/blog/publishBlogPost.ts:329`, `src/app/api/domains/**` baseUrl literals. Published HTML must keep loading assets from apex forever. Phase 7 adds an automated guard.

### D6 — auth ordering invariant (middleware)
`src/middleware.ts` ends with the terminal `if (!isPublicRoute(req)) await auth.protect()` (:157). **No new code added inside the `!isApiOrNext` region may `return NextResponse.next()` (or any pass-through response) for app-host paths** — doing so skips `auth.protect()` and serves `/dashboard`/`/edit/*`/`/admin/*` unauthenticated. Allowed early returns in that region are only: redirects (307/301 — phases 3/5), rewrites to published content (phase 6 KV hit — public content by definition), and the fixed public `/robots.txt` body (phase 5). Response *decoration* (noindex header) happens strictly AFTER `auth.protect()` — see phase 5.

### App-path set (apex→app redirects, phase 3)
Prefixes redirected from apex: `/dashboard`, `/edit`, `/preview`, `/onboarding`, `/generate`, `/admin`, `/t`, `/sign-in`, `/sign-up`. Staying on apex: `/`, `/blog`, `/pricing`, `/privacy`, `/terms`, `/thanks`, `/p` (301 to lessgo.site in slice 2), `/api/*`, `/assets/*`, `/dev` (prod-blocked anyway). Redirects are **307 temporary** (spec: not 301, may be removed later).

---

# SLICE 1 — host wiring, redirects, env split, cutover

## Phase 1 — host guards + appSplit helper

Reserve `app` as a publish-subdomain label (the #1 correctness fix: today `app.lessgo.ai` matches legacy publish suffix `.lessgo.ai` in `matchPublishSubdomain` and gets swallowed by middleware Branch A before the app/auth fall-through). Introduce the pure helper module all later phases build on.

**Files touched**
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/lib/domains/hosts.ts`
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/lib/domains/appSplit.ts` (new)
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/lib/domains/appSplit.test.ts` (new)
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/lib/domains/hosts.test.ts` (new)

**Steps**
1. `hosts.ts` `matchPublishSubdomain` (:56): extend reserved-label guard to a small `RESERVED_PUBLISH_LABELS = ['www', 'lessgo', 'app']` set (replaces the inline `label==='www' || label==='lessgo'` checks). `app` is reserved on BOTH suffixes (`app.lessgo.ai` AND `app.lessgo.site`) — consistent, harmless.
2. New `appSplit.ts` (plain module, edge-safe, no 'use client'):
   - `APEX_HOSTS = ['lessgo.ai', 'www.lessgo.ai']`, `APP_HOST = 'app.lessgo.ai'` (derive from `NEXT_PUBLIC_DASHBOARD_URL` when set, literal fallback).
   - `isApexProdHost(host)`, `isAppProdHost(host)` — exact-match (port-stripped, lowercased), so `localhost`/`*.vercel.app` are neither.
   - `APP_PATH_PREFIXES` (list from the App-path-set section above) + `isAppPath(pathname)`.
   - `getApexToAppRedirect(host, pathname): string | null` — returns `${NEXT_PUBLIC_DASHBOARD_URL}${pathname+search}` only when var is set AND `isApexProdHost(host)` AND `isAppPath(pathname)`; else null. (Search-param preservation handled by caller passing full URL, or take `URL` — implementer's choice, test it.)
3. Tests:
   - `hosts.test.ts`: `matchPublishSubdomain('app.lessgo.ai') === null` (required by task), `'app.lessgo.site'` → null, `'www.lessgo.ai'` → null, a normal slug still matches, `isLessgoAppHost('app.lessgo.ai') === true`.
   - `appSplit.test.ts`: redirect null when env unset; null for localhost; null for apex marketing paths (`/`, `/privacy`, `/blog`, `/pricing`); target URL for `/dashboard`, `/edit/abc`, `/t/xyz`, `/sign-in` on `lessgo.ai` and `www.lessgo.ai`; env stubbed via `vi.stubEnv`.

**Verification**: `npx tsc --noEmit`; `npm run test:run` (new tests green, existing `liveHosts.test.ts` + dispatch/publish tests untouched-green).

## Phase 2 — env split (NEXT_PUBLIC_DASHBOARD_URL consumers)

Execute decision D1: introduce the var, switch the five absolute-app-URL consumers, leave `NEXT_PUBLIC_APP_URL` (asset origin) alone.

**Files touched**
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/app/api/stripe/create-checkout-session/route.ts`
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/app/api/stripe/create-portal-session/route.ts`
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/app/api/start/route.ts`
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/app/thanks/page.tsx`
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/app/components/WaitlistForm.tsx`
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/.env.example` (if present; else skip — do NOT create env files with secrets)

**Steps**
1. Stripe checkout (:74) + portal (:32): `process.env.NEXT_PUBLIC_DASHBOARD_URL || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin` — pre-cutover behavior identical.
2. `api/start` (:75): `process.env.NEXT_PUBLIC_DASHBOARD_URL || process.env.NEXT_PUBLIC_SITE_URL` for the onboarding redirect base.
3. `thanks/page.tsx` (:15) + `WaitlistForm.tsx` (:60): `${process.env.NEXT_PUBLIC_DASHBOARD_URL ?? ''}/dashboard` (unset → relative `/dashboard`, which the phase-3 redirect forwards anyway).
4. `.env.example`: document `NEXT_PUBLIC_DASHBOARD_URL` (app-host origin + rollout flag), reassert `NEXT_PUBLIC_APP_URL` = apex/published-asset origin — never repoint, mark `NEXT_PUBLIC_SITE_URL` deprecated-fallback.
5. Confirm via grep (no code change): dashboard/edit links in `ProjectCard.tsx`, `Header.tsx`, wizard redirects, `CollectLinksDialog.tsx` are relative/`window.location.origin` — auto-follow host.

**Verification**: `npx tsc --noEmit`; `npm run test:run`; grep asserts zero remaining `https://lessgo.ai/dashboard` literals in `src/` and `NEXT_PUBLIC_APP_URL` appears only in `htmlGenerator.ts` + stripe fallbacks; manual: `npm run dev`, `/thanks` renders with working relative dashboard link.

## Phase 3 — middleware apex→app redirects + Clerk allowedRedirectOrigins

Wire `getApexToAppRedirect` into middleware ahead of auth; add Clerk cross-origin redirect allowance. Everything inert until `NEXT_PUBLIC_DASHBOARD_URL` is set.

**Files touched**
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/middleware.ts`
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/app/layout.tsx`

**Steps**
1. `middleware.ts`: inside the existing `if (!isApiOrNext)` block, AFTER Branch A/B (apex is `isLessgoAppHost` so it reaches the fall-through), before `isPublicRoute`/`auth.protect()`: `const appRedirect = getApexToAppRedirect(host, url); if (appRedirect) return NextResponse.redirect(appRedirect, 307);`. Preserve query string. `/api/*` and `/_next/*` are excluded by `isApiOrNext` — apex keeps serving APIs (constraint). `/assets/*` are static files excluded by the matcher — untouched. Redirect returns are the only early-return kind this phase adds (D6 — never `NextResponse.next()` here).
2. Do NOT touch Branch A/B, seoRewrite, `stampGeo`, or the matcher.
3. `layout.tsx` `ClerkProvider` (:88-91): add `allowedRedirectOrigins={[...apex + app origins...]}` (include `NEXT_PUBLIC_DASHBOARD_URL` when set) so hosted-portal → `app.lessgo.ai` redirect_urls aren't stripped. Keep the relative `signUpForceRedirectUrl`/`signInForceRedirectUrl` as-is (host-relative → correct on app host).
4. Comment in middleware: redirects are 307 temporary by design (spec — may be removed later; never 301).
5. **Nice-to-have guard test** (add to `appSplit.test.ts`, listed in phase 1 Files touched — coordinate or fold into this phase's diff): read the top-level route dirs `src/app/{dashboard,edit,preview,onboarding,generate,admin,t}` from disk and assert each has a matching entry in `APP_PATH_PREFIXES` — a future-added app route can't silently stay un-redirected on apex. (If adding here, `src/lib/domains/appSplit.test.ts` counts as a Files-touched addition for this phase.)

**Verification**: `npx tsc --noEmit`; `npm run test:run`; `npm run build` green; manual localhost: `npm run dev` → `/dashboard` (signed in), `/`, `/p/{slug}` all behave exactly as before (env unset → helper returns null); optional local flag test: set `NEXT_PUBLIC_DASHBOARD_URL=http://example.test` + curl `-H "Host: lessgo.ai" localhost:3000/dashboard` → 307; `npm run test:e2e` (mock mode) green — this is the slice-1 e2e gate.

## Phase 4 — HUMAN GATE: Vercel/DNS/Clerk/env cutover + live verification

**No code. User-executed checklist. Do not proceed to slice 2 until every box is checked.**

**Files touched**: none.

**Checklist (user)**
1. Merge slice-1 phases to main (plain merge, run local `npm run build` + `test:run` first — no CI), push. Deploy is still inert (env unset).
2. **Vercel**: add domain `app.lessgo.ai` to the project (same deployment, no new project).
3. **DNS**: CNAME `app.lessgo.ai` → `cname.vercel-dns.com` (or Vercel-suggested target). Wait for SSL issued.
4. **Clerk dashboard (prod instance)**: add `https://app.lessgo.ai` to allowed origins / paths; add `https://app.lessgo.ai/dashboard` (and any sign-in/up redirect URLs) to allowed redirect URLs. Confirm session cookie domain is `.lessgo.ai` (hosted portal at `clerk.lessgo.ai` — parent-domain cookies span app subdomain; NO satellite-domain setup expected since it's the same root domain — verify in dashboard, escalate if Clerk demands satellite config). Keep apex origins allowed (redirect window).
5. **Vercel env**: set `NEXT_PUBLIC_DASHBOARD_URL=https://app.lessgo.ai`; confirm `NEXT_PUBLIC_APP_URL=https://lessgo.ai` (create if missing — it must NEVER point at app host); leave `LESSGO_APP_HOSTS` unset/unchanged (`app.lessgo.ai` already matches `.lessgo.ai` suffix). Redeploy (env change needs new build — NEXT_PUBLIC_ is inlined).
6. **Immediate live verify (order matters)**:
   - `https://app.lessgo.ai/dashboard` → sign-in (existing account) → dashboard loads. ONE real sign-in, per spec.
   - `https://lessgo.ai/dashboard` → forwards to `app.lessgo.ai/dashboard` (307, invisible).
   - `https://lessgo.ai` homepage + `/privacy` + `/terms` intact.
   - **scalifixai.com spot-check**: fonts render, form submits, analytics beacon fires (devtools network: `lessgo.ai/assets/*` 200s, `POST lessgo.ai/api/forms/submit` / `api/analytics/event` OK).
   - `app.lessgo.ai` does NOT render a published page (proves `matchPublishSubdomain` guard).
   - Stripe: open billing → portal session URL returns to `app.lessgo.ai`.
7. Rollback lever: unset `NEXT_PUBLIC_DASHBOARD_URL` + redeploy → everything reverts to apex behavior.

---

# SLICE 2 — noindex, /p 301, apex customer-#0, slug hardening

## Phase 5 — app-host noindex + apex `/p/{slug}` 301

⚠️ **AUTH-ORDERING CRITICAL (D6).** The noindex header must NOT be implemented as an early `return NextResponse.next()` in the pre-auth region — that would skip `auth.protect()` and serve `/dashboard`/`/edit/*`/`/admin/*` unauthenticated. Header attachment happens ONLY on the response returned AFTER `auth.protect()` has run. Sole early-return exception: the public `/robots.txt` body.

**Files touched**
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/lib/domains/appSplit.ts`
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/lib/domains/appSplit.test.ts`
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/middleware.ts`

**Steps**
1. `appSplit.ts` add:
   - `shouldNoindex(host): boolean` — true only for `isAppProdHost(host)` (exact `app.lessgo.ai`; localhost/vercel.app/apex → false).
   - `getApexPublishRedirect(host, pathname): string | null` — when `isApexProdHost(host)` and pathname matches `/p/{slug}` or `/p/{slug}/{subpath}`: return `https://{slug}.lessgo.site{/subpath}` (use `publishedSubdomainHost()` from `hosts.ts` — respects `LESSGO_PUBLISH_HOST`). Else null. Internal rewrites are safe: rewrites don't re-enter middleware, and Branch A/B requests carry subdomain/custom-domain hosts, never apex.
2. `middleware.ts` — apex `/p/*` 301 (pre-auth region, redirect-only so D6-safe): in the app-host fall-through alongside the phase-3 redirect, `getApexPublishRedirect` hit → `NextResponse.redirect(target, 301)` (permanent — spec).
3. `middleware.ts` — app-host `/robots.txt` (the SOLE pass-through early return, fixed public content): when `shouldNoindex(host) && url.pathname === '/robots.txt'` → return `new NextResponse('User-agent: *\nDisallow: /', { headers: { 'content-type': 'text/plain', 'x-robots-tag': 'noindex, nofollow' } })`. (Matcher runs for `.txt` — not in the exclusion list.) Safe pre-auth: serves a constant text body, never an app page. `/robots.txt` may need adding to `isPublicRoute` so `auth.protect()` can't intercept it for anonymous crawlers — implementer verifies; the early return happens before the protect call anyway, so this is belt-and-braces.
4. `middleware.ts` — noindex header, **strictly post-auth**: restructure the END of the handler so the terminal block reads (shape, not literal code):
   1. `if (!isPublicRoute(req)) await auth.protect();` — runs FIRST, unchanged, for ALL hosts. Unauthenticated non-public requests never reach the header code (protect redirects to sign-in / throws Clerk's control-flow response).
   2. Then, only after protect has succeeded (or the route was public): `if (shouldNoindex(host)) { const res = NextResponse.next(); res.headers.set('X-Robots-Tag', 'noindex, nofollow'); return res; }` — the header rides the response middleware finally returns.
   3. All other hosts (apex, localhost) keep returning `undefined` (Clerk default) — apex responses carry NO such header (required assertion).
5. **Clerk header-preservation check (known clerkMiddleware subtlety) — REQUIRED**: prefer mutating headers on the `NextResponse.next()` result (as above) rather than fabricating a bare `new NextResponse()`; `clerkMiddleware` merges its session/handshake headers onto the handler's returned response. Implementer must CONFIRM sessions survive: with the header code active, a signed-in request on the app host still carries Clerk auth (no logout, no handshake loop, `auth()` works in the page). If merging misbehaves, use `NextResponse.next({ request })` per Clerk docs — do NOT ship without the session check passing (see verification).
6. Tests (helper level): `shouldNoindex('app.lessgo.ai')===true`, `('lessgo.ai')===false`, `('localhost:3000')===false`; `/p/foo` on `lessgo.ai` → `https://foo.lessgo.site`, `/p/foo/gallery` → subpath preserved, `/p/foo` on `localhost` → null, `/paint` (non-/p) → null.

**Verification**
- `npx tsc --noEmit`; `npm run test:run`; `npm run test:e2e` mock mode (localhost `/p/*` render spec passes — proves D4; authed `publish.spec.ts` passes — proves the middleware restructure didn't break sessions on the default path).
- Local curls with Host headers (`NEXT_PUBLIC_DASHBOARD_URL` set locally for the test):
  - `-H "Host: app.lessgo.ai"` public path (e.g. `/thanks`) → 200 + `X-Robots-Tag: noindex, nofollow` present.
  - `-H "Host: app.lessgo.ai" /robots.txt` → disallow-all body.
  - `-H "Host: lessgo.ai" /` → header ABSENT.
  - `-H "Host: lessgo.ai" /p/foo` → 301 Location `https://foo.lessgo.site/`.
- **Auth-bypass check (MANDATORY, blocks phase sign-off)**: `-H "Host: app.lessgo.ai" /dashboard` with NO session cookie → Clerk sign-in redirect, NOT a 200 dashboard render. Then a signed-in browser request to a non-public app route → renders, carries the noindex header, and the session survives follow-up navigations (Clerk header-merge confirmed).

## Phase 6 — apex as customer #0 (KV branch)

Apex `lessgo.ai` root `/` checks KV `route:lessgo.ai:/` first; hit → blob-proxy rewrite (same shape as Branch B fast path); miss → fall through to Next.js marketing homepage. Future dogfood homepage then takes over apex `/` by publishing to domain `lessgo.ai` — zero code change.

**Files touched**
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/lib/domains/appSplit.ts`
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/lib/domains/appSplit.test.ts`
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/middleware.ts`

**Steps**
1. `appSplit.ts`: `isApexPublishCandidate(host, pathname): boolean` — `isApexProdHost(host)` AND `pathname === '/'` **only**. Root-only deliberately: avoids a KV GET on every `/privacy`/`/blog`/`/pricing` hit; widen to per-path (mirroring Branch B) when multi-page dogfood actually lands — note this in a code comment.
2. `middleware.ts` apex ordering inside `!isApiOrNext` fall-through becomes: (1) `/p/*` 301 (phase 5) → (2) app-path 307 (phase 3) → (3) `isApexPublishCandidate` → KV `route:{host}:/` via existing `getRouteByKeyEdge` → blob-proxy rewrite with `rk` + `v` params + `stampGeo` (copy Branch B fast-path shape exactly; D6-safe — rewrite to published public content) → (4) KV miss/error → fall through to marketing (`isPublicRoute`/`auth.protect()` + phase-5 tail); KV errors logged + Sentry-tagged like Branch B, never 404.
3. Deliberately NO `getSlugForHostEdge` SSR fallback on apex — a `slug-for:lessgo.ai` key would shadow EVERY apex path (marketing, /privacy, /blog). Route-key check only. Comment this in code.
4. Deliberately NO seoRewrite on apex — apex sitemap/robots remain the Next.js routes (`src/app/sitemap.xml/route.ts`). If dogfood page later needs the published sitemap, that's a universe-track change.
5. No publish-flow code change: assigning `lessgo.ai` as a custom domain writes `route:lessgo.ai:/` already (`kvRoutes.atomicPublish` iterates `domains[]`). Domain-add-via-Vercel-API step is a no-op (apex already on project) — acceptable; dry-run below proves the serve path.
6. Tests: `isApexPublishCandidate` — true for `('lessgo.ai','/')`; false for `('lessgo.ai','/some-page')` (root-only scope), `('lessgo.ai','/dashboard')`, `('lessgo.ai','/p/foo')`, `('app.lessgo.ai','/')`, `('localhost','/')`.

**Verification**: `npx tsc --noEmit`; `npm run test:run`; **dry-run (dev)**: with dev KV, write `route:lessgo.ai:/` pointing at any existing published version (via `/api/admin/kv` repair endpoint or a scratch script in the session scratchpad — NOT committed), curl `-H "Host: lessgo.ai" localhost:3000/` → blob-proxy rewrite serves the page; delete key → homepage back. Also curl `-H "Host: lessgo.ai" /privacy` with no KV key → marketing privacy renders (fall-through, and no KV GET for non-root — spot-check logs).

## Phase 7 — reserved-slug hardening + asset-base regression guard

**Files touched**
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/app/api/checkSlug/route.ts`
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/lib/security.ts` (only if reserved list needs export refactor)
- `C:/Users/susha/lessgo-ai/.claude/worktrees/feature-app-subdomain/src/lib/staticExport/assetBase.guard.test.ts` (new)

**Steps**
1. `security.ts:205` already reserves `app` at publish-time validation — confirm `validateSlug` (or equivalent) is what `/api/publish` runs; no list change needed.
2. `checkSlug/route.ts` (:13) only checks DB existence — call the same reserved-slug validation before the DB check so the UI reports `app`/`dashboard`/etc. as taken instead of letting users burn a publish attempt. Export the validator/list from `security.ts` if not already importable.
3. New `assetBase.guard.test.ts` (regression guard, D5): render a **FORM-BEARING published page** through `generateStaticHTML` (page fixture must include a form so `LandingPagePublishedRenderer` actually emits its script tags) with `NEXT_PUBLIC_DASHBOARD_URL` stubbed to `https://app.lessgo.ai`, then assert the output HTML references `https://lessgo.ai/assets/fonts-self-hosted.css`, `https://lessgo.ai/assets/form.v1.js`, AND `https://lessgo.ai/assets/a.v2.js`. This exercises BOTH origin sources — `htmlGenerator.ts:296` assetBase and the hardcoded literals at `LandingPagePublishedRenderer.tsx:252,260` — pinning "apex serves /assets forever" against future env refactors.

**Verification**: `npx tsc --noEmit`; `npm run test:run`; manual: dev `/api/checkSlug?slug=app` (shape per route) → unavailable/reserved; `npm run build` green (full slice-2 build gate).

## Phase 8 — HUMAN GATE: slice-2 live verification

**No code. User-executed after merging slice 2 to main + push.**

**Files touched**: none.

**Checklist (user)**
1. Local `npm run build` + `npm run test:run` + `npm run test:e2e` green BEFORE push (no CI).
2. Deploy, then:
   - `curl -I https://app.lessgo.ai/dashboard` (no cookie) → sign-in redirect, NOT dashboard (auth intact — D6); signed-in browser: dashboard renders + response carries `X-Robots-Tag: noindex, nofollow`; session survives a few navigations (no logout/handshake loop — Clerk header-merge check).
   - `curl https://app.lessgo.ai/robots.txt` → disallow-all.
   - `curl -I https://lessgo.ai/` → NO X-Robots-Tag; apex `robots.txt`/`sitemap.xml` unchanged.
   - `curl -I https://lessgo.ai/p/{live-slug}` → `301` → `https://{live-slug}.lessgo.site/`.
   - scalifixai.com re-spot-check (fonts/form/beacon) — slice 2 touched middleware again.
   - Optional prod dry-run of customer #0: via `/api/admin/kv` temporarily write `route:lessgo.ai:/` to a live blob → curl apex `/` serves it → delete key → homepage restored. (Root-only scope means the dry-run briefly swaps the real homepage — quick + reversible; dev dry-run already proved the code path.)
3. Sanity: publish flow slug `app` rejected in UI.

---

## Acceptance-criteria → phase map
- New/existing user sign-in on `app.lessgo.ai` → phases 1,3,4
- Apex app-links forward invisibly → phases 1,3,4
- Homepage/privacy/terms intact → phases 3,4 (verify), 6 (fall-through)
- scalifixai.com untouched → D5 + phases 2,4,7,8
- `/p/{slug}` 301 → phase 5
- noindex app-only, auth NOT bypassed → phase 5 + D6, verified 8
- Apex takeover via KV alone → phase 6, dry-run 8
- build/test:run/e2e green + local dev unaffected → every phase's verification + D4

## Unresolved questions
1. `/t/*` testimonial links already shared on apex — 307 forward OK, or need 301 for those specifically?
2. Clerk prod: confirm hosted portal `clerk.lessgo.ai` cookie domain is `.lessgo.ai` (gate 4 step) — if Clerk forces satellite-domain setup, small follow-up needed.
3. `www.lessgo.ai` — currently pointed/redirected at Vercel level? Plan treats it as apex alias; confirm DNS reality.
4. `/thanks` + `/pricing` + `/blog` stay apex per plan — agree?
5. Phase-6 prod dry-run briefly swaps real apex `/` (root-only scope forces it) — acceptable, or dev dry-run enough?
