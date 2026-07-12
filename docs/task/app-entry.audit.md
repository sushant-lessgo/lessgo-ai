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
