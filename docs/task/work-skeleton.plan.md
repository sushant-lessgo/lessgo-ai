---
WORKDIR: C:\Users\susha\lessgo-ai\.claude\worktrees\work-skeleton
Branch: feature/work-skeleton
Spec: docs/task/work-skeleton.spec.md (tier: full)
---

# work-skeleton — plan (phase D1 of the work vertical)

## Overview

Build the FIRST skeleton layer: one **work skeleton** module (`src/modules/skeletons/work/`)
owning ALL markup for the frozen work-core sections as single-source `.core.tsx` blocks
(granth pattern), with a per-section layout library (scale-09 variant machinery + a new
SLOT mechanism), bounded token contracts, a user style-token (Design ▾) surface, and one
skeleton-owned published JS asset. On top: **Atelier as skin #1** — a template dir with
tokens + palettes + selections and ZERO markup (conformance-enforced), registered through
the existing `TemplateModule` registry with zero contract or DB change. Pilot slice (Home
page, Kundius content, both renderers, screenshot-compared) gates before fan-out; old
`atelier` module stays byte-untouched until Kundius sign-off.

**Ruling the scout's open decision:** skin tokens/palettes/selections are **compile-time**
(baked in the per-id skin barrel — keeps the zero-markup conformance checkable, zero DB
churn, and the Kontur 1-day spike is a small code drop). **User** style tokens (Design ▾
vocabulary) are **runtime** — read from `Project.themeValues.styleTokens` and injected as
per-section CSS vars by the skeleton's injectors (precedent: `knobs`, byte-neutral for
every other template). Tradeoff accepted: adding a skin requires a deploy (fine — skins
are designer-curated, not user data).

## Orchestrator rulings — UNATTENDED RUN (founder asleep 2026-07-15, reviews tomorrow)
Founder authorized proceeding through human gates with conservative defaults.
- In-phase gates (pilot ph5 / freeze ph7 / Kundius sign-off ph8): PROCEED on automated proof (e2e parity editor==published + conformance + coreParity green). Visual eyeball vs designer HTML = PENDING founder review, flagged not blocking.
- Phase 9 (cutover to live `atelier` id): DEFERRED — touches live Kundius (paying customer) prod rendering; needs explicit founder go. Pipeline merges through phase 8; phase 9 = post-merge follow-up.
- MERGE to main + push: NOT done unattended — prepared green on feature branch + comprehension check; founder merges/pushes.
- Unresolved Qs resolved conservatively: (1) keep temp id atelier2; (2) DEFER cutover; (3) manage-photos → /dashboard/library placeholder; (4) optional sections = placeholder fallback (grow-on-demand); (5) sticky/headerMode in themeValues.styleTokens (design state); (6) pilot header = default arrangement only.

## Progress log

- phase 1 slot mechanism (scale-09 extension): done (review loops 1, ship). CARRY-FWD: conformance.test.ts:301 sums set.variants.length for a coverage stat — switch to builtVariants when the first real slot (WorkHeroVideo) lands in phase 3.
- phase 2 skeleton foundation (primitives · factory · token contracts · style tokens): done (review loops 1, ship). CARRY-FWD to phase 3 (do FIRST): break the skin.ts↔ThemeInjector/SSRTokens import cycle — extract buildWorkStylesheet + serialize helpers + WorkSkinDef type into a plain stylesheet.ts/skinTypes.ts (granth one-directional parity); eval-safe today but fragile under bundler/HMR.
- phase 3 seam lands — TemplateId cascade + atelier2 skin + ONE hero block end-to-end: done (review loops 1, ship). Cycle broken (stylesheet.ts extracted). 8-map cascade complete, no 9th. Slot WorkHeroVideo declared+skipped. +2 pre-authorized test edits (templateMeta.test, serveGate.test = assertion mirrors). Nits (non-block): dead knobs re-export registry.ts:142; content?:any in hero.published (granth precedent).
- phase 4 remaining pilot blocks (header/gallery/proof/contact/footer) + mocks + harness: done (review loops 1, ship). Pilot Home slice complete (6 blocks). AC L120 gallery-group-refs proven. CARRY-FWD (CONTRACT gap, NOT skeleton — flag founder): workElementContract.contact has no destination field for non-form channels (whatsapp/booking/call) → those CTAs dead '#' on generated content; belongs to phase-A/copy-engine contract, pilot uses form so unaffected. Nits: mock editBasics counts informational; footer socials add-affordance hidden when empty.
- phase 5 published pipeline (work.v1.js · htmlGenerator · editor behaviors) — pilot gate: pending
- phase 6 layout library completion (header ×5 · hero ×3+slot · gallery ×3 · proof ×3 · sticky): pending
- phase 7 section coverage + zero-markup/bounds conformance — freeze gate: pending
- phase 8 kundius end-to-end + parity QA — sign-off gate: pending
- phase 9 cutover to `atelier` id + docs close-out — gated: pending

---

## Architecture decisions (design against these; do not re-derive)

### A. Registry seam — zero contract change
- New skeleton-backed templateId (dev name **`atelier2`**, cutover in phase 9) gets a
  normal `templateRegistry` entry whose loader `import()`s the skin barrel
  `@/modules/templates/atelier2`. The barrel statically imports the skeleton factory:
  `makeWorkSkeletonModule(skin)` returns the full `TemplateModule` surface
  (`resolveBlock`/`ThemeInjector`/`SSRTokens`/`getSurfaceForSection`/defaults/`variants`/
  `defaultKnobs`). Dispatch firewall intact: skeleton code rides in the skin's chunk;
  nothing new is statically imported by `registry.ts` or the main bundle.
  (`templateConformance.ts` DOES statically import every template's resolver — it is
  vitest-only infra, already imports the old atelier resolver, not part of the firewall.)
