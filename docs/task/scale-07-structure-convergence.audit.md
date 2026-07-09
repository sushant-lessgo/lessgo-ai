# scale-07 structure convergence — implementation audit

## Phase 1 — Engine-owned section grammar (behavior-preserving wiring)

**Files changed**
- `src/modules/engines/sectionGrammar.ts` (new) — the engine-owned grammar: `buildSectionList()`
- `src/modules/engines/sectionGrammar.test.ts` (new) — exhaustive equivalence matrix vs pre-grammar behavior
- `src/modules/audience/product/sectionSelection.ts` (edit) — `selectProductSections` delegates to grammar via temporary `extras`
- `src/modules/audience/service/sectionSelection.ts` (edit) — `selectServiceSections` delegates to grammar; ordering maps become grammar ordering data

### Grammar API (as settled)

```ts
buildSectionList({ engine, brief?, ordering?, gates?, extras? }) → string[]
```

- `engine: CopyEngine` → core from `engineCoreSections` (frozen scale-01 contract).
- `ordering?: readonly string[]` — resolved MIDDLE order (caller resolves awareness → order via its map; grammar stays template-free / firewalled — zero template/templateMeta/registry imports). Omitted ⇒ core minus header/footer.
- `gates?: SectionGates` — `{ hasTestimonials?, showPackages?, hasClientLogos?, hasCaseStudies? }`. Filter law verbatim from old `selectServiceSections`: `testimonials`→hasTestimonials, `packages`→showPackages (`format !== 'quote-only'`), `logos`→hasClientLogos, `casestudies`→hasCaseStudies; everything else (incl. surge `about`/`stats`) always passes. Defaults: asset flags `?? false`, `showPackages ?? true` (mirrors `undefined !== 'quote-only'`).
- `extras?: readonly string[]` — full-list verbatim override for meridian/vestria pilot lists. Marked `@deprecated — removed in scale-07 phase 2`.
- `brief?` — reserved, unused in phase 1 (phase-2 capability sections).
- Wrap: header/footer prepended/appended iff present in the engine core (`[header, ...body, footer]` for thing/trust; work core has no header — untouched/unwired this phase).

### Rewire details

- **Service:** `AWARENESS_MIDDLE_ORDER` / `SURGE_MIDDLE_ORDER` kept in place as data; selector resolves `orderMap[awareness] ?? orderMap['search-aware-comparing']` (fallback preserved) and calls the grammar with `engine:'trust'` + ordering + gates. Public signature (`ServiceSectionSelectionInput` incl. `goal`) unchanged.
- **Product:** `MERIDIAN_PILOT_SECTIONS` / `VESTRIA_PILOT_SECTIONS` exports kept; selector passes the chosen list through `extras`. Signature unchanged.
- Callers (`parseStrategyProduct.ts`, `parseStrategyService.ts`, mock generators) untouched. `work` engine NOT wired.

### Byte-identical proof (fixture approach)

`sectionGrammar.test.ts` — 123 tests:
1. **Frozen reference impl** — verbatim copy of the pre-rewire `selectServiceSections` logic + both ordering maps, frozen inside the test file; the live selectors are asserted equal to it across the full matrix.
2. **Literal anchors** (7) — hard-coded expected arrays pinning the reference itself (trust baseline, no-testimonials+quote-only, cold order, surge all-on 11-list, surge nothing-on quote-only, meridian/vestria pilot lists verbatim).
3. **Trust default matrix** — {undefined, hearth, lex} × 4 awareness × hasTestimonials × format(quote-only|packages) = 48 cases.
4. **Surge matrix** — 4 awareness × hasClientLogos × hasCaseStudies × hasTestimonials × format = 64 cases; each also asserts logos/casestudies/testimonials/packages gating booleans and always-on `about`/`stats`.
5. Awareness-fallback case (cast out-of-range value ⇒ comparing order) + product `extras` pass-through (fresh-array, verbatim).

### Deviations

- Plan sketch left `extras` semantics open (append vs override). Vestria's pilot order interleaves extras between core sections, so append can't reproduce it — implemented `extras` as full-list verbatim override (conservative, exactly reproduces current output; deleted in phase 2 anyway).
- Trust matrix widened to ×3 templateIds (undefined/hearth/lex) beyond the plan's "hearth/lex" wording — free coverage of the undefined branch.
- Added the awareness-fallback test (not in the plan matrix) to lock the `?? 'search-aware-comparing'` behavior.

### Test results

