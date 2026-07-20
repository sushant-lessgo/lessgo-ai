# cms-collections — scout findings (input to planner)

Five read-only scouts, 2026-07-20. Condensed. Cite these instead of re-exploring.

---

## A. Existing collections machinery — mostly NOT reusable

- `src/modules/collections/registry.ts` — `CollectionKey` is a **CLOSED union** `products | services | case-studies | works` (:23). `CollectionDef` (:25-38) is **page topology only**: `key, basePath, label, itemArchetypeKey, catalogArchetypeKey, catalogSectionType, itemSectionType, labelFields[]`.
- **There is NO field-schema concept anywhere in the codebase today.** No field types, no field roles. `labelFields` is the only faint ancestor of a `title` role. The whole schema layer is net-new.
- Item records live untyped inside `state.pages[pageId].content[sectionId].elements` — page-shaped, not a data core. `src/hooks/editStore/collectionHelpers.ts` has no separate storage.
- Products-hardcoded (leave alone / replace, do NOT generalize): `CatalogCard` (:38-47, fixed 8-field product shape), `cardFromEntry` (:62-75, literal keys `model/name/oneLiner/images[0].src/cardSpec/category`), `materializeRelated` (:124, related == same category), `materializeHomeLineup/Gallery/Teasers` (:242-280, literal `'products'`, section types `'lineup'/'gallery'/'gallerypreview'`).
- `catalogItemsAuthoritative` (:97) is a string-literal `'works'` escape hatch (works uses `photos` not `images`) — **evidence the derive-everything model already broke on collection #2.**
- Template capability declaration: `src/modules/templates/templateMeta.ts` — `capabilities: CapabilityId[]` (:58) + `capabilitySections` (:61); probe `templateHasCapability()` (:76-82). Only **atelier** declares one today (`works` → `workcatalog`, :227-228).
- `docs/guides/collections.md` is **stale**: claims one collection (there are 4), maps `works` to writers/`/books` (code: photographers/atelier at `/works`), and states "record schema = the item block's element contract" — directly opposed to this spec.

**Verdict: build the new core ALONGSIDE. Do not extend `CollectionKey`.** Reuse only page topology (`ProjectPageEntry.kind/collectionKey`), the dormant fan-out, and the capability mechanism.

---

## B. Detail pages — publish path needs ZERO changes

- Page record shape (`multiPageAssembly.ts:207-219`): `{id, archetypeKey, pathSlug, title, order, sections[], sectionLayouts, sectionSpacing, content}` + `kind:'singleton'|'collectionItem'` + `collectionKey`. Pages are body-only; chrome lives once at `fc.chrome`.
- Slugs: `pathSlug`, code-derived `def.basePath + '/' + entry.slug` (:380). `VERBATIM_ITEM_FIELDS` (:305) protects `slug/name/images/photos` from AI overwrite.
- Collections fan-out **already exists but is DORMANT** behind a double gate: `firingCollectionKeys()` (:317) requires registry def AND template capability. `assembleCollectionPages` (:351), `runCollectionFanOut` (:461).
- **Publish chain is fully `pathSlug`-generic:** `usePublishFlow.ts:167-204` flattens non-home pages into `content.subpages[pathSlug]` → `renderPublishedExport.ts:255-347` → blob key `pages/{pageId}/{version}/{pageName}.html` (`blobUploader.ts:67`, nested paths OK) → `atomicPublish(extraRoutes)` (`kvRoutes.ts:121-143`) → served by `/p/[slug]/[...subpath]`. **No changes needed here.**
- Live precedent: `products` detail pages work today via the EDITOR (`pageActions.ts:372 addCollectionItem` → `uniqueItemSlug` :79 → `buildProductDetailSlice` → `syncCollection`), not via the dormant generation bridge.
- `PageSwitcher.tsx:151` filters `kind:'collectionItem'` OUT of the page row list (items managed via a panel, not page rows).
- Slug is **not user-editable anywhere today**. `renamePage(pageId, title, pathSlug?)` (`pageActions.ts:307-327`) already supports it with collision clamping; only caller passes title only. Founder wants SEO-friendly + user-editable → wire this arg + add a `slugLocked` flag so resync doesn't clobber.
- ⚠️ **RISK:** `subpages` is keyed by `pathSlug` with **no collision detection at publish time** (`usePublishFlow.ts:177`) — a duplicate silently overwrites. Uniqueness must be enforced at write time.

---

## C. Renderers + media — the `.core.tsx` pattern is the key asset

