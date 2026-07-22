# section-background — scout findings

Consolidated from 4 read-only scouts + orchestrator verification.
WORKDIR: `C:\Users\susha\lessgo-ai\.claude\worktrees\section-background` · branch `feature/section-background`.

> **Orchestrator corrections to scout claims** (verified directly):
> - `src/modules/skeletons/` **DOES exist** (`ids.ts`, `styleTokens.ts`, `work/`). One scout's
>   "no skeletons dir" claim was wrong — ignore it.
> - `WORK_COPY_ENGINE_TEMPLATES = ['atelier']` — **no `atelier2`** on this branch. The
>   atelier-skeleton-cutover already absorbed it; `atelier` IS the skeleton-backed work template.
> - Spec's `workSections.ts:189` pointer resolves to `src/modules/engines/workSections.ts:187-197`,
>   NOT `skeletons/work/`.

---

## Q1 — Where do per-section `styleTokens` live?

- **Type**: `src/modules/skeletons/styleTokens.ts` — `SectionStyleTokens` (:37),
  `StyleTokens = Record<sectionId, SectionStyleTokens>` (:48), `serializeStyleTokens()` (:124) →
  `[data-sid="<id>"]{--u-*:…}` CSS. Pure data, deliberately outside the dispatch firewall.
- **Existing keys**: `background` · `spacingY` · `corners` · `border` · `shadow` · `opacity` ·
  `headerMode`. Only `headerMode` has a consumer.
- **Storage**: `Project.themeValues.styleTokens` (JSON sub-key — no column, no migration).
- ⚠️ **NO WRITER EXISTS TODAY.** `editStore.ts` holds `themeValues` as an opaque blob (init :270,
  persisted :527) with **no `setStyleTokens`/`setThemeValues` action**. `autoSaveDraft.ts:219-224`
  spreads `themeValues` into the saveDraft payload, so a new key round-trips *once something writes
  it* — but `saveDraft/route.ts:272,285` **REPLACES the whole column**, so any writer must MERGE.
- **Load**: `loadDraft/route.ts:70,132` returns `themeValues` whole → store.
- **Edit renderer**: `LandingPageRenderer.tsx:964-967` → `tmpl.ThemeInjector styleTokens=…`.
  Contract typed at `src/types/template.ts:87,91`.

## Q1b — Is `styleTokens` threaded through static export? **YES for CSS, NO for blocks.**

Verified chain: `api/publish/route.ts:274-277` (read off the Project, not the client payload) →
`:478` → `generateStaticHTML` (`htmlGenerator.ts:51` option, `:148` pass-through) →
`renderPublishedExport.ts:54`, passed at `:231/:332/:493` (root + sub-pages) →
`LandingPagePublishedRenderer.tsx:56,80` → `:223 <tmpl.SSRTokens styleTokens={…}>` →
`work/SSRTokens.tsx:32 buildWorkStylesheet(skin, knobs, styleTokens)` → `serializeStyleTokens`.
Also re-threaded on domain re-render (`domains/verify-dns/route.ts:147`) and merged into
`PublishedPage.themeValues` at `publish/route.ts:285`. Test: `htmlGenerator.test.ts:96-125`.

**TWO REAL GAPS:**
1. **Per-block gap** — styleTokens reach only `SSRTokens` (a CSS `<style>` block). The published
   renderer never passes them to individual block components, so a non-CSS delivery (a `data-*`
   attribute / a `data-surface` value) has **no published path today**. This is Slice 1's real work.
2. **SSR fallback gap** — `src/app/p/[slug]/renderPublishedRoot.tsx:147` and
   `p/[slug]/[...subpath]/page.tsx:322` pass `mood` but **not** `styleTokens`. The non-blob SSR
   fallback would silently drop the override.

## Q1c — The `headerMode` "precedent" is HALF-BUILT. Do not copy verbatim.

