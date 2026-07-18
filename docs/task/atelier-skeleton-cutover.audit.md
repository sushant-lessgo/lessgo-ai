# atelier-skeleton-cutover — Phase 1 audit

Phase 1: re-point the live `atelier` templateId onto the work-skeleton (the
`atelier2` staging barrel) + graceful-fallback proof. No dir deletion, no id
removal (those are phases 3/4).

## Files changed

Source:
- `src/modules/templates/registry.ts`
- `src/modules/skeletons/ids.ts`
- `src/lib/staticExport/htmlGenerator.ts`
- `src/modules/templates/blockManifest.ts`
- `src/modules/templates/templateConformance.ts`
- `src/modules/templates/templateMeta.ts`
- `src/modules/audience/product/pageArchetypes.ts`
- `src/modules/templates/blockMocks/index.ts`
- `src/modules/templates/blockMocks/atelier2.ts`

Tests:
- `src/modules/templates/atelier/renderParity.atelier.test.tsx` — DELETED
- `src/modules/skeletons/work/__tests__/oldContentFallback.test.tsx` — NEW
- `src/modules/templates/__tests__/dispatch.test.ts`
- `src/modules/templates/fit.test.ts`
- `src/modules/brief/serveGate.test.ts`
- `src/modules/wizard/generation/work.llm.test.ts`
- `src/lib/staticExport/htmlGenerator.test.ts`
- `src/modules/templates/conformance.test.ts`
- `src/modules/templates/skinPurity.test.ts`
- `src/modules/audience/product/pageArchetypes.atelier.test.ts`

Out-of-scope (flagged deviation, regenerated snapshot only — see Deviations):
- `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap`

Not modified (were on the Files-touched list but needed no change):
- `src/modules/templates/templateMeta.test.ts` — verify-only; its checks are generic
  (id/retired/bespoke counts + a capability-vocab + capabilitySections-evidence loop).
  Adding `works`→`workcatalog` to atelier satisfies the evidence loop; stayed green.
- `src/modules/audience/product/pageArchetypes.test.ts` — the `:133` case is a comment;
  the file references neither `quote` nor the atelier resolver. Stayed green.

## Per-file changes

- **registry.ts**: atelier loader now `import('@/modules/templates/atelier2')` and
  surfaces the skeleton barrel's exports (`defaultPaletteId`/`variants`/
  `defaultVariantId`/`paletteImageKeywords`/`defaultKnobs`/`knobs`), matching the
  atelier2 loader. atelier2 loader left in place (retired phase 3). Comment refreshed.
- **skeletons/ids.ts**: `skeletonBackedTemplateIds = ['atelier','atelier2']`
  (transitional). This flips the `work.v1.js` embed for atelier publishes.
- **htmlGenerator.ts**: removed the `usesAtelier` flag, its param through
  `buildHTMLDocument`, and the `slider.v1.js` `<script>` tag + comment. New atelier
  publishes are skeleton pages and get `work.v1.js` via `usesWorkSkeleton`.
  `atelierSliderBehaviors.js` + buildAssets `slider.v1.js` entry KEPT (immutable-asset
  contract for old blobs) — confirmed `public/assets/slider.v1.js` still emits.
- **blockManifest.ts**: deleted the hand-written `atelierManifest` const;
  `atelier: workSkeletonManifest` (+ atelier2 unchanged).
- **templateConformance.ts**: dropped `resolveAtelierBlock`/`AtelierPlaceholderBlock`
  imports; `atelier` RESOLVERS entry → `{ resolve: resolveWorkBlock, placeholder:
  WorkPlaceholderBlock }`.
- **templateMeta.ts**: atelier `capabilities` now `['gallery','packages','multipage',
  'works']` and `capabilitySections` gains `works:'workcatalog'`; STAYS non-bespoke.
  Activates the works ingestion fan-out on the live atelier look. atelier2 untouched.
- **pageArchetypes.ts**: `ATELIER_PAGE_ARCHETYPES` swapped `quote`→`proof` in all
  allowed/required/default section lists (skeleton registry has `proof`, not `quote`);
  comment updated to reference `resolveWorkBlock`.
