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