- `npx tsc --noEmit` — clean (no output).
- `npm run test:run` — `Test Files 91 passed | 1 skipped (92)` · `Tests 1389 passed | 2 skipped (1391)` — existing section-selection/wizard/trust tests green unchanged (no existing test edited).
- `npx vitest run src/modules/engines/sectionGrammar.test.ts` — `Test Files 1 passed (1)` · `Tests 123 passed (123)`.

### Open risks

- Grammar's no-`ordering` default path (core-minus-header/footer middle) is not exercised by any production caller yet — first real consumer is phase 2.
- `brief` param is a placeholder (`unknown`); phase 2 types it when capability resolution lands.

## Phase 2 — meridian/vestria core convergence + capability-section mapping

**Files changed**

- `src/types/brief.ts` (edit)
- `src/modules/templates/templateMeta.ts` (edit)
- `src/modules/templates/fit.ts` (edit)
- `src/modules/engines/sectionGrammar.ts` (edit)
- `src/modules/audience/product/sectionSelection.ts` (rewrite)
- `src/modules/engines/structureConvergence.test.ts` (new)
- `src/modules/templates/conformance.test.ts` (edit — strengthened)
- `src/modules/engines/sectionGrammar.test.ts` (edit — blast-radius refresh)
- `src/modules/audience/product/strategy/clampSitemap.test.ts` (edit — blast-radius refresh)

NOT changed (checked, no-op confirmed): `src/lib/schemas/brief.schema.ts` (capability enum NOT mirrored there — only `copyEngines`/`designStyles` imported; nothing to mirror), `src/modules/prompt/mockResponseGeneratorProduct.ts` (calls `selectProductSections`, no deleted-constant refs; vestria mock rides the sitemap branch), `src/modules/audience/product/selectBlocks.ts` (converged thing-core is a subset of both layout maps), `e2e/render.spec.ts` + `e2e/generation.spec.ts` (no literal section-list assertions; `length >= 5` still holds), `src/modules/audience/__tests__/generationContract.test.ts` (relational assertions, green unchanged), golden real-LLM fixtures (`e2e/fixtures/generated/` does not exist — GOLDEN block self-skips).

### Per-file detail

- **`src/types/brief.ts`** — minted 5 NEW capability ids `trust, industries, about, materials, process` in the frozen `capabilityIds` vocab (founder-approved extension), with an explicit-trigger doc comment pointing at `EXPLICIT_TRIGGER_CAPABILITIES`.
- **`src/modules/templates/templateMeta.ts`** — exact capabilitySections entries added (capabilityId → evidencing section):
  - meridian: `capabilities: ['lead-form', 'packages']`; `capabilitySections: { 'lead-form': 'cta', packages: 'pricing' }`
  - vestria: `capabilities: ['multipage', 'lead-form', 'catalog', 'trust', 'industries', 'about', 'materials', 'process']`; `capabilitySections: { 'lead-form': 'contact', catalog: 'catalog', trust: 'trust', industries: 'industries', about: 'about', materials: 'materials', process: 'process' }`
