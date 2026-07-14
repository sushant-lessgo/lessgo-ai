# app-entry — implementation audit

## Phase 1 — Entry page `/welcome`

**Files changed:**
- `src/app/welcome/page.tsx` (created)

### What was created
Server component at `src/app/welcome/page.tsx`:
- Top-of-page authed guard: `const { userId } = await auth()` (from `@clerk/nextjs/server`) → `redirect('/dashboard')` (from `next/navigation`) for signed-in users.
- Static entry markup: logo (`/logo.svg`), brand "Lessgo AI", one-line value prop, primary "Sign up" CTA → `/sign-up`, secondary "Sign in" → `/sign-in`, footer `© {year} Lessgo AI`.
- `export const metadata = { title: 'Lessgo AI — Sign in or create your account' }`.
- No `'use client'`, no client hooks, plain `next/link` `<Link>`s.

### Key decisions
- **Button component:** reused `src/components/ui/button.tsx` via `<Button asChild>` wrapping `<Link>`. That component uses `React.forwardRef` but is NOT marked `'use client'`, so it is server-safe. Primary CTA = default variant, secondary = `outline` variant, both `size="lg"`. This keeps the shell consistent with existing base UI conventions rather than hand-rolled Tailwind buttons.
- **Brand string:** exactly "Lessgo AI" (heading + footer + logo alt). Did NOT import anything from `src/app/page.tsx` (it's a `'use client'` apex marketing page) — page is fully self-contained. Referenced its header/logo markup only for visual language.
- **Year:** computed via `new Date().getFullYear()`, not hardcoded.
- **Styling:** semantic Tailwind tokens (`bg-background`, `text-foreground`, `text-muted-foreground`) for theme-safety; shell quality only, no marketing polish.

### Verification
- `npx tsc --noEmit`: no errors in `welcome/page.tsx` (confirmed via `grep welcome` → "no welcome errors"). The one reported error — `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` — is in an UNTOUCHED apex file; it's a Next image-module type declaration that resolves under `next build` (out of scope, pre-existing).
- `npm run test:run`: **163 passed | 1 skipped** test files; **2775 passed | 15 skipped** tests. No regressions.

### Notes for reviewer
- Expected behavior per plan: a signed-out dev hit to `/welcome` will bounce to Clerk until phase 4 adds `/welcome` to `isPublicRoute`. Full manual rendering check is deferred to phase 4/5. This is by design.
- No published-renderer / dual-renderer involvement (no block edits).
- Links to `/sign-up` and `/sign-in` intentionally point at pages that don't exist yet (phase 2 creates them).

## Phase 2 — Clerk sign-in/sign-up routes + provider config

**Files changed:**
- `src/app/sign-in/[[...sign-in]]/page.tsx` (created)
- `src/app/sign-up/[[...sign-up]]/page.tsx` (created)
- `src/app/layout.tsx` (edited — ClerkProvider props only)
- `.env.local` (edited — added two Clerk URL vars)

### What was created / edited
- Two catch-all server-component pages rendering `<SignIn />` / `<SignUp />` (from `@clerk/nextjs`), centered in a minimal branded wrapper matching the `/welcome` shell (logo `/logo.svg`, brand "Lessgo AI", footer `© {year} Lessgo AI`, year via `new Date().getFullYear()`).
- `layout.tsx` `<ClerkProvider>`: added `signInUrl="/sign-in"` and `signUpUrl="/sign-up"`. `allowedRedirectOrigins` + both `*ForceRedirectUrl="/dashboard"` props left untouched.
- `.env.local`: added the two Clerk URL vars right after the existing `CLERK_SECRET_KEY` line (per orchestrator decision, `.env.local` not `.env`).

### Exact `.env.local` lines added (after `CLERK_SECRET_KEY`, line 43)
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### ClerkProvider prop diff
```
     <ClerkProvider
       allowedRedirectOrigins={allowedRedirectOrigins}
+      signInUrl="/sign-in"
+      signUpUrl="/sign-up"
       signUpForceRedirectUrl="/dashboard"
       signInForceRedirectUrl="/dashboard"
     >
```

### Unused-import note
`SignInButton` / `SignUpButton` remain imported in `src/app/layout.tsx` but are unused (no modal buttons render in the layout body). Left in place per phase scope — NOT removed. The new `/sign-in` and `/sign-up` pages are the actual CTA surfaces.

### Deviations
- Per explicit orchestrator decision, env vars added to `.env.local` (where the existing `NEXT_PUBLIC_CLERK_*` keys live) rather than `.env` as the plan text originally stated.

### Verification
- `npx tsc --noEmit`: only the KNOWN pre-existing error in untouched `src/app/page.tsx(6,26)` (`@/assets/images/founder.jpg` image type decl) — no new errors from touched files.
- `npm run test:run`: 163 passed | 1 skipped (164 files); 2775 passed | 15 skipped (2790 tests). Green.
- Route compile: sign-in/sign-up are standard Clerk catch-all pages; tsc typechecked the new files with no errors — no separate dev-browser check performed (human gate handled by orchestrator). Gate = tsc + tests.

### Open risks
- Vercel env vars (`NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL`) still need setting post-merge; without them prod `auth.protect()` reverts to the hosted Account Portal. (Already tracked as a post-merge deploy action in the plan.)

## Phase 3 — appSplit pure helpers + unit tests

**Files changed:**
- `src/lib/domains/appSplit.ts` (edited)
- `src/lib/domains/appSplit.test.ts` (edited)

### What changed
`appSplit.ts`:
- Added `'/welcome'` to `APP_PATH_PREFIXES` (last entry) → apex `/welcome` now 307s to the app host via existing `getApexToAppRedirect`/`isAppPath`, consistent with `/sign-in`/`/sign-up`.
- Added `isAppRootRequest(host, pathname): boolean` — true ONLY when `isAppProdHost(host) && pathname === '/'`. Query/hash stripped before the `=== '/'` check (matches sibling helpers). This is the pure pre-check that gates the `auth()` call in phase-4 middleware.
- Added `getAppRootAction(isSignedIn): 'dashboard' | 'welcome'` — `'dashboard'` when signed in, else `'welcome'`. Only ever called after `isAppRootRequest` is true.

`appSplit.test.ts`:
- Imported the two new helpers.
- `isAppRootRequest`: app-host root true (incl. `APP.LESSGO.AI:443` case/port); non-root app paths (`/dashboard`, `/welcome`, `/sign-in`) false; off-host at root false (apex, www, localhost, vercel, null); query/hash-at-root true.
- `getAppRootAction`: both `true`→`'dashboard'` and `false`→`'welcome'`.
- `/welcome` coverage: `isAppPath('/welcome')` + nested true; `getApexToAppRedirect('lessgo.ai', '/welcome')` → `https://app.lessgo.ai/welcome` (with `NEXT_PUBLIC_DASHBOARD_URL` stubbed via existing `vi.stubEnv` convention).

### Deviations
- None. Helpers, prefix entry, and tests match the plan exactly. Added two small extra assertions (query/hash-at-root for `isAppRootRequest`) beyond the plan's enumerated branches for robustness — in-scope, same file.

### Verification
- `npx tsc --noEmit`: clean (no output).
- `npm run test:run`: 163 passed | 1 skipped (164 files); 2783 passed | 15 skipped (2798 tests). Green; appSplit file now 36 tests.
- `npm run lint`: zero errors (only pre-existing `<img>` / exhaustive-deps warnings in unrelated files).

### Open risks
- None for this phase. Middleware wiring that consumes these helpers is phase 4 (human gate) — helpers are the real coverage; middleware is thin glue.

## Phase 4 — Middleware app-root wiring

**Files changed:**
- `src/middleware.ts` (edited)

### What changed
Three edits, all in `src/middleware.ts`:
1. **Import:** added `isAppRootRequest`, `getAppRootAction` to the existing `@/lib/domains/appSplit` import (nothing else new).
2. **Public route:** added `'/welcome'` to the `isPublicRoute` matcher list (right after `'/'`), keeping the list in sync with the file-header INVARIANT (matcher is `createRouteMatcher`, no separate config array to touch). Satisfies the `src/app/README.md` public-route INVARIANT so app-host `/welcome` rewrites resolve and apex `/welcome` isn't gated.
3. **App-root block:** in the `!isApiOrNext` region, AFTER the app-host `/robots.txt` early return and BEFORE the apex `getApexPublishRedirect` block, added:
   ```ts
   if (isAppRootRequest(host, url.pathname)) {
     const action = getAppRootAction(!!(await auth()).userId)
     if (action === 'dashboard') {
       url.pathname = '/dashboard'
       const res = NextResponse.redirect(url, 307)
       res.headers.set('X-Robots-Tag', 'noindex, nofollow')
       return res
     }
     url.pathname = '/welcome'
     const res = NextResponse.rewrite(url)
     res.headers.set('X-Robots-Tag', 'noindex, nofollow')
     return res
   }
   ```
   - `await auth()` fires ONLY inside the `isAppRootRequest` branch (app prod host + `pathname === '/'`) — never on every app request (pure pre-check gate).
   - Signed-in → 307 redirect to `/dashboard`; signed-out → `NextResponse.rewrite` to `/welcome` (URL stays `/`, apex `page.tsx` output byte-untouched).
   - Both early-return responses set `X-Robots-Tag: noindex, nofollow` directly (they bypass the post-auth `shouldNoindex` block; host is the app prod host by construction).
   - D6 audit comment inline: rewrite targets a public page (`/welcome` now public) from a public path (`/` is public) — no auth bypass; signed-in path is a redirect early-return (allowed kind).

### Deviations
- None. Placement, call structure, response kinds, and noindex handling match the plan exactly. The `/welcome` public entry was added to the single `createRouteMatcher` list (there is no duplicate matcher array in this file), consistent with the header comment "keep isPublicRoute and the matcher in sync."

### Verification
- `npx tsc --noEmit`: clean (no output).
- `npm run test:run`: 163 passed | 1 skipped (164 files); 2783 passed | 15 skipped (2798 tests). Green (incl. phase-3 helper tests, the real coverage).
- `npm run lint`: zero errors (only pre-existing `<img>`/exhaustive-deps warnings in unrelated files; none in `middleware.ts`).
- **Dev-runtime (port 3024, `curl` with `Host` header — middleware host-detection reads `req.headers.get('host')`, so app-host is simulable in dev):**
  - `Host: app.lessgo.ai` `/` signed-out → `200`, body contains welcome markers (`welcome`, `Sign in`, `Lessgo AI`), `x-robots-tag: noindex, nofollow` present, URL stays `/` (rewrite). Confirms waitlist retired from app root.
  - localhost `/` (no Host override) → `200`, marketing homepage, NO `x-robots-tag` (regression check: `isAppRootRequest` false off-prod-host).
  - localhost `/welcome` → `200` (now public; no sign-in bounce).
  - Signed-in → 307 `/dashboard` branch NOT exercised at runtime (no authed dev session available); covered by unit reasoning + phase-3 `getAppRootAction`/`isAppRootRequest` tests. The branch is symmetric to the verified signed-out path.

### Open risks
- Prod verification (per plan) is a post-merge/human-gate action: signed-out `app.lessgo.ai/` entry page, signed-in → `/dashboard`, apex `lessgo.ai/` unchanged, `curl -I` app root carries the noindex header.
- Signed-in `/dashboard` 307 path unverified in dev (no authed session) — low risk (thin glue over unit-tested helpers).
