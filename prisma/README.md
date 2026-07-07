# `prisma/` — database schema & migrations

PostgreSQL via Prisma. Single schema (`schema.prisma`); `DATABASE_URL` selects the
target (dev/prod are separate Neon databases, reconciled through migrations).

## Rules (non-negotiable)

- **Use `npx prisma migrate dev`, never `db push`.** Dev and prod schemas are kept in
  sync by the committed migrations under `prisma/migrations/`. `db push` skips migration
  history and desyncs environments.
- **`postinstall` runs `prisma generate && prisma migrate deploy`** (see root
  `package.json`) — client is regenerated and pending migrations applied on deploy.
- Token-based project access is core: a `Project` is reached via its `Token.value`
  (`Project.tokenId → Token.value`), not by user session alone.

## Model map

| Model | Key / scope | Purpose & notable fields |
|-------|-------------|--------------------------|
| `User` | `clerkId` unique | App user; owns `Project[]`. |
| `Project` | `tokenId` unique (→ `Token.value`) | The editable page. Holds `audienceType`/`templateId`/`variantId`/`paletteId` + `content`/`themeValues`/`computedDesign` JSON. Owns `ProjectPage[]`, `Testimonial[]`, `CollectLink?`, `BlogPost[]`. |
| `Token` | `value` unique | Capability handle to one project. |
| `ProjectPage` | `(projectId, pathSlug)` unique | Multi-page: one row per page incl. home (`archetypeKey='home'`, `pathSlug='/'`). `content` = that page's sections slice. |
| `PublishedPage` | `slug` unique; `userId`=Clerk id (not FK) | Published site. Static-export fields (`publishState`, `currentVersionId`, `lastPublishAt`), custom-domain lifecycle fields (`customDomain*`), `blogIndex`. |
| `PublishedPageVersion` | `(publishedPageId, version)` unique | Immutable published snapshot; `blobKey`/`blobUrl`/`sizeBytes`; `metadata.blobs[]` for multi-page. `PublishedPage.currentVersionId` points at the live one. |
| `BlogPost` | `(projectId, slug)` unique | Blog Phase 1: own draft→publish lifecycle, `blog-*` blob versions outside `PublishedPageVersion`. Slug locks once `firstPublishedAt` set. |
| `BlogSubscriber` | `(publishedPageId, email)` unique | Blog P2 subscriber list; tokened unsubscribe. |
| `UserPlan` | `userId` unique (Clerk id) | Tier (FREE/PRO/AGENCY/ENTERPRISE), Stripe IDs, feature flags, limits (credits/pages/domains/forms). |
| `UserUsage` | `(userId, period)` unique | Monthly (`YYYY-MM`) credit + token + resource counters. |
| `UsageEvent` | indexed `userId`/`createdAt` | Per-operation ledger (eventType, creditsUsed, tokens, endpoint, success). |
| `PageAnalytics` | `(slug, date)` unique | Daily per-slug aggregates: views, unique visitors, conversions, device split, top referrers/UTM. |
| `FormSubmission` | indexed `userId`/`formId`/`publishedPageId` | Stored form submissions (`data` JSON, optional IP/UA). |
| `UserIntegration` | `(userId, type, name)` unique | Encrypted third-party API keys (e.g. ConvertKit). |
| `IVOCCache` | `(categoryKey, audienceKey)` unique | Cached Voice-of-Customer (pains/desires/objections/beliefs/phrases) + raw Tavily sources. |
| `SiteContext` | `(urlKey, audienceType)` unique | Global URL-keyed website-scrape cache: pages, structured extract, facts, verbatim excerpts; TTL-gated (`src/lib/siteContext.ts`). |
| `TaxonomyEmbedding` | `(fieldType, value)` unique | OpenAI embedding vectors for taxonomy semantic match. |
| `Testimonial` | indexed `userId`/`projectId`/`status` | Collected testimonials; `projectId` FK is `SetNull` (durable tenant asset — survives project delete). |
| `CollectLink` | `token` + `projectId` unique | One public collect link per project; token is the only capability. |
| `AdminAuditLog` | indexed `actorClerkId`/`createdAt` | Durable audit of privileged admin overrides (written by `logAdminOverride`). |

Ownership note: `PublishedPage.userId`, `FormSubmission.userId`, `Testimonial.userId`,
`CollectLink.userId` store the **Clerk id** (external, not a FK). `Project.userId` is the
internal `User.id` FK.
