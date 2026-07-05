# Blog Feature — Understanding & High-Level Plan

> Track doc for the user-facing blog capability (any published site gets `{host}/blog` + articles). Product rationale/decision: `blogDirection.md` (verdict: build it, conditional on quality differentiation). This doc = architecture understanding + phased plan. Phase 1 = manual only, no AI.

## Goal

Any Lessgo site can run a blog: `{slug}.lessgo.site/blog` (index) + `/blog/{post-slug}` (articles). User adds/manages essays/articles — SEO or personal, doesn't matter. Phase 1 is pure functionality: write, publish, serve, indexed. AI generation is a later phase (the actual differentiator per `blogDirection.md`).

## Infra audit — what already exists (~80% of plumbing)

| Piece | Status | Where |
|---|---|---|
| Per-path routing | ✅ KV `route:{host}:{path}`, `extraRoutes` map in `atomicPublish` | `src/lib/routing/kvRoutes.ts` |
| Blob fast path for subpaths | ✅ middleware KV lookup → `/api/blob-proxy?rk=`, both lessgo-subdomain + custom-domain branches preserve path | `src/middleware.ts` |
| Arbitrary-HTML blob upload | ✅ `uploadStaticSite({pageId, html, version, pageName})` | `src/lib/staticExport/blobUploader.ts` |
| Per-page HTML gen | ✅ `generateStaticHTML({sections, content, theme, seo…})` — per-page inputs, not whole-project | `src/lib/staticExport/htmlGenerator.ts` |
| SSR fallback catch-all | ✅ `/p/[slug]/[...subpath]` | `src/app/p/[slug]/[...subpath]/page.tsx` |
| Per-host sitemap | ✅ `collectSitemapPaths(content)` — small extension to append blog paths | `src/lib/seo/buildSitemapXml.ts` |
| Subscribe CTA backend | ✅ `form.v1.js` + `/api/forms/submit` + ConvertKit | forms system |
| Ownership guard | ✅ `assertProjectOwner` (use on all new token routes — memory `project_authz_token_fix`) | `src/lib/` |

**Not related:** `src/app/blog/*` + `src/lib/mdx.ts` = lessgo.ai's own MDX marketing blog. Don't touch, don't reuse.

**Net-new build:** `BlogPost` table, writing UI, article/index block pairs, per-post publish flow, SSR fallback branch, sitemap extension.

## Key decision: separate `BlogPost` table, NOT subpages

Considered A) posts as `ProjectPage` rows / `content.subpages` (reuse multipage wholesale) vs B) dedicated table + independent per-post publish. **Chose B.**

Why not A: wrong lifecycle. Every post edit → full-site republish + new `PublishedPageVersion`; all article bodies frozen into `content.subpages` per version (JSON bloat, version churn); essays authored in the block canvas (bad writing UX); page switcher cluttered by N posts. Blogs are a living surface (drafts, regret-edits, URL permanence) — `blogDirection.md` risk #2.

Why B: posts get own draft→publish lifecycle, instant per-post publish (no site republish), real writing editor, unbounded post count without touching site version history.

## Architecture

### Schema

```prisma
model BlogPost {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  slug        String   // immutable after first publish (URL permanence)
  title       String
  excerpt     String?
  heroImage   String?
  body        Json     // Phase 1: { format: 'markdown', markdown: string } — structured later if AI needs
  seo         Json?    // title/description/og overrides
  status      String   @default("draft") // draft | published
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([projectId, slug])
  @@index([projectId, status])
}
```

`npx prisma migrate dev` (never `db push`).

### Rendering — through the published renderer, not bespoke HTML

