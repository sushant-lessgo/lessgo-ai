# app-entry — implementation plan

**WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\app-entry`
**Branch:** `feature/app-entry`
**Spec:** `docs/task/app-entry.spec.md`

## Overview

Signed-out visitors to `app.lessgo.ai/` currently get the old pre-launch waitlist page (shared `src/app/page.tsx`, also apex's marketing homepage), and `/sign-in` / `/sign-up` return raw 404s because no Clerk route pages exist. This plan adds a new `/welcome` entry page, Clerk catch-all sign-in/sign-up routes, middleware handling so app-host `/` routes signed-in users to `/dashboard` and signed-out users to the entry page (via rewrite — apex `/` output untouched), and a branded root `not-found.tsx`. Brand string "Lessgo AI" + year 2026 on all new/touched app surfaces.

### Key design decisions (justification)

- **App-host `/` = middleware rewrite to `/welcome` (option a), authed → 307 to `/dashboard`.** Chosen over a host-aware branch inside `page.tsx` (option b: would force `page.tsx` to a server component and couple apex marketing to app logic — apex is scope-OUT) and over a redirect for signed-out users (option c: `app.lessgo.ai/` showing a `/welcome` URL is worse than the root URL itself being the entry page). A rewrite keeps the URL at `/`, keeps `src/app/page.tsx` byte-identical for apex, and matches the shipped app-subdomain pattern: pure decision helpers in `src/lib/domains/appSplit.ts` (edge-safe, unit-tested), middleware only calls them. D6-safe: `/` is already public, and the rewrite targets a public page.
- **Auth routes = dedicated catch-all pages** (`app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx` rendering `<SignIn/>`/`<SignUp/>`), not the hosted Account Portal — keeps auth on-domain, consistent with the existing `signInForceRedirectUrl`/`signUpForceRedirectUrl="/dashboard"` layout props and the middleware's existing `/sign-in(.*)`/`/sign-up(.*)` public whitelist + `APP_PATH_PREFIXES` entries. **Redirect resolution requires env vars, not just provider props:** in Clerk v5, `auth.protect()` inside `clerkMiddleware` resolves its sign-in redirect from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (or a `clerkMiddleware(handler, { signInUrl })` option) — it does NOT read `ClerkProvider` React props (those only govern client/SSR components + force-redirects). `src/middleware.ts` currently passes no options and no `NEXT_PUBLIC_CLERK_SIGN_IN_URL` exists in `.env`/`.env.local`, so today's `auth.protect()` sends signed-out users to the HOSTED Account Portal. Chosen mechanism: **env vars** `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` + `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` (simplest; also aligns the client SDK), set in phase 2 alongside the pages. Must also be set on Vercel — post-merge deploy action.
- **404 = static branded `not-found.tsx` with dual CTAs, no auth read.** `not-found.tsx` is prerendered at build time (`/_not-found`), so RSC `auth()` there breaks; middleware handling isn't needed either: signed-out + unknown non-public route never reaches the 404 — `auth.protect()` redirects to sign-in, and **because phase 2 sets `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, that redirect lands on the on-domain `/sign-in` page (which now resolves)** — satisfies "signed-out → redirect, not raw 404". Without the env var this claim would be false (portal redirect, possibly failing if the prod portal domain isn't provisioned). Authed + unknown route gets the branded 404 with "Go to dashboard" + "Home" CTAs. Static = zero hydration/auth risk.
- **Waitlist "removal" = app root stops serving it; files stay.** `src/app/page.tsx` + `WaitlistForm.tsx` are apex's live marketing homepage (scope-OUT) — they are NOT deleted or edited. The app host simply never renders them again after the middleware rewrite lands.
- **Auth CTA reality check:** spec says "Clerk modal via layout buttons," but `SignInButton`/`SignUpButton` are UNUSED imports in `src/app/layout.tsx` (render body = ClerkProvider > TooltipProvider > PostHogProvider > children) — no modal buttons actually render today. Implementer must confirm where auth CTAs actually render before assuming `signInUrl` props/env change any existing behavior; the new `/welcome` + `/sign-in`/`/sign-up` pages are the real CTA surfaces this feature ships.

## Progress log

- phase 1 entry page /welcome: done (review loops 1, ship)
- phase 2 clerk sign-in/sign-up routes + provider config: pending
- phase 3 appSplit pure helpers + tests: pending
- phase 4 middleware app-root wiring: pending
- phase 5 branded 404 + brand/year polish + full build: pending

---

## Phase 1 — Entry page `/welcome`

**Goal:** New signed-out entry page: logo/brand, one-line value prop, primary "Sign up" CTA (`/sign-up`), secondary "Sign in" link (`/sign-in`), footer "© 2026 Lessgo AI" (year computed, not hardcoded). Shell quality only (spec: no marketing polish). Server component, plain `<Link>`s, no client hooks. Include a top-of-page authed guard: `const { userId } = await auth()` (from `@clerk/nextjs/server`) → `redirect('/dashboard')` — covers direct `/welcome` hits by signed-in users independent of middleware.

**Files touched:**
- `src/app/welcome/page.tsx` (create)

**Steps:**
1. Create `src/app/welcome/page.tsx`: server component, `auth()` + `redirect('/dashboard')` guard, then static entry markup styled with existing Tailwind conventions (reuse visual language from `src/app/page.tsx` hero — do NOT import from it).
2. Brand string exactly "Lessgo AI"; year via `new Date().getFullYear()`.
3. `export const metadata` with a sane title ("Lessgo AI — Sign in or create your account"); no SEO work (app host is noindexed anyway).

**Verification:**
- `npx tsc --noEmit` clean.
- `npm run test:run` green (no regressions).
- Manual (`npm run dev`): `localhost:3000/welcome` renders entry page signed-out; signed-in visit redirects to `/dashboard`. Note: `/welcome` is not yet public in middleware — signed-out dev hit will bounce to Clerk sign-in until phase 4; verify rendering while signed-in or temporarily via prod-like check in phase 4. (Acceptable: page correctness is fully checked in phase 4/5 manual passes.)

---

## Phase 2 — Clerk sign-in/sign-up routes + provider config  🔒 HUMAN GATE (auth surface — sign off before proceeding)

**Goal:** `/sign-in` and `/sign-up` resolve to on-domain Clerk pages; Clerk components/links AND middleware `auth.protect()` redirects resolve to these paths (not the hosted Account Portal).

**Files touched:**
- `src/app/sign-in/[[...sign-in]]/page.tsx` (create)
- `src/app/sign-up/[[...sign-up]]/page.tsx` (create)
- `src/app/layout.tsx` (edit — ClerkProvider props only)
- `.env` (edit — add `NEXT_PUBLIC_CLERK_SIGN_IN_URL` + `NEXT_PUBLIC_CLERK_SIGN_UP_URL`)

**Steps:**
1. Create catch-all pages rendering `<SignIn />` / `<SignUp />` (from `@clerk/nextjs`), centered in a minimal branded wrapper (same shell aesthetic as `/welcome`).
2. In `src/app/layout.tsx`, add `signInUrl="/sign-in"` and `signUpUrl="/sign-up"` to the existing `<ClerkProvider>` (keep `allowedRedirectOrigins` + both force-redirect props untouched). Note while there: `SignInButton`/`SignUpButton` are unused imports (no modal buttons render) — do not remove in this phase, just record in audit; the new pages are the actual CTA surfaces.
3. **Add env vars (REQUIRED, not optional):** `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` in `.env`. Rationale: `auth.protect()` inside `clerkMiddleware` (called with no options in `src/middleware.ts`) resolves its redirect from this env var, NOT from ClerkProvider props — without it, signed-out hits on protected routes go to the hosted Account Portal, defeating on-domain auth and breaking phase 5's 404 correctness. (Alternative `clerkMiddleware(handler, { signInUrl })` rejected: env var is simpler and also aligns the client SDK.) **Post-merge deploy action: set both vars on Vercel before/with the deploy — record in merge notes.**
4. No middleware code change needed in this phase: `/sign-in(.*)` + `/sign-up(.*)` already in `isPublicRoute` (`src/middleware.ts:15-16`) and in `APP_PATH_PREFIXES` (apex → app 307 already covers them).

**Verification:**
- `npx tsc --noEmit` clean; `npm run test:run` green.
- Manual (dev): `/sign-in` and `/sign-up` render Clerk widgets (no 404); complete a sign-in → lands on `/dashboard`; sign-up flow → `/dashboard`. Cross-links between the two widgets point at `/sign-in`↔`/sign-up` (not accounts portal).
- **Manual (dev, restart dev server after env change): signed-out hit to a protected route (e.g. `/dashboard`) redirects to on-domain `/sign-in` — NOT the hosted Account Portal (`accounts.*`).**
- Existing entry points still work: `/pricing` buttons (`router.push('/sign-up?redirect=/dashboard')` etc.) now land on real pages.

---

## Phase 3 — appSplit pure helpers + unit tests

**Goal:** Edge-safe pure decision logic for app-host root handling, per the shipped D3 pattern (middleware only calls helpers).

**Files touched:**
- `src/lib/domains/appSplit.ts` (edit)
- `src/lib/domains/appSplit.test.ts` (edit)

**Steps:**
1. Add TWO helpers so `auth()` cost is gated by a pure pre-check (see phase 4 step 2):
   - `isAppRootRequest(host, pathname): boolean` — true ONLY when `isAppProdHost(host) && pathname === '/'` (localhost / vercel / apex / non-root → false; apex `/` and dev behavior untouched by construction).
   - `getAppRootAction(isSignedIn): 'dashboard' | 'welcome'` — `'dashboard'` when signed in, `'welcome'` otherwise. Only ever called after `isAppRootRequest` returns true.
2. Add `'/welcome'` to `APP_PATH_PREFIXES` so an apex hit on `/welcome` 307s to the app host (keeps the entry page off apex; consistent with `/sign-in`/`/sign-up` handling).
3. Unit tests in `appSplit.test.ts`: all `isAppRootRequest` branches (app host root/non-root, apex, localhost, vercel preview, null host); `getAppRootAction` both values; `isAppPath('/welcome')` true; `getApexToAppRedirect` for `/welcome`. Follow the file's existing `vi.stubEnv` conventions.

**Verification:**
- `npm run test:run` — new tests pass, existing appSplit/hosts tests untouched-green.
- `npx tsc --noEmit` clean.

---

## Phase 4 — Middleware app-root wiring  🔒 HUMAN GATE (middleware/auth routing + waitlist replacement — sign off before proceeding)

**Goal:** `app.lessgo.ai/` signed-in → 307 `/dashboard`; signed-out → rewrite to `/welcome` (URL stays `/`). This is the phase that retires the waitlist page from the app root (scout confirmed `page.tsx`/`WaitlistForm` self-contained; apex keeps serving them unchanged — gate confirms this is acceptable).

**Files touched:**
- `src/middleware.ts` (edit)

**Steps:**
1. Add `'/welcome'` to `isPublicRoute` (keep list + matcher in sync per file header comment).
2. In the `!isApiOrNext` region, AFTER the app-host `/robots.txt` block and BEFORE the apex redirect helpers (`getApexPublishRedirect` at `:176`), the call structure MUST be:
   ```
   if (isAppRootRequest(host, url.pathname)) {
     const action = getAppRootAction(!!(await auth()).userId)
     ...
   }
   ```
   i.e. **`await auth()` fires ONLY inside the `isAppRootRequest` branch** (app prod host + `pathname === '/'`) — never on every app request.
   - `'dashboard'` → `url.pathname = '/dashboard'`; `NextResponse.redirect(url, 307)`.
   - `'welcome'` → `url.pathname = '/welcome'`; `NextResponse.rewrite(url)`.
3. Both early-return responses bypass the post-auth `shouldNoindex` block — set `X-Robots-Tag: noindex, nofollow` directly on them (host is the app prod host by construction).
4. D6 audit comment on the new block: rewrite targets a public page from a public path (`/` is public, `/welcome` now public) — no auth bypass; the signed-in path is a redirect early-return (allowed kind).
5. Import `isAppRootRequest` + `getAppRootAction` (and nothing else new) from `appSplit`.

**Verification:**
- `npx tsc --noEmit` clean; `npm run test:run` green (incl. phase-3 helper tests, which are the real coverage — middleware itself is thin glue).
- Manual (dev): localhost `/` still renders the marketing homepage signed-out AND signed-in (`isAppRootRequest` false off-prod-host — regression check). `/welcome` now reachable signed-out (public).
- Manual (post-merge, prod — record in merge notes): signed-out `app.lessgo.ai/` shows entry page (URL stays `/`, no waitlist); signed-in `app.lessgo.ai/` → `/dashboard`; apex `lessgo.ai/` unchanged (marketing/customer#0 KV path untouched); `curl -I` app root carries `X-Robots-Tag: noindex, nofollow`.

---

## Phase 5 — Branded 404 + brand/year polish + full build

**Goal:** Unknown app routes land somewhere sane and branded; brand string/year corrected on app-host shared footer; final full-build gate.

**Files touched:**
- `src/app/not-found.tsx` (create)
- `src/components/shared/Footer.tsx` (edit — brand/year strings only)

**Steps:**
1. Create `src/app/not-found.tsx`: static server component (NO `auth()` — prerendered at build), branded "Page not found" with CTAs: "Go to dashboard" (`/dashboard`; middleware sends signed-out users to sign-in) and "Home" (`/`; app host → entry page via phase 4, apex → marketing). Brand "Lessgo AI", year computed.
2. Document (code comment) the signed-out unknown-route path: `auth.protect()` redirects to on-domain `/sign-in` — **valid ONLY because phase 2 set `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` (env var, the mechanism `clerkMiddleware` actually reads); ClerkProvider props alone would send users to the hosted portal** — before this page ever renders. The 404 is effectively the authed-user surface; both spec-accepted outcomes covered.
3. `Footer.tsx:38`: "© 2025 Lessgo.ai" → "© {new Date().getFullYear()} Lessgo AI". (Used by dashboard pages — an app surface, in scope. If it also renders on any apex page, this is a brand-mandate fix, not a marketing redesign.)
4. Full `npm run build` (buildPublishedCSS + assets + next build) — confirm `/_not-found`, `/welcome`, sign-in/up routes all compile; no published-renderer involvement anywhere in this feature (no block edits → dual-renderer parity not implicated, state for the record in audit).

**Verification:**
- `npx tsc --noEmit`, `npm run test:run`, `npm run build` — all green.
- Manual (dev): authed visit to `/some-garbage-route` → branded 404 with working CTAs; **signed-out visit → redirected to on-domain `/sign-in` (resolves — not raw 404, not the hosted Account Portal)**. Dashboard footer shows "© 2026 Lessgo AI".
- Acceptance sweep against spec checklist (all 5 boxes) as the end-to-end manual pass; the stranger-signs-up-to-dashboard walk-through is the decision gate.

---

## Out of scope (explicit)

- No edits to `src/app/page.tsx` or `src/app/components/WaitlistForm.tsx` (apex marketing, scope-OUT; they remain apex's homepage). No deletion.
- **Backlog note (do NOT fix here):** apex `src/app/page.tsx:379` still shows "© 2025 Lessgo.AI" / "Lessgo.AI" — violates the global "always Lessgo AI" brand mandate; belongs to the apex-marketing track. Add one-liner to `docs/product/productBacklog.md` at merge time (or orchestrator does it).
- `/api/subscribe` + `/thanks` untouched (still used by apex waitlist).
- No pricing-page changes (pricing-v2 owns it) beyond its links now resolving.
- Env changes limited to the two phase-2 Clerk URL vars (`.env` + Vercel post-merge); no Prisma/schema changes; no published-page/blob/KV changes.

## Post-merge deploy actions

- Set `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` + `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` on Vercel (all envs serving the app host) before/with the deploy — without them, prod `auth.protect()` reverts to the hosted Account Portal.

## Unresolved questions

1. Apex `lessgo.ai/welcome` → 307 to app host (via APP_PATH_PREFIXES) OK, or prefer apex 404?
2. Footer.tsx brand/year fix may show on any apex page sharing it — acceptable?
3. `/welcome` route name OK (vs `/get-started`)?
4. Clerk env vars: also mirror in `.env.local` for local dev, or `.env` alone suffices in your setup?
