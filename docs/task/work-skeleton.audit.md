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