- **`src/modules/templates/fit.ts`** — added exported `EXPLICIT_TRIGGER_CAPABILITIES = ['trust','industries','about','materials','process']` with a "do not add derivation rules without a founder gate" doc. `requiredCapabilitiesFromBrief()` LOGIC UNCHANGED — its only sources (businessType entry caps, M1→lead-form, download-app→store-badges, multi→multipage) cannot produce the 5 ids; confirmed by exhaustive test (below). catalog/lead-form/packages triggers untouched (catalog and packages have NO brief auto-trigger today — none added; "keep whatever auto-trigger they already have" = none).
- **`src/modules/engines/sectionGrammar.ts`** — deleted the `extras` escape hatch and the `brief?: unknown` placeholder. Added `requiredCapabilities` + `capabilitySections` params (plain data — module stays firewalled, still zero template imports; only `@/types/brief` + `./coreSections`). Capability section appended iff required AND declared; appended after the ordered middle in canonical `capabilityIds` order (deterministic); deduped against already-present sections; header/footer can never be re-added by a capability entry.
- **`src/modules/audience/product/sectionSelection.ts`** — `MERIDIAN_PILOT_SECTIONS`/`VESTRIA_PILOT_SECTIONS` DELETED. `selectProductSections` = thin grammar call: looks up `templateMeta[templateId].capabilitySections` (audience layer — allowed), unions Brief-derived caps (`requiredCapabilitiesFromBrief`) with an optional explicit `requiredCapabilities` param (the future 7b-gate entry point).
- **`src/modules/engines/structureConvergence.test.ts`** (new) — proves: (1) no-capability Brief ⇒ meridian == vestria == thing-core `[header,hero,features,testimonials,footer]` (the phase invariant); (2) catalog required ⇒ vestria adds `catalog`, meridian does NOT; (3) packages ⇒ meridian `pricing`, vestria core-only; (4) lead-form (saas auto-trigger) ⇒ meridian `cta` / vestria `contact` (same skeleton+capability, each template's own evidence block); (5) the 5 explicit-trigger ids render only via explicit inclusion and only on vestria; (6) exhaustive auto-inference check — every businessType × M1 × download-app × multi never derives any of the 5; (7) grammar dedupe + structural-cap (multipage) contributes no section.
- **`src/modules/templates/conformance.test.ts`** — ADDED "(b+)" block: every `capabilitySections` VALUE (map-driven, not declaration-driven) resolves to a real non-placeholder block in BOTH renderers, plus a no-orphan-evidence check (every map key is in the declared capabilities list). Existing (a)/(b) untouched. The plan's "engine-core list convergence per template pair" assertion lives in structureConvergence.test.ts (engine-layer concern), per plan step 4.

### Golden / fixture blast radius (each diff = intended convergence)

1. **`src/modules/audience/product/strategy/clampSitemap.test.ts`** — meridian single-page expectation:
   - before: `['header','hero','features','testimonials','pricing','cta','footer']` ("fixed 7 sections — behavior unchanged")
   - after: `['header','hero','features','testimonials','footer']` (converged thing-core; pricing/cta now enter only via packages/lead-form capabilities)
2. **`src/modules/engines/sectionGrammar.test.ts`** — removed the phase-1 product pilot-list anchors + `extras` pass-through tests (they tested deleted code):
   - meridian anchor before: the 7-list above; vestria anchor before: `['header','hero','trust','industries','about','features','catalog','materials','process','testimonials','contact','footer']` (12)
   - after: coverage replaced by structureConvergence.test.ts (core+capabilities). Service (trust) equivalence matrix untouched — trust behavior is out of phase-2 scope and stays byte-identical.
3. `captureGolden.test.ts` (`src/modules/audience/__tests__/`) — NOT edited: CAPTURE=1-gated, builds its strategy live via the mock generator (no embedded section list); `e2e/fixtures/generated/` does not exist so the frozen-capture validation self-skips. No stale fixture to refresh.
4. `e2e/render.spec.ts` — NOT edited: zero vestria/meridian section-presence assertions (grepped).
5. Generation-contract frozen fixture (`generationContract.test.ts`) — NOT edited: THING fixture derives uiblocks/sections relationally from the live strategy; green under the converged list.

**Runtime effect (deliberate, per plan):** meridian single-page auto-generation shrinks 7 → 5 (loses pricing+cta) and vestria's `selectProductSections` path shrinks 12 → 5, because the runtime callers (`parseStrategyProduct.ts:156`, mock generator) pass only `templateId` — no Brief is plumbed to that call site until phases 4/6 (7b gate). Vestria's REAL pipeline is mostly unaffected today: it takes the sitemap/page-archetype branch (`menu` non-null), untouched this phase per plan step 5.

### Explicit-trigger confirmation

`trust, industries, about, materials, process` are NOT auto-inferred: `requiredCapabilitiesFromBrief()` logic unchanged; `EXPLICIT_TRIGGER_CAPABILITIES` documents+exports the contract; structureConvergence.test.ts exhaustively drives every businessType with the maximal deriving Brief (M1 + download-app + multi) and asserts none of the 5 appear. They enter only via `selectProductSections({ requiredCapabilities })` — the 7b-gate hook (phase 4).

### Deviations

- **Edited 2 test files outside the printed Files-touched list** (`sectionGrammar.test.ts`, `clampSitemap.test.ts`): both carried pre-convergence expected section lists / imports of the deleted constants — compile/tests break without the refresh. Treated as the orchestrator-authorized "golden blast radius — refresh DELIBERATELY" category (same nature as the enumerated fixtures); each diff documented above. No non-test source outside the list was touched.
- `selectProductSections` gained an optional `requiredCapabilities` param (not spelled out in the plan): needed to honestly assert "a Brief requiring catalog" (no auto-trigger derives catalog from any Brief today) and it is the designed 7b-gate entry point. Conservative: absent ⇒ behavior identical to Brief-only.
- Stale comments referencing the deleted constants remain in `src/modules/audience/README.md` and `src/modules/audience/product/elementSchema.ts:274` (comment-only, files not in scope — left for phase 8/9 doc pass).
- `docs/task/scale-07-structure-convergence.plan.md` shows modified in git status — pre-existing orchestrator edit (phase-1 commit sha in progress log), not mine.

### Test results

- `npx tsc --noEmit` — clean (no output).
- `npm run test:run` — `Test Files 92 passed | 1 skipped (93)` · `Tests 1437 passed | 2 skipped (1439)`. Conformance (incl. new (b+) block), structureConvergence (new), dispatch regression, generation contract, service equivalence matrix: all green.

### Open risks

- Meridian auto-generated pages lose pricing/cta until Brief/7b plumbing lands (phases 4/6) — intended convergence, but a real meridian generation done BETWEEN phase-2 merge and phase-4 would ship a 5-section page with the CTA capability un-triggered (M1 briefs restore `cta` once the Brief reaches the call site). Flag at the phase-9 merge gate.
- Capability sections append AFTER the core middle (before footer) — vestria's old interleaved order (trust/industries/about before features) is not reproduced; ordering refinement belongs to the 7b gate/ordering table if the founder wants it.

## Phase 3 — Restore multipage fan-out + strategy-before-structure sequencing

**Files changed**
- `src/modules/wizard/generation/thing.ts` (edit) — strategy call extracted into exported `runStrategy(input)`; `runThingGeneration` tail delegates to it (fallback only)
- `src/modules/wizard/generation/index.ts` (edit) — re-exports `runStrategy` + `RunStrategyResult` (module surface)
- `src/hooks/useWizardStore.ts` (edit) — `fetchStrategy` action + `strategyStatus`/`strategyError`/`strategyCreditsError` state; exported shared `buildThingInput(state)` projection (+ `fieldStr`/`fieldArr`)
- `src/components/onboarding/wizard/StructureSlot.tsx` (edit) — fires `fetchStrategy` on mount; real loading + error/credits/retry states; header comment updated (sourcing deviation resolved)
- `src/components/onboarding/wizard/GeneratingSlot.tsx` (edit) — local `buildThingInput`/`fieldStr`/`fieldArr` deleted; now imports the store's shared projection (behavior identical)
- `src/modules/wizard/generation/thing.test.ts` (edit) — `runStrategy` unit tests + no-refetch assertions on the pre-gate paths
- `src/hooks/useWizardStore.test.ts` (edit) — `fetchStrategy` populate/idempotency/concurrency/402-retry/no-clobber tests + `buildThingInput` projection test

### runStrategy extraction shape

`thing.ts` exports:

```ts
type RunStrategyResult =
  | { status: 'done'; strategy: ProductStrategyOutput }
  | { status: 'credits' }
  | { status: 'error'; error: string };
runStrategy(input: ThingGenerationInput): Promise<RunStrategyResult>
```

Body is the old inline tail fetch VERBATIM: same `buildStrategyPayload(input)` builder, same `/api/audience/product/strategy` POST, same `isCreditFail` (402 or /credit/i) detection. The sitemap clamp was never client-side — `clampSitemap` runs server-side inside `assembleProductStrategy` (route step 5) — so calling the SAME route preserves the clamp path unchanged. `runThingGeneration`'s `if (input.strategy)` branch is now the PRIMARY path (comment updated); the tail `runStrategy` call survives as fallback for structure-skipping flows (and returns the credits/error result shapes unchanged, so GeneratingSlot's chrome behaves as before).

