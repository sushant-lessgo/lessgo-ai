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

---

# collections-entry-capture — Phase 2 audit

**Branch:** `feature/collections-entry-capture` (verified `git branch --show-current` before any edit).
Scope: Phase 2 (route wiring for both entry handlers + exactly-one-AI-call route test). No extraction/registry/serve-gate/config/StructureSlot change.

## Files changed
- `src/app/api/v2/scrape-website/route.ts`
- `src/app/api/v2/understand/route.ts`
- `src/app/api/v2/entryCollections.test.ts` (new)
- `docs/task/collections-entry-capture.audit.md` (this section appended)

## Per-file changes

### `src/app/api/v2/scrape-website/route.ts` (`handleEntryScrape`)
- Imports: added `entryUnionEnrichment`, `entryExtractionForSignals`, `type EngineExtraction` from `@/lib/schemas/extraction`.
- No-businessType branch now extends the schema with `entryUnionEnrichment().fields` and appends `entryUnionEnrichment().prompt`. `entryUnionEnrichment()` is called ONCE (`const union = businessType ? null : entryUnionEnrichment()`) and reused for schema + prompt. Explicit-businessType branch (`explicitExtraction = extractionForBusinessType(businessType)`) is unchanged — same `hasEntryEnrichment`-gated `.extend(entryEnrichmentFields)` / `entryEnrichmentPrompt()`.
- `toSignals` restructured to take a resolved `foldExtraction: EngineExtraction | null` param (was closing over `extraction`).
- Post-call: `foldExtraction = explicitExtraction ?? entryExtractionForSignals(data)`; demo path resolves from `MOCK_DATA_ENTRY` (`entryExtractionForSignals(MOCK_DATA_ENTRY)` → agency→trust). Scrape base (`mapEntryScrapeToSignals`) already builds a fresh signals object with NO `collections` field, so foreign union keys never leak here.

### `src/app/api/v2/understand/route.ts` (`handleEntryUnderstand`)
- Same import + union-once + explicit-branch-unchanged treatment, mirrored for `EntryUnderstandSchema`.
- Demo path resolves `foldExtraction = explicitExtraction ?? entryExtractionForSignals(ENTRY_DEMO_SIGNALS)` (agency→trust) and folds via that engine.
- Post-call: `foldExtraction = explicitExtraction ?? entryExtractionForSignals(raw)`.
- **Deviation (see below): base-collections strip.** `raw` is used as BOTH the enrich data AND the base signals; on the union path `raw.collections` carries ALL 4 keys, and `collectionsFromSignals` (in `buildBriefDraft`) reads every present key — so foreign keys would leak into `facts.collections`. Fixed by destructuring `collections` off the base (`const { collections: _unionCollections, ...baseSignals } = raw`) and folding only the engine's keys back from the raw data. Explicit path is byte-unaffected (raw carries only that engine's keys either way).

### `src/app/api/v2/entryCollections.test.ts` (new)
Route-level test. Tests the REAL exported `POST` handlers (no pure-helper extraction needed). Mocks: `@/lib/aiClient` (`generateWithSchema` — the one-AI-call spy), `@/lib/scrape/fetchSite` (`scrapeSite` + `ScrapeError`), `@/lib/middleware/planCheck` (`requireAuth`→allowed), `@/lib/creditSystem` (`consumeCredits` + `CREDIT_COSTS`/`UsageEventType` stubs), `@/lib/rateLimit` (pass-through `withAIRateLimit`), `@/lib/mockMode` (`isDemoMode`→false, forces the AI path), `@/lib/security` (`createSecureResponse`→plain `{__body,__status}`). The pure brief/extraction/collections/businessTypes stack runs FOR REAL (that is what derives slugs and drops foreign keys). Schema assertion reads the captured 3rd arg of `generateWithSchema` (`schema.shape.collections.shape` keys).
Asserts: (a) exactly one `generateWithSchema` call per request (both routes); (b) no-businessType scrape → union 4-key `collections` shape + saas→`products` folded with code-derived slug (`pinenote-tablet`, empty-name entry dropped); (c) saas(thing)+AI `works` → `works` absent; (d) explicit `manufacturer` → engine-only schema (`collections.shape` == `['products']`, no union-only keys) + `products` folded; (e) understand agency(trust) → `services` folds, `products` discarded.

## Decisions / deviations
- **Tested real handlers**, not extracted pure helpers (plan permitted either). The handlers imported cleanly under vitest with the module mocks above; the one-AI-call assertion rides the `generateWithSchema` mock. No helper extraction, no extra files.
- **Understand base-collections strip (in-scope, conservative).** Discovered via test (e) failing: the plan's "foreign keys drop naturally in the fold" holds for the scrape route (fresh base) but NOT the understand route, which reuses `raw` as its base and thus carries the full union `collections` into `collectionsFromSignals`. Stripping `collections` off the understand base before the fold is the minimal correct fix, contained to `understand/route.ts` (a Files-touched file). Explicit-businessType behavior is unchanged (verified: raw carries only the engine's keys there, and the engine re-folds them from raw regardless).
- **Prisma client was stale** at start (tsc flagged `notifiedAt`/`notifyError` in the untouched `forms/submit/route.ts`); `npx prisma generate` refreshed it (a locked-dll EPERM on the final rename did not prevent the client update). Post-regen tsc is clean. No schema/migration change.

## Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 125 passed / 1 skipped files; 1990 passed / 3 skipped tests (Phase-1 baseline 124/1986 + the new file's 4 tests). New `entryCollections.test.ts` green; extraction/classify/collections/serveGate suites still green.

## Reviewer scrutiny points
- The understand base-collections strip is the one change beyond mechanical wiring — confirm it does not alter the explicit-businessType understand response (argued byte-identical; the engine re-folds its keys from `raw`).
- One-AI-call assertion is per-request (`vi.clearAllMocks()` in `beforeEach`); each test issues a single request.
- Slug-derivation and foreign-key-discard are exercised through the REAL `buildBriefDraft`/`setCollections`/`enrichSignals` stack (not mocked), so the tests would catch a regression there too.

---

# collections-entry-capture — Phase 3 audit

**Branch:** `feature/collections-entry-capture` (verified `git branch --show-current` before any edit).
Scope: Phase 3 (7b collection-node empty-state reachability). No config/serve-gate/store-SOURCE/extraction change.

## Files changed
- `src/components/onboarding/wizard/StructureSlot.tsx`
- `src/modules/collections/registry.test.ts` (new)
- `src/hooks/useWizardStore.test.ts` (test-only addition; store SOURCE untouched)
- `docs/task/collections-entry-capture.audit.md` (this section appended)

## Per-file changes

### `src/components/onboarding/wizard/StructureSlot.tsx` (`CollectionNodes`)
- Import: added `collectionKeysForBusinessType` alongside the existing `getCollectionDef`/`CollectionKey` from `@/modules/collections/registry`.
- `keys` memo now unions THREE sources: present-in-store (`Object.keys(collections)`), the dormant `requiredCollections` (left as-is — still `[]` in config, serve-gate coupling untouched), and `collectionKeysForBusinessType(businessTypeKey)` (the engine-declared family keys). Dedup via `Set`, unchanged.
- Updated the block comment to document the engine-key union + the null-bt fallback.
- Empty-state / `commitAdd` / `addCollectionEntry` path (`CollectionNode`) untouched, per scope.

### `src/modules/collections/registry.test.ts` (new)
- Tests `collectionKeysForBusinessType`: saas→`[products]`, app→`[products]`, consultant→`[services,case-studies]`, photographer→`[services,works]`, manufacturer→`[products]`, unknown→`[]`, null/undefined→`[]`. (7 tests.)

### `src/hooks/useWizardStore.test.ts` (test-only)
- Added ONE P3 round-trip test in the existing `useWizardStore — 7b collection channel` describe: hydrates a bare one-liner `bareThing` (no site → no extraction → `collections.products` undefined), calls `addCollectionEntry('products', 'Widget -- Co')`, then asserts `buildBriefPatch().facts.collections.products` === `[{ name: 'Widget -- Co', slug: 'widget-co' }]` (code-derived, F28 slug-collapse). Proves the manual add→Brief path end-to-end.

## Decisions / notes
- **Null-businessType fallback** requires no explicit branch: `collectionKeysForBusinessType(null)` returns `[]` (Phase-1 guard), so for an unclassified rung-A entry the union collapses to present-only — unchanged behavior, no empty nodes surfaced. Same for `requiredCollections` (`[]`). The node still returns null when the resulting `keys` is empty.
- **Round-trip test placement:** put in `useWizardStore.test.ts` (not the registry/collections test) because the round-trip exercises the STORE actions (`addCollectionEntry` + `buildBriefPatch`) which only exist on the wizard store; that file already owns the 7b collection-channel describe with `bareThing`/`buildBriefPatch` fixtures in scope. Store SOURCE was not modified — test addition only (permitted per phase brief).
- `businessTypes` import in StructureSlot is still used (dormant `requiredCollections` read), left in place.

## Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 126 passed / 1 skipped files; 1998 passed / 3 skipped tests (Phase-2 baseline 125/1990 + new `registry.test.ts` 7 tests + 1 round-trip test). Targeted run of `registry.test.ts` + `useWizardStore.test.ts` + `serveGate.test.ts` = 3 files / 101 tests green. `serveGate.test.ts` green confirms the reachability fix did NOT re-activate the dormant serve-gate branch (`requiredCollections` untouched).

## Reviewer scrutiny points
- The fix reads engine keys from the collections registry (`collectionKeysForBusinessType`), NOT from `requiredCollections` — deliberate per plan decision #4 (populating `requiredCollections` would route leads to MANUAL-ONBOARD via the serve gate). `config.ts` / `serveGate.ts` were not touched.
- Empty nodes now render for ALL collection-capable classified businessTypes (e.g. consultant → empty Services + Case Studies), per resolved-question #2 (accepted).
