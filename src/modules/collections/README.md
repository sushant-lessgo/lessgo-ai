# `src/modules/collections/` — Multi-page collection system

A **collection** is a set of repeatable content pages (today: `products`): one
**catalog** singleton page that auto-lists items + N **collectionItem** pages, each
holding one structured record. This module fixes only the *page topology*; the
materialize logic and editor UI live elsewhere (see below).

## `registry.ts` — the collection definitions (pure data)
`COLLECTIONS: Record<string, CollectionDef>` + `getCollectionDef(key)`. Each
`CollectionDef` declares `key`, `basePath` (`/products` — item slugs are
`basePath + '/' + slug`), `label`, the archetype keys stamped on item vs catalog
pages, and the two section types that carry data: `catalogSectionType`
(`catalog`) and `itemSectionType` (`productdetail`).

**Firewall convention:** this file is PURE DATA — no store or template imports
(same discipline as `audience/*/elementSchema.ts`), so it can be read anywhere.
Categories are **not** defined here; they live as editable content on the catalog
block (`categories[]`) so they stay renamable/reorderable per project.

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
