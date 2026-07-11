# editor-phase-3-shell-primitives — plan

**Branch:** `feature/editor-phase-3-shell-primitives`
**Spec:** `docs/task/editor-phase-3-shell-primitives.spec.md` · **Track:** `docs/tracks/editorPlan.md`

## Overview

Replace the half-migrated toolbar machinery with ONE floating-ui shell driven purely by
schema selection (`{sectionId, elementKey}` already in the store), migrate the 4 toolbars into
per-type action sets with narrow selectors, then delete the anchor/lock/watchdog/positioning
legacy (net-negative LOC). On the cleaned shell, formalize the edit-primitive interface and
build the first two primitives: `logo` (techpremium proving — naayom's template, reusing the
existing site-scoped `globalSettings.logoUrl` with back-compat read-through) and
`imageCollection` + the alt-text law (vestria catalogue grid proving, delivered by UPGRADING
the existing injected `E.List`/`E.Img` primitives so the single-source `.core.tsx` keeps
exactly one editor and dual-renderer divergence stays structurally impossible).

## Progress log

- phase 1 floating-ui shell + priority slim-down: done (commit 1a9a187e, review loops 2 — remount defect fixed, ship)
- phase 2 action sets + selector-ize: done (commit c1a7c80a, review loops 1 — clean, ship; 6 bare subs not 7 per phase-1 drift)
- phase 3 DELETE list + parity sign-off: done (commit b65a0d48, review loops 1 — clean, ship, net -2336 LOC src/); HUMAN GATE PASSED 2026-07-11 (founder: parity holds, proceed)
- phase 4 primitive interface: done (commit pending-sha, review loops 1 — clean, ship; primitiveTypes {PrimitiveKind×8, PrimitiveSlot, ImageCollectionItem, LogoValue{url,darkUrl,wordmark}, Surface}, elementMetadata.alt additive, resolveAlt + 7 tests)
- phase 5 logo primitive (techpremium proving): done (commit pending-sha, review loops 2 — subpage globalSettings gap fixed, ship). MECHANISM A: globalSettings.logoUrlDark; resolveLogo surface-aware + 8 tests; EditableLogo 2 slots; techpremium Nav(light)+Footer(dark) both renderers; renderPublishedExport threads globalSettings to subpages (naayom multipage). ⚠ FOUNDER MANUAL LOGO QA still pending (live: change logo→header+footer, dark-bg logo, remove→wordmark, legacy-only unchanged, publish parity) — do before merge.
- phase 6 imageCollection primitive + alt law (vestria proving): done (commit pending-sha, review loops 1 — clean, ship). EditableImageCollection shared chrome (bulk-upload + @dnd-kit reorder + remove + caption); E.List delegates (single writer on items); setItemAlt → elementMetadata[coll].alt[itemId] + 5 tests; edit+published E.Img resolve alt identically via resolveAlt; boundary/single-writer/idle greps clean. editorPlan phase-3 row marked BUILT. ⚠ FOUNDER MANUAL QA pending (bulk-add/reorder/remove/alt-persist/publish-order + min-max).

## Spec unresolved questions — answered

1. **imageCollection proving block = vestria catalogue grid** (`VestriaCatalogueGrid.core.tsx`).
   Single-source core + injected `E.*` primitives → parity structurally guaranteed; LOW risk.
   techpremium Gallery hand-rolls two `<img>` renderers (MEDIUM-HIGH risk) — skip; it migrates
   with template-factory. **Delivery = upgrade the existing `E.List`/`E.Img` contract, NOT a
   parallel editor** (the core already edits `items` via `E.List`; two writers would conflict —
   see phase 6).
2. **`toolbar.position`/`showToolbar` store fields: KEEP, stub-vestigial.** Writers span
   `useEditor.ts` (×6 call sites), `InlineTextEditorV2.tsx`, `useImageToolbar.ts`,
   `MainContent.tsx` — wide blast radius = phase-4 (store finish) territory. This phase makes
   the shell position itself so `toolbar.position` is simply unread; phase 4 strips it.
3. **AdvancedActionsMenu: DELETE.** Zero JSX consumers; only a type-only import in
   `useAdvancedActionsMenu.ts`. Delete component; delete or inline the hook per its own
   consumer check (phase 3 step).
4. **StockPhotosPanel: stays a `createPortal` inside the image action set.** Minimal-change
   bias; a shell "panel slot" is new surface with no second consumer yet. Revisit if §5 link
   popover wants a shared panel slot.

