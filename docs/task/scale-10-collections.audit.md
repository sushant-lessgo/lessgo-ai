# scale-10 collections — audit

## Phase 1 — Data layer (family capability ids + registry family + Brief collections type/reader)

Branch: `feature/scale-10-collections` (verified via `git branch --show-current`).

### Files changed
- `src/types/brief.ts` — added collection-family capabilityIds.
- `src/modules/templates/templateMeta.ts` — comment-only (vestria `catalog`).
- `src/modules/collections/registry.ts` — `CollectionKey` type, family defs, `labelFields`.
- `src/modules/collections/README.md` — documented family + rules.
- `src/modules/brief/collections.ts` — NEW: type + safe reader/writer.
- `src/modules/brief/collections.test.ts` — NEW: unit coverage.

### Per-file detail

**`src/types/brief.ts`** — Added `products`, `services`, `case-studies`, `works` to the
`capabilityIds` const array (after the scale-07 explicit-trigger caps). `locations` intentionally
NOT added (reserved P3 — noted in comment). Added a comment on the existing `catalog` entry marking
it as vestria's flat-grid capability that must never key a `CollectionDef`. `CapabilityId` union
derives from the array so it picks up the new ids automatically.

**`src/modules/templates/templateMeta.ts`** — Comment-only. Annotated vestria's `catalog`
capability declaration as a flat grid / non-collection. NO capability re-point; techpremium
untouched (stays retired).

**`src/modules/collections/registry.ts`** — Added `type CollectionKey =
'products'|'services'|'case-studies'|'works'` (exactly the family ids; `catalog` NOT valid). Retyped
`CollectionDef.key` to `CollectionKey` and `COLLECTIONS` to `Record<CollectionKey, CollectionDef>`.
Added `labelFields: string[]` to `CollectionDef`. Added data-only defs for `services`, `case-studies`,
`works` (basePath, label, archetype keys, catalog/item section types) and `labelFields` for all four.
`getCollectionDef` still takes a `string` and casts internally so callers passing arbitrary keys are
tolerated. Pure-data firewall preserved (no store/template imports).

**`src/modules/brief/collections.ts`** (NEW) — `CollectionEntry { name, slug, oneLiner?, imageUrl? }`,
`CollectionsFacts = Partial<Record<CollectionKey, CollectionEntry[]>>`, `getCollections(brief)` safe
reader (mirrors `getEntryFacts` idiom: typeof-object guard, tolerant of missing/malformed facts,
drops unknown keys / non-array values / nameless entries, re-derives slugs), plus
`getCollectionEntries`, `makeCollectionEntry`, and pure writer `setCollections`. `facts.collections`
stays optional; no `brief.schema.ts` change (facts is a loose `z.record`). Slugs always derived via
`slugify` from `src/lib/normalize.ts`.

**`src/modules/brief/collections.test.ts`** (NEW) — reader tolerance (null/absent/malformed),
unknown-key + non-array drop (incl. explicit `catalog` drop), nameless-entry drop, slug re-derivation,
`getCollectionEntries`, `makeCollectionEntry` slug-never-AI, `setCollections` round-trip + sibling-facts
preservation + empty-collection retention + stale-slug re-derivation.

**`src/modules/collections/README.md`** — documented the family / `CollectionKey`, the
vestria-`catalog`-is-not-a-collection rule, `labelFields`, and the new `../brief/collections.ts`
reader/writer + slug law.

### Grep result for `catalog`
Grepped `src` for the `catalog` literal (excluding `.test.`). Confirmed the plan's blast-radius facts:
- `templateMeta.ts:68,77` — vestria's flat-grid `catalog` capability + capabilitySection. KEPT
  (comment added only).