- **TemplateId-union cascade (tsc-forced — the field-ADD twin of the field-drop lesson).**
  Adding `'atelier2'` to `templateIds` makes every NON-`Partial` `Record<TemplateId,…>`
  map non-exhaustive. Grep-verified complete list in this repo:
  `src/types/service.ts` (`defaultVariantForTemplate` L45, `templateLabels` L336,
  `templateBlurbs` L348, `PALETTES_BY_TEMPLATE` L361), `src/modules/templates/registry.ts`
  (`templateRegistry` L14), `src/modules/templates/templateMeta.ts` (`templateMeta` L68),
  `src/modules/brief/serveGate.ts` (`TEMPLATE_AUDIENCE` L99 — deliberately total so tsc
  forces this), `src/modules/templates/templateConformance.ts` (`RESOLVERS` L81).
  ALL EIGHT are in phase-3 Files touched; phase 9 mirrors the removals. NOT in the
  cascade (verified): `blockMocks/index.ts`, `blockManifest.ts`, `templateCatalog.ts`,
  registry's module `cache` (all `Partial<Record<…>>`); `CriticalFontPreload.tsx`
  (`switch (templateId)` with `default: return []` — no tsc break; atelier2 simply gets
  no LCP preload during dev phases, and at phase-9 cutover the existing `'atelier'` case
  already names the faces the skin harvests — no edit needed);
  `anchorLibrary.test.ts` / `blogRegistration.test.ts` (opt-in local template lists, not
  TemplateId-keyed maps — atelier is not enrolled in the blog list today).
- `WorkSkinDef` (typed in the skeleton): `{ id, tokens (validated against bounds),
  palettes, selections: { defaultLayoutBySection, surfaceBySection, headerMode },
  variants, defaultVariantId, defaultPaletteId, defaultKnobs?, imageKeywords }`.
- Skin dir contains ONLY `index.ts` + `skin.ts` (data). Enforced by the phase-7 purity test.

### B. Blocks — granth `.core.tsx` pattern, verbatim
- Layout ONCE in `Work<Name>.core.tsx` (plain module, no hooks) rendering via injected
  primitives `E` (`Txt`/`Img`/`Link`/`List` cloned from granth, PLUS two new skeleton
  primitives: `Logo` and `Nav` — the shared logo/menu primitives toolbarPlan open-Q#1
  asked for, built once here, attribute-driven, zero renegade UI). Edit wrapper ~10
  lines (`'use client'` → store hook → EditProvider + editPrimitives); published wrapper
  ~10 lines (flat props → `makePublishedPrimitives()`). Cores additionally receive
  `sectionId` (needed for the `data-sid` style-token hook — see D).
- Cores never paint section backgrounds (`data-surface` convention kept; surface mapping
  is a skin SELECTION over the skeleton's surface vocabulary in `sectionRules.ts`).
- Dispatch: ONE `resolveWorkBlock(sectionType, mode, layoutName)` with scale-09
  `SectionEntry { variants: Record<lc layoutName, {edit, published}>, default }` +
  placeholder fallback for unbuilt optional sections (granth precedent).
- Element keys/collections bind to the **phase-A frozen contract**
  (`src/modules/engines/workSections.ts`) — the copy engine (track C, merged) writes that
  shape; the skeleton renders it. Copy firewall: no skeleton/skin import ever enters
  engines/audience modules.
- **Layout-name schemas — registered where `contractFor` looks (atelier precedent).**
  `templateConformance.contractFor(layoutName)` resolves ONLY via
  `resolveEngineSectionSchema` → `productElementSchema[ln] ?? serviceElementSchema[ln]`
  (templateConformance.ts L146-151); it does NOT read the `layoutElementSchema`
  aggregator. So the work-skeleton layout schemas MUST reach `serviceElementSchema` —
  exactly how old atelier's `Atelier*` layouts already register (see the comment at
  `blockManifest.ts` L365 and `atelier/README.md`). Mechanics: schemas are DERIVED
  programmatically from `workElementContract` in a new
  `src/modules/audience/work/elementSchema.ts` (export `workLayoutElementSchema`), which
  `src/modules/audience/service/elementSchema.ts` SPREADS into `serviceElementSchema`
  (one-line merge). That single merge makes them visible to BOTH `contractFor`/`classify`
  (manifest conformance) AND the `layoutElementSchema` aggregator
  (`src/modules/sections/layoutElementSchema.ts` L357 already spreads
  `serviceElementSchema` — NO edit there). Additive entries are proven safe for the other
  `serviceElementSchema` readers (parseCopy keyed lookups, generationContract shape walk,
  surge registration) by the atelier precedent.

### C. SLOT mechanism (declared-not-built variants)
- `BlockDeclaration.slot?: true` in `blockManifest.ts`. A slot is metadata only: no
  component. Skips: conformance loop (c) resolution+distinctness, the consumes⊆contract
  loop, and the copyShape/both-ways check in `templateConformance.ts`; filtered out of
  `isBlockEligible`/`pickFromSet` (generation) and `isVariantOffered`
  (BlockVariantSelector); the two raw `set.variants.length` guards count BUILT variants
  only (see phase 1). New invariant test: a slot is never a set's `default`.
- D1 slots: `WorkHeroVideo` (video-bg hero — capability declared, built on first demand).

