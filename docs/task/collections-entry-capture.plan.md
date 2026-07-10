# collections-entry-capture — plan

**Branch:** `feature/collections-entry-capture`
**Spec:** `docs/task/collections-entry-capture.spec.md`

## Overview

Fix F19: on a real entry the single AI call both classifies AND extracts, but collection-enrichment
fields only enter the schema/prompt when `businessType` is passed IN — which is that call's output —
so `extraction === null` and `facts.collections` never populates. Fix = when no businessType, extend
the entry schema/prompt with the UNION of all engines' enrichment declarations (built from the
engine declarations themselves, D9), then AFTER the call resolve the engine in-code from
`businessTypeGuess` and run only THAT engine's `enrichSignals` (foreign keys drop naturally in
`foldCollectionsIntoSignals`). Explicit-businessType path stays byte-identical. Separately, make the
7b collection node reachable with an empty state so one-liner entries can add collections by hand.

## Key design decisions (resolving spec open questions)

1. **Schema merge / collision rule.** Every engine's collection delta shares one top-level
   `collections` object; sub-shapes are identical (`{name, oneLiner, imageUrl}` arrays, built by
   `collectionsEnrichmentFields`). Union = `collectionsEnrichmentFields(DISTINCT_KEYS)` over the
   distinct key set **products · services · case-studies · works** (dedupes `services`, shared by
   trust+work). No per-field collision rule needed — merge the INNER collections object.
2. **Manufacturer's 4 scalar fields (`whatYouMake`, `industriesServed`, `productCategories`,
   `valueAdds`) ARE included in the union.** Rationale: spec constraint says union is built from each
   engine's `entryEnrichmentFields` declarations wholesale; omitting them makes a fresh-entry
   manufacturer strictly worse than the explicit-businessType path (loses offerings/audiences
   enrichment) — a real regression. Cost ≈ 150 prompt tokens per entry; fold is scoped to the
   classified engine so non-manufacturer noise is discarded. Prompt block gets conditional framing
   ("only if this business makes/supplies physical goods; else empty").
3. **Fold defensiveness.** None needed beyond what exists — `enrichSignals` /
   `foldCollectionsIntoSignals` already read only the classified engine's keys and tolerate
   missing/foreign/malformed data (`extraction/index.ts:137-167`).
4. **Empty-state reachability does NOT use `requiredCollections`.** ⚠️ Scout guidance corrected:
   `requiredCollections` is dual-consumed by the serve gate (`serveGate.ts:180-193` — populating it
   routes every such lead to MANUAL-ONBOARD because no shipped template declares collection-family
   capabilities; `serveGate.test.ts:469` asserts it stays unset; config.ts:63-70 documents this as a
   deliberate dormant founder decision). Instead, 7b node visibility unions in the businessType's
   ENGINE-declared collection keys via a new pure lookup (collections registry → extraction key →
   keys). Serve gate untouched.
5. **Post-call engine resolution.** Known `businessTypeGuess` → `extractionForBusinessType()`.
   Unknown guess (rung A) → tiebreaker ladder engine family (`expertise`→trust,
   `portfolio-is-proof`→work, `none`→thing; `browsing-place`/`quick-yes` rungs → null, no fold).
   Prefer importing `resolveEngine` from `classify.ts` (currently only a type-only import in the
   other direction — implementer verifies no runtime cycle; if one appears, inline the ladder with a
   parity test against `resolveEngine`).
6. **Both routes.** trust + work (service engines) declare collection enrichment, so the union
   applies to `/api/v2/understand` as well as `/api/v2/scrape-website`.

## Progress log

