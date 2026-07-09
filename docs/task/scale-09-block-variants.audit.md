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
