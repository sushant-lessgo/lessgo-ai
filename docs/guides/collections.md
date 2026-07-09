# Collections — repeatable content pages (guide)

> Evergreen reference for the collection pattern: what it is, when it applies, what exists, how to add one. Delta spec: `docs/task/scale-10-collections.spec.md`. Decisions: `docs/tracks/scalePlan.md` (D9, §7 capability vocab, §8 timing tiers).

## The pattern

A **collection** = repeatable structured record + one index page that auto-lists items + N item pages, one per record.

- **Registry** `src/modules/collections/registry.ts` — `CollectionDef { key, basePath, label, itemArchetypeKey, catalogArchetypeKey, catalogSectionType, itemSectionType }`. Pure data, firewall-safe. One entry per collection type (D9: list entry, never if-statement).
- **Materialize** `src/hooks/editStore/collectionHelpers.ts` — index grid + per-item "related" strips are DERIVED from each item page's record. Never authored directly; fully replaced on sync (idempotent); runs only after `commitActivePage`. Published renderer sees frozen content → no dual-renderer divergence.
- **Record lives IN the item page's content** (its `itemSectionType` section's elements). No separate DB entity.
- **Pages** are `ProjectPage` rows: index = `kind:'singleton'` + `collectionKey`; items = `kind:'collectionItem'` + `collectionKey`. Item slug = `basePath + '/' + slug`.
- **Editor UI**: Products panel pattern (add/remove/reorder item pages) = the CRUD surface.

Built for naayom (products on techpremium). One collection registered today: `products`.

## When is something a collection? (the two tests)

**Test 1 — page-worthiness:** does ONE item have enough depth to persuade alone, and does deep-linking/SEO to it matter? If no → it's cards in a section, NOT a collection. Grid-only forever: testimonials, team, FAQ, features, industries, menu items. Getting this wrong ships thin pages — bad for visitor and SEO.

**Test 2 — lifecycle:** collections are **birth-time, first-party, finite**. Other lifecycles have their own (correct) architectures — do NOT rebuild them as collections and do NOT build new DB-backed systems for collection content:

| Lifecycle | Architecture | Example |
|---|---|---|
| Birth-time, first-party, finite | **Collection** (this guide) | products, services, case studies, books |
| Continuous post-birth authoring | Own table + per-post publish | blog (built) |
| Third-party authored, moderated | Collect→moderate workflow | testimonials (built) |

## Collections by copy engine

The family is FOUR types (+1 reserved) — decided 2026-07-09:

| Type | Engine(s) | Index → item | Who |
|---|---|---|---|
| products | THING | `/products` → `/products/x300` | naayom (built) |
| services | TRUST + WORK | `/services` → `/services/seo` · `/weddings` | agencies, consultants, **photographers** |
| case-studies | TRUST | `/work` → `/work/<client>` | agencies |
| works | WORK | `/books` → `/books/<title>` | writers |
| locations (P3) | PLACE | `/locations` → `/locations/<branch>` | chains |

**Portfolio is NOT a type** — photographer genres ARE service lines whose proof is images: same `services` record topology, engine varies the item block (WORK: gallery-dominant · TRUST: process/outcomes-dominant). Does not extend to writers — a book isn't a service ⇒ `works` is separate.

WORK-engine note: there the collection IS the argument (§8 artifact-is-proof exception) — effectively engine-core, not optional.

## Generation-time rules (post-scale target; see scale-10 spec)

- Collection entries are **data-driven, never AI-proposed**: scrape/wizard fills `Brief.facts.<collection>[]`; AI never invents items; slugs code-derived (slugify) — "slugs never AI" law holds.
- **Cost/birth discipline**: entries come from the EXISTING single scrape call (extended schema, names + one-liners only — no second scrape); image URLs recorded only if the same crawl saw them; all image processing = T3 editor; no per-item wizard questions ever. Copy fan-out charged flat.
- Structure gate shows ONE collapsible node per collection ("Products · 8"), not N rows.
- No data at birth → index page still generates (empty-state grid); items added post-reveal in editor panel (T2 boolean gates it, T3 artifacts in editor).
- businessType entry declares which collections it uses (manufacturer→products, agency→services+work, writer→books, photographer→portfolio) — pure config.
- Serve gate: each collection type is its own capability flag so demand board logs the precise gap ("blocked on services").
- **Index-page ownership split** (industry pattern — Webflow/Contentful/Astro): collection def owns topology + the required grid/record section · engine section grammar owns which optional sections may join · template supplies blocks only.

## Adding a new collection type (checklist)

1. Entry in `COLLECTIONS` registry (key, basePath, section types, archetype keys).
2. Block pair per supporting template: index-grid block + item-record block (dual-renderer pair each) — build-ladder rung C, on the flagship first.
3. Template declares the capability; conformance test asserts blocks exist.
4. Record schema = the item block's element contract (cf. naayom: `model, name, category, oneLiner, images[], cardSpec, features[], specs[]`).
5. businessType entries that use it: add capability requirement + scrape-extraction fields.
6. Archetype defs so add-page/materialize can stamp pages.
7. Editor panel: reuse Products panel pattern keyed by `collectionKey`.

## Pitfalls

- `multiPageAssembly.ts` hard invariant: the AI assembler never sets `collectionKey`/`kind:'collectionItem'` — vestria's catalogue is a flat grid, NOT a collection. Lifting this safely (behind the capability path) is the scale-10 bridge.
- `syncCollection` before `commitActivePage` = stale reads. Always commit first.
- Don't put categories in the registry — they're editable content on the index block (`categories[]`), renamable per project.