- Single-source trio, e.g. `src/modules/skeletons/work/blocks/Gallery/`: `WorkGalleryGrid.core.tsx` (plain server-safe module, `({content, E, sectionId, manageSlot})`) + `.tsx` (`'use client'`, `useWorkBlock`, `WorkEditProvider`, `editPrimitives`, edit-only `manageSlot`) + `.published.tsx` (flat props → `content`, `makePublishedPrimitives()`, no manageSlot).
- `src/modules/skeletons/work/blocks/primitives.ts` — TYPES ONLY: `WorkPrimitives = {Txt, Img, Link, List, Logo, Nav}`. `List` takes `collectionKey/items/render/makeItem/min/max`. **Parity is by construction.** This maps almost 1:1 onto a type-driven Collection renderer (a core that walks a field list emitting `E.Txt`/`E.Img`/`E.Link`/`E.List`).
- Work blocks do **NOT** use `componentRegistry.ts` — they resolve via `src/modules/skeletons/work/resolveWorkBlock.ts` (`{edit, published}` keyed `sectionType`, :113-179). The template path is `componentRegistry.ts:46 getComponent()` → `resolveSharedBlock(sectionType)` (:58) then template `resolveBlock` (:66) — no literal map to append to.
- Work cores' **field bindings are hardcoded** (`cover_image`, `photos.<id>.url`, `client/problem/result`) — reuse the SHAPE, not the bodies. Expect new `CollectionGrid.core.tsx` / `CollectionDetail.core.tsx`.
- Media: `MediaAsset` (`schema.prisma:285-310`) is per-project, `@@unique([tokenId,url])`, and already carries **unused `groupId`/`sortOrder`/`selected` fields reserved for this work**. Picker `MediaPickerModal.tsx` props `{open,onOpenChange,initialTab,tokenId,onPick:(url:string)=>void}` — engine-agnostic. `SHOW_CMS_TAB = false` (:43) is a **pre-cut seam for "From CMS"**.
- ⚠️ **TRAP 1:** image fields store a **bare URL string** everywhere, except the library board's `{id,url}` refs. The CMS image field type must pick a convention; changing URL-only storage touches every core + `resyncWorkContent`.
- ⚠️ **TRAP 2:** works catalog items are **authoritative** and deliberately excluded from re-materialization (`collectionHelpers.ts:97`, `modules/collections/README.md:78-89`). A generic CMS that re-materializes everything will corrupt works unless the same gate is honored.
- `work-library-board` (`src/components/dashboard/work/WorkLibraryClient.tsx` + `/api/work-library`): no Zustand, local state, single `commit(groups)` → full-array PUT funnel → server `applyRailEdit` + `resyncWorkContent`. **Host pattern (load → optimistic → single write funnel) is copyable; `CorrectionBoard`'s photo-curation verbs are not** — a typed-field CMS board is a new component.

---

## D. Persistence — use new Prisma tables

- `Project.content` = `{onboarding, finalContent, baseline, localeConfig}`. `finalContent` = store `export()` (`persistenceActions.ts:602-639`): sections, layouts, content, pages, chrome, theme, forms, legalPages, navigationConfig, localeContent…
- Precedent exists **both ways**: page-authoring state → JSON (`forms`, `legalPages`, `localeContent`); reusable/queryable entities → own table (`MediaAsset`, `Testimonial`, `BlogPost`, `ProjectPage`).
- The whole `content` blob is rewritten on **every ~1s autosave** (`saveDraft/route.ts:264-298`); the codebase already treats blob size as a real problem (`baseline` was split out of default `loadDraft`, :152-157).
- **RECOMMENDATION: new Prisma tables** `Collection` / `CollectionGroup` / `CollectionItem`, project-scoped by `tokenId`/`projectId`. Item content is user-authored, media-referencing, individually mutable, unbounded — all three argue against riding the autosave blob. Keep only lightweight **placement** (which section renders which collection) in `finalContent`. Bonus: old projects = zero rows, so **no content-shape migration needed**.
- ⚠️ `applySnapshot` (`persistenceActions.ts:111-300`) **whitelists payload keys explicitly** — any new `finalContent` key not added there is silently dropped on load. Also add to `partialize` (`editStore.ts:510-554`) for localStorage.
- Validation: `DraftSaveSchema` (`src/lib/validation.ts:23-70`) has `finalContent: z.unknown()` (:40) — project content is effectively **unvalidated** on save. Model to copy is `BriefSchema` (`src/lib/schemas/brief.schema.ts`), parsed in its own route. New models get `src/lib/schemas/collection.schema.ts` (closed 9-type discriminated union) enforced at **their own** routes.
- ⚠️ **Publish reads from the CLIENT-SENT request body**, not `Project.content` (`api/publish/route.ts:223, 259`; `Project.content` is read only for locale overlay + theme, :122-135). Published pages render from a **frozen snapshot copied at publish time**. → Collection data MUST be **materialized server-side into the publish payload** in `/api/publish` (reading the new tables). Do NOT have published pages query tables at render time.
- No content-migration framework exists; the de-facto pattern is defensive defaults at the read boundary (`payload.x ?? fallback`).
- New token routes need `assertProjectOwner` (`src/lib/security.ts`).

---

## E. Designer handoff (Phase 3) + ORCHESTRATOR RULINGS

Bundle: `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Editor Redesign.dc.html` — **t22** L300-343, **t19** L409-445, **t12** L1259-1328, CMS rail tab L2352-2364, "Add page" CMS entry L1139-1159. README CMS notes L119-131, 152, 161.

