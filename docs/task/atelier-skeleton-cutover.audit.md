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

---

# atelier-skeleton-cutover — Phase 3 audit

Phase 3: retire the `atelier2` staging id. Removed `atelier2` from every
dispatch/meta/type site so it ceases to exist as a `TemplateId`; `atelier` (now
skeleton-backed since phase 1) stays. The `templates/atelier2/` DIR and
`blockMocks/atelier2.ts` FILE stay until phase 4 — only the id/keys/references go.

## Files changed

Source:
- `src/types/service.ts`
- `src/modules/templates/registry.ts`
- `src/modules/templates/blockManifest.ts`
- `src/modules/templates/templateConformance.ts`
- `src/modules/templates/templateMeta.ts`
- `src/modules/brief/serveGate.ts`
- `src/modules/skeletons/ids.ts`
- `src/lib/workCopyEngine.ts`
- `src/app/api/brief/confirm/route.ts`
- `src/modules/templates/atelier2/skin.ts` (id → 'atelier')
- `src/modules/templates/blockMocks/index.ts`
- `src/modules/templates/blockMocks/atelier2.ts` (default param → 'atelier'; file renamed phase 4)
- `src/lib/staticExport/htmlGenerator.ts` — **OUT OF FILES-TOUCHED (deviation, see below)**