### Credit-charge-once proof

- The charge lives SERVER-side: `/api/audience/product/strategy` route step 6 (`consumeCredits(STRATEGY_GENERATION)`) — one charge per HTTP call. So "fetch exactly once" == "charge exactly once".
- **Where it fires now:** `useWizardStore.fetchStrategy()` (triggered by StructureSlot mount) → `runStrategy` → one route call. On success it writes `setStrategy(result)` + `setSitemap(result.strategy.sitemap)` (per plan: caller writes the store).
- **GeneratingSlot does NOT double-charge:** `buildThingInput` forwards store `strategy`/`sitemap` → `runThingGeneration` hits `if (input.strategy)` and NEVER reaches the tail `runStrategy`. Asserted in tests: multi-page vestria run and pre-gate single-page run both assert ZERO `/strategy` calls during generation (`thing.test.ts`).
- The tail fallback only fires when `input.strategy` is null — i.e. the pre-gate fetch never happened (or failed and the user continued past the slot); in the failure case no charge occurred at the slot, so the generation-time fetch is still the FIRST charge, not a second.

### Idempotency guard mechanism

`fetchStrategy` guards on `strategyStatus`:
- `'fetching' | 'done'` ⇒ immediate return (back-navigation remounts StructureSlot; its mount effect calls `fetchStrategy` again → no-op → no refetch, no second charge).
- Status flips to `'fetching'` SYNCHRONOUSLY before the first `await`, so concurrent same-tick calls collapse to one fetch (test: `Promise.all` double-call ⇒ 1 strategy call).
- `'error'` re-arms the guard ⇒ the slot's Retry button works (test: 402 then retry ⇒ 2nd call allowed).
- Pre-seeded `strategy` (non-null) ⇒ marked `'done'` with zero network.
- Sitemap seeding respects prior user edits: `setSitemap` only when store sitemap is null (never clobbers an edited draft; tested).
- Error path: slot shows retry (generic) or out-of-credits chrome (View plans link, mirroring GeneratingSlot's credits screen); WizardShell's Back/Continue nav stays rendered, so the user is never trapped.

### Runtime flow (reasoned; dev-server QA deferred to phase 9)

- **Vestria (multipage):** onboarding → structure slot mounts → `fetchStrategy` → `/strategy` route (charges once, prompt gets page-archetype menu, `clampSitemap` law applied server-side) → store `strategy`+`sitemap` populated → gate renders the REAL editable sitemap (edits via `setSitemap`) → Continue → GeneratingSlot → `buildThingInput` forwards non-null strategy+sitemap → `thing.ts` `input.strategy && input.sitemap?.length` truthy → skeleton save + `runFanOut` (per-page copy; a page removed at the gate is absent from `input.sitemap` ⇒ NO copy call for it; within a page, removed sections are absent from `page.sections` ⇒ no copy for them either).
- **Meridian (single-page):** thing contract has `slotSkips=[]` ⇒ hits the structure slot too → strategy fetched there (menu null ⇒ no sitemap in response; store sitemap stays null) → `input.strategy` truthy, `input.sitemap?.length` falsy → `runCopyAndSave(input.strategy)` — strategy fetched once at the slot, zero fetches at GeneratingSlot. Output unchanged (same payload builder, same route).
- **Trust/work:** untouched — they skip the structure slot (`slotSkips`), `fetchStrategy` never fires, and their adapters are unmodified.

### Deviations

- **Test files edited outside the printed Files-touched list** (`thing.test.ts`, `useWizardStore.test.ts`): the task's verification step explicitly requires "add/adjust tests for the new fetch action + idempotency guard"; these are the companion test files of two in-scope modules. No non-test file outside the list touched.
- **`buildThingInput` moved from GeneratingSlot into useWizardStore (exported):** the store's `fetchStrategy` needs the store→adapter projection, and duplicating it would let the pre-gate payload drift from the generation payload (a silent double-source bug). Moving it store-side gives ONE projection; GeneratingSlot imports it (no cycle — the store never imports the slot). `fieldStr`/`fieldArr` moved+exported alongside (still used by GeneratingSlot's trust/work builders).
- `fetchStrategy` loads the thing adapter via dynamic `import()` so the generation tree stays out of the store's static import graph (store firewall note preserved; type imports only at module top).
- Conservative UI choice: while the strategy fetch is in flight on a single-page template (meridian), the slot shows the same loading state, then the existing "single-page site" note — the KNOWN INTERMEDIATE WART stands: meridian's structure slot fetches strategy but has no single-page structure UI until phase 4 (cosmetic; tests green).
- StructureSlot's defensive "no draft" placeholder retained for the (theoretically unreachable) multi-page + strategy-done + no-sitemap combination.

### Test results

- `npx tsc --noEmit` — clean (no output).
- `npm run test:run` — `Test Files 92 passed | 1 skipped (93)` · `Tests 1449 passed | 2 skipped (1451)` (phase-2 baseline 1437 + 12 new assertions across thing.test.ts and useWizardStore.test.ts; existing multi-page smoke extended with a no-refetch assertion).

### Open risks

- The `structure` slot precedes `generating`, so a user who abandons the wizard AFTER the structure slot has paid the strategy charge (2 credits) without a generated page — same exposure the old SitemapReviewStep had; acceptable per plan (the gate must render real data).
- Strategy status lives only in the client store: a full page reload between structure and generating loses `strategy`/`sitemap` → GeneratingSlot's fallback refetches (a second charge across SESSIONS, not within a run). Pre-existing store-lifetime semantics (old wizard identical); persistence of confirmed structure is phase 6.
- Meridian structure slot = strategy fetch + "single-page" note only until phase 4 (known wart, cosmetic).