- `fit.ts` — NO `catalog` literal (capability derivation is generic). NOT edited.
- `businessTypes/config.ts` — no `catalog` in `requiredCapabilities` (this phase does not touch it).
- Other hits (`archetypes.ts`, `collectionHelpers.ts`, `pageActions.ts`, `ProductsModal.tsx`,
  `StructureSlot.tsx`, publish route, wizard StyleSlot/templateCatalog) use `catalog` as a
  sectionType / archetypeKey / UI string / local var — NOT as a capabilityId. Out of scope,
  left untouched.

### Decisions
- `labelFields` shaped as an ordered array of item-RECORD field names; label = first non-empty joined
  by ` — `, page title fallback. `products = ['model','name']` reproduces the existing
  `ProductsModal` `[rec.model, rec.name]` derivation so phase 6 can drop the hard-coded fallback.
  `services`/`case-studies`/`works` set to `['name']` (item block contracts land at rung-C).
- Section types / archetype keys for the three new defs are placeholder-but-consistent
  (`servicecatalog`/`servicedetail`, etc.); they are dormant (no template declares the capability), so
  no block must resolve them yet.
- `getCollections` re-derives slugs on read (defense in depth) rather than trusting stored slugs.

### Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` — new `collections.test.ts` passes; named must-stay-green suites green
  (`fit.test.ts`, `swap.test.ts`, `structureConvergence.test.ts`, dispatch/conformance/blockManifest,
  `serveGate.test.ts`, `classify.test.ts`). **1 failure**, see below.

### Deviations / open risk — BLOCKED on out-of-scope test
`src/modules/generation/multiPageAssembly.test.ts:84` asserts
`Object.values(COLLECTIONS).map(d => d.key)` `toEqual(['products'])`. Adding the family ids (the
core deliverable of this phase) breaks this exhaustive enumeration assertion. This test file is a
phase-5 file and is **NOT on the Phase 1 Files-touched list**, so per the hard scope rule it was
left UNEDITED. Its own title — "vestria registers no CollectionDef (catalog items stay plain
ai_generated)" — shows intent is to assert `catalog` is not a registered def, not that `products` is
the only def. Recommended one-line fix (orchestrator to authorize / assign):
`expect(defs).not.toContain('catalog')` (or `toEqual(['products','services','case-studies','works'])`).
All other 1708 tests pass.

### Resolution (coordinator-authorized)
Authorized to make the one minimal fix. `src/modules/generation/multiPageAssembly.test.ts` added to
the changed-files set for this phase. Updated line 84 to preserve the test's real intent:
```
expect(defs).not.toContain('catalog');
expect(defs).toEqual(['products', 'services', 'case-studies', 'works']);
```
Nothing else in that file touched (Phase 5 owns the rest).

Re-verified: `npx tsc --noEmit` clean; `npm run test:run` = 103 files / 1709 passed, 3 skipped —
FULLY GREEN.

**Updated Files changed (complete):** `src/types/brief.ts`, `src/modules/templates/templateMeta.ts`,
`src/modules/collections/registry.ts`, `src/modules/collections/README.md`,
`src/modules/brief/collections.ts` (new), `src/modules/brief/collections.test.ts` (new),
`src/modules/generation/multiPageAssembly.test.ts`.

---

## Phase 2 — Scrape extraction: collection entries → facts.collections

Branch: `feature/scale-10-collections` (verified via `git branch --show-current`).

### Files changed (complete)
- `src/lib/schemas/extraction/index.ts` — shared collection-extraction helpers.
- `src/lib/schemas/extraction/thing.ts` — `products` extraction.
- `src/lib/schemas/extraction/manufacturer.ts` — `products` (layered on trade-supplier fields).
- `src/lib/schemas/extraction/trust.ts` — `services` + `case-studies`.
- `src/lib/schemas/extraction/work.ts` — `services` + `works`.
- `src/lib/schemas/extraction/extraction.test.ts` — extended coverage.
- `src/modules/brief/classify.ts` — carrier type + `buildBriefDraft` writes `facts.collections`.
- `src/modules/brief/classify.test.ts` — extended coverage.