- **blockMocks/atelier2.ts**: `atelier2Sections(templateId = 'atelier2')` now
  parameterized so both keys share the skeleton mocks.
- **blockMocks/index.ts**: deleted `ATELIER_BLOCK_MOCKS` + `atelierSections()`;
  `atelier: atelier2Sections('atelier')` (skeleton mocks tagged with the live id);
  atelier2 key retained.

## New tests + what they prove

- **oldContentFallback.test.tsx** (NEW, render-level fallback proof): resolves the
  skeleton **published** `work` default and `hero` default, spreads OLD-atelier
  fixtures as FLAT props (`{...{works:[{id,title,caption,image}]}}` with NO `groups`;
  old hero keys `headline`/`lede`/`cta_text`) and asserts `renderToStaticMarkup` does
  NOT throw and returns non-empty markup. Also renders the published block reached via
  the stray OLD layout name `AtelierWorkGallery` (→ skeleton default), and
  `WorkPlaceholderBlock` (published) once. Proves a stray old-shape project degrades to
  neutral defaults instead of 500-ing the publish path. Flat-spread (not `content={}`)
  chosen deliberately so the old-vs-new field access actually executes (non-vacuous).
- **dispatch.test.ts** (added RESOLUTION-level cases): (a) old layout
  `'AtelierWorkGallery'` on a `work` section resolves the skeleton `work` DEFAULT (real
  block, both modes); (b) old-only section type `'quote'` resolves `WorkPlaceholderBlock`
  (both modes); (c) `RESOLVERS.atelier` dispatches through `resolveWorkBlock` /
  `WorkPlaceholderBlock`.
- **htmlGenerator.test.ts** (rewritten): no page (incl. atelier) emits `slider.v1.js`
  anymore; atelier page CONTAINS `/assets/work.v1.js` and NOT `/assets/slider.v1.js`;
  atelier2 positive kept; meridian/hearth negatives kept.
- **fit.test.ts / serveGate.test.ts**: exact-equality capability asserts updated to
  `['gallery','packages','multipage','works']` and capabilitySections to include
  `works:'workcatalog'`.
- **work.llm.test.ts** (DORMANCY case only): refixtured off atelier (which now
  legitimately fires the works fan-out) onto `meridian` (genuinely no `works`); the
  dormancy proof is unchanged. Allow-list assert (:362-363) untouched (phase 3).
- **conformance.test.ts**: retired the old-skin atelier evidence (chrome-key round-trip,
  `assertEditorBasics('atelier')`, `assertKnobConformance('atelier',...)`, phase-6 knob
  back-compat/parity) and their old-skin imports; the collection-family invariants now
  assert BOTH atelier + atelier2 declare a resolving `works` pair and no OTHER template
  declares a collection-family capability. Coverage for atelier now comes from the
  parameterized `templateConformance('atelier')` loop + the atelier2 skeleton blocks
  (identical resolver/manifest/meta).
- **skinPurity.test.ts**: added a `SKIN_DIR` map (`atelier`→`atelier2/`, `atelier2`→
  `atelier2/`) + `REGISTERED_SKINS.atelier` so the purity scan reads the data-only
  barrel, not the still-present OLD `templates/atelier/` skin. The "old dir would fail
  if scanned" proof is retained (now framed as the SKIN_DIR remap being load-bearing).
- **pageArchetypes.atelier.test.ts** (rewritten): dropped the `resolveAtelierBlock`
  import; body types resolve REAL skeleton blocks via `resolveWorkBlock` (non-placeholder,
  both modes); `quote`→`proof`; `selectProductBlocks` picks the skeleton default layout
  names (`WorkGalleryGrid`/`WorkPackages`/`WorkProofTestimonials`/`WorkHeroSlider`/
  `WorkAbout`/`WorkContact` — the no-seed manifest defaults).
