# account-settings — plan

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\account-settings`
- **Branch:** `feature/account-settings`
- **Tier:** standard — plan-review skipped (standard); ONE impl-review over the whole diff at the end.
- **Spec:** `docs/task/account-settings.spec.md`

## Overview

`/dashboard/settings` currently renders the persona editor (`PersonaPrompt`) — wrong page, retiring concept. Replace the page body with Clerk's managed `<UserProfile routing="hash" />`, themed via a new `profileAppearance` token map so it sits cleanly inside the existing dashboard shell (which `src/app/dashboard/layout.tsx` already provides — sidebar, top bar, crumb `['Account','Settings']`). Add a small authed Playwright assertion that the persona selector is gone and the Clerk profile renders. No auth/session/middleware changes; Clerk owns all flows.

## Progress log

- phase 1 page swap + profileAppearance: pending
- phase 2 e2e regression spec: pending

## Invariants (do NOT touch — cite, don't edit)

- `src/components/dashboard/AppSidebar.tsx` — Settings row (`:230-238`) and "Log out" row (`:261`, P0 sign-out path). Untouched.
- `src/components/dashboard/DashboardTopBar.tsx` — crumb already maps `settings: ['Account','Settings']` (`:23`). Untouched.
- `src/app/dashboard/layout.tsx` — shell (`.app-chrome` + sidebar + top bar + `<main>`) is shared/automatic. Untouched.
- `src/app/dashboard/page.tsx` — `?personaUpdated=1` reader / `PersonaUpdatedBanner` goes dead-but-compiling once settings stops setting it. Leave it (engineDecider's cleanup); do NOT delete.
- `src/components/onboarding/PersonaPrompt.tsx` — settings was its only mount; component stays in the tree for engineDecider to retire. Do NOT delete.
- `authAppearance` in `src/lib/clerkAppearance.ts` — used by auth screens; add a sibling export, don't modify it.
- No dual-renderer surface involved (no template blocks, no published renderer).

---

## Phase 1 — page swap + `profileAppearance`

**Goal:** `/dashboard/settings` renders a themed Clerk `<UserProfile/>` as plain content inside the dashboard layout; persona editor + its `User.persona` read removed from this page; notifications placeholder present as a commented TODO.

**Files touched:**
- `src/lib/clerkAppearance.ts` (edit — add `profileAppearance` export)
- `src/app/dashboard/settings/page.tsx` (rewrite body)

**Steps:**
1. `src/lib/clerkAppearance.ts` — add a new exported `profileAppearance: Appearance` sibling to `authAppearance` (do not modify `authAppearance`):
   - Reuse `authAppearance`'s `variables` values verbatim (colorPrimary `#006CFF`, colorText `#191922`, fontFamily `'Onest, ui-sans-serif, system-ui, sans-serif'`, borderRadius `12px`, etc.). Duplicating the variables object (or extracting a shared const) is fine — keep it simple.
   - **KEEP the card chrome** (the auth map strips it because `FounderAuthLayout` supplies the frame — wrong here). Style the profile card to read as a panel on the dashboard's `#f7f8fa` main: white surface, `border-app-border`, app radius (`rounded-app-*`), light/no shadow — via `elements` keys like `rootBox`/`cardBox`/`card` and the profile nav (`navbar`/`navbarButton` or current Clerk equivalents), using `app-*` Tailwind tokens per `src/components/ui/README.md`. Lightweight — beta-acceptable, NOT pixel-perfect; Clerk's default inner UI is founder-accepted (spec Scope OUT).
   - Doc comment mirroring `authAppearance`'s: presentation-only, Clerk owns flows; note the card-chrome-kept difference.
2. `src/app/dashboard/settings/page.tsx` — rewrite:
   - Keep the `auth()` → `redirect('/sign-in')` guard.
   - DELETE: prisma import + `User.persona` read, `PersonaPrompt` import/mount, `UserPersona` type import, `next="/dashboard?personaUpdated=1"`, and the redundant full-screen shell (`min-h-screen bg-white` wrapper, inner `<main className="max-w-3xl">`, "← Back to dashboard" link) — the dashboard layout already supplies chrome; the new body is plain content inside the layout's `<main>`.
   - Render: page header (`h1` "Account settings" + short subhead, styled with `app-*` tokens to match sibling dashboard pages) → `<UserProfile routing="hash" appearance={profileAppearance} />` (import from `@clerk/nextjs`; hash routing → no catch-all segment needed).
   - Below it, the notifications placeholder as a comment containing EXACTLY the marker `// TODO(beta+): notifications settings — needs a prefs backend` — commented-out block, not silently omitted (spec-required).
   - Any brand string = "Lessgo AI" (likely none needed beyond the header).

**Verification:**
- `npx tsc --noEmit` · `npm run test:run` · `npm run lint` · `npm run build` — all green.
- Manual dev-server sanity (implementer): `/dashboard/settings` shows sidebar + top bar + Clerk profile; no persona selector; no doubled chrome/scrollbars; Onest font on the Clerk widget.

---

## Phase 2 — e2e regression spec (deterministic-QA)

**Goal:** script the automatable route/content check per step-4a: settings page renders the Clerk profile, not the persona selector. (Judgment: worth adding — it's exactly the QA bug class ("settings takes to persona selection") and the authed harness already exists; cost is one small spec + an allowlist line.)

**Files touched:**
- `e2e/account-settings.spec.ts` (new)
- `playwright.config.ts` (edit — register spec in the `authed` project's testMatch allowlist)

**Steps:**
1. New `e2e/account-settings.spec.ts` — authed project pattern (Clerk session from `e2e/auth.setup.ts` via `storageState: e2e/.clerk/user.json`; same as `publish.spec.ts` — no per-spec sign-in code needed):
   - `page.goto('/dashboard/settings')`.
   - Assert header "Account settings" visible.
   - Assert Clerk `<UserProfile/>` mounted: a resilient selector on Clerk's stable class prefix (e.g. `.cl-userProfile-root`, fallback `[class*="cl-userProfile"]`), generous timeout — Clerk hydrates client-side.
   - Assert persona selector ABSENT: no "What do you do?" text (the old `PersonaPrompt` heading).
2. `playwright.config.ts` — add `/account-settings\.spec\.ts/` to the `authed` project's `testMatch` array. **Load-bearing:** testMatch is an explicit ALLOWLIST; an unregistered spec silently never runs (documented trap in the config comment).

**Verification:**
- `npm run test:e2e` — new spec runs (confirm it appears in output — allowlist trap) and passes; existing suites stay green.
- Green gates re-run on full diff: `tsc` · `test:run` · `lint`.

---

## HUMAN GATE (end of pipeline = merge gate)

On the QA preview deploy, founder must:
1. **Visual eyeball** — themed Clerk profile inside the dashboard shell looks non-embarrassing (the whole point of the spec).
2. **Auth-adjacent smoke** (Clerk-owned flows — cannot cheaply script): change name, upload avatar, change email, change password, view delete-account; and **sign-out via the sidebar Account menu still works** (P0 path).

Not scriptable → routed to founder-manual per the deterministic-QA split. Merge to main only after this gate.

**Coordination note:** engineDecider also touches persona surfaces — flag at merge time that this branch removed the settings-page `PersonaPrompt` mount + persona read (merge-collision watchpoint per spec Constraints).

## Unresolved questions

None.