### Engine → collection key mapping (and why)
- **thing → `products`** — generic product/SaaS businesses list products.
- **manufacturer → `products`** — thing variant; products layered on top of the 4 trade-supplier enrichment fields.
- **trust → `services` + `case-studies`** — agencies/consultants/coaches sell service lines; case-studies are first-party owner-authored (founder decision 4).
- **work → `services` + `works`** — photographer portfolio genres ARE services (founder decision 1, proof = images); writers' books are `works` (books ≠ services). Whichever the site lists fills; the other stays empty and is dropped.
- Keys are exactly the registry `CollectionKey` family (`products·services·case-studies·works`). No engine invents a key outside the registry.

### Data flow: signal → facts.collections
1. Each engine's `entryEnrichmentFields` now carries a `collections` zod object (`{ <key>: [{ name, oneLiner, imageUrl }] }`) built by `collectionsEnrichmentFields()`; `entryEnrichmentPrompt()` appends a verbatim-extraction block from `collectionsEnrichmentPrompt()`. This rides the EXISTING route wiring (`EntryScrapeSchema.extend(entryEnrichmentFields)` + `enrichSignals`) — no route edit.
2. `enrichSignals` calls `foldCollectionsIntoSignals()`, folding extracted entries onto the new optional `EntrySignals.collections` carrier (raw name/oneLiner/imageUrl only, empty names dropped, empty per-key lists dropped, returns base ref when nothing folds).
3. `buildBriefDraft` → `collectionsFromSignals()` maps carrier drafts through `makeCollectionEntry` (Phase 1) and writes them via `setCollections` (Phase 1). Empty/absent ⇒ `facts.collections` left unset (DROP path).

### Slug-derivation confirmation
Slugs are NEVER taken from AI: the extraction zod shape has no `slug` field, `EntrySignals.collections`/`CollectionEntryDraft` carry no slug, and slugs are derived in code by `makeCollectionEntry` → `slugify` inside `buildBriefDraft`/`setCollections`. Test `writes entries VERBATIM with code-derived slugs` asserts `slug: 'widget-one'` from name `Widget One`.

### Deviations (in-scope judgment calls)
- **Collections ride BOTH understand + scrape paths, not scrape-only.** `EngineExtraction` exposes only the shared `entryEnrichmentFields/entryEnrichmentPrompt/enrichSignals` hooks, which both `/api/v2/understand` and `/api/v2/scrape-website` consume; there is no per-path hook, and the routes are out of this phase's Files-touched. Folding collections into these shared hooks is the only route-free path and matches the established manufacturer-enrichment pattern (which already rides both paths). Harmless: a one-liner understand call yields empty collection arrays → dropped by the DROP path. Founder decision 2's "existing single scrape call" intent is preserved for real extraction (only the scrape crawl sees item lists/images).
- **`imageUrl` modeled as required `z.string()` ("" sentinel), not `.optional()`.** OpenAI strict structured outputs reject optional-not-in-required keys; `""` sentinel mirrors the existing `ScrapedTestimonial.author_name` convention and stays strict-json friendly (no min/max/regex). Converted to absent (`undefined`) in code when empty.
- **`hasEntryEnrichment(thing|trust|work)` now returns true** (they carry collections). The route already gates schema extension on this, so behavior is correct; the two extraction tests asserting "NO enrichment" were updated accordingly.
- `applyBusinessTypeCorrection` needed NO code change — its existing `...draft.facts` spread already carries `collections` through a correction; covered by a new test.

### Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` (full vitest): **103 passed | 1 skipped file; 1720 passed | 3 skipped tests.** Includes extraction.test.ts, classify.test.ts, bridge.test.ts, generationContract, serveGate, entryClassify.schema, collections.test.ts, multiPageAssembly.

### Open risks
- Prompt-only count/no-invention enforcement (no schema clamp yet) — clamping AI-invented items to Brief entries lands in Phase 5 per plan.
- Understand-path collection ask is wasted tokens on a one-liner (see deviation 1); acceptable, becomes a no-op cost.