### D. Two token surfaces
1. **Skin tokens (template layer, bounded):** `tokenContract.ts` declares the skeleton's
   CSS var names + valid ranges (type scale, spacing, radius, hairlines, surface colors…)
   + a compatibility-matrix structure (entries added as the Kontur/Pulse lint discovers
   interactions). `assertSkinTokens(skin)` throws with a violation list; run for every
   registered skin inside `conformance.test.ts` → AC "out-of-range fails loud".
2. **User style tokens (Design ▾ layer, runtime):** vocabulary in
   `src/modules/skeletons/styleTokens.ts` — per-section `{ background, spacingY, corners,
   border, shadow, opacity, headerMode }`, every value a designed coordinate (enums/steps,
   no free knobs). Persisted at `Project.themeValues.styleTokens[sectionId]` (JSON — no
   migration). Emission: TemplateModule injectors get an OPTIONAL `styleTokens` prop
   (additive, like `knobs`); the skeleton's ThemeInjector/SSRTokens serialize
   `[data-sid="<sectionId>"]{--u-radius:…;}` blocks; every core's root emits
   `data-sid={sectionId}` and consumes `var(--u-*, <skeleton default>)`. Threading = 3
   call sites (`LandingPageRenderer.tsx` ~L963, `LandingPagePublishedRenderer.tsx` ~L220,
   `TemplateBlocksStage.tsx` ~L253) — other templates ignore the prop (knobs precedent =
   byte-neutral, keeps AC "existing templates byte-identical"). Panel UI = out of scope.
- Header sticky/fixed = `styleTokens[headerSectionId].headerMode: 'fixed'|'static'`
  (skin selection provides the default; user token overrides). Design state, not copy —
  keeps the frozen header element contract untouched.

### E. Published behaviors — ONE skeleton asset
- `src/lib/staticExport/workBehaviors.js` → built to `public/assets/work.v1.js`
  (`scripts/buildAssets.js` entry; lumen.v1.js pattern). Behaviors: hero slider (port
  from `atelierSliderBehaviors.js`), gallery lightbox, fixed header. Injected by
  `htmlGenerator.ts` when `templateId ∈ skeletonBackedTemplateIds` (pure-data list in
  `src/modules/skeletons/ids.ts`). Edit-side: small client effects in the edit wrappers
  mirror the asset (atelier `AtelierHero.tsx` precedent); parity mocks ship single-slide
  static state so both bands compare the same intended final state (the resolved
  atelier-phase-12 approach).

### F. Harness — extend, don't build (except purity)
- e2e visual parity: add skin id to `TEMPLATES` in `e2e/parity.spec.ts` + mocks in
  `src/modules/templates/blockMocks/atelier2.ts`. The mock set enumerates EVERY built
  layout variant (stage supports repeated sectionTypes) → the sampled grid = layouts ×
  skin × both renderers (AC L125).
- jsdom content parity: clone `renderParity.atelier.test.tsx` pattern →
  `src/modules/skeletons/work/renderParity.work.test.tsx`; clone `coreParity.test.ts`.
- Dispatch rows in `src/modules/templates/__tests__/dispatch.test.ts`.
- `publishedClientBoundary.test.ts`: extend its filesystem scan to include
  `src/modules/skeletons/**` published wrappers.
- NEW: skin file-purity conformance (phase 7) — zero markup/components in skin dirs.

### G. Coexistence + cutover
- Old `src/modules/templates/atelier/` = harvest source only (tokens, styles.ts values,
  leadFormMarkup, slider JS); NOT edited, NOT deleted in this pipeline. Live `atelier`
  id keeps pointing at it until phase 9 (human-gated). Old-module DELETION = post-merge
  follow-up after Kundius sign-off (recorded, not a phase). Kontur spike = post-merge
  follow-up (record verdict in `docs/tracks/templatePlan.md`), NOT a phase here.
