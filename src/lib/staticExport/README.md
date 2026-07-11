# `staticExport/` — publish-time static HTML generation

This directory turns a project's stored content into the **immutable static HTML
document** that is uploaded to Vercel Blob and served for a published page. It is
the server side of the dual-renderer split: it drives
`LandingPagePublishedRenderer` (never the edit renderer). For the end-to-end
publish/versioning/KV story see **`docs/architecture/publishArch.md`**.

## `generateStaticHTML` (`htmlGenerator.ts`)

`generateStaticHTML(options)` builds one complete `<!DOCTYPE html>` document:

1. **Preload template** — if `usesTemplateModule(audienceType, templateId)`, calls
   `preloadTemplate(templateId)` so the synchronous published renderer can resolve
   blocks from the registry cache (the bundle firewall; see
   `generatedLanding/README.md`).
2. **Theme CSS variables** — `generateThemeVariables(theme)` derives
   `--bg-*`, `--accent-*`, `--gradient-*`, `--text-*` from `theme.colors`.
3. **Body** — `ReactDOMServer.renderToStaticMarkup(<LandingPagePublishedRenderer …/>)`
   passing `sections`, `content`, `theme`, and the tier ids
   (`audienceType/templateId/paletteId/variantId/mood`).
4. **Document assembly** (`buildHTMLDocument`) — wraps the body with head tags:
   title/description, canonical (`resolveCanonicalURL`), OG/Twitter
   (`resolveOgImage`), robots/favicon/JSON-LD, asset links, and the Lessgo badge.
5. **Asset URL resolution** — `validateAndResolveAssetURLs` (`assetResolver.ts`)
   post-processes the HTML.

Returns `{ html, metadata: { size, cssVariableCount } }`.

### What is inlined vs linked

- **Inlined into the HTML:** the per-page theme CSS variables (`<style>:root{…}</style>`)
  and a tiny smooth-scroll script (emitted by the published renderer).
- **Linked (not inlined), served from the CDN:**
  - `<link rel="stylesheet" href="/assets/published.css">` — the standalone
    published-page stylesheet.
  - `<link rel="stylesheet" href="https://lessgo.ai/assets/fonts-self-hosted.css">`
    — self-hosted font faces.
  - `<script src="https://lessgo.ai/assets/form.v1.js">` — only when the page has
    forms.
  - `<script src="…/a.v2.js" data-page-id data-slug>` — analytics beacon, only
    when analytics is opted in. **New publishes use `a.v2.js`** (adds `role` +
    `placement` to `cta_click`, and `v: 2` to every payload). Blobs published
    before scale-04 hardcode the frozen `a.v1.js`, which keeps its original
    (no-role/placement) semantics forever — see the versioning contract in
    `scripts/buildAssets.js`. A filename never changes semantics; bump the version.
  - `<script src="…/naayom.v1.js">` (TechPremium) / `lumen.v1.js` (Lumen) —
    template behavior bundles, gated by `templateId`.

  Asset origin is **always absolute `https://lessgo.ai`** for scripts/fonts:
  published HTML is served from prod subdomains AND custom domains where a relative
  `/assets/*` would 404. (`published.css` uses a root-relative `/assets/…` link.)

## Relationship to the build (`npm run build`)

Those linked assets do not exist until the build produces them. `npm run build`
runs, in order:

1. **`scripts/buildPublishedCSS.js`** → compiles `public/published.css`
   (the standalone bundle referenced as `/assets/published.css`).
2. **`scripts/buildAssets.js`** → minifies the source JS in *this directory*
   (`formHandler.js → form.v1.js`, `analyticsGenerator.js → a.v2.js`,
   `naayomBehaviors.js → naayom.v1.js`, `lumenBehaviors.js → lumen.v1.js`) into
   `public/assets/`, and copies `fonts-self-hosted.css` verbatim. It also emits the
   frozen `a.v1.js` from `scripts/legacy/a.v1.src.js` (pre-scale-04 beacon, kept
   for old blobs — never rebuilt from the live source).
3. `next build`.

So the runtime `.js` behavior sources live here as plain files (`formHandler.js`,
`analyticsGenerator.js`, `naayomBehaviors.js`, `lumenBehaviors.js`); editing them
requires a rebuild to take effect on published pages.

## Where the HTML goes (publish)

`renderPublishedExport.ts` is the single shared generation path (used by
`POST /api/publish` and `POST /api/domains/verify-dns`). It calls
`generateStaticHTML` for the root page and every subpage, then `uploadStaticSite`
(`blobUploader.ts`) uploads each to Vercel Blob at
`blobKey = pages/{pageId}/{version}/index.html` (one shared `version`, one blob per
page). The callers then advance the `PublishedPageVersion` pointer and write KV
routes atomically. This module deliberately does **not** do credit checks, KV
routing, version cleanup, or blob rollback — those stay in the callers. Full flow:
`docs/architecture/publishArch.md`.

## Files in this directory

| File | Purpose |
|---|---|
| `htmlGenerator.ts` | `generateStaticHTML` — builds the full static HTML document via the published renderer. |
| `renderPublishedExport.ts` | Shared render+upload path (root + subpages); advances the version pointer. |
| `blobUploader.ts` | `uploadStaticSite` — Vercel Blob upload (retry/backoff), returns version/blobKey/blobUrl. |
| `assetResolver.ts` | Validates and resolves/rewrites asset URLs in the generated HTML. |
| `buildPageMetadata.ts` | Resolves title/description/OG-image precedence for a page's head. |
| `buildPageMetadata.test.ts` | Tests for metadata resolution. |
| `canonicalUrl.ts` | Resolves canonical host+path (custom domain vs `{slug}.lessgo.site`). |
| `canonicalUrl.test.ts` | Tests for canonical URL resolution. |
| `headTags.ts` | Head-tag helpers: `escapeHTML`, robots meta, favicon link, JSON-LD script. |
| `headTags.test.ts` | Tests for head-tag helpers. |
| `structuredData.ts` | Builds/serializes JSON-LD structured data (root page). |
| `structuredData.test.ts` | Tests for structured-data builder. |
| `lessgoBadge.ts` | Renders the "Made with Lessgo" badge markup. |
| `lessgoBadge.test.ts` | Tests for the badge. |
| `injectChrome.ts` | Multi-page: injects shared header/footer chrome into a page (idempotent). |
| `versionCleanup.ts` | Prunes old `PublishedPageVersion` blobs. |
| `formHandler.js` | Runtime source → minified to `public/assets/form.v1.js` (published-page form submit). |
| `analyticsGenerator.js` | Runtime source → minified to `public/assets/a.v2.js` (live analytics beacon: role/placement + `v:2`). The frozen pre-scale-04 `a.v1.js` is built separately from `scripts/legacy/a.v1.src.js`. |
| `naayomBehaviors.js` | Runtime source → `naayom.v1.js` (TechPremium behaviors: nav/lightbox/gallery). |
| `lumenBehaviors.js` | Runtime source → `lumen.v1.js` (Lumen behaviors: lightbox/reveal/EN·NL toggle). |
