# atelier-skeleton-cutover — plan

Branch: `feature/atelier-skeleton-cutover` · Spec: `docs/task/atelier-skeleton-cutover.spec.md` (tier: full)

## Overview

Re-point the live `atelier` templateId onto the work-skeleton (the `atelier2` staging barrel), so the work engine's `groups` output finally renders on the real, selectable Atelier look. Then retire the `atelier2` dev id and delete the old 32-file `src/modules/templates/atelier/` skin. Stray old-`atelier` projects must degrade to neutral skeleton defaults (the existing resolveWorkBlock fallback covers this — the plan's job is to PROVE it with tests at both the RESOLUTION and the RENDER level, not add code). Riskiest slice first: re-point + fallback proof + publish parity BEFORE any deletion.

**Cutover mechanic (decided): fold `atelier2/` INTO `atelier` in two moves.** Phase 1 re-points the `atelier` registry loader at the existing `@/modules/templates/atelier2` barrel (no dir moves — smallest reviewable diff for the risky slice). Phase 4, after the id is retired and gates are green, deletes the old skin dir and `git mv`s `atelier2/` → `atelier/` so the end state is ONE canonical `templates/atelier/` = the skeleton skin barrel (`index.ts` + `skin.ts` only). Rejected alternative: renaming the dir in phase 1 — couples the risky dispatch change to a dir move and to deleting the old dir, exactly what the spec's fail-fast ordering forbids.

**Blast-radius closure — `fit.ts` needs NO code change** (spec names it as a re-key site): `fit()`/`shortlist()` carry no `atelier` literal — they derive entirely from `templateMeta` (`fit.ts:46` excludes only `meta.retired || meta.bespoke`). `atelier` is already non-bespoke → already serve-eligible; `atelier2` stays excluded via `bespoke:true` until its entry is deleted in phase 3. The only fit-side edits are TESTS (exact-equality capability assertions — phase 1).

**Out-of-band:** the DB safety-check (any real Project rows on `templateId='atelier'`) is run by the orchestrator. The phase-1 fallback tests cover the render side regardless of its outcome.

**Firewall invariant:** no templateId/skeletonId enters any prompt. This whole feature is render/dispatch/meta only — `promptFirewall.ts` (`TEMPLATE_NAME_TOKENS` includes `'atelier'`) is untouched and its test must stay green.

## Progress log

- phase 1 re-point atelier onto skeleton + fallback proof: done (commit e62bc087, review loops 1, ship). tsc/test:run(4020)/build/lint green. page.tsx TS2307 confirmed transient/pre-existing. DB safety-check STILL PENDING (user to run) — hard gate before phase-2 publish eyeball.
- phase 2 publish-parity smoke (human gate): pending
- phase 3 retire atelier2 id: done (commit 7a8a40a2, review loops 1, ship). Zero id-level atelier2 refs; 40 grep remainders all phase-4 (dir/file/import-path). tsc/test:run(3916)/build/lint green.
- phase 4 delete old skin dir + fold barrel into templates/atelier (human gate): pending
- phase 5 final gates + merge readiness (human gate): pending

---

## Phase 1 — Re-point `atelier` onto the work-skeleton + graceful-fallback proof

The riskiest slice: `atelier` dispatches/publishes through the skeleton while `atelier2` still exists untouched (dropped in phase 3). No dir deletion, no id removal yet.

### Steps

