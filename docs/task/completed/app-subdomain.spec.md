# app-subdomain — spec

## Problem / why
App (dashboard/editor) lives on apex `lessgo.ai` paths. User shares `lessgo.ai/dashboard` with private users; apex is about to become the SEO surface and, later, a lessgo-published (dogfooded) marketing page — universe track. Splitting now, while user count is low and before backlinks accumulate, avoids redirect debt + re-indexing later.

## Goal
Product app moves to `app.lessgo.ai`; apex `lessgo.ai` becomes marketing-only. Apex is wired like a customer domain from day one: "published page assigned to `lessgo.ai`? serve it; else current Next.js homepage" — so the future dogfood homepage takes over apex by publishing alone, zero code change (routing touched once).

## 3-bucket model (agreed)
| Bucket | Host | What |
|---|---|---|
| Marketing/SEO | `lessgo.ai` | homepage, privacy/terms, future blog/pricing |
| Product | `app.lessgo.ai` | dashboard, edit, preview, onboarding, sign-in/up, billing, `/t/*` testimonial collection, admin |
| Customer content | `{slug}.lessgo.site` | published pages (unchanged) |

## Scope OUT (non-goals)
- Building the dogfood marketing page itself (universe track).
- `api.lessgo.ai` / dedicated asset host for new publishes.
- Removing the apex→app redirects (temporary-forever; revisit later "if at all when safe").
- Any change to `lessgo.site` publishing, custom-domain flow, or published-page HTML.
- Renaming beyond `app.` (studio. etc. considered, rejected — not a brand surface).

## Constraints
- **Apex must serve `/api/*` + `/assets/*` forever** — published HTML bakes absolute `https://lessgo.ai/...` URLs (fonts, form.v1.js, analytics beacon, forms submit, og). Only scalifixai.com is generated-HTML today (republish available), but rule protects all future publishes until a dedicated host exists.
- Apex `/p/{slug}` public hits → 301 to `{slug}.lessgo.site`; `/p/` route stays as internal rewrite target for subdomain SSR fallback.
- Old apex app links (`/dashboard`, `/edit/*`, `/preview/*`, `/onboarding/*`, sign-in/up, etc.) auto-forward to `app.lessgo.ai` — temporary redirects (not 301) since they may be removed later.
- Existing Clerk accounts keep working; cookies span `.lessgo.ai` (expected config-only — planner verifies satellite/allowed-origins needs).
- `app.lessgo.ai` is **noindex** (robots + headers); only apex indexed. No duplicate content across hosts.
- Pothole: legacy publish suffix `.lessgo.ai` makes `app` match as a publish-subdomain slug in `matchPublishSubdomain()` — `app` must be reserved (like `www`). Also reserve as unpublishable slug.
- Local dev (`localhost`, no subdomains) + e2e (Playwright authed specs) must keep working; `LESSGO_APP_HOSTS` env already parameterizes app hosts.
- Vercel: add `app.lessgo.ai` domain to project; no separate deployment.

## References
- `src/middleware.ts` — host branches: publish-subdomain (A), custom-domain (B); apex handling changes here.
- `src/lib/domains/hosts.ts` — `isLessgoAppHost`, `matchPublishSubdomain`, `LESSGO_APP_HOSTS`, reserved labels.
- `src/lib/staticExport/htmlGenerator.ts:226-238` — hard-coded `https://lessgo.ai` asset base (the don't-break constraint).
- `src/lib/routing/kvRoutes.ts` — KV route lookup the apex customer-#0 path rides on.
- Custom-domain flow (`/api/domains/*`) — pattern apex mimics as "customer #0".

## Open exploration questions
- Where are absolute app URLs generated/emailed (Clerk emails, lead-notification email links, dashboard share links, og)? Which need `app.` awareness?
- Clerk prod instance: does adding a subdomain need satellite-domain config or just allowed origins + redirect URLs?
- How does `isLessgoAppHost` suffix-match interact with `app.lessgo.ai` (matches `.lessgo.ai` suffix — is apex-vs-app distinguishable everywhere it's called)?
- Does anything server-side self-references apex paths (`/dashboard` links in emails, PostHog, Stripe return URLs)?
- e2e/auth.setup.ts host assumptions.

## Candidate human gates
- Vercel domain + Clerk production config changes (dashboard actions, prod auth surface).
- DNS change for `app.lessgo.ai`.
- First deploy flipping apex app-paths to redirects (user-visible cutover; verify scalifixai.com + sign-in immediately after).

## Acceptance criteria
- [ ] New user: open `app.lessgo.ai/dashboard` → sign-up → lands in dashboard.
- [ ] Existing user session/account works on `app.lessgo.ai` without re-registering.
- [ ] `lessgo.ai/dashboard` (and edit/preview/onboarding links) forward invisibly to `app.lessgo.ai/*`.
- [ ] `lessgo.ai` still serves current homepage; privacy/terms intact.
- [ ] scalifixai.com: fonts, form submit, analytics beacon all work untouched (spot-check live).
- [ ] `lessgo.ai/p/{slug}` 301s to `{slug}.lessgo.site`.
- [ ] `app.lessgo.ai` responses carry noindex; apex does not.
- [ ] Publishing a page assigned domain `lessgo.ai` takes over apex `/` with zero code change (dry-run provable via KV route presence).
- [ ] `npm run build`, `test:run`, e2e green; local dev unaffected.

## Pilot / smallest slice
Single-phase-able, but natural gate: **slice 1** = host wiring + redirects + Clerk behind `app.lessgo.ai` live, verified with one real sign-in + scalifixai.com spot-check → **gate** → **slice 2** = noindex/SEO polish + `/p/*` 301s + reserved-slug guard.