- phase 1 union builders + collection-key single source: done (commit 7befdd64, review loops 1, ship; tsc+test:run green)
- phase 2 route wiring (scrape-website + understand) + one-AI-call tests: done (commit 1adcd540, review loops 1, ship; tsc+test:run green). Understand-route FK-strip added (foreign collection keys leaked via raw-as-base). KNOWN non-blocking: understand DEMO/mock path doesn't strip base collections — harmless (agency fixture has no collections keys); revisit if that fixture gains any.
- phase 3 7b empty-state reachability: done (commit 4e972022, review loops 1, ship; tsc+test:run green). CollectionNodes gate unions collectionKeysForBusinessType (NOT requiredCollections → serve gate untouched); null bt → present-only.
- phase 4 live verification (human gate): pending

---

## Phase 1 — collection-key single source + union builders + post-call resolver

Pure extraction/registry layer. No route or UI change; explicit-businessType behavior unchanged.

**Files touched**
- `src/modules/collections/registry.ts` — add `extractionCollections` map
  (`thing: ['products']`, `trust: ['services','case-studies']`, `work: ['services','works']`,
  `manufacturer: ['products']`; keys typed locally as plain string-literal union to avoid a
  registry↔extraction cycle), `allEntryCollectionKeys` (deduped flat union), and
  `collectionKeysForBusinessType(bt)` (businessTypes config → `extractionSchemaKey` → map lookup;
  config's import of `CollectionKey` is type-only, so no runtime cycle).
- `src/lib/schemas/extraction/thing.ts` — replace local `THING_COLLECTIONS` with the registry map
  entry (engine consumes the single source).
- `src/lib/schemas/extraction/trust.ts` — same for trust keys.
- `src/lib/schemas/extraction/work.ts` — same for work keys.
- `src/lib/schemas/extraction/manufacturer.ts` — same for keys; additionally expose the 4 scalar
  fields + their prompt block via the new optional `EngineExtraction` members (see below), keeping
  `entryEnrichmentFields`/`entryEnrichmentPrompt` derived from them (explicit path byte-identical).
- `src/lib/schemas/extraction/index.ts` —
  (a) extend `EngineExtraction` with optional `entryScalarFields?: z.ZodRawShape` and
  `entryScalarPrompt?: () => string` (non-collection enrichment; manufacturer only today);
  (b) new `entryUnionEnrichment()` returning `{ fields, prompt }`: fields = merge of every engine's
  `entryScalarFields` + `collectionsEnrichmentFields(allEntryCollectionKeys)`; prompt = scalar
  prompt blocks (conditionally framed) + `collectionsEnrichmentPrompt(allEntryCollectionKeys)` —
  built mechanically from the registry, never hand-listed (D9);
  (c) new `entryExtractionForSignals({businessTypeGuess, tiebreaker})` → `EngineExtraction | null`
  per decision 5.
- `src/lib/schemas/extraction/extraction.test.ts` — new cases: union fields contain exactly the 4
  distinct collection keys (no duplicate `services`) + manufacturer scalars; scalar-key collision
  guard (non-`collections` union keys unique across engines — fails loudly if a future engine
  collides); `EntryScrapeSchema.extend(union.fields)` parses a fixture with all keys populated;
  resolver: known bt → its extraction, unknown+`expertise` → trust, unknown+`browsing-place` →
  null; explicit-path assertions stay green untouched.
- `src/modules/brief/collections.test.ts` — verify/add slug-collapse assertion
  (`Widget -- Co` → `widget-co`, not `widget--co`) through `makeCollectionEntry` (F28).

**Steps**
1. Registry map + helpers in `collections/registry.ts`.
2. Re-point the four engine files at the map (behavioral no-op; existing tests prove it).
3. Interface extension + `entryUnionEnrichment()` + `entryExtractionForSignals()` in `index.ts`.
   Mind the documented index⇄engine cyclic-import/TDZ constraint (`index.ts:100-104`): union
   builders must be function declarations that read the registry lazily (at call time), not
   module-level consts.
4. Tests.

**Verification**
- `npx tsc --noEmit` clean.
- `npm run test:run` full green — specifically `extraction.test.ts`, `classify.test.ts`,
  `collections.test.ts`, `serveGate.test.ts` (proves serve gate + explicit path untouched).

---

## Phase 2 — route wiring + exactly-one-AI-call tests

Wire the union into both entry handlers; fold post-classification. Explicit-businessType requests
take the existing branch unchanged.

**Files touched**
- `src/app/api/v2/scrape-website/route.ts` — in `handleEntryScrape` (~:159-262): when
  `businessType` is absent, `entryScrapeSchema = EntryScrapeSchema.extend(entryUnionEnrichment().fields)`
  and append `entryUnionEnrichment().prompt` to the prompt (replacing the null/bare branch at
  :169-173, :232-237); after `generateWithSchema` returns, resolve
  `foldExtraction = extraction ?? entryExtractionForSignals(data)` and use it in `toSignals`
  (restructure `toSignals` at :177-182 to take the resolved extraction). Demo/mock path (:185-194):
  resolve fold-extraction from `MOCK_DATA_ENTRY.businessTypeGuess` ('agency' → trust) instead of the
  pre-call null.
- `src/app/api/v2/understand/route.ts` — mirror in `handleEntryUnderstand` (~:104-161): union
  schema/prompt when no `businessType` (:114-118, :138-141); post-call
  `entryExtractionForSignals(raw)` for the fold at :155-157; demo path (:120-136) resolves from the
  fixture's guess.
- `src/app/api/v2/entryCollections.test.ts` — NEW route-level test, `vi.mock` for
  `generateWithSchema` (AI client), `scrapeSite`, Clerk auth, `consumeCredits`. Asserts:
  (a) **exactly ONE `generateWithSchema` invocation per entry request** (both routes);
  (b) no businessType in request → schema handed to `generateWithSchema` includes the union
  `collections` shape, and mocked AI data with `collections.products` → response
  `briefDraft.facts.collections.products` populated with code-derived slugs;
  (c) foreign-key discard: mock classifies `saas` (thing) but returns `collections.works` entries →
  `works` absent from the Brief;
  (d) explicit `businessType: 'manufacturer'` request → schema is the engine-only extension (no
  union-only keys), behavior unchanged;
  (e) understand route: mock classifies `agency` (trust) → `collections.services` folds,
  `collections.products` discarded.
  Fallback if the route handlers resist direct import under vitest (module side effects): extract
  each handler's schema/prompt/fold selection into exported pure helpers within the same route files
  and test those, keeping the one-AI-call assertion via the `generateWithSchema` mock. No extra
  files beyond the three listed.

**Steps**
1. scrape-website wiring (union branch + post-call fold + demo fix).
2. understand wiring (same).
3. Route tests per above.

**Verification**
- `npx tsc --noEmit` clean.
- `npm run test:run` full green — new `entryCollections.test.ts` plus all phase-1 suites still green
  (acceptance: explicit-path unchanged, one AI call, foreign-key discard, slug derivation).
- Manual (dev server, mock mode off optional): URL entry without businessType logs the union prompt
  block (`DEBUG_AI_PROMPTS=true`) and returns `facts.collections` for a catalogue site.

---

## Phase 3 — 7b collection-node empty-state reachability

One-liner entries (no site → no extraction) must still reach the node's `+ Add` path. Today
`CollectionNodes` (`StructureSlot.tsx:219-226`) returns null when `facts.collections` is empty and
no `requiredCollections` exist (none do, deliberately — serve-gate coupling). Union in the
engine-declared keys instead.

**Files touched**
- `src/components/onboarding/wizard/StructureSlot.tsx` — in `CollectionNodes` (:215-238), compute
  `keys = union(present-in-store, requiredCollections (still dormant), collectionKeysForBusinessType(businessTypeKey))`.
  When `businessTypeKey` is null (rung A), fall back to present-only (unchanged behavior). Existing
  empty-state + `commitAdd`/`addCollectionEntry` path (:110-141, :191-202) needs no change — store
  round-trip via `buildBriefPatch` verified sound by fixture (spec).
- `src/modules/collections/registry.test.ts` — NEW small test for `collectionKeysForBusinessType`:
  every businessType resolves to a non-empty key list matching its engine family (saas/app →
  `['products']`, consultant → `['services','case-studies']`, photographer →
  `['services','works']`, manufacturer → `['products']`); unknown/undefined bt → `[]`.

**Steps**
1. Wire the lookup into `CollectionNodes`; do NOT touch `src/modules/businessTypes/config.ts` or the
   serve gate.
2. Registry lookup test.

**Verification**
- `npx tsc --noEmit`; `npm run test:run` full green (esp. `serveGate.test.ts` — proves reachability
  fix didn't re-activate the dormant serve-gate branch; `useWizardStore.test.ts`).
- Manual (`npm run dev`): one-liner entry for a saas persona → 7b shows an empty Products node →
  `+ Add` an entry → advances into the Brief (inspect via wizard state / saved draft).

---

## Phase 4 — live verification 🔒 HUMAN GATE

The spec's single gate: real catalogue-site entry through the product before merge.

**Files touched**
- `docs/task/collections-entry-capture.plan.md` — progress-log updates only. No code.

**Steps / checks (user performs against `npm run dev`, real LLM)**
1. URL entry `https://www.pine64.org`, NO businessType in request → classification correct,
   `facts.collections.products` populated with real product lines (TC-10.1 through the product), 7b
   collection node renders them, slugs collapsed (`widget-co` form).
2. One-liner entry (any collection-capable type) → node renders empty state, manual `+ Add` lands in
   the Brief.
3. Spot-check a service URL (agency-shaped) via understand path if convenient → services/case-studies
   fold, no products leakage.
4. Confirm 1 credit consumed per entry (no change).

**Verification**
- User sign-off on the above before merge to main. `npm run build` green locally before push
  (no-PR workflow).

---

## Resolved questions (orchestrator, 2026-07-10)

1. Union INCLUDES manufacturer's 4 scalar fields (~150 tokens/entry). **Decided: yes** — spec builds
   union from each engine's declarations wholesale; omitting regresses fresh-entry manufacturer.
2. Empty-state node shows ALL engine-declared keys per type (consultant → empty Services + Case
   Studies). **Decided: accepted** — spec wants the node reachable for collection-capable types.
3. Rung-A unknown `businessTypeGuess`: **Decided: fold via tiebreaker engine family** (foreign keys
   drop in fold anyway; `browsing-place`/`quick-yes` → null, no fold).
4. Phase-2 route-test pure-helper fallback: **Decided: implementer discretion.**

## Plan-review (2026-07-10): APPROVED (iteration 1, no blockers)

Fold these non-blocking reviewer notes into implementation:
- **P1 (manufacturer prompt split).** Keep the explicit `manufacturer.entryEnrichmentPrompt()`
  BYTE-IDENTICAL: `entryScalarPrompt()` returns the current TRADE-SUPPLIER wording verbatim; the
  "only if this business makes/supplies physical goods; else empty" conditional wrapper is added by
  `entryUnionEnrichment()` ONLY, never baked into the shared getter. Add a tighter explicit-path
  prompt assertion in `extraction.test.ts` (stronger than the existing `.toContain('TRADE-SUPPLIER')`
  substring) so wording drift into the explicit path fails the test.
- **P3 (one-liner round-trip).** Add ONE automated assertion for the add→Brief round-trip
  (`addCollectionEntry` → `buildBriefPatch` → `facts.collections`) so the "manual + Add works
  end-to-end" criterion isn't human-gate-only. Put it in `useWizardStore.test.ts` or the
  registry/collections test — implementer's call.
- **Minor.** `entryExtractionForSignals` reads `businessTypeGuess`/`tiebreaker` off the raw entry
  data (confirmed present on `EntryScrapeSchema`/`EntryUnderstandSchema` via `entryClassificationFields`).
