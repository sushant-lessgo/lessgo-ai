# scale-09 block-variants — implementation audit

## Phase 1 — surge testimonials deterministic default

**Files changed**
- `src/modules/audience/service/selectUIBlocks.ts` — modified
- `src/modules/audience/service/selectUIBlocks.test.ts` — new

### What changed
- Removed the `Math.random() < 0.5 ? 'ReviewGrid' : 'PullQuoteWithMark'` nondeterminism in `pickTemplateLayout`.
- Surge + `testimonials` now returns a fixed deterministic default via `SURGE_TESTIMONIALS_DEFAULT = 'ReviewGrid'`.
- `pickTemplateLayout` shape/signature `(templateId, sectionType) => string | null` unchanged; `selectServiceUIBlocks` I/O unchanged.
- Updated the doc-comment to state selection is deterministic and that count/manifest-driven selection lands in later phases.

### Deterministic rule used
- `templateId === 'surge' && sectionType === 'testimonials'` ⇒ `'ReviewGrid'` (fixed).
- No testimonial-count hint exists in this function's current signature (live audience routes carry no `cardCounts`; count threading is phase 4). Per plan ("use testimonial count when available, else fixed default `ReviewGrid`"), with no hint available the rule resolves to the fixed default — matching orchestrator decision Q1 (ReviewGrid, count-based rule OK). No new params added, keeping shape stable this phase.
- All other template/section combos ⇒ `null` (unchanged), so they fall through to `PILOT_LAYOUT_NAMES`; the `if (layout)` guard still skips unknown sections.

### Tests added (`selectUIBlocks.test.ts`)
- Surge testimonials returns the SAME result across 50 repeated calls (single-element set, `ReviewGrid`).
- Fixed default is `ReviewGrid`.
- Non-surge template (hearth) testimonials unchanged (`PILOT_LAYOUT_NAMES.testimonials` = `PullQuoteWithMark`, not `ReviewGrid`).
- Non-testimonials sections on surge unchanged.
- Unknown section type skipped (the `if (layout)` guard) — empty uiblocks.

### Verification
- `npx tsc --noEmit` — clean, no output.
- `npm run test:run` (targeted `selectUIBlocks generationContract`) — 2 files, 22 tests passed. `generationContract.test.ts` frozen fixtures green (no re-freeze; it pins neither testimonials block).
- `npm run test:run` (full) — 99 passed | 1 skipped files; 1573 passed | 3 skipped tests.

### Deviations
- None. Count-hint parameter deliberately NOT added (out of phase-1 scope; keeps `pickTemplateLayout` shape per plan). Logged as conservative choice.

### Open risks
- None for this phase. `PullQuoteWithMark` variant is now never selected at generation for surge; that becomes reachable again via the editor swap (phase 5) and the manifest default (phases 2/4).

## Phase 2 — block manifest data model + explicit declarations

**Files changed**
- `src/modules/templates/blockManifest.ts` — new (pure-data manifest + types)
- `src/modules/templates/blockManifest.test.ts` — new (conformance)

### Manifest shape
- `AssetKind = 'photos' | 'logos' | 'testimonialPhotos'`.
- `BlockDeclaration = { layoutName; label; blurb?; consumes: string[]; capacity?: {minCards; maxCards}; requiresAssets?: AssetKind[]; internalDispatch?: boolean }`.
- `SectionBlockSet = { default: string; variants: BlockDeclaration[] }`; `TemplateBlockManifest = Record<sectionType, SectionBlockSet>`.
- `blockManifests: Partial<Record<TemplateId, TemplateBlockManifest>>`.

### Templates / sections declared
- **meridian** — all 7 `MERIDIAN_LAYOUT_NAMES` sections (header/hero/features/testimonials/pricing/cta/footer), one declared variant each (the current default). Capacity on features {3,9}, testimonials {1,3}, pricing {2,3}.
- **hearth** — the 7 core `PILOT_LAYOUT_NAMES` service sections (header/hero/services/testimonials/packages/cta/footer), one variant each. Capacity on services {3,6}, packages {1,3}.
- **surge** — testimonials ONLY: `ReviewGrid` (default) + `PullQuoteWithMark`, both `internalDispatch: true`. Makes phase-1's deterministic default declared.
- **vestria** — hero ONLY: `VestriaTailoredHero` (default) + `VestriaFullBleedHero`, both `internalDispatch: true`. Makes the existing content-layout hero swap declared.
- lex / lumen / granth / techpremium — NO manifest (deferred, plan Q6); they fall back to legacy name maps.

