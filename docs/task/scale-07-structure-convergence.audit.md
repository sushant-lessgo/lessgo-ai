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

## Phase 4 — Universal 7b gate: single-page mode + clamp law + trust GA

**Files changed**
- `src/modules/engines/inputContracts.ts` (edit) — trust `slotSkips: ['structure']` → `[]` (7b GA, founder Q2 resolved); new `lockedSectionsForEngine(engine)` helper
- `src/modules/audience/product/strategy/parseStrategyProduct.ts` (edit) — step-0 Brief plumbing (`brief`/`requiredCapabilities` on `AssembleProductStrategyInput`, forwarded to `selectProductSections` on the single-page branch); new `clampSectionList()` (the clampSitemap law generalized to a flat single-page list) + generic `applyConfirmedSections()`
- `src/modules/audience/service/strategy/parseStrategyService.ts` (edit) — new `applyConfirmedStructure()` (service-typed wrapper over the shared clamp law; confirmed structure filters sections + uiblocks before copy)
- `src/modules/wizard/generation/trust.ts` (edit) — `runTrustStrategy()` extracted (mirrors phase-3's thing `runStrategy`); pre-gate handoff (module-scoped, tokenId-keyed); `TrustGenerationInput` gains optional `strategy`/`confirmedSections`; `runTrustGeneration` consumes the pre-gate strategy (never refetches) + applies confirmed structure via the clamp law
- `src/hooks/useWizardStore.ts` (edit) — single-page structure state (`structureSections`, `structureDisabled`) + actions (`setStructureSections` / `toggleStructureSection` / `moveStructureSection`); engine-aware `fetchStrategy` (trust branch); `buildTrustInput()` exported; `buildThingInput` applies the confirmed single-page reduction; `confirmedStructureBody()` helper
- `src/components/onboarding/wizard/StructureSlot.tsx` (edit) — SINGLE-PAGE mode UI (one section list, locked required rows, toggle-OFF-only optionals, up/down reorder with hero pinned, NO add-section, 1-tap accept via the shell's Continue); multipage (vestria) branch untouched
- `src/hooks/useWizardStore.test.ts` (edit) — trust slot order includes structure; single-page toggle/reorder/locked fixtures; clamp-law suite; step-0 proof; trust charge-once end-to-end + toggle-off ⇒ no-copy acceptance

### Step-0 Brief plumbing proof (meridian regains cta/pricing)

`assembleProductStrategy` single-page branch now calls `selectProductSections({ templateId, brief, requiredCapabilities })` (was `{ templateId }` only). Test proof (useWizardStore.test.ts, "step-0 Brief plumbing"): an M1 Brief (`goal.mechanism === 'M1'` ⇒ lead-form capability) plus explicit `packages` capability under meridian yields a single-page list containing **cta** AND **pricing**, with real uiblock mappings; the no-brief baseline stays the bare 5-core (phase-2 interim behavior preserved). Scope note: the strategy ROUTE (`/api/audience/product/strategy`) is not in this phase's Files-touched (it is in phase 5's) and carries no Brief in its request today — runtime meridian generations stay 5-core until the route/client passes `brief`/`requiredCapabilities` (phase 6 recomputes requirements client-side and holds the required set in the store). The selector/assembler side is fully plumbed and tested. Service mirror (parseStrategyService.ts:41): NOT needed — trust capability sections (lead-form→cta, packages→packages) are already trust CORE sections, and surge deltas are gated by asset flags already plumbed; noted, no change.

### Single-page clamp law (`clampSectionList`)

Same law as `clampSitemap`, over a flat body list: unknown sections dropped (no adds), duplicates deduped (first wins), locked engine-core sections forced present at their canonical relative position, **hero forced first**, header/footer chrome forced exactly from the canonical list (never user-controlled), empty/absent proposal ⇒ canonical (default accept). Slugs: N/A single-page (no pages ⇒ nothing for the AI to name); the multipage half of the law stays in `clampSitemap`. Applied at TWO points: `buildThingInput` (thing single-page) and `runTrustGeneration` (trust), always with `lockedSectionsForEngine(engine)`.

Required-locked derivation: locked = engine core minus chrome minus contract `dropTarget`s ⇒ thing `hero, features`; trust `hero, services, cta` (testimonials/packages are dropTargets, hence toggleable — consistent with the proof hard rule). Enforced in the UI (disabled toggle, "required" badge) AND at state level (`toggleStructureSection` refuses locked ids) AND at the law (forced re-insertion).

### Trust GA + charge-once / idempotency trace

- inputContracts trust `slotSkips` → `[]`: `slotsForEngine()` picks it up automatically ⇒ every trust user hits the 7b structure slot at merge (founder-accepted, Q2).
- Pre-gate fetch: StructureSlot mount → store `fetchStrategy` → status guard (`fetching|done` ⇒ no-op; status flips to `fetching` synchronously before any await, so same-tick concurrent calls collapse) → trust branch lazy-imports `runTrustStrategy(buildTrustInput(state))` → server charges ONCE in `/api/audience/service/strategy` → result seeds `strategy` + `structureSections`.
- Generation: `runTrustGeneration` prefers `input.strategy`, else the tokenId-keyed pre-gate handoff — found ⇒ **zero refetch** (test-proven: exactly 1 strategy call across gate fetch + generation). Copy-failure retries reuse the handoff (no re-charge — an improvement over the old inline flow, which refetched strategy on every retry); the handoff is cleared only on a DONE run so stale strategy can't leak into a later run. Fallback (no pre-gate, e.g. legacy/skipping flow): one self-fetch, single charge.
- Reload between structure and generating loses the client store ⇒ refetch at the re-visited slot (a cross-SESSION second charge) — same semantics as thing since phase 3; phase-6 step 3b addresses it.

### Toggle-off → no-copy mechanism

Gate list = strategy's BODY sections seeded into `structureSections`; toggles accumulate in `structureDisabled` (re-enable allowed — membership never grows, so "no adds" holds). Confirmed body = sections minus disabled, in (possibly reordered) list order. THING: `buildThingInput` clamps + reduces `strategy.sections` AND `strategy.uiblocks` before the adapter — `runCopyAndSave` copies only `strategy.sections`. TRUST: every structure mutation syncs the confirmed body into the trust pre-gate handoff; `runTrustGeneration` applies `applyConfirmedStructure` before `buildCopyPayload`. Acceptance test: testimonials toggled off ⇒ the copy request's `strategy.sections` = `[header, hero, services, packages, cta, footer]` and `uiblocks` (both payload spots) lack `testimonials` ⇒ zero testimonial copy.

### Deviations

1. **Trust pre-gate handoff (module-scoped in trust.ts, tokenId-keyed) instead of forwarding `strategy`/`confirmedSections` through GeneratingSlot's trust projection.** `GeneratingSlot.tsx` builds `TrustGenerationInput` locally and is NOT in this phase's Files-touched, so the gate-fetched strategy + confirmed structure could not ride the input without editing it. The bridge lives entirely in trust.ts (in scope); explicit `input.strategy`/`input.confirmedSections` ALWAYS win over it, and it is documented for deletion once GeneratingSlot is consolidated onto the store's exported `buildTrustInput`. Recommended follow-up (3-line GeneratingSlot change): forward `strategy: s.strategy`, `confirmedSections: confirmedStructureBody(s)`.
2. **`buildTrustInput` duplicated** — the store's new export mirrors GeneratingSlot's local projection (same field mapping); drift risk flagged in both docstrings; consolidate with (1).
3. **New phase-4 tests all live in `useWizardStore.test.ts`** (the listed test file), including clamp-law, step-0 and trust end-to-end suites that arguably belong beside parseStrategyProduct/trust — kept in-list deliberately.
4. **Handoff cleared on DONE** (not in the plan text): keeps trust.test.ts's pre-existing 402 fixture honest and prevents stale-strategy leakage between runs; error/credits paths keep it (retry charge-once preserved).
5. **Reorder bounds**: hero pinned first (state-level refusal of any move involving hero); chrome is never user-facing; other body sections (locked included) may reorder. Conservative reading of "reorder within allowed bounds" — the clamp re-forces hero-first + chrome regardless.

### Test results

- `npx tsc --noEmit` — clean.
- `npm run test:run` — **Test Files 92 passed | 1 skipped (93) · Tests 1472 passed | 2 skipped (1474)** (phase-3 baseline 1449 + 23 new). New/updated coverage: trust slot order includes `structure` (acceptance fixture drives the wizard engine directly); single-page seed/toggle/locked/reorder; clamp-law matrix (unknown / dupes / locked-forced / hero-first / chrome / empty / reorder); step-0 meridian cta+pricing; trust fetch idempotency, end-to-end charge-once (1 strategy call across gate + generation), toggle-off ⇒ no testimonial copy, fallback single self-fetch. Pre-existing trust/thing adapter + sectionSelection + clampSitemap + proofFilter suites green unchanged.

### Open risks

- Trust pre-gate handoff is hidden coupling (store → trust module) until GeneratingSlot forwards the fields; flag for the next phase touching GeneratingSlot.
- Runtime meridian single-page lists remain 5-core until the strategy route/client passes Brief-derived capabilities (phase 5/6) — the meridian gate therefore shows no cta/pricing rows yet.
- Manual dev pass (thing single-page + one trust flow) still owed per the plan's verification line — deferred to the phase-9 QA sweep.
- Trust structure-slot reload re-charges strategy across sessions (parity with thing); phase-6 step 3b.

## Phase 5 — Multipage keyed by capability (sitemap for all) + phase-4 carryovers

**Files changed**
- `src/modules/audience/product/pageArchetypes.ts` (edit) — `getPageArchetypesForTemplate` re-keyed off the `multipage` capability + archetype registry; new `isMultipage()` helper
- `src/modules/businessTypes/config.ts` (edit) — `structureDefault: 'single' | 'multi'` on `BusinessTypeEntry` + all 6 entries
- `src/app/api/audience/product/strategy/route.ts` (edit) — detection via `isMultipage`; carryover (a): optional `brief` + `requiredCapabilities` in the request schema, forwarded to `assembleProductStrategy`
- `src/modules/audience/product/strategy/parseStrategyProduct.ts` (edit) — `assembleProductStrategy` menu detection via `isMultipage(templateId, brief)`
- `src/components/onboarding/wizard/StructureSlot.tsx` (edit) — multi/single mode via `isMultipage` (capability + businessType signal); header comment updated
- `src/modules/wizard/generation/thing.ts` (edit) — `explicitVestria` → `isMultipage()` check; all 7 `templateId:'vestria'` payload hardcodes → `resolvedTemplateId` (= `input.templateId ?? PILOT_TEMPLATE`); carryover (a) client side: `buildStrategyPayload` sends `brief: { goal }`
- `src/components/onboarding/wizard/GeneratingSlot.tsx` (edit) — carryover (b): local trust projection DELETED; consolidated onto the store's exported `buildTrustInput` (which forwards `strategy` + `confirmedSections`)
- `src/modules/wizard/generation/trust.ts` (edit) — carryover (b): module-scoped `pregate` bridge DELETED (var + `setConfirmedTrustStructure` + `resetTrustPregateForTest` + all read/write/clear sites); `runTrustGeneration` consumes `input.strategy`/`input.confirmedSections` directly
- `src/modules/audience/product/pageArchetypes.test.ts` (new) — re-key regression suite (see below)
- `src/app/api/audience/product/strategy/route.test.ts` (new) — carryover (a) route-level proof
- `src/hooks/useWizardStore.ts` (edit — **out-of-list deviation, see Deviations 1**) — `buildTrustInput` forwards `strategy`/`confirmedSections`; dead `syncTrustConfirmedStructure` + its 3 call sites deleted; comments updated
- `src/hooks/useWizardStore.test.ts` (edit — deviation 1) — `resetTrustPregateForTest` import/call + `flushAsync` bridge helper removed; stale bridge comments updated (assertions unchanged)
- `src/modules/wizard/generation/thing.test.ts` (edit — deviation 2) — strategy-payload mirror kept in lockstep (`brief`/`requiredCapabilities`); +1 test pinning the Brief-goal forward

### `isMultipage` helper shape (plan step 1)

```ts
// src/modules/audience/product/pageArchetypes.ts (data layer — imports only
// templateMeta + businessTypes config, both pure data; firewall preserved)
isMultipage(templateId, brief?): boolean
  = template declares 'multipage' (templateMeta)            // hard gate
    ∧ ( brief.structure.mode === 'multi'  ⇒ true            // explicit wins
      | brief.structure.mode === 'single' ⇒ false
      | businessTypes[brief.businessType].structureDefault  // 'multi' ⇒ true
      | no Brief signal at all            ⇒ true )          // capability alone
```

- The "no Brief signal ⇒ capability decides" tail is a deliberate addition to the plan's formula: the detection sites mostly have NO brief today (thing.ts fan-out, vestria runs whose payload brief carries only `goal`), and the strict `capability ∧ (mode-multi ∨ default-multi)` reading would have flipped vestria to single-page — a behavior break the plan explicitly forbids ("behavior is identical, the KEY is now honest").
- `getPageArchetypesForTemplate(templateId, registry?)`: `multipage` capability (templateMeta) ∧ registry entry ⇒ menu, else null. Registry keyed by owning template (`{ vestria: VESTRIA_PAGE_ARCHETYPES }`); optional `registry` param is test-injection only.
- All 3 detection sites call it: route (`isMultipage(data.templateId, data.brief)` gates the menu + sitemap schema), `assembleProductStrategy` (`isMultipage(templateId, brief)` gates the sitemap branch), StructureSlot (`isMultipage(templateId, { businessType: businessTypeKey })` picks multi vs single mode — the store does not retain `brief.structure`, so businessType is the available Brief-side signal until phase-6 persistence). thing.ts's fan-out/style branch calls `isMultipage(input.templateId)`.

### Grep-gate result (`'vestria'` literals in thing.ts + detection sites)

```
$ grep -n "'vestria'" thing.ts route.ts parseStrategyProduct.ts StructureSlot.tsx pageArchetypes.ts
src/modules/wizard/generation/thing.ts:72:  templateId: 'meridian' | 'vestria' | 'techpremium' | null;
src/modules/wizard/generation/thing.ts:297:  // scale-07 phase 5 re-key: was `templateId === 'vestria'`. Multipage is a
src/app/api/audience/product/strategy/route.ts:63:  templateId: z.enum(['meridian', 'vestria']).optional(),
```

Survivors (all justified, none is detection logic):
1. `thing.ts:72` — the `ThingGenerationInput.templateId` TYPE union (which product templates the adapter accepts). A type contract, not a branch.
2. `thing.ts:297` — comment describing the re-key.
3. `route.ts:63` — the request-schema templateId WHITELIST (which ids the route accepts at all) — input validation, not multipage detection; widening it is a template-catalog decision outside this phase.
4. (unquoted) `pageArchetypes.ts` registry key `vestria:` — the menu DECLARATION owned by vestria; per-template data is exactly where the plan wants it.
Zero `'vestria'` detection branches remain; all 7 payload hardcodes in thing.ts (selectProductBlocks / per-page copy templateId / mergePageIntoFinalContent / injectImagesForPage / skeleton saveFC / runCopyAndSave templateId trio / leadForm guard) now use `resolvedTemplateId` / `multipageTemplate`.

### `structureDefault` importer re-grep (plan step 3)

`businessTypes/config` importers re-grepped (23 hits): `waterfall.ts` (+test), `acceptance.test.ts`, `schemas/extraction/index.ts` (+test), `useWizardStore.ts`, `entryClassify.schema.ts`, `pageArchetypes.ts` (new, mine), `fit.ts`, `SlotReviewCard.tsx`, `ProofSlot.tsx`, `v2/understand`, `GoalSlot.tsx`, `v2/scrape-website`, `config.test.ts`, `serveGate.ts`, `playback.ts`, `classify.ts` (+test), `bridge.ts`, `structureConvergence.test.ts`, `inputContracts.ts` (comment only). None validates entry shape exhaustively or rejects extra fields (`config.test.ts` checks specific fields only); adding the required field compiled once all 6 entries set it — `tsc` clean, full suite green with zero importer edits. Entry values: `manufacturer: 'multi'` (the vestria multipage pilot — required so a manufacturer-keyed Brief keeps vestria multi), all 5 others `'single'` (plan default).

### Carryover (a) proof — runtime meridian regains cta/pricing

- Route: request schema gains OPTIONAL `brief` (validated by the real `BriefSchema`) + `requiredCapabilities` (enum-checked against `capabilityIds`); both forwarded to `assembleProductStrategy` (was `{llmResponse, templateId, proof}` only). Absent ⇒ old senders byte-identical (proven by the "no brief ⇒ bare engine core" route test).
- Client: `buildStrategyPayload` (thing.ts) now sends `brief: { goal: briefGoalFor(input) }` when a goal intent exists — so a REAL meridian wizard run with an M1 goal reaches the route with the M1 Brief and regains `cta` at runtime. (`requiredCapabilities` has no runtime producer yet — phase 6's recomputed-required-set is the designed sender; route accepts it now.)
- Test (`route.test.ts`, runs the real handler with auth/credits/AI mocked at module boundary): meridian + `brief.goal.mechanism='M1'` + `requiredCapabilities:['packages']` ⇒ sections contain **cta** AND **pricing** with real uiblock mappings, no sitemap; no-brief call ⇒ exact `[header,hero,features,testimonials,footer]`; malformed brief ⇒ 400 validation_error (never a silent drop).

### Carryover (b) — pregate bridge DELETED + charge-once still 1 call

- `trust.ts`: `pregate` module var, `setConfirmedTrustStructure`, `resetTrustPregateForTest`, the handoff read in `runTrustGeneration`, the write in `runTrustStrategy`, and the clear-on-done are ALL deleted (`grep pregate|setConfirmedTrustStructure|resetTrustPregate src/` ⇒ zero hits). `runTrustGeneration` now reads only `input.strategy` / `input.confirmedSections`.
- Forwarding: the store's `buildTrustInput` (the single trust projection, per its own phase-4 consolidation note) now forwards `strategy: s.strategy` + `confirmedSections: confirmedStructureBody(s)`; GeneratingSlot's duplicate local projection is deleted and the slot calls the store export.
- **Charge-once still green:** `useWizardStore.test.ts` "CHARGE-ONCE end-to-end: generation consumes the pre-gate strategy — zero refetch" passes with the SAME assertion (exactly 1 `/api/audience/service/strategy` call across gate fetch + generation); "toggled off ⇒ ZERO testimonial copy" and "structure-skipping fallback self-fetches ONCE" also pass unchanged (assertions untouched — only bridge-era comments/imports removed). Copy-failure retry still charge-safe: the strategy lives in the STORE (not a cleared module var), so a retry re-projects the same strategy.

### multiPageAssembly / naayom collections — untouched + green

- `src/modules/generation/multiPageAssembly.ts` NOT modified (git status confirms; not in my diff). `multiPageAssembly.test.ts` green in both the targeted run and the full suite. thing.ts's calls into it (`buildMultiPageSkeleton`/`mergePageIntoFinalContent`/`finalizeMultiPageGeneration`/`isResumableGeneration`) unchanged except `mergePageIntoFinalContent({ templateId })` now receives `resolvedTemplateId` — always `'vestria'` on every reachable fan-out path today (fan-out requires a sitemap, which requires a multipage template). Vestria multipage fixtures (`thing.test.ts` fan-out smoke, `clampSitemap.test.ts`) pass unchanged.

### New regression coverage (`pageArchetypes.test.ts`)

vestria still resolves its menu + is multi; meridian/techpremium(retired)/hearth/lex/surge/null/unknown ⇒ null + single; a HYPOTHETICAL multipage-capable template ('atlas' via mocked templateMeta + injected registry) resolves ITS archetypes with zero detection edits — capability without menu ⇒ null, menu without capability ⇒ null; explicit `structure.mode` beats businessType default; manufacturer default 'multi' / saas 'single' / unknown key ⇒ capability decides; `structureDefault` declared on all 6 entries with manufacturer the only multi.

### Deviations

1. **Edited `useWizardStore.ts` + `useWizardStore.test.ts` (NOT on the phase-5 Files-touched list).** Unavoidable to complete mandated carryover (b): the plan itself names "the store's `buildTrustInput`" as the forwarding vehicle (it lives in useWizardStore.ts), and deleting the bridge exports breaks compile of `syncTrustConfirmedStructure` (useWizardStore.ts — a WRITE site of the bridge) and the test file's `resetTrustPregateForTest` import. Chose full clean deletion over no-op shims (the mandate says "DELETE the pregate module var + its read/write/clear sites"; shims would leave a fake bridge). Diffs are minimal and bridge-scoped: projection forward + dead-sync removal + comment updates; no store behavior/state shape changed; charge-once/toggle-off test ASSERTIONS untouched.
2. **Edited `thing.test.ts` (not listed):** kept the route-schema mirror in lockstep with the route's new optional fields (its stated purpose) + pinned the new Brief-goal forward. Companion test of an in-scope module; same category prior phases used.
3. **New `route.test.ts` (not listed):** the task mandates a carryover-(a) test for "a runtime meridian strategy call"; no route test existed, and `pageArchetypes.test.ts` is the wrong home for route-handler coverage. Auth/credits/rate-limit/AI mocked at module boundary; the handler's validation→detection→assembly runs real.
4. **`isMultipage` lives in `pageArchetypes.ts`, not "beside templateMeta/fit":** the plan's step-1 phrasing suggests `src/modules/templates/`, but no templates/ file is on the Files-touched list — placed in the listed detection-data module instead (pure data layer, imports templateMeta + businessTypes config only; firewall intact).
5. **"No Brief signal ⇒ capability decides" tail on `isMultipage`** (see helper-shape section) — required to keep vestria multi on brief-less/goal-only calls; conservative behavior-preserving reading.
6. **`manufacturer.structureDefault = 'multi'`** while the plan says "default `'single'`": read as the default for entries without a specific reason; manufacturer IS the multipage pilot, and 'single' there would flip vestria to single-page the moment a manufacturer-keyed Brief reaches detection (StructureSlot passes `businessTypeKey` — today 'manufacturer' on vestria flows), breaking multipage.
7. **`buildStrategyPayload` sends only `brief: { goal }`** (not businessType/structure): `ThingGenerationInput` carries no businessType and the store retains no `brief.structure`; goal is the field that restores meridian cta at runtime (the plan's own example). Wider Brief forwarding arrives naturally with phase-6 structure persistence.
8. Pre-existing working-tree items NOT mine: `docs/task/scale-07-structure-convergence.plan.md` (orchestrator's phase-4 commit-sha note), deleted `docs/task/scale.md`, untracked `docs/guides/collections.md` + `docs/task/scale-10-collections.spec.md`.

### Test results

- `npx tsc --noEmit` — clean (no output).
- `npm run test:run` — **Test Files 94 passed | 1 skipped (95) · Tests 1489 passed | 2 skipped (1491)** (phase-4 baseline 1472 + 17 new). Multipage/collections (`multiPageAssembly.test.ts`), re-key regression (`pageArchetypes.test.ts`), carryover-(a) route test, carryover-(b) charge-once end-to-end, clampSitemap, thing/trust adapters, wizard store: all green.
- Targeted run of the 7 phase-relevant suites: 111/111 green.

### Open risks

- `resolvedTemplateId` falls back to `PILOT_TEMPLATE` (meridian) when `input.templateId` is null on the fan-out path — unreachable today (`buildThingInput` defaults templateId, and fan-out requires a multipage template), but a future DB-resume with a null store templateId would stamp meridian instead of the old hardcoded vestria. Flag for phase 6 (resume + persistence work).
- StructureSlot's Brief signal is `businessTypeKey` only until phase 6 persists/rehydrates `brief.structure` — an explicit user `structure.mode` cannot influence the slot yet (no producer exists yet either).
- Multipage style defaults in `runCopyAndSave`/fan-out (`defaultVestriaPalette`, `'tailored'`, vestria lead fields) remain vestria-SHAPED behind the now-capability-keyed flag — fine while vestria is the only multipage template; a second multipage template must generalize them (template-default lookup).
- Route now accepts `requiredCapabilities` with no runtime sender — dormant surface until phase 6 wires the recomputed required set.


---

## Phase 6 — Structure persistence + 7b deletion relaxes hard-fit

**Files changed**
- `src/lib/schemas/brief.schema.ts` — `BriefSchema.structure` extended additively; `pages` → OPTIONAL
- `src/modules/templates/fit.ts` — new `requiredCapabilitiesFromStructure(confirmed, engine?)` + `ConfirmedStructure` type
- `src/hooks/useWizardStore.ts` — `buildStructurePatch` (the persisted brief patch), `requiredCapabilities`/`briefStructureMode` state, `recomputeRequiredCapabilities` action, hydrate read-on-load of persisted structure, `buildBriefPatch` carries structure
- `src/components/onboarding/wizard/StructureSlot.tsx` — recompute effect + persisted-mode signal into `isMultipage` + header-comment update
- `src/modules/templates/fit.test.ts` — 10 new tests: structure-derivation fixtures (drop-gallery/drop-catalog shortlist growth, core-exclusion, engine-scoping, multi/page-drop) + BriefSchema.structure persistence contract (shallow-partial proof, back-compat, round-trip, malformed rejection)

(Working-tree items NOT mine: `docs/task/scale-07-structure-convergence.plan.md` phase-5 commit-sha line (orchestrator), deleted `docs/task/scale.md`, untracked `docs/guides/collections.md` + `docs/task/scale-10-collections.spec.md` — all pre-existing, carried from phase 5.)

### Schema extension (`pages` optional — the make-or-break)

```ts
structure: z.object({
  mode: z.enum(['single', 'multi']),
  pages: z.array(z.string()).optional(),          // <- was required; legacy classify writeback, kept for back-compat readers
  pageDetails: z.array(z.object({
    archetypeKey: z.string(), slug: z.string(), sections: z.array(z.string()),
  })).optional(),                                  // <- new: multi confirmed per-page sections
  sections: z.array(z.string()).optional(),        // <- new: single-page confirmed body
}).optional(),
```

No migration (`brief` is a JSON column); additive only. Grep confirmed ZERO readers of `structure.pages` anywhere in `src/` (pattern `structure\??\.pages` → no matches), so relaxing it breaks no compile site; `classify.ts:171` rows (`pages: []`) still parse (tested).

**safeParse-partial proof (the shallow-partial trap):** test "CRITICAL: partial().safeParse of a single-page confirm WITHOUT pages succeeds" runs the EXACT saveDraft validation — `BriefSchema.partial().safeParse({ structure: { mode:'single', sections:['hero','features'] } })` — and asserts `success === true` plus data round-trips unchanged. GREEN. Back-compat test parses old `{mode:'multi', pages:['home','about']}` and classify's `{mode:'single', pages:[]}` — GREEN.

### Write path (persistence flow, traced — DB not runnable here)

`/api/brief/confirm` untouched (pre-wizard serve gate). The writer: WizardShell's Continue on the structure slot (the confirm tap) → `save()` → `buildBriefPatch()` now includes `structure: buildStructurePatch(state)` → POST `/api/saveDraft` with `{ tokenId, stepIndex, brief: {goal?, structure} }` → route validates with `BriefSchema.partial()` (now passes for single-page, proven above) → key-wise shallow-merge over stored brief (`saveDraft/route.ts:126-128`) → `Project.brief.structure` written. On next load, `hydrate(brief)` reads the persisted structure (see charge-dedup below) and recomputes the required set — the load-time required set reflects the confirmed structure.

- multi patch: `{mode:'multi', pages: sitemap.map(archetypeKey), pageDetails: [{archetypeKey, slug: pathSlug, sections}]}` (from the user-edited sitemap).
- single patch: `{mode:'single', sections: confirmedStructureBody}` — toggled-off removed, order preserved, NO `pages` key.
- pre-strategy: `buildStructurePatch` returns null → no `structure` key in the patch.

**Clobber guard (step 4, verified):** saveDraft's merge is key-wise (`{...existingBrief, ...briefResult.data}` at `route.ts:126-128`) — `structure` is replaced ONLY when the patch carries the key. All other writers checked: the wizard's own pre-structure autosaves (patch has no structure key), `thing.ts:248`'s `brief:{goal}` patch, and the old-store GoalStep/GeneratingStep passthroughs all send structure-less patches → persisted structure survives every other autosave. Post-resume autosaves re-send the SAME structure (hydrate seeded it) — an idempotent rewrite of current truth, not a clobber.

### Section → capability inversion (`requiredCapabilitiesFromStructure`)

- Surviving sections = single `sections` ∪ every `pageDetails[].sections`.
- Inverts `templateMeta.capabilitySections` across templates; when `engine` is given, ONLY templates declaring that engine contribute (prevents cross-engine name collisions: surge's always-on `about` middle section under trust never derives vestria's thing-scoped `about` capability — tested).
- Engine-CORE sections (from `engineCoreSections`) map to NO capability (plan step 1): trust's core `cta`/`packages` never derive lead-form/packages even though they ARE meridian/surge capability evidence — tested. No engine ⇒ union-of-all-cores excluded (conservative).
- Structural capabilities trust-on-declaration (step 3): `mode==='multi'` ⇒ `multipage`; `bilingual` has no structure signal, never derived.
- Deterministic output (canonical `capabilityIds` order). `fit()`/`shortlist()` untouched, reused as-is.

**Drop-gallery ⇒ bigger-shortlist proof (tests, green):**
- gallery: `['hero','services','portfolio']` derives `gallery` (lumen's `portfolio` evidence) ⇒ 0 trust templates fit; dropping `portfolio` ⇒ derives nothing ⇒ `[hearth, lex, surge]` (0 → 3, strictly greater — asserted).
- realistic thing analog: `['hero','features','cta','catalog']` ⇒ `['catalog','lead-form']` ⇒ `[vestria]` only; drop `catalog` ⇒ `['lead-form']` ⇒ `[meridian, vestria]` (1 → 2).
- multi: dropping the contact page drops `lead-form` (`['multipage','lead-form','trust']` → `['multipage','trust']`).

### Store + slot (confirm carries patch; required set held)

- `requiredCapabilities: CapabilityId[] | null` on the store; `recomputeRequiredCapabilities()` re-derives from `buildStructurePatch(state)` + engine. StructureSlot recomputes on every structure change (seed/toggle/reorder/page edits) via an effect — the client-side recompute the plan asks for; phase 7 reads the store field.
- fit.ts import into the client store is firewall-safe: fit is pure data-layer (templateMeta + coreSections + businessTypes data; its own header forbids template-module imports).

### Charge-dedup (step 3b) — scope: read-on-load DONE, fetch-skip deliberately NOT

Implemented the plan's minimum: hydrate READS `Project.brief.structure` on load — a structure carrying `sections`/`pageDetails` (a real 7b confirm; classify's bare `{mode, pages:[]}` hint is ignored so fresh-run behavior is byte-identical) seeds `structureSections` (single) or `sitemap` (multi, titles prettified from archetypeKey — titles aren't in the schema) + `briefStructureMode` + the recomputed required set. The strategy-seed guards (`seedStructureFromStrategy`) never clobber these, so the user's confirmed deletions/ordering SURVIVE a reload and re-apply through the clamp.

The fetch-SKIP variant ("mark done, don't fetch") was evaluated and rejected as harmful (documented in a comment inside `fetchStrategy`): with `strategy` null it (a) degrades a multipage resume to the single-page tail path (thing.ts fan-out requires `input.strategy && input.sitemap`) and (b) bypasses `applyConfirmedSections` (needs a strategy object), silently discarding the user's confirmed reductions. Charge accounting is UNCHANGED either way: skipping merely moves the second session's single charge from the slot to thing.ts's tail fallback (total across abandon+reload = 2 in all variants). TRUE cross-session dedup requires persisting the strategy blob itself — needs thing.ts/GeneratingSlot + a content-schema home, out of this phase's Files-touched → DEFERRED (flag for phase 7/9 if resume matters before then).

### Phase-5 open risks

- **StructureSlot↔generation mode-signal divergence — ADDRESSED (client side):** the slot now feeds the persisted confirmed `structure.mode` (via `briefStructureMode`) into `isMultipage` alongside businessType, and `isMultipage` already prefers explicit mode over the default — slot UI and any brief-fed detection site now read the same persisted signal. Server-side strategy assembly receives `brief:{goal}` only (thing.ts payload builder — not in Files-touched); forwarding `brief.structure` there is a small follow-up when thing.ts next opens.
- **`resolvedTemplateId` null-resume meridian stamp — DOCUMENTED, source unchanged:** `thing.ts:305` still falls back to `PILOT_TEMPLATE` when `input.templateId` is null. The store's templateId comes from hydrate (serveGate result) and generation saves persist templateId, so a wizard resume carries it; the residual risk is a hypothetical DB-resume path constructing input without a templateId — unreachable today; fixing the fallback itself needs thing.ts (out of scope).

### Deviations

1. **`requiredCapabilitiesFromStructure` gained an optional `engine?` param** (plan sketch: `(confirmed)`). Without engine-scoping, cross-engine section-name collisions mis-derive (surge's `about` middle section under trust would demand vestria's thing-scoped `about` capability → empty trust shortlists). Engine omitted ⇒ global inversion + union-of-cores exclusion (conservative superset), so the plan-shaped 1-arg call still works.
2. **No separate POST in StructureSlot's confirm** — the plan's own store bullet ("confirm action carries the saveDraft brief patch") is satisfied by folding the structure patch into `buildBriefPatch`, so the shell's existing Continue→`save()` (the 1-tap confirm) is the writer; a duplicate slot-level POST would double-write per confirm. WizardShell (not in Files-touched) needed zero edits.
3. **`pages` back-compat values = archetype keys** (multi patch) — schema comment says "page names"; archetype keys (`home`, `contact`, …) are the stable page identity (slugs live in `pageDetails`). Zero readers exist, so this defines rather than breaks the convention.
4. **Multi resume drops user-edited page TITLES** — `pageDetails` (per plan schema) carries `archetypeKey/slug/sections` only; hydrate prettifies the key. Titles stay editable at the slot; extending the schema beyond the plan's shape was not taken.
5. **Charge-dedup fetch-skip not implemented** — see scope section above (correctness-preserving reading of 3b's "at minimum" clause).
6. **`requiredCapabilities` has no server sender yet** — the strategy route's dormant `requiredCapabilities` field (phase-5 carryover a) stays dormant: the recomputed set exists only AFTER the strategy fetch that would consume it (7b runs post-strategy); its real consumer is phase 7's swap shortlist.

### Test results

- `npx tsc --noEmit` — clean.
- `npm run test:run` — **Test Files 94 passed | 1 skipped (95) · Tests 1499 passed | 2 skipped (1501)** (phase-5 baseline 1489 + 10 new, zero regressions). Targeted phase suites (fit, wizard store, structureConvergence) 89/89 green.
- New coverage: shallow-partial safeParse proof (exact saveDraft payload), old-row back-compat, pageDetails round-trip + derivation, malformed rejection, drop-gallery 0→3 growth, drop-catalog 1→2 growth, core-exclusion, engine-scoping, multi page-drop, legacy `{mode,pages}` derivation.

### Open risks

- Persisted structure is written at EVERY post-structure `save()` (current-truth rewrite) — idempotent, but if a future slot after `structure` mutates sitemap/sections client-side, that mutation persists on its Continue too (today only `generating` follows, whose Continue is disabled).
- Multipage resume still re-charges the strategy fetch (see charge-dedup scope) — acceptable/unchanged, but a founder-visible cost if abandon-after-confirm becomes common.
- `briefStructureMode` is only set from a CONFIRMED structure; classify's `structureHint` still reaches detection only via businessType default — intentional (fresh-run behavior preservation), but a hypothetical future writer of a bare `{mode}` structure would not steer the slot until it also writes sections/pageDetails.

## Phase 7 — template swap post-gen + meridian unlock

**Files changed**
- `src/app/edit/[token]/components/ui/TemplateSwapList.tsx` (pre-existing from the aborted prior run — KEPT UNCHANGED after assessment)
- `src/app/edit/[token]/components/layout/EditHeader.tsx` (edited)
- `src/app/edit/[token]/components/ui/VestriaThemePopover.tsx` (edited)
- `src/app/edit/[token]/components/ui/ServiceThemePopover.tsx` (edited)
- `src/modules/templates/swap.test.ts` (new)
- `docs/task/scale-07-structure-convergence.audit.md` (this appendix)

Pre-existing working-tree noise NOT mine (predates this session, untouched): `docs/task/scale-07-structure-convergence.plan.md` (phase-6 commit-sha fixup), deleted `docs/task/scale.md`, untracked `docs/guides/collections.md` + `docs/task/scale-10-collections.spec.md`.

### Assessment of the prior attempt's TemplateSwapList.tsx — kept as-is

Reviewed line-by-line; sound and complete, zero edits needed:
- Pure exported helpers (`deriveSwapSite`, `swapShortlist`, `buildSwapPatch`) separate from the UI — exactly what swap.test.ts needs.
- `deriveSwapSite`: `${type}-${uuid}` → `split('-')[0].toLowerCase()` (the codebase-canonical extraction, matches componentRegistry/backgroundIntegration); unions top-level working copy + every `pages` slice (mirror-strategy conservative superset); `multipage = pages entries > 1` (home-only stored page ⇒ effectively single-page, meridian-renderable).
- `swapShortlist`: engine from `templateMeta[current].copyEngines[0]` (retired current ⇒ `[]`); builds a `ConfirmedStructure`-equivalent → `requiredCapabilitiesFromStructure(structure, engine)` (phase-6 fn, engine-scoped) → `fit()` per candidate (same-engine + capability hard-fit + retired/bespoke exclusion) → PLUS section-coverage check: every site section ∈ engine core ∪ candidate's `capabilitySections` values. Unknown/legacy section type conservatively empties the list (swap section hides rather than offering a breaking swap).
- `buildSwapPatch`: exactly `{templateId, variantId: incoming default, paletteId: incoming default}` — never carries outgoing ids (they may not exist on the target).
- UI reuses ServiceThemePopover's mechanism verbatim (pending → amber confirm → `preloadTemplate` via registry dynamic loader → parent commits); bundle firewall intact (no static template import). Renders nothing when no eligible target.

### Shortlist derivation (plan step 1)

Store layout (`sections` + `pages` from `useEditStoreLegacy`) → deduped section types → ConfirmedStructure-equivalent (`{mode:'single', sections}` or `{mode:'multi', pageDetails:[…]}`) → `requiredCapabilitiesFromStructure` (phase 6) → `fit()` per candidate + coverage check. Multipage sites derive the `multipage` capability via `mode:'multi'`, excluding meridian automatically. Did NOT read the wizard store's phase-6 `requiredCapabilities` field — that is onboarding-state; the edit page must derive from the ACTUAL stored layout (post-gen edits/deletions included), which is what the plan's "site's ACTUAL sections" means.

### File-by-file

- **EditHeader.tsx** — locked-label branch (old :40-51) DELETED with its `titleCase`/`templateLabels`/`paletteId`/`variantId` supports; product template-module projects (meridian + vestria + retired techpremium) all route to `VestriaThemePopover` (meridian UNLOCK). Added branch: writer/granth (`usesTemplate` true, non-product) renders `null` — previously it hit the locked label; letting it fall to legacy `ThemePopover` (old-product color system) would be a regression, so no controls (conservative; granth is white-glove).
- **VestriaThemePopover.tsx** — generalized from vestria-only to any product template-module project: gate = `audienceType==='product' && usesTemplateModule(...)`; variants from `getLoadedTemplate(templateId)` (vestria keeps its fallback trio; others hide the section until loaded); palettes via `palettesForTemplate` (grid cols 8/9 adaptive); mood knob vestria-only (themeValues.mood → VestriaThemeInjector). Added the `TemplateSwapList` section + `handleSwap` (updateMeta(buildSwapPatch) + posthog `template_changed` + autosave — same shape as service's).
- **ServiceThemePopover.tsx** — inline all-templateIds switcher (rows + pending + confirm + preload) replaced by `<TemplateSwapList current site onSwap>`; the swap COMMIT (`updateMeta` defaults-reset + posthog + `triggerAutoSave` + force-rerender) stays here in `handleSwap`, so the existing mechanism/analytics/persistence are unchanged — only the list membership is now fit-filtered. Variant/palette sections untouched.
- **swap.test.ts** — 18 tests, see below.

### Zero-word-change proof

Structural, not incidental: `buildSwapPatch`'s return type is exactly `{templateId, variantId, paletteId}` and both popovers commit via `updateMeta(patch)` — no code path touches `content`/`sections`. Tests pin it: patch-key-set equality (`['paletteId','templateId','variantId']`), deep-equal of `content` + `sections` before/after meridian→vestria on a converged frozen fixture, word-count invariance, and a full meridian→vestria→meridian round-trip restoring meta with content byte-identical throughout.

### Exclusion proofs (the safety point)

- **Cross-engine ABSENT:** thing-site shortlist contains none of hearth/lex/surge/granth/lumen (asserted per-id); trust core site → exactly `[hearth, lex, surge]`.
- **Ineligible ABSENT:** site with `catalog` ⇒ meridian excluded (no catalog block); multipage site ⇒ meridian excluded (no multipage capability); meridian site with `cta`/`pricing` ⇒ vestria excluded (its lead-form/packages evidence sections are `contact`/`catalog`, not meridian's `cta`/`pricing` — swapping would drop rendered sections); surge site with `logos`/`casestudies`/`stats` ⇒ hearth/lex excluded.
- **Retired/bespoke ABSENT:** techpremium + lumen never appear; retired CURRENT template (techpremium/naayom) ⇒ empty list, template section hides.

### Default variant/palette handling

Swap always applies the INCOMING module's `defaultVariantId`/`defaultPaletteId` (module obtained from `preloadTemplate(target)` inside TemplateSwapList before commit — no render gap, firewall-safe). Asserted: patch ids ≠ outgoing ids, = module defaults.

### Deviations (conservative calls, in-scope)

1. **Writer audience → `null` controls in EditHeader** (was locked label; not the legacy ThemePopover). Plan only names product; leaving writer on a deleted branch was undefined — `null` is the conservative floor.
2. **techpremium (naayom) is no longer "locked":** the plan mandates deleting the locked branch and routing product non-vestria to the same popover. Techpremium now gets variant/palette pickers (template list stays empty — no engine ⇒ no swap targets). Its palette family is a single entry (`forest`) and variants come from the loaded module, so the practical change surface is ~nil; flagged for the phase-9 manual pass anyway.
3. **Surge-origin (and any site carrying non-core, non-capability sections, e.g. legacy trust sites or surge's logos/about/casestudies/stats) loses swap-AWAY** — the template section hides entirely. This is the fit-filter working as specified (hearth cannot render `logos`); the pre-phase-7 popover would have offered a section-dropping swap. Behavior change is deliberate and safety-directional.
4. **Shortlist reads store layout, not wizard-store `requiredCapabilities`** — see derivation note above.

### Test results (phase 7)

- `npx tsc --noEmit` — clean.
- `npm run test:run` — **Test Files 95 passed | 1 skipped (96) · Tests 1517 passed | 2 skipped (1519)** (phase-6 baseline 1499 + 18 new swap tests, zero regressions; dispatch + paletteSelection regression suites included and green).
- `next lint` on the 4 touched components — clean.
- New `swap.test.ts` (18/18): deriveSwapSite (id parsing, pages union, multipage flag), same-engine, only-eligible (catalog/multipage/cta-pricing/surge-delta), retired/bespoke/unknown-section exclusion, trust-core swap preservation, patch shape, defaults-not-carryover, zero-section-loss + zero-word-change, round-trip.

### Acceptance reasoning (plan verification #3)

Meridian product page → EditHeader now routes to the product popover (lock gone) → Template section lists `fit()`-passed same-engine candidates over the site's actual sections: a converged (5-core) meridian site offers vestria; a meridian site still carrying `cta`/`pricing` does NOT (vestria can't render those types — safety over availability; those sites re-converge via regen or a future alias). Confirm → preload vestria chunk → `updateMeta({templateId:'vestria', variantId:'tailored', paletteId:'cobalt'})` → autosave. Content/sections untouched; both renderers resolve every core section under the new template per the standing dispatch-regression + conformance guarantees (no block edits this phase).

### Open risks (phase 7)

- The coverage check's "renderable set" = engine core ∪ declared `capabilitySections` only — templateMeta has no vocabulary for extra renderable-but-undeclared sections, so sites carrying them (surge deltas, legacy service sections) get an empty swap list. Correct-by-construction but shrinks swap availability; revisit if/when templateMeta grows a declared-sections field.
- Mirror-strategy staleness: `pages[currentPageId]` can lag the top-level working copy between commit boundaries; the union can therefore include a just-deleted section until the next page commit — over-excludes (safe direction), never under-excludes.
- Manual visual pass (swap meridian→vestria→meridian in dev, editor↔published parity) deferred to phase 9's QA per plan.
