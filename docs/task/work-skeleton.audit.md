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

---

## Phase 5 — Published pipeline + editor behaviors (PILOT GATE)

### Files changed
- `src/lib/staticExport/workBehaviors.js` (new — source asset → `public/assets/work.v1.js`)
- `scripts/buildAssets.js` (edit — added `{ src: 'workBehaviors.js', out: 'work.v1.js' }`)
- `src/lib/staticExport/htmlGenerator.ts` (edit — inject `work.v1.js` gated off `isSkeletonBacked`)
- `src/lib/staticExport/htmlGenerator.test.ts` (edit — work.v1.js gating tests)
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.tsx` (edit — editor slider effect mirroring the asset)
- `e2e/parity.spec.ts` (edit — enrolled atelier2 + atelier2 negative control)
- (NOT edited: `WorkGalleryGrid.tsx` — lightbox deferred, see below)

### Behaviors landed vs deferred
- **work.v1.js** ships TWO behaviors, boot-once (`window.__workBooted`), each independently guarded:
  1. **Hero slider** — ported from `atelierSliderBehaviors.js`, re-namespaced `data-wk-*`
     (`[data-wk-hero-slider]` / `.wk-hero__slide.is-active` / `[data-wk-prev|next]` /
     `[data-wk-dots]`→injected `.wk-hero__dot` / `data-wk-interval`). Autoplay crossfade,
     prev/next, injected dots, visibilitychange pause, reduced-motion. Bails `<2` slides.
  2. **Fixed/sticky header** — opts in via `[data-wk-header][data-wk-header-mode="fixed"]`,
     toggles `is-scrolled` on scroll. NO-OP on the pilot markup (the mode attribute is
     emitted by the header wrapper in phase 6, where its editor mirror also lands — the
     header wrapper is out of this phase's scope, so no editor mirror here; both bands
     stay static → parity holds).
- **DEFERRED to phase 6: gallery lightbox.** Removed from the asset (never added). The
  pilot gallery renders GROUP REFERENCES that navigate to group hrefs (AC L120) — there is
  no in-page image set to lightbox — so shipping one would have no markup to bind and would
  desync edit/published. Deferring keeps both bands consistent. `WorkGalleryGrid.tsx` left
  untouched accordingly. Fixed-header + slider were the must-haves; both landed.

### htmlGenerator gating
- New `usesWorkSkeleton = isSkeletonBacked(options.templateId)` (import from the pure-data
  `src/modules/skeletons/ids.ts` — NO skeleton/registry React import into the static-export
  path). `<script src=".../work.v1.js" defer>` injected only when true. Threaded through the
  same param plumbing as `usesAtelier`/`usesLumen`. Old `atelier` id keeps `slider.v1.js`
  and does NOT gain `work.v1.js` (asserted).

### Editor effect mirrors the asset
- `WorkHeroSlider.tsx` gained a `useEffect` (scoped to a `display:contents` ref wrapper —
  layout-transparent, no DOM/CSS divergence) that drives the EXACT core-rendered DOM one-for-
  one with `work.v1.js` (same selectors, same dot injection, same `go/restart/stop`), plus a
  focus-pause so inline editing isn't interrupted, and a cleanup that resets to slide-0
  baseline. `≥2-slide` guard: the pilot hero ships a single portrait (no `.wk-hero__slide`
  set), so BOTH the editor effect and the asset bail → identical static first-slide state.
  Core/published wrappers untouched (effect is edit-wrapper-only).

### tsc / test / build
- `npx tsc --noEmit`: clean.
- `npm run test:run`: 184 files passed / 1 skipped; 3064 tests passed / 18 skipped. The 4 new
  htmlGenerator `work.v1.js` gating tests pass (injected for atelier2; NOT for
  meridian/hearth/old-atelier).
- `npm run build`: green; `public/assets/work.v1.js` emitted (minified, ~1.7 KB).

### e2e parity — REAL BAND DIVERGENCE (BLOCKER, out-of-scope fix)
- `npm run test:e2e -- parity.spec.ts`: 6/7 tests pass. All THREE negative controls pass,
  including the new **atelier2/hero break at 81.18%** (harness proven to catch divergence on
  the work skin). The atelier2 hero content-parity band = static single-slide in both bands
  as intended.
- **FAILING: atelier2 `header` band edit↔published = 3.384% (> 3% threshold), DETERMINISTIC
  across 4 runs (not AA/font noise).** Root cause is a real parity defect in a file OUTSIDE
  this phase's scope: the work **`Link` edit primitive**
  (`src/modules/skeletons/work/blocks/editPrimitives.tsx` L183-196) renders the
  `LinkTargetPopover` ("Set link target" trigger button) INLINE, wrapped in a `wk-link-edit`
  span with `display:inline-flex; gap:6px` — IN LAYOUT FLOW. In the thin, dense header band
  the 3 nav-link popover buttons + gaps inflate the edit band vs published past threshold.
  Tall bands (hero) dilute the same chrome below threshold, so ONLY the header trips it.
  Other templates keep this affordance out of flow (absolute/overlay). Fix belongs in the
  phase-2 `editPrimitives.tsx` (make the popover trigger position:absolute / overlay so it
  leaves no in-flow footprint), NOT in any phase-5 file. NOT fixed here (out of scope; the
  test/threshold/mock are intentionally left honest rather than gamed).
- The suite aborts at the first failing band (header #0), so the remaining atelier2 bands
  (hero/work/proof/contact/footer) are unverified by e2e THIS run; their content parity is
  already green via the jsdom `coreParity` suite (phase 4, passing in test:run).

### Deviations
- Gallery lightbox deferred to phase 6 (plan-authorized) → `WorkGalleryGrid.tsx` untouched;
  lightbox kept out of `work.v1.js` for edit/published consistency.
- Fixed-header behavior shipped in the asset but inert on pilot markup (mode attribute +
  editor mirror land phase 6 with the header wrapper, which is out of this phase's scope).

### Open risks / hand-off
- **PILOT GATE cannot pass clean until the header parity defect is fixed.** It is a one-line-
  ish CSS fix in the phase-2 `editPrimitives.tsx` Link primitive (take the popover trigger
  out of flow), OUTSIDE phase 5's Files-touched — needs an orchestrator-approved scope add
  (phase-2 file) or a dedicated small phase. Everything else in phase 5 is green.

---

### Phase 5 close-out — parity defect FIXED (scoped follow-up, orchestrator-approved)

**Files changed (this follow-up):**
- `src/modules/skeletons/work/blocks/editPrimitives.tsx` — Link primitive + Img primitive +
  `EDIT_AFFORDANCE_STYLES`. (Only this file touched.)

**Exact DOM/CSS changes:**
1. **Link primitive (root cause of the header 3.384% trip).** The popover "Set link target"
   trigger no longer sits INLINE, IN LAYOUT FLOW. Old DOM was an extra wrapper
   `<span class="wk-link-edit" style="display:inline-flex;gap:6px">` holding the link text
   span PLUS the trigger button → the 3 dense nav-link triggers+gaps widened the edit band vs
   the published bare anchor. New DOM: a single wrapper `<span class="wk-link-edit {className}">`
   that carries the link `className` directly (matching published's one anchor box) with the
   trigger as an ABSOLUTE, zero-in-flow-footprint overlay (`triggerClassName="wk-link-edit__btn"`).
   New CSS: `.wk-link-edit{position:relative}` (no size change) and
   `.wk-link-edit__btn{position:absolute;top:50%;left:100%;transform:translateY(-50%);opacity:0;…}`
   revealed on `.wk-link-edit:hover`/`:focus-visible` → invisible in a static parity screenshot,
   still clickable in the editor.
2. **Img primitive (unmasked hero defect — see below).** Removed `style={{position:'relative'}}`
   from the edit Img wrapper `<div className={className}>`. That editor-only positioning context
   made the wrapper a containing block, so the hero's full-bleed placeholder
   `.wk-hero__ph{position:absolute;inset:0}` collapsed into the 0-height wrapper (dark hero base
   showed) instead of escaping to `.wk-hero__media` and filling the band as it does published.
   Wrapper is now STATIC like published; the `.wk-img-edit` affordance (still `position:absolute`)
   anchors to the block's nearest positioned ancestor (media/card box) — same place the escaped
   placeholder lives. Gallery/footer placeholders are in-flow (`width/height:100%` of an
   `aspect-ratio` box), so they are unaffected by dropping the wrapper's position.

**Why Img was needed:** the parity spec's per-band loop aborts on the FIRST failing assertion.
The header failing at 3.384% (band #0) masked a pre-existing hero divergence (band #1). Fixing
the header UNMASKED the hero at **77.623%** — verified pre-existing (reverting the Link fix put
the header failure back and the loop again aborted before hero; the hero defect was always
there). Root cause = the Img `position:relative` above. Same principle as the Link defect
(editor-only chrome/positioning altering published layout), same file → in the phase's
"fix Logo/Nav/Txt/Img if the identical problem exists" allowance. Logo/Nav/Txt did NOT need
changes (Nav routes through the fixed Link; Logo's Img routes through the fixed Img; Txt has no
in-flow chrome).

**Band diffs — before → after (atelier2, official `parity.spec.ts`, deterministic across 3 runs):**
- header: **3.384% → 1.250%** (fixed; well under 3%)
- hero: **77.623% (unmasked) → 2.951%** (under 3%)
- work 0.285% · proof 1.860% · contact 1.368% · footer 0.159% — all green.
- Negative controls STILL BITE: meridian break 6.409%, atelier break 6.255%,
  **atelier2 `?parityBreak=1` break 45.964%** (all > 3%). meridian/hearth/atelier parity bands
  all unchanged and green. The 3% threshold, mocks, and spec were NOT touched.

**Verification:** `npx tsc --noEmit` clean · `npm run test:run` 3064 passed / 18 skipped (incl.
coreParity/renderParity/publishedClientBoundary) · `npm run build` exit 0 · `npm run test:e2e --
parity.spec.ts` 7/7 passed.

**Deviations:**
- atelier2/hero settles at a DETERMINISTIC **2.951%** — a genuine pass but only ~0.05% under the
  3% ceiling. The dominant residual is NOT the fixed Link/Img chrome; it is the in-flow
  `+ Social` `List` add-button (`.wk-list-add`), which is taller than the social-link row and
  makes the bottom-aligned hero overlay ~10px taller in edit → shifts the large `.wk-hero__name`
  up ~10px vs published. `List` is out of this fix's named Link/Img scope AND drives many
  currently-passing bands (header nav, gallery grid, footer/hero socials, packages, proof), so
  per the phase's "don't churn primitives that already parity-pass" rule I left `List` untouched
  rather than risk regressions for ~0.05% of headroom. The pass is deterministic (mock content),
  so no run-to-run flake was observed.

**Open risk / recommendation:** the 2.951% hero margin is thin. If the pilot gate wants comfortable
headroom, the clean follow-up is to take `.wk-list-add` out of layout flow (absolute + hover-gated,
mirroring the already-out-of-flow `.wk-list-x`) so editor add-buttons contribute zero in-flow
height — a `List`-primitive change with cross-band blast radius that should be its own scoped pass
and re-verified against ALL work bands (header nav especially). Not done here.

### Phase 5 parity hardening — `.wk-list-add` out of flow (scoped follow-up, orchestrator-approved)

**Files changed (this follow-up):**
- `src/modules/skeletons/work/blocks/editPrimitives.tsx` — `List` primitive + `EDIT_AFFORDANCE_STYLES`. (Only this file touched.)

This executes the recommendation logged just above — the LAST known in-flow-chrome instance.

**Exact DOM/CSS changes:**
- `List` container `<div className={className}>` gained `style={{ position:'relative' }}` — a
  containing block with NO change to the box's own size/flow (no in-flow item relies on escaping
  to it), same technique as the Link wrapper fix.
- `.wk-list-add` ("+ Add"/"+ Social") moved OUT of layout flow: was an in-flow block button
  (`padding:10px 16px`) sitting after the items → taller than the social-link row → pushed the
  bottom-aligned hero overlay ~10px up in edit vs published. Now `position:absolute;
  bottom:-14px; left:50%; transform:translateX(-50%); opacity:0` → zero in-flow footprint,
  revealed on `*:hover > .wk-list-add` / `:hover` / `:focus-visible` (identical gating to
  `.wk-list-x`). Still clickable — add-item affordance preserved. Given a paper background so it
  reads over content when revealed.

**Band diffs — before → after (atelier2, official `parity.spec.ts`, deterministic across 3 runs):**
- hero: **2.951% → 0.015%** (razor-thin margin eliminated; now ~200× under the 3% ceiling).
- Other atelier2 bands (unchanged, all green): header 1.135% · work 0.423% · proof 1.810% ·
  contact 0.000% · footer 0.545%. All 6 bands green with comfortable headroom.
- meridian/hearth/atelier suites all unchanged and green (best/worst meridian footer 1.297%,
  atelier header 1.717%).
- Negative controls STILL BITE: meridian break 6.409%, atelier break 6.209%, atelier2
  `?parityBreak=1` break 45.606% (all > 3%). Threshold, mocks, spec NOT touched.

**Verification:** `npx tsc --noEmit` clean · `npm run test:run` 3064 passed / 18 skipped (incl.
coreParity/renderParity/publishedClientBoundary — unaffected) · `npm run build` exit 0 ·
`npm run test:e2e -- parity.spec.ts` 7/7 passed, run 3× (identical band %s each run — deterministic,
no flake).

**Deviations:** none. Only the named `.wk-list-add`/`List` container changed; no other primitive
churned (Txt/Img/Link/Logo/Nav untouched — Nav routes through this same fixed `List`).

**Open risk:** none known. No residual in-flow editor chrome remains in the work primitives —
`.wk-img-edit`, `.wk-list-x`, `.wk-link-edit__btn`, and now `.wk-list-add` are all absolute,
zero-footprint, hover/focus-gated. Every atelier2 band clears 3% with margin.

---

## Phase 6 — Layout library completion

### Files changed
Header quad (edit — parametric across 5 arrangements, internal dispatch):
- `src/modules/skeletons/work/blocks/Header/WorkHeader.core.tsx`
- `src/modules/skeletons/work/blocks/Header/WorkHeader.tsx`
- `src/modules/skeletons/work/blocks/Header/WorkHeader.published.tsx`
- `src/modules/skeletons/work/blocks/Header/styles.ts`

Hero (3 new quads + shared styles):
- `src/modules/skeletons/work/blocks/Hero/styles.ts` (edit — +3 style blocks)
- `.../Hero/WorkHeroImage.core.tsx` / `.tsx` / `.published.tsx` (new)
- `.../Hero/WorkHeroSplit.core.tsx` / `.tsx` / `.published.tsx` (new)
- `.../Hero/WorkHeroCenter.core.tsx` / `.tsx` / `.published.tsx` (new)

Gallery (2 new + shared styles):
- `src/modules/skeletons/work/blocks/Gallery/styles.ts` (edit — +masonry/strip)
- `.../Gallery/WorkGalleryMasonry.core.tsx` / `.tsx` / `.published.tsx` (new)
- `.../Gallery/WorkGalleryStrip.core.tsx` / `.tsx` / `.published.tsx` (new)

Proof (2 new — different collections + shared styles):
- `src/modules/skeletons/work/blocks/Proof/styles.ts` (edit — +logos/results)
- `.../Proof/WorkProofLogos.core.tsx` / `.tsx` / `.published.tsx` (new)
- `.../Proof/WorkProofResults.core.tsx` / `.tsx` / `.published.tsx` (new)

Wiring:
- `src/modules/skeletons/work/resolveWorkBlock.ts` (register all variants)
- `src/modules/skeletons/work/manifest.ts` (5 header + 4 hero + slot + 3 gallery + 3 proof)
- `src/modules/audience/work/elementSchema.ts` (new layout entries + proof-shape contracts)
- `src/modules/templates/blockMocks/atelier2.ts` (enroll every built layout)
- `src/modules/templates/__tests__/dispatch.test.ts` (rows for all new variants)
- `src/lib/staticExport/workBehaviors.js` (finalize fixed-header + add gallery lightbox)
- `public/assets/work.v1.js` (rebuilt asset — build artifact of workBehaviors.js)
- `src/modules/skeletons/work/blocks/editPrimitives.tsx` (pointer-events:none on hover-gated affordances)

Out-of-Files-touched (mechanical fallout — see Deviations):
- `src/modules/skeletons/work/coreParity.test.ts` (core count 6->13 + render fixtures)
- `e2e/parity.spec.ts` (bandDiff -> `.first()` for repeated-sectionType enrollment)

### Per-variant one-liners (contract keys / collection · dispatch kind)
- **WorkHeader x5** (`header`): logo_text/cta_label/cta_href + nav_links[]. INTERNAL DISPATCH — ONE component, 5 arrangements as a pure CSS re-flow of the same DOM keyed off `data-wk-header-layout` (WorkHeader / Start / Centered / Split / Minimal). 4 non-default = `internalDispatch:true` -> distinctness guard asserts `.toBe(default)`. Sticky via `data-wk-header-mode`.
- **WorkHeroImage** (`hero`): still-image full-bleed cover, centered overlay. DISTINCT, same hero contract (lossless swap), requiresAssets:['photos'].
- **WorkHeroSplit** (`hero`): LeftTextRightImage editorial poster (Kontur/Pulse `.hero-grid`). DISTINCT, requiresAssets:['photos'].
- **WorkHeroCenter** (`hero`): AllCenter typographic hero, no media. DISTINCT.
- **WorkHeroVideo** (`hero`): SLOT — declared, unbuilt, skipped by conformance, resolves to hero default.
- **WorkGalleryMasonry** (`work`): CSS-columns collage of group covers. DISTINCT, same `groups` (AC L120). Lightbox hooks.
- **WorkGalleryStrip** (`work`): horizontal scroll row (Pulse `.archive-list`). DISTINCT, same `groups`. Lightbox hooks.
- **WorkProofLogos** (`proof`): logo wall — reads `logos` collection. DISTINCT + copyShape 'proof-logos', requiresAssets:['logos'].
- **WorkProofResults** (`proof`): big-number metrics — reads `metrics` collection. DISTINCT + copyShape 'proof-results'.

### Proof copyShape / consumes design (forced)
The 3 proof shapes read DIFFERENT collections (quotes/logos/metrics) -> each carries a DISTINCT copyShape so the editor never blind-swaps them. The conformance (e) both-ways-hidden check further requires each to own a scalar the others lack. Available proof scalars are only {eyebrow, heading, awards_line} and logos/results contracts lack awards_line, so the disjoint singleton assignment is FORCED: testimonials=`awards_line`, logos=`eyebrow`, results=`heading`. (Testimonials' manifest `consumes` was reduced from [eyebrow,heading,awards_line] to [awards_line] — safe: it is the default/always-offered-via-escape-hatch; consumes drives conformance/eligibility only, not rendering.)

### Kontur + Pulse + Atelier lint verdicts (feed phase-7 FREEZE gate)
Designer sources read from `C:\Users\susha\lessgo-ai\template-design\designer-workspace\` (Kontur - Kundius, Pulse, Atelier).

| Section | Designer arrangement | Reachable by tokens+variant, or slot? | Built as |
|---|---|---|---|
| header | Kontur/Pulse `.nav` (brand/mid/right); Atelier centered-logo | Reachable — CSS re-flows of one DOM -> internal-dispatch VARIANTS | 5 arrangements |
| hero | Kontur/Pulse `.hero-grid`; Atelier `.atl-cover`; big-portrait | Reachable — same hero CONTENT, only ARRANGEMENT differs -> VARIANTS | slider+image+split+center |
| hero (video) | full-bleed autoplay video | Needs a SLOT (media capability) | `WorkHeroVideo` slot (unbuilt) |
| work/gallery | Pulse `.archive-grid` + `.archive-list`; Atelier mosaic/masonry | Reachable — same `groups` reference -> VARIANTS | grid+masonry+strip |
| proof | Atelier critics-grid; logo wall; results/metrics | Reachable but CONTENT-EXCLUSIVE (different collections) -> distinct components + distinct copyShape | testimonials+logos+results |

Verdict: no NEW slot needed beyond the declared `WorkHeroVideo`. All designer arrangements reachable as library variants (token+variant), ported from classic grammars — not invented.

### Sticky / headerMode
`data-wk-header-mode` emitted by WorkHeader (both renderers), default 'static'. `"fixed"` -> `position:fixed` (CSS = editor mirror) + `work.v1.js` `.is-scrolled` refinement (already present, finalized). Edit reads headerMode from `themeValues.styleTokens[sectionId].headerMode` (store); published from `content[sectionId].styleTokens?.headerMode` (best-effort). Today resolves to 'static' everywhere (no Design ▾ panel to set it, and the published renderer does not yet thread styleTokens to blocks), so edit==published holds unconditionally. OPEN follow-up (out of scope): full production published sticky needs the published renderer to thread `styleTokens` to the header block.

### Gallery lightbox (work.v1.js)
Added behavior #3 to `workBehaviors.js` (rebuilt -> `public/assets/work.v1.js`): opt-in via `[data-wk-gallery-lightbox]` + `[data-wk-lightbox]` per cover. A cover with a real `<img>` opens a lazily-built inline-styled full-screen overlay (ESC/click/close dismiss) and preventDefaults the group-link navigation; placeholder-only covers are ignored. Independently guarded. Masonry + strip expose the hooks in BOTH renderers (inert data attrs -> zero pixels); the phase-4 grid is untouched and does NOT opt in.

### pointer-events fix (phase-5 review nit)
`.wk-list-x`, `.wk-list-add`, `.wk-link-edit__btn` (the `opacity:0` hover-gated affordances) gained `pointer-events:none` while invisible, restored to `pointer-events:auto` on the SAME hover/focus reveal. Pure interaction; ZERO pixel/band change (the always-visible `.wk-img-edit` is intentionally excluded).

### Parity band %s (official parity.spec.ts, deterministic — runs A & B byte-identical)
atelier2 (17 bands, all < 3%):
- header #0 1.236% · hero #1 0.015% · work #2 0.199% · proof(testimonials) #3 1.813% · contact #4 0.000% · footer #5 0.774%
- header #6 Start 1.236% · #7 Centered 1.611% · #8 Split 1.566% · #9 Minimal 1.593%
- hero #10 Image 0.012% · #11 Split 0.198% · #12 Center 0.109%
- work #13 Masonry 0.269% · #14 Strip 0.236%
- proof #15 Logos 0.215% · #16 Results 0.030%
Negative controls STILL BITE: meridian break 6.409%, atelier break 6.229%, atelier2 `?parityBreak=1` 45.014% (all > 3%). meridian/hearth/atelier suites unchanged and green. Threshold/mocks/spec NOT relaxed.

### Header parity investigation (REAL divergence chased down)
Enrollment initially tripped WorkHeaderCentered (3.76%) then WorkHeaderSplit (3.66%). Measurement showed sub-pixel element boxes IDENTICAL edit vs published; per-row diff dominated by full-width rows 79-80 = the header's bottom `border-bottom` hairline sitting exactly on the harness screenshot CROP boundary — because the two stacked bands are at different sub-pixel Y, the hairline rounded to a different pixel row between them (~2.5% alone), position-dependent (Start 0.000%, Split 3.66%). Fixes (all `Header/styles.ts`, identical CSS both renderers): (1) integer `height:80px` on the header row so the hairline rounds consistently regardless of band position; (2) divider drawn as a pseudo-element inset 1px from the bottom (crop-edge row = uniform background); (3) nav typography targets BOTH `.wk-header__nav a` (published) and `.wk-header__nav .wk-link-edit` (editor); (4) Centered logo absolutely centered (out of grid flow). Result: all 5 header bands uniform at 1.2-1.6%, well under 3%. No threshold/mock changes.

### Verification
- `npx tsc --noEmit`: EXIT 0.
- `npm run test:run`: 184 files passed | 1 skipped · 3113 tests passed | 18 skipped. Conformance distinctness (hero/gallery/proof != default), internalDispatch `.toBe(default)` (4 header arrangements), slot skip + never-default, dispatch rows, coreParity (13 cores), (e) proof both-ways-hidden — all green.
- `npm run build`: EXIT 0; `work.v1.js` = slider + fixed-header + lightbox.
- `npm run test:e2e -- parity.spec.ts`: 7/7 passed, run TWICE byte-identical (deterministic). 17 atelier2 bands < 3%; negative controls bite.

### Deviations
- **testimonials manifest `consumes` -> [awards_line]** — FORCED by the (e) consistency check given the frozen proof-shape contracts. Safe (default/escape-hatch; consumes not used for rendering).
- **`coreParity.test.ts` edited (NOT in Files-touched)** — mechanical fallout: exact core-count assertion 6->13 + render fixtures for the 7 new cores (same class as phase-3's out-of-list test edits). No logic touched.
- **`e2e/parity.spec.ts` edited (NOT in Files-touched)** — the mandated multi-layout enrollment makes `data-parity-section` non-unique, so the negative-control `bandDiff` strict locator resolved to 4 hero elements. Minimal fix: `bandDiff` uses `.first()` (safe for single-section templates; the MAIN test pairs BY INDEX, unaffected). Flagged for orchestrator ratification.
- **Header `height:80px` + inset-pseudo hairline + absolute centered logo** — robustness fixes for the crop artifact; identical CSS both renderers, visually equivalent to the phase-4 header.
- **Masonry/Strip skip the "manage photos" edit link** (grid keeps it) — conservative; fewer edit-only affordances, no parity risk.
- **requiresAssets** on hero image/split (['photos']) + proof-logos (['logos']) — semantic generation gating; no conformance impact (checks use all-assets-present).

### Open risks
- Production published sticky needs the published renderer to thread `styleTokens` to blocks (out of scope). No panel UI sets headerMode yet, so the gap is inert today.
- Header integer `height:80px` relies on `box-sizing:border-box` (set explicitly on `.wk-header__in`).
- Proof logos/results are content-exclusive (distinct copyShape) -> hidden from the editor swap picker by design; they surface via generation asset-gating when a work skin enters the generation path (atelier2 is dev-only).

## Phase 6b — AC-L123 published styleTokens threading

### Files changed
- `src/lib/staticExport/htmlGenerator.ts`
- `src/lib/staticExport/renderPublishedExport.ts`
- `src/app/api/publish/route.ts`
- `src/app/api/domains/verify-dns/route.ts`
- `src/lib/staticExport/htmlGenerator.test.ts`

### The gap
Phase 2 threaded `themeValues.styleTokens` into the EDIT renderer + the published RENDERER component, but the static-export GENERATOR (`generateStaticHTML`) never passed `styleTokens` into `LandingPagePublishedRenderer`. Hand-written style tokens rendered in the editor but were DROPPED from the real static export → edit↔published divergence failing AC L123's published side.

### What changed (mirrors the existing `knobs` thread exactly)
- **htmlGenerator.ts** — added `styleTokens?: StyleTokens | null` to `StaticHTMLOptions`; passed `styleTokens: options.styleTokens ?? null` into the `LandingPagePublishedRenderer` `createElement` props (1 line, next to `knobs`). The renderer already forwards it to `SSRTokens → buildWorkStylesheet → serializeStyleTokens`.
- **renderPublishedExport.ts** — added `styleTokens?` to `RenderPublishedExportInput`; destructured it; passed `styleTokens: styleTokens ?? null` into ALL THREE `generateStaticHTML` calls (root, subpage, locale) alongside `knobs`.
- **publish/route.ts** (caller edit NEEDED) — read `projectStyleTokens` off `project.themeValues.styleTokens` (same guard shape as `projectKnobs`); (a) persisted it into `publishedThemeValues` via a new `themeValuesWithKnobs` intermediate so the merge chain stays mood→knobs→styleTokens; (b) passed `styleTokens: projectStyleTokens` into `renderPublishedExport`.
- **verify-dns/route.ts** (caller edit NEEDED) — custom-domain go-live regen: added `styleTokens: (page.themeValues as any)?.styleTokens ?? null`, mirroring the existing `mood` line (reads the value persisted at publish time).

### Was a caller edit needed?
Yes — two. `renderPublishedExport` receives `knobs`/`mood` as explicit params (not off `themeValues`), so the value must be sourced by each caller. Both callers of `renderPublishedExport` (publish route + verify-dns) were updated.

### New test (htmlGenerator.test.ts)
Added `describe('generateStaticHTML — styleTokens in static export (AC-L123)')`, 3 cases, using a skeleton-backed `atelier2` page:
1. WITH `styleTokens` (corners `soft` + background `dark`) → output CONTAINS the serialized CSS block `[data-sid="hero-abc12345"]{` + `--u-radius:10px;` + `--u-bg:` — proving the generator→serializer thread fires end to end.
2. WITHOUT styleTokens (`null`) → output does NOT contain the `[data-sid="…"]{` CSS block (control — the thread is real, not incidental). Note: block cores legitimately reference `var(--u-radius, …)` fallbacks in markup, so the discriminator is the braced CSS-selector form, not the raw `--u-radius` string.
3. Classic `meridian` template + styleTokens → no `--u-*` CSS at all (skin-agnostic; only skeleton templates consume the map).

### Byte-neutrality
Confirmed. Templates without styleTokens (meridian/hearth/atelier/etc.) receive `styleTokens: null` → `serializeStyleTokens(null)` returns `''` → no CSS emitted → identical static HTML. All 9 pre-existing htmlGenerator tests stayed green with no changes; full suite unchanged.

### Scope discipline
- Did NOT touch the published RENDERER, SSRTokens, or the serializer (already correct, phase 2/6).
- Did NOT alter blob upload, KV routes, versioning, or the publishState machine — the publish-route change is confined to the themeValues merge chain + one added prop.

### Verification
- `npx tsc --noEmit` — clean (no errors).
- `npm run test:run` — 3116 passed | 18 skipped (185 files); new 3 styleTokens cases green; all existing htmlGenerator + publish + renderPublishedExport suites green (byte-neutral proof).
- `npm run build` — succeeded.

### Open risks
- verify-dns previously did NOT thread `knobs` (pre-existing gap, out of this fix's scope); `styleTokens` IS threaded there, so custom-domain go-live now bakes style tokens correctly. Knobs parity on that path remains a separate pre-existing gap.

---

## Phase 7 — Section coverage + purity/bounds conformance (FREEZE GATE)

### Files changed
New (4 block quads; Results has no styles.ts — reuses Proof/Results styles):
- `src/modules/skeletons/work/blocks/Packages/WorkPackages.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts`
- `src/modules/skeletons/work/blocks/About/WorkAbout.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts`
- `src/modules/skeletons/work/blocks/Faq/WorkFaq.core.tsx` / `.tsx` / `.published.tsx` / `styles.ts`
- `src/modules/skeletons/work/blocks/Results/WorkResults.core.tsx` / `.tsx` / `.published.tsx`
- `src/modules/templates/skinPurity.test.ts` (NET-NEW — AC L121/L122)
- `src/modules/skeletons/work/renderParity.work.test.tsx` (NET-NEW — jsdom content parity, all built blocks)

Edited (in Files-touched):
- `src/modules/skeletons/work/resolveWorkBlock.ts` (register packages/about/faq/results; process/stats/logos/team/workdetail STAY on placeholder — grow-on-demand)
- `src/modules/skeletons/work/manifest.ts` (4 declarations — manifest now complete for D1)
- `src/modules/audience/work/elementSchema.ts` (4 contract-derived layout entries; ride serviceElementSchema via the phase-3 spread)
- `src/modules/templates/blockMocks/atelier2.ts` (enroll the 4 into the sampled parity grid)
- `src/modules/templates/__tests__/dispatch.test.ts` (atelier2 section list += packages/about/faq/results)
- `src/modules/templates/templateMeta.ts` (atelier2: honest capabilities + capabilitySections — see Deviations re: bespoke)
- `src/modules/templates/conformance.test.ts` (explicit atelier2 engine-core bite + skin-token BOUNDS describe)

Out-of-Files-touched (mechanical fallout — see Deviations):
- `src/modules/skeletons/work/coreParity.test.ts` (core count 13->17 + 4 imports/fixtures — same class as phase-3/6 out-of-list test edits)

### Per-block one-liner (contract keys bound · decision)
- **WorkPackages** (`packages`): eyebrow·heading·lead + packages[]{name,price_mode,price_line,description,cta_label}. price_mode drives the DISPLAY — `from` prefixes a small "From" affix (derived chrome, identical both renderers); `exact`/`on-request` show price_line verbatim ("On request" is legal). CTA = a button-styled Txt (packages contract has no cta_href).
- **WorkAbout** (`about`): eyebrow·heading·bio + facts[]{value,label}. Two-column editorial (heading left, bio + optional facts strip right). GranthParichay donor shape.
- **WorkFaq** (`faq`): eyebrow·heading + items[]{question,answer}. STATIC Q/A list (no disclosure JS -> edit==published trivially).
- **WorkResults** (`results`): eyebrow·heading·lead + metrics[]{value,label}. Standalone optional big-number grid; REUSES `WORK_PROOF_RESULTS_STYLES` (thin, per plan) — distinct from the `proof` results SHAPE (different section type).

### skinPurity + bounds test design (how they BITE)
- **skinPurity.test.ts** — for every id in `skeletonBackedTemplateIds` (= ['atelier2']): scans `src/modules/templates/<id>/` and asserts (1) files subset of whitelist {index.ts, skin.ts}, (2) ZERO `.tsx`, (3) no markup tokens ('use client' / `import … from 'react'` / `React.createElement`) in the `.ts` files. The predicates (`fileViolations`, `markupViolations`) are PURE functions RED-TEAMED both ways: a synthetic `['index.ts','skin.ts','ThemeInjector.tsx']` list -> flagged (.tsx); a `palettes.ts` -> flagged (whitelist); a source with `'use client'` / a react import / `React.createElement` -> flagged; a genuine `import type … export const s` -> clean. So the check provably bites, not vacuous.
- **Old-atelier exclusion CONFIRMED** — asserts `skeletonBackedTemplateIds` does NOT contain `'atelier'`, AND that scanning the real `templates/atelier/` dir WOULD fail purity (`purityViolations(...).length > 0`, it is full of `.tsx`). So the exclusion is load-bearing, not incidental.
- **Bounds (AC L122)** — `assertSkinTokens(atelierSkin)` passes (in-range); an out-of-bounds fixture (`{...tokens, radiusPx:999}` / `secPadYPx:5000`) THROWS with the token name + "out of range". A multi-violation fixture (radiusPx 999 + fsBodyPx 4 + displayWeight 123) throws listing ALL THREE + "3 token violation(s)". Wired into BOTH skinPurity.test.ts AND conformance.test.ts (per-template walk sibling), each red-teamed.
- **renderParity.work.test.tsx** — clone of renderParity.atelier adapted for variant-aware `resolveWorkBlock(type,mode,layout)`. IMPORTANT: the work EDIT `Txt` primitive (InlineTextEditorV2) paints text in a `useEffect` (empty under `renderToStaticMarkup`), so this test MOUNTS both renderers in jsdom via `createRoot`+`act()` (effects run) then reads painted DOM — every visible fixture field must appear in BOTH edit + published or neither, across ALL 21 enrolled atelier2 sections. Plus a CTA/link-href check reframed to the editor's real link model (edit `Link` = editable span + popover, NO literal href; published = real anchor): asserts published navigation integrity (every non-placeholder fixture href renders as an anchor) + edit keeps a `wk-link-edit` affordance.

### engine-core now bites for atelier2
`conformance.test.ts` adds an explicit `atelier2 engine-core` describe running `resolvesReal('atelier2', s)` for hero·work·about·footer (both modes) — all resolve REAL blocks (hero=WorkHeroSlider ph3, work=WorkGalleryGrid ph4, about=WorkAbout ph7, footer=WorkFooter ph4). Capability-evidence (b)/(b+) also bites via the standard loop: gallery->work + packages->packages both resolve real.

### FREEZE-GATE DELIVERABLE — consolidated Kontur+Pulse+Atelier lint verdict, ALL D1 sections
Designer sources: `template-design/designer-workspace/` (Kontur - Kundius, Pulse, Atelier standalone). "Reachable" = the frozen CONTENT contract renders the designer arrangement via tokens+variant (no block rewrite).

| Section | shapes/variants built | slots declared | Kontur/Pulse/Atelier reachable by tokens+variant? | Un-met need -> new variant/slot? |
|---|---|---|---|---|
| **header** | 1 dispatcher x 5 arrangements (Nav/Start/Centered/Split/Minimal, internal-dispatch) | — (sticky via styleTokens.headerMode) | YES — Kontur/Pulse `.nav`, Atelier centered-logo are CSS re-flows of one DOM | none |
| **hero** | 4 (Slider/Image/Split/Center) | **WorkHeroVideo** (video-bg) | YES — Kontur/Pulse `.hero-grid`=Split/Image, Atelier `.atl-cover`=Slider | video hero = the declared slot (build on demand) |
| **work/gallery** | 3 (Grid/Masonry/Strip) | — | YES — same `groups` group-reference (AC L120); Kontur work grid, Pulse `.archive-grid`/`.archive-list` | none |
| **proof** | 3 SHAPES (Testimonials/Logos/Results — distinct copyShape, content-exclusive) | — | YES — Atelier critics-grid, Pulse voice cards, logo wall, metrics | none |
| **packages** | 1 (WorkPackages, price_mode exact/from/on-request) | — | YES — Kontur `#services`/`.sprice`, Pulse `.offer`/`.price` | OPTIONAL: a "featured/highlighted tier" emphasis variant if an eyeball wants a standout column (grow-on-demand) |
| **about** | 1 (WorkAbout, 2-col copy + facts strip) | — | PARTIAL — Kontur `#about` has copy/**art**/sign; WorkAbout is copy+facts (no image column) | RECOMMEND future **WorkAboutPortrait** variant (portrait/art column) — not built (grow-on-demand; no D1 pressure, atelier2 mock has no about image) |
| **faq** | 1 (WorkFaq, static Q/A) | — | YES — generic; no Kontur/Pulse FAQ section exerts pressure | none |
| **contact** | 1 (WorkContact, method-aware form / CTA) | — | YES — Kontur `.contact-copy`+`.form` 2-col | CARRY-FWD (CONTRACT gap, not skeleton, flagged ph4): non-form channels (whatsapp/booking/call) have no destination field -> dead `#` CTA; belongs to the copy-engine contract |
| **footer** | 1 (WorkFooter — heading/note/socials/copyright) | — | YES — Kontur closer + footer cols baseline | OPTIONAL: multi-column footer arrangement variant if wanted (grow-on-demand) |
| **results** (standalone optional) | 1 (WorkResults big-number grid) | — | YES — Pulse `.stat`, Kontur statement metrics | none |

**Freeze verdict:** every frozen D1 CONTENT contract covers the three designer systems. Only ARRANGEMENT differs -> build-later library variants, never block rewrites. ONE slot remains (`WorkHeroVideo`). Two OPTIONAL future variants recommended (about-portrait, multi-column-footer) + one packages featured-tier — all grow-on-demand, none blocking. No new slot needed beyond WorkHeroVideo.

### Verification
- `npx tsc --noEmit`: EXIT 0, clean (no page.tsx error in this worktree).
- `npx vitest run` (full): **186 files passed | 1 skipped · 3250 tests passed | 18 skipped.** New: skinPurity (purity + old-atelier-exclusion + bounds red-team), renderParity.work (85 — mount-based content + href-model parity across 21 sections), conformance atelier2 engine-core (4 sections x both modes) + bounds. dispatch/coreParity(17)/serveGate/templateMeta all green (serveGate + templateMeta UNCHANGED — proof of zero serve blast-radius).
- `npm run build`: EXIT 0.
- `npm run test:e2e -- parity.spec.ts`: **7/7 passed, run TWICE (deterministic)**. New atelier2 bands: packages #17 **0.852%** · about #18 **0.577%** · faq #19 **0.000%** · results #20 **0.268%** — all <3%, byte-identical across runs. Full 21-band atelier2 grid <3% (max proof 1.813%). Negative controls STILL BITE: meridian break 6.409%, atelier break 6.209/6.255%, atelier2 `?parityBreak=1` **45.014%**. Threshold/mocks/spec NOT relaxed.

### Deviations
- **`bespoke` NOT flipped off atelier2 (deviates from the literal phase-7 instruction — see mailbox `work-skeleton.md`).** Flipping it makes `fit()`/`shortlist()` serve the DEV-ONLY `atelier2` id into REAL photographer/writer shortlists (`fit()` excludes only retired||bespoke), a paying-customer serve-path change that ALSO breaks `serveGate.test.ts` (4 assertions) + `templateMeta.test.ts` (1) — both OUTSIDE this phase's Files-touched — with unknown further ripple. Conservative resolution achieving the SAME goal in-scope: KEPT `bespoke: true`, declared HONEST capabilities (gallery/packages/multipage + capabilitySections, mirroring lumen's bespoke-with-caps shape) so (b)/(b+) bite, and added an EXPLICIT atelier2 engine-core describe in conformance.test.ts (in-scope) so engine-core bites for real with ZERO serve change. The real flip should land at phase 9 cutover (serve wiring reworked there, temp id removed) or with an explicit ruling to edit the serveGate/templateMeta test files. Flagged in the mailbox for the founder freeze-gate review.
- **`coreParity.test.ts` edited (NOT in Files-touched)** — mechanical fallout: the dir-scan core-count assertion 13->17 + 4 render fixtures (same class as phase-3/6 out-of-list test edits). No logic touched.
- **renderParity edit render MOUNTS (createRoot+act) instead of `renderToStaticMarkup`** — required because the work edit `Txt` primitive (InlineTextEditorV2) paints its text in a `useEffect` (empty in static markup), unlike atelier's static-children Editable. Mounting runs effects so the painted text is comparable. In-test decision; the block code is unchanged.
- **CTA href-parity reframed** — the edit `Link` primitive is an editable span+popover with NO literal href (editor resolves targets on save), so literal edit<->published href equality is architecturally wrong (false positives). Reframed to published-navigation integrity + edit link-affordance presence — the sound guarantee.
- **Results reuses `WORK_PROOF_RESULTS_STYLES`** (no Results styles.ts per the plan); its `lead` renders as an unclassed centered paragraph (inherits the head grammar) — thin, acceptable for an optional section.
- **Packages CTA is a button-styled `Txt`, not a `Link`** — the frozen packages contract has `cta_label` but NO cta_href, so there is no href to bind; rendered as an `isButton` Txt (edit selectable/editable, published static). Conservative.

### Open risks
- The `bespoke` flip is DEFERRED (above) — until it lands (phase 9), engine-core for atelier2 is enforced by the explicit conformance describe, NOT the standard bespoke-gated (a) loop. Functionally equivalent; flagged so the founder can flip at cutover.
- **about-portrait** + **multi-column-footer** + **packages featured-tier** are recommended-but-unbuilt future variants (grow-on-demand) — no D1 blocker, recorded for the freeze gate.
- Photography image slots ship EMPTY in mocks (cores render placeholders) — the parity grid compares layout/copy, not stock art (unchanged from ph4/5).

---

## Phase 8 — Kundius end-to-end + parity QA (sign-off gate)

### Files changed
- `src/modules/skeletons/work/__tests__/kundiusPages.test.tsx` (new) — real-content dual-renderer parity across Kundius's 5 standard-archetype pages.
- `src/modules/templates/blockMocks/atelier2.ts` — reviewed, NOT edited (see Deviations).

### The 5-page Kundius fixture + per-page asserts
Pages assembled from the shipped atelier2 mocks (fixtures/kundiusBrief.ts-derived, mapped onto the frozen work-core contracts) at the **standard whole-site archetype** (`workPages.ts`): `home · work · prices · about · contact`. Header/footer chrome wraps each page's body sections (defaultSections per page). Each section reuses the DEFAULT-layout mock for its type, given a page-scoped sectionId (`${type}-${page}` — extractSectionType still resolves the type).

Per page, three assertions:
1. **PUBLISHED path** (`generateStaticHTML` — the exact /api/publish code): asserts real per-section markers appear and NO placeholder ("Work block — coming soon") leaks. Markers = header logo · hero headline (name)+role · all gallery group names · proof quotes · packages tiers (name+price_line) · about heading+body · contact heading + `data-wk-contact-method="form"` · footer copyright.
2. **EDITOR == PUBLISHED** on real content (AC L127): every visible fixture field must appear in BOTH the mounted edit render and the published HTML (symmetric XOR check — a field in exactly one mode is the dual-renderer bug). Zero divergences across all 5 pages.
3. **CTA/nav href consistency**: every non-`#` fixture href navigates in published (`href="…"`); edit exposes a `wk-link-edit` affordance for the same links.
Plus 2 fixture-shape guards (page set == the 5 standard pages; every page has header+footer chrome + ≥1 body section). 19 tests, all green.

### NL/EN twin-field non-preclusion (constraint L91)
Proven, NOT wired (bilingual = concierge patch). Two assertions:
- Rendering a hero whose `name` = `<span data-en>…</span><span data-nl>…</span>` through the PUBLISHED path preserves both wrappers + both texts verbatim (published `E.Txt` renders HTML values via `dangerouslySetInnerHTML`).
- Source scan: published `Txt` uses `dangerouslySetInnerHTML`; edit `Txt` uses `preserveHtml={true}` (InlineTextEditorV2). Neither reads/asserts a single text node.
FINDING: the skeleton's text path does **not** preclude the lumen `data-en`/`data-nl` twin pattern — a future twin wrapper survives in both renderers. Door open; wiring deferred to the concierge patch as scoped.

### Real bug found?
NONE. All 5 pages render edit==published on Kundius's real content with zero field divergence on the first pass — the single-source `.core.tsx` pattern makes parity structural (as designed). No bug-fix edit needed inside skeletons/work or atelier2.

### Verification
- `npx tsc --noEmit` — clean (no errors; the tolerated pre-existing page.tsx error did not appear).
- `npm run test:run` — 187 passed | 1 skipped (188 files); 3269 passed | 18 skipped. kundiusPages 19/19; all existing suites green.
- `npm run build` — green.
- `npm run test:e2e -- parity.spec.ts` — 7/7. Negative controls bite (meridian 6.409%, atelier 6.209%, atelier2 45.014%). atelier2 bands UNCHANGED from phase 7 (mocks untouched): 21 bands all <3%, max **proof #3 = 1.813%**, headers ~1.2–1.6%, hero 0.012–0.198%, contact/faq 0.000%.

### Deviations
- **atelier2.ts NOT edited** (in-scope judgment, conservative). The plan lists it as an OPTIONAL edit ("swap any *lorem/placeholder* copy … where the eyeball needs it"). Review found the mock already carries Kundius-real content mapped onto the frozen contracts (no lorem) — editing would be gratuitous and would perturb the 21 frozen parity bands. Left byte-untouched; the kundiusPages fixture SOURCES its content from these same mocks, so the parity grid, dev stage, and this proof all reflect one consistent Kundius page. (Note: proof testimonials + results metrics in the mocks are illustrative — Kundius's real `praise` is empty per kundiusBrief.ts; documented there. They are eyeball/parity content, not fact claims, and do not affect the content-parity proof.)

### FOUNDER MANUAL-QA CHECKLIST (human sign-off — automation cannot cover these)
Automated equivalents already cover the intent: kundiusPages = editor==published on real content; htmlGenerator.test.ts (AC-L123) = styleTokens in both renderers; e2e parity.spec = visual editor==published; `public/assets/work.v1.js` (built) = published behaviors asset exists. The remaining human checks (need a browser + running dev/publish):

1. **Editor click-select toolbars** — `npm run dev`, open `/dev/blocks/atelier2` (edit band). For EACH block (header, hero, work/gallery, proof, contact, footer, packages, about, faq, results): click a headline → the **Text** toolbar appears; click an image placeholder → **Image** toolbar; click the section chrome → **Section** toolbar; click a nav item / CTA → **Link** toolbar. Confirm NO renegade/bespoke UI inside any skeleton block (only the shared shell toolbars). Header logo + menu must be editable via the shared primitives (click logo text → Text toolbar; click a nav link → Link popover).
2. **Gallery manage-photos link** — in the edit gallery block, the "manage photos" link is present and jumps to `WORK_LIBRARY_BOARD_HREF` (currently the `/dashboard/library` placeholder; re-pointed in D2).
3. **Style-token spot check (AC-L123)** — on a real dev draft (a token-scoped `/edit/[token]` project set to templateId `atelier2`), hand-write in the DB/JSON `Project.themeValues.styleTokens` a per-section entry, e.g. `{"hero-<id>": {"corners":"soft","background":"dark"}}` (use the actual hero sectionId). Reload the editor → the hero shows rounded corners + dark surface. Then **publish** → open `/p/<slug>` → confirm the SAME radius/background render in the static page (the `[data-sid="hero-<id>"]{--u-*}` CSS block is in the page source).
4. **Publish behaviors on /p/slug (AC L118/119)** — publish an atelier2 dev draft with a multi-slide hero + a gallery, then load `/p/<slug>` and verify: hero **slider** advances (autoplay/arrows, work.v1.js), gallery **lightbox** opens on click, **fixed header** sticks on scroll when `styleTokens[headerId].headerMode:'fixed'`. Confirm `work.v1.js` is the injected asset (view-source).
5. **Kundius real-content eyeball** — compare `/dev/blocks/atelier2` (both bands) against the designer Atelier HTML (`template-design/designer-workspace/atelier/` + `delivery/`, main repo dir). Sign off that her real page reads correctly in editor AND published. This gate ALSO authorizes phase 9 (cutover to the live `atelier` id).

### Open risks
- Phase-8 human gate (editor toolbars / styleTokens spot check / publish behaviors) is deferred to the founder's browser pass above — automated proxies are green but the visual/interaction sign-off is pending.
- Phase 9 cutover (re-point live `atelier` id) NOT done — deferred + human-gated (touches paying-customer prod rendering). atelier2 stays the dev-only id.
- Mock proof/results content is illustrative (Kundius praise empty) — replace with her real testimonials/metrics (or omit proof) at concierge content-load; does not affect the parity proof.

## Phase 8.5 — Atelier fidelity Wave 1

### Files changed
- `src/modules/templates/atelier2/skin.ts` — dramatic hero token values + selections.
- `src/modules/skeletons/work/tokenContract.ts` — 6 new hero-composition tokens + bounds/enums + serialization.
- `src/modules/skeletons/work/tokenContract.test.ts` — fixture + new-token in/out-of-range coverage.
- `src/modules/skeletons/work/blocks/Hero/styles.ts` — hero CSS reads new vars (neutral fallbacks) + numeral CSS.
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.core.tsx` — giant background numeral markup (single-source).
- (stylesheet.ts NOT edited — serialization lives in tokenContract.serializeSkinTokens, which buildWorkStylesheet already calls.)

### Skin values set (atelier2)
displayWeight 600→700 · radiusPx 3→0 (square) · heroAlign `center` · heroDisplayScaleMax 138 · heroDisplayLineHeight 0.9 · heroDisplayTracking -0.045 · heroDisplayWeight 700 · heroNumeral `true`.
selections.surfaceBySection += `proof:'dark'`, `packages:'paper-2'`. defaultLayoutBySection += `header:'WorkHeaderCentered'`, `work:'WorkGalleryMasonry'` (hero kept `WorkHeroSlider`).

### New skeleton tokens + NEUTRAL defaults (thesis: byte-neutral for a non-setting skin)
| token | var | neutral default | atelier |
|---|---|---|---|
| heroAlign | --wk-hero-align (+ derived --wk-hero-items/-inline) | `start` (bottom-left) | `center` |
| heroDisplayScaleMax | --wk-hero-scale | 86px | 138px |
| heroDisplayLineHeight | --wk-hero-lh | 0.94 | 0.9 |
| heroDisplayTracking | --wk-hero-tracking | -0.02em | -0.045em |
| heroDisplayWeight | --wk-hero-weight | =displayWeight | 700 |
| heroNumeral | --wk-hero-num-display | `none` (off) | `block` (on) |
Bounds: scale [48,200], lh [0.8,1.4], tracking [-0.08,0.02]; heroDisplayWeight enum {300..800}; heroAlign string-enum {start,center}; heroNumeral boolean. All fail loud via assertSkinTokens (new WORK_TOKEN_STRING_ENUMS + WORK_TOKEN_BOOL_FIELDS loops).

### Numeral gating (kept OFF by default, identical in both renderers)
`.wk-hero__num` markup ("01") is ALWAYS emitted by the single-source `.core.tsx`, so edit==published by construction. Visibility is CSS-only: `display:var(--wk-hero-num-display, none)`. serializeSkinTokens emits `block` iff `heroNumeral`. A skin that never sets it → `none` → element hidden in DOM identically on both sides (no injector/data-attr wiring needed — cleanest option, no out-of-scope files).

### Hero composition before/after (atelier2)
Before: bottom-left-aligned, headline clamp max 5.4rem/86px, lh 0.94, tracking -0.02, weight=display (600), rounded 3px buttons, no numeral → read as quiet "Lumen".
After: centered full-bleed cover (align-items:center + centered column + text-align:center), headline clamp max 138px, lh 0.9, tracking -0.045em, weight 700, square (0px) buttons, oversized background numeral at white ~7% → Atelier "cover" signature. Neutral fallbacks in styles.ts equal the old hardcoded values, so any future skin renders exactly as before.

### Gate results
- tsc --noEmit: clean.
- test:run: 187 files / 3271 tests pass, 18 skipped (new hero-knob tests green; conformance/coreParity/renderParity/skinPurity/htmlGenerator all still green).
- build: green.
- parity.spec.ts (run ×2, deterministic) 7/7. atelier2 hero bands: #1 0.014% · #10 0.012% · #11 0.201% · #12 0.109% (all «3%). atelier2 negative control 46.5% (bites). meridian/atelier controls 6.4%/6.2%.

### What's still NOT Atelier (Wave 2 candidates)
- Rule-header index grammar (`01 —` Kontur `.atl-rule .atl-idx`) on section headers (gallery/packages/about/proof).
- Gallery masonry composition fidelity + packages/about/footer layout personality.
- 2nd CTA in hero (deferred — content contract untouched this wave).
- Header overlay-on-cover + language toggle (Kundius EN/NL); centered header is arrangement-only so far.
- Marquee strip attached to hero; slide numeral currently static "01" (multi-slide index grammar).

## Phase 8.5 — Wave 2A (rule-header grammar + footer giant wordmark)

### Files changed
- `src/modules/skeletons/work/tokenContract.ts` — 2 new skin tokens + enums/bools + 9 derived serialized vars.
- `src/modules/skeletons/work/tokenContract.test.ts` — fixture + Wave-2A assert/serialize coverage.
- `src/modules/templates/atelier2/skin.ts` — opts in (`sectionHeaderStyle:'rule'`, `footerWordmark:true`).
- `src/modules/skeletons/work/blocks/Gallery/styles.ts` — exported `RULE_HEAD` helper + applied to grid/masonry/strip heads.
- `src/modules/skeletons/work/blocks/Packages/styles.ts` — imports+applies `RULE_HEAD`.
- `src/modules/skeletons/work/blocks/Proof/styles.ts` — imports+applies `RULE_HEAD` (meta=awards).
- `src/modules/skeletons/work/blocks/About/styles.ts` — imports+applies `RULE_HEAD` (no third line).
- `src/modules/skeletons/work/blocks/Footer/styles.ts` — heading→wordmark vars + accent-dot `::after`.
- NO block `.core.tsx` touched (both treatments are PURE CSS on existing markup — see below).

### New tokens + NEUTRAL defaults (thesis: byte-neutral for a non-setting skin)
| token | primary var | neutral default | atelier2 |
|---|---|---|---|
| `sectionHeaderStyle: 'plain'\|'rule'` | `--wk-sec-head-display` (+4 derived) | `plain` | `rule` |
| `footerWordmark: boolean` | `--wk-footer-wm-fs` (+3 derived) | `false` | `true` |

`sectionHeaderStyle` expands (serializeSkinTokens) to `--wk-sec-head-display` (block/flex), `-bw` (0/2px), `-pt` (0/18px), `-num` (none/block index numeral), `-meta-ml` (0/auto). `footerWordmark` expands to `--wk-footer-wm-fs` (compact/`clamp(48px,11vw,170px)`), `-lh` (1.02/0.85), `-ls` (-0.02em/-0.04em), `--wk-footer-dot` (none/inline). All fail loud via existing WORK_TOKEN_STRING_ENUMS (`sectionHeaderStyle`) + WORK_TOKEN_BOOL_FIELDS (`footerWordmark`) loops.

### Treatment 1 — rule header (CSS-only, no core edit)
Shared `RULE_HEAD(prefix, meta?)` helper (Gallery/styles, imported by Packages/Proof/About) emits an ADDITIVE var-gated block over each existing `__head`: `display` flips block→flex, a 2px `currentColor` top rule (auto-contrasts on dark proof surface), an accent index numeral via `::before`, `heading` order:1, `eyebrow` pushed right (`margin-left:auto`) as the meta (its uppercase-tracked style already matches Atelier `.atl-meta`), and the third line (lead/awards) dropped full-width below. In plain mode every gated prop resolves to its current value and all flex-only props (order/gap/align-items/flex-basis) are inert on a block box → byte-identical (proven by parity: gallery/proof/packages/about bands unchanged vs Wave 1).

**Numeral wiring:** a pure CSS counter — `::before{ content:counter(wk-sec,decimal-leading-zero); counter-increment:wk-sec }`. No content-contract field, no data. In plain mode `::before` is `display:none`, which per spec suppresses BOTH render and increment → zero side effects. Applied heads (gallery/packages/proof/about) auto-number 01/02/03/04 in document order on a full page. **Limitation:** the e2e parity harness renders each section in ISOLATION, so every band shows "01" (edit==published holds trivially); true 01/02/03/04 sequencing is only exercised on a full multi-section page (no counter-reset anywhere → the counter lives at document root and accumulates). Meta reuses `eyebrow` (task-sanctioned); designer's meta is descriptive prose — a `lead`-as-meta swap is a taste call left for founder eyeball.

**About caveat:** about's `__head` is the LEFT cell of a 2-col grid, not a full-width band, so its rule + index render within that column (scaled-down rule header). Proof: rule applied to the DEFAULT testimonials head only; the centered logos/results proof SHAPES (unused by atelier2) left as-is.

### Treatment 2 — footer giant wordmark (CSS-only, no core edit)
The `heading` h2 is restyled into Atelier's `.atl-footer-big .fw` via the 4 `--wk-footer-*` vars + an accent-dot `::after` (`content:"."`, gated by `--wk-footer-dot`). Leads the footer already (first element in `__top`). Byte-neutral off (dot `display:none`, sizes = old literals). **Contract reachability:** the footer contract (`fromDonor(GranthFollowFooter)`) has NO brand/name field, so the wordmark text sources from `heading` (the closest prominent scalar; single binding, no new field). Atelier's 3 named link columns (Index/Elsewhere + city/phone/email contact block) are NOT reachable — the footer contract carries only `eyebrow/heading/note/copyright/socials[]`. Delivered: giant wordmark + dot + existing note/socials/copyright. NOT delivered (needs a contract field — Wave 2 later / concierge): named nav columns, contact detail block, true studio-name wordmark distinct from the closer heading.

### Before/after (atelier2)
- gallery/packages/proof heads: stacked eyebrow→h2→lead  →  `[2px rule] 01  <h2> ......... <eyebrow meta>` + lead below.
- about head: same, scoped to its grid column.
- footer heading: `clamp(1.7rem,4vw,3rem)`  →  `clamp(48px,11vw,170px)` weight 700, lh 0.85, -0.04em, trailing accent dot.
- Every other skin (neutral defaults): unchanged.

### Gate results
- `tsc --noEmit`: clean (no page.tsx error in this worktree).
- `test:run`: 187 files / 3275 tests pass, 18 skipped (new tokenContract cases green; conformance/coreParity/renderParity/skinPurity/htmlGenerator all green).
- `build`: green.
- `parity.spec.ts` (run ×2, IDENTICAL/deterministic) 7/7. atelier2 bands: header 1.236% · **work(gallery/masonry) 0.528%/0.125%/0.076%** · **proof 1.737%/0.576%/0.223%** · **packages 0.585%** · **about 0.642%** · **footer 0.538%** · hero 0.014% — all «3%. Negative controls bite: meridian 6.409%, atelier 6.209%, atelier2 46.496%. meridian/hearth/atelier suites unchanged.

### Deviations
- **No `.core.tsx` files touched** (plan listed them as "likely"). Both treatments are achievable as pure var-gated CSS on the existing single-source markup (index = `::before` counter; meta = existing eyebrow reordered; wordmark = restyled heading + `::after` dot), which is strictly more parity-safe than markup changes and needs no new contract fields. Conservative choice, logged here.
- **`RULE_HEAD` lives in Gallery/styles.ts** and is imported by Packages/Proof/About styles (all plain server-safe CSS-string modules) to avoid divergence — no shared module created (out of scope); a same-skeleton sibling import.

### Remaining Wave 2 candidates
- Footer named link columns + contact block + distinct studio-name wordmark (needs a footer contract field).
- Multi-section numeral verified only on a full page (isolated harness shows 01 each).
- Gallery masonry composition fidelity; hero marquee strip + 2nd CTA (contract-touching); header overlay-on-cover + EN/NL toggle.
