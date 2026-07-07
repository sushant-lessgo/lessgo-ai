# Performance Report: /edit/[token] + /preview/[token]

2026-07-06. Findings only — no plan, no code. Four scouts: edit load path, preview path, editor runtime, server/API.

## TLDR

Both pages are slow for the same structural reasons: (1) fully client-rendered routes with a 3-hop serial waterfall on load (bundle hydrate → loadDraft fetch → template chunk import), (2) an unpooled Neon DB connection taxing every API round trip, (3) a 1s auto-save poller doing ~5 sequential DB queries + full-JSON rewrite per save, and (4) runtime jank from 71 no-selector Zustand subscriptions re-rendering the whole tree on every store write. Preview additionally boots the heavy *edit* renderer in a cold new tab just to look at a page.

---

## A. Initial load — /edit/[token] (the "slow to open" complaint)

1. **Zero SSR.** `src/app/edit/[token]/page.tsx:1` is `'use client'`; no `loading.tsx`/server layout. First paint = Clerk shell + spinner (`EditProvider.tsx:54`) until full bundle downloads/parses/hydrates. **HIGH**
2. **Client fetch waterfall.** Draft fetched in `useEffect` only after store init (`src/components/EditProvider.tsx:129-138`) — bundle → hydrate → init → *then* `GET /api/loadDraft`. No server prefetch, no preload hint. **HIGH**
3. **Template chunk chained AFTER draft fetch.** `templateId` known only once `loadFromDraft` runs; `EditLayout.tsx:50-54` → `useTemplateReady.ts:44` starts the dynamic `import()` only then; blocks render `null` until loaded (`componentRegistry.ts:58`). Two async hops that could be parallel are serial. Lever: server passes `templateId` up front → template chunk downloads in parallel with draft. **HIGH**
4. **No `next/dynamic` anywhere in the edit tree.** `EditLayout.tsx:7-17`, `MainContent.tsx:8-18` statically import every modal/toolbar/form-builder (+ framer-motion, lucide, @dnd-kit deps) into the initial chunk though most aren't needed for first paint. **MED**
5. **posthog-js + Clerk eagerly in root layout** (`src/app/layout.tsx:4,82-97`) — on the critical bundle of every route. **MED**
6. Debug `console.log(JSON.stringify(theme...))` on every draft load (`persistenceActions.ts:145-154`) + blob-URL migration loop over all elements (`:106-120`). **LOW**

**Not problems:** template dispatch firewall respected (no static template imports leak into edit tree); fonts/CSS not a bottleneck (per-template injection, published.css not loaded in editor).

## B. /preview/[token]

1. **Uses the EDIT renderer, fully client-side.** `preview/[token]/page.tsx:1` is `'use client'`, mounts `LandingPageRenderer` (`:7`, `:428`) — pays contentEditable/hook-heavy edit blocks + full background recompute (`LandingPageRenderer.tsx:151,245`) + SectionTracker/FormPlacementRenderer per section, for a read-only view. The lighter published renderer (what users actually ship) is unused here. **HIGH**
2. **Repeats the entire edit-load waterfall.** Same `EditProvider` mount→fetch→hydrate path; no state reuse from the editor tab; plus `/api/projects/{token}/published-slug` (`page.tsx:132`) and review-state init it never needs (`EditProvider.tsx:179`). **HIGH**
3. **Edit→preview is a cold hard load.** `usePreviewNavigation.ts:41` `window.open` new tab — full JS boot + refetch. And `:31` `await triggerAutoSave()` blocks the tab from even opening until a save round-trip completes (save = ~5 DB queries, see D). So "click Preview" = save RTT + cold boot + loadDraft. **HIGH**
4. **SlugModal / CustomDomainModal / posthog statically imported** (`page.tsx:9-11`) into preview's initial bundle; only needed on Publish click. **MED**

**Not problems:** publish-click path (innerHTML read + deep clones, `page.tsx:280-387`) is heavy but gated behind the button; tabManager 5s/10s intervals are cheap.

## C. Editor runtime (typing/click jank)

