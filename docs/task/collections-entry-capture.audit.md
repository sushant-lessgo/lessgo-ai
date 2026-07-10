# collections-entry-capture — Phase 1 audit

**Branch:** `feature/collections-entry-capture` (verified before any edit).
Scope: Phase 1 (extraction/registry single-source + entry-union builders + post-call resolver). No route/UI/serve-gate/config change.

## Files changed
- `src/modules/collections/registry.ts`
- `src/lib/schemas/extraction/thing.ts`
- `src/lib/schemas/extraction/trust.ts`
- `src/lib/schemas/extraction/work.ts`
- `src/lib/schemas/extraction/manufacturer.ts`
- `src/lib/schemas/extraction/index.ts`
- `src/lib/schemas/extraction/extraction.test.ts`
- `src/modules/brief/collections.test.ts`
- `docs/task/collections-entry-capture.audit.md` (new)

## Per-file changes

### `src/modules/collections/registry.ts`
- Added runtime import of `businessTypes` / `BusinessTypeKey` from `businessTypes/config` (config imports `CollectionKey` type-only → no runtime cycle; verified via grep that config's only `schemas/extraction` references are comments).
- `extractionCollections: Record<ExtractionFamilyKey, readonly CollectionKey[]>` — the single source (`thing:['products']`, `trust:['services','case-studies']`, `work:['services','works']`, `manufacturer:['products']`). Family keys typed via a LOCAL `ExtractionFamilyKey` string-literal union (mirror of `ExtractionSchemaKey`) so this pure-data module never imports back from `schemas/extraction`.
- `allEntryCollectionKeys` — deduped flat union (first-seen order → `products, services, case-studies, works`), an IIFE const (safe here: registry has no cyclic import to guard against).
- `collectionKeysForBusinessType(bt)` — config `extractionSchemaKey` → `extractionCollections` lookup; unknown/undefined bt → `[]`. (Consumed by Phase 3's 7b node; added now per Files-touched.)

### `thing.ts` / `trust.ts` / `work.ts`
- Re-pointed each local `*_COLLECTIONS` const at `extractionCollections.<family>`; dropped the now-unused `type { CollectionKey }` import. Behavioral no-op (existing collection tests stay green).

### `manufacturer.ts`
- Re-pointed `MANUFACTURER_COLLECTIONS` at `extractionCollections.manufacturer`; dropped unused `CollectionKey` import.
- Extracted the trade-supplier scalar prompt into a `manufacturerScalarPrompt` const (VERBATIM, no conditional framing) and exposed new `entryScalarFields`/`entryScalarPrompt` members.
- `entryEnrichmentPrompt` now returns `` `${manufacturerScalarPrompt}\n\n${collectionsEnrichmentPrompt(...)}` `` — reconstructs the pre-split string BYTE-FOR-BYTE (asserted by a new tighter test). `entryEnrichmentFields` unchanged (`{...scalars, ...collections}`).

### `index.ts`
- Extended `EngineExtraction` with optional `entryScalarFields?: z.ZodRawShape` and `entryScalarPrompt?: () => string`.
- Added runtime imports: `resolveEngine` from `@/modules/brief/classify`, `allEntryCollectionKeys` from the registry.
- `entryUnionEnrichment()` (hoisted fn decl, reads registry lazily): merges every engine's `entryScalarFields` + `collectionsEnrichmentFields(allEntryCollectionKeys)`; prompt = each engine's `entryScalarPrompt()` wrapped with the "apply ONLY if this business makes/supplies physical goods; else empty" conditional + the union collections block. Built mechanically over `extractionSchemaKeys` — no hand-listing.
- `entryExtractionForSignals({businessTypeGuess, tiebreaker})`: KNOWN guess → `extractionForBusinessType()` (keeps manufacturer scalars); UNKNOWN → `resolveEngine()` ladder, returning the engine only when it is thing/trust/work, else `null` (place / quick-yes fold nothing).

### Tests
- `extraction.test.ts`: added union-fields (exactly 4 distinct keys + 4 manufacturer scalars, single `services`), `allEntryCollectionKeys` shape, scalar-key collision guard, union-prompt framing, `EntryScrapeSchema.extend(union.fields)` full-fixture parse, resolver cases (known bt incl. manufacturer-keeps-scalars, unknown+tiebreaker families, browsing-place/offer-already-understood → null), and a tighter explicit-path manufacturer-prompt byte assertion (`startsWith(scalar + '\n\n')` + no union framing leaked).
- `collections.test.ts`: F28 slug-collapse assertion through `makeCollectionEntry('Widget -- Co') → 'widget-co'`.

## Decisions / deviations
- **Cycle/ladder approach:** imported `resolveEngine` from `classify.ts` directly (grep confirmed classify's dep tree has no runtime import of `schemas/extraction` — only comment references in config), so no inline-ladder duplication was needed. The union builders are hoisted function declarations reading the registry lazily, per the documented index⇄engine TDZ constraint.
- **Conditional framing wording:** chose "apply ONLY if this business makes or supplies physical goods; otherwise leave them empty (\"\" or [])". Conservative/self-contained; lives ONLY in `entryUnionEnrichment()`, never in the shared getter. (In-scope wording judgment.)
- Manufacturer scalar block is duplicated as a literal in the test (`EXPECTED_MANUFACTURER_SCALAR`) so any drift in the source block fails loudly.

## Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 124 passed / 1 skipped files; 1986 passed / 3 skipped tests. Includes extraction, classify, collections, serveGate suites green (serve gate + explicit path untouched).

## Reviewer scrutiny points
- Byte-identity of the explicit manufacturer prompt (new `startsWith` test guards it, but confirm the literal in `manufacturer.ts` matches the original em-dashes/quotes).
- `entryExtractionForSignals` deliberately does NOT route known businessTypes through `resolveEngine` (that would collapse manufacturer → thing and drop the 4 scalars) — verify this is the intended asymmetry.
- `collectionKeysForBusinessType` is added in Phase 1 but not consumed until Phase 3; it is on the Phase 1 Files-touched list.