(Logo persistence slot — resolved at plan time, no longer open: reuse `globalSettings.logoUrl`,
no new field. See phase 5 design.)

---

## Phase 1 — floating-ui dep + toolbar shell + priority slim-down

Build the ONE shell that owns positioning/arrow/dismissal/**visibility** and re-mount the
existing 4 toolbar components inside it (props unchanged where possible — re-shell, not
rewrite). Selection → anchor resolution: on `activeToolbar`/`toolbarTarget` change, resolve
the anchor node fresh via `document.querySelector('[data-section-id="…"]')` /
`[data-element-key="…"]` (one lookup per selection change, NOT per render). floating-ui
middleware: `offset` + `flip` + `shift` + `arrow`; `autoUpdate` attached ONLY while a toolbar
is open, torn down on close. Dismissal: outside-click + Esc → clear selection via existing
store actions. No locks, no debounces — if flicker appears, fix the causing state transition.

**Single-visibility-authority law (this phase):** the shell's ONE `useSelectionPriority()`
instance decides which toolbar renders. Toolbars become dumb STATIC children of the shell's
floating container: they do NOT re-resolve `isVisible`, do NOT self-position
(`position:fixed`/absolute dropped), and stop consuming the `position` prop — only the shell
positions. This avoids the two-sources-fight/double-positioning failure mode.

Steps:

1. Add `@floating-ui/react` to deps.
2. NEW `ToolbarShell.tsx`: single `useSelectionPriority()` instance; renders the active
   toolbar component (temporary direct map type→component; config extraction is phase 2);
   floating-ui positioning + shell-owned arrow; dismissal handling.
3. Slim `useSelectionPriority.ts`: remove `useGlobalAnchor` + `useTransitionLock` wiring;
   keep the `useShallow` store selector + pure resolver output (`activeToolbar`,
   `toolbarTarget`, `editorSelection`, `hasActiveToolbar`). The `useToolbarVisibility` export
   goes dead this phase (all callers removed in step 6) — the export itself is deleted in
   phase 3's sweep.
4. Strip TTL caches (`toolbarCache` L40, `showCache` L119, `CACHE_TTL`) from
   `selectionPriority.ts`; keep pure fns + `ToolbarType` (7 importers depend on it).
5. Rewire `FloatingToolbars.tsx` to mount `ToolbarShell` (drop its own `useSelectionPriority`
   call, the `toolbar.position || {x:0,y:0}` read, and the vestigial `contextActions` icon
   placeholders). Store field itself untouched (Q2).
6. De-authority the 4 toolbars (the B-fix — each spins its OWN `useSelectionPriority`
   instance today via `useToolbarVisibility`):
   - **Remove `useToolbarVisibility` imports + calls**: `SectionToolbar.tsx:5,31`,
     `ElementToolbar.tsx:7,22`, `TextToolbarMVP.tsx:7,76` (TextToolbarMVP also destructures
     position data from it — replace with shell-supplied anchor/props). Toolbars must NOT
     gate their own render; the shell already decided.
   - **ImageToolbar**: its SHOW path is `useImageToolbar` (a store WRITE trigger —
     `showImageToolbar`/`showToolbar` — not a visibility reader); that write path stays. The
     READ side re-routes through the shell: the shell renders `ImageToolbar` when the
     resolver says `activeToolbar === 'image'`; `ImageToolbar.tsx` itself must not read any
     store visibility state to decide rendering. Net: no 4th surviving visibility source.
   - Stop consuming the `position` prop for self-positioning; drop own
     `position:fixed`/absolute wrappers; remove own arrow rendering (their
     `toolbarPositioning.ts` imports: `SectionToolbar.tsx:6`, `ImageToolbar.tsx:6`,
     `ElementToolbar.tsx:8` — this unblocks the phase-3 delete). Internals otherwise
     untouched.

**Files touched:**

- `package.json`, `package-lock.json` (add `@floating-ui/react`)
- NEW `src/app/edit/[token]/components/toolbars/ToolbarShell.tsx`
- `src/hooks/useSelectionPriority.ts`
- `src/utils/selectionPriority.ts`
- `src/app/edit/[token]/components/ui/FloatingToolbars.tsx`
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx`
- `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx`

**Verification:** `tsc` + `npm run test:run` green. Manual dev pass: select section/element/
text/image → toolbar anchors to the element, flips/shifts at viewport top/bottom + narrow
window, arrow points at anchor, Esc/outside-click dismiss, NO `{x:0,y:0}` corner render.
Greps: (a) `useToolbarVisibility` = zero hits under
`src/app/edit/[token]/components/toolbars/**`; (b) among COMPONENT files (`.tsx` under
`toolbars/**` + the shell) `useSelectionPriority(` is called from exactly ONE —
`ToolbarShell.tsx` (single-hook-instance law). NOTE: `useSelectionPriority.ts` itself still
has internal module-level callers until phase 3 sweeps them (the dead `useToolbarVisibility`
export at :192 AND the dead `useTextEditingState` at :274 which also calls
`useSelectionPriority()` at :279) — qualify the grep to component files so these don't false-
positive; (c) shell registers
`autoUpdate` only in the open-toolbar effect; zero new
`setInterval`/`MutationObserver`/`ResizeObserver` in `ToolbarShell.tsx` (floating-ui's
internal ResizeObserver on the anchor while OPEN is acceptable; nothing runs while idle —
verify with a 10s idle Performance trace showing no toolbar-system timers).

---

## Phase 2 — action sets as config + selector-ize all toolbar store access

Steps:

1. NEW `actionSets.tsx`: config map `ToolbarType → { component, size }`; `ToolbarShell`
   consumes it instead of the phase-1 inline map. Existing action implementations (layout
   swap, move/dup/delete, text formatting + variations, image replace/stock/edit/delete)
   re-mounted as-is — every action works or doesn't exist (phase-2 law holds).
2. Selector-ize the 7 bare `useEditStore()` subscriptions via narrow `useShallow` selectors:
   `TextToolbarMVP.tsx:135`, `SectionToolbar.tsx:51`, `ElementToolbar.tsx:27` + `:45`,
   `ImageToolbar.tsx:42` + `:498` (StockPhotosPanel — stays a portal per Q4). While here,
   confirm no visibility re-resolution snuck back in (shell remains sole authority per
   phase-1 law).
3. Hygiene in the same files: remove `logger.dev()` in JSX (`ImageToolbar.tsx:333,395`,
   `TextToolbarMVP.tsx:503`), module-global render counters, per-render
   `querySelector`/`getBoundingClientRect` where the shell now supplies the anchor.

**Files touched:**

- NEW `src/app/edit/[token]/components/toolbars/actionSets.tsx`
- `src/app/edit/[token]/components/toolbars/ToolbarShell.tsx`
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx`
- `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx`

**Verification:** `tsc` + `test:run` green. Acceptance grep is clean:
`useEditStore()` with no selector = ZERO hits in
`src/app/edit/[token]/components/toolbars/**` (rg `useEditStore(Legacy)?\(\s*\)`).
Manual: open a text toolbar, type in another element — open toolbar does NOT re-render per
keystroke (React DevTools highlight or profiler).

---

## Phase 3 — DELETE list  ⛔ HUMAN GATE (toolbar parity sign-off)

Sequenced after phases 1–2 so nothing on the list has a live importer (phase 1 already
removed all `useToolbarVisibility` callers and `toolbarPositioning` imports). Scout each
deletion's references immediately before deleting (rg the symbol); re-point, don't break.

Steps:

1. Delete files: `src/hooks/useGlobalAnchor.ts` (incl. its re-exported
   `useToolbarPositioning`), `src/hooks/useTransitionLock.ts`,
   `src/hooks/useToolbarPositioning.ts` (compat shim), `src/utils/toolbarSingleton.ts`,
   `src/utils/singletonAnchorRegistry.ts`, `src/utils/toolbarPositioning.ts` (arrow now
   shell-owned; imports removed in phase 1).
2. Delete `AdvancedActionsMenu.tsx` (Q3). Check `useAdvancedActionsMenu.ts` consumers: none →
   delete it too; some → inline the two types (`AdvancedActionItem`/`AdvancedActionGroup`)
   into the hook.
3. Delete duplicate `useToolbarVisibility` in `src/hooks/useOptimizedEditStore.ts:227` and
   its `toolbar.actions` reader at `:241`; delete the now-dead `useToolbarVisibility` export
   in `useSelectionPriority.ts:192` (all callers already removed in phase 1 — shell reads
   the resolver directly). ALSO delete the dead `useTextEditingState` export in
   `useSelectionPriority.ts:274` (a second internal `useSelectionPriority()` caller at :279
   with ZERO consumers repo-wide — grep-confirmed; helps net-negative LOC). End-state:
   exactly ONE `useSelectionPriority` instance in the app (the shell) and zero
   `useToolbarVisibility`/`useTextEditingState` anywhere.
4. `toolbarWatchdog` has no source file — remove the stale README mention (grep
   `toolbarWatchdog` across repo; expected hit in the editor README).
5. Store untouched per Q2 (`showToolbar`/`toolbar.position` writers stay; field is vestigial).

**Files touched (delete unless noted):**

- `src/hooks/useGlobalAnchor.ts`
- `src/hooks/useTransitionLock.ts`
- `src/hooks/useToolbarPositioning.ts`
- `src/utils/toolbarSingleton.ts`
- `src/utils/singletonAnchorRegistry.ts`
- `src/utils/toolbarPositioning.ts`
- `src/app/edit/[token]/components/toolbars/AdvancedActionsMenu.tsx`
- `src/hooks/useAdvancedActionsMenu.ts` (delete or type-inline per consumer check)
- `src/hooks/useOptimizedEditStore.ts` (edit)
- `src/hooks/useSelectionPriority.ts` (edit)
- editor README with stale `toolbarWatchdog` mention (edit; locate via grep)

**Verification:** `tsc` + `test:run` + `npm run build` green. rg for every deleted symbol
(`useGlobalAnchor|useTransitionLock|toolbarSingleton|singletonAnchorRegistry|calculateArrowPosition|toolbarWatchdog|AdvancedActionsMenu|useToolbarVisibility`)
= zero src hits. `git diff main --stat -- src/` net LOC NEGATIVE (acceptance). Perf gates:
re-run the 6× throttle harness (`reports/perf-editor-throttled6x-2026-07-11.md` method) —
idle <10% busy (expect ~0.85% held); `e2e/edit-persistence.spec.ts` green; idle trace shows
zero toolbar-system intervals/observers.

**⛔ HUMAN GATE (spec gate 2):** founder manual toolbar QA — section/element/text/image across
meridian + hearth + vestria; all actions work; no flicker on selection transitions (what the
locks used to mask); Esc/outside-click; viewport edges. Editor UX must feel unchanged or
better. Sign-off required before phase 4.

---

## Phase 4 — edit-primitive interface (types + shared modules scaffold)

Small contract phase both primitives consume; gives review a clean checkpoint and
template-factory its interface.

Steps:

1. NEW plain module `src/modules/editing/primitiveTypes.ts` (published-safe, NO 'use client'):
   `PrimitiveKind` union (per editorPlan table), slot declaration shape
   (`{ kind, min?, max?, aspect? }`), `ImageCollectionItem` (`{ id, url, alt?, caption? }`),
   logo value shape. Templates DECLARE primitives per slot; primitives own all editing UI.
   **Logo surface variants (founder req 2026-07-11):** the logo VALUE type must carry an
   optional dark-surface variant — header renders on a LIGHT surface, footer on a DARK surface,
   so one asset does not suffice. Type shape: `LogoValue = { url?: string; darkUrl?: string;
   wordmark?: string }` (primary = light-surface asset; `darkUrl` = optional dark-surface asset,
   footer falls back to `url` if unset). This phase only defines the TYPE — the store-field vs
   CSS-invert persistence mechanism is decided at the phase-5 gate; keep the type expressive
   enough to support either without a later breaking change.
2. Extend `elementMetadata` (`src/types/core/content.ts:133` — currently
   `Record<string, { buttonConfig?; cta? }>`): add
   `alt?: string | Record<string, string>` — string for single-image slots, itemId-keyed map
   for collections (keyed by the COLLECTION key, e.g. `elementMetadata.items.alt[itemId]`).
   Canonical alt store per the locked 2026-07-11 law.
3. NEW `src/modules/editing/altText.ts`: `resolveAlt(metadataAlt, itemId?, siblingFallback)`
   — plain module read by BOTH renderers (fallback = today's sibling-derived values, e.g.
   `item.title`).

**Files touched:**

- NEW `src/modules/editing/primitiveTypes.ts`
- NEW `src/modules/editing/altText.ts`
- `src/types/core/content.ts`

**Verification:** `tsc` + `test:run` green (additive optional types — no behavior change).
Unit test for `resolveAlt` fallback chain (add to a small `altText.test.ts` — include in
Files if written: NEW `src/modules/editing/altText.test.ts`).

---

## Phase 5 — `logo` primitive + techpremium proving case  ⛔ HUMAN GATE (naayom-live shape)

**Design (reuse the EXISTING site-scoped logo mechanism — decided at plan time, no
persistence uncertainty):** the site-scoped logo slot is `globalSettings.logoUrl`
(`src/types/store/state.ts:190`) with existing writer `setLogoUrl`
(`src/hooks/editStore/layoutActions.ts:704`, clears via `:709`) — already persisted in the
saveDraft/publish payload and already consumed by `src/components/ui/HeaderLogo.tsx`,
`LogoPublished.tsx`, and `extractLogoUrl` on the publish path (structured data / OG). NO new
`brand.logo` field, NO Prisma migration, no re-gate needed on persistence.

**Surface-variant requirement (founder 2026-07-11, MUST handle):** header renders on a LIGHT
surface, footer on a DARK surface. A single logo asset does NOT work on both — a dark-colored
logo vanishes on the dark footer. `resolveLogo` therefore takes the target SURFACE
(`'light'|'dark'`, read from the block's `data-surface`) and returns the surface-appropriate
asset. Mechanism to CONFIRM at this phase's gate (bring both options to the founder):
  - **(A) explicit dark asset** — add `globalSettings.logoUrlDark` (a NEW globalSettings field;
    reopens the "no new field" simplification, but is the safe default for colored logos).
    Footer uses `logoUrlDark ?? logoUrl`; header uses `logoUrl`. Editor exposes an optional
    "logo on dark background" upload in the primitive.
  - **(B) CSS treatment** — one asset, footer applies `filter:brightness(0) invert(1)` (or a
    template-provided inverted token) on `data-surface="dark"`. Zero new field, but only looks
    right for monochrome marks — wrong for colored/photographic logos.
  Default recommendation = (A) for correctness (naayom is a hardware brand, likely colored
  mark); the primitive `LogoValue.darkUrl` type from phase 4 already models it.

Resolution order in a plain shared module `resolveLogo(globalSettings, sectionContent, surface)`:
primary chain `globalSettings.logoUrl` → per-section `content[sectionId].elements.logo_image`
(existing techpremium value, `TechPremiumNav.tsx:113` upload path today) → wordmark
(`elements.logo_text`); when `surface==='dark'`, prefer the dark asset (mechanism A: `logoUrlDark`
before falling to the primary chain; mechanism B: primary chain + invert class). New uploads
write ONLY `globalSettings.logoUrl` (via `setLogoUrl`) / the dark field → header + footer
converge going forward; **naayom's live logo can never blank** — it renders byte-identical from
the `logo_image` fallback until the founder touches the logo.
Reconciliation note: templates already using `HeaderLogo` read `globalSettings.logoUrl`
directly — `resolveLogo`'s FIRST read is that same source, so they stay consistent and
unchanged (no edits to `HeaderLogo.tsx`).

Steps:

1. NEW `EditableLogo.tsx` ('use client'): upload (reuse `uploadImage` pipeline →
   `/api/upload-image`; `imageWriteGuard` still blocks data:/blob:), remove, wordmark
   fallback editing. Writes via the EXISTING `setLogoUrl` store action — no new action, no
   new persistence code.
2. NEW `src/modules/editing/resolveLogo.ts` (plain module) implementing the fallback chain
   above; imported by BOTH renderers' blocks (published side imports ONLY this plain module,
   never the 'use client' primitive).
3. Re-point techpremium header + footer onto the primitive/resolver — BOTH renderers per
   block, kept identical: `TechPremiumNav.tsx` + `.published.tsx` (logo keys L22-23, upload
   label L118-123), `TechPremiumFooter.tsx` + `.published.tsx` (own logo_image + wordmark
   L33, upload L63-71). Footer's separate upload control now drives the same `setLogoUrl`.
4. Publish path check (read-only): `globalSettings.logoUrl` already reaches
   `generateStaticHTML`/`extractLogoUrl` — verify the published techpremium blocks render
   via `resolveLogo` with the section content + globalSettings they receive; if
   globalSettings isn't in the published block props today, thread it through the published
   wrapper props (edit stays within the two `.published.tsx` files listed).
5. Meridian NOT migrated here (parity-secondary, no upload button in its edit .tsx —
   asymmetric; migrates with template-factory). Note in editorPlan at phase close.

**Files touched:**

- NEW `src/app/edit/[token]/components/primitives/EditableLogo.tsx`
- NEW `src/modules/editing/resolveLogo.ts`
- `src/modules/templates/techpremium/blocks/Header/TechPremiumNav.tsx`
- `src/modules/templates/techpremium/blocks/Header/TechPremiumNav.published.tsx`
- `src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.tsx`
- `src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.published.tsx`

**Verification:** `tsc` + `test:run` + `npm run build` green. Manual on a techpremium
project: change logo → header AND footer update from the one value; remove → wordmark
fallback; reload (persists via existing globalSettings persistence); publish → published
HTML identical layout, logo correct in both header/footer (screenshot-compare edit vs
published). **Back-compat check:** load a project with ONLY legacy `logo_image` set (no
`globalSettings.logoUrl`) → renders unchanged in edit + published. **HeaderLogo templates
check:** a template using `HeaderLogo` still shows its logo (no source change for them).

**⛔ HUMAN GATE (spec gate 3):** founder confirms BEFORE implementation of this phase (it
changes rendering on the live paying project): (1) proving template (techpremium = naayom's);
(2) the globalSettings.logoUrl + read-through fallback approach; (3) **the light/dark
surface-variant mechanism — (A) explicit `logoUrlDark` field vs (B) CSS invert** (founder req
2026-07-11: header light-surface, footer dark-surface; default reco = A). Also re-confirm
naayom's header vs footer are intended to share one primary asset (differ only by surface
variant), converging on next edit — which this design guarantees.

---

## Phase 6 — `imageCollection` primitive + alt law on vestria catalogue grid

**Design constraint (the conflict this phase must NOT create):**
`VestriaCatalogueGrid.core.tsx:51-78` ALREADY edits its `items` collection through the
injected `E.List` (add respecting max, remove respecting min) with per-item `E.Img`
upload/replace/remove (`editPrimitives.tsx:130-155, 83-113`). Mounting a separate editor
next to that = TWO writers on the same `items` array. So the imageCollection capability is
delivered by **UPGRADING the injected-primitive contract** (`E.List` + `E.Img`) — both edit
and published stay single-source through `.core.tsx`; there is exactly ONE editor. The
reusable editing CHROME lives in a shared 'use client' component consumed BY the template's
edit primitives — **never mounted directly by a block wrapper** (that would reintroduce the
dual-editor + parity conflict).

**Alt plumbing (REQUIRED, not optional):** the core receives only `content` — no
`elementMetadata`. Thread metadata via the injected `E.*` closures (core signature
unchanged):

- **Store (write path):** NEW action `setItemAlt(sectionId, collectionKey, itemId, alt)`
  writing `content[sectionId].elementMetadata[collectionKey].alt[itemId]` (the phase-4
  shape). Add/remove/reorder/bulk-add need NO new store ops — they all ride the existing
  whole-array `updateCollection` write path the wrapper already provides.
- **Edit read/write:** extend `VestriaEditCtx` (`editPrimitives.tsx:21`) with
  `getItemAlt(collKey, itemId)` / `setItemAlt(collKey, itemId, alt)` backed by the store.
  The edit `E.Img` already parses collection paths (`parsePath`, `items.<id>.image`) → it
  reads display alt via `resolveAlt(getItemAlt(coll, id), fallback = alt prop)` and gains an
  alt input in its affordance chrome writing `setItemAlt`.
- **Published read:** `makePublishedPrimitives()` gains an options arg
  `{ elementMetadata? }`; the published `E.Img` parses its elementKey the same way and
  renders `alt = resolveAlt(elementMetadata?.[coll]?.alt, id, altProp)`. The published
  wrapper (`VestriaCatalogueGrid.published.tsx`) forwards the section's `elementMetadata`
  into the factory — published blocks already receive `elementMetadata` (all ~26 buttonConfig
  readers per `normalizeCtas.ts:7-8` consume it), so mirror that existing prop path.

Steps:

1. Contract (`vestria/blocks/primitives.ts`): extend `VestriaListProps` with
   `reorderable?: boolean` and `imageField?: string` (slot DECLARES drag-reorder +
   bulk-upload-into-this-item-field; primitives implement — templates declare, never
   implement). `VestriaImgProps` unchanged (`alt` prop becomes the sibling fallback).
2. NEW shared chrome `src/app/edit/[token]/components/primitives/EditableImageCollection.tsx`
   ('use client'): the reusable collection-editing chrome for ANY template's edit
   primitives — bulk upload (reuse `bulkUploadImages`, `formsImageActions.ts:726`; it
   returns URLs ONLY, so the chrome appends `{ id, [imageField]: url }` items respecting
   `max`), drag-reorder via **@dnd-kit** `DndContext` + `SortableContext` emitting the
   reordered array (dep already installed; grep 2026-07-11 shows zero existing @dnd-kit
   usage in src/, so this is the first integration — keep it fully contained in this one
   component), remove, per-item alt (+ caption when the slot declares a caption field).
   Chrome must NOT assume grid rendering (atelier hero slider consumes this next).
   **LAW: mounted ONLY via injected `E.*` from a core — never by wrappers directly.**
3. `editPrimitives.tsx`: upgrade the edit `E.List` to delegate its chrome to
   `EditableImageCollection` when `reorderable`/`imageField` are declared (existing
   add/remove logic replaced by the delegation, NOT kept alongside — one editor); all
   mutations still flow through `ctx.updateCollection`. Upgrade the edit `E.Img` with the
   alt input per the design above. Extend `VestriaEditCtx` + `useVestriaEditCtx` with
   `getItemAlt`/`setItemAlt` (store-backed).
4. Store: `setItemAlt` action in `contentActions.ts` + its type in the store actions type
   file (same file as scouted `actions.ts:149`).
5. `publishedPrimitives.tsx`: `makePublishedPrimitives({ elementMetadata })` + published
   `E.Img` alt resolution per the design above. Published `E.List` unchanged (static ordered
   render — order IS the array order).
6. Wire the catalogue grid: `.core.tsx` declares `reorderable imageField="image"` on its
   `E.List` (min 4 / max 8 already declared); `E.Img` keeps `alt={item.title}` as the
   sibling fallback. Edit wrapper (`VestriaCatalogueGrid.tsx`) threads `elementMetadata`
   into the ctx (via `useVestriaBlock`/store read); published wrapper forwards it into the
   factory.
7. Mark editorPlan phase-3 row built (final housekeeping).

**Files touched:**

- NEW `src/app/edit/[token]/components/primitives/EditableImageCollection.tsx`
- `src/modules/templates/vestria/blocks/primitives.ts` (contract)
- `src/modules/templates/vestria/blocks/editPrimitives.tsx`
- `src/modules/templates/vestria/blocks/publishedPrimitives.tsx`
- `src/modules/templates/vestria/blocks/Catalog/VestriaCatalogueGrid.core.tsx`
- `src/modules/templates/vestria/blocks/Catalog/VestriaCatalogueGrid.tsx`
- `src/modules/templates/vestria/blocks/Catalog/VestriaCatalogueGrid.published.tsx`
- `src/modules/templates/vestria/hooks/useVestriaBlock.ts` (only if the edit wrapper needs
  it to surface `elementMetadata`)
- `src/hooks/editStore/contentActions.ts` (`setItemAlt`)
- `src/hooks/editStore/types/actions.ts` (same actions type file as phase 5 scouting)
- `docs/tracks/editorPlan.md` (phase-3 row → built)

**Verification:** `tsc` + `test:run` + `npm run build` green. Manual on a vestria project:
bulk-add (multi-file), drag-reorder, remove, set per-item alt → reload persists; publish →
static HTML has identical layout, correct item ORDER, and `alt` attributes sourced from
`elementMetadata` (view-source check — this closes the acceptance "alt written by primitives
AND read by proving-case published blocks"); empty-alt item falls back to `item.title`.
Min/max enforced (add disabled at 8, remove disabled at 4). Single-editor grep:
`EditableImageCollection` imported ONLY by `editPrimitives.tsx` (never by wrappers/cores).
@dnd-kit active only while editing — idle trace still clean; final perf sweep: 6× idle <10%,
`e2e/edit-persistence.spec.ts` green (closes acceptance).

---

## Unresolved questions

1. Logo light/dark surface mechanism (founder 2026-07-11: header light, footer dark) — mechanism (A) explicit `logoUrlDark` field [reco] vs (B) CSS invert? Confirm at phase-5 gate. naayom header vs footer = same primary asset, differ only by surface variant?
2. imageCollection caption: store on item (`caption`) like planned, or also elementMetadata? (plan = on item; alt only in metadata per law)
3. Toolbar parity QA (gate 2): founder pass solo, or want a recorded checklist from `/manual-test` first?
