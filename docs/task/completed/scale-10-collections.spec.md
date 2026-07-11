# scale-10 — collections convergence: data-driven repeatable pages at birth

Source: gap analysis 2026-07-09 (guide: `docs/guides/collections.md`). scalePlan covers `catalog` as one capability flag (§7) but NOT: generation→collections bridge, Brief-carried collection data, gate representation, or the collection FAMILY (services/work/books/portfolio). Depends: scale-01, scale-07. Demand-gated per §11.3 — spec ready, build when a lead lands on the rung.

## Goal
Collection pages (index + N item pages) generate at birth from Brief data via the existing collections machinery — for ANY collection type, ANY declaring template. AI never invents items; user manages post-birth in the editor panel. New collection type = registry entry + block pair, zero funnel code (D9).

## Scope IN
1. **Brief carries collection data**: `Brief.facts.collections: { [key]: Entry[] }` (entry shape = the collection's item-block element contract). Filled by waterfall (§8): SCRAPED (extend businessType scrape schemas to extract entries verbatim — services list, book list, product list) → ASK (wizard: count/names only, T1) → DROP (empty = index ships empty-state). Slugs code-derived from entry names (slugify) — "slugs never AI" law.
2. **Capability vocab split**: `catalog` → per-type flags `products | services | case-studies | works` (+ `locations` reserved P3). businessType entry declares `requiredCollections`; serve gate filters on them; MANUAL-ONBOARD logs the precise missing collection (demand board ranks "3 leads blocked on portfolio").
3. **Structure gate (7b) collection node**: one collapsible row per collection ("Products · 8 items"), entries editable (rename/remove/add name-only), never N flat AI rows. Edits land in `Brief.facts.collections` BEFORE copy (7b law).
4. **Generation→collections bridge**: post-gate assembly creates index singleton + `collectionItem` pages via registry archetypes; copy fan-out per item page fills copy FROM the record (record fields verbatim, AI writes connective copy only). Lift `multiPageAssembly.ts` no-collections invariant ONLY behind the declared-capability path; reuse `collectionHelpers` materialize at export boundary. Per-page persistence/resume = existing fan-out pattern.
5. **Registry entries** for the family: `services`, `case-studies`, `works` (books) — data only (photographer portfolio = `services` w/ work-engine item block, decision 1); block pairs demand-gated (rung C, flagship first). Conformance test: declared collection capability ⇒ both blocks exist in template block map.
6. **Editor panel generalized**: Products panel re-keyed by `collectionKey` (label/paths from registry) — one panel component, N collections.

## Scope OUT
Block pairs themselves (rung C per demand — trust-flagship services blocks likely first) · place-engine locations (P3) · any DB entity for collection content (page-content stays source of truth; blog/testimonials systems untouched) · naayom migration (grandfathered bespoke, D4) · CSV/bulk import (post-demand).

## Acceptance
Same Brief with 8 products → gate shows "Products · 8" → confirm → index + 8 item pages generate, catalog grid materialized from records, slugs deterministic; removing 2 at gate ⇒ 6 pages, no copy generated for removed. Empty collection ⇒ index with empty-state, panel add works post-reveal. AI response containing invented items is clamped to Brief entries. Vestria flat-grid path unchanged; naayom editor flow unchanged; multiPageAssembly invariant test updated to assert bridge fires ONLY on declared capability. All existing collections/multipage/golden tests green.

## Founder decisions (2026-07-09; supersede open questions)
1. **Portfolio = services collection.** Photographer genres ARE service lines; proof is images. `portfolio` dropped as a type — services collection + engine-varied item block (WORK: gallery-dominant · TRUST: process/outcomes-dominant), same record topology. Does NOT extend to writers — books ≠ services ⇒ `works` stays. **Family: products · services · case-studies · works** (+`locations` P3). Update Scope-IN §2/§5 vocab accordingly.
2. **Zero extra scrape / zero birth lengthening.** Collection entries extracted in the EXISTING single scrape call (extend schema: names + one-liners only). Image URLs recorded as strings iff same crawl saw them; ALL image processing/upload = T3 editor; items birth with placeholder slots. No URL ⇒ no per-item wizard questions — empty/count-only node at gate, items added in editor panel.
3. **Copy fan-out charge: FLAT** (not per item page) for now.
4. **Case-studies = first-party collection, no moderation.** Owner-authored about a client (or scraped verbatim); client consent = owner's offline concern. Embedded client quotes may reference testimonial system later — clean boundary, no workflow build.
5. **Index-page ownership = the industry split** (Webflow/Contentful/Astro pattern): collection def owns topology + the required grid/record section · engine section grammar (scale-07) owns which optional sections may join the page · template supplies blocks only. Consistent with "copy depends on engine+Brief only."

## Open questions
None blocking. Deferred: `locations` shape (P3, with place engine).
