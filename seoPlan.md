# seoPlan.md — SEO & Social (OG) for published pages

Long-term plan to make Lessgo-published pages rank and share well — on both
`{slug}.lessgo.site` subdomains and custom domains (first live customer:
**scalifixai.com**). One plan doc for the SEO track (folds all phases).

## STATUS (2026-07-03): Phases 0–5 BUILT — all on branch `seo`, pending merge to main

| Phase | Commit | What |
|---|---|---|
| 0 | 3ba982b (main) | canonical/og:url use live custom domain + per-page path; regen on domain go-live |
| 1 | f05464d | shared `buildPageMetadata()` — static + dynamic renderers can't drift |
| 2a | a353626 | per-page `seo` blob (content JSON), sanitizeSeo gate, head threading, noindex meta |
| 2b | 510c188 | SEO & Social editor panel (per-page tabs, meters, OG/favicon upload, previews) |
| 5 | 1ae2b12 | OG image: real palette, logo, per-subpage `?path=`, cache headers |
| 3 | 62b07cc | JSON-LD (auto→Organization) + favicon in both renderers |
| 4 | 0d5fb46 | per-host sitemap.xml + robots.txt via middleware interception |

Remaining: merge `seo`→main after manual QA (editor panel, OG visuals per
template, publish→view-source, sitemap/robots on scalifixai.com), then republish
scalifix. Phase 6 polish (hreflang etc.) deferred.

### Corrections vs. original plan (as-built)
- **Mirror columns DROPPED (PO review)** — JSON-only: every consumer reads
  `content.seo`; add columns only when a real reader (admin query) exists.
- **noIndex = `<meta name="robots" content="noindex,nofollow">`**, NOT robots.txt
  `Disallow` (Disallow blocks the crawl → crawler never sees the noindex).
  robots.txt stays permissive; sitemap omits noindexed pages.
- **Logo location**: header section's `elements.logo_image.content` (chrome is
  injected per page at publish) — NOT `chrome.header`/`globalSettings.logoUrl`.
- **OG palette**: `themeValues.colors.baseColor` was dead (publish stores
  `{primary,background,muted}`). Real palette = `content.layout.theme.colors`
  (gradientColors → accentColor+darken → legacy COLOR_MAP).
- **Root seo lives on the home page entry** (`pathSlug==='/'`), lifted to
  `content.seo` at publish; subpages carry their own on `subpages[path].seo`.
- **JSON-LD root page only**; subpage `structuredDataType` stored but not rendered.
- **verify-dns needed zero changes** — it re-reads `PublishedPage.content`,
  which now carries seo.

---

## 1. Why now

First paying customer is live on a **custom domain** and asking for "better SEO".
Today's implementation is fine for a subdomain demo but has one bug that actively
hurts a custom-domain customer, plus several gaps that block real search/social
performance. This plan fixes the bug fast, then builds the durable system.

---

## 2. Current state (as-built, verified)

Static HTML is baked at publish time by `generateStaticHTML()`
(`src/lib/staticExport/htmlGenerator.ts`) and served from Blob via KV routing.
The dynamic `/p/[slug]` `generateMetadata` is the SSR fallback path.

**Works today**
- `<title>`, `meta description` (auto from hero subheadline, 160-char cap)
- Full OG + Twitter card set (`og:title/description/image/url`, `summary_large_image`)
- Canonical tag (but wrong value — see below)
- OG image: manual `previewImage` override, else auto-generated `/api/og/[slug]`
  (1200×630 via `next/og`: theme-gradient + hero headline/subheadline/badge + branding)
- Per-subpage metadata for multi-page (`/p/[slug]/[...subpath]`)

**Gaps / bugs**
| # | Problem | Where | Severity |
|---|---------|-------|----------|
| G1 | **Canonical + `og:url` hardcoded to `https://{slug}.lessgo.ai`** — custom-domain pages point authority at the wrong URL | `htmlGenerator.ts:201` | **P0 (hurts scalifix now)** |
| G2 | Custom domain not known at generation time; HTML baked before domain goes live → never regenerated with correct canonical | `api/publish/route.ts:406` (fetched after gen); `domains/verify-dns` | **P0** |
| G3 | No user control of SEO title / description separately from page title | `SlugModal.tsx` | P1 |
| G4 | No JSON-LD structured data on landing pages (only blog has it) | — | P1 |
| G5 | No sitemap.xml / robots.txt for published pages or custom domains | `sitemap.xml/route.ts` marketing-only | P1 |
| G6 | No per-page favicon | static `app/favicon.ico` only | P2 |
| G7 | No per-page `noindex` control (drafts/staging get indexed) | — | P2 |
| G8 | OG image: single hardcoded layout, no logo, no manual-per-page control in UI | `api/og/[slug]/route.tsx` | P2 |
| G9 | description is auto-truncated hero subheadline — often not a good SERP snippet | publish route | P1 |

