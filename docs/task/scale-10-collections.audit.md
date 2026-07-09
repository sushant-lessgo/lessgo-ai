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

---

## Phase 3 — Serve gate: requiredCollections + per-collection demand granularity

### Files changed
- `src/modules/businessTypes/config.ts`
- `src/modules/brief/serveGate.ts`
- `src/modules/brief/serveGate.test.ts`
- `src/app/api/demand-lead/route.ts`
- `src/app/onboarding/[token]/components/ManualOnboardStep.tsx`

### Per-file changes

**`src/modules/businessTypes/config.ts`** (first edit in this feature — phase 1 correctly left it untouched)
- Imported `CollectionKey` type from `@/modules/collections/registry` (registry is pure data → no config↔registry cycle).
- Added `requiredCollections?: readonly CollectionKey[]` to `BusinessTypeEntry`, with a doc block stating the SUPPLY-gate semantics and the DORMANT posture.
- **Populated for NO business type.** Every entry leaves the field unset. Confirmed dormant.

**`src/modules/brief/serveGate.ts`**
- Imported `CollectionKey` (type-only).
- Added exported pure helper `uncoveredCollectionTags(requiredCollections, shortlistCapabilities)`: for each required key, COVERED iff some shortlisted template's capability list `.includes(key)` (the collection key IS the capabilityId). Uncovered keys → `collection:<key>` tags. Vestria's flat-grid `catalog` is not a `CollectionKey`, so a template declaring only `catalog` covers nothing.
- Wired into `decideServe`: for a KNOWN businessType with a non-empty `requiredCollections`, computes the (bridgeable) shortlist, maps to each template's `templateMeta[t].capabilities`, and pushes `uncoveredCollectionTags(...)` into `tags` immediately AFTER the rungC block. Canonical tag order is now `rungC → collection → rungE → bridge → rungA`. Header doc comment updated.
- Gate keys on template capability SUPPLY, never on `facts.collections` data presence — empty collections still serve.

**`src/modules/brief/serveGate.test.ts`**
- New `uncoveredCollectionTags` block (5 cases): covered fixture template → no tag; uncovered → precise `collection:services`; flat-grid `catalog` does NOT cover `products`; multiple keys → one tag per uncovered key; empty required → no tags.
- New `decideServe` wiring block (2 cases): fixture-mutates `businessTypes.saas.requiredCollections=['products']` (restored in `finally`) → manual + `missing:'collection:products'`; and asserts real config leaves it `undefined` (dormant) → still serves. Fixtures/mutation used — does not rely on real config populating the field.

**`src/app/api/demand-lead/route.ts`**
- No allowlist existed: `missing` is `z.string().min(1)` free-form, comma-joined by the serve gate. **No widening or schema/DB change needed.** Added a clarifying comment documenting that `collection:<key>` tags persist as-is (stored via existing `prisma.demandLead.create({ data: { missing } })` and surfaced in the founder email via `leadEmailData`).

**`src/app/onboarding/[token]/components/ManualOnboardStep.tsx`**
- Added `collectionReason(missing)` helper: splits the comma-joined tag string, keeps `collection:*` tags, maps each key to its registry label via `getCollectionDef`, and returns ONE readable sentence (or `null` when no collection tag → screen stays identical to out-of-icp/no-coverage). Raw tag values are never rendered.
- Renders the sentence under the subhead in the pre-submit form only. Header comment updated.

### Granular tag: produced ↔ consumed
- **Produced:** `serveGate.decideServe` → `uncoveredCollectionTags` → `collection:<key>` in `tags`/`missing`.
- **Consumed (persist):** onboarding flow posts `missing` to `/api/demand-lead`; route stores it verbatim (no allowlist), includes it in the founder notification email. Demand board ranks on this string ("N leads blocked on portfolio").
- **Consumed (UI):** `ManualOnboardStep.collectionReason` turns `collection:<key>` into a friendly registry-label sentence for the lead.