**IA:** CMS is a first-class editor surface reached from a **CMS tab in the left rail** (sibling of Pages). Rail lists collections as rows (icon tile, name, `N items · M fields`, chevron) + dashed "New collection" row. t12 = schema-definition modal. t19 = item editor whose fields ARE the schema. t22 = collection browser (2-col card grid + search + "+ New") beside the item editor. Media library holds files; collection fields *point* at library assets ("from Media library · coastal-01.jpg"). Image fields always open the shared t7 picker.

**t12 controls:** 460px modal. NAME text input with live **slug suffix rendered inside the field** (mono, `/products`). START FROM chip row. FIELDS = reorderable list, each row = drag handle · editable name · **type chip** · trailing role badge OR delete icon; dashed "+ Add field ⌄" footer. CREATES THESE PAGES = two read-only preview tiles (`Listing /products`, `Item page /products/:slug`). Footer Cancel / Create collection.

**t19 controls:** 412px panel. Back arrow · breadcrumb · status pill · ✕. **Pager strip "Item 3 of 24"** + prev/next. One control per schema field (text input / thumb+Replace+Remove / side-by-side short pair / rich-text). Read-only permalink line. Footer: "Saved 1m ago" + Cancel + Save.

**t22 controls:** 400px browser (header + count pill, search input, "+ New", 2-col scrolling card grid with selection double-ring, cards = thumb + title + grey category sub-label) | 360px item editor (large 150px cover with floating "⟳ Replace" + provenance caption, title, **Category select**, date, caption textarea, **gallery thumb strip + dashed "+" tile**).

**Primitives that EXIST** (`src/components/ui/`, `.app-chrome` scope): `dialog`, `input`, `textarea`, `select`, `button` (incl. coral `cta`), `badge`, `card`, `popover` (`AppPopoverMenu` → the "+ Add field ⌄" type picker), `tooltip`, `icon` (AppIcon / Material Symbols), `image-placeholder` (`bg-app-stripes`), `switch` (→ detailPages toggle), `tabs` (→ rail Pages/CMS), `toast`, `spinner`, `nav-item` (→ collection rail rows), `coming`/`.app-coming` (greyed treatment).

**Primitives MISSING — must be built:** schema-builder reorderable field-row list (`@dnd-kit` is already a dep for section DnD, but no reusable reorderable-row component; nearest is `EditableImageCollection.tsx`); **date field** (none exists); **tag/label multi-input** (none); rich-text form control (none in `ui/`; `InlineTextEditorV2` is canvas-inline, not a form control); card-grid browser + search (bespoke); slug-suffix-inside-input, item pager, provenance caption (bespoke compositions).

**Isolation rule:** none of this may import from `modules/templates/**`, `modules/generatedLanding/**`, or `components/published/**`.

### RULINGS on designer↔spec conflicts (spec wins; logged by orchestrator, do not re-litigate)

| # | Conflict | RULING |
|---|---|---|
| 1 | t12 "START FROM" preset chips (Products/Team/Portfolio/Blog/Blank) vs spec "Presets — blank-start v1" | **Blank only.** Render the other chips **greyed/disabled with a why-tooltip** per the greyed-placeholder rule. Do not omit the row. |
| 2 | Mock has a **Price** field type + `$249` render | **Not a type.** Price = `Text — short`. Re-label the mock. Closed at 9. |
| 3 | Mock "Rich text" + bold/italic/list/link toolbar vs spec type #6 "Text — long / paragraphs" | **Plain long-text (textarea), no toolbar** in v1. A rich-text form control does not exist and is not in the 9. |
| 4 | `SKU` mono field | Cosmetic only. It's `Text — short`; no mono variant. |
| 5 | Only a "Title field" role badge; spec needs **3** roles | Extend the same badge pattern to a **per-row role menu** offering title / cover / primaryLink, type-filtered (cover only on image/gallery, primaryLink only on link). |
| 6 | t12 asserts "Two pages, always"; spec makes detailPages a per-collection **on\|off** toggle | **Spec wins — build the toggle** (use existing `switch`). The "CREATES THESE PAGES" tiles become reactive: toggle off → show listing only. |
| 7 | Groups entirely undesigned (only a per-item "Category" select in t22) | **Build group management** per spec Phase 3 (add/name/reorder, items assignable or ungrouped). Keep it **simple ordering, no drag** (founder ruling). The t22 "Category" select IS the per-item group assignment — keep it. |
| 8 | Draft/Published status pill on t19/t22 | **No per-item status in v1.** Omit the pill — do not ship a lie. |
| 9 | t19 coral "✨ Write with AI" on Description | **Omit.** Spec §Out: no AI authoring of item content. |
| 10 | Link/button type (#7) has no designed control | Invent: url + label pair (side-by-side, per t19's short-pair pattern). |
| 11 | Video/Audio types (#3,#4) undesigned (upload **or** link) | Invent: a single control with an upload/link toggle, reusing the media picker for upload. |

### Founder answers already in the spec (do not re-ask)
- Detail-page slug: **reuse code-derived slug, SEO-friendly, user-editable.**
- Group reorder / cross-group move: **keep it simple** (no dnd for groups/items).
- `work-library-board`: **expand it into a generic CMS board.**
- Which templates get the capability in v1: **doesn't matter for this spec.**
