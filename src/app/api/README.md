# API Routes (`src/app/api/`)

Next.js 14 App Router route handlers (one `route.ts`/`route.tsx` per directory). This
table is the source of truth for **method · purpose · auth/credit** and is grouped by
concern. Verify against the handler before relying on a detail — this doc is maintained
by hand.

## Cross-cutting conventions

- **Auth** is enforced two ways: `src/middleware.ts` runs Clerk `auth.protect()` on every
  route **except** those in its `isPublicRoute` allowlist; handlers additionally re-check
  ownership. Routes marked _public_ below are in that allowlist (no session required);
  the handler still does its own gating (flags, ownership, rate limit) where noted.
- **Ownership:** token-scoped mutations call `assertProjectOwner(clerkId, token, …)`
  (`src/lib/security.ts`) — a token identifies a project but is **not** proof of ownership.
- **Admin:** `/api/admin/*` gate on `requireAdmin(req)` (`src/lib/admin.ts`) — allowed via
  `ADMIN_CLERK_IDS` or `CRON_SECRET`.
- **Rate limiting:** handlers are wrapped by `withAIRateLimit` / `withDraftRateLimit` /
  `withFormRateLimit` / `withPublishRateLimit` (`src/lib/rateLimit*`), noted as _RL:ai_ etc.
- **Credits:** AI operations call `requireAICredits` + `consumeCredits` with a
  `CREDIT_COSTS.*` cost (`src/lib/creditSystem.ts`). Cost column lists the `CREDIT_COSTS` key.

## Generation & copy (AI)

| Route | Method | Purpose | Auth / RL / credit |
|-------|--------|---------|--------------------|
| `/generate-landing` | POST | Full landing-page copy generation (strategy + copy phases) | public · RL:ai · `FULL_PAGE_GENERATION` |
| `/audience/product/strategy` | POST | Product strategy phase (big idea + card counts) | public · RL:ai · `STRATEGY_GENERATION` |
| `/audience/product/generate-copy` | POST | Product copy phase (fill section elements) | public · RL:ai · `GENERATE_COPY` |
| `/audience/service/strategy` | POST | Service strategy phase | RL:ai · `STRATEGY_GENERATION` |
| `/audience/service/generate-copy` | POST | Service copy phase | RL:ai · `GENERATE_COPY` |
| `/regenerate-content` | POST | Regenerate content across sections | RL:ai |
| `/regenerate-section` | POST | Regenerate one section | RL:ai · owner · `SECTION_REGENERATION` |
| `/regenerate-element` | POST | Regenerate one element | RL:ai · `ELEMENT_REGENERATION` |
| `/market-insights` | POST | Generate features + infer hidden copywriting fields | public |
| `/validate-fields` | POST | Validate taxonomy field values | public · RL:ai |
| `/generate-privacy-policy` | POST | AI-write a privacy policy for a project | RL:ai · owner · `PRIVACY_POLICY_GENERATION` |
| `/v2/scrape-website` | POST | Product website import (SSRF-safe crawl → prefill) | RL:ai · `SCRAPE_WEBSITE` |
| `/v2/understand` | POST | Service website import / understanding | RL:ai · `UNDERSTAND` |

> A legacy `/api/infer-fields` is referenced in old docs/middleware but no handler exists;
> field inference is now split across `market-insights` + `validate-fields`.