### Dormancy confirmation
`requiredCollections` is populated for NO real businessType (mechanism + serve-gate logic + tests only). Both serve-gate branches are exercised solely by fixtures/temporary test mutation. Reason: no live template declares a collection-family capability, so populating (e.g. manufacturer→products, photographer→services) would route EVERY such lead to MANUAL-ONBOARD until rung-C block pairs land — a founder decision gated separately.

### Verification
- `npx tsc --noEmit`: clean (no output).
- `npm run test:run` (full): **103 passed | 1 skipped file; 1727 passed | 3 skipped tests.** serveGate.test.ts: 20 passed. No regressions.

### Open risks
- `collection:<key>` tags share the free-form `missing` column with rung*/out-of-icp tags; demand-board aggregation (separate) must string-match the `collection:` prefix.
- Serve-gate wiring is live-dormant: the moment a founder populates `requiredCollections`, matching leads route to manual immediately (intended demand signal).

### HUMAN GATE (founder decision required)
Which businessTypes (if any) should get `requiredCollections` populated now, accepting they route to MANUAL-ONBOARD until rung-C blocks ship? (Candidates from the plan: manufacturer→`products`, photographer→`services`. Default per plan option: populate none, keep the mechanism dormant.)

---

## Phase 4 — Structure gate (7b): collection node

**Files changed**
- `src/hooks/useWizardStore.ts`
- `src/components/onboarding/wizard/StructureSlot.tsx`
- `src/hooks/useWizardStore.test.ts`

### `src/hooks/useWizardStore.ts`
- New state: `briefFacts: Record<string, unknown> | null` (COMPLETE `brief.facts` snapshot taken at hydrate) and `collections: CollectionsFacts` (editable channel, seeded from `getCollections(brief)`).
- `hydrate` seeds both BEFORE the no-engine early-return guard (`state.briefFacts = brief.facts ?? null; state.collections = getCollections(brief)`), so the snapshot is available for buildBriefPatch regardless of engine.
- Three collection-edit actions (index-targeted, immer):
  - `addCollectionEntry(key, name)` — trims; no-op on empty; inits absent (empty required) collection; pushes `makeCollectionEntry(name)`.
  - `renameCollectionEntry(key, index, name)` — trims; no-op on empty; replaces the entry via `makeCollectionEntry(newName, {oneLiner, imageUrl})` so the **slug is re-derived from the new name** (never keeps old slug), preserving optional fields.
  - `removeCollectionEntry(key, index)` — bounds-checked splice.
  - Index targeting chosen over slug targeting (conservative — unambiguous when two names slugify alike). Logged here as an in-scope judgment call.
- `recomputeRequiredCapabilities` is intentionally NOT invoked by these actions (code comment): collections are a parallel channel and never feed `requiredCapabilitiesFromStructure` (that derives from section topology only). `recomputeRequiredCapabilities` stays coherent — untouched.
- `reset` override list extended with `collections: {}` + `briefFacts: null` (fresh refs, matching the existing fields/proof pattern).

**Sibling-facts survival mechanism (the CRITICAL bit).** `saveDraft` merges the brief shallowly: `{ ...existingBrief, ...briefResult.data }` — a top-level `facts` key in the patch REPLACES the stored `facts` object wholesale (dropping `facts.entry` etc). So `buildBriefPatch` must carry the COMPLETE facts.

Before (phase 3):
```ts
const patch: Partial<Brief> = {};
if (goalIntent) patch.goal = intentToBriefGoal(goalIntent, goalParam);
const structure = buildStructurePatch(state);
if (structure) patch.structure = structure;
return patch;                       // NO facts key ever emitted
```
After (phase 4) — appended before `return patch`:
```ts
if (Object.keys(state.collections).length > 0) {
  patch.facts = {
    ...(state.briefFacts ?? {}),     // ← ALL siblings (facts.entry, …) re-emitted
    collections: state.collections,  // ← edited collections overlaid last
  };
}
```
`facts` is emitted ONLY when the store holds collection state, so earlier-slot autosaves (no collections) never touch persisted facts. When emitted, it is the full snapshot with `collections` overlaid — siblings survive the shallow REPLACE.