### How `consumes` keys were sourced
- HARD-CODED per declaration = the block's own top-level element keys, copied verbatim from the canonical schemas (`meridianElementSchema`/`vestriaElementSchema` in `audience/product/elementSchema.ts`; `serviceElementSchema` in `audience/service/elementSchema.ts`), cited in per-section comments.
- Chosen over deriving via `getAllElements` at module load because deriving would make the conformance check tautological AND would add a data import to the manifest. Hard-coding keeps the manifest a leaf on the import graph and makes the test a genuine guard (a typo'd key goes red).
- The conformance test resolves the contract independently: product/thing-engine layouts via `resolveEngineSectionSchema(layoutName)` (the meridian∪vestria union — so `VestriaFullBleedHero`'s video keys are in-contract), service layouts via the block's own schema. All `consumes` verified ⊆ contract.

### Firewall verification
- `blockManifest.ts` imports exactly ONE thing: `import type { TemplateId } from '@/types/service'` — a type-only import, erased at compile time. Zero component / `.tsx` / `'use client'` / resolver / schema imports. Confirmed importable by server-side selection code without dragging any template component into the bundle.

### Deviations
- **types stayed in `blockManifest.ts`; `src/types/template.ts` NOT touched.** The scope allowed editing `template.ts` "ONLY IF sharing warrants." Only `blockManifest.ts` + its test consume the declaration types this phase, and phase 3's `resolveBlock` signature change does not need `AssetKind`, so sharing does not warrant. Conservative: fewer files changed.
- **No `requiresAssets` on any declaration this phase.** Considered `requiresAssets: ['photos']` on `VestriaFullBleedHero` (a video variant needing uploaded media) but dropped it: phase 2 is declarations-only, `'photos'` would mislabel a video asset need, and the asset-eligibility acceptance carrier is the meridian photo hero in phase 6. `AssetKind` type is defined for later phases.
- **surge / vestria declared as PARTIAL manifests** (only the variant-bearing section each). Matches the plan's explicit "incl. both testimonials/hero variants" wording; their other sections fall back to name maps in phase 4 (the plan states manifest-driven pick only "when a manifest entry exists"). Minimal, in-scope.
- **hearth manifest = the 7 core pilot sections**, excluding the surge-only delta layouts (logos/about/casestudies/stats) that also live in `PILOT_LAYOUT_NAMES` — hearth never selects those, so declaring them would be false.

### Verification
- `npx tsc --noEmit` — clean, no output.
- `npx vitest run src/modules/templates/blockManifest.test.ts` — 42 tests passed.
- `npm run test:run` (full) — 100 passed | 1 skipped files; 1615 passed | 3 skipped tests (+1 file, +42 tests vs phase 1). Suite green.

### Open risks
- None for this phase. Resolver / component-identity distinctness checks are intentionally absent (phase 3). The manifest is pure data with no runtime consumers yet — first consumed by `resolveBlock` (phase 3) and the eligibility filter (phase 4).

## Phase 3 — variant-aware resolveBlock (registry plumbing, parity-neutral)

**Files changed**
- `src/types/template.ts` — `resolveBlock` signature + A1 doc-comment
- `src/modules/generatedLanding/componentRegistry.ts` — forward layout into `resolveBlock`
- `src/modules/generatedLanding/componentRegistry.published.ts` — forward layout into `resolveBlock`
- `src/modules/templates/meridian/resolveMeridianBlock.ts` — variant-keyed registry
- `src/modules/templates/hearth/resolveServiceBlock.ts` — variant-keyed registry
- `src/modules/templates/conformance.test.ts` — new per-manifest-declaration resolution + distinctness suite
- (`blockManifest.ts` verified only — `internalDispatch: true` already present on surge-testimonials + vestria-hero from phase 2; NO change)

### New resolveBlock signature + dispatch shape
- Interface: `resolveBlock(blockType, mode, layoutName?)` — optional 3rd param. Other templates' resolvers (surge/vestria/lex/lumen/granth/techpremium) satisfy the interface unchanged (extra optional arg ignored); no `index.ts` re-typing was needed (tsc clean).
- Both `getComponent()`s forward their existing layout arg: edit `tmpl.resolveBlock(sectionType, 'edit', layoutName)`; published `tmpl.resolveBlock(normalizedType, 'published', layout)`.
- meridian + hearth registries refactored from `Record<sectionType, BlockEntry>` to `Record<sectionType, SectionEntry>` where `SectionEntry = { variants: Record<lowercasedLayoutName, {edit, published}>, default: lowercasedLayoutName }`. A `single(layoutName, entry)` helper builds the one-variant-per-section entries (still exactly ONE real block per section this phase — parity-neutral). Lookup: `variants[(layoutName||'').toLowerCase()] ?? variants[default]`.

### How fallback preserves A1 / template-switching
- Absent/unknown/FOREIGN layout name ⇒ `variants[layoutName]` is undefined ⇒ `?? variants[default]` returns the section's default block. So a project whose stored layout strings were authored by another template still renders this template's block for that section type — switching templates needs zero layout-name rewrites (A1 guardrail intact).
- surge testimonials + vestria hero keep their internal dispatcher blocks: their resolvers are untouched (section-type keyed), so the forwarded layout arg is ignored and they fall back to the single section-type entry, which branches internally on `content[sectionId].layout`. Mixed dispatch model holds.

### Distinctness guard structure + red-check
- New suite `(c) scale-09: manifest variant resolution + distinctness` iterates `blockManifests`. Per declaration, both modes: (a) `resolveBlock(sectionType, mode, layoutName)` truthy + non-placeholder (extended `resolvesReal` threads the layout param); (b) for every NON-default variant, resolved component `!==` (strict identity, via `resolveComponent` getter) the default's component. `internalDispatch: true` declarations (surge testimonials, vestria hero) are instead asserted `.toBe` the default's component (they share one dispatcher). Also asserts `default ∈ variants`.
- Note: meridian/hearth currently declare only their default variant, so the `!==` branch has no live cases yet (it auto-covers phases 6–7). The internalDispatch `.toBe` branch DOES run today for surge + vestria.
- **Red-check performed:** temporarily added a throwaway non-default variant `ZZZBogusUnregisteredVariant` (unregistered layout name) to meridian `features`. The distinctness test went RED — `AssertionError: meridian/features ZZZBogusUnregisteredVariant (edit) resolves to the SAME component as default "HairlineFeatureGrid"` — proving the silent-fallback failure mode is caught. Reverted; tree clean.

### Verification (actual output)
- `npx tsc --noEmit` — clean, no output.
- `npx vitest run conformance.test.ts` — 1 file, 123 tests passed.
- `npm run test:run` (full) — 100 passed | 1 skipped files; 1651 passed | 3 skipped tests.
- `npm run build` — success (published CSS/assets + next build all green; route table printed, no errors). Firewall/published bundle intact.

### Deviations
- None. Blog section entries (`blogpostbody`/`blogindex`) were given synthetic layout-name keys (`BlogBody`/`BlogIndex` lowercased) purely to fit the `single()` shape — they're publish-time synthesized, never dispatched by a stored layout name, so any key works; the `?? default` fallback covers them regardless.

### Open risks
- None for this phase. First real non-default variants (which will exercise the `!==` distinctness branch live) land in phases 6–7; the guard is in place ahead of them.

## Phase 4 — eligibility filter + selection threading

**Files changed**
- `src/modules/generation/blockEligibility.ts` — new (pure eligibility filter + derivations)
- `src/modules/generation/blockEligibility.test.ts` — new
- `src/modules/audience/product/selectBlocks.ts` — manifest-driven pick + optional signals
- `src/modules/audience/service/selectUIBlocks.ts` — manifest-driven pick; deleted phase-1 `pickTemplateLayout` surge stopgap
- `src/modules/audience/service/selectUIBlocks.test.ts` — extended (optional-signal paths)
- `src/modules/audience/product/strategy/parseStrategyProduct.ts` — thread signals
- `src/modules/audience/service/strategy/parseStrategyService.ts` — thread signals
- `src/modules/wizard/generation/thing.ts` — thread hints
- `src/modules/generation/multiPageAssembly.ts` — thread hints
- `src/modules/prompt/mockResponseGeneratorProduct.ts` — thread hints
- `src/modules/prompt/mockResponseGeneratorService.ts` — thread facts

### AssetFacts shape + derivation sources
- `AssetFacts = { hasPhotos, hasLogos, hasTestimonials, hasTestimonialPhotos }` (typed booleans). The AssetKind keys (photos/logos/testimonialPhotos) gate eligibility via `assetFactForKind`; `hasTestimonials` carried for derivation completeness.
- `deriveAssetFactsFromServiceAssets(ServiceAssetInput)`: hasPhotos = hasTeamPhotos||hasFounderPhoto; hasLogos = hasClientLogos; hasTestimonials = hasTestimonials; hasTestimonialPhotos = hasTestimonials && testimonialType==='photos' (conservative — text/video/transformation excluded).
- `deriveAssetFactsFromBrief(Brief)`: reads top-level `proofAvailable` string kinds (substring match: 'photo'/'image'/'gallery' → hasPhotos; 'logo' → hasLogos; 'testimonial' → hasTestimonials) plus `facts.entry.testimonials[]` non-empty → hasTestimonials. Read inline (no `classify.ts` import) to keep the module a leaf.

### selectEligibleBlock fallback order
- `eligible(v) = capacityFits(cardCountHint) ∧ assetNeedsMet(assetFacts)`. capacityFits: no capacity OR no hint ⇒ true, else min≤hint≤max. assetNeedsMet: no requiresAssets ⇒ true; absent assetFacts ⇒ UNMET (conservative); else every required AssetKind true.
- `pickFromSet`: **default if eligible → else first eligible in declaration order → else default** (never fails).
- `selectEligibleBlock(templateId, sectionType, opts)`: no manifest entry ⇒ returns `null` so callers fall back to the legacy name map (MERIDIAN/VESTRIA/PILOT_LAYOUT_NAMES). Manifest defaults were verified equal to the legacy maps (meridian 7, hearth 7 core, surge testimonials=ReviewGrid, vestria hero=VestriaTailoredHero), so existing single-variant sections return the same default with or without signals.

### Call-site threadings (6)
- `parseStrategyProduct.ts` — assetFacts from `deriveAssetFactsFromBrief(brief)` when brief in scope; `cardCountHints.features = llmResponse.featureAnalysis.length`.
- `parseStrategyService.ts` — assetFacts from `deriveAssetFactsFromServiceAssets(assets)` (assets already in scope).
- `thing.ts` (fan-out) — `cardCountHints.features = fanFeatures.length`, `cardCountHints.testimonials = ob.importedTestimonials.length`.
- `multiPageAssembly.ts` (mergePageIntoFinalContent) — same hints from `fc.onboardingData` (understanding.valueAdds/features + importedTestimonials).
- `mockResponseGeneratorProduct.ts` — `cardCountHints.features = input.features.length`.
- `mockResponseGeneratorService.ts` — assetFacts from `deriveAssetFactsFromServiceAssets(input.assets)`.
All signals OPTIONAL; no manifest declaration currently has `requiresAssets`, and single-variant sections always fall back to their default, so every threading is a no-op for today's output.

### Firewall confirmation
`blockEligibility.ts` imports: `blockManifests` (pure data) + type-only imports (`AssetKind`/`BlockDeclaration`/`SectionBlockSet` from blockManifest, `TemplateId`/`ServiceAssetInput` from types/service, `Brief` from types/brief — all erased at compile). ZERO component / `.tsx` / `'use client'` / resolver / element-schema imports. Server-side selection code imports it freely; tsc + full build (phase 3) confirm no bundle leak.

### Fixture stability
`generationContract.test.ts` (`src/modules/audience/__tests__/`) — 17 tests pass, fixtures byte-stable (no re-freeze). Existing template defaults unchanged.

### Deviations
- Exported `isBlockEligible` + `pickFromSet` (pure) so the ACCEPTANCE test (requiresAssets:['photos'] absent when hasPhotos=false) and the fallback-order branches can be asserted against synthetic declarations — no real manifest declares a non-default variant yet. `selectEligibleBlock` additionally tested against real manifest data (unknown⇒null, no-hint⇒default, capacity out-of-range⇒default, surge determinism).
- Product asset facts NOT threaded from the mock (mock has `proof`, not a full Brief); only cardCountHints threaded there. In-scope conservative choice — determinism/output unaffected.

### Verification (actual output)
- `npx tsc --noEmit` — clean, no output.
- `npx vitest run blockEligibility.test.ts selectUIBlocks.test.ts` — 2 files, 32 tests passed.
- `npx vitest run generationContract.test.ts` — 1 file, 17 tests passed (fixtures stable).
- `npm run test:run` (full) — 101 passed | 1 skipped files; 1678 passed | 3 skipped tests (+1 file, +27 tests vs phase 3). Suite green.

### Open risks
- None for this phase. The eligibility branches (capacity out / asset filter) have no LIVE non-default variant to exercise until phases 6–7 land real variants; the phase-4 tests prove the mechanism via synthetic declarations ahead of them.