- **renderParity.atelier.test.tsx**: DELETED (fed skeleton-shaped BLOCK_MOCKS.atelier
  through the OLD atelier blocks → placeholder → would red for phases 1-3; coverage is
  provided by the skeleton's own renderParity.work.test.tsx + coreParity.test.ts).

## Deviations

1. **Regenerated `uiFoundationIsolation.test.tsx.snap` (out of Files-touched).** The
   in-scope htmlGenerator change removed the static `<!-- Atelier hero cover slider -->`
   comment, which a frozen published-HTML snapshot captured. This is a direct, intended
   consequence of the phase-1 change (analogous to the "fix the minimal thing a phase-1
   edit surfaces" clause). I regenerated ONLY that snapshot via `vitest -u` scoped to
   that one file; the diff is exactly the two removed comment lines (verified — nothing
   else changed). Flagging per scope rules; the test file itself was not edited.

2. **conformance.test.ts old-skin evidence retired more broadly than a literal reading
   of "retire old-skin evidence blocks."** `assertEditorBasics('atelier')` had to be
   removed (not re-pointed): the work-skeleton edit blocks do NOT emit the
   `data-edit-primitive` markers that helper asserts (atelier2 was never enrolled for the
   same reason — grep confirmed zero `data-edit-primitive` in `skeletons/work/`). Keeping
   it enrolled would have gone red. The old-skin knob-conformance + knob back-compat
   blocks were also removed (their `./atelier/tokens` + `AtelierSSRTokens` imports would
   otherwise break at the phase-4 dir delete, and conformance.test.ts is not on phase 4's
   list). Conservative call, logged here.

3. **skinPurity SKIN_DIR remap.** The plan said "explicit map (`atelier`→`atelier2/` dir,
   `atelier2`→`atelier2/` dir)"; I also had to update the "old-atelier excluded" describe
   because its assertion `skeletonBackedTemplateIds does NOT contain 'atelier'` is now
   false (atelier IS skeleton-backed). Reframed as: the live `atelier` id maps (via
   SKIN_DIR) to the data-only atelier2/ barrel, and the old dir would still fail if
   scanned. Same load-bearing proof.

4. **collection-family exclusion test.** Adding `works` to atelier reds the "no template
   OTHER than atelier2 declares a collection-family capability" case. Widened the
   allow-set to `{atelier, atelier2}` (the transitional work look) and converted the
   single-id works-pair assertion to `it.each(['atelier','atelier2'])`. In-scope
   (conformance.test.ts is on the list); logged for completeness.

## Gate results (run from WORKDIR)

- **`npx tsc --noEmit`**: green for all phase-1 files. ONE pre-existing, unrelated error
  remains: `src/app/page.tsx(6,26): error TS2307: Cannot find module
  '@/assets/images/founder.jpg'`. Not touched by this phase, not on any Files-touched
  list; flagging as pre-existing environment/asset-typing state.
- **`npm run test:run`**: green. `Test Files 244 passed | 1 skipped`; `Tests 4020 passed
  | 14 skipped` (after the snapshot regen; the two snapshot failures were the removed
  atelier comment and are now resolved).
- **`npm run build`**: green (full build — buildPublishedCSS + buildAssets + next build).
  Confirmed `public/assets/slider.v1.js` AND `public/assets/work.v1.js` both emitted.
- **`npm run lint`**: green — only pre-existing warnings (`no-img-element`,
  `exhaustive-deps`) across unrelated files; zero errors, none in phase-1 files.

## Open risks / deferred

- Phase 2 is the human publish-parity eyeball gate — automated equivalents (htmlGenerator
  work.v1.js assertion + oldContentFallback render proof) landed here.
- `atelier2` id, its loader/meta/mocks/skin dir, and the OLD `templates/atelier/` skin dir
  all remain in place by design (phases 3/4). `serviceElementSchema` Atelier* layouts also
  remain (phase 4 guarded cleanup) — `getSchemaDefaults('AtelierFooter')` etc. still
  resolve, so nothing in phase 1 depends on their removal.
- The DB safety-check for real `templateId='atelier'` Project rows is the orchestrator's
  out-of-band task; the phase-1 render/resolution fallback proofs cover the render side
  regardless of its outcome.