**AS BUILT:** two SHARED server-safe block components (`src/modules/templates/shared/blog/BlogPostBodyBlock.tsx` + `BlogIndexBlock.tsx`), registered **per template** — there is NO template-agnostic resolveBlock fallback (each of the 6 templates hardcodes its own map; catalog/product-detail were techpremium-only, not a cross-template precedent). Registration per template = resolveBlock map entries (`blogpostbody`/`blogindex`, edit+published → same component) + sectionRules surface entries + one `--blog-*` token-var line (`--blog-ink/-2/-line/-accent/-accent-on` — needed because var semantics differ per template: meridian's `--ink` is its dark BACKGROUND, text is `--bone`). All 6 registered; `blogRegistration.test.ts` pins the casing contract.

1. **`BlogPostBodyBlock`** — title/date/hero + `react-markdown` body (raw HTML escaped inert, `javascript:` stripped — pinned by `src/lib/blog/__tests__/markdown.test.tsx`) + **baked-in subscribe CTA** (vanilla `data-lessgo-form` + `form.v1.js`; synthetic `blog-subscribe` formId, submissions land in dashboard/forms).
2. **`BlogIndexBlock`** — post cards, relative `/blog/{slug}` hrefs (one blob serves all hosts).

Blog pages never enter the edit canvas → no dual-renderer pair needed; one component serves both modes. `buildBlogPages.ts` is the single page-def source for BOTH the static export and the SSR fallback (parity by construction). Chrome via extracted `src/lib/staticExport/injectChrome.ts`. Legacy product projects (no template module) are hard-gated (422 + no button).

### Per-post publish flow (no site republish)

Precondition: site published at least once (`PublishedPage` supplies host/domains/version/theme context).

1. Render article HTML → `uploadStaticSite({pageName: 'blog/{slug}'})`.
2. KV write `route:{host}:/blog/{slug}` → blobUrl, for all site domains (subdomain + custom).
3. Regenerate + rewrite `/blog` index blob + its KV route.
4. Unpublish = delete post's KV keys + regen index. Site full-republish also re-emits all published-post routes (so domain changes propagate).

### Serving

- **Fast path:** KV → blob-proxy (already works, zero middleware change).
- **SSR fallback:** extend `/p/[slug]/[...subpath]` — path starts `/blog/` → query `BlogPost` (live DB, not frozen content) → render via published renderer. `/blog` → index from DB.
- **Reserved path guard:** block `/blog` + `/blog/*` in `ProjectPage.pathSlug` validation (collision with multipage).

### SEO surface

- Sitemap: extend `collectSitemapPaths` — append `/blog` + published post paths (host→page→projectId→posts).
- Per-post meta/OG from `seo` Json; canonical on primary host.
- Phase 2: BlogPosting JSON-LD, per-post OG image (`/api/og?path=`), RSS per host.

### Editor UI

Dashboard "Blog" tab per project (NOT the block canvas):
- Post list: title, status, publishedAt, actions (edit/publish/unpublish/delete).
- Post editor page: title, slug (auto from title, locked after publish), excerpt, hero (existing `upload-image`), SEO fields, **markdown textarea + live preview** (Phase 1; rich-text later).
- API: `/api/blog/posts` CRUD + `/api/blog/publish` — all behind `assertProjectOwner`.

## Phases

### Phase 1 — vertical slice, manual only ⭐
Schema + CRUD API + minimal editor (markdown + preview) + 2 block pairs + per-post publish/unpublish + `/blog` index + sitemap inclusion + SSR fallback + reserved-path guard.

**Decision gate:** publish an essay on a pilot site → live at `{host}/blog/{slug}` **served from blob fast path**, in sitemap, index lists it, unpublish works, existing single/multi-page publish unaffected. Build/tsc/tests green before push (no CI gate — memory).

### Phase 2 — SEO polish + living-surface UX — STATUS: ✅ BUILT (2026-07-03, branch `feat/blog-phase1`)
- **OG fix**: `/api/og/{slug}?path=/blog*` no longer 404s (was a live bug — metadata already emitted those URLs); index + post cards, root palette/logo, unit-tested.
- **BlogPosting JSON-LD** on article pages, blob + SSR identical (`src/lib/blog/jsonLd.ts`); existing blobs pick it up on next republish/site publish (no backfill). Index pages: none.
- **RSS** at `{host}/rss.xml` (middleware seoRewrite → `/api/seo/rss`; pure `buildRssXml`; excerpt-only items, noIndex filtered, 404 at zero posts).
- **Draft preview**: `dashboard/blog/[slug]/[postId]/preview` (Clerk owner-gated, any status, draft banner, analytics off) + "Preview saved draft" anchor in the editor.
- **Native subscriber emails (replaces ConvertKit — user decision)**: `BlogSubscriber` table; blog-subscribe submissions upsert it; FIRST publish of a post emails all subscribed readers via Resend (env: `RESEND_API_KEY`, `BLOG_NOTIFICATION_FROM` — ⚠️ verify a real Resend domain before pilot, default onboarding@resend.dev is test-grade); tokened public `/api/blog/unsubscribe`; dashboard shows subscriber count. Republish is silent.
- Deferred within P2: subscriber list UI/export, double opt-in, batch sending, RSS full-body items.

### Tiptap rich-text — STATUS: ✅ BUILT (2026-07-03, branch `feat/blog-phase1`)
Markdown stays canonical (`BlogPost.body` unchanged; publish/SSR/XSS contract untouched). `BlogRichTextEditor` (Tiptap v3.27 + `tiptap-markdown@0.9` + `@tiptap/extension-image` — v3 StarterKit bundles Link but NOT Image, images silently drop without it) serializes to markdown on every change; toolbar: H2/H3, bold/italic/code, lists, quote, code block, https-only links, inline image upload, hr, undo/redo. Raw-Markdown escape-hatch toggle kept (note: rich editor normalizes stored markdown cosmetically — same rendering, expected). Round-trip contract pinned in `tiptapRoundTrip.test.ts` (spike-gated per PO). Bundle confined to the post-editor route.

### Phase 3 — AI generation (separate decision later)
Generation off business-context object (the moat per `blogDirection.md`) · free-tier caps (content-farm abuse vector) · credit pricing · maybe scheduling. Not scoped here.

## Resolved decisions (2026-07-03, folded from inline answers + PO review)

1. Body: markdown textarea + live preview P1; **Tiptap in a later phase**.
2. resolveBlock: NO template-agnostic fallback (user-verified, confirmed in code) — shared components + per-template registration; all 6 templates done. Doc wording fixed above.
3. Per-post instant publish, no site republish (site must publish once first — 409 otherwise).
4. Slug immutable after first publish (`firstPublishedAt` kept on unpublish → stays locked).
5. No free-tier cap P1.
6. `/blog` auto-enables on first published post, auto-disables at zero; editor `/blog` button in `PageSwitcher` — **hidden until the site is published** (user decision 2026-07-03; blog-after-publish is the P1 constraint). P2 backlog: pre-publish drafting via tokenId-keyed blog screens.
7. Pilot: **vishwas dubey — has his OWN custom domain** → custom-domain gate checks mandatory. (Verified: middleware Branch-B KV fast path is already path-aware; its "subpaths fall through" comment was stale, now fixed.)
8. `{slug}.lessgo.site` already the default publish host (`PUBLISH_SUFFIXES`); blog routes written for all live hosts incl. custom domain.

PO guardrails (POreview.md) all adopted: injectChrome extracted as byte-identical pre-commit; `syncBlogAfterSitePublish` detached (un-awaited, self-contained errors) at publish/verify-dns/domains-remove; migration ran clean against dev (no drift); all-6-template registration kept.

## Phase 1 — STATUS: ✅ BUILT (branch `feat/blog-phase1`, 2026-07-03)

Schema+migration · CRUD API · shared blocks + 6-template registration · per-post publish/unpublish pipeline (blog-* blob versions invisible to versionCleanup, per-host KV routes, upload→KV→DB→stale-cleanup w/ rollback) · SSR fallback pages · sitemap blog paths · reserved-/blog guard (client+server) · dashboard blog manager + markdown editor · editor /blog button. Vitest 480 green (36 new blog tests incl. XSS regression + registration casing + pipeline ordering/rollback). **Pending: manual decision gate (docs/tracks/blogFeature.md gate + custom-domain checks) → merge to main → vishwas pilot.** 
