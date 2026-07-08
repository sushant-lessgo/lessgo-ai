# `src/lib/` — shared-services map

The grab-bag of cross-cutting services used by API routes, renderers, and stores.
This README groups the ~50 files/subdirs by concern. Verified against file headers;
open the file for detail. Sibling shared trees: `src/services/` (Pexels client) and
`src/schemas/` (taxonomy-derived Zod). DB layer is `prisma/` (see `prisma/README.md`).

## Load-bearing invariants (read before touching anything here)

- **`checkCredits()` gates every AI op.** `creditSystem.ts` → `checkCredits(userId, op)` /
  `consumeCredits(...)`. AI routes must gate before spending and record a `UsageEvent`.
- **`assertProjectOwner()` is the token-route auth pattern.** `security.ts` exports both
  `verifyProjectAccess()` (bool) and `assertProjectOwner()` (throws) — use the latter for
  **all new token-scoped routes**. `blog/access.ts`, testimonials, etc. wrap it.
- **`routing/kvRoutes.ts` is edge-compatible KV via REST**, not the `@vercel/kv` package —
  it runs in middleware/edge where the SDK can't. Keep it dependency-light.
- **DB schema changes go through `prisma migrate dev`, never `db push`** (dev/prod are
  reconciled via migrations). See `prisma/README.md`.
- **Dual-renderer parity:** everything under `staticExport/` renders the *published* side.
  Editor and published output must stay identical (see root `CLAUDE.md`).
