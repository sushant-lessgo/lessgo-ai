# App Router (`src/app/`)

Next.js 14 App Router tree: user-facing pages + the `api/` route handlers. This file maps
the **page** routes; see `src/app/api/README.md` for the API surface and
`src/app/edit/[token]/README.md` for the editor internals.

## Request entry: `src/middleware.ts`

Clerk middleware wrapping custom host resolution. For non-API/non-`_next` requests it:
1. Rewrites `/sitemap.xml`, `/robots.txt`, `/rss.xml` → `/api/seo/*` (per-host).
2. **Branch A — Lessgo published subdomain** (`*.lessgo.site`, legacy `*.lessgo.ai`):
   check redirect → KV `route:{host}:{path}` → `/api/blob-proxy` (with `&v=` cache-bust)
   → SSR fallback `/p/{subdomain}{path}`.
3. **Branch B — custom domain** (host not owned by Lessgo): KV route → blob-proxy →
   SSR fallback via `getSlugForHostEdge` → `/p/{slug}{path}`; else 404.
4. Stamps a `geo-country` cookie (Lumen language default). `/dev/*` is 404'd in production.
5. Everything else: `auth.protect()` unless in the `isPublicRoute` allowlist.

## Public / marketing

> **INVARIANT:** every page meant to be visible logged-out MUST be added to the
> `isPublicRoute` allowlist in `src/middleware.ts` — there is no auto-detection;
> a new marketing page not listed there silently 307s to sign-in on prod.
> (Bug class caught 2026-07-12: `/pricing`, `/blog`, `/sitemap.xml` were all gated.)

| Route | File | Purpose |
|-------|------|---------|
| `/` | `page.tsx` | Landing / marketing home |
| `/pricing` | `pricing/page.tsx` | Pricing + plans |
| `/privacy` · `/terms` · `/thanks` | `{privacy,terms,thanks}/page.tsx` | Static legal / post-action pages |
| `/blog` · `/blog/[slug]` | `blog/…` | Lessgo's own marketing blog (MDX) |

## Onboarding

| Route | File | Purpose |
|-------|------|---------|
| `/onboarding/[token]` | `onboarding/[token]/page.tsx` | **Universal entry + unified wizard** (scale-02 entry, scale-06 wizard): one-liner/URL → classify → confirm card → serve gate (`/api/brief/confirm`) → load-detection renders the ONE unified wizard (`components/onboarding/wizard`) for every engine (thing/trust/work), or manual-onboard capture (`DemandLead`) |
| `/onboarding/product/[token]` | `onboarding/product/[token]/page.tsx` | **Redirect stub** → `/onboarding/[token]` (scale-06 phase 10 retired the old product wizard fork) |
| `/onboarding/service/[token]` | `onboarding/service/[token]/page.tsx` | **Redirect stub** → `/onboarding/[token]` (scale-06 phase 10 retired the old service wizard fork) |
| `/onboarding/waitlist` | `onboarding/waitlist/page.tsx` | Redirect → `/dashboard` (pilot waitlist removed by scale-02) |

Entry: authed users hit `GET /api/start`, which bootstraps a Token+Project and returns
`/onboarding/{token}` (universal entry). There is no persona gate — the entry's serve
gate decides product/service wizard vs manual-onboard on the confirmed Brief.

## Generate → edit → preview → publish

| Route | File | Purpose |
|-------|------|---------|
| `/generate/[token]` | `generate/[token]/page.tsx` | Post-onboarding generation/reveal screen (renders via `LandingPageRenderer`, transition + reveal animation) |
| `/edit/[token]` | `edit/[token]/page.tsx` | Visual inline editor (`EditProvider` → `EditLayout`); see the local README |
| `/preview/[token]` | `preview/[token]/page.tsx` | Full-page preview; hosts the publish flow (SlugModal + CustomDomainModal) |
| `/preview/[token]/privacy` | `preview/[token]/privacy/page.tsx` | Privacy-policy preview |

## Published pages (live sites)

| Route | File | Purpose |
|-------|------|---------|
| `/p/[slug]` | `p/[slug]/page.tsx` | Live published page — **ISR** (`revalidate = 3600`); SSR fallback for the blob-proxy fast path. Canonical resolves to a live custom domain when set |
| `/p/[slug]/[...subpath]` | `p/[slug]/[...subpath]/page.tsx` | Multi-page subpaths (ISR) |
| `/p/[slug]/privacy` | `p/[slug]/privacy/page.tsx` | Published privacy policy |
| `/p/[slug]/blog` · `/p/[slug]/blog/[postSlug]` | `p/[slug]/blog/…` | Per-site blog index + post |

Custom domains and `*.lessgo.site` subdomains are rewritten to these by middleware —
the fast path serves static blob HTML; these SSR routes are the fallback.

## Testimonials collection (public)

| Route | File | Purpose |
|-------|------|---------|
| `/t/[collectToken]` | `t/[collectToken]/page.tsx` | Public "share your experience" collect form; flag-gated (`isTestimonialsEnabled`), `noindex` |

## Dashboard (authed)

| Route | File | Purpose |
|-------|------|---------|
| `/dashboard` | `dashboard/page.tsx` | Project list / home |
| `/dashboard/billing` · `/dashboard/settings` | `dashboard/{billing,settings}/page.tsx` | Plan/billing · account settings |
| `/dashboard/analytics/[slug]` | `dashboard/analytics/[slug]/page.tsx` | Per-page analytics |
| `/dashboard/forms/[slug]` | `dashboard/forms/[slug]/page.tsx` | Form submissions for a page |
| `/dashboard/testimonials` | `dashboard/testimonials/page.tsx` | Testimonial moderation |
| `/dashboard/blog/[slug]` · `…/[postId]` · `…/[postId]/preview` | `dashboard/blog/…` | Per-site blog post management + preview |

## Admin & dev

| Route | File | Purpose |
|-------|------|---------|
| `/admin` | `admin/page.tsx` | Admin UI (gated by `requireAdmin` on its APIs) |
| `/dev/*` | `dev/{meridian,hearth-demo,seed-lumen}/…` | Template dev harnesses / seed pages — **blocked in production** by middleware |

## Root routes

- `/sitemap.xml` → `sitemap.xml/route.ts` (default-host sitemap; per-host variants via `/api/seo/sitemap`).
- `src/app/components/WaitlistForm.tsx` — a stray shared component colocated under `app/`.
