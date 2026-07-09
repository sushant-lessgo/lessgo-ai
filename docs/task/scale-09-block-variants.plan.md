# scale-09 — block variants per section (plan)

**Branch:** `feature/scale-09-block-variants`
**Spec:** `docs/task/scale-09-block-variants.spec.md`
**Depends:** scale-07 (engine element contracts), scale-01 (template registry/meta)
**Revision:** v2 — folds in plan-review round 1 (variant-distinctness test, photo-variant contract-key fix, path fix, dispatch-model + manifest-location notes).

## Overview

Give each section type 2–3 copy-compatible blocks per template, selected deterministically (capacity + asset-fact eligibility filter over explicit per-template block declarations, never AI/random) and swappable in the editor with zero regen. Today's implicit 1:1 section→block maps become explicit `defaultBlock` declarations; `resolveBlock` becomes variant-aware (keys on the stored layout name with section-type fallback); the vestria-hero-only swap UI generalizes to any section with >1 declared variant. First real variants: hero/features/testimonials on meridian, hero/services/testimonials on hearth.

**Key facts discovered (drive the design):**
- Live audience routes produce NO `cardCounts` (that exists only in legacy `src/modules/prompt/`). Capacity eligibility uses deterministic count hints derived from known content (features.length, importedTestimonials.length), optional — absent hint ⇒ default block.
- `getComponent()` in BOTH `componentRegistry.ts` (L46) and `componentRegistry.published.ts` (L31) already receives `layoutName` — variant dispatch only needs it forwarded into `resolveBlock`.
- Two variant precedents exist as internal dispatcher blocks (surge `SurgeTestimonials` + vestria hero wrapper branch on stored layout). They keep working under the new registry-level scheme (section-type fallback), no forced migration.
- Service already has typed asset booleans (`ServiceAssetInput`, `src/types/service.ts:432`); product has loose `Brief.facts`/`proofAvailable`. A normalized `AssetFacts` type unifies them.
- `thingElementContract.hero` (`elementContracts.ts:102–105`) already UNIONS the vestria hero image/video keys — so a meridian photo-led hero variant can legally consume an existing contract image key (no net-new key needed). This is how the `requiresAssets: photos` acceptance is satisfiable.

## Progress log

- phase 1 surge deterministic default: done (commit 72c5a54f, review loops 1)
- phase 2 block manifest data model + declarations: done (commit 377792ed, review loops 1)
- phase 3 variant-aware resolveBlock: done (commit e1ced401, review loops 1)
  - CARRY TO PHASE 6/7: once a section has >1 variant, ensure the manifest's `default` layoutName string EXACTLY matches the resolver's registered default key — the distinctness test resolves default via `set.default`, and a manifest/resolver default-name divergence is NOT independently caught. Reviewer must check this when new variants land.
- phase 4 eligibility filter + selection threading: done (commit bb1e50ba, review loops 1)
  - CARRY TO PHASE 6/7: `deriveAssetFactsFromBrief` computes `hasTestimonialPhotos` via loose substring conjunction over `proofAvailable` (can false-positive). Tighten when a real photo/testimonial-photo variant lands.
- phase 5 editor swap generalization + card-count clamp: done (commit 203ddbfc, review loops 1) — HUMAN GATE pending user sign-off
- phase 6 meridian variants (3 new dual-renderer pairs): done (commit 4e9431c1, review loops 1 + 2 non-blocking parity fixes) — HUMAN GATE pending user parity QA
- phase 7 hearth variants (3 new dual-renderer pairs): SKIPPED (user decision 2026-07-10 — meridian-only for now; hearth keeps single default per section; mechanism already variant-ready. Revisit when hearth designs land / demand board calls for it)

## Cross-phase invariants (Lessgo landmines)