- Key `styleTokens[sectionId].headerMode` (`UHeaderMode = 'default'|'static'|'fixed'`,
  `styleTokens.ts:33`), deliberately NOT serialized to CSS (:122) — it's a data-attr not a var.
- Core `WorkHeader.core.tsx:64-75` takes `headerMode` prop → `data-wk-header-mode` on root
  (also emits `data-sid`, :81).
- Edit wrapper `WorkHeader.tsx:26-27`: direct store read
  `useEditStore(s => s.themeValues?.styleTokens?.[sectionId]?.headerMode)` — no prop plumbing. Good.
- Published wrapper `WorkHeader.published.tsx:28-29`:
  `props.content?.[sectionId]?.styleTokens?.headerMode ?? props.headerMode ?? 'static'` —
  ⚠️ **nothing ever populates `content[sectionId].styleTokens`** (its own comment :8-10 admits it),
  so published is hardcoded `'static'`. Copying this shape reproduces the divergence.
- Nothing writes `headerMode` either (toolbar Sticky is wave-2 spec work).

---

## Q2 — id-keyed override vs type-keyed skin override

- `getSurfaceForSection(sectionType: string, overrides?: Record<string, WorkSurface>): WorkSurface`
  at `src/modules/skeletons/work/sectionRules.ts:55`. `key = sectionType.toLowerCase()` →
  **overrides are keyed by section TYPE**. Lookup: override → `defaultWorkSectionSurfaces` → `'paper'`.
- **Only caller today**: `src/modules/skeletons/work/skin.ts:51-52`, passing
  `skin.selections.surfaceBySection` (compile-time skin data). **No runtime caller passes it.**
- The 8 templates each declare `getSurfaceForSection(sectionType: string): <T>Surface` with **no
  second param** (meridian :40, techpremium :55, hearth :52, lex :49, surge :50, lumen :42,
  granth :35, vestria :45). `atelier/index.ts:22` re-exports the work skeleton's.
- Contract `src/types/template.ts:95` — `getSurfaceForSection(sectionType: string): string`.
  **Widening to `(sectionType, sectionId?)` is NON-breaking**: TS lets fewer-param implementations
  satisfy a wider signature, so the 8 templates need zero edits. Registry forwards the fn ref
  (`registry.ts:21,38,…`).

### The three renderer call sites

| Site | sectionId in scope? | styleTokens in scope? | how `data-surface` lands |
|---|---|---|---|
| `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx:80` | yes (`sectionId` prop :58; type via `extractSectionType`) | **NO** — selects only `audienceType`/`templateId` (:68-70); must add a `s.themeValues.styleTokens` selector | spread at :128 `{...(surface ? {'data-surface': surface} : {})}` on outer wrapper div |
| `src/modules/generatedLanding/LandingPageRenderer.tsx:523` | yes (`sectionId` in `renderSection` :385; type via `extractSectionTypeRaw` :522) | yes — `themeValues` from store (:127,146), already used at :967 | attribute at :532 on section wrapper div |
| `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx:156` | yes (`sectionId` :140; type :141) | yes — `styleTokens` prop (:56, default :80, forwarded to `SSRTokens` :223) | attribute inline at :158 |

### Where `data-surface` is painted + the vocabulary

- Band CSS: `src/modules/skeletons/work/tokenContract.ts:404-407` —
  `[data-surface="paper"|"paper-2"|"dark"|"accent"]` each set **background AND color**
  (paper-2 also `border-block`). Emitted by `serializeSkinTokens` (:271) → `buildWorkStylesheet`
  (`stylesheet.ts:98,115`) → ThemeInjector (edit) / SSRTokens (published).
- `export type WorkSurface = 'paper'|'paper-2'|'dark'|'accent'` — `sectionRules.ts:12`;
  list `WORK_SURFACES:15`; defaults map :22-37; `surfaceToVar()` :47.
