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