- **Dual-renderer parity:** every new block = `.tsx` + `.published.tsx` pair, identical layout/CSS, `data-surface` for tones. Phases 6–7 are the heavy ones.
- **Published/client boundary:** never import from a `'use client'` file into a `.published.tsx` — shared styles go in plain `styles.ts` modules (surge `ReviewGrid.styles.ts` idiom).
- **Bundle firewall:** the block manifest is PURE DATA (no component imports) so audience selection code can import it; component wiring stays inside each template's `resolve*Block.ts`, loaded only via the registry's dynamic import. No static template imports in `componentRegistry*.ts`.
- **Copy-compatibility (D18):** a variant consumes ONLY element keys already in the section's contract. New keys ⇒ different section type ⇒ rejected at review (conformance test enforces). "Already in the contract" includes union-sourced keys another template contributed (e.g. vestria's hero image keys) — a variant may consume those; it may NOT invent keys.
- **Variant-distinctness guard:** because dispatch is `variants[layoutName] ?? default`, a misspelled/misregistered variant silently renders the DEFAULT block and truthy/non-placeholder checks stay green. The conformance suite therefore asserts component IDENTITY: every non-default declared variant must resolve to a component `!==` the section default's component, in BOTH modes. This is the only automated guard for the whole variation mechanism (introduced phase 3, auto-covers phases 6–7).
- **A1 guardrail preserved:** unknown/foreign stored layout name ⇒ section-type default block, so template switching still works without layout-name rewrites.
- **Mixed dispatch model (deliberate, post-phase-3):** meridian + hearth dispatch variants at the REGISTRY level (`variants[layoutName] ?? default` inside `resolve*Block`); surge testimonials + vestria hero KEEP their internal dispatcher blocks that read `content[sectionId].layout`. Both models coexist fine — the registry falls back to the section-type entry (the dispatcher), which branches internally. Registry-level is the pattern for NEW variants; migrating the two legacy dispatchers is optional cleanup, out of scope.
- Verify with `npx tsc --noEmit` + `npm run test:run`; `npm run build` where the published bundle is touched (not just `next build` — published CSS/assets steps included).

---

## Phase 1 — surge testimonials deterministic default (cherry-pick fix, spec item 4)

Kill the `Math.random()` at `selectUIBlocks.ts:34–37`. Deterministic rule, no manifest yet: pick by testimonial count when available, else fixed default (`ReviewGrid` — multi-proof suits the growth archetype; confirm below). Full "declared default + swap" lands in phases 2/5; this just stops nondeterminism now.

Frozen-fixture check: `generationContract.test.ts` was grepped — it pins NEITHER `ReviewGrid` nor `PullQuoteWithMark`, so no fixture re-freeze is expected; `test:run` is the backstop if any other fixture disagrees.

**Files touched**
- `src/modules/audience/service/selectUIBlocks.ts` — replace random with deterministic pick; keep `pickTemplateLayout` shape.
- `src/modules/audience/service/selectUIBlocks.test.ts` (new) — surge testimonials stable across repeated calls; non-surge templates unchanged; unknown sections still skipped.

**Steps**
1. Replace random branch with fixed/count-based deterministic choice.
2. Add regression test (call N times, single result).

**Verification:** `npm run test:run` (new test + `generationContract.test.ts` frozen fixtures stay green — see note above) + `npx tsc --noEmit`.

---

## Phase 2 — block manifest data model + explicit declarations (spec items 1, 3)

Introduce the D18 declaration surface as pure data. Shape:

```ts
// concept, not final code
BlockDeclaration = {
  layoutName: string;            // schema/dispatch key
  label: string; blurb?: string; // editor swap-card copy
  consumes: string[];            // canonical element keys ⊆ section contract
  capacity?: { minCards: number; maxCards: number };
  requiresAssets?: AssetKind[];  // 'photos' | 'logos' | 'testimonialPhotos' | …
  internalDispatch?: boolean;    // variants share one dispatcher component (surge/vestria legacy)
}
TemplateBlockManifest = Record<sectionType, { default: layoutName; variants: BlockDeclaration[] }>
blockManifests: Partial<Record<TemplateId, TemplateBlockManifest>>
```

**Manifest location — deliberate divergence from spec item 3.** The spec says declarations live "in registration (scale-01 registry)". The scale-01 registry entries are ASYNC DYNAMIC-IMPORT LOADERS (the bundle firewall): attaching declarations to them would force loading full template modules (components included) into the server-side generation/selection path — exactly what the firewall forbids. So declarations live in a NEW pure-data module `src/modules/templates/blockManifest.ts` (same dir as `templateMeta.ts`, same data-only idiom) — conceptually part of template registration, just its statically-importable half.

