# `src/modules/collections/` — Multi-page collection system

A **collection** is a set of repeatable content pages: one **catalog** singleton
page that auto-lists items + N **collectionItem** pages, each holding one
structured record. This module fixes only the *page topology*; the materialize
logic and editor UI live elsewhere (see below).

## The collection FAMILY (`CollectionKey`)
Valid collection keys are EXACTLY the collection-family capabilityIds
(`@/types/brief`): **`products` · `services` · `case-studies` · `works`**
(`locations` reserved for P3). `CollectionKey` enumerates them and
`COLLECTIONS` is keyed by it — an invalid key can never appear.

**Vestria `catalog` is NOT a collection.** Vestria's `catalog` capability is a
FLAT GRID of plain `ai_generated` items on one page. It shares the name but is
NOT a `CollectionKey`, has NO `CollectionDef` here by construction, and can never
trigger the generation→collections bridge. Locked here + in `@/types/brief` +
`templateMeta.ts` comments.

## `registry.ts` — the collection definitions (pure data)
`COLLECTIONS: Record<CollectionKey, CollectionDef>` + `getCollectionDef(key)`.
Each `CollectionDef` declares `key`, `basePath` (`/products` — item slugs are
`basePath + '/' + slug`), `label`, the archetype keys stamped on item vs catalog
pages, the two section types that carry data (`catalogSectionType`,
`itemSectionType`), and **`labelFields: string[]`** — the ordered item-record
field names used to derive an entry's display label (first non-empty joined by
` — `, page title as fallback). `products` uses `['model', 'name']`; this lets
the editor panel drop hard-coded per-collection label fallbacks.

**Firewall convention:** this file is PURE DATA — no store or template imports
(same discipline as `audience/*/elementSchema.ts`), so it can be read anywhere.
Categories are **not** defined here; they live as editable content on the catalog
block (`categories[]`) so they stay renamable/reorderable per project.

## `../brief/collections.ts` — Brief-carried collection data (pure)
`Brief.facts.collections: { [key: CollectionKey]: CollectionEntry[] }` holds the
entry lists (scraped verbatim, edited at the 7b gate). `CollectionEntry` =
`{ name, slug, oneLiner?, imageUrl? }`. `getCollections(brief)` is the tolerant
safe reader (missing/malformed facts ⇒ `{}`; unknown keys/entries dropped);
`setCollections` / `makeCollectionEntry` are pure writers. **Slug law:** slugs
are ALWAYS code-derived from `name` via `slugify` — never AI. `facts` is a loose
`z.record`, so no `brief.schema.ts` change is needed.

## Where the rest lives (verified)
The registry is small on purpose — the behavior is implemented against it:

- **Materialize** (derive the catalog grid + per-item "related" strip from each
  product page's stored record): `src/hooks/editStore/collectionHelpers.ts`
  (`syncCollection`, `CatalogCard`). Materialize reads each item's **stored** page
  content and *fully replaces* the arrays (idempotent) — so it must run only after
  the active page's edits are flushed (`commitActivePage`), and re-runs safely at
  the export boundary. Because content is frozen at materialize time, the dumb dual
  renderers never read the live store → no editor/published divergence.
- **Page CRUD / re-materialize triggers** (add / delete / slug-change a product):
  `src/hooks/editStore/pageActions.ts` (+ `pageHelpers.ts`, `archetypes.ts`).
- **Assembly for multi-page publish:** `src/modules/generation/multiPageAssembly.ts`.
- **Products panel** (add/edit/delete/reorder products, assign category):
  `src/app/edit/[token]/components/ui/ProductsModal.tsx`, opened from
  `PageSwitcher`.
- **Blocks** that render the data: each template's `Catalog` +
  `ProductDetail` block pairs (e.g. `templates/techpremium/blocks/Catalog/`,
  `templates/vestria/blocks/Catalog/`).

Tests: `src/hooks/editStore/naayomProducts.test.ts`,
`homeTeasers.test.ts`, `pageActions.test.ts`,
`src/modules/generation/multiPageAssembly.test.ts`.

## The `works` collection is managed from the "Your work" board (not the editor)
For the **works** collection (work engine, `atelier`/skeleton), the management
door is the project-scoped **"Your work"** dashboard board at
`/dashboard/[token]/work` (`WorkLibraryClient` → the reused `CorrectionBoard`),
NOT the in-editor products panel. The board's source of truth is
`brief.facts.work.groups`, written through the single rail door
(`applyRailEdit({field:'groups'})`); on save it also rewrites the stored
`Project.content` group-reference surfaces via the pure
`resyncWorkContent` (`src/modules/generation/workLibrarySync.ts`).

**Works catalog-authority rule (work-library-board phase 6).** The works
`workcatalog.items[]` are **authoritative** — seeded by
`buildCollectionCatalogSlice` (D13) and maintained by `resyncWorkContent` — so the
editor/export sweep must **NOT** re-materialize them. `materializeCatalogItems`
(`src/hooks/editStore/collectionHelpers.ts`) is gated by a
`catalogItemsAuthoritative` (works) def-flag at BOTH call sites
(`materializeIntoPages` = export/publish path, and its twin `syncCollection` =
live-editor `commitActivePage` path): the `works` collection is SKIPPED at both.
Re-deriving would corrupt them, because `cardFromEntry` reads `rec.images` and
writes a `CatalogCard` (`{id,model,name,oneLiner,image,…}`), whereas WorkCatalog
expects `workdetail.photos` → `{id,name,cover,href}`. Products/services/
case-studies collections still re-materialize normally at both sites.
