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