---

## 3. Design principles

1. **Content JSON is the source of truth.** SEO overrides live in the page content
   blob (per-page for multi-page), flow through the publish payload, and get baked
   into static HTML. Mirror a few queryable fields onto `PublishedPage` columns.
2. **Everything falls back gracefully.** Empty SEO override → today's auto-derived
   behavior. No regressions for existing pages.
3. **Custom domain is a first-class URL**, not an afterthought. Canonical/OG/sitemap
   all resolve to the live custom domain when one exists, else the subdomain.
4. **Dual-renderer discipline.** SEO lives in the `<head>` string (static generator)
   AND the dynamic `generateMetadata` — both must stay in sync (the #1 architectural
   trap). Extract a single shared `buildPageMetadata()` helper so they can't diverge.
5. **Ship the P0 custom-domain fix independently** of the editor UI work.

---

## 4. Architecture

### 4a. Where SEO data lives

Add a per-page `seo` blob to the content model (root + each subpage):

```ts
// src/types/store/pages.ts — extend ProjectPageEntry
seo?: {
  title?: string;          // <title> + og:title override
  description?: string;     // meta description + og:description override
  ogImage?: string;         // absolute URL; overrides auto /api/og
  canonical?: string;       // rare manual override
  noIndex?: boolean;        // robots noindex,nofollow
  faviconUrl?: string;      // per-page favicon
  structuredDataType?: 'Organization' | 'Product' | 'Service' | 'LocalBusiness' | 'none';
}
```

Root page's `seo` lives in the top-level content blob; subpages carry their own.
Editor store (`editStore.ts`) holds it; publish payload serializes it.

### 4b. Single shared metadata builder (kills dual-renderer drift)

New `src/lib/staticExport/buildPageMetadata.ts`:

```ts
buildPageMetadata({ page, subpage?, liveDomain }) -> {
  title, description, canonical, ogImage, robots, siteName, structuredData
}
```

Consumed by BOTH:
- `htmlGenerator.ts` (build the `<head>` string)
- `p/[slug]/page.tsx` + `p/[slug]/[...subpath]/page.tsx` (`generateMetadata`)

`liveDomain` = `customDomain` when `customDomainStatus === 'live'`, else `{slug}.lessgo.ai`.

### 4c. Canonical / custom-domain resolution (G1, G2)

- **At publish**: fetch `customDomain` + status **before** `generateStaticHTML` (move
  the existing `route.ts:406` query up). Pass `liveDomain` into metadata builder so
  canonical/`og:url` are correct if the domain is already live.
- **On domain-go-live**: `domains/verify-dns` (where status flips to `live`) must
  **trigger a republish/regeneration** of the static HTML so canonical switches from
  subdomain → custom domain. Add a `regenerateStaticHTML(pageId)` call there (reuse
  the publish generation path). Also emit the subdomain→custom 301 (already done).
- Subdomain page keeps `<link rel="canonical" href="https://custom-domain/...">`
  pointing at the custom domain so both URLs consolidate authority.

### 4d. OG image (G8)

- `seo.ogImage` (manual) > auto `/api/og/[slug]` (dynamic) — already the precedence.
- Extend `/api/og/[slug]/route.tsx`: pull the page's **logo** (from `chrome.header`)
  and render it; read the real template palette instead of the 8-color `COLOR_MAP`.
- Per-subpage OG: `/api/og/[slug]?path=/gallery` reads subpage hero.

### 4e. Structured data (G4)

New `src/lib/staticExport/structuredData.ts` builds JSON-LD from `seo.structuredDataType`
+ page content (name, description, logo, url, sameAs socials). Injected as
`<script type="application/ld+json">` by the metadata builder into both renderers.
Default heuristic: product audience → `Product`/`Organization`; service → `Service`
/`LocalBusiness`.

### 4f. Sitemap + robots per host (G5)

- New dynamic route `src/app/api/seo/sitemap/route.ts` — given a host (subdomain or
  custom domain), resolves the `PublishedPage` via KV/DB and emits sitemap.xml listing
  the root + all published subpages with `lastmod` = `lastPublishAt`.
- `robots.txt` per published host → `Sitemap:` line pointing at the above; honors
  `seo.noIndex` (emit `Disallow: /`).
- Wire via `middleware.ts` so `custom-domain/sitemap.xml` and `/robots.txt` resolve.

### 4g. Favicon (G6)

`seo.faviconUrl` → `<link rel="icon">` in `<head>`; default Lessgo favicon when unset.
Upload reuses existing image upload/proxy pipeline.

---

## 5. Phased delivery

