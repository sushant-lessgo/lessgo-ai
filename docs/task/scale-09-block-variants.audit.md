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

---

## Phase 5 — editor swap generalization + card-count clamp

**Files changed**
- `src/app/edit/[token]/components/ui/BlockVariantSelector.tsx` (NEW)
- `src/app/edit/[token]/components/ui/clampSectionCards.ts` (NEW, pure)
- `src/app/edit/[token]/components/ui/clampSectionCards.test.ts` (NEW)
- `src/app/edit/[token]/components/ui/LayoutChangeModal.tsx` (gate rewrite)
- `src/app/edit/[token]/components/ui/VestriaHeroVariantSelector.tsx` (DELETED)
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx` (swap-button gate)

### BlockVariantSelector (generalized from VestriaHeroVariantSelector)
Manifest-driven card picker for ANY section whose template manifest declares >1
variant. Reads `blockManifests[templateId]` (pure data — safe in a `'use client'` file).

- **Eligible variants** = `set.variants.filter(v => v.layoutName === currentLayout || isBlockEligible(v, { assetFacts }))`. Reuses `blockEligibility.isBlockEligible` (imported, NOT edited) with **no `cardCountHint`** so its `capacityFits` is a no-op — capacity does NOT filter in the editor (spec: capacity clamps, not filters). Only `requiresAssets` gates the list. The CURRENT variant is always shown even if its assets are momentarily absent.
- **Asset facts from CURRENT editor state** — local pure helper `deriveEditorAssetFacts(sectionContent)` scans `content[sectionId].elements`: a non-empty image/photo/video/logo/hero/cover URL string implies `hasPhotos`/`hasLogos`; a non-empty testimonials/review/quote array implies `hasTestimonials` (+ `hasTestimonialPhotos` when its items carry an image/avatar/src URL). This is the Q5 presence-proxy: the "photo variant appears after photos uploaded" case passes because uploading writes a URL into section content, flipping `hasPhotos` true. (Derivation lives in the selector, not in `blockEligibility.ts`, because that file is outside my scope — I only import its pure `isBlockEligible` + `AssetFacts`.)
- **Apply (no clamp)**: `executeUndoableAction('section-layout-update', ..., () => updateSectionLayout(sectionId, layoutId))` — layout-only, content untouched.
- Two shared pure helpers exported for the other two files: `getVariantSetForLayout(templateId, layoutName)` (finds the owning `{sectionType,set}` by scanning the manifest for the layout name) and `hasMultipleVariants(...)`.

### Clamp semantics (`clampSectionCards.ts`, pure, no React)
- `sectionCardCount(section)` = length of the largest top-level array in `elements` (card collections are stored as top-level array elements — the published renderer spreads `...elements` into block props).
- `clampSectionCards(section, maxCards)` truncates EVERY top-level array element to `maxCards`, **dropping from the END** (Q7 pilot policy), returning `{ content, droppedCount }` where `droppedCount` = drop from the largest truncated collection. No-op (returns the SAME ref, droppedCount 0) when nothing exceeds capacity / no collections / empty / negative `maxCards`. Never mutates input.
- **Wired in the selector**: on selecting a target whose `capacity.maxCards < sectionCardCount(current)`, an inline amber warning replaces the card grid ("keeps first N cards ... undo restores"); on confirm, ONE `executeUndoableAction` wraps `updateSectionLayout` + `setSection(sectionId, { elements: clampedElements })` so a single undo restores BOTH the layout and the dropped cards. No clamp needed implies layout-only swap.

### LayoutChangeModal gate change
Replaced the vestria-hero special case (`templateId==='vestria' && sectionType==='hero' && VESTRIA_HERO_LAYOUTS.includes(...)`) with a generic manifest gate: for `usesTemplateModule` projects, resolve `getVariantSetForLayout(templateId, effectiveLayout)`; render `BlockVariantSelector` iff a set is found with `variants.length > 1`, else `null`. Section owner is resolved from the ACTUAL stored layout name (not `sectionType`, which `getSectionTypeFromLayout` unreliably defaults to 'hero'). Vestria hero (2) + surge testimonials (2) now flow through the SAME generic path. Legacy (non-template) projects still use `LayoutChangeSelector` unchanged.

### SectionToolbar gate change
Verified current behavior: the toolbar previously ALWAYS rendered the "Layout" primary action (it relied on the modal returning null to no-op). Now destructures `audienceType`/`templateId` and computes `showChangeLayout = isTemplateModule ? hasMultipleVariants(templateId, sectionLayouts[sectionId]) : true`, then filters the `change-layout` action out when false. Template sections with a single manifest variant no longer show a dead "Layout" button; legacy projects keep it always.

### Deleted
`VestriaHeroVariantSelector.tsx` — folded into the generic selector (content-preserving `updateSectionLayout` semantics preserved; `VESTRIA_HERO_LAYOUTS` knowledge now comes from the vestria manifest declared in phase 2). Confirmed no remaining importers (`thing.ts` has its own unrelated local const of the same name).

### Deviations from plan
- Plan Phase-5 Files-touched lists `blockEligibility.ts` (editor-side asset-fact helper). The orchestrator scope did NOT include it, so I did NOT edit it — the editor asset-fact derivation lives inside `BlockVariantSelector.tsx` instead, importing only the pure `isBlockEligible`/`AssetFacts`. Functionally equivalent, tighter scope.
- Clamp truncates ALL top-level collection arrays (not a single "primary" collection). Conservative pilot choice: the only live >1-variant section that can clamp is surge testimonials (ReviewGrid cap{1,3} -> PullQuote cap{1,1}); vestria hero has no capacity so never clamps. Logged as an in-scope judgment call.

### Verification (actual output)
- `npx tsc --noEmit` — clean (no output).
- `npx vitest run clampSectionCards.test.ts` — 1 file, 9 tests passed.
- `npm run test:run` (full) — 102 passed | 1 skipped files; 1687 passed | 3 skipped tests. Green, no fixture drift.

### MANUAL-QA CHECKLIST (human gate)
Run against `npm run dev`, not mocked. Open the editor `/edit/[token]`.

1. **Vestria hero swap parity (live-customer flow, product/vestria project):**
   - Hover the hero section, toolbar, click **Layout**. Expect the 2-card dialog "Change hero style" with **Tailored hero** + **Full-bleed video hero**, current one badged "Current".
   - Click the other variant. Dialog closes, hero re-renders in the new style, headline/copy/uploaded media preserved (no regen). Ctrl/Cmd-Z restores the previous layout.
2. **Surge testimonials swap + clamp (service/surge project with 3 testimonials):**
   - Testimonials toolbar, **Layout**, dialog "Change testimonials style" with **Review grid** (current) + **Pull quote**.
   - Pick **Pull quote** (cap maxCards 1, current count 3). Expect the amber warning "keeps the first 1 card and drops 2 at the end". Confirm **Switch & keep first 1**.
   - Expect: block switches to PullQuote, only the first testimonial remains. **Ctrl/Cmd-Z once** restores BOTH the ReviewGrid layout AND all 3 testimonials (single undo).
3. **Photo-appears-after-upload (needs a `requiresAssets:['photos']` variant — lands phase 6 on meridian hero):** verify the mechanism indirectly for now — before any image is uploaded the asset-requiring variant is ABSENT from the picker; after uploading a hero image (URL written into section content) reopen the picker and it APPEARS. (No such live variant exists until phase 6; this check is fully exercisable then.)
4. **Single-variant sections show NO Layout button:** on a meridian/hearth section with only its default block (features/pricing/cta), the toolbar must NOT show a "Layout" action.
5. **Legacy (non-template) project:** the "Layout" button still opens the full `LayoutChangeSelector` as before.

### Open risks
- Asset-fact derivation is a heuristic over element key names (regex `image|photo|video|logo|...`). A section using an unconventional collection/URL key could mis-derive facts — only matters once a live `requiresAssets` variant exists (phase 6); tighten then.
- Clamp truncates all collections uniformly; a section with a large secondary collection (e.g. logos max 6) swapped to a maxCards-1 block would also drop logos to 1. Not reachable with current live variants; revisit if a multi-collection section gains a small-capacity variant.

---

## Phase 6 — meridian variants: hero/features/testimonials ×2

**Files changed**
- `src/modules/templates/meridian/blocks/Hero/EditorialPhotoHero.styles.ts` (NEW, shared plain module)
- `src/modules/templates/meridian/blocks/Hero/EditorialPhotoHero.tsx` (NEW, edit)
- `src/modules/templates/meridian/blocks/Hero/EditorialPhotoHero.published.tsx` (NEW, published)
- `src/modules/templates/meridian/blocks/Features/LedgerFeatureList.styles.ts` (NEW, shared plain module)
- `src/modules/templates/meridian/blocks/Features/LedgerFeatureList.tsx` (NEW, edit)
- `src/modules/templates/meridian/blocks/Features/LedgerFeatureList.published.tsx` (NEW, published)
- `src/modules/templates/meridian/blocks/Testimonials/CenteredEditorialTestimonials.styles.ts` (NEW, shared plain module)
- `src/modules/templates/meridian/blocks/Testimonials/CenteredEditorialTestimonials.tsx` (NEW, edit)
- `src/modules/templates/meridian/blocks/Testimonials/CenteredEditorialTestimonials.published.tsx` (NEW, published)
- `src/modules/templates/meridian/resolveMeridianBlock.ts` (variant-map wiring: added `withVariants` helper + 3 multi-variant section entries)
- `src/modules/audience/product/elementSchema.ts` (3 cloned schema entries)
- `src/modules/engines/elementContracts.ts` (`THING_GENERATION_LAYOUTS` += 3 variant layout names)
- `src/modules/templates/blockManifest.ts` (3 variant declarations added to meridian hero/features/testimonials)

### The 3 dual-renderer pairs (component + layoutName → designer file)
1. **Hero `EditorialPhotoHero`** ← `Meridian Variant - Hero (Editorial Photo).html` (`.hero-ep`). Photo-led split: copy column (border-right, faint masked dot-grid) + dominant `hero_image` in a hairline viewfinder frame with accent corner ticks + a mono `caption` chip pinned bottom-left. Same 9 slots as `TerminalHero` (incl. the existing `hero_image` key). Drops the stats band (skin difference; schema still clones the stats collection for contract parity). `requiresAssets: ['photos']`.
2. **Features `LedgerFeatureList`** ← `Meridian Variant - Features (Ledger List).html` (`.section`/`.ledger`). Full-width hairline rows (`78px 64px 1fr 1.35fr 128px` grid) with CSS-only `:hover` (accent-dim row tint + 2px accent left edge scaleY-in + link→accent). Same slots as `HairlineFeatureGrid`. Capacity `{3,9}` (edit add/remove clamps to 3–9).
3. **Testimonials `CenteredEditorialTestimonials`** ← `Meridian Variant - Testimonials (Centered Editorial).html` (`.te-*`). Centered head → featured pull-quote (#1, 64px accent open-quote mark) → supporting 2-col pair (#2–3) → optional stats band (`<em>`-in-value renders accent) → optional 6-col logo rail. Same slots as `ProofWithLogoRail`. Optional bands + supporting grid render conditionally on collection length.

### CSS-only + accent-inherited + token-mapped
- **CSS-only**: no JS behavior in the blocks; only CSS `:hover` (Features rows + buttons). The hero's edit-only photo upload (`<input type=file>` via `useEditStore().uploadImage`, the `TechPremiumHero` pattern) lives ONLY in the `.tsx`; `.published.tsx` renders a plain `<img>` — no editor/published markup divergence.
- **Accent inherited, tokens mapped**: all accents use `var(--accent)`/`var(--accent-ink)`/`var(--accent-dim)`. The README's raw `oklch(...)` values were dropped and mapped onto meridian's existing token names (all confirmed present in `meridian/tokens.ts`). No hardcoded OKLCH — the only `oklch` text is `color-mix(in oklch, var(--ink) …)` (color-space keyword on a token, not a baked color).

### Dual-renderer parity approach (shared styles module)
Each pair's CSS lives in a plain, NON-`'use client'` `*.styles.ts` module (`EDITORIAL_PHOTO_HERO_STYLES` / `LEDGER_FEATURE_LIST_STYLES` / `CENTERED_EDITORIAL_TESTIMONIALS_STYLES`) imported by BOTH `.tsx` and `.published.tsx` — one source of truth for class names + CSS, so the renderers cannot drift. Satisfies the published/client-boundary rule (no function imported from a `'use client'` block into a `.published.tsx`). Class prefixes are unique per variant (`.mrd-hep__*`, `.mrd-ledger*`, `.mrd-te__*`) so they never collide with the default siblings' classes.

### Registration wiring
- **Schema clone** (`elementSchema.ts`): `EditorialPhotoHero`=clone of `TerminalHero` (elements + stats); `LedgerFeatureList`=clone of `HairlineFeatureGrid`; `CenteredEditorialTestimonials`=clone of `ProofWithLogoRail`. Keys verified EXACT vs the real siblings; contract union unchanged, so `consumes ⊆ contract` stays green.
- **THING_GENERATION_LAYOUTS** += the 3 variant layout names — a section carrying a swapped-in variant resolves its (thing, sectionType) contract on generation/regeneration.
- **Resolver**: added `withVariants(defaultLayoutName, ...pairs)`; hero/features/testimonials became multi-variant `SectionEntry`s keyed by lowercased layout name; `default` UNCHANGED; lookup stays `variants[layoutName] ?? variants[default]`.
- **Manifest**: one declaration per section next to the default; `consumes` mirrors the default sibling; capacity features `{3,9}`, testimonials `{1,3}`, hero none; `requiresAssets:['photos']` ONLY on the hero variant. Carry-forward check: manifest `default` strings exactly match the resolver's registered default keys — verified.

### Distinctness-test result (all 3, both modes)
`conformance.test.ts` (c)-suite PASSED for all 3 (verbose-confirmed): `EditorialPhotoHero` DISTINCT from `TerminalHero`; `LedgerFeatureList` DISTINCT from `HairlineFeatureGrid`; `CenteredEditorialTestimonials` DISTINCT from `ProofWithLogoRail` — plus each "resolves to a real block (edit + published)". Phase-4 eligibility suite (photo hero drops when `hasPhotos=false`) stayed green.

### Deviations
- **Quote tag**: `MeridianEditable`'s `Tag` union excludes `blockquote`, so edit uses `as="div"` while published emits `<blockquote>` — the SAME div-edit/blockquote-published split the default `ProofWithLogoRail` already uses; visually identical (`.mrd-te__quote`). Matches precedent.
- **Eyebrow numeric index dropped**: the designer HTML shows a decorative accent index (`02 —`) before the eyebrow; no content slot exists for it, so it was omitted rather than invent content or bake a meaningless static string (eyebrow renders as editable text + hairline rule, like the default siblings).
- **Hero photo affordance** uses `useEditStore().uploadImage` (product `TechPremiumHero` pattern) rather than hearth's `useImageToolbar` overlay (meridian has no such wiring); edit-only, absent from published.

### Verification (actual output)
- `npx tsc --noEmit` — clean (after fixing 2 `blockquote` Tag errors → `div`).
- `npx vitest run conformance.test.ts blockManifest.test.ts blockEligibility.test.ts` — 3 files, **200 passed**.
- `npm run test:run` (full) — **102 passed | 1 skipped files; 1698 passed | 3 skipped tests** (+11 vs phase 5). No fixture drift.
- `npm run build` — **✓ Compiled successfully**; full route table, published CSS/assets + `next build` all green.

### Open risks
- The editorial photo hero drops the `stats` band `TerminalHero` renders — intentional and copy-safe (stats stay in stored content, unrendered by this variant; swapping back re-shows them). No data loss.
- Manual editor↔published pixel parity is not automatable — see checklist below.

---

## MANUAL PARITY-QA CHECKLIST (human gate — `npm run dev`, meridian product project)

For EACH variant: hover section → toolbar **Layout** → pick the variant → eyeball editor, then Preview/Publish and eyeball the published page for pixel parity.

**1. Hero — Editorial Photo (`EditorialPhotoHero`)**
- On a meridian **hero** section, open **Layout**. BEFORE a hero image is uploaded, the "Editorial photo hero" card must be **ABSENT** (requiresAssets: photos gate).
- Upload a hero image (`hero_image` set), reopen Layout → "Editorial photo hero" **APPEARS**. Select it.
- Editor: two-column split, image dominant right inside a hairline frame with accent corner ticks; `status_text` mono line + accent dot, `audience_tag` pill, headline with accent `<em>`, lede, primary CTA (arrow) over `cta_subtext`, ghost secondary CTA, mono `caption` chip bottom-left of the image.
- Change/remove photo controls work; remove → striped drop-target empty state returns.
- Publish round-trip: published hero matches editor exactly; accent tracks the project palette (not baked mint).

**2. Features — Ledger List (`LedgerFeatureList`)**
- meridian **features** → Layout → "Ledger list". Full-width hairline rows: `F-0n` index · glyph box · title · description · right-aligned `read ↗`.
- Hover a row: accent-dim tint, 2px accent left edge grows in, link → accent (CSS-only).
- Add/remove capability clamps 3–9.
- Publish round-trip: rows + hover identical.

**3. Testimonials — Centered Editorial (`CenteredEditorialTestimonials`)**
- meridian **testimonials** → Layout → "Centered editorial". Centered head, featured pull-quote (#1) with 64px accent mark, supporting pair (#2–3).
- With 1 testimonial: supporting grid hidden on publish.
- Stats: add 1–3 (try `<em>` in a value → accent, upright); 0 stats → band ABSENT on publish. Same for logo rail (0 → absent, up to 6).
- Publish round-trip: featured/supporting/stats/logos match editor; empty optional bands omitted.

### Post-review parity fixes (impl-review = ship; 2 non-blocking, in `LedgerFeatureList.published.tsx` only)
1. **Grid-shift parity**: the fixed 5-col ledger grid has `title`/`description`/`link_text` as direct grid children. Edit always renders all three cells; published previously rendered them conditionally (`{f.title && …}`), so a card with an empty title but non-empty description would auto-place cells into the wrong columns on publish (edit≠published). FIX: render all three grid-child cells UNCONDITIONALLY (`{f.title || ''}` etc., cell element always present) → grid structurally stable regardless of empty fields, matching the edit renderer.
2. **Decorative link href**: published rendered `read ↗` as `<a href="#">` (scrolls to top on click) while edit uses a non-navigating span. FIX: published now uses a hrefless `<span className="mrd-ledger__link">` — parity with the edit side (styling unchanged; `.mrd-ledger__link` applies to the span).
- Re-verified: `npx tsc --noEmit` clean; `npm run test:run` 102 passed | 1 skipped files, 1698 passed | 3 skipped tests; `npm run build` ✓ Compiled successfully.