- Designer lint sources: `template-design/designer-workspace/` is **gitignored → exists
  only in the MAIN repo dir** `C:\Users\susha\lessgo-ai\template-design\designer-workspace\`
  (read from there; it will not be present in this worktree).

---

## Phase 1 — SLOT mechanism (scale-09 extension)

Small, self-contained, unblocks the manifest work in phases 3/6.

**Files touched**
- `src/modules/templates/blockManifest.ts` (edit — add `slot?: true` to `BlockDeclaration`, doc comment)
- `src/modules/templates/templateConformance.ts` (edit — skip `slot` declarations in loop (c) resolution+distinctness, the consumes⊆contract loop, and the copyShape both-ways check; add invariant: slot never equals `set.default`)
- `src/modules/generation/blockEligibility.ts` (edit — `isBlockEligible` returns false for slots; `pickFromSet` filters ride on it. Slot filtering lives ONLY here on the generation side — `spread.ts` is pure hashing/RNG, never touches variants, NOT edited)
- `src/app/edit/[token]/components/ui/BlockVariantSelector.tsx` (edit — `isVariantOffered` (L77) false for slots; `hasMultipleVariants` (~L64) counts BUILT (non-slot) variants instead of raw `set.variants.length > 1` — a slot must not inflate the count)
- `src/app/edit/[token]/components/ui/LayoutChangeModal.tsx` (edit — the raw `set.variants.length <= 1` guard (~L73) counts BUILT (non-slot) variants for the same reason)
- `src/modules/generation/blockEligibility.test.ts` (edit — slot cases)
- `src/modules/templates/swap.test.ts` (edit — slot never offered/never default cases)

**Steps**
1. Add the field + JSDoc (slot = declared capability, no component; INVARIANT: never a default).
2. Guard the three conformance walks; add the never-default assertion inside the manifest data-conformance describe.
3. Filter slots at `isBlockEligible` (covers `pickFromSet`), the editor offer site
   (`isVariantOffered`), and switch the two raw-length guards (`hasMultipleVariants`,
   LayoutChangeModal) to built-variant counts (share one tiny `builtVariants(set)` helper
   if convenient — both files already import manifest types).
4. Tests: a synthetic manifest fixture with a slot → not offered, not eligible, conformance skips it, default-slot fails; harmless-for-existing check (no current manifest declares `slot` → counts unchanged).

**Verification:** `npx tsc --noEmit` · `npm run test:run` (conformance/swap/eligibility green; zero behavior change for existing manifests — no template declares `slot` yet).

---

## Phase 2 — Skeleton foundation (no blocks yet)

**Files touched (new unless noted)**
- `src/modules/skeletons/README.md`
- `src/modules/skeletons/ids.ts` (pure data: `skeletonBackedTemplateIds`, empty until phase 3 adds the skin id)
- `src/modules/skeletons/styleTokens.ts` (Design ▾ vocabulary types + value enums + `serializeStyleTokens(styleTokens) → css`)
- `src/modules/skeletons/work/tokenContract.ts` (skeleton CSS-var names, bounds, compatibility-matrix structure, `assertSkinTokens()`)
- `src/modules/skeletons/work/skin.ts` (the `WorkSkinDef` type + `makeWorkSkeletonModule(skin)` factory)
- `src/modules/skeletons/work/sectionRules.ts` (surface vocabulary + default section→surface map; skin override hook)
- `src/modules/skeletons/work/ThemeInjector.tsx` (`'use client'`; parameterized by skin: base tokens + palette + variant + knobs + styleTokens serialization)
- `src/modules/skeletons/work/SSRTokens.tsx` (plain/server-safe twin)
- `src/modules/skeletons/work/resolveWorkBlock.ts` (variant-aware SectionEntry dispatch + `WorkPlaceholderBlock` fallback; registry map filled in phases 3/4/6/7)
- `src/modules/skeletons/work/WorkPlaceholderBlock.tsx`
- `src/modules/skeletons/work/blocks/primitives.ts` (granth clone + `Logo`/`Nav` primitive types)
- `src/modules/skeletons/work/blocks/editPrimitives.tsx` (granth clone adapted; Logo/Nav emit `data-element-key`/`data-section-id` only — NO bespoke upload buttons/popovers/NavigationEditor)
- `src/modules/skeletons/work/blocks/publishedPrimitives.tsx` (granth clone adapted)
- `src/modules/skeletons/work/hooks/useWorkBlock.ts` (clone of `useGranthBlock`)
- `src/modules/skeletons/work/tokenContract.test.ts` (bounds loud-fail + styleTokens serializer unit tests)
- `src/types/template.ts` (edit — optional `styleTokens` prop on `ThemeInjector`/`SSRTokens` signatures)
- `src/modules/generatedLanding/LandingPageRenderer.tsx` (edit — pass `themeValues.styleTokens`)
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx` (edit — same)
- `src/app/dev/blocks/TemplateBlocksStage.tsx` (edit — same, for the harness)
- `src/modules/templates/publishedClientBoundary.test.ts` (edit — scan `src/modules/skeletons/**` too)

**Steps**
1. Clone the granth primitives trio; extend with `Logo` (image-or-text logo, Link-wrapped home href) and `Nav` (nav_links collection renderer) — both pure attribute emitters in edit mode (Text/Image/Link/Section toolbars auto-consume; the shell-resident Header toolbar itself is toolbarPlan territory, D1 only exposes the surface).
2. Write `tokenContract.ts`: var names (`--wk-*`), numeric bounds per token, enum tokens, `assertSkinTokens` throwing a full violation list; compatibility-matrix structure (may start empty).
3. Write `styleTokens.ts` vocabulary (background · spacingY · corners · border · shadow · opacity · headerMode) + serializer to `[data-sid]` CSS blocks.
4. Factory + injectors + dispatch + placeholder. Factory validates the skin with `assertSkinTokens` at module init (a bad skin fails loud at load, and in phase-7 conformance).
5. Thread `styleTokens` (3 call sites; optional prop, other templates unaffected).
6. Extend the boundary test glob.

**Verification:** `npx tsc --noEmit` · `npm run test:run` (new unit tests + boundary test green; all existing suites untouched-green) · `npm run build` (proves the prop threading is byte-neutral for existing templates).

---

## Phase 3 — Seam lands: TemplateId cascade + atelier2 skin + ONE hero block end-to-end

Smallest slice that proves the whole skin→skeleton seam: the `atelier2` id exists
everywhere tsc forces it, the skin barrel loads through the registry, ONE block
(hero slider) renders in the dev stage in BOTH bands, and the manifest (hero + the
`WorkHeroVideo` slot) passes conformance — including `contractFor` resolving the new
work layout schema.

**Files touched (new unless noted)**
- TemplateId cascade (COMPLETE tsc-forced list — see §A; the implementer must not need
  files outside this list to get `tsc --noEmit` green):
  - `src/types/service.ts` (edit — add `'atelier2'` to `templateIds` + entries in `defaultVariantForTemplate`, `templateLabels`, `templateBlurbs`, `PALETTES_BY_TEMPLATE` (= atelierPalettes); NOT added to any picker catalog)
  - `src/modules/templates/registry.ts` (edit — `atelier2` loader)
  - `src/modules/templates/templateMeta.ts` (edit — `atelier2: { …, bespoke: true }` TEMPORARY until phase 7 flips it — dodges engine-core conformance while about is unbuilt)
  - `src/modules/brief/serveGate.ts` (edit — `TEMPLATE_AUDIENCE.atelier2: 'service'`, mirroring the existing atelier entry; the map is deliberately total so tsc forces this)
  - `src/modules/templates/templateConformance.ts` (edit — `RESOLVERS.atelier2 = { resolve: resolveWorkBlock, placeholder: WorkPlaceholderBlock }`; test-only infra, static import is fine — see §A)
