# Multi-Page Website Support — Plan

> On approval, save this as `multiPagePlan.md` in the repo root (track doc for the multi-page capability, driven by the naayom customer — see `naayomMigration.md`). PO verdict: **Phase 1 approved** (`POreview.md`); corrections folded below.

## Context

Lessgo generates **one** landing page per project. Our first customer, **naayom** (hardware/IoT, → TechPremium template), runs a ~12-page marketing site: home + product catalog + N product-detail pages + gallery + contact. To onboard them a project must hold, edit, publish, and route **multiple pages**.

Deep exploration (PO-verified) shows the plumbing is **more ready than expected** — the `/p/[slug]/privacy` subpage already proved the route→blob→KV→DB path, middleware already preserves subpaths on the SSR fallback, and blob/KV key schemes are path-aware. **The real cost is the editor store** (flat, single-page, large mutation surface) and **porting the designer's blocks**. Sequence: a thin vertical slice first (de-risk store axis + publish/serve), then chrome/linking, then the collection system, then the blocks.

## Confirmed decisions

| Decision | Choice |
|---|---|
| v1 scope | Manual, template-driven. No AI gen day 1; scraper later |
| Page source | **Template-authored archetypes** — user adds a ready-built page, edits content inline |
| Site chrome | **Shared** header/footer (+ WhatsApp FAB), edited once |
| Storage | **`ProjectPage`** table, **uniform model** (home is a row too); **no batch migration** — naayom is the first real project, prod is a clean slate (memory `project_prod_data_wipe`) |
| Repeated pages | **Repeatable collection** — one Product-Detail archetype + N entries; catalog auto-lists |
| First template | **TechPremium only** |
| Phase-1 page | **Throwaway archetype from existing blocks** — pure plumbing de-risk, zero new-block work; real designed pages drop in later with no plumbing rework |

## Designer package — DELIVERED (`Lessgo.zip` → `design_handoff_naayom/`)

High-fidelity, token-based HTML/CSS/JS references to **port** (not ship verbatim) into edit+published components. Honors both hard constraints: **tokens-only** and **no JS framework on the published page** (all interactivity is CSS or the single dep-free `naayom.js`, which no-ops when its markup is absent).

- **`Naayom - Block Specs.html`** ⭐ — the element-schema / content contract (per block: field · type · required? · collection min–max · surfaces · interactions · responsive · empty/hover/loading/error) + Page→block order map + JS budget. **Engineering codes against this.**
- 5 page archetypes: **Home, Catalog, Product Detail, Gallery, Contact**.
- `naayom.css` (tokens, `data-surface` bands, `<em>` accent, shared chrome/components) · `naayom.blocks.css` (section blocks) · `naayom.js` (nav dropdown/mobile menu, product gallery, shared lightbox, gallery filter, lead-form success, live-readout tick — all reduced-motion-safe).
- Tokens match TechPremium's existing `tokens.ts` (OKLCH forest/lime/paper, Inter Tight/Inter/JetBrains Mono). Surfaces: `paper | paper-2 | forest | forest-d`. Breakpoints 980/760/520.
- **Product entry record** (define once; Catalog lists it, Detail renders it full): `model, name, category, oneLiner, lede, images[], cardSpec, badges[], features[], specs[], related[]`.
- Server-dependent items flagged: **lead-form submission** (use existing forms system) — everything else is client-only.

## Architecture seams (PO-verified)