1. **Registry loader** (`registry.ts:115-136`): `atelier: async () => import('@/modules/templates/atelier2')` — surface the barrel's exports (`resolveBlock`, `ThemeInjector`, `SSRTokens`, `getSurfaceForSection`, `defaultPaletteId`, `variants`, `defaultVariantId`, `paletteImageKeywords`, `knobs`, `defaultKnobs`) exactly as the current `atelier2` loader does. Old skin exports (`defaultAtelierPalette`, `atelierKnobs`, …) no longer referenced from the loader. Leave the `atelier2` loader in place.
2. **Skeleton ids** (`skeletons/ids.ts`): `skeletonBackedTemplateIds = ['atelier', 'atelier2']` (transitional; `atelier2` dropped in phase 3). This flips the `work.v1.js` embed for `atelier` publishes.
3. **htmlGenerator** (`lib/staticExport/htmlGenerator.ts:165-167, 200, 289-295, 436`): remove the `usesAtelier` flag/param and the `slider.v1.js` script tag entirely — new atelier publishes are skeleton pages and get `work.v1.js` via `usesWorkSkeleton`. **KEEP** `scripts/buildAssets.js`'s `slider.v1.js` entry and `src/lib/staticExport/atelierSliderBehaviors.js` — immutable-asset contract: already-published old blobs reference `/assets/slider.v1.js` by URL and must keep loading it.
4. **Block manifest** (`blockManifest.ts`): `atelier: workSkeletonManifest`; delete the `atelierManifest` const (401-489). Side effect (intended): `selectProductBlocks`/manifestPick now emits skeleton layout names (`WorkGalleryMasonry` etc.) for new atelier pages.
5. **Conformance resolver map** (`templateConformance.ts:76-77, 101`): `atelier: { resolve: resolveWorkBlock, placeholder: WorkPlaceholderBlock }`; delete the `resolveAtelierBlock` / `AtelierPlaceholderBlock` imports (pre-req for the phase-4 dir delete).
6. **templateMeta** (`templateMeta.ts:190-205`): `atelier` absorbs atelier2's honest capability set — add `works` to `capabilities` and `works: 'workcatalog'` to `capabilitySections` — while STAYING non-bespoke (it already is; this satisfies the spec's "normal selectable work look"). NOTE the intent: this edit ACTIVATES the works ingestion fan-out on atelier (the spec goal — the work vertical lighting up on the real atelier look); tests that used atelier as a "no-`works`" fixture must move to a genuinely no-works template (step 9). `atelier2` entry untouched (goes in phase 3). Refresh the comment block.
7. **fit.test.ts** (`fit.test.ts:69-71`): the lane-provenance case asserts `templateMeta.atelier.capabilities` by EXACT equality (`toEqual(['gallery','packages','multipage'])`) — step 6 reds it. Update the expectation to include `works` (keep the `not.toContain('lead-form'/'bilingual')` provenance asserts as-is). No `fit.ts` code change (see Overview).
8. **serveGate.test.ts capability asserts** (`serveGate.test.ts:319-320`) — the identical-assertion SIBLING of step 7: the "rungC gallery probe is backed by atelier templateMeta" case asserts BOTH maps by exact equality — `expect(meta.capabilities).toEqual(['gallery','packages','multipage'])` (:319) and `expect(meta.capabilitySections).toEqual({ gallery: 'work', packages: 'packages' })` (:320) — so step 6 reds both immediately. Update :319 → `['gallery','packages','multipage','works']` (matching templateMeta's declared order) and :320 → `{ gallery: 'work', packages: 'packages', works: 'workcatalog' }`. ONLY these capability asserts change in phase 1 — the file's `atelier2` id references (:233, :253-255, :286-302 area) belong to phase 3's id sweep; the two phases touch DISJOINT lines of this file (no collision).
9. **work.llm.test.ts DORMANCY case** (`work.llm.test.ts:329-339`) — the LAST member of the exact-equality-capability-reader class (reviewer sweep confirms nothing else uncovered): it sources `caps` from REAL `templateMeta['atelier'].capabilities` (:331), premise-guards `expect(caps).not.toContain('works')` (:332), and asserts the works fan-out stays dormant (:334 `fc.pages['page-weddings']` undefined). Step 6 reds :332 AND semantically INVERTS the case — with `works` + `PHOTO_BRIEF` the fan-out now legitimately FIRES. Rewrite the DORMANCY test to source `caps` from a template that GENUINELY lacks `works` (e.g. `templateMeta.meridian.capabilities` or `templateMeta.hearth.capabilities`) — atelier can no longer be the no-works fixture; the dormancy PROOF is unchanged, only its fixture moves. The neighboring WIRING case (:311, synthetic `['works']` caps) and BYTE-IDENTICAL case (:341-350, empty-`BRIEF` fast path — reads atelier caps at :344 but is caps-independent) stay green, NO change. Phase-1 edit = the ~:329-339 block ONLY; the file's allow-list assert (:362-363) is phase 3's — do not touch it here.
10. **Page archetypes** (`audience/product/pageArchetypes.ts:122-189`): re-vocabulary `ATELIER_PAGE_ARCHETYPES` to skeleton section types — swap `quote` → `proof` in all `allowedSections`/`requiredSections`/`defaultSections` (the skeleton registry has no `quote` key; `proof` is its dark quote/testimonial band per `skin.ts surfaceBySection.proof='dark'`). Without this, every newly generated atelier page ships a placeholder band. Structure-only change, not a prompt change.
11. **blockMocks** (`blockMocks/index.ts`, `blockMocks/atelier2.ts`): point the `atelier` key at the skeleton mocks (retarget `atelier2Sections` entries' `templateId` to `'atelier'` — parameterize the templateId in `atelier2.ts` so both keys can share until phase 3); delete `ATELIER_BLOCK_MOCKS` + `atelierSections()` (old-skin mocks were the conformance evidence for the old manifest, which is gone). Dev gallery `/dev/blocks/atelier` now shows skeleton blocks.
12. **DELETE `src/modules/templates/atelier/renderParity.atelier.test.tsx`** — it feeds `BLOCK_MOCKS.atelier` (now skeleton-shaped after step 11) through the OLD atelier blocks via `resolveAtelierBlock` (its :33 import, :50 fixture read) → placeholder → parity red for phases 1-3 if kept. Its coverage is already provided by the skeleton's own `renderParity.work.test.tsx` + `coreParity.test.ts`. The old dir's OTHER co-located tests (`registration.test.ts`, `coreParity.test.ts`) are self-contained on `resolveAtelierBlock`/old fixtures and stay green until the phase-4 dir delete — only this one is the phase-1 casualty.
13. **Tests — add the deterministic proofs (this phase, not manual TODOs):**
    - `__tests__/dispatch.test.ts`: NEW graceful-fallback RESOLUTION cases — (a) stored old layout `'AtelierWorkGallery'` on a `work` section resolves the skeleton `work` DEFAULT variant (real component, no throw), both `'edit'` and `'published'` modes; (b) stored old-only section type `'quote'` resolves `WorkPlaceholderBlock` (never throws) in both modes; (c) `atelier` dispatches through `resolveWorkBlock`.
    - **NEW `src/modules/skeletons/work/__tests__/oldContentFallback.test.tsx` — the RENDER-level fallback proof.** Resolution-only checks are inert against the real 500 risk: a RESOLVED skeleton block throwing inside `renderToStaticMarkup` when fed an OLD-atelier content shape. Prop-shape trap: skeleton `.published` blocks take **FLAT SPREAD props** (`<Published sectionId=… {...content} />` — the `renderParity.work.test.tsx:111` pattern), NOT a `content={}` prop. Passing `content={oldFixture}` would leave every field `undefined`, render defaults, and pass VACUOUSLY — the old-vs-new field access (`works` vs `groups`) would never execute. So: for the skeleton **published** blocks a stray old project would hit — at minimum the `work` default (`resolveWorkBlock('work','published','AtelierWorkGallery')` → gallery block) and the `hero` default — build old-atelier fixtures (`{ works: [{id,title,caption,image}] }`, NO `groups`; old hero element keys) and assert `renderToStaticMarkup(<Resolved sectionId="work-test1234" {...oldFixture} />)` (fixture SPREAD as flat props) does NOT throw and returns non-empty markup (neutral defaults/empty cells acceptable; a crash is not). Also render `WorkPlaceholderBlock` (published path) once to prove the placeholder band is server-safe. Lives under `skeletons/work/__tests__/` where the skeleton published blocks are importable.
    - `lib/staticExport/htmlGenerator.test.ts`: rewrite — `atelier` page HTML CONTAINS `/assets/work.v1.js` and does NOT contain `/assets/slider.v1.js`; keep meridian/hearth negatives; keep the `atelier2` positive until phase 3.
    - `conformance.test.ts` (78-84, 307-337, 413-496): atelier's capability evidence (gallery→`work`, packages→`packages`, works→`workcatalog`) now resolves against the skeleton registry in BOTH renderers; retire old-skin evidence blocks.
    - `skinPurity.test.ts` (23-32, 81, 136-146): rewrite the id→skin-dir mapping to an explicit map (`atelier` → `atelier2/` dir, `atelier2` → `atelier2/` dir) so the purity scan doesn't scan the still-present OLD `templates/atelier/` dir; keep the "old dir would fail if scanned" proof until phase 4.
    - `templateMeta.test.ts`: VERIFY-only expected — its :21-37 checks are generic (id/retired/bespoke counts), with NO atelier-specific capability assert, so adding `works` should leave it green; kept in Files-touched defensively in case a count/shape assert bites.
    - `pageArchetypes.atelier.test.ts`: rewrite — drop the `resolveAtelierBlock` import; assert archetype section types resolve REAL skeleton blocks via `resolveWorkBlock`, and `selectProductBlocks` picks skeleton layout names (`uiblocks.work === 'WorkGalleryMasonry'` etc. per `workSkeletonManifest`); `quote`→`proof` expectations. Check `pageArchetypes.test.ts:133` for knock-on.

### Files touched

- `src/modules/templates/registry.ts`
- `src/modules/skeletons/ids.ts`
- `src/lib/staticExport/htmlGenerator.ts`
- `src/modules/templates/blockManifest.ts`
- `src/modules/templates/templateConformance.ts`
- `src/modules/templates/templateMeta.ts`
- `src/modules/audience/product/pageArchetypes.ts`
- `src/modules/templates/blockMocks/index.ts`
- `src/modules/templates/blockMocks/atelier2.ts`
- `src/modules/templates/atelier/renderParity.atelier.test.tsx` — DELETED
- `src/modules/skeletons/work/__tests__/oldContentFallback.test.tsx` — NEW
- `src/modules/templates/__tests__/dispatch.test.ts`
- `src/modules/templates/fit.test.ts`
- `src/modules/brief/serveGate.test.ts` (capability asserts :319-320 ONLY; the atelier2 id sweep stays phase 3)
- `src/modules/wizard/generation/work.llm.test.ts` (DORMANCY case ~:329-339 ONLY — refixture onto a no-`works` template; the allow-list assert :362-363 stays phase 3)
- `src/lib/staticExport/htmlGenerator.test.ts`
- `src/modules/templates/conformance.test.ts`
- `src/modules/templates/skinPurity.test.ts`
- `src/modules/templates/templateMeta.test.ts` (verify-only expected; defensive)
- `src/modules/audience/product/pageArchetypes.atelier.test.ts`
- `src/modules/audience/product/pageArchetypes.test.ts` (only if the :133 case breaks)

### Verification

- `npx tsc --noEmit` green.
- `npm run test:run` green — specifically the NEW resolution-fallback dispatch cases, the NEW render-level `oldContentFallback` cases (flat-spread old-shape props, no-throw + non-empty markup), htmlGenerator work.v1.js assertion, fit.test.ts, serveGate.test.ts, the refixtured work.llm DORMANCY case, conformance, skinPurity, pageArchetypes.
- `npm run build` green (publish path touched → full build, incl. buildPublishedCSS + buildAssets; confirms `slider.v1.js` still emitted to `public/assets/`).
- `npm run lint` green.

---

## Phase 2 — Publish-parity smoke on a real atelier page **[HUMAN GATE: publish-parity eyeball]**

No planned code. Fixes discovered here route back into phase-1 files (re-run phase-1 verification after any fix).

### Steps

1. `npm run build` then run the app (dev is fine for the editor half; the publish half uses the real `/api/publish` flow either way).
2. Create a work-engine project that resolves to `atelier` (`WORK_JOURNEY_TEMPLATE_OVERRIDE` UNSET — the dev seam must not fire; confirm the persisted `templateId` is `atelier`).
3. Editor check: skeleton blocks render (cover hero, masonry gallery consuming `groups`, packages, rule headers), square-button knob seed, palette switcher lists the four Kontur accents.
4. Publish → open `/p/<slug>`: eyeball edit == published; view-source confirms `/assets/work.v1.js` present, NO `slider.v1.js`, skeleton CSS vars present, hero slider + fixed-header behaviors work.
5. **Founder sign-off**: parity eyeball + explicit GO to proceed to id retirement/deletion (this is also the fail-fast gate — a parity or fallback failure stops the feature here with nothing deleted).

### Files touched

- none (fix-forward only, within phase-1's list)

### Verification

- Manual parity eyeball (founder) + view-source asset assertions above. Automated equivalents already landed in phase 1 (htmlGenerator test, oldContentFallback test).

---

## Phase 3 — Retire the `atelier2` staging id

Remove `atelier2` from every dispatch/meta/type site. The `TemplateId` union shrink makes `tsc` enumerate the stragglers — drive the sweep off compiler errors + grep.

### Steps

1. `types/service.ts`: remove `'atelier2'` from `templateIds` (:43), `templateVariantDefaults` (:59), display names (:351), descriptions (:364), `templatePalettes` (:378). Refresh the `atelier` description to the skeleton look (cover-slider hero) and stale comments (:36-41).
2. `registry.ts`: delete the `atelier2` loader (142-156); refresh the atelier loader comment (cutover DONE, not "phase 9").
3. `blockManifest.ts`: drop the `atelier2` key (:510).
4. `templateConformance.ts`: drop the `atelier2` entry (:102) + stale comment.
5. `templateMeta.ts`: delete the `atelier2` entry (206-233).
6. `modules/brief/serveGate.ts`: drop `atelier2` from `TEMPLATE_AUDIENCE` (:116).
7. `skeletons/ids.ts`: `['atelier']`.
8. `lib/workCopyEngine.ts`: `WORK_COPY_ENGINE_TEMPLATES = ['atelier']`; refresh the docstring ("absorb at atelier-skeleton-cutover" — done).
9. `app/api/brief/confirm/route.ts`: remove the `applyWorkTemplateOverride` dev seam (25-45ish) — its sole purpose was routing dev journeys onto the `atelier2` pilot; the pilot id no longer exists.
10. `templates/atelier2/skin.ts`: `id: 'atelier'` (WorkSkinDef.id — grep confirmed no runtime consumer; keep honest anyway).
11. `blockMocks/index.ts` + `blockMocks/atelier2.ts`: drop the `atelier2` key; single `atelier` entry remains (file rename itself waits for phase 4's dir move).
12. Comment-only refreshes (no behavior change): `ToolbarShell.tsx:263-266`, `SectionToolbar.tsx:330-333` (Design ▾ / Background stay DISABLED — un-deferring them is explicitly out of scope), `ShowWorkStep.tsx:11-12`, `modules/wizard/generation/work.llm.ts` + `work.ts` comments, `lib/staticExport/workBehaviors.js` header, `skeletons/work/manifest.ts`, `skeletons/work/tokenContract.ts`, `skeletons/work/resolveWorkBlock.ts`, `modules/generation/README.md`, `modules/audience/work/README.md`.
13. Tests re-seeded onto `atelier`: `workCopyEngine.test.ts` (9-15), `serveGate.test.ts` — the `atelier2` ID sweep ONLY (:233, :253-255, :286-302 area; the :319-320 capability asserts were already updated in phase 1 — do NOT touch them again), `work.llm.test.ts` — the ALLOW-LIST assert ONLY (:362-363 → `['atelier']`; phase 1's DORMANCY refixture at ~:329-339 stays untouched), `templateMeta.test.ts` (10→9 ids, 9→8 non-retired, bespoke set → `['lumen']`), `tokenContract.test.ts` (119, 145), `kundiusPages.test.tsx` (39, 131, 136, 188), `renderParity.work.test.tsx` (12, 55, 94-100), `skinPurity.test.ts` (single `atelier` id → `atelier2/` dir until phase 4), `htmlGenerator.test.ts` (drop the atelier2 case; atelier case already asserts work.v1.js), `dispatch.test.ts` / `conformance.test.ts` leftovers, `serveMatrix.test.ts` if the union shrink bites, `oldContentFallback.test.tsx` only if it referenced the id.

### Files touched

- `src/types/service.ts`
- `src/modules/templates/registry.ts`
- `src/modules/templates/blockManifest.ts`
- `src/modules/templates/templateConformance.ts`
- `src/modules/templates/templateMeta.ts`
- `src/modules/brief/serveGate.ts`
- `src/modules/skeletons/ids.ts`
- `src/lib/workCopyEngine.ts`
- `src/app/api/brief/confirm/route.ts`
- `src/modules/templates/atelier2/skin.ts`
- `src/modules/templates/blockMocks/index.ts`
- `src/modules/templates/blockMocks/atelier2.ts`
- `src/app/edit/[token]/components/toolbars/ToolbarShell.tsx` (comment)
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx` (comment)
- `src/components/onboarding/journey/engines/work/ShowWorkStep.tsx` (comment)
- `src/modules/wizard/generation/work.llm.ts` (comment) · `src/modules/wizard/generation/work.ts` (comment)
- `src/lib/staticExport/workBehaviors.js` (comment)
- `src/modules/skeletons/work/manifest.ts` · `tokenContract.ts` · `resolveWorkBlock.ts` (comments)
- `src/modules/generation/README.md` · `src/modules/audience/work/README.md`
- Tests: `src/lib/workCopyEngine.test.ts`, `src/modules/brief/serveGate.test.ts` (atelier2 id sweep only — :319-320 already done in phase 1), `src/modules/wizard/generation/work.llm.test.ts` (allow-list :362-363 only — DORMANCY ~:329-339 already done in phase 1), `src/modules/brief/serveMatrix.test.ts` (if bitten), `src/modules/templates/templateMeta.test.ts`, `src/modules/skeletons/work/tokenContract.test.ts`, `src/modules/skeletons/work/__tests__/kundiusPages.test.tsx`, `src/modules/skeletons/work/renderParity.work.test.tsx`, `src/modules/skeletons/work/__tests__/oldContentFallback.test.tsx` (if bitten), `src/modules/templates/skinPurity.test.ts`, `src/lib/staticExport/htmlGenerator.test.ts`, `src/modules/templates/__tests__/dispatch.test.ts`, `src/modules/templates/conformance.test.ts`

### Verification

- `npx tsc --noEmit` green (union shrink surfaces any missed site).
- `npm run test:run` green.
- `grep -ri atelier2 src/` → ZERO hits (target; the phase-4 dir/file names are the only tolerated remainder until phase 4).
- `npm run lint` green.

---

## Phase 4 — Delete the old skin dir + fold the barrel into `templates/atelier/` **[HUMAN GATE: irreversible dir deletion — founder confirms disposition before this phase runs]**

### Steps

1. **Delete** `src/modules/templates/atelier/` — the entire old skin (blocks, tokens, palettes, sectionRules, ThemeInjector, resolveAtelierBlock, AtelierPlaceholderBlock, its remaining co-located tests `registration.test.ts` + `coreParity.test.ts`, README). (`renderParity.atelier.test.tsx` was already deleted in phase 1.) Recoverable via git history.
2. **`git mv src/modules/templates/atelier2` → `src/modules/templates/atelier`**; update every `@/modules/templates/atelier2` import path: `registry.ts` loader, `skinPurity.test.ts` (`./atelier2/skin` import + dir map → `atelier`→`atelier/`; drop the now-moot "old dir excluded" proof), `blockMocks` import.
3. Rename `blockMocks/atelier2.ts` → `blockMocks/atelier.ts`; update `blockMocks/index.ts` import.
4. **Cleanup dead old-skin vocabulary**: delete the 8 `Atelier*` layout entries from `src/modules/audience/service/elementSchema.ts` (645-850). Guard: grep `Atelier` first — the only expected remaining readers were the manifest (replaced, phase 1) and the deleted dir; if an unexpected live reader surfaces, LEAVE the entries and note it in the audit instead of widening scope.
5. `src/lib/staticExport/atelierSliderBehaviors.js` + `scripts/buildAssets.js` `slider.v1.js` entry: **KEEP both** (frozen asset for old published blobs); refresh header comments to say the source is legacy-frozen (old atelier skin retired).
6. Sanity: `CriticalFontPreload.tsx` `case 'atelier'` stays valid unchanged (skeleton skin uses the same faces/variant ids — Bricolage Grotesque `editorial` / Fraunces `compact`); comment refresh only if stale.

### Files touched

- `src/modules/templates/atelier/**` — DELETED (old skin; all remaining files incl. `registration.test.ts`, `coreParity.test.ts`; `renderParity.atelier.test.tsx` already gone since phase 1)
- `src/modules/templates/atelier2/index.ts` + `skin.ts` — MOVED to `src/modules/templates/atelier/`
- `src/modules/templates/registry.ts` (import path)
- `src/modules/templates/skinPurity.test.ts`
- `src/modules/templates/blockMocks/atelier2.ts` → `src/modules/templates/blockMocks/atelier.ts` (rename)
- `src/modules/templates/blockMocks/index.ts`
- `src/modules/audience/service/elementSchema.ts` (guarded cleanup)
- `src/lib/staticExport/atelierSliderBehaviors.js` (comment) · `scripts/buildAssets.js` (comment)
- `src/modules/templates/CriticalFontPreload.tsx` (comment only, if stale)

### Verification

- `npx tsc --noEmit`, `npm run test:run`, `npm run lint` green.
- `npm run build` green (dir move touches the registry chunk + publish path).
- Greps clean: `atelier2` → 0 hits in `src/` + `scripts/`; `resolveAtelierBlock` / `AtelierPlaceholderBlock` / `AtelierHero` etc. → 0 hits outside git history; `templates/atelier/` contains ONLY `index.ts` + `skin.ts` (skinPurity test now enforces this for the live id).

---

## Phase 5 — Final gates + merge readiness **[HUMAN GATE: founder go on the prod re-point (merge/deploy)]**

### Steps

1. Full local gate: `npx tsc --noEmit` · `npm run test:run` · `npm run build` · `npm run lint` — all green in one run.
2. Repeat the phase-2 publish smoke once on the final tree (create → edit → publish → `/p/<slug>`; work.v1.js present, parity holds). Quick fallback spot-check: point an editor at any stray old-shape project if the orchestrator's DB check found one (expected: neutral skeleton defaults/placeholders, no crash).
3. Confirm acceptance criteria checklist from the spec (all boxes).
4. Founder decides the deploy vehicle (rides the current unpushed bundle vs its own merge). Merge to main = human, plain merge, no squash; user pushes.

### Files touched

- none (verification only; `docs/task/atelier-skeleton-cutover.plan.md` progress log updated by the orchestrator)

### Verification

- The four gates green + publish smoke; founder GO recorded.

---

## Landmine checklist (carried through every phase)

- **Dual-renderer parity**: no block edits planned at all — the skeleton `.core.tsx` single-source keeps edit/published identical; the fallback + conformance tests assert BOTH modes, and the render-level `oldContentFallback` test exercises the published path through `renderToStaticMarkup` with flat-spread props (the real published-renderer prop shape).
- **Published/client boundary**: registry loader stays async dynamic-import; `skeletons/ids.ts` stays pure data in the static-export path; the barrel never re-exports client-only helpers.
- **build ≠ next build**: every phase touching `htmlGenerator`/assets verifies via full `npm run build`.
- **Immutable published assets**: `slider.v1.js` keeps building forever; only the NEW-publish embed gate is removed.
- **Firewall**: zero prompt-side changes; `promptFirewall.test.ts` must stay green untouched.
- **`fit.ts`**: intentionally zero code change (meta-derived; see Overview) — not an omission.
- **Exact-equality / premise capability readers**: the `templateMeta.atelier` capability edit ripples into `fit.test.ts:71`, `serveGate.test.ts:319-320` (exact `toEqual`) AND `work.llm.test.ts:329-339` (dormancy premise `not.toContain('works')` + behavioral inversion) — ALL updated in phase 1 WITH the meta change, never later. Reviewer's exhaustive sweep: this class is now CLOSED.

## Unresolved questions

1. `quote`→`proof` archetype swap OK? (skeleton has no `quote` block; alt = add quote alias to skeleton registry = new-capability creep, recommend no.)
2. Delete `applyWorkTemplateOverride` dev seam entirely, or keep as generic work-template override for future skin pilots (Kontur/Pulse)?
3. `serviceElementSchema` Atelier* entries: delete (phase 4, guarded) or leave as dead data?
4. Atelier picker description reword in `service.ts` — any founder-preferred wording, or take skeleton phrasing?
5. Deploy vehicle: ride unpushed big-bang bundle or own merge? (decide at phase 5 gate.)