### `src/components/onboarding/wizard/StructureSlot.tsx`
- Added `CollectionNode` (one collapsible collection, per-key local `open`/`addValue` state) and `CollectionNodes` (chooses which keys to render). Rendered as `<CollectionNodes />` in BOTH the single-page gate return and the multipage gate return, styled consistently with the existing gate rows (`rounded-lg border` card; gray entry rows; page-title-style rename input; `X` remove; `+ Add` input+button).
- **Which keys render:** union of (a) keys present in `facts.collections` (store `collections`) and (b) the businessType's `requiredCollections` (via `businessTypes[businessTypeKey]?.requiredCollections`) — so an empty required collection still shows a count-only/empty node (decision 2). `CollectionNodes` returns `null` when the union is empty (gates without collections unchanged). Zero-entry nodes render an empty-state hint + the add input (index ships empty-state later).
- Node header shows `Label · N item(s)`; collapsible entry list; each entry is a rename `input` (calls `renameCollectionEntry`), remove `X` (`removeCollectionEntry`); footer add `input` + button / Enter (`addCollectionEntry`, name-only). SEPARATE row type — never calls `toggleStructureSection`.
- Code comment notes: no waterfall change; collections are a parallel whole-list channel, not per-item ASK questions (decision 2).

### `src/hooks/useWizardStore.test.ts`
- New describe block `useWizardStore — 7b collection channel` with a `collectionsThing()` fixture carrying BOTH `facts.entry` (sibling) AND `facts.collections.products` (8 verbatim entries).
- Covers: verbatim seed + code-derived slugs; remove 2 of 8 → 6; rename re-derives slug; add appends name-only entry with derived slug; add initializes an absent (empty required) collection; empty/whitespace add+rename no-ops; **buildBriefPatch round-trip carrying edits AND asserting `patch.facts.entry` survives** (sibling preservation); and buildBriefPatch omits `facts` entirely when no collections exist (`bareThing`).

### Verification
- `npx tsc --noEmit`: clean (no output).
- `npm run test:run` (full): **103 passed | 1 skipped files; 1735 passed | 3 skipped tests.** `useWizardStore.test.ts` (extended, +8 tests), `loadDetection.test.ts` (7), `serveGate.test.ts`, `classify.test.ts`, `collections.test.ts` all green. No regressions.

### Deviations
- Collection actions target entries by **index**, not slug (conservative disambiguation). In-scope choice, no plan conflict.

### Open risks / notes
- `CollectionNodes` renders in the STRUCTURE slot only, which the work engine skips (structure slot skip) — `works` collections for writer/work leads are therefore editor-only, not gate-editable. Consistent with the existing work slot-skip; out of phase-4 scope.
- `briefFacts` is a hydrate-time snapshot; if server-side facts changed after hydrate (not the case in the current entry→hydrate flow, since scrape precedes hydrate) a save would re-emit stale siblings. Acceptable for this wizard's lifecycle.

### Fix (impl-review loop 1 — BLOCKING)
- `StructureSlot.tsx`: the collection entry `<li>` was keyed `${entry.slug}-${idx}`. Since rename re-derives the slug (slugify) on every keystroke, the key changed each keystroke → React remounted the `<input>` → focus lost after one char. Re-keyed to stable `key={idx}` (no per-entry reorder UI; inputs fully store-controlled, so index-keying is safe across add/remove). Slug re-derivation is UNCHANGED. Mirrors the sitemap page-row pattern (stable key, derived value rendered inside). No other change.
- Re-verified: `npx tsc --noEmit` clean; `npm run test:run` 103 passed | 1 skipped files, 1735 passed | 3 skipped tests. Green.