Comment-only refreshes:
- `src/app/edit/[token]/components/toolbars/ToolbarShell.tsx`
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`
- `src/components/onboarding/journey/engines/work/ShowWorkStep.tsx`
- `src/lib/staticExport/workBehaviors.js`
- `src/modules/skeletons/work/manifest.ts` · `tokenContract.ts` · `resolveWorkBlock.ts`
- `src/modules/generation/README.md` · `src/modules/audience/work/README.md`

Tests:
- `src/lib/workCopyEngine.test.ts`
- `src/modules/brief/serveGate.test.ts` (atelier2 id sweep only; :319-320 caps untouched)
- `src/modules/wizard/generation/work.llm.test.ts` (allow-list only; DORMANCY untouched)
- `src/modules/templates/templateMeta.test.ts`
- `src/modules/skeletons/work/tokenContract.test.ts`
- `src/modules/skeletons/work/__tests__/kundiusPages.test.tsx`
- `src/modules/skeletons/work/renderParity.work.test.tsx`
- `src/modules/templates/skinPurity.test.ts`
- `src/lib/staticExport/htmlGenerator.test.ts`
- `src/modules/templates/__tests__/dispatch.test.ts`
- `src/modules/templates/conformance.test.ts`

Not modified (on the list but needed no change):
- `src/modules/wizard/generation/work.llm.ts` + `work.ts` — grep found NO `atelier2`
  token in either; nothing to refresh. (Listed defensively in the plan.)
- `src/modules/brief/serveMatrix.test.ts` — union shrink did not bite it (green untouched).
- `src/modules/skeletons/work/__tests__/oldContentFallback.test.tsx` — did not reference the id.

## Per-file changes

- **service.ts**: dropped `'atelier2'` from `templateIds`, `defaultVariantForTemplate`,
  `templateLabels`, `templateBlurbs`, `PALETTES_BY_TEMPLATE`. Refreshed the atelier
  description to the skeleton look (cover-slider hero, masonry gallery) + the stale
  header comment block.
- **registry.ts**: deleted the `atelier2` loader; refreshed the atelier loader comment
  (cutover done — skeleton-backed; barrel folds into templates/atelier/ in phase 4).
- **blockManifest.ts**: dropped the `atelier2: workSkeletonManifest` key.
- **templateConformance.ts**: dropped the `atelier2` RESOLVERS entry + refreshed the
  static-import comment.
- **templateMeta.ts**: deleted the `atelier2` entry (28 lines) + refreshed the atelier
  capability comment (no longer references the "staging atelier2 entry").
- **serveGate.ts**: dropped `atelier2` from `TEMPLATE_AUDIENCE`.
- **skeletons/ids.ts**: `skeletonBackedTemplateIds = ['atelier']`.
- **workCopyEngine.ts**: `WORK_COPY_ENGINE_TEMPLATES = ['atelier']` + docstring refresh.
- **api/brief/confirm/route.ts**: removed the `applyWorkTemplateOverride` dev seam
  (function + its `templateIds` import + the call site now uses `decision.templateId`
  directly) + the top-of-file comment about validating the override.
- **atelier2/skin.ts**: `WorkSkinDef.id: 'atelier'` (grep-confirmed no runtime consumer).
- **blockMocks/index.ts**: dropped the `atelier2` key; `atelier: atelier2Sections('atelier')`
  remains. The `atelier2Sections` import + function name stay (they live in
  blockMocks/atelier2.ts, renamed in phase 4).
- **blockMocks/atelier2.ts**: default param `= 'atelier'` (was `'atelier2'`, no longer a
  valid TemplateId → tsc). Internal dev-fixture sectionIds (`atelier2-header` …) + the
  function name LEFT for phase 4's rename (they are the file's own contents; the plan
  scopes the rename to phase 4).
- **Test re-seeds**: allow-list asserts → `['atelier']`; TEMPLATE_AUDIENCE expected map
  drops atelier2; DEVIATE set → `['lumen','atelier']`; templateMeta counts 10→9 ids,
  9→8 non-retired, bespoke set → `['lumen']`; conformance `resolvesReal`/`toContain`/
  `it.each`/`WORKS_TEMPLATES`/`assertCollectionCapabilityBacked` re-pointed atelier2→
  atelier; htmlGenerator dropped the atelier2 case + repointed styleTokens cases to
  atelier; dispatch + renderParity + kundius + tokenContract label/id refreshes.

## Deviations

1. **`src/lib/staticExport/htmlGenerator.ts` edited — NOT on the phase-3 Files-touched
   list.** Line 165 carried a comment `// Skeleton-backed pages (atelier, atelier2) load
   work.v1.js`. The phase-3 verification target is `grep -ri atelier2 src/` → ZERO except
   the `templates/atelier2/` dir contents + `blockMocks/atelier2.ts` file. That stray
   comment is neither, so hitting the target required cleaning it. Change is COMMENT-ONLY,
   zero behavior change, and directly serves the phase's stated grep-zero gate (the plan's
   step-12 comment-refresh list simply omitted this file). Flagged per scope rules rather
   than widening silently. tsc/tests/build/lint all confirm no functional impact.

2. **blockMocks/atelier2.ts internal sectionIds + function name LEFT as `atelier2*`.**
   Plan step 11 scopes this file to "drop the atelier2 key" only; the file rename (and
   thus its internal-identifier cleanup) is explicitly phase 4 (step 3). So the
   `atelier2-*` dev-fixture sectionIds and the `atelier2Sections` export name remain —
   they are part of the `blockMocks/atelier2.ts` file that phase 4 renames. This is the
   tolerated phase-4 remainder. Conservative reading of the plan's line-scoping.

## grep -ri atelier2 src/ — remaining hits (all tolerated phase-4 remainders)

All remaining hits reference the still-present `templates/atelier2/` DIR or the
`blockMocks/atelier2.ts` FILE (import paths, the `SKIN_DIR.atelier → 'atelier2'` mapping
that must point at the real dir until phase 4, the `atelier2Sections` function that lives
in that file, its dev-fixture sectionIds, and comments describing those paths):
- `conformance.test.ts:80`, `skinPurity.test.ts:25`, `registry.ts:122`,
  `kundiusPages.test.tsx:39`, `blockMocks/index.ts:13` — `import … from '…/atelier2…'`.
- `blockMocks/atelier2.ts` (whole file), `atelier2/skin.ts`, `atelier2/index.ts` — the
  dir/file that phase 4 `git mv`s and renames.
- `skinPurity.test.ts:30-159` — the `SKIN_DIR` value `'atelier2'` + its explanatory
  block, deliberately load-bearing until the phase-4 dir move.
- `blockMocks/index.ts:88` + `kundiusPages.test.tsx:131` — the `atelier2Sections` name.

ZERO id-level references remain: the `TemplateId` union, `templateMeta`, `serveGate`
`TEMPLATE_AUDIENCE`, `skeletonBackedTemplateIds`, `WORK_COPY_ENGINE_TEMPLATES`,
registry loaders, RESOLVERS, block manifest, and every allow-list/DEVIATE/WORKS set are
all atelier2-free.

## Gate results (run from WORKDIR)

- **`npx tsc --noEmit`**: green (EXIT 0). The pre-existing `src/app/page.tsx` TS2307
  (`@/assets/images/founder.jpg`) did NOT surface this run — confirmed transient.
- **`npm run test:run`**: green — `Test Files 244 passed | 1 skipped`; `Tests 3916 passed
  | 14 skipped`. (Count dropped from phase 1's 4020 because the retired duplicate
  allow-list asserts, the htmlGenerator atelier2 case, and the conformance atelier2
  blocks were removed/re-pointed — expected.)
- **`npm run build`**: green (EXIT 0) — full build (buildPublishedCSS + buildAssets +
  next build).
- **`npm run lint`**: green (EXIT 0) — only pre-existing `no-img-element` /
  `exhaustive-deps` warnings in unrelated files; zero errors.

## Open risks / deferred

- The `templates/atelier2/` dir + `blockMocks/atelier2.ts` file remain by design (phase 4
  deletes the old `templates/atelier/` skin, `git mv`s `atelier2/` → `atelier/`, and
  renames the blockMocks file). Their internal `atelier2` tokens are the only tolerated
  grep remainder.
- The `WORK_JOURNEY_TEMPLATE_OVERRIDE` env seam is gone — dev journeys can no longer be
  re-pointed onto a pilot id (there is no pilot id anymore). Plan Q2 resolved as "delete
  entirely" by executing the plan step; if a future skin pilot (Kontur/Pulse) needs a
  generic override, it must be re-introduced deliberately.
- `serviceElementSchema` Atelier* layouts still resolve (phase 4 guarded cleanup).

---

# atelier-skeleton-cutover — Phase 4 audit

Phase 4: the irreversible fold. Delete the OLD hand-written `templates/atelier/`
skin dir; `git mv templates/atelier2` → `templates/atelier` (the data-only skeleton
barrel becomes canonical); rename `blockMocks/atelier2.ts` → `atelier.ts`; re-point
every remaining `@/modules/templates/atelier2` import; guarded cleanup of the 8 dead
`Atelier*` layout entries in the service element schema. Frozen `slider.v1.js` asset
KEPT. End state: `atelier2` is GONE everywhere; `templates/atelier/` = `{index.ts,
skin.ts}` only.

## Files changed

Deleted (old skin dir, `git rm -r`):
- `src/modules/templates/atelier/**` — 32 files: `AtelierPlaceholderBlock.tsx`,
  `resolveAtelierBlock.ts`, `tokens.ts`, `palettes.ts`, `paletteSelection.ts`,
  `imageKeywords.ts`, `sectionRules.ts`, `ThemeInjector.tsx`, `index.ts`, `README.md`,
  `blocks/`, `components/`, `hooks/`, and the co-located `registration.test.ts` +
  `coreParity.test.ts`. (`renderParity.atelier.test.tsx` was already deleted in phase 1.)

Moved (`git mv`):
- `src/modules/templates/atelier2/{index.ts,skin.ts}` → `src/modules/templates/atelier/`
- `src/modules/templates/blockMocks/atelier2.ts` → `src/modules/templates/blockMocks/atelier.ts`

Edited:
- `src/modules/templates/atelier/index.ts` (moved; header comment path + id refresh)
- `src/modules/templates/atelier/skin.ts` (moved; header comment path refresh)
- `src/modules/templates/blockMocks/atelier.ts` (moved; `atelier2`→`atelier` throughout:
  `ATELIER_BLOCK_MOCKS` const, `atelierSections` fn, all `atelier-*` sectionIds, header comment)
- `src/modules/templates/registry.ts` (loader import path + comment)
- `src/modules/templates/blockMocks/index.ts` (import + call `atelierSections`)
- `src/modules/templates/skinPurity.test.ts` (import `./atelier/skin`; dropped SKIN_DIR
  map + the now-moot "old dir excluded" describe)
- `src/modules/templates/conformance.test.ts` (import path `./atelier/skin`) — see Deviation 1
- `src/modules/skeletons/work/__tests__/kundiusPages.test.tsx` (import + call) — see Deviation 1
- `src/modules/audience/service/elementSchema.ts` (deleted 8 dead `Atelier*` layout entries)
- `src/lib/staticExport/atelierSliderBehaviors.js` (header comment → legacy-frozen)
- `scripts/buildAssets.js` (`slider.v1.js` entry comment → legacy-frozen)

Not modified (on the list but needed no change):
- `src/modules/templates/CriticalFontPreload.tsx` — `case 'atelier'` comment already
  accurately describes the skeleton faces (editorial=Bricolage Grotesque, compact=Fraunces);
  no stale reference. Left untouched.

## Per-step notes

1. **Delete old skin dir** — `git rm -r src/modules/templates/atelier/` removed all 32
   remaining files. Recoverable via git history.
2. **Fold barrel** — `git mv atelier2 → atelier`. Registry loader now
   `import('@/modules/templates/atelier')`; comment says cutover DONE (this IS the barrel).
   Moved `index.ts`/`skin.ts` header comments refreshed off the `atelier2`/"phase 9" wording.
3. **blockMocks rename** — file → `atelier.ts`; `atelier2Sections`→`atelierSections`,
   `ATELIER2_BLOCK_MOCKS`→`ATELIER_BLOCK_MOCKS`, and all internal `atelier2-*` dev-fixture
   sectionIds → `atelier-*`. Both consumer imports (index.ts, kundiusPages.test.tsx) re-pointed.
4. **Guarded elementSchema cleanup** — grep `Atelier` across `src` FIRST. The 8 layout
   entries (`AtelierNavHeader/Hero/WorkGallery/Packages/About/QuoteBand/Contact/Footer`)
   had NO live schema readers: the only remaining `Atelier*` references are (a) TEST
   fixtures that use `AtelierAbout`/`AtelierWork`/etc. as OPAQUE layout-name strings the
   WORK engine deliberately ignores (`scopedRegen.test.ts`, `regenerate-*/route.test.ts`,
   `aiActionsErrorSurfacing.test.ts` — the fixtures narrow against the frozen work contract,
   NOT the schema), and (b) descriptive comments/prose. The live Work* schema lane
   (`audience/work/elementSchema.ts` spread into serviceElementSchema) is unaffected. Deleted
   lines 644–898 (comment header + 8 entries + trailing blank). test:run stayed green,
   confirming no live reader. Deleted via `sed -i '644,898d'` (a 255-line exact-match Edit
   was impractical; pure structural deletion, boundaries verified before + after).
5. **Frozen slider asset KEPT** — `atelierSliderBehaviors.js` + buildAssets `slider.v1.js`
   entry retained; headers now state LEGACY-FROZEN (old atelier skin retired; new atelier
   publishes load work.v1.js; kept only for already-published old blobs). Build confirms
   `public/assets/slider.v1.js` still emits alongside `work.v1.js`.
6. **CriticalFontPreload** — comment already correct; no edit.

## Deviations

1. **`conformance.test.ts` + `kundiusPages.test.tsx` edited — not on the plan's phase-4
   Files-touched, but EXPLICITLY added by the orchestrator's task message** ("update EVERY
   `@/modules/templates/atelier2` import path: registry.ts, skinPurity.test.ts,
   conformance.test.ts, kundiusPages.test.tsx, blockMocks/index.ts"). Both carried a live
   `atelier2` import that the dir move would break (dangling import → tsc red), so the fix
   is mandatory for a green gate. Both changes are import-path-only (+ the `atelierSections`
   rename in kundius). Flagged per scope rules; the plan's Files-touched list simply omitted
   these two import sites that the orchestrator caught.

2. **One `resolveAtelierBlock` reference survives — a COMMENT in
   `pageArchetypes.atelier.test.ts` (NOT on my Files-touched).** It reads "…resolve through
   resolveWorkBlock (NOT the retired resolveAtelierBlock)…" — an accurate historical
   description of the retirement, not a live code symbol. Editing it would touch an
   out-of-scope file for a purely cosmetic prose change, so I LEFT it. The verification
   target's intent ("0 hits outside git history") is about live symbol references; this is
   descriptive prose. Benign; noted for the reviewer.

## grep verification (from WORKDIR)

- **`grep -rin atelier2 src scripts` → 0 hits.** (The whole point of phase 4 — clean.)
- **`grep -rn "resolveAtelierBlock|AtelierPlaceholderBlock|AtelierHero" src scripts` → 1
  hit**, the benign comment in `pageArchetypes.atelier.test.ts:11` (Deviation 2). No live
  symbol references remain.
- **`ls templates/atelier/` → `index.ts`, `skin.ts` ONLY** (skinPurity test now enforces
  this for the live id).
- **`grep -c Atelier src/modules/audience/service/elementSchema.ts` → 0** (all 8 dead
  layout entries removed).

## Gate results (run from WORKDIR)

- **`npx tsc --noEmit`**: green (EXIT 0). The dir move / import re-point introduced no
  dangling imports.
- **`npm run test:run`**: green — `Test Files 242 passed | 1 skipped`; `Tests 3859 passed
  | 14 skipped`. (Count dropped from phase 3's 3916: the old dir's co-located
  `registration.test.ts` + `coreParity.test.ts` were deleted with the dir, and the moot
  skinPurity "old-atelier excluded" describe was removed — expected.)
- **`npm run build`**: green (EXIT 0) — full build (buildPublishedCSS + buildAssets + next
  build). Confirmed `public/assets/slider.v1.js` AND `public/assets/work.v1.js` both emit.
- **`npm run lint`**: green (EXIT 0) — only pre-existing `no-img-element` / `exhaustive-deps`
  warnings in unrelated files; zero errors.

## Open risks / deferred

- `templates/atelier/` is now the canonical skeleton barrel (data-only, `{index.ts,skin.ts}`);
  the `atelier2` staging id is fully gone from src + scripts.
- The frozen `slider.v1.js` asset + its source remain by contract (old published blobs
  reference it by URL). New atelier publishes are skeleton pages loading `work.v1.js`.
- Phase 5 (final gates + merge readiness) is the remaining human gate — not this phase.