- ⭐ **An id-keyed vocabulary ALREADY EXISTS**: `UBackground = 'default'|'paper'|'paper-2'|'dark'|'accent'`
  (`skeletons/styleTokens.ts:23`) inside `SectionStyleTokens.background` (:38). It is
  `WorkSurface` + `'default'`. Today it only emits `--u-bg`/`--u-fg` (:56-62), which **nothing
  consumes** — exactly the stale blocker the spec calls out. Cleanest id-keyed path = **reuse this
  field**, map `'default'` → undefined, feed it to the wrapper's `data-surface`; no new persistence
  shape, no key-space conflation (the type-keyed skin override stays in `skin.selections.surfaceBySection`).
  Note the `--u-bg` CSS emission is the contrast-UNSAFE route the spec rejects — decide whether to
  stop emitting it or leave it inert.

### Other `data-surface` sites (not among the three)

- Shared blocks self-set `data-surface="neutral"` and deliberately bypass `getSurfaceForSection`:
  `modules/cms/render/CollectionSection.tsx:189` + `.core.tsx:263`, `CollectionDetail.tsx:28` +
  `.core.tsx:68`, `sharedBlocks/StoreBadges/badgeArt.tsx:124`, `sharedBlocks/FollowStrip/socialIcons.tsx`.
  Documented as intentional (they resolve before template dispatch) — out of scope, but they would
  IGNORE a user override.
- ⚠️ `src/lib/staticExport/analyticsGenerator.js:126` reads `[data-surface][id]` to attribute CTA
  placement — the wrapper must keep BOTH attrs. Changing the *value* is safe; dropping the attr is not.
- `EnhancedLayoutWrapper` / `EditableSection`: no `data-surface` refs.
- Vestria has a separate `data-mood` (`templates/vestria/tokens.ts:81-82`) explicitly renamed to
  avoid colliding with per-section `data-surface` — don't reuse `data-mood`.
- Snapshot that moves if surface output changes:
  `modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap`
  (contains inline `data-surface="ink"/"cream"`).
- Stale comment to correct in place: `SectionToolbar.tsx:326-341`.

---

## Q3/Q5 — SectionToolbar gating, disabled chip, accent, docked panel

File: `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`

- Actions = one flat array literal `primaryActions` (:193-342) of
  `{id,label,icon,disabled?,disabledTitle?,variant?,handler}`, rendered :464-493 with `ToolbarDivider`.
- `background` placeholder :334-341 (`disabled:true`, `disabledTitle:'Section backgrounds are coming
  with the design system.'`, no-op handler); stale rationale comment :320-333.
- Gating = a chain of `.filter()` at :343-353 over constants: `CHROME_HIDDEN_ACTIONS` (:26, inverse
  gate via `isChromeId`), `FOOTER_ONLY_ACTIONS` (:35, via local `isFooterId` :67-70), plus an ad-hoc
  per-action filter (`change-layout` vs `showChangeLayout` :344).
  **→ No new mechanism needed.** "work-only" and "hero-only" are each one more `.filter()` predicate
  (e.g. a `WORK_ONLY_ACTIONS` const + `sectionTypeOf(sectionId)==='hero'` reusing the existing
  `${type}-${uuid}` parse in `sectionChipLabel`/`isFooterId`).
- **Engine awareness**: props are `{sectionId}` only (:72-74); the store selector at :85-107
  **already pulls `audienceType` and `templateId`** (used for `usesTemplateModule` :119). Section
  TYPE is derived from the id string.
- **Gate predicate**: use `isWorkCopyTemplate(templateId)` from `@/lib/workCopyEngine` — an
  explicitly dependency-free leaf importable from the editor bundle (header :6-10), already the
  editor's precedent gate (story-interview panel in `MainContent.tsx`). Today skeleton-gate and
  copy-engine-gate coincide at exactly `atelier`. (Alternative: `templateMeta` `works` capability —
  but that drifts the moment a manual-fill work template lands.)