- **`prisma.ts` is the singleton** — import `{ prisma }` from `@/lib/prisma`; don't `new
  PrismaClient()` per-module (a few legacy files do; don't copy them).

## AI clients & model routing

| File | Purpose |
|------|---------|
| `aiClient.ts` | Unified structured-output client over OpenAI + Anthropic with schema guarantee + provider fallback. |
| `openaiClient.ts` | `openai` + `mistral` (Nebius/Mistral baseURL) `OpenAI` SDK instances. |
| `anthropicClient.ts` | `anthropic` SDK instance (`@anthropic-ai/sdk`). |
| `modelConfig.ts` | Pinned model IDs per endpoint × tier (`cheap`/`production`); `getModelConfig`/`getProvider`. |
| `mockMode.ts` | Demo/mock-mode detection (`DEMO_TOKEN`, `NEXT_PUBLIC_USE_MOCK_GPT`) — bypasses AI + billing. |

## Billing, credits & plans

| File | Purpose |
|------|---------|
| `planManager.ts` | `PlanTier`/`PlanStatus`, `getUserPlan`, `hasFeature`, `checkLimit` — plan config + feature/limit gating. |
| `creditSystem.ts` | `CREDIT_COSTS`, `checkCredits`, `consumeCredits`, `UsageEventType` — the AI-op quota system. |
| `stripe.ts` | `stripe` client init + billing helpers (throws if `STRIPE_SECRET_KEY` unset). |
| `middleware/planCheck.ts` | Route-level middleware chaining plan-access + credit checks. |

## Publishing, routing & domains

| File | Purpose |
|------|---------|
| `staticExport/` | Published-page static-HTML pipeline: `htmlGenerator.ts`, blob upload, head/OG/structured-data, chrome injection, badge, version cleanup, template behavior JS. Renders the **published** side. |
| `routing/kvRoutes.ts` | Edge KV route/redirect lookups via REST (`route:{host}:{path}` → blob URL). |
| `routing/types.ts` | `RouteConfig`/`RedirectConfig` KV shapes (embeds `blobUrl` to skip per-request `head()`). |
| `vercel/domains.ts` | Vercel domains REST wrapper (add/remove/config); `VercelApiError`. |
| `domains/hosts.ts` | App-host + publish-subdomain host helpers (`LESSGO_APP_HOSTS`). |
| `domains/liveHosts.ts` | Canonical "which hosts is this page live on" (subdomain + custom domain). |
| `domains/validate.ts` | Domain FQDN/apex/subdomain parse + validation (`tldts`). |
| `domains/verify.ts` | DNS/TXT ownership-record helpers (public resolvers). |
| `seo/buildSitemapXml.ts` | Per-host sitemap + always-permissive robots (noindex via meta tag, not robots). |
| `seo/buildRssXml.ts` | Blog RSS 2.0 feed builder (pure). |
| `seo/resolvePublishedHost.ts` | Host → `PublishedPage` lookup for sitemap/robots routes. |

## Security, auth & validation

| File | Purpose |
|------|---------|
| `security.ts` | OWASP headers, `verifyProjectAccess`, **`assertProjectOwner`** (token-route auth pattern). |
| `admin.ts` | `isAdmin`, `requireAdmin` (gates `/api/admin/*` via `ADMIN_CLERK_IDS`/`CRON_SECRET`), `logAdminOverride` (best-effort audit). |
| `adminValidation.ts` | Zod schemas for admin endpoints (migrate/transfer). |
| `csrf.ts` | CSRF token gen/verify (cookie + `x-csrf-token`). |
| `fetch-with-csrf.ts` | Client fetch wrapper auto-attaching the CSRF token. |
| `rateLimit.ts` | In-memory + tier-based rate-limit middleware. |
| `htmlSanitizer.ts` | DOMPurify sanitization profiles (STRICT for published content). |
| `sanitizeContent.ts` | Strips circular refs / DOM / React fibers before JSON persist. |
| `validation.ts` | OWASP input Zod schemas (form submit, draft save, `PageSeoSchema`, etc.). |
| `scrape/ssrfGuard.ts` | Pure private-IP/SSRF address checks (unit-testable). |
| `scrape/fetchSite.ts` | SSRF-hardened bounded crawl + HTML→text (IP-pinned undici, server-only). |

## Research / IVOC (Voice-of-Customer)

| File | Purpose |
|------|---------|
| `tavily.ts` | Tavily search client for IVOC research. |
| `perplexity.ts` | Perplexity web-search IVOC client (alt provider). |
| `ivocExtractor.ts` | LLM extraction of pains/desires/objections/beliefs/phrases from search snippets. |
| `painQueryGenerator.ts` | LLM-generated focused pain-point search queries. |
| `embeddings.ts` | OpenAI embedding generation (taxonomy semantic match). |
| `normalize.ts` | `slugify` + `normalizeIVOCKeys` for cache-key normalization. |

## Integrations & email

| File | Purpose |
|------|---------|
| `integrations/convertkit.ts` | ConvertKit API (live form integration). |
| `email/sendLeadNotification.ts` | Resend REST lead email on contact/demo submit — env-gated, never throws. |
| `email/sendBlogPostNotification.ts` | Resend REST email to blog subscribers on first publish — env-gated, never throws. |

## Content sub-systems

| Area | Purpose |
|------|---------|
| `blog/` | Blog Phase 1/P2: ownership gate, page-def synthesis, per-post publish, JSON-LD, SSR fallback, Zod. See `blog/README.md`. |
| `testimonials/` | Collect→moderate→apply-to-page system: repo, collect-links, photo upload, apply, dark-launch flag. See `testimonials/README.md`. |
| `generation/fetchImages.ts` | Parallel Pexels fetch (`fetchImagesForSpecs`) + palette scoring (`pickBestImage`) during page generation. |
| `generation/imageSlots.ts` | Block-layout → image-slot map + `expandImageSlots` (sectionId-keyed content → fetch specs). |
| `generation/imageColorTreatment.ts` | Palette-harmonizing CSS filter for images. |
| `siteContext.ts` | Persisted website-scrape context (global URL-keyed `SiteContext` cache, TTL-gated). |
| `schemas/` | Structured-output Zod schemas for v2 endpoints (understand/copy/strategy/scrape). |
| `mdx.ts` | Filesystem MDX blog-content loader (`src/content/blog`). |

## Icons

`getIcon.ts` (universal three-tier icon getter), `iconCategoryMap.ts`, `iconSearchIndex.ts`,
`lucideIconCategories.ts`, `lucideIconRegistry.ts` (Lucide data), `iconUsageTracker.ts`
(localStorage popular/recent).

## Infra & utilities

| File | Purpose |
|------|---------|
| `prisma.ts` | Prisma singleton (`{ prisma }`) — primary DB client. |
| `devPrisma.ts` | Optional second client on `DEV_DATABASE_URL` (dev→prod copy tooling); null when unset. |
| `logger.ts` | Level-gated logger (ERROR in prod) forwarding to Sentry. |
| `sentryShared.ts` | Edge-safe Sentry config shared by `sentry.*.config.ts`; DSN-gated; AI-fallback noise filter. |
| `themeUtils.ts` | Server-side color math (`darken` etc.) for published pages. |
| `utils.ts` | `cn()` (clsx + tailwind-merge). |