- Skin + registration:
  - `src/modules/templates/atelier2/index.ts` (new — barrel: `makeWorkSkeletonModule(atelierSkin)` re-exported as the TemplateModule surface)
  - `src/modules/templates/atelier2/skin.ts` (new — tokens harvested from `src/modules/templates/atelier/tokens.ts` + designer HTML; 4 palettes; selections: hero=slider, gallery=grid, surface map from old `sectionRules.ts`; variants editorial/compact; defaultKnobs)
  - `src/modules/skeletons/ids.ts` (edit — add `atelier2`)
- Hero block (the seam-proving quad):
  - `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts`
  - `src/modules/skeletons/work/resolveWorkBlock.ts` (edit — register hero entry)
- Manifest (hero + slot — proves the phase-1 slot skip against a REAL manifest):
  - `src/modules/skeletons/work/manifest.ts` (new — pure-data work-skeleton `TemplateBlockManifest`: hero declaration + `WorkHeroVideo` slot)
  - `src/modules/templates/blockManifest.ts` (edit — `blockManifests.atelier2 = workSkeletonManifest` import from the pure-data manifest module)
- Schemas (registered where `contractFor` looks — §B):
  - `src/modules/audience/work/elementSchema.ts` (new — `workLayoutElementSchema`: layoutName→schema entries DERIVED from `workElementContract`; hero entry this phase)
  - `src/modules/audience/service/elementSchema.ts` (edit — spread `workLayoutElementSchema` into `serviceElementSchema`; atelier precedent, makes `contractFor`/`classify` AND the `layoutElementSchema` aggregator see the entries with zero conformance-layer patch)
- Minimal dev-stage render:
  - `src/modules/templates/blockMocks/atelier2.ts` (new — hero mock only this phase; Kundius-derived, single slide per the parity convention)
  - `src/modules/templates/blockMocks/index.ts` (edit — register)

**Steps**
1. **Kontur+Pulse lint for the hero section FIRST** (read designer files from the main
   repo path, §G): record "reachable by tokens+variant? / needs variant later? / needs
   SLOT now?" — verdict row goes in this phase's audit.md (feeds the phase-7 freeze gate).
2. Land the FULL TemplateId cascade in one commit-sized move (the eight forced map
   entries above) — `tsc --noEmit` green is the proof the list is complete.
   (`CriticalFontPreload.tsx` intentionally NOT touched — default-fallback switch, §A.)
3. Build `WorkHeroSlider.core.tsx` against `workSections.ts` element keys (granth-donor
   contract shape). Core root: `data-sid`, `data-section-id` via primitives, consumes
   `var(--u-*, default)` hooks. Editor-side slider effect lands in phase 5 with the asset.
4. Derive + merge the hero layout schema; enroll the manifest; verify conformance loops
   (c)/(e) resolve `contractFor('WorkHeroSlider')` and SKIP the `WorkHeroVideo` slot.
5. Register the hero mock; verify `/dev/blocks/atelier2` renders the hero in edit +
   published bands.

**Verification:** `npx tsc --noEmit` (proves cascade complete) · `npm run test:run`
(conformance incl. manifest loops + slot skip on a real manifest; serveGate suite green;
all existing suites untouched-green) · `npm run build` · manual: `npm run dev` →
`/dev/blocks/atelier2` shows the hero, both bands.

---

## Phase 4 — Remaining pilot blocks + mocks + harness enrollment