1. **71 no-selector store subscriptions across 59 files.** `useEditStoreLegacy.ts:30` returns whole state; `LandingPageRenderer.tsx:98`, all toolbars, `SelectionSystem` (4×), `ElementDetector` (3×), template edit primitives + headers/footers all subscribe to everything. Any write (incl. `isDirty`/`lastUpdated` churn) re-renders all 59. Dominant jank amplifier. **HIGH**
2. **One edit re-renders every section.** `orderedSections` memo deps on entire `content` (`LandingPageRenderer.tsx:210-295`); re-runs `assignEnhancedBackgroundsToAllSections` for ALL sections per edit; props spread with fresh identity (`:457,:494,:530`); **zero `React.memo` in any template block.** **HIGH**
3. **Auto-save churn.** `useAutoSave.ts:180-188` 1s `setInterval`; hook itself full-store subscribes (`:135`) and is mounted in EditLayout → EditLayout re-renders on every mutation; each save runs `state.export()` + main-thread `JSON.stringify` of full tree (`persistenceActions.ts:25,:38,:353-383`). **HIGH**
4. **ElementDetector MutationObserver feedback loop + listener leak.** Per-section observer on `class` attrs (`ElementDetector.tsx:113-137`); SelectionSystem toggles classes on every element per selection (`SelectionSystem.tsx:17-98`) → observers fire → `addElementHints` re-runs `getBoundingClientRect` per element and re-attaches mouseenter/leave listeners **without ever removing them** (`:32-93`) — layout thrash + leak grows all session. **HIGH**
5. History snapshots = full deep clone (`JSON.parse(JSON.stringify)`) every 5 changes (`useAutoSave.ts:191-210`, `persistenceActions.ts:8`). **MED**
6. `logger.debug` arg objects built every render even when no-op (`LandingPageRenderer.tsx:202-208,290`). **LOW**

**Not problems:** InlineTextEditorV2 is uncontrolled — store write only on blur/Enter, so keystrokes themselves are cheap (felt lag comes from 1–4); no unthrottled mousemove listeners; badge repositioning rAF-guarded.

## D. Server/API

1. **Unpooled Neon endpoint.** `.env:10` uses direct host; `-pooler` URL commented at `.env:14`; plain Prisma TCP (no serverless adapter); `src/lib/prisma.ts:8-11` caches singleton only in non-prod → prod cold lambdas re-handshake each time, + Neon autosuspend. Taxes EVERY call below. Likely single biggest "both pages slow" cause. **HIGH**
2. **saveDraft = ~5 sequential DB round trips + full-row rewrite.** `auth()` → `assertProjectOwner` (2 queries, `security.ts:71-82`) → `token.upsert` → `project.findUnique` (read whole content to merge) → `project.upsert` (write whole content) (`saveDraft/route.ts:51-163`). No diffing; unbounded payload (`validation.ts:33`). Fired every 1s while dirty (`useAutoSave.ts:177-188`). **HIGH**
3. **loadDraft = 2 sequential queries** (project → user) that could run concurrently (`loadDraft/route.ts:48-86`); correctly excludes `computedDesign` (good). **MED**
4. **Double Clerk auth on loadDraft** — protected in middleware AND `auth()` in route (`middleware.ts:154-155`); saveDraft is single. **LOW/MED**
5. Startup fan-out small (loadDraft + published-slug, possibly duplicated on preview via PageSwitcher). **LOW**

**Not problems:** middleware skips KV/blob work on app-host /edit + /preview; `force-dynamic`/`no-store` correct for authed data.

---

## Priority (impact × effort)

1. **Switch to Neon pooled URL** (`.env:14`, already there, commented) — one-line, speeds every request. Verify prod Vercel env too.
2. **Debounce auto-save (save-on-idle) + collapse saveDraft to 1–2 queries** (drop pre-read merge, parallelize auth/owner) — kills the 1s × 5-query × full-JSON storm.
3. **Break the load waterfall**: server-provide `templateId` (or whole draft) so template chunk + draft fetch parallelize; ideally SSR/prefetch draft.
4. **Selectors + React.memo**: fix `useEditStoreLegacy` no-selector pattern in the hot components (renderer, toolbars, selection) + memo blocks — biggest runtime-jank win.
5. **Preview: use published renderer (or SSR) + stop `await triggerAutoSave()` before `window.open`** — make "click Preview" feel instant.
6. **Fix ElementDetector observer loop + listener leak.**
7. Lazy-load (next/dynamic) modals/toolbars on edit + publish modals on preview.
8. Cleanups: dead debug logs on load path, dedupe published-slug fetch.
