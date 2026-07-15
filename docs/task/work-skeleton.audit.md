# work-skeleton — audit

## Phase 1 — SLOT mechanism (scale-09 extension)

### Files changed
- `src/modules/templates/blockManifest.ts`
- `src/modules/templates/templateConformance.ts`
- `src/modules/generation/blockEligibility.ts`
- `src/app/edit/[token]/components/ui/BlockVariantSelector.tsx`
- `src/app/edit/[token]/components/ui/LayoutChangeModal.tsx`
- `src/modules/generation/blockEligibility.test.ts`
- `src/modules/templates/swap.test.ts`

### Per-file summary
- **blockManifest.ts** — added `slot?: true` to `BlockDeclaration` (JSDoc: declared-but-not-built capability; INVARIANT never a default). Added 3 pure helpers next to the types: `builtVariants(set)`, `builtVariantCount(set)`, `defaultIsSlot(set)`. Pure data — safe for client-UI import.
- **templateConformance.ts** — imports `defaultIsSlot`. Added `if (variant.slot) continue;` in loop (c) (resolution+distinctness), `if (decl.slot) continue;` in the consumes⊆contract loop, `if (A.slot || B.slot) continue;` in the (e) copyShape both-ways consistency loop. Added new `describe` "a slot is NEVER a set default (INVARIANT)" asserting `defaultIsSlot(set) === false` per section.
- **blockEligibility.ts** — `isBlockEligible` returns `false` early when `decl.slot`. This is the single generation-side slot filter; `pickFromSet`/`selectEligibleBlock` ride on it. `spread.ts` untouched (per plan).
- **BlockVariantSelector.tsx** — imports `builtVariantCount`. `hasMultipleVariants` now uses `builtVariantCount(found.set) > 1`. `isVariantOffered` is now exported and returns `false` for a slot (checked before the escape hatch).
- **LayoutChangeModal.tsx** — imports `builtVariantCount`; the `set.variants.length <= 1` guard is now `builtVariantCount(found.set) <= 1`.
- **blockEligibility.test.ts** — added `describe('isBlockEligible — SLOT ...')`: slot never eligible (even with all signals), non-slot sibling unchanged, seeded pick never surfaces the slot, fallback to built default.
- **swap.test.ts** — added `describe('SLOT ...')` with synthetic fixtures: slot never offered by `isVariantOffered` (incl. before-escape-hatch), slot does not inflate `builtVariantCount`, `defaultIsSlot` flags a slot-as-default fixture and passes a valid one.

### Shared helper location
`builtVariants` / `builtVariantCount` / `defaultIsSlot` live in `src/modules/templates/blockManifest.ts` (pure-data module), imported by both editor-UI files, the conformance suite, and tests.

### Behaviour neutrality
No existing manifest declares `slot`, so `builtVariants` = all variants and every skip/filter is a no-op for current data. Confirmed green with zero re-baselining.