- **Greyed + why-tooltip** (for the Video chip): `toolbars/ToolbarButton.tsx:95-167`. Convention
  (documented :65-94): **`aria-disabled`, never native `disabled`**; inertness via `handleClick`
  guard :132-140 and `handleMouseDown` :122-130; tooltip = plain `title` attr,
  `disabled ? disabledTitle ?? title ?? label` (:149); muted `text-[#5a5a66] cursor-not-allowed`
  (:113-114). SectionToolbar forwards :481-486 + its own click guard :471-479.
  ⚠️ Also add an entry to `ActionIcon`'s `iconMap` (:507-573) — the fallback grey square reads as a
  bug (comments :549-551, :563-566).
- **Design-menu accent for work**: **YES.** Atelier is `audienceType:'service'` →
  `EditHeader.tsx:73-74` picks `ServiceThemePopover`, which renders an **ACCENT** section over the
  template's real palettes (`ui/ServiceThemePopover.tsx:255-262`; active palette :90; write via
  `updateMeta({paletteId})` :114). Shared chrome in `ui/DesignMenuShell.tsx:292-324`.
- **Docked panel precedent**: the toolbar-body-owned dropdown already exists — panels are
  `absolute top-full left-0` siblings inside the toolbar pill; `ToolbarShell.tsx:247-257`
  deliberately makes the chrome box `relative` and forbids `overflow-hidden`. Live example:
  `ImageToolbar.tsx:22-28` (`showUploader`/`pickerOpen`/`showEditor` local booleans).
  **Cheapest route — no new primitive.** Alternatives: `@floating-ui` already wired in
  `ToolbarShell.tsx:151-214`; stock shadcn `src/components/ui/popover.tsx`; app-chrome
  `AppPopoverPanel`/`AppPopoverMenu` (caveat `DesignMenuShell.tsx:107-108`: `AppPopoverPanel` is
  `overflow-hidden` → tall content clips). **No precedent for a panel docked to the section element
  itself** — everything anchors to the toolbar or portals (`ElementToolbar.tsx:3 createPortal`).

---

## Q4/Q6 — reorder, media picker, slides storage, destructive pattern

- **Best dnd-kit file to copy**:
  `src/app/edit/[token]/components/primitives/EditableImageCollection.tsx` (its header :16-23 states
  the "one writer, fully contained" law). Packages: `@dnd-kit/core` (`DndContext`, `PointerSensor`,
  `KeyboardSensor`, `useSensor(s)`, `closestCenter`, `DragEndEvent`), `@dnd-kit/sortable`
  (`SortableContext`, `useSortable`, `arrayMove`, `rectSortingStrategy`, `sortableKeyboardCoordinates`),
  `@dnd-kit/utilities` (`CSS.Transform.toString`). Sensors:
  `PointerSensor {activationConstraint:{distance:6}}` + keyboard coords (:151-154); ids
  `items.map(it => it.id ?? String(i))` (:157); `onDragEnd` → `arrayMove` → **single** `onChange(next)`
  (:159-166); handle button spreads `{...attributes}{...listeners}` (:102-112); dragging item
  `opacity .5 / zIndex 5`.
  **Strategy**: `rectSortingStrategy` works for grid AND a horizontal strip → a filmstrip needs no
  new strategy (stricter option: `horizontalListSortingStrategy` + `restrictToHorizontalAxis`;
  **no horizontal precedent exists in the repo**).
  Other sites: `src/components/ui/field-row-list.tsx:11-17` (vertical, hand-rolled transform),
  `components/onboarding/journey/engines/work/CorrectionBoard.tsx:33`. `SocialItemsEditor` and
  `FormBuilder.tsx:477` deliberately use **adjacent swap, not dnd-kit**.
