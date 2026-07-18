---
tier: standard
tier-why: single dashboard page content-swap + light theming of Clerk's managed <UserProfile/> (not custom auth logic). Low blast radius, one route. Auto-escalate if scouting finds session/middleware work.
---

# account-settings — spec

## Problem / why
Dashboard "Account settings" → `/dashboard/settings` currently renders `PersonaPrompt` — a persona/audienceType editor (`src/app/dashboard/settings/page.tsx`). QA (Pricing #3, 18 July): "Account setting takes to persona selection which is wrong." There is **no real account-settings page**, and the persona concept is being retired by engineDecider — so this page is both wrong and obsolete.

## Goal
`/dashboard/settings` becomes a real, non-embarrassing account-settings page for beta: profile (name, avatar, email, password, security, delete) via Clerk's managed `<UserProfile/>`, presented inside the dashboard shell per design 2f. The persona editor is removed entirely. Cheap and safe — Clerk owns the risky auth flows; we own the wrapper.

## Scope IN
- **Replace** the `PersonaPrompt` on `/dashboard/settings` with Clerk's **managed `<UserProfile/>`** component, themed lightly to fit the dashboard chrome (design 2f: left dashboard nav + "Account settings" page header + Clerk profile as the main content). Clerk provides name / avatar / email-change / password / security (2FA) / connected accounts / delete-account and its own Profile/Security sub-nav.
- **Remove the persona editor entirely** from settings (persona is retiring via engineDecider). Drop the `PersonaPrompt` mount + its `User.persona` read on this page.
- **Notifications block (2f's third section): commented out with a note** — no notification-preferences backend exists yet; leave a clear `// TODO(beta+): notifications settings — needs a prefs backend` marker rather than silently omitting.
- Product name "Lessgo AI" throughout.

## Scope OUT (non-goals)
- **Custom-built profile/avatar/email/password UI** — use Clerk's managed component; do not hand-roll auth flows.
- **Pixel-matching design 2f's *inner* content** — only the surrounding dashboard shell matches; Clerk's default profile UI fills the main content (founder-accepted for beta; custom polish later).
- **Notifications preferences** (backend + toggles) — deferred; commented-out placeholder only.
- **Billing & plan and Domains** — already separate dashboard nav items (`billing-beta`, domains); not part of this page.
- Removing persona from anywhere else in the codebase — that's engineDecider's job; this spec only removes the *settings-page* editor.

## Constraints
- **Auth = Clerk.** Use the managed `<UserProfile/>`; theme via Clerk's `appearance` prop / existing app-chrome tokens — do NOT touch session, middleware, or sign-in/out logic.
- **Coordinate with engineDecider** (also pre-beta, also touches persona) — both remove persona surfaces; avoid a merge collision on `User.persona` reads / `PersonaPrompt`.
- **Design = visual source (shell only); flow/functionality = founder-dictated.** Match the 2f shell using existing dashboard components (`AppSidebar`, dashboard header), not by copying HTML.
- Entry point already correct: `AppSidebar.tsx:234` pushes to `/dashboard/settings`; the sidebar "Settings" row is also the P0 sign-out path — don't regress it.
- Pre-beta scope (beta blocker) — lands on `main` (beta), not `next`.
- Standard-tier /feature: scout (if needed) → plan → implement → ONE impl-review over the whole diff.

## References
- **Design (visual source):** `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Dashboard.dc.html` screen **2f** (account-settings page); README turn 7 (7a–7b Profile). Shell = 244px dashboard sidebar + `#f7f8fa` main + 64px page header "Account settings".
- **Current code to replace:** `src/app/dashboard/settings/page.tsx` (Clerk `auth()` + `PersonaPrompt` + `prisma User.persona`).
- **Entry point (leave intact):** `src/components/dashboard/AppSidebar.tsx:201,234` (Settings row → `/dashboard/settings`; also sole sign-out path).
- **Dashboard shell components to reuse:** `AppSidebar`, `DashboardTopBar` (`settings: ['Account','Settings']`).
- Clerk: `@clerk/nextjs` `<UserProfile/>` + `appearance` theming.

## Open exploration questions (feeds scout/plan)
- Does `<UserProfile/>` sit cleanly inside the existing dashboard layout (`dashboard/[token]/layout.tsx` / dashboard route group), or does the settings route need its own shell wrapper to get the sidebar + header?
- Any other reader of the persona-editor path or `?personaUpdated=1` redirect (`dashboard/settings` → `/dashboard?personaUpdated=1`) that breaks when `PersonaPrompt` is removed?
- Clerk `appearance` — can it match app-chrome tokens (Onest font, radii, blue `#006CFF`) well enough for beta, or is a thin CSS wrapper needed?
- `.app-chrome` ancestry / font bleed on the settings route (per `memory/project_appchrome_font_family_bleed`)?

## Candidate human gates
- **Visual eyeball** — the themed Clerk profile inside the dashboard shell looks non-embarrassing (founder taste; the whole point is "not the persona bug").
- **Auth-adjacent regression** — email change, password change, delete-account, and especially **sign-out still work** (Settings row is the P0 sign-out path) after the swap.

## Acceptance criteria
- [ ] `/dashboard/settings` shows a real account-settings page (Clerk `<UserProfile/>`), **not** the persona selector.
- [ ] Profile edits work end-to-end: change name, upload avatar, change email, change password (Clerk flows).
- [ ] The page renders inside the dashboard shell (sidebar + "Account settings" header) per 2f; branding says "Lessgo AI".
- [ ] Notifications section is commented out with a clear TODO note (not silently missing).
- [ ] Sign-out (the P0 sidebar path) and dashboard nav are unregressed.
- [ ] No persona editor remains on the settings page; `User.persona` read removed from it.
- [ ] Green gates: `tsc` · `test:run` · `build` · `lint`.

## Pilot / smallest slice
Already minimal — single-page swap. No phasing needed: replace the page body with a themed `<UserProfile/>`, comment out notifications, verify auth flows + sign-out on the QA preview. Decision gate = founder visual eyeball + sign-out/email/password smoke on preview.