Pilot slice completes = Home page blocks: **header (default arrangement) · hero slider
(phase 3) · gallery grid · proof testimonials · contact · footer** (footer added — a
home-page eyeball without a footer isn't credible), Kundius mock content, rendered in
the dev stage with edit + published bands.

**Files touched (new unless noted)**
- Blocks (each = `.core.tsx` + `.tsx` + `.published.tsx` + `styles.ts`):
  - `src/modules/skeletons/work/blocks/Header/WorkHeader.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts` (parametric shell; only default arrangement wired this phase)
  - `src/modules/skeletons/work/blocks/Gallery/WorkGalleryGrid.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts`
  - `src/modules/skeletons/work/blocks/Proof/WorkProofTestimonials.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts`
  - `src/modules/skeletons/work/blocks/Contact/WorkContact.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts` (+ `leadFormMarkup.tsx` harvested from old atelier)
  - `src/modules/skeletons/work/blocks/Footer/WorkFooter.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts`
- `src/modules/skeletons/work/resolveWorkBlock.ts` (edit — register the 5 entries)
- `src/modules/skeletons/work/manifest.ts` (edit — add the 5 pilot declarations)
- `src/modules/audience/work/elementSchema.ts` (edit — 5 new layoutName entries, still contract-derived; rides into `serviceElementSchema` via the phase-3 spread — no other schema file edits)
- `src/modules/skeletons/work/coreParity.test.ts` (new — clone granth/atelier pattern, covers all 6 pilot blocks)
- Harness:
  - `src/modules/templates/blockMocks/atelier2.ts` (edit — full pilot section set; source: `src/modules/audience/work/__tests__/fixtures/kundiusBrief.ts` + designer Atelier HTML)
  - `src/modules/templates/__tests__/dispatch.test.ts` (edit — atelier2 rows, all 6 pilot blocks)
- Fixture test for AC L120:
  - `src/modules/skeletons/work/galleryGroups.test.tsx` (new — jsdom: feed `groups` collection content mapped from kundiusBrief workFacts groups → gallery renders group name/cover references, asserts NO embedded photo-list markup)

**Steps**
1. **Kontur+Pulse lint for these 5 sections** (same protocol as phase 3 step 1) — verdict
   rows appended to the audit table.
2. Build cores against `workSections.ts` element keys (gallery over `groups`; proof over
   the testimonials donor shape; contact `contact_method`-aware: form → harvested
   lead-form markup, whatsapp/booking → CTA link). Every core root: `data-sid`,
   `data-section-id` via primitives, `var(--u-*, default)` hooks.
3. Gallery edit wrapper adds the minimal **"manage photos" link** (a plain link — NOT a
   toolbar) pointing at one exported constant `WORK_LIBRARY_BOARD_HREF` (re-pointed in
   D2 when the board exists).
4. Enroll mocks + dispatch rows; verify `/dev/blocks/atelier2` renders all 6 sections,
   both bands.

**Verification:** `npx tsc --noEmit` · `npm run test:run` (dispatch, conformance incl.
manifest loops, coreParity, galleryGroups) · `npm run build` · manual: `npm run dev` →
`/dev/blocks/atelier2` shows all 6 sections, edit+published bands.
(e2e parity enrollment lands with phase 5 — the slider's published behavior must exist
before the bands are final.)

---

## Phase 5 — Published pipeline + editor behaviors → PILOT GATE

**Files touched**
- `src/lib/staticExport/workBehaviors.js` (new — slider port from `atelierSliderBehaviors.js` + gallery lightbox + fixed-header; namespaced `data-wk-*` hooks; boot-once guard)
- `scripts/buildAssets.js` (edit — `{ src: 'workBehaviors.js', out: 'work.v1.js' }`; note: source path is under `src/lib/staticExport/` like the others)
- `src/lib/staticExport/htmlGenerator.ts` (edit — inject `work.v1.js` when `templateId ∈ skeletonBackedTemplateIds` from `src/modules/skeletons/ids.ts`)
- `src/lib/staticExport/htmlGenerator.test.ts` (edit — work.v1.js gating: injected for atelier2, NOT for meridian/hearth/old-atelier)
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.tsx` (edit — editor-side slider effect mirroring the asset, ≥2-slide guard)
- `src/modules/skeletons/work/blocks/Gallery/WorkGalleryGrid.tsx` (edit — editor-side lightbox effect if the published one exists; else defer lightbox to phase 6 with the strip/masonry work)
- `e2e/parity.spec.ts` (edit — add `atelier2` to `TEMPLATES`; add an atelier2 `?parityBreak=1` negative control test)

**Steps**
1. Port + namespace the behaviors; keep each behavior independently guarded (lumen pattern).
2. Gate injection off the pure-data id list (no registry import into htmlGenerator beyond what exists).
3. `npm run build` so `public/assets/work.v1.js` exists for e2e.
4. Run the parity suite; calibrate mocks if any band exceeds 3%.

**Verification:** `npx tsc --noEmit` · `npm run test:run` · `npm run build` ·
`npm run test:e2e -- parity.spec.ts` (atelier2 bands + negative control green) ·
manual publish smoke: generateStaticHTML unit path covered by htmlGenerator.test.

**HUMAN GATE — pilot slice sign-off:** founder eyeballs `/dev/blocks/atelier2`
(both bands) against the designer's Atelier HTML (main-repo `template-design/…/atelier/`
+ `delivery/`). Pass → fan-out (phases 6–8). Fail → adjust before ANY expansion.

---

## Phase 6 — Layout library completion

**Files touched (new unless noted)**
- `src/modules/skeletons/work/blocks/Header/WorkHeader.core.tsx` (edit — internal dispatch across the 5 arrangements: logo/nav/buttons permutations; ONE parametric component, vestria-hero internal-dispatch precedent for reading the stored layout in both modes)
- `src/modules/skeletons/work/blocks/Header/WorkHeader.tsx` / `.published.tsx` (edit — thread layoutName; sticky: read `styleTokens.headerMode`, emit `data-wk-header-mode`)
- `src/modules/skeletons/work/blocks/Hero/WorkHeroImage.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts`
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSplit.core.tsx` / `.tsx` / `.published.tsx` (LeftTextRightImage)
- `src/modules/skeletons/work/blocks/Hero/WorkHeroCenter.core.tsx` / `.tsx` / `.published.tsx` (AllCenter)
- `src/modules/skeletons/work/blocks/Gallery/WorkGalleryMasonry.core.tsx` / `.tsx` / `.published.tsx`
- `src/modules/skeletons/work/blocks/Gallery/WorkGalleryStrip.core.tsx` / `.tsx` / `.published.tsx`
- `src/modules/skeletons/work/blocks/Proof/WorkProofLogos.core.tsx` / `.tsx` / `.published.tsx`
- `src/modules/skeletons/work/blocks/Proof/WorkProofResults.core.tsx` / `.tsx` / `.published.tsx`
- (shared `styles.ts` per block family where cleaner)
- `src/modules/skeletons/work/resolveWorkBlock.ts` (edit — register all)
- `src/modules/skeletons/work/manifest.ts` (edit — 5 header declarations w/ `internalDispatch: true` on non-defaults; 4 hero variants + `WorkHeroVideo` slot; 3 gallery; 3 proof shapes with `copyShape` tags on logos/results — they read different collections, must never be blind-swapped with testimonials)
- `src/modules/audience/work/elementSchema.ts` (edit — new layoutName entries, still contract-derived)
- `src/modules/templates/blockMocks/atelier2.ts` (edit — enroll EVERY built layout as its own stage section → the sampled grid)
- `src/modules/templates/__tests__/dispatch.test.ts` (edit — rows)
- `src/lib/staticExport/workBehaviors.js` (edit — fixed-header behavior finalized; lightbox if deferred from phase 5)

**Steps**
1. Kontur+Pulse lint per new layout BEFORE building it (verdicts → audit; slot instead of build where the lint says token+variant can't reach it).
2. Canonical arrangements ported from classic patterns + the 13 designer systems (port, don't invent).
3. Header sticky: skin selection default + user styleTokens override; published behavior via work.v1.js; editor mirrors with a class toggle.
4. Distinctness guard covers all new variants automatically (conformance); slots skipped (phase 1).

**Verification:** `npx tsc --noEmit` · `npm run test:run` (conformance distinctness +
internalDispatch assertions + swap offers) · `npm run build` ·
`npm run test:e2e -- parity.spec.ts` (full layout grid × both renderers green).

---

## Phase 7 — Section coverage + purity/bounds conformance → FREEZE GATE

**Files touched (new unless noted)**
- `src/modules/skeletons/work/blocks/Packages/WorkPackages.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts` (price_mode-aware: exact/from/on-request)
- `src/modules/skeletons/work/blocks/About/WorkAbout.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts`
- `src/modules/skeletons/work/blocks/Faq/WorkFaq.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts`
- `src/modules/skeletons/work/blocks/Results/WorkResults.core.tsx` / `.tsx` / `.published.tsx` (standalone optional section; thin)
- `src/modules/skeletons/work/resolveWorkBlock.ts` (edit — register; remaining optionals — process/stats/logos/team/workdetail — stay on placeholder fallback, grow-on-demand per spec)
- `src/modules/skeletons/work/manifest.ts` (edit — complete)
- `src/modules/audience/work/elementSchema.ts` (edit — entries)
- `src/modules/templates/blockMocks/atelier2.ts` (edit — enroll)
- `src/modules/templates/templateMeta.ts` (edit — flip atelier2 off `bespoke`; declare `copyEngines: ['work']` + honest capabilities so engine-core conformance (hero·work·about·footer) now bites for real)
- `src/modules/templates/skinPurity.test.ts` (new — AC L121/122: for every id in `skeletonBackedTemplateIds`, scan `src/modules/templates/<id>/`: file whitelist {index.ts, skin.ts}, zero `.tsx`, zero JSX/component exports; plus run `assertSkinTokens` per skin and prove an out-of-bounds fixture skin throws)
- `src/modules/templates/conformance.test.ts` (edit — wire skin-token bounds assertion into the per-template walk if cleaner there)
- `src/modules/skeletons/work/renderParity.work.test.tsx` (new — jsdom content parity clone across all built blocks)

**Steps**
1. Lint remaining sections vs Kontur+Pulse; finish the per-section verdict table.
2. Build the 4 blocks; complete manifest + schemas + mocks.
3. Build purity + bounds tests; confirm old-atelier dir is NOT matched by the purity scan (it isn't in `skeletonBackedTemplateIds`).

**Verification:** `npx tsc --noEmit` · `npm run test:run` (engine-core conformance now
enforced for atelier2; purity + bounds red-team fixtures prove loud failure) ·
`npm run build` · `npm run test:e2e -- parity.spec.ts`.

**HUMAN GATE — block-shape freeze:** founder reviews the accumulated Kontur+Pulse lint
verdict per section (phases 3/4/6/7 audits, consolidated in this phase's audit). Pass →
shapes frozen; new needs become library variants/slots, never block rewrites.

---

## Phase 8 — Kundius end-to-end + parity QA → SIGN-OFF GATE

**Files touched**
- `src/modules/skeletons/work/__tests__/kundiusPages.test.tsx` (new — build FinalContent fixtures for the standard-archetype pages (home/work/prices/about/contact per `workPages.ts`) from Kundius real content; render each via the published renderer path (`generateStaticHTML`) asserting real markup markers per section, and via jsdom edit render asserting the same visible text — the content-parity proof on real data)
- `src/modules/templates/blockMocks/atelier2.ts` (edit — swap any placeholder copy for Kundius real content where the eyeball needs it)
- NO other source edits expected; bug-fix edits stay inside `src/modules/skeletons/work/**` + `src/modules/templates/atelier2/**`

**Steps**
1. Assemble the multi-page fixture (twin-field NL/EN NOT wired — verify only that block
   markup doesn't PRECLUDE the lumen data-en/data-nl pattern, i.e. text nodes render via
   `E.Txt` and no innerText assumptions; note in audit).
2. Run everything; then the manual pass against `npm run dev`:
   - editor: click-select on every block type → Text/Image/Section/Link toolbars
     auto-appear (attribute check); gallery manage-photos link jumps; no renegade UI in
     any skeleton block; header logo/menu editable via primitives.
   - style-token spot check: hand-write `themeValues.styleTokens[sectionId]`
     (radius+background) on a dev draft → renders in editor AND published output (AC L123).
   - publish a dev draft → `/p/<slug>` slider + lightbox + fixed header work (AC L118/119).

**Verification:** `npx tsc --noEmit` · `npm run test:run` · `npm run build` ·
`npm run test:e2e` (full) · the manual checklist above (record results in audit).

**HUMAN GATE — Kundius parity QA sign-off:** founder verifies editor == published on
her real content. This gate ALSO authorizes phase 9.

---

## Phase 9 — Cutover to the live `atelier` id + docs close-out (GATED)

Execute ONLY on explicit founder go at the phase-8 gate (touches the live Kundius
project's template resolution). If deferred, this phase ships as a follow-up and the
pipeline merges through phase 8.

**Files touched**
- `src/modules/templates/registry.ts` (edit — `atelier` loader → `import('@/modules/templates/atelier2')`; delete the temp `atelier2` entry)
- `src/types/service.ts` (edit — remove temp `'atelier2'` id + its map entries in all four `Record<TemplateId,…>` maps; `atelier` keeps its palettes/labels)
- `src/modules/brief/serveGate.ts` (edit — remove the temp `TEMPLATE_AUDIENCE.atelier2` entry; `atelier: 'service'` unchanged)
- `src/modules/templates/templateConformance.ts` (edit — `RESOLVERS.atelier` → `{ resolveWorkBlock, WorkPlaceholderBlock }`; drop the temp `atelier2` entry + the old atelier resolver import)
- `src/modules/templates/blockManifest.ts` (edit — `blockManifests.atelier` → work-skeleton manifest)
- `src/modules/templates/templateMeta.ts` (edit — atelier meta = the skeleton-skin declaration; drop temp id)
- `src/modules/skeletons/ids.ts` (edit — `['atelier']`)
- `src/lib/staticExport/htmlGenerator.ts` (edit — old `usesAtelier` slider.v1.js gate removed for the id now that work.v1.js covers it — the OLD module no longer renders under any id)
- `src/lib/staticExport/htmlGenerator.test.ts` (edit — gating expectations)
- `src/modules/templates/blockMocks/index.ts` + rename `blockMocks/atelier2.ts` → key under `atelier` (edit)
- `e2e/parity.spec.ts` (edit — TEMPLATES: `atelier` now = skeleton skin; old-atelier enrollment rides the same id)
- `src/modules/templates/__tests__/dispatch.test.ts` (edit — rows re-keyed)
- Docs: `docs/tracks/templatePlan.md` (edit — T9 status + Kontur-spike follow-up recorded), `docs/tracks/toolbarPlan.md` (edit — open-Q#1 answered: shared Logo/Nav primitives live on the skeleton), `src/modules/templates/README.md` + `src/modules/skeletons/README.md` (edit — layer map)

**Steps**
1. Flip the loader; verify old stored layout names (AtelierHero…) fall back to skeleton
   section defaults via resolveBlock's unknown-layout fallback (add a dispatch.test row
   proving `atelier` + `'AtelierHero'` → skeleton hero default, both modes).
   (`CriticalFontPreload.tsx` needs NO edit: its existing `'atelier'` case already
   preloads the display faces the skin harvested — verified §A.)
2. Verify `runWorkSkeleton` path (`src/modules/wizard/generation/work.ts`) still reads
   `mod.defaultKnobs` off the new module (no edit expected — surface is contract-shaped).
3. Old `src/modules/templates/atelier/` dir: UNTOUCHED (deletion + `atelier2/`→`atelier/`
   dir rename = post-merge follow-up after Kundius sign-off — record in templatePlan).
   Note: old-atelier `Atelier*` entries in `serviceElementSchema` + the old resolver stay
   in-tree until that same follow-up (harmless — nothing resolves them).

**Verification:** `npx tsc --noEmit` (proves the removal mirror is complete — same eight
forced maps as phase 3) · `npm run test:run` · `npm run build` · `npm run test:e2e` ·
manual: existing atelier dev draft loads in editor and republishes.

**HUMAN GATE — cutover execution + (separately, post-merge) old-atelier deletion.**

---

## Post-merge follow-ups (NOT phases here)
- **Kontur spike** (the architecture gate): second skin as `skin.ts` + `index.ts` only,
  ~1 day, zero markup → verdict recorded in `docs/tracks/templatePlan.md`.
- Old `atelier` module dir deletion + skin dir rename (after Kundius sign-off only) +
  removal of the old `Atelier*` serviceElementSchema entries.
- D2 re-points `WORK_LIBRARY_BOARD_HREF` at the real library board.

## Acceptance-criteria map
L117 → ph 3/4/6/7 · L118 → ph 6 (+8 manual) · L119 → ph 5 (+slot ph 1/3) · L120 → ph 4
(galleryGroups.test) · L121 → ph 7 (skinPurity) · L122 → ph 2+7 · L123 → ph 2 (+8 manual)
· L124 → ph 2/4 (primitives; shell toolbar itself = toolbarPlan) · L125 → ph 5/6 (parity
grid) · L126 → ph 2 build check + untouched old module · L127 → every phase + ph 8 ·
L128 → follow-up.

## Unresolved questions
1. Temp skin id `atelier2` OK? (final rename to `atelier` dir = post-deletion follow-up)
2. Cutover (phase 9) in-pipeline or defer to concierge patch? (gate decides, want default)
3. Manage-photos link target pre-D2-board — dashboard route placeholder OK?
4. Optional sections process/stats/logos/team/workdetail = placeholder fallback in D1 (grow on demand); workdetail waits for D2 library. OK?
5. Sticky/headerMode stored in `themeValues.styleTokens` (design state) not header content element — confirm.
6. Pilot header = default arrangement only, 5 perms land phase 6 (post pilot gate) — OK?