### Verification
- `npx tsc --noEmit`: clean for all touched files. ONE pre-existing, unrelated error remains: `src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg'` (image-module typing; file exists on disk, not in this phase's scope). Not introduced by this change.
- `npm run test:run` (full): `Test Files 181 passed | 1 skipped (182)` · `Tests 3003 passed | 18 skipped (3021)`.
- Targeted suites (eligibility + swap + conformance): `3 passed`, `568 passed | 12 skipped`.

### Deviations
- Exported `isVariantOffered` from `BlockVariantSelector.tsx` (was file-local) so `swap.test.ts` can assert the slot-never-offered behavior directly per the plan. In-scope file; additive export only.

### Open risks
- Pre-existing `page.tsx` image-import tsc error is orthogonal but means a bare `tsc --noEmit` is non-zero-exit; downstream phases should filter for their own files.

## Phase 2 — Skeleton foundation (no blocks yet)

### Files changed
New:
- `src/modules/skeletons/README.md`
- `src/modules/skeletons/ids.ts`
- `src/modules/skeletons/styleTokens.ts`
- `src/modules/skeletons/work/tokenContract.ts`
- `src/modules/skeletons/work/skin.ts`
- `src/modules/skeletons/work/sectionRules.ts`
- `src/modules/skeletons/work/ThemeInjector.tsx`
- `src/modules/skeletons/work/SSRTokens.tsx`
- `src/modules/skeletons/work/resolveWorkBlock.ts`
- `src/modules/skeletons/work/WorkPlaceholderBlock.tsx`
- `src/modules/skeletons/work/blocks/primitives.ts`
- `src/modules/skeletons/work/blocks/editPrimitives.tsx`
- `src/modules/skeletons/work/blocks/publishedPrimitives.tsx`
- `src/modules/skeletons/work/hooks/useWorkBlock.ts`
- `src/modules/skeletons/work/tokenContract.test.ts`

Edited:
- `src/types/template.ts`
- `src/modules/generatedLanding/LandingPageRenderer.tsx`
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx`
- `src/app/dev/blocks/TemplateBlocksStage.tsx`
- `src/modules/templates/publishedClientBoundary.test.ts`

### Per-file summary
- **README.md** — module purpose, skeleton-vs-skin layer map, the two token surfaces, firewall/dual-renderer invariants, granth-pattern pointer.
- **ids.ts** — pure data: `skeletonBackedTemplateIds: string[] = []` (empty until phase 3) + `isSkeletonBacked(id)`. No React/template imports.
- **styleTokens.ts** — USER Design-menu vocabulary (types + enums for background/spacingY/corners/border/shadow/opacity/headerMode, every value a designed coordinate) + `serializeStyleTokens()` to `[data-sid]{--u-*}` blocks. Pure data.
- **work/tokenContract.ts** — SKIN token contract: `WorkSkinTokens`, `WORK_TOKEN_VARS`, bounds, enums, empty `WORK_TOKEN_COMPAT` matrix, `assertSkinTokens()` (throws full violation list), `serializeSkinTokens()` (root `--wk-*` + `[data-surface]`). `SkinTokenCarrier` param avoids a skin.ts cycle.
- **work/skin.ts** — `WorkSkinDef`/`WorkPalette`/`WorkVariantDef` types + palette/variant serializers + `buildWorkStylesheet()` (single source, byte-identical across renderers) + `makeWorkSkeletonModule(skin)` factory (calls `assertSkinTokens` at construction). Plain module.
- **work/sectionRules.ts** — `WorkSurface` vocabulary (paper/paper-2/dark/accent) + default section-to-surface map + `getSurfaceForSection(type, overrides)` skin-override hook.
- **work/ThemeInjector.tsx** — use-client `makeWorkThemeInjector(skin)` factory; injects `<style id="work-theme">` (buildWorkStylesheet + edit chrome), sets data-palette/variant/knob attrs; effect deps include styleKey so style-token changes re-emit.
- **work/SSRTokens.tsx** — server-safe `makeWorkSSRTokens(skin)` twin; same `<style>` payload (no edit chrome) + wrapper attrs. Imports only plain modules (no use-client value import).
- **work/resolveWorkBlock.ts** — variant-aware `resolveWorkBlock(type,mode,layout)` over scale-09 `WorkSectionEntry{variants,default}`; registry `WORK_BLOCK_REGISTRY = {}` (empty); every lookup falls back to `WorkPlaceholderBlock`.
- **work/WorkPlaceholderBlock.tsx** — server-safe placeholder (granth precedent).
- **work/blocks/primitives.ts** — TYPES-ONLY `WorkPrimitives` (Txt/Img/Link/List cloned from granth + new Logo/Nav prop types). Imports nothing from impls.
- **work/blocks/editPrimitives.tsx** — use-client clone; Txt/Img/Link/List backed by inlined `Editable` (InlineTextEditorV2) + store + LinkTargetPopover. Logo/Nav are pure attribute emitters delegating to the shared Img/Txt/Link/List (emit data-element-key/data-section-id) — NO bespoke upload button, popover, or NavigationEditor.
- **work/blocks/publishedPrimitives.tsx** — server-safe static clone incl. static Logo/Nav.
- **work/hooks/useWorkBlock.ts** — `useGranthBlock` clone; delegates to shared `useTemplateBlock`.
- **work/tokenContract.test.ts** — `assertSkinTokens` passes valid fixture / throws listing all 5 violations on a bad skin / throws on missing tokens; `serializeStyleTokens` field-order + dark-bg + default-skip + headerMode-not-serialized + empty-to-'' cases.
- **types/template.ts** — added OPTIONAL `styleTokens?: StyleTokens | null` to `ThemeInjector`/`SSRTokens` prop signatures (mirrors optional `knobs`; type-only import, erased).
- **LandingPageRenderer.tsx** — threads `styleTokens={themeValues.styleTokens}` at the knobs call-site (~L963), same pattern as knobs.
- **LandingPagePublishedRenderer.tsx** — added `styleTokens?` prop (default null) + threads `styleTokens={styleTokens ?? undefined}` into `<tmpl.SSRTokens>` (~L220), same pattern as knobs.
- **TemplateBlocksStage.tsx** — threads `styleTokens={undefined}` into the harness ThemeInjector (~L253); no styleTokens store state exists in the dev stage.
- **publishedClientBoundary.test.ts** — scan glob extended to also walk `src/modules/skeletons/**`; combined file list (dir currently holds zero `.published.tsx`) keeps the `>0` sanity check satisfied via the templates dir.

### Token var names declared (for phase 3+ block cores)
Skin tokens (`--wk-*`, from tokenContract + skin palettes):
`--wk-paper`, `--wk-paper-2`, `--wk-ink`, `--wk-ink-soft`, `--wk-ink-mute`, `--wk-line`, `--wk-line-soft`, `--wk-dark`, `--wk-on-dark`, `--wk-on-dark-soft`, `--wk-line-dark`, `--wk-ff-display`, `--wk-ff-body`, `--wk-ff-mono`, `--wk-fs-body`, `--wk-lh-body`, `--wk-wrap`, `--wk-gutter`, `--wk-sec-y`, `--wk-r`, `--wk-display-weight`; palette-supplied: `--wk-accent`, `--wk-accent-ink`, `--wk-accent-deep`.

Bounds: fsBodyPx [12,24] (`--wk-fs-body`) · lhBody [1.0,2.2] (`--wk-lh-body`) · wrapPx [960,1680] (`--wk-wrap`) · gutterPx [12,120] (`--wk-gutter`) · secPadYPx [32,260] (`--wk-sec-y`) · radiusPx [0,48] (`--wk-r`). Enum: displayWeight in {300,400,500,600,700,800} (`--wk-display-weight`). Compat matrix: empty (grows via Kontur/Pulse lint).

User style tokens (`--u-*`, from serializeStyleTokens): `--u-bg`, `--u-fg`, `--u-space-y`, `--u-radius`, `--u-border`, `--u-shadow`, `--u-opacity`. Block cores consume `var(--u-*, <skeleton default>)`. headerMode is NOT a var — it drives a `data-wk-header-mode` attr (phase 6).

### styleTokens threading confirmation
All 3 renderer call-sites thread `styleTokens` the SAME way `knobs` is threaded:
LandingPageRenderer (read `themeValues.styleTokens`) · LandingPagePublishedRenderer (prop into `<tmpl.SSRTokens>`) · TemplateBlocksStage (harness). Optional prop everywhere; existing templates ignore it → byte-neutral (confirmed by build).

### Verification
- `npx tsc --noEmit`: only the known pre-existing `src/app/page.tsx(6,26)` founder.jpg module-typing error remains; ZERO new errors from this phase.
- `npx vitest run` (full): `Test Files 182 passed | 1 skipped (183)` · `Tests 3011 passed | 18 skipped (3029)` (new tokenContract.test.ts = 9 tests; boundary test green with extended glob).
- `npm run build`: succeeded — proves the `styleTokens` prop threading is byte-neutral for existing templates.

### Deviations
- **editPrimitives Editable inlined** (not a separate `WorkEditable` file — none is in Files-touched). InlineTextEditorV2 wrapped directly inside `editPrimitives.tsx`. In-scope; keeps the file list exact.
- **Logo/Nav delegate to shared Img/Txt/Link/List** rather than building any Logo/Nav-specific UI — satisfies "zero renegade UI / no NavigationEditor". Conservative reading of "attribute emitter".
- **TemplateBlocksStage threads `styleTokens={undefined}`** (no styleTokens store state in the dev harness). Byte-neutral; a real switcher can wire it later.
- **skin.ts ↔ ThemeInjector/SSRTokens import cycle** is intentional and eval-safe: all cross-refs (`buildWorkStylesheet`, `makeWorkThemeInjector`, `makeWorkSSRTokens`) are hoisted `export function` declarations used only at call time. Documented in skin.ts header.

### Open risks
- The skeleton has NO consumer yet (no barrel/registry entry until phase 3), so `makeWorkSkeletonModule`/`assertSkinTokens` are type-checked + unit-tested but never invoked at build. Phase 3 wiring is the first real load.
- `buildWorkStylesheet` byte-parity between the two injectors rests on both calling it with identical args; the edit side additionally appends `EDIT_AFFORDANCE_STYLES` (edit-only, non-token). Parity of TOKEN CSS is preserved.

## Phase 3 — Seam lands: TemplateId cascade + atelier2 skin + ONE hero block

### Files changed
STEP 0 (cycle break) + 0b (carry-forward):
- `src/modules/skeletons/work/stylesheet.ts` (new)
- `src/modules/skeletons/work/skin.ts` (edit)
- `src/modules/skeletons/work/ThemeInjector.tsx` (edit — import source only)
- `src/modules/skeletons/work/SSRTokens.tsx` (edit — import source only)
- `src/modules/templates/conformance.test.ts` (edit — builtVariantCount sum)

Part A (cascade + skin + registry):
- `src/types/service.ts` (edit)
- `src/modules/templates/registry.ts` (edit)
- `src/modules/templates/templateMeta.ts` (edit)
- `src/modules/brief/serveGate.ts` (edit)
- `src/modules/templates/templateConformance.ts` (edit)
- `src/modules/templates/atelier2/index.ts` (new — barrel)
- `src/modules/templates/atelier2/skin.ts` (new — skin data)
- `src/modules/skeletons/ids.ts` (edit)

Part B (hero block + manifest + schema + dev render):
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.core.tsx` (new)
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.tsx` (new)
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.published.tsx` (new)
- `src/modules/skeletons/work/blocks/Hero/styles.ts` (new)
- `src/modules/skeletons/work/resolveWorkBlock.ts` (edit — register hero)
- `src/modules/skeletons/work/manifest.ts` (new — hero + WorkHeroVideo slot)
- `src/modules/templates/blockManifest.ts` (edit — atelier2 manifest)
- `src/modules/audience/work/elementSchema.ts` (new — workLayoutElementSchema)
- `src/modules/audience/service/elementSchema.ts` (edit — spread work schema)
- `src/modules/templates/blockMocks/atelier2.ts` (new — hero mock)
- `src/modules/templates/blockMocks/index.ts` (edit — register atelier2)

OUT-OF-PLAN-LIST test readers (see Deviations — mechanical cascade fallout):
- `src/modules/templates/templateMeta.test.ts` (edit)
- `src/modules/brief/serveGate.test.ts` (edit)

### Per-file summary
- **stylesheet.ts** — STEP 0. Extracted the `WorkSkinDef` type family (WorkPalette/WorkVariantDef/WorkSkinSelections/WorkSkinDef), `serializeWorkPalettes`, `serializeWorkVariants`, `buildWorkStylesheet` VERBATIM out of skin.ts into a plain, injector-free leaf module (imports only tokenContract, styleTokens, knobCss, template TYPES, sectionRules type). CSS output byte-identical to phase 2.
- **skin.ts** — now imports the type family + builder from `./stylesheet` and the injector factories from ThemeInjector/SSRTokens (one-directional). Keeps `makeWorkSkeletonModule`; re-exports the moved types/builder/serializers for back-compat. The old skin.ts <-> injector cycle is GONE (madge --circular = clean).
- **ThemeInjector.tsx / SSRTokens.tsx** — single-line import re-point `./skin` -> `./stylesheet`; no behavior change.
- **conformance.test.ts** — STEP 0b: the GLOBAL "at least one variant" sum now uses `builtVariantCount(set)` (imported) instead of raw `set.variants.length`, so the WorkHeroVideo slot does not inflate the coverage stat.
- **service.ts** — `atelier2` added to `templateIds` + entries in the four total `Record<TemplateId,...>` maps (defaultVariantForTemplate='editorial', templateLabels, templateBlurbs, PALETTES_BY_TEMPLATE=atelierPalettes). NOT added to any picker/catalog.
- **registry.ts** — `atelier2` dynamic loader `import('@/modules/templates/atelier2')`, mapping the barrel surface (matches existing loader shape). Firewall intact — dynamic import only.
- **templateMeta.ts** — `atelier2: { copyEngines:['work'], designStyles:['editorial-craft'], capabilities:[], bespoke:true }`. bespoke=TEMPORARY (dodges engine-core (a) while blocks unbuilt; phase 7 flips it). Empty capabilities => (b)/(b+) vacuous.
- **serveGate.ts** — `TEMPLATE_AUDIENCE.atelier2:'service'` (mirrors atelier; bespoke => off every shortlist => zero serve-behavior change).
- **templateConformance.ts** — `RESOLVERS.atelier2 = { resolve: resolveWorkBlock, placeholder: WorkPlaceholderBlock }` via static import (vitest-only infra, not a firewall breach).
- **atelier2/index.ts** — server-safe barrel: `makeWorkSkeletonModule(atelierSkin)` -> re-exports the TemplateModule surface only. No client-only helper re-exported.
- **atelier2/skin.ts** — the `atelierSkin: WorkSkinDef` DATA (values below). Zero markup.
- **ids.ts** — `skeletonBackedTemplateIds = ['atelier2']`.
- **WorkHeroSlider.core.tsx** — plain single-source hero. Binds to the FROZEN work-core hero contract keys (role_line/name/quote/portrait_image/cta_label/cta_href/socials[]). Full-bleed cover; root `<section>` carries `data-sid`+`data-section-id`+`data-wk-hero-slider`. Renders the STATIC first-slide (single portrait_image); slider effect deferred to phase 5.
- **WorkHeroSlider.tsx / .published.tsx** — ~10-line edit ('use client' -> useWorkBlock + WorkEditProvider + editPrimitives) and published (flat props -> makePublishedPrimitives) wrappers; both feed sectionId to the shared core.
- **styles.ts** — `wk-hero-*` CSS, token-driven via CSS vars only (var-consumption note below).
- **resolveWorkBlock.ts** — `WORK_BLOCK_REGISTRY.hero = { default:'workheroslider', variants:{ workheroslider:{edit,published} } }` (lowercased keys). WorkHeroVideo slot intentionally ABSENT (no component).
- **manifest.ts** — pure-data `workSkeletonManifest`: hero default `WorkHeroSlider` + `WorkHeroVideo` slot `{ slot:true }` (same consumes; never default). ONE manifest per skeleton (skins swap tokens only).
- **blockManifest.ts** — `blockManifests.atelier2 = workSkeletonManifest` (pure-data import).
- **audience/work/elementSchema.ts** — `workLayoutElementSchema` DERIVED from `workElementContract` via a layoutName->sectionKey map (phase 3: WorkHeroSlider->hero). Reads the contract; imports NO skeleton/skin module (copy firewall preserved).
- **audience/service/elementSchema.ts** — one-line `...workLayoutElementSchema` spread into `serviceElementSchema` (atelier precedent -> visible to contractFor/classify AND the layoutElementSchema aggregator, no aggregator edit).
- **blockMocks/atelier2.ts** — hero-only mock, real Kundius hero copy (golden kundius.home.json) mapped onto the frozen contract, single slide.
- **blockMocks/index.ts** — register `atelier2: atelier2Sections()`.

### Hero LINT verdict (Kontur + Pulse + Atelier) — feeds phase-7 freeze gate
| Designer hero | Layout | Reachable by tokens+variant of WorkHeroSlider? | Needs variant later? | Needs a SLOT now? |
|---|---|---|---|---|
| **Atelier** (atelier/index.html `.atl-cover`) | full-bleed dark cover slider; eyebrow/h1(em)/tagline/2 CTA; degrades to static first slide | YES — this IS the WorkHeroSlider baseline (tokens only) | no | no |
| **Kontur** (Kontur - Kundius `.hero-grid`) | 2-col editorial poster: copy-left / art-right w/ tag+meta overlays | NO — different arrangement; CONTENT maps (role_line/name/quote/portrait/cta) but layout cannot be tokens-only | YES — hero SPLIT variant (phase 6 WorkHeroSplit) | no |
| **Pulse** (Pulse `.hero-grid`) | 2-col big-portrait + name + claim | NO — split portrait arrangement; content maps | YES — hero image/split variant (phase 6) | no |
| Video-bg hero | full-bleed autoplay video cover | n/a | n/a | already a declared SLOT (`WorkHeroVideo`) |

Verdict: the frozen hero CONTENT contract covers all three designers; only ARRANGEMENT differs -> build-later variants (phase 6), not new slots. No new slot needed beyond the already-declared WorkHeroVideo.

### Cascade completeness
`tsc --noEmit` EXIT 0 (fully clean — the previously-noted page.tsx founder.jpg error no longer appears in this worktree; no new tsc errors introduced). The 8 tsc-forced maps in plan §A were the COMPLETE set — no 9th map surfaced. Two additional RUNTIME test-count/mirror assertions broke as mechanical fallout (not tsc-forced maps): see Deviations.

### atelier2 skin token values harvested (atelier/tokens.ts + designer HTML)
Colours (oklch, palette-invariant): paper 0.978/0.004/95 · paper2 0.945/0.006/95 · ink 0.165/0.010/60 · inkSoft 0.385 · inkMute 0.560 · line ink@0.16 · lineSoft ink@0.09 · dark=ink · onDark=paper · onDarkSoft 0.82/0.008/90 · lineDark paper@0.20. Fonts: display Bricolage Grotesque · body Hanken Grotesk · mono JetBrains Mono. Bounded numerics (design clamp/calc collapsed to in-range): fsBodyPx 16 · lhBody 1.6 · wrapPx 1380 · gutterPx 64 · secPadYPx 120 · radiusPx 3 · displayWeight 600. Palettes (accent duo + on-accent #fff): vermilion (default)/cobalt/moss/ochre — exact Kontur oklch. Variants: editorial (baseline, no overrides) / compact (Fraunces display + `--wk-sec-y:96px`). defaultVariant editorial, defaultPalette vermilion. imageKeywords for all 4 palettes. surfaceBySection override: hero='dark' (cover). headerMode 'static'. No knobs (skeleton has no knob system yet — Deviations).

### How the hero core consumes --u-* / --wk-*
SKIN tokens: `.wk-hero` base bg/fg via `--wk-dark`/`--wk-on-dark`; eyebrow dot + name `em` + CTA fill via `--wk-accent`/`--wk-accent-ink`; type via `--wk-ff-display`/`--wk-ff-body`/`--wk-ff-mono` + `--wk-display-weight`; layout via `--wk-wrap`/`--wk-gutter`; placeholder via `--wk-paper-2`/`--wk-ink-mute`. USER style tokens (each `var(--u-*, <skeleton default>)`): `--u-bg`/`--u-fg` (default wk-dark/wk-on-dark), `--u-space-y` (padding scale, default 1), `--u-opacity` (quote, default 0.92), `--u-radius` (CTA corners, default `--wk-r`). Root emits `data-sid={sectionId}` so styleTokens `[data-sid]{--u-*}` blocks target it in BOTH renderers.

### Verification
- `npx tsc --noEmit`: EXIT 0, clean.
- `npx vitest run` (full): Test Files 182 passed | 1 skipped (183) · Tests 3020 passed | 18 skipped (3038). `templateConformance(atelier2)` runs automatically (loop over templateIds): bespoke => (a) skipped; manifest (c) resolves `WorkHeroSlider` non-placeholder both modes + SKIPS `WorkHeroVideo` slot; (d)/(e) green; slot-never-default invariant green. serveGate + dispatch + all existing suites green.
- `npm run build`: succeeded.
- `madge --circular` over `src/modules/skeletons/work`: No circular dependency (STEP-0 cycle broken).

### Manual note — viewing /dev/blocks/atelier2
`npm run dev` -> `/dev/blocks/atelier2`. The `[template]/page.tsx` route gates on `templateId in templateRegistry` (atelier2 now present) -> renders `TemplateBlocksStage`, which `preloadTemplate('atelier2')` (registry loader -> skin barrel), reads `BLOCK_MOCKS.atelier2` (the hero mock), and renders the hero in BOTH bands: `resolveBlock('hero','edit','WorkHeroSlider')` (seeded edit store, mode:preview) above `resolveBlock('hero','published','WorkHeroSlider')` (flat props). Palette switcher lists the 4 skin palettes; variant toggle shows editorial/compact. Could not run a browser here; confirmed the route resolves atelier2 and the mock feeds it by construction (tsc + tests + build green).

### Deviations
- **Two out-of-plan-list test files edited** (`templateMeta.test.ts`, `serveGate.test.ts`). Both hardcode template COUNTS / mirror the TEMPLATE_AUDIENCE map and broke purely as mechanical fallout of the sanctioned TemplateId cascade (plan §A: "the field-ADD twin of the field-drop lesson" -> update all readers). Minimal mechanical edits: templateMeta counts 9->10 / 8->9 non-retired / allow atelier2 bespoke; serveGate TEMPLATE_AUDIENCE toEqual gains `atelier2:'service'`, DEVIATE set gains `atelier2`. No logic touched. Flagged because NOT on Files-touched; the "all existing suites green" gate required them.
- **atelier2 skin ships NO knobs/knobTokenMap/defaultKnobs.** The work skeleton has no knob CSS system yet (no knobTokenMap machinery), so defaultKnobs would be inert. Omitted (conservative); `buildWorkStylesheet` already no-ops knob CSS when knobTokenMap absent.
- **Hero binds to the granth-lineage frozen contract, single portrait_image (not a slide collection).** So WorkHeroSlider renders one static slide this phase; phase-5 slider guards `<2 slides` and degrades to exactly this. A slides collection would be a contract change (out of scope).
- **atelier2/skin.ts imports `WorkSkinDef` from `@/modules/skeletons/work/skin`** (back-compat re-export), not `./stylesheet`. Type-only; either path acyclic.

### Open risks
- atelier2 is dev-only (no picker/catalog); reachable only via `/dev/blocks/atelier2` + conformance/harness. First real editor/publish load lands phases 4-5.
- Only the hero resolves; every other atelier2 section falls to `WorkPlaceholderBlock` by design (phases 4/6/7). Manifest declares hero only, so conformance does not yet exercise other sections.
- Hero `data-surface` wrapper interaction (skin hero='dark' + core paints `--u-bg`/`--wk-dark`) is first exercised at phase-4/5 full-page render.

## Phase 4 — Remaining pilot blocks + mocks + harness enrollment

### Files changed
New (5 block quads + harvested markup + 2 tests):
- `src/modules/skeletons/work/blocks/Header/WorkHeader.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts`
- `src/modules/skeletons/work/blocks/Gallery/WorkGalleryGrid.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts`
- `src/modules/skeletons/work/blocks/Proof/WorkProofTestimonials.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts`
- `src/modules/skeletons/work/blocks/Contact/WorkContact.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts` / `leadFormMarkup.tsx`
- `src/modules/skeletons/work/blocks/Footer/WorkFooter.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts`
- `src/modules/skeletons/work/coreParity.test.ts`
- `src/modules/skeletons/work/galleryGroups.test.tsx`

Edited:
- `src/modules/skeletons/work/resolveWorkBlock.ts` (register 5 SectionEntry rows)
- `src/modules/skeletons/work/manifest.ts` (5 pilot declarations, default only)
- `src/modules/audience/work/elementSchema.ts` (5 layoutName→section entries)
- `src/modules/templates/blockMocks/atelier2.ts` (hero-only → full pilot set)
- `src/modules/templates/__tests__/dispatch.test.ts` (atelier2 rows, 6 pilot blocks)

### Per-block (contract keys bound · layout decision)
- **WorkHeader** (`header`) — binds logo_text · cta_label · cta_href + nav_links[]{label,href}. Uses shared `Logo`+`Nav` primitives (zero renegade UI). DEFAULT arrangement only (logo-left · nav-center · cta-right); other 4 perms + sticky = phase 6. logo_image is NOT in the frozen header contract → Logo `src` stays undefined → text wordmark always renders (conservative).
- **WorkGalleryGrid** (`work`) — binds eyebrow · heading · lead + groups[]{name,cover_image,href}. Renders GROUP REFERENCES ONLY (one cover + name per group) — never a flat photo list (AC L120, proven by galleryGroups.test). Edit-only "Manage photos →" link injected via a core `manageSlot` prop; published omits it.
- **WorkProofTestimonials** (`proof`) — binds eyebrow · heading · awards_line + quotes[]{text,source} (GranthCriticsGrid donor shape). Card grid = default proof shape; logos/results shapes = phase 6.
- **WorkContact** (`contact`) — binds eyebrow · heading · lead · contact_method · form_ref · cta_label. `contact_method`-aware: `form` → harvested lead-form markup (2-col card; edit=inert preview, published=real `<form data-lessgo-form>`); whatsapp/booking/call → single CTA link. leadFormMarkup.tsx harvested from `atelier/blocks/Contact` (renderer + default fields + submit/success text), re-classed `wk-contact-*`, server-safe (no hooks).
- **WorkFooter** (`footer`) — binds eyebrow · heading · note · copyright + socials[]{network,href} (GranthFollowFooter donor). Baseline top-band + socials + copyright; multi-column footer = phase-6 variant if needed. Reuses shared `footerHygiene.normalizeCopyrightYear`.

### Kontur + Pulse + Atelier LINT verdicts (feed phase-7 freeze gate)
| Section | Atelier | Kontur | Pulse | Reachable by tokens+variant of the built block? | Needs variant later? | Needs a SLOT now? |
|---|---|---|---|---|---|---|
| **header** | 3-col nav (centered logo) + CSS drawer | `.nav`/`.nav-in` logo·links·right bar | `.nav` brand·mid·right bar | YES for the CONTENT contract (logo/nav_links/cta) — the default logo-left arrangement is the WorkHeader baseline | YES — Atelier centered-logo + the other perms = phase-6 header arrangements (5) + sticky | no |
| **work/gallery** | home mosaic / work masonry (flat works) | editorial work grid | `.archive-grid` + `.archive-list` (list view) | YES — group-reference auto-fill grid is the baseline; content maps | YES — masonry + strip/list = phase-6 gallery variants | no |
| **proof** | quote band / critics grid | inline praise | voice/testimonial cards | YES — testimonials card grid is the default proof shape | YES — logos + results are the other two proof SHAPES (phase 6) | no |
| **contact** | 2-col copy + bordered form card | `.contact-copy`+`.contact-quick`+`.form` 2-col | `.cta-form` | YES — 2-col form path + whatsapp/booking/call CTA path both built; content maps | no (arrangement is tokens-reachable) | no |
| **footer** | closer CTA band + 3-col index footer | `.footer-big`+`.footer-cols`+bottom | `.footer-top`+brand+3 cols+bottom | YES for baseline (heading/note/socials/copyright); the closer band is non-contract chrome | Optional — multi-column footer arrangement = phase-6 variant if the eyeball wants it | no |
Verdict: all 5 frozen CONTENT contracts cover Atelier+Kontur+Pulse; only ARRANGEMENT differs → build-later library variants (phase 6), never new slots. No new slot needed this phase.

### WORK_LIBRARY_BOARD_HREF
`/dashboard/library` — exported from `WorkGalleryGrid.tsx` (edit wrapper only). Placeholder dashboard route; re-pointed in D2 when the library board exists.

### Verification
- `npx tsc --noEmit`: EXIT 0, clean (no page.tsx founder.jpg error present in this worktree).
- `npx vitest run` (full): Test Files 184 passed | 1 skipped (185) · Tests 3060 passed | 18 skipped (3078). Dispatch (6 pilot blocks resolve non-placeholder both modes, edit≠published), templateConformance(atelier2) manifest loops (c)/(3)/(e) green for header/hero/work/proof/contact/footer + WorkHeroVideo slot skipped, coreParity (6 cores, purity + SSR render), galleryGroups (AC L120) all green.
- `npm run build`: succeeded (exit 0).

### Manual note — /dev/blocks/atelier2 (static-state bands)
The stage `preloadTemplate('atelier2')` + `BLOCK_MOCKS.atelier2` now enumerate all 6 pilot sections (header/hero/work/proof/contact/footer). Each resolves via `resolveBlock(type, mode, layoutName)` → the built work block in BOTH the edit band (seeded store, editPrimitives) and the published band (flat props, makePublishedPrimitives). Could not run a browser here; confirmed by construction (tsc + dispatch + conformance + build green). Slider/lightbox/fixed-header published JS + e2e parity enrollment land in phase 5 — this phase's bands are static-state.

### Deviations
- **Contact non-form CTA rides `cta_href`** (not in the frozen contact contract — contract has contact_method/form_ref/cta_label). Not in `consumes` (conformance unaffected); like Atelier's non-schema chrome keys, it renders but is dropped by edit-extraction. Conservative: the form path (default `contact_method='form'`) is fully contract-backed; the channel-link href resolves from contact_method proper in a later phase.
- **Contact uses `form_ref`** (the frozen contract key) as the forms-system lookup key where Atelier used `form_id`. Mirrors atelier's edit-preview/published-real split otherwise.
- **Gallery "manage photos" link injected via a core `manageSlot` prop** (edit wrapper passes it, published passes nothing) rather than duplicating the section shell — keeps the single-source core and makes the edit-only affordance structurally impossible to leak into published.
- **editBasics for atelier2 is informational** (atelier2 not enrolled in `assertEditorBasics`, per phase-3 note) — authored plausibly, not asserted.

### Open risks
- Photography image slots ship EMPTY in the mocks (cores render placeholders); the phase-5 pilot-gate eyeball compares layout/copy parity, not stock art.
- Only the 6 pilot sections resolve; packages/about + optionals still fall to `WorkPlaceholderBlock` (phases 6/7).
- Header sticky/fixed (`data-wk-header-mode`) + the 4 non-default arrangements are declared as future work, not yet in the manifest (phase 6) — conformance exercises only the single default per section this phase.