Declare manifests for the templates this track touches: **meridian** (from `MERIDIAN_LAYOUT_NAMES`), **hearth** (from `PILOT_LAYOUT_NAMES`), **surge** (incl. both testimonials variants — makes phase 1's default *declared*), **vestria** (incl. both hero variants — makes the existing swap declared). lex/lumen/granth/techpremium keep falling back to the existing name maps (defer full migration; see open Q6). `consumes` seeded from the existing element schemas (product: `meridianElementSchema`/`vestriaElementSchema` keys; service: pilot schema keys).

Conformance: new manifest test — every declaration's `consumes ⊆ getAllElements(contract).all` (product via `resolveEngineSectionSchema(layoutName)`; service via the pilot layout schema), `default` ∈ variants, capacity min ≤ max. No resolver checks yet (resolution + distinctness are phase 3 — they need variant-aware `resolveBlock`).

**Files touched**
- `src/modules/templates/blockManifest.ts` (new) — types + `blockManifests` data (pure, zero component imports).
- `src/types/template.ts` — export `AssetKind`/declaration types if shared typing warrants (types only; `resolveBlock` signature changes in phase 3).
- `src/modules/templates/blockManifest.test.ts` (new) — declaration conformance: consumes ⊆ contract, default membership, capacity sanity.

**Verification:** `npm run test:run` + `npx tsc --noEmit`.

---

## Phase 3 — variant-aware `resolveBlock` (registry plumbing, parity-neutral refactor)

Make dispatch honor the stored layout name with section-type fallback. No visual change anywhere (each touched section still has exactly one real registry variant; surge/vestria internal dispatchers keep working via fallback — see "Mixed dispatch model" invariant).

**Steps**
1. `TemplateModule.resolveBlock(blockType, mode, layoutName?)` — optional third param; update the A1 doc-comment (variant-aware now, fallback preserves template switching).
2. Both `getComponent()`s forward their existing `layoutName`/`layout` arg into `resolveBlock`.
3. Meridian + hearth resolvers: extend `BlockEntry` maps to `{ variants: Record<lowercasedLayoutName, {edit, published}>, default: layoutName }` keyed by section type; lookup = variants[layoutName] ?? default. Other templates' resolvers untouched (extra arg ignored — optional param keeps them contract-conformant).
4. Extend `conformance.test.ts` with a per-manifest-declaration suite, TWO assertions per declaration, in BOTH modes:
   a. **Resolution:** `resolveBlock(sectionType, mode, layoutName)` returns truthy non-placeholder (reuse `resolvesReal` with layout param).
   b. **Distinctness (the critical guard):** for every NON-default variant, the resolved component is `!==` (strict identity) the component resolved for the section's DEFAULT layout name. This catches the silent-fallback failure mode: a misspelled/misregistered variant key makes `variants[layoutName] ?? default` return the default — truthy AND non-placeholder, so check (a) alone stays green while the editor swap silently no-ops (renders default). Exemption: declarations flagged `internalDispatch: true` (surge testimonials, vestria hero — variants share ONE dispatcher component by design, branching happens inside it) are instead asserted as the SAME component for all their variants.

**Files touched**
- `src/types/template.ts` — `resolveBlock` signature.
- `src/modules/generatedLanding/componentRegistry.ts` — forward layout.
- `src/modules/generatedLanding/componentRegistry.published.ts` — forward layout.
- `src/modules/templates/meridian/resolveMeridianBlock.ts` — variant-keyed registry.
- `src/modules/templates/hearth/resolveServiceBlock.ts` — variant-keyed registry.
- `src/modules/templates/blockManifest.ts` — set `internalDispatch: true` on the surge-testimonials + vestria-hero declarations.
- `src/modules/templates/conformance.test.ts` — per-declaration resolution + **component-identity distinctness** suite (step 4b).
- (only if tsc demands) each template `index.ts` that re-types `resolveBlock`.

**Verification:** `npx tsc --noEmit` + `npm run test:run` — the new distinctness assertions MUST be present and passing (impl-reviewer: spot-check they FAIL when a variant key is deliberately misspelled — this suite is the only automated guard for the variation mechanism) + existing dispatch regression tests green + `npm run build` (registry touched ⇒ prove firewall/published path intact).

---

## Phase 4 — eligibility filter + selection threading (spec item 2)

Deterministic filter at assembly: `eligible(variant) = capacityFits(cardCountHint) ∧ assetNeedsMet(assetFacts)`; pick `default` if eligible, else first eligible in declaration order, else default (never fail generation). No AI, no random.

**Steps**
1. New pure module `src/modules/generation/blockEligibility.ts`: `AssetFacts` type (typed booleans: hasPhotos, hasLogos, hasTestimonials, hasTestimonialPhotos, …), `deriveAssetFactsFromServiceAssets(ServiceAssetInput)`, `deriveAssetFactsFromBrief(Brief)` (reads `proofAvailable` + typed `facts` keys), and `selectEligibleBlock(templateId, sectionType, {cardCountHint?, assetFacts?})`.
2. `selectProductBlocks` / `selectServiceUIBlocks`: optional `{ cardCountHints?, assetFacts? }` input; manifest-driven pick when a manifest entry exists, existing name-map fallback otherwise. Delete phase 1's stopgap `pickTemplateLayout` in favor of the surge manifest default.
3. Thread signals at the 6 call sites (all optional, so no caller breaks): `parseStrategyProduct.ts:281` (brief in scope → assetFacts; featureAnalysis/features length → hints), `parseStrategyService.ts:53` (`assets` already in scope), `thing.ts:385` + `multiPageAssembly.ts:132` (ob.features / importedTestimonials counts), both mock generators (pass what the mock input has; determinism improves mock stability).
4. Unit tests: capacity filter in/out, asset filter in/out (acceptance: `requiresAssets: photos` variant absent when facts say no photos), fallback-to-default when nothing eligible, no-hint ⇒ default.

**Files touched**
- `src/modules/generation/blockEligibility.ts` (new)
- `src/modules/generation/blockEligibility.test.ts` (new)
- `src/modules/audience/product/selectBlocks.ts`
- `src/modules/audience/service/selectUIBlocks.ts`
- `src/modules/audience/service/selectUIBlocks.test.ts` (extend)
- `src/modules/audience/product/strategy/parseStrategyProduct.ts`
- `src/modules/audience/service/strategy/parseStrategyService.ts`
- `src/modules/wizard/generation/thing.ts`
- `src/modules/generation/multiPageAssembly.ts`
- `src/modules/prompt/mockResponseGeneratorProduct.ts`
- `src/modules/prompt/mockResponseGeneratorService.ts`

**Verification:** `npm run test:run` (incl. `generationContract.test.ts` frozen fixtures — defaults unchanged for existing templates, so fixtures must stay byte-stable) + `npx tsc --noEmit`.

---

## Phase 5 — editor swap generalization + card-count clamp (spec items 5, 7) — **HUMAN GATE (manual editor QA)**

Generalize the vestria-hero-only selector into a manifest-driven variant picker; add the clamp-with-warning policy for manual swaps to smaller-capacity blocks.

**Steps**
1. New `BlockVariantSelector.tsx` — generalized from `VestriaHeroVariantSelector` (card list from manifest `label`/`blurb`; generic thumbs OK for pilot). Lists **eligible** variants only w.r.t. asset facts derived from CURRENT editor state (uploaded images/logos present in section content ⇒ facts true — this is how "appears after photos uploaded" passes); capacity does NOT filter in the editor — it clamps (spec item 7).
2. `LayoutChangeModal.tsx`: replace the vestria-hero special case with a manifest gate — `usesTemplateModule && manifest variants > 1` ⇒ `BlockVariantSelector`; else null. Vestria hero + surge testimonials get swap through the same path (delete `VestriaHeroVariantSelector.tsx`, keep its content-preserving `updateSectionLayout`-only semantics and move `VESTRIA_HERO_LAYOUTS` knowledge into the manifest).
3. Clamp: on selecting a target with `capacity.maxCards < currentCardCount`, show inline warning ("keeps first N cards; undo restores"); on confirm, wrap in ONE `executeUndoableAction`: `updateSectionLayout` + `setSection` with collection arrays truncated to `maxCards` (drop from the end — "weakest" = trailing, pilot policy). No clamp needed ⇒ layout-only swap, content untouched.
4. `SectionToolbar.tsx` (`components/toolbars/`): verify/adjust the swap-button visibility gate so it shows exactly when the manifest offers >1 variant for the section (today it's effectively vestria-hero-gated via `getSectionTypeFromLayout` quirks — see LayoutChangeModal L58–62 note).
5. Component test (jsdom) for the clamp helper (pure function extracted, e.g. `clampSectionCards()` in a plain module) — truncation + no-op cases.

**Files touched**
- `src/app/edit/[token]/components/ui/BlockVariantSelector.tsx` (new)
- `src/app/edit/[token]/components/ui/LayoutChangeModal.tsx`
- `src/app/edit/[token]/components/ui/VestriaHeroVariantSelector.tsx` (delete, folded in)
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx` — swap-button visibility gate (path verified)
- `src/modules/generation/blockEligibility.ts` (editor-side asset-fact derivation helper, kept pure)
- `src/app/edit/[token]/components/ui/clampSectionCards.ts` (new, pure) + `clampSectionCards.test.ts` (new)

**Verification:** `npx tsc --noEmit` + `npm run test:run` + **manual dev check**: vestria hero swap still works identically (live-customer flow — Golden Shadow); surge testimonials swap ReviewGrid↔PullQuoteWithMark preserves copy; undo restores clamped cards. → **Human gate: user signs off on editor behavior before phases 6–7 build on it.**

---

## Phase 6 — meridian variants: hero/features/testimonials ×2 (spec item 6) — **HUMAN GATE (parity QA)**

One NEW variant each next to `TerminalHero`, `HairlineFeatureGrid`, `ProofWithLogoRail` = 3 dual-renderer pairs. Each variant: `consumes ⊆ thingElementContract[sectionType]` (conformance enforces), distinct layout, declared capacity + `requiresAssets` where honest.

**The `requiresAssets: ['photos']` carrier is the NEW MERIDIAN HERO variant** (photo-led hero). Element-key rule for it, explicit: it consumes the EXISTING contract image key(s) that `thingElementContract.hero` already carries via the vestria-hero union (`elementContracts.ts:102–105` — VestriaTailoredHero/VestriaFullBleedHero image keys). Its `meridianElementSchema` entry uses those SAME canonical key names, so the contract-union output is unchanged and `consumes ⊆ contract` stays green. It must NOT invent a net-new key. The features + testimonials variants DO use the same element keys as their default siblings (`HairlineFeatureGrid`/`ProofWithLogoRail`) — the "same keys as default" rule applies to THEM, not to the photo hero (which reaches into contract-union keys the default doesn't consume; that is legal and is the point).

**Steps**
1. Visual direction per variant agreed with user BEFORE building (see open Q3) — 1-line brief each.
2. Build 3 pairs under `src/modules/templates/meridian/blocks/{Hero,Features,Testimonials}/` — `.tsx` + `.published.tsx`, shared `*.styles.ts` plain modules, identical markup/CSS across the pair, `data-surface` respected.
3. Register: schema entries (new layout names; keys per the rule above — photo hero uses existing contract image keys, features/testimonials mirror their defaults) in `meridianElementSchema`; add layout names to `THING_GENERATION_LAYOUTS` (`elementContracts.ts:155`) so generation/regeneration resolves their contract; variant map entries in `resolveMeridianBlock.ts`; declarations in `blockManifest.ts` (consumes/capacity + `requiresAssets: ['photos']` on the hero variant + label/blurb).
4. Conformance auto-covers: contract-subset (phase 2 suite) + resolution + **component-identity distinctness vs the section default** in both modes (phase 3 suite) for all 3 new declarations. Eligibility test (phase 4 suite) already asserts the photo hero drops out when `assetFacts.hasPhotos=false`.

**Files touched**
- `src/modules/templates/meridian/blocks/Hero/<NewHero>.tsx` + `.published.tsx` (+ `.styles.ts`)
- `src/modules/templates/meridian/blocks/Features/<NewFeatures>.tsx` + `.published.tsx` (+ `.styles.ts`)
- `src/modules/templates/meridian/blocks/Testimonials/<NewTestimonials>.tsx` + `.published.tsx` (+ `.styles.ts`)
- `src/modules/templates/meridian/resolveMeridianBlock.ts`
- `src/modules/audience/product/elementSchema.ts` (3 schema entries)
- `src/modules/engines/elementContracts.ts` (`THING_GENERATION_LAYOUTS` += 3)
- `src/modules/templates/blockManifest.ts` (3 declarations)

**Verification:** `npx tsc --noEmit` + `npm run test:run` (conformance: subset + resolution + **distinctness** green for the 3 new declarations) + `npm run build` (published CSS/assets) + **manual parity QA per `/manual-test`**: each new variant editor↔published pixel-parity, swap-and-publish round trip; photo hero hidden in editor selector until an image is uploaded, appears after. → **Human gate before merge of this phase.**

---

## Phase 7 — hearth variants: hero/services/testimonials ×2 — **HUMAN GATE (parity QA)**

Mirror of phase 6 on the service flagship: one new variant each next to `PetalFramedHero`, `IconServiceCards`, `PullQuoteWithMark` (spec's "features" = hearth's `services` section). Service contract source = pilot layout schema, so each new layout name gets a `PILOT_UIBLOCK_SCHEMA`-style entry in `service/elementSchema.ts` with the SAME element keys as its default sibling. Hearth variants declare capacity only — the photo-gating acceptance is carried by the meridian hero (phase 6); a hearth `requiresAssets` declaration is allowed only against existing keys (e.g. `testimonialPhotos` on an existing avatar/photo key — implementer's call, not required).

**Steps**
1. Visual direction agreed (same gate as phase 6 step 1).
2. Build 3 dual-renderer pairs under `src/modules/templates/hearth/blocks/{Hero,Services,Testimonials}/`.
3. Register: schema entries in `service/elementSchema.ts`; variant map in `hearth/resolveServiceBlock.ts`; declarations in `blockManifest.ts`. Conformance auto-covers subset + resolution + **distinctness** (both modes).
4. End-to-end acceptance pass (spec): generate fixture ⇒ default blocks; editor swap ⇒ identical copy re-rendered **in the new block** (distinctness test is the automated proxy; manual QA confirms visually); photo-requiring variant hidden until photos exist; surge testimonials deterministic across regenerations.

**Files touched**
- `src/modules/templates/hearth/blocks/Hero/<NewHero>.tsx` + `.published.tsx` (+ `.styles.ts`)
- `src/modules/templates/hearth/blocks/Services/<NewServices>.tsx` + `.published.tsx` (+ `.styles.ts`)
- `src/modules/templates/hearth/blocks/Testimonials/<NewTestimonials>.tsx` + `.published.tsx` (+ `.styles.ts`)
- `src/modules/templates/hearth/resolveServiceBlock.ts`
- `src/modules/audience/service/elementSchema.ts` (3 schema entries)
- `src/modules/templates/blockManifest.ts` (3 declarations)

**Verification:** `npx tsc --noEmit` + `npm run test:run` + `npm run build` + **manual parity QA** (editor↔published per variant, publish round trip) + full spec-acceptance checklist. → **Human gate: final track sign-off before merge to main.**

---

## Orchestrator decisions (open-question resolutions)

- **Q1 → ReviewGrid**, count-based rule OK (plan default; multi-proof suits growth archetype). Conservative, reversible.
- **Q2 → yes**, derive capacity hints from content counts; no-hint ⇒ default (reviewer confirmed no acceptance bullet tests cardCount).
- **Q6 → defer** lex/lumen/granth/techpremium migration; they fall back to legacy name maps (as planned).
- **Q7 → drop trailing cards** for the clamp (pilot policy).
- **Q3/Q4/Q5 → deferred to the phase-5 human gate** (all editor/visual decisions that surface at/after that gate; Q3 visual briefs needed at phase 6, after the gate).

## Unresolved questions

1. Surge testimonials default: `ReviewGrid` or `PullQuoteWithMark`? (Plan assumes ReviewGrid; count-based rule OK?)
2. No live `cardCounts` exists (legacy-only) — OK to derive capacity hints from content counts (features.length, importedTestimonials.length), no-hint ⇒ default?
3. Visual direction for the 6 new variants — who specs? 1-line briefs from you at phase 6/7 start, or implementer proposes?
4. OK to delete bespoke `VestriaHeroVariantSelector` in favor of generic selector (vestria = live customer)?
5. Editor asset-facts = presence of uploaded image/logo URLs in project content — acceptable T2 proxy?
6. Full manifest migration for lex/lumen/granth/techpremium now, or defer (fallback to legacy maps) as planned?
7. "Drop weakest cards" clamp = drop trailing cards — good enough for pilot?