### Phase 0 — P0 custom-domain canonical fix (scalifix unblock) — **~0.5 day**
- Move custom-domain fetch before generation in `api/publish/route.ts`.
- Add `liveDomain` param through `StaticHTMLOptions` → canonical + `og:url`.
- Regenerate static HTML on `domains/verify-dns` go-live.
- Backfill: one-off republish scalifix so its live HTML gets the correct canonical.
- No UI change. Verify with view-source on scalifixai.com.

### Phase 1 — Shared metadata builder + dynamic-route parity — **~1 day**
- Extract `buildPageMetadata()`; refactor `htmlGenerator` + both `generateMetadata`
  to use it. Pure refactor, no behavior change (guard with generation-contract test).

### Phase 2 — SEO settings UI + storage — **~2–3 days**
- Extend `ProjectPageEntry.seo` + editStore + save/load.
- Extend `PublishSchema` (`src/lib/validation.ts`) + publish route to accept/store
  `seo`; mirror `seoTitle`/`seoDescription`/`ogImage`/`noIndex` onto `PublishedPage`.
- Prisma migration (`migrate dev`, not `db push`): add mirror columns.
- UI: "SEO & Social" panel — either expand `SlugModal.tsx` (Advanced section) or a
  dedicated editor side-panel. Fields: SEO title (60-char meter), meta description
  (160-char meter), OG image upload w/ live preview, favicon, noindex toggle,
  per-subpage tabs for multi-page. Live Google/Twitter/OG preview cards.

### Phase 3 — Structured data (JSON-LD) — **~1 day**
- `structuredData.ts` + type picker in SEO panel + inject into both renderers.

### Phase 4 — Sitemap / robots per host — **~1–1.5 days**
- Dynamic sitemap + robots routes; middleware wiring for custom domains; noindex honored.

### Phase 5 — OG image upgrade — **~1–1.5 days**
- Logo in auto OG; real palette; per-subpage OG; optional layout variants.

### Phase 6 — Polish — as needed
- Per-page favicon upload, keywords (optional), `hreflang` for Lumen-style bilingual
  pages (ties to `i18nPlan.md`), OG image cache headers.

---

## 6. Files touched (index)

- `src/lib/staticExport/htmlGenerator.ts` — `<head>` assembly, `StaticHTMLOptions`, canonical
- `src/lib/staticExport/buildPageMetadata.ts` — **new**, shared builder
- `src/lib/staticExport/structuredData.ts` — **new**, JSON-LD
- `src/app/api/publish/route.ts` — domain fetch order, pass seo + liveDomain
- `src/app/api/domains/verify-dns/route.ts` — regenerate HTML on go-live
- `src/app/p/[slug]/page.tsx` + `[...subpath]/page.tsx` — use shared builder
- `src/app/api/og/[slug]/route.tsx` — logo, palette, `?path=`
- `src/app/api/seo/sitemap/route.ts` + robots route — **new**
- `src/middleware.ts` — sitemap/robots routing per host
- `src/components/SlugModal.tsx` (or new SEO panel) — UI
- `src/lib/validation.ts` — `PublishSchema` seo fields
- `src/types/store/pages.ts` + `src/stores/editStore.ts` — `seo` blob
- `prisma/schema.prisma` + migration — `PublishedPage` mirror columns

---

## 7. Testing

- Generation-contract test: shared builder refactor produces byte-identical head for
  a fixture with no SEO overrides (no regression).
- New unit tests: canonical resolution (subdomain vs live custom domain), noindex,
  structured-data shape, sitemap XML for multi-page.
- Manual (TESTING.md addendum): publish scalifix → view-source confirms canonical =
  scalifixai.com, OG debugger (Facebook/Twitter/LinkedIn) renders card, Google Rich
  Results test passes JSON-LD, `/sitemap.xml` + `/robots.txt` resolve on custom domain.

---

## 8. Sequencing recommendation

Ship **Phase 0 today** (unblocks the paying customer's actual complaint), then
Phase 1+2 as the real feature. Phases 3–5 are the "rank well" layer and can follow
once the customer sees the fix + editing controls.

---

## Unresolved questions

1. Scope now: just Phase 0 fix, or full plan build-out? Pilot-first (P0 + P2 UI) vs all?
2. SEO UI location: expand `SlugModal`, or dedicated editor side-panel? (multi-page favors panel)
3. Regenerate-on-go-live: full republish (new version) or in-place HTML swap? Version bloat vs audit trail.
4. Mirror SEO fields to `PublishedPage` columns, or keep purely in content JSON + query JSON? (sitemap/noindex want columns)
5. Structured-data default: infer type from audience automatically, or require user pick? Risk of wrong schema.org type if auto.
6. Sitemap for subdomain pages too, or custom-domain only? Index dilution vs discoverability.
7. Custom OG per subpage — needed for scalifix (single page?), or defer to multi-page customers (naayom)?
8. hreflang / bilingual OG for Lumen — in this track or defer to `i18nPlan.md`?