- **`SocialItemsEditor` chrome** (`src/components/editor/SocialItemsEditor.tsx`): portal modal onto
  `document.body`; app-chrome tokens (`bg-app-surface`, `text-app-ink`, `rounded-app-ctl`,
  `text-app-danger`); rows :220-301 with right-side action cluster; move buttons rendered **only when
  the move is possible** (:243,:256); edit (:269) / remove (:280, hover→`text-app-danger`, **no
  confirm**); add = full-width dashed `+ Add` **hidden at the cap** (:385-393), replaced by a
  `social-cap-notice` line (:395-399); reorder writes the **full id order** via
  `reorderSocialMediaItems` (:162-168). `data-testid` convention = `social-*` kebab nouns
  (`social-items-editor`, `social-item-list`, `social-item` +`data-platform`, `social-move-up`/`-down`,
  `social-edit`, `social-remove`, `social-add`, `social-cap-notice`, …); every row has an `aria-label`.
- **`MediaPickerModal`** (`src/app/edit/[token]/components/ui/MediaPickerModal.tsx`, `'use client'`,
  Radix `Dialog`, Library/Upload + Stock tabs, `SHOW_CMS_TAB=false` :43). Props :69-75:
  `{ open, onOpenChange(open), initialTab?: 'library'|'stock', tokenId, onPick: (url:string)=>void }`
  — open state owned by the caller's local `useState`, not `useModalManager` (:20-21).
  `Img` (`editPrimitives.tsx:178-227`): local `picking` state; `onPick = url => saveField(ctx, elementKey, url)`
  (:187); `clear` writes `''` (:188); Replace/Remove :207-212; modal mounted :216-222 with
  `tokenId={ctx.tokenId}`, `initialTab="library"`. **Guard :213-215** — Radix renders nothing while
  closed (zero in-flow DOM ⇒ parity preserved) and the whole picker sits behind `{!preview && …}`
  inside this edit-only module, never reachable from `publishedPrimitives`.
- **`List` add/remove** `editPrimitives.tsx:257-266`: add → `ctx.updateCollection(collectionKey,
  [...items, {id: genId(collectionKey), ...makeItem()}])` capped by `max`; removeAt → filter, floored
  by `min`. `updateCollection` is injected as `handleCollectionUpdate`
  (`src/modules/templates/shared/useTemplateBlock.ts:106-111`) = **`updateElementContent(sectionId,
  collectionKey, value)`** — collections live in the section elements map as a plain array.
  Wiring: `WorkHeroSlider.tsx:22-24` → `useWorkEditCtx(...)` (`editPrimitives.tsx:390-419`).
- **Slides shape**: `slides: {id: string; image: string}[]` (`WorkHeroSlider.core.tsx:43,58`);
  per-slide picker key `slides.${slide.id}.image` (:79); exact write shape in
  `__tests__/imgPicker.test.tsx:144-151` → `['slides', [{id:'i1', image: URL}]]`.
  First-gen `stampHeroSlides(fc, entries)` — `src/modules/generation/workCollections.ts:145-151`
  (one slide per works-group cover, `id = \`slide-${e.slug}\``, skipped if `slides` already non-empty),
  called once from `src/modules/wizard/generation/work.llm.ts:405`.
  **Cap 6** = `slides.constraints {min:0,max:6}` at `src/modules/engines/workSections.ts:187-197`.
- **Destructive precedent — BOTH exist**:
  - Confirm: `src/components/ui/ConfirmDialog.tsx` — `confirmDialog(opts)` (:42, promise-based,
    `destructive:true`), `promptDialog` (:49), `DialogHost()` (:60) mounted once in
    `src/app/edit/[token]/page.tsx:10`. Consumers: `ElementCRUD.tsx:5`, `ElementToolbar.tsx:9`,
    `ImageToolbar.tsx:6`, `PageSwitcher.tsx:55`, `CollectionBrowser.tsx:41`, `SectionCRUD.tsx:4`.
    One legacy raw `confirm()` at `MainContent.tsx:328`.
  - Undo: `executeUndoableAction(actionType, actionName, fn)`. Closest precedent for a lossy list
    mutation = `BlockVariantSelector.tsx:27-29, 245-254, 294` — inline warning ("keeps first N cards;
    undo restores") + both mutations wrapped in **ONE** `executeUndoableAction` so a single undo
    restores everything. **Match this for slide delete and for the promote/demote pair.**