## Onboarding & persistence

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/start` | GET | **Universal entry bootstrap** (scale-02): upserts User + default plan, creates Token+Project (persona still seeds `Project.audienceType` for back-compat; the serve gate overwrites it at `/api/brief/confirm`), returns `/onboarding/{token}` — the universal entry where classification + the serve gate run. No persona gate, no waitlist | Clerk (anon allowed) |
| `/user/persona` | GET / POST | Read / set the user's persona | authed |
| `/saveDraft` | POST | Persist editor draft state | public · RL:draft · owner |
| `/loadDraft` | GET | Load saved draft by token | authed |
| `/projects/[tokenId]` | GET | Read a project | owner |
| `/projects/[tokenId]/published-slug` | GET | Resolve a project's published slug | authed |
| `/subscribe` | POST | Newsletter/waitlist email capture | public |
| `/csrf` | GET | Issue a CSRF token | authed |

## Publishing, domains & SEO

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/publish` | POST | Publish flow: create/update `PublishedPage` + immutable `PublishedPageVersion`, static-export via published renderer, Vercel Blob upload, KV route write | RL:publish · gated |
| `/checkSlug` | GET | Slug availability check | authed |
| `/blob-proxy` | GET | Serve published static HTML by KV route lookup (middleware rewrites custom-domain/subdomain hits here) | public |
| `/domains/add` | POST | Add custom domain to a page (Vercel API) | authed |
| `/domains/remove` | DELETE | Remove custom domain | authed |
| `/domains/verify-ownership` | POST | Verify `_lessgo-verify` TXT record → add to Vercel | authed |
| `/domains/verify-dns` | POST | Poll Vercel `getDomainConfig` until SSL live | authed |
| `/domains/status` | GET | Current custom-domain status | authed |
| `/seo/sitemap` · `/seo/robots` · `/seo/rss` | GET | Per-host `sitemap.xml` / `robots.txt` / `rss.xml` (middleware rewrites the pretty paths here with `?host=`) | public |
| `/og/[slug]` | GET | Dynamic OG image (`route.tsx`, `@vercel/og`) | public |

## Blog

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/blog/posts` | GET / POST | List / create posts | authed · POST RL:draft |
| `/blog/posts/[postId]` | GET / PATCH / DELETE | Read / edit / delete a post | authed |
| `/blog/posts/[postId]/publish` | POST | Publish a post (per-post blob/KV) | authed |
| `/blog/posts/[postId]/unpublish` | POST | Unpublish a post | authed |
| `/blog/unsubscribe` | GET | Tokened one-click unsubscribe from notification emails | public |

## Testimonials

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/testimonials` | POST | Create testimonial (owner-side) | authed |
| `/testimonials/[id]` | PATCH / DELETE | Moderate / delete a testimonial | authed |
| `/testimonials/collect` | POST | Public submit from a collect page | public · RL:form · flag-gated |
| `/testimonials/collect-link` | POST / PATCH | Create / update a collect link | authed |
| `/testimonials/apply-to-page` | POST | Feature selected testimonials on a page | authed |

## Forms, analytics & media

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/forms/submit` | GET / POST | Published-page form submission → stores `FormSubmission`, runs integrations; GET path serves form config | public · POST RL:form |
| `/analytics/event` | POST | Privacy-first analytics beacon (no raw IP/UA) | public |
| `/upload-image` | POST | Upload image asset | public |
| `/upload-video` | POST | Upload video asset | authed |
| `/proxy-image` | POST | Proxy/fetch a remote image | public |
| `/images/search` | POST | Stock image search | RL:form |

## Commerce (Stripe / billing / credits)

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/stripe/webhooks` | POST | Stripe webhook (updates plan/status, resets credits) | signature-verified |
| `/stripe/create-checkout-session` | POST | Start checkout | authed |
| `/stripe/create-portal-session` | POST | Open billing portal | authed |
| `/billing/plan` | GET | Current plan/tier + limits | authed |
| `/billing/usage` | GET | Monthly usage | authed |
| `/credits/balance` | GET | Credit balance | authed |

## Admin (`requireAdmin`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/admin/kv` | GET / POST | KV route diagnostics / repair |
| `/admin/env-check` | GET | Environment sanity check |
| `/admin/migrate-project` | POST | Copy a project dev→prod |
| `/admin/transfer-ownership` | POST | Transfer project ownership |

## Related docs

- Publishing internals: `docs/architecture/publishArch.md`
- Custom-domain routing: `src/lib/routing/kvRoutes.ts`, `src/middleware.ts`
- Credit costs: `src/lib/creditSystem.ts` · plans/limits: `src/lib/planManager.ts`
- Page routes that consume these APIs: `src/app/README.md`