- **Privacy precedent:** `src/app/p/[slug]/privacy/page.tsx` reads a slice of frozen `content` JSON. Catch-all subpages model on this.
- **Middleware:** `src/middleware.ts` L78/L97 rewrite `/contact` → `/p/{slug}/contact` — but **only on the SSR fallback**; the fast **blob-proxy path is root-only today** ("subpaths fall through"). Subpage KV writes must light up the fast path. KV reads are already path-aware (`getRouteEdge(host, path)`).
- **KV:** `route:{domain}:{path}`; only `:/` written today (`atomicPublish` L142, retry L204 — both hardcode `:/`).
- **Blob:** `pages/{pageId}/{version}/index.html`; `uploadStaticSite` has **no `pageName` param** (key hardcoded). One `PublishedPageVersion` covers a whole publish.
- **Publish route has NO loop today** — a single `generateStaticHTML` (L222) + single `uploadStaticSite` (L241). The loop is **net-new, to be built.**
- **Store seam (bigger than first scoped):** ~**213** `state.sections|content|sectionLayouts` references across the 5 action files (sectionCRUD 52, layout 57, content 51, core 37, persistence 16) — not all writes, but an order of magnitude beyond a "~15 edits" job. The **mirror strategy** (top-level fields mirror the active page) is what avoids touching all 213 — but mirror-sync is the shallow-merge/**stale-state trap** flagged in `PO-Handover.md`. Make the mirror invariant a **tested contract**, not a footnote.
- **Renderer is path-agnostic:** `LandingPagePublishedRenderer` takes `sections[]` + `content` — render any page by feeding its slice.

---

## Phase 1 — Vertical slice (THE FOCUS) ⭐ — PO-approved

**Goal:** a user adds **one extra page from existing TechPremium blocks**, edits it, publishes, and views it live at `/p/{slug}/{path}` — **served from blob (fast path), not silently SSR'd**. Proves the store page-axis + publish-loop + subpath routing end-to-end. **No new blocks, no collections, no shared chrome yet.**

**Schema** (`prisma/schema.prisma`, then `npx prisma migrate dev`):
- New table **`ProjectPage`** (uniform): `id, projectId (FK), archetypeKey, pathSlug, title, order, content Json (sections+sectionLayouts+content), createdAt, updatedAt`. Home is a row (`archetypeKey:'home', pathSlug:'/'`). On first multi-page load, **lazy-seed** the home row from `Project.content.finalContent` if none exist. No batch migration.
- Add `PublishedPageVersion.metadata Json?` → `{ blobs: [{path, blobKey, blobUrl, sizeBytes}] }`.

**Store page-axis** (`src/stores/editStore.ts`, `src/types/store/*`):
- Add `pages: Record<pageId, {sections, sectionLayouts, content}>` + `currentPageId` (defaults to home).
- **Mirror strategy** (the crux): top-level `sections/content/sectionLayouts` always mirror `pages[currentPageId]`, so the ~213 existing references keep working untouched. Centralize the read via new `src/hooks/useCurrentPageSlice.ts` (point `LandingPageRenderer.tsx:98-112` at it) and the write via a single `getActivePageDraft(state)` helper used by the action files.
- **Tested invariant:** after any mutation or page switch, `pages[currentPageId]` deep-equals the mirrored top-level slice. Unit + integration test this — it's the stale-state guard.

**Persistence:**
- `persistenceActions.ts` `export()` / `loadFromDraft()` round-trip `pages`.
- `api/loadDraft` returns `ProjectPage` rows (lazy-seeding home); `api/saveDraft` upserts every page as a row.
- New `api/pages` route: create(archetypeKey)/rename/delete/list.

**Editor UI:**
- Minimal page switcher in `GlobalAppHeader` (`Home | +Add page`); manage/delete via `GlobalModals`.
- Phase-1 add-page archetype = fixed list of **existing** blocks (hero + capabilities + cta + footer) — throwaway test page.

**Publish + serve** (the payoff — note these are net-new, not edits):
- `api/publish/route.ts` — **build a loop** over rows: `generateStaticHTML` per page → `uploadStaticSite({pageName})` → collect blob metadata → **one** `PublishedPageVersion` (`metadata.blobs[]`). Freeze pages into `PublishedPage.content.subpages[pathSlug]`.
- `blobUploader.ts` — add `pageName` → `pages/{pageId}/{version}/{pageName}.html` (`index` for root).
- `kvRoutes.ts` `atomicPublish`/`atomicPublishWithRetry` — accept `blobUrls: Record<path,url>`, write `route:{domain}:{path}` per page (replaces hardcoded `:/`). **This is what lights up the blob fast path for subpages.**
- NEW `src/app/p/[slug]/[...subpath]/page.tsx` — SSR **fallback** that resolves `content.subpages[path]` and renders via `LandingPagePublishedRenderer` (model on `[slug]/page.tsx`).
- `versionCleanup.ts` — delete **all** `metadata.blobs[].blobKey` (not just `index.html`).
- Middleware: no code change, but **verify the fast path actually serves subpages from blob**.

**Decision gate (must pass before collections/blocks):**
1. add → edit → save → **reload** (persists) → publish → live.
2. `/p/{slug}/{path}` and `{slug}.lessgo.ai/{path}` both load.
3. **Subpage is served from blob (fast path)** — check response is blob-proxy (ETag/`s-maxage` cache headers), **not** a silent SSR hit. KV has both `route:{domain}:/` and `route:{domain}:/{path}`.
4. Mirror invariant test green; existing single-page edit/publish unaffected.

---

## Later phases (detail after Phase 1 gate)

- **Phase 2 — Shared chrome + cross-page linking.** Hoist header/footer (+ WhatsApp FAB) to a site-level `sharedChrome` slot rendered once per page; port the designer's dropdown nav + mobile menu. Add an "internal page" link mode to `LinkTargetPopover`, `ButtonConfigurationModal`, `resolveCtaHref`.
- **Phase 3 — Collection system.** Extend `ProjectPage` with `kind ('singleton'|'collectionItem')` + `collectionKey`; the **Product entry record** as rows; auto-listing catalog block; `/products` + `/products/{slug}` routing; "manage entries" UI; empty-state handling per Block Specs.
- **Phase 4 — Port TechPremium archetype blocks (designer package).** Recreate each section from `design_handoff_naayom/` as dual-render block pairs against `Naayom - Block Specs.html`: hero+live-readout, trust strip, problem, how-it-works, explainer rows, capabilities, collection-list/product cards, product-detail (gallery+specs+related), results, gallery grid+lightbox, compatibility, FAQ, contact form, contact-sales band. Reuse `naayom.css`/`naayom.blocks.css` tokens; reimplement `naayom.js` behaviors published-safe; lead form → existing forms system; icons → lucide; preserve `data-surface` + `<em>` theming.
- **Phase 5 — naayom go-live.** Load real content + the ~36 photos, wire custom domain, publish.

## Verification (Phase 1)

1. `npm run dev`; create/open project; add page; edit block; save; **reload** → persists.
2. Existing single-page project still loads/edits/publishes (back-compat / mirror invariant).
3. Publish; hit `/p/{slug}/` and `/p/{slug}/{path}` on subdomain (+ custom domain if available).
4. **Confirm blob fast-path serving** of the subpage (blob-proxy headers, not SSR); inspect KV for `route:{domain}:/{path}`.
5. Republish 11× → `versionCleanup` removes **all** old blobs (no orphans).
6. `npm run test:run` — dispatch/contract/palette/section regressions green; add tests for `useCurrentPageSlice`, the mirror invariant, page-scoped mutation, and the publish multi-blob loop.

## Open questions (minor; defaults assumed)

1. Per-page SEO meta (title/desc/OG/path-slug) — Phase 1 or Phase 2? (assumed: Phase 2)
2. Page path slug — auto-derive from title, user-editable? (assumed: yes)
