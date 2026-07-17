# app-entry — spec

> Source: `docs/reports/app-ui-ux-assessment.md` §1.1, §3 P0.1, §2 theme 1. Beta blocker.

## Problem / why
Signed-out visitor to `app.lessgo.ai/` hits the **old pre-launch waitlist page** ("Get Early Access!", "© 2025 Lessgo.AI"). No sign-in/sign-up link anywhere. `/sign-in` + `/sign-up` return raw Next.js 404 (Clerk is modal-only via layout buttons, not rendered on that page). A stranger has literally no path into the product. Hard blocker for public beta.

## Goal
A signed-out visitor to the app subdomain lands on a proper signed-out entry page with working sign-up/sign-in, auth routes resolve, and unknown app routes go somewhere sane. New users can get in.

## Decision (from discuss)
Build a **new signed-out landing on the app subdomain** (not a redirect to apex marketing).

## Scope IN
- Signed-out landing page on `app.lessgo.ai` with clear sign-up + sign-in CTAs.
- Make `/sign-in` and `/sign-up` resolve (no raw 404) — route or modal, whichever fits Clerk setup.
- Remove/replace the old waitlist page at app root.
- Branded 404 for unknown app routes; unknown route → redirect (authed → `/dashboard`, signed-out → landing).
- Correct brand string ("Lessgo AI") + current year on this surface.

## Scope OUT (non-goals)
- Apex marketing site content/design.
- Pricing page (owned by pricing-v2).
- Marketing-grade copy/visual polish of the landing (shell + working auth is enough for beta).
- Landing-page SEO.

## Constraints
- app-subdomain has **shipped** (app → `app.lessgo.ai`, apex = marketing/customer#0); build on its routing — do not duplicate or fight it.
- Clerk currently modal-based via layout buttons; keep auth provider consistent.
- Middleware owns subdomain routing.

## References
- `src/middleware.ts` — subdomain resolution.
- `docs/task/app-subdomain.spec.md` (+ its slice-2 in-flight work).
- Clerk layout sign-in/up buttons (app layout).
- Report §1.1.

## Open exploration questions
- Where is the old waitlist page component served from at app root, and what else references it?
- How does app-subdomain routing currently handle signed-out requests?
- Where are Clerk sign-in/up configured (modal vs dedicated route) and why do `/sign-in` `/sign-up` 404?
- Current 404 / not-found handling in App Router.

## Candidate human gates
- Middleware/auth routing changes (auth surface — sign off before merge).
- Removing the waitlist page (confirm nothing else depends on it).

## Acceptance criteria
- [ ] Signed-out visit to `app.lessgo.ai/` shows an entry page with sign-up + sign-in CTAs (no waitlist page).
- [ ] `/sign-in` and `/sign-up` resolve — no raw Next.js 404.
- [ ] A brand-new visitor can sign up end-to-end and reach `/dashboard`.
- [ ] Unknown app route → branded 404 or redirect (not raw 404).
- [ ] Brand string = "Lessgo AI", year = current, on this surface.

## Pilot / smallest slice
Landing shell + wired Clerk sign-up/in + resolving auth routes + old-waitlist removal. Decision gate: a stranger signs up and reaches the dashboard unaided.
