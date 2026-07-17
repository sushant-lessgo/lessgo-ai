# work-onboarding-ingestion — Phase 1 audit (binding spine + gallery covers)

Branch: `feature/work-onboarding-ingestion` (verified before any edit).
Scope: Phase 1 ONLY — photos in `facts.work.groups[].photos` flow through the
fan-out into persisted `finalContent` (covers stamped on home gallery groups,
`/works/<slug>` item pages carrying VERBATIM photos) and render on the skeleton
reveal surface.

## Files changed

Modified:
- `src/modules/brief/collections.ts`
- `src/modules/brief/collections.test.ts`
- `src/hooks/editStore/archetypes.ts`
- `src/modules/generation/multiPageAssembly.ts`
- `src/modules/generation/multiPageAssembly.test.ts`
- `src/modules/wizard/generation/work.llm.ts`
- `src/modules/wizard/generation/work.llm.test.ts`
- `e2e/helpers/seedWorkBrief.ts`

Created:
- `src/modules/generation/workCollections.ts`
- `src/modules/generation/workCollections.test.ts`
- `e2e/work-binding.spec.ts`
- `docs/task/work-onboarding-ingestion.audit.md` (this file)

Not touched (pageActions.test.ts): the plan listed it "only if slice-shape
assertions are impacted." `buildCollectionCatalogSlice`/`buildCollectionItemSlice`
have only ONE caller (`multiPageAssembly.ts`) and pageActions.test.ts references
neither the builders nor `photos`/`CollectionEntry`, so it was not edited.

## Per-file changes + D-decisions implemented

### src/modules/brief/collections.ts (D6)
- New `CollectionEntryPhoto` type (`{id?; url; alt?; cover?}`) and optional
  `photos?: CollectionEntryPhoto[]` on `CollectionEntry`.
- New private `toPhotos()` normalizer (drops non-objects + url-less refs).
- Carried photos through `toEntry` (reader), `makeCollectionEntry`, and
  `setCollections` (writer round-trip). `url` is required (a photo with no url
  can't render or cover) — url-less refs are dropped everywhere.

### src/modules/generation/workCollections.ts (NEW — D5, D7a, D11)
Pure module (firewall: only slugify + type imports; no store/template/react).
- `deriveWorksEntries(facts)` — flat `facts.groups[]` → `CollectionEntry[]`
  (name, code-derived slug, photos url-normalized and clamped to 24 per group;
  the second `items` level is carry-only per spec, not expanded). Empty/null ⇒ [].
- `stampWorkGalleryBinding(fc, entries)` — for every `work`-section group card in
  every content tree (flat home + each page + chrome), joins by NAME→slugify(name)
  (never index — facts law), sets `cover_image` (cover:true photo, else first,
  else left as-is) and sets `href = /works/<slug>` ONLY when the item page
  `page-<slug>` exists in `fc.pages` (D7a guard — makes the engine-wide gallery
  safe on non-flipped templates). No entries ⇒ no-op.
- Exported `WORKS_PHOTOS_PER_GROUP_CAP = 24`.

### src/hooks/editStore/archetypes.ts (D6, D13)
- `buildCollectionItemSlice`: WORKS branch seeds the `workdetailContract` shape
  (`name`, `client:''`, `problem:''`, `result:''`, `photos:[{id,url,alt,cover}]`)
  instead of the generic `images` slot (which does NOT match the frozen work
  contract). Photos seeded VERBATIM from the entry.
- `buildCollectionCatalogSlice(collectionKey, entries=[])`: additive 2nd param;
  the WORKS branch seeds catalog `items` from entries (name + cover + href →
  `/works/<slug>`). Non-works keys ignore the arg (byte-identical). Added a small
  `worksEntryCover()` helper (same cover precedence as the stamper).

### src/modules/generation/multiPageAssembly.ts (D6)
- `photos` added to `VERBATIM_ITEM_FIELDS` so AI connective copy can never
  clobber the user's uploaded photo list on a `workdetail` item page.
- `assembleCollectionPages` now passes `entries` to `buildCollectionCatalogSlice`
  (works catalog items seeding). No other spine change.

### src/modules/wizard/generation/work.llm.ts (plan step 5)
- New exported `runWorksFanOut(fc, input, declaredCapabilities, persist)`:
  derives entries (resume: re-derive from persisted
  `onboardingData.collections.works`), persists them into
  `fc.onboardingData.collections`, calls `runCollectionFanOut` with LLM-FREE
  `generateItemCopy: async () => ({status:'done', copy:{}})`, then
  `stampWorkGalleryBinding`. **Empty-entries fast path returns immediately
  WITHOUT touching `fc`** (byte-identical for the no-photos prod reality).
- Wired into `runFanOut` after the sitemap page loop, before
  `finalizeMultiPageGeneration`. Driver passes
  `templateMeta[resolvedTemplateId]?.capabilities ?? []`. `works` is undeclared
  on every P1 template ⇒ the fan-out no-ops (no `/works` pages) in prod.

### e2e/helpers/seedWorkBrief.ts (plan step 7)
- Photo-bearing fixtures (`WORK_COVER_URLS`, `WORK_GROUPS_WITH_PHOTOS`) and
  `seedBoundAtelier2Preview(api)` — seeds a served work project then hand-seeds a
  pre-bound atelier2 single-page finalContent (covers stamped + `/works` item
  pages carrying photos) via `/api/saveDraft`, flipping the persisted templateId
  to `atelier2`.

## Test mechanisms (plan step 6 — pre-flip honesty; `works` undeclared ⇒ real
driver no-ops, so vitest drives fixture caps `['works']` directly)

- **collections.test.ts** — photos carry-through: reader normalizes + drops
  url-less; make/set round-trips photos verbatim.
- **workCollections.test.ts** (pure unit) — cover-pick precedence (cover:true
  else first), name→slug join survives AI-polished framing + reversed order,
  no-photos leaves cover as-is, no-entries no-op, **href NOT stamped when the
  item page is absent (D7a)**; deriveWorksEntries clamp-24 + url-less drop + slug.
- **multiPageAssembly.test.ts** — fixture caps `['works']`: catalog + item pages
  built, item page carries VERBATIM photos in the `workdetail` shape, catalog
  `items` seeded (name/cover/href), and the VERBATIM clamp blocks AI overwrite of
  `photos`/`name`.
- **work.llm.test.ts** — drives `runWorksFanOut` directly: WIRING (fixture caps
  ⇒ `/works` pages built + covers/href stamped + entries persisted), DORMANCY
  (real atelier caps ⇒ NO `/works` pages; cover stamping is capability-independent
  per D7a, href left as-is), BYTE-IDENTICAL (no photos ⇒ fc untouched, persist
  never called).
- **e2e/work-binding.spec.ts** — hand-seeded atelier2 finalContent → `/preview`
  reveal → assert seeded cover URLs render as gallery `<img>` covers. (See caveat.)

## Deviations from the plan

1. **Empty-entries fast path in `runWorksFanOut`.** The plan says "prod path
   byte-identical (fan-out no-ops)"; but writing `onboardingData.collections` and
   stamping covers is NOT byte-identical when entries exist. Per D7a/step-5
   ("cover stamping is capability-independent, entries only exist when facts carry
   photos"), the honest reading is: dormancy = no photos seeded (the P1 prod
   reality, since there is no upload UI yet). So the empty-entries case returns
   before touching `fc` (true byte-identical), while a photo-bearing run under
   real caps still stamps covers (intended, a visual no-op on non-flipped
   templates) but creates no `/works` pages. Tests encode exactly this split. This
   is a conservative in-scope judgment call, logged here.

2. **e2e not registered / not executed (out-of-scope file — REPORTED, not
   edited).** `playwright.config.ts` uses an explicit allowlist
   (`authed.testMatch`); a new spec only runs if listed there. `playwright.config.ts`
   is NOT in Phase-1's Files-touched, so per the hard rules I did not edit it —
   this needs an orchestrator/plan decision (one-line addition:
   `/work-binding\.spec\.ts/` to the `authed` project). The spec + helper are
   authored and bundle cleanly (esbuild syntax + import check passes). Even once
   registered, the authed spec needs the dev server + Clerk session (`auth.setup`),
   which is not bootable in this worktree session — so it is INFRA/SCOPE-blocked
   here regardless. **Action for the orchestrator:** register the spec in
   `playwright.config.ts` `authed.testMatch` and run it against `npm run dev`.

## Verification gate results (run in WORKDIR)

1. `npx tsc --noEmit` — CLEAN for all touched files. The ONLY error is a
   pre-existing, unrelated `TS2307: Cannot find module '@/assets/images/founder.jpg'`
   in `src/app/page.tsx` (not in my Files-touched; a stale `next-env.d.ts` /
   asset-declaration artifact). Confirmed benign: `next build` regenerates
   `next-env.d.ts` and compiles the same file with zero errors.
2. `npm run test:run` — **3802 passed | 18 skipped** (222 files). No new failures;
   the 18 skips are pre-existing. Affected suites: collections / workCollections /
   multiPageAssembly / work.llm / pageActions all green (89 tests in that subset).
3. `npm run build` — SUCCEEDED (full route table emitted).
4. `npm run test:e2e -- work-binding` — NOT executed: the spec is not in
   `playwright.config.ts`'s allowlist (out-of-scope file, see deviation 2), and
   the authed harness needs a dev server + Clerk session not available here.
   Files authored + syntax/import-verified via esbuild. Infra/scope caveat.

## What the impl-reviewer should scrutinize

- `runWorksFanOut` empty-entries fast path (deviation 1) — confirm it preserves
  the existing `runWorkLLMGeneration` behavior for no-photo briefs (the existing
  work.llm.test.ts fan-out tests still pass unchanged, which is the evidence).
- `stampWorkGalleryBinding` group detection: it matches sections whose
  `elements.groups` is an array (the work gallery is the only `groups` consumer in
  the work engine; `packages` uses `packages`). Confirm no false-positive tree.
- D7a href guard correctness: href keyed on `page-<slug>` existence — same key
  `assembleCollectionPages` uses for item pages (`page-${entry.slug}`).
- The e2e's hand-built atelier2 finalContent shape (`seedWorkBrief.ts`) mirrors
  the multipage assembler output; if the store loader/renderer needs a fuller
  shape, the spec may need adjustment when it is registered + run in phase 2.

---
## Orchestrator record — Phase 1 CLOSED

**impl-review verdict: SHIP** (loop 1, no blocking). Re-verified by reviewer: tsc clean, `test:run` 3802 passed / 18 skipped, zero new failures, zero AI/credit/schema touch, prod path structurally byte-identical (fan-out only reachable behind `NEXT_PUBLIC_WORK_COPY_ENGINE` + `atelier`, never prod-default).

Non-blocking carried forward:
1. Byte-identical fast-path (`work.llm.ts` `entries.length===0` return) covers the no-GROUPS case; a grouped-but-photoless dev brief instead writes benign `fc.onboardingData.collections.works` + runs a no-op stamp. Harmless + not prod-reachable. The `work.llm.test.ts:341` fixture label conflates "no groups" with "no photos" — cosmetic; the fast-path test is valid for what it covers.
2. **`e2e/work-binding.spec.ts` is NOT registered in `playwright.config.ts`** (out of Phase-1 scope). → DEFERRED to Phase 2: add `playwright.config.ts` to P2 Files-touched and register `/work-binding\.spec\.ts/` on the `authed` project, since P2 extends that spec through the real (post-flip) fan-out path and is where it must first execute.

---

# work-onboarding-ingestion — Phase 2 audit (WorkDetail + WorkCatalog blocks · conformance relax · atelier2 works flip + pilot enablement)

Branch: `feature/work-onboarding-ingestion` (verified before any edit).
Scope: Phase 2 ONLY — the two new render surfaces (`.core` single-source pattern),
the D14 conformance relax, the atelier2 `works` flip, and pilot enablement
(allow-list + env-gated confirm override). Built ON Phase 1 (commit 8cf890ab).

## Files changed

Created:
- `src/modules/skeletons/work/blocks/WorkDetail/WorkDetail.core.tsx`
- `src/modules/skeletons/work/blocks/WorkDetail/WorkDetail.tsx`
- `src/modules/skeletons/work/blocks/WorkDetail/WorkDetail.published.tsx`
- `src/modules/skeletons/work/blocks/WorkDetail/styles.ts`
- `src/modules/skeletons/work/blocks/Catalog/WorkCatalog.core.tsx`
- `src/modules/skeletons/work/blocks/Catalog/WorkCatalog.tsx`
- `src/modules/skeletons/work/blocks/Catalog/WorkCatalog.published.tsx`
- `src/modules/skeletons/work/blocks/Catalog/styles.ts`
- `src/modules/skeletons/work/workDetailPhotos.test.tsx`

Modified:
- `src/modules/skeletons/work/resolveWorkBlock.ts` (register workcatalog + workdetail)
- `src/modules/skeletons/work/manifest.ts` (clarifying note — NO entries; see Deviations)
- `src/modules/skeletons/work/sectionRules.ts` (surface map: workcatalog/workdetail -> paper)
- `src/modules/skeletons/work/coreParity.test.ts` (count 17->19 + 2 core render fixtures)
- `src/modules/skeletons/work/renderParity.work.test.tsx` (NON_VISIBLE_KEY += url/cover)
- `src/modules/engines/workSections.ts` (ADDITIVE workcatalog contract — freeze untouched)
- `src/modules/templates/blockMocks/atelier2.ts` (NOTE only — mocks NOT enrolled; see Blockers)
- `src/modules/templates/templateMeta.ts` (atelier2 works flip)
- `src/modules/templates/templateConformance.ts` (D14 option-b relax of the (d) assert)
- `src/modules/templates/conformance.test.ts` (dormancy->cross-template net + atelier2 + 2 negative fixtures)
- `src/lib/workCopyEngine.ts` (allow-list += atelier2)
- `src/lib/workCopyEngine.test.ts` (allow-list assertion)
- `src/modules/wizard/generation/work.llm.test.ts` (allow-list assertion :363)
- `src/app/api/brief/confirm/route.ts` (env-gated WORK_JOURNEY_TEMPLATE_OVERRIDE)
- `e2e/work-onboarding.spec.ts` (real-fan-out atelier2 test)
- `e2e/work-binding.spec.ts` (href-binding assertion)
- `e2e/helpers/seedWorkBrief.ts` (seedRealFanoutAtelier2 + workSlugs)
- `playwright.config.ts` (register work-binding on the authed project)

## Per-file changes + D-decisions

### The two block pairs (single-source .core pattern — DUAL-RENDERER gate)
- WorkDetail (workdetailContract): title (name) + optional client/problem/result
  meta strip (carry-only, gated by hasStrip) + a FLAT photo grid from the photos
  collection (element keys photos.<id>.url, COVER photo rendered FIRST via a pure
  stable coverFirst). Photos ARE a flat list here — the group-references-only
  invariant is the GALLERY's (galleryGroups.test, untouched/green); the NEW
  workDetailPhotos.test.tsx mirrors its style but asserts the photo-grid shape
  (each url -> one <img>, cover-first ordering, one cell per photo, meta present).
- WorkCatalog (workcatalog catalog slice): eyebrow/headline/lede head + a covers
  grid from items (name + cover + link -> /works/<slug>). Field names mirror the
  generic catalog slice (headline/lede, items.name/cover/href).
- Both follow the Gallery/About wrap pattern EXACTLY: .core.tsx = plain server-safe
  module rendering through injected E; .tsx = 'use client' thin wrap (useWorkBlock
  -> useWorkEditCtx -> editPrimitives); .published.tsx = flat props ->
  makePublishedPrimitives -> core. No hook/'use client' import in any .core. Styles
  reuse existing --wk-*/--u-* tokens only (WorkCatalog reuses the Gallery's
  RULE_HEAD + GALLERY_CAPTION grammars from a PLAIN styles module — no client import).

### workSections.ts (ADDITIVE, freeze untouched)
- New workcatalogContract (sectionType = COLLECTIONS.works.catalogSectionType) +
  registered as workElementContract.workcatalog. ADDITIVE — NOT a member of
  workMustSections/workOptionalSections (the freeze), so workContract.test (which
  walks the section-key lists) stays green with the extra map key.

### templateConformance.ts — D14 OPTION (b), NO type widening
- assertCollectionCapabilityBacked: KEPT the catalog-section toContain (the one
  value the single-string map carries), DROPPED the item-section toContain, and
  continues to resolvesReal BOTH def.catalogSectionType AND def.itemSectionType
  (registry-derived — the closed-fail spine). TemplateMeta.capabilitySections type
  UNCHANGED (Partial<Record<CapabilityId, string>>). fit.ts / sectionSelection.ts /
  sectionGrammar.ts / templateMeta.test.ts UNTOUCHED. The (b) walker (:275-287) and
  (b+) walker (:292-305) read-verified + test-verified green with the single-string
  works: 'workcatalog' entry (not vacuous, no absent-value read).

### conformance.test.ts
- The old vacuous DORMANCY lock (asserting no template declares a family cap) is
  replaced by a CROSS-TEMPLATE NET: assertCollectionCapabilityBacked runs for EVERY
  templateId (templates declaring no family cap continue -> vacuously green; atelier2
  exercises it for real). PLUS an explicit atelier2 pair assertion, PLUS a scoped
  regression lock (no template OTHER than atelier2 declares a family cap). The global
  net is preserved — a new family declaration on ANY template must supply a resolving
  pair. Two NEW negative fixtures both toThrow: (1) works on atelier2 WITHOUT a
  workcatalog value -> relaxed coverage half bites; (2) works on meridian (no work
  blocks) -> resolve half bites.

### templateMeta.ts — the flip
- atelier2.capabilities += 'works', capabilitySections.works = 'workcatalog'
  (single string). atelier UNTOUCHED. atelier2 stays bespoke:true (off shortlists).

### Pilot enablement
- WORK_COPY_ENGINE_TEMPLATES = ['atelier','atelier2'] (comment: atelier2 = E2 skeleton
  pilot; absorb at atelier-skeleton-cutover). Two allow-list test assertions updated.
- confirm/route.ts: applyWorkTemplateOverride — if WORK_JOURNEY_TEMPLATE_OVERRIDE is
  a valid templateId AND the gate resolved to atelier, persist the override; unset in
  prod => byte-identical (D7b). Validates via @/types/service templateIds (pure const
  list — firewall-safe; header comment updated to note this).

## Deviations

1. Manifest entries NOT added for workcatalog/workdetail (in-scope judgment). Plan
   step 3 says "manifest entries with honest consumes subset-of contract scalars." But
   adding a block-manifest entry triggers conformance's consumes-subset-of
   contractFor(layoutName) walk, and contractFor('WorkCatalog'/'WorkDetail') resolves
   via serviceElementSchema <- workLayoutElementSchema
   (src/modules/audience/work/elementSchema.ts) — a file NOT in Phase-2's
   Files-touched. Collection catalog/detail sections are ALSO absent from every other
   template's block manifest (they are fan-out machinery resolved by SECTION TYPE, not
   arrangement variants). So I registered the pair ONLY in resolveWorkBlock (the
   registry) — which is all the conformance (b)/(b+)/(d) capability walks need
   (resolvesReal, section-type dispatch) — and documented the omission in manifest.ts.
   Conservative option chosen to avoid the out-of-scope edit; logged here.

2. renderParity/dev-gallery mocks NOT enrolled for the two new sections — see
   Blockers (same root cause as Deviation 1). Their EDIT render is blocked without the
   schema registration, so enrolling them would only add a RED renderParity case for a
   known out-of-scope gap. Their .core render is instead guarded by coreParity (both
   pairs added to the fixtures list + the 17->19 count) and workDetailPhotos.

3. e2e authored but NOT executed here (infra-gated, consistent with Phase 1) — the
   authed harness needs a dev server + Clerk auth.setup. Specs parse + register
   cleanly (playwright --list shows work-binding under authed + the new
   work-onboarding real-fan-out test). Must be run against npm run dev.

## BLOCKERS (out-of-scope file needed — REPORTED, not edited)

src/modules/audience/work/elementSchema.ts needs a 2-line WORK_LAYOUT_TO_SECTION
addition (WorkCatalog -> 'workcatalog', WorkDetail -> 'workdetail') — NOT in Phase-2's
Files-touched.

Root cause: the EDIT renderer (and the preview render of the /works detail page)
resolves a block's content via useTemplateBlock -> getSchemaDefaults(layout) ->
layoutElementSchema[layout], which spreads serviceElementSchema <-
workLayoutElementSchema. Without the two layouts registered there, getSchemaDefaults
returns null and the edit/preview render comes back EMPTY (the published render,
flat-props, is fine). This blocks:
  - renderParity coverage of the two new EDIT wrappers (the founder dual-renderer gate);
  - the actual in-editor / in-preview render of /works/<slug> detail-page CONTENT on
    an atelier2 project.
It does NOT block: the fan-out DATA (item pages + verbatim photos — pure code), the
schema-backed HOME gallery covers/hrefs, or any conformance/build/tsc gate. The
additive workcatalog contract (workSections.ts) is already in place, so the
workLayoutElementSchema derivation would resolve cleanly (workdetail already exists,
workcatalog now does too). RECOMMENDATION: add elementSchema.ts to Files-touched, make
the 2-line edit, then re-enroll the two atelier2 mocks (reverting the NOTE in
atelier2.ts) so renderParity + the /dev/blocks/atelier2 eyeball cover both pairs.

## Verification (run in WORKDIR)

1. npx tsc --noEmit — CLEAN (the pre-existing founder.jpg TS2307 did not surface).
2. npm run test:run — 3816 passed | 18 skipped (223 files), zero new failures.
   Conformance (b)/(b+)/(d) + both new works negative fixtures EXERCISED + green;
   frozen galleryGroups.test.tsx green + untouched; coreParity (19 cores, both new
   pairs rendered) + workDetailPhotos green.
3. npm run build — SUCCEEDED (exit 0, full route table emitted).
4. e2e — specs parse + register (playwright --list shows both). Execution attempted;
   infra-gated (dev server + Clerk auth not bootable in this worktree session — see
   Deviation 3). No genuine assertion failure observed.

## What the impl-reviewer should scrutinize

- The BLOCKER above is the load-bearing item — decide whether to authorize the
  elementSchema.ts 2-line edit + mock re-enrollment (restores the founder parity gate)
  or defer it as a Phase 2.5. The two block PAIRS themselves are byte-pattern-identical
  to the green Gallery/About wraps.
- D14 relax: confirm the DROPPED item toContain is fully compensated by
  resolvesReal(def.itemSectionType) — the two negative fixtures prove both halves bite.
- The dormancy->cross-template-net rewrite: confirm the global guarantee is preserved
  (every template with a family cap runs the assert; atelier2 real, rest vacuous) and
  the scoped regression lock doesn't over-fit atelier2.
- confirm-route override: unset-in-prod byte-identical (D7b); the templateIds import
  is pure data (firewall-safe).

---

## Phase 2 — BLOCKER RESOLVED (orchestrator authorized the scope addition)

The orchestrator authorized adding ONE file — `src/modules/audience/work/elementSchema.ts`
— to Phase-2 scope to complete the correctness gap. Done:

- **elementSchema.ts (+2 lines):** `WORK_LAYOUT_TO_SECTION` gains `workcatalog: 'workcatalog'`
  and `workdetail: 'workdetail'`. Keyed LOWERCASE (not PascalCase like the section-picker
  arrangements) BECAUSE the collections fan-out stores the layout as the lowercase SECTION
  TYPE (`buildCollection{Catalog,Item}Slice` → `catType`/`itType`; no `works` entry in
  `COLLECTION_BLOCK_LAYOUTS`). This makes both layouts resolvable via
  `getSchemaDefaults(layout)` → `workLayoutElementSchema` → `serviceElementSchema` →
  `layoutElementSchema`, so the EDIT/preview renderer now populates their content (the
  additive `workcatalog` contract from workSections.ts + the existing `workdetail` contract
  supply the schema; the derivation throws if either were missing — both present).

- **atelier2.ts re-enrollment:** reverted the BLOCKED note; the `workcatalog` + `workdetail`
  sections are now real renderParity/dev-gallery mocks with POPULATED copy (workcatalog:
  eyebrow/headline/lede + 3 items with names + hrefs; workdetail: name/client/problem/result
  + a 3-photo grid, image slots empty per the image-led convention). renderParity.work.test.tsx
  needed no further change (the earlier NON_VISIBLE_KEY += url/cover already covers the media
  fields).

**HOW edit↔published parity is now PROVEN for both blocks:** `renderParity.work.test.tsx`
walks `BLOCK_MOCKS.atelier2`, MOUNTS each block's `.tsx` (edit, store-backed, effects run via
createRoot+act) AND its `.published.tsx` (flat props) on the SAME populated mock content, then
asserts symmetric visibility of every fixture copy field. Both `atelier2 'workcatalog'` and
`atelier2 'workdetail'` cases run GREEN (verified via `--reporter=verbose`): "no field renders
in one mode but not the other", "CTA/link href parity" (workcatalog covers link to
`/works/<slug>` in published + expose `wk-link-edit` in edit), and "most fixture fields
actually render" — i.e. the edit band and published band render the SAME `Full brand package`
/ `Every project` / client / problem / result copy. Plus coreParity (server-render purity, 19
cores incl. both new pairs) + workDetailPhotos (published flat-photo grid, cover-first).

### Re-verification (FULL gate)
1. `npx tsc --noEmit` — CLEAN (no founder.jpg error this run).
2. `npm run test:run` — **3824 passed | 18 skipped** (223 files), 0 failures (+8 vs the
   pre-fix 3816 = the re-enrolled workcatalog/workdetail parity cases, EXERCISED not skipped).
   Conformance (b)/(b+)/(d) + both `works` negative fixtures green; frozen galleryGroups green.
3. `npm run build` — SUCCEEDED (exit 0).
4. e2e — unchanged from Phase 2 (specs parse + registered; execution infra-gated).

Files changed in this completion: `src/modules/audience/work/elementSchema.ts` (NEW to scope),
`src/modules/templates/blockMocks/atelier2.ts` (re-enrolled). Everything else from the Phase 2
section stays as-is.

---
## Orchestrator record — Phase 2 impl-review

**impl-review verdict: SHIP** (loop 1, no blocking). Independently verified: dual-renderer parity net is real (both pairs enrolled, mounts edit+published on populated content, red-on-divergence, guarded vs green-on-empty); D14 closed-fail genuine (registry-derived resolver check bites a placeholder workdetail; both negative fixtures throw); cross-template conformance net preserved (loops all templateIds, only atelier2's regression lock scoped); prod byte-identical (override env-gated+unset, atelier2 bespoke/off-shortlist); frozen contracts respected (galleryGroups untouched, workSections additive); zero AI/schema touch. Gates: tsc exit 0, test:run 3824 passed / 18 skipped / 0 failures.

Non-blocking: e2e infra-gated (registered, not executable in-worktree); `NON_VISIBLE_KEY` bare-`url` regex is broad (cosmetic, future risk only).

**HELD at FOUNDER PARITY GATE** (spec candidate gate + plan P2 gate) before commit + Phase 3. Awaiting founder eyeball of WorkDetail + WorkCatalog edit↔published parity in the dev gallery.

---

# work-onboarding-ingestion — Phase 3 audit (upload spine + functional STEP 02 behind the widened seam)

Branch: `feature/work-onboarding-ingestion` (verified before any edit).
Scope: Phase 3 ONLY — real folder/multi-file upload through the one pipeline,
EXIF capture-date read (client-side, pre-upload), grouping proposal (capped per
D11), committed into `facts.work.groups[].photos` via the D10 funnel, behind the
D9-widened seam. Built ON Phases 1 (8cf890ab) + 2 (a91b9272).

## Files changed

Created:
- `src/lib/media/uploadClient.ts`
- `src/lib/media/uploadClient.test.ts`
- `src/modules/wizard/work/ingest/readCaptureDates.ts`
- `src/modules/wizard/work/ingest/proposeGroups.ts`
- `src/modules/wizard/work/ingest/proposeGroups.test.ts`
- `src/components/onboarding/journey/engines/work/ShowWorkStep.tsx`
- `scripts/makeExifFixtures.mjs`
- `e2e/fixtures/images/exif-day1-a.jpg`, `exif-day1-b.jpg`, `exif-day2-a.jpg`, `exif-day2-b.jpg`, `no-exif.png` (binaries)

Modified:
- `package.json` / `package-lock.json` (add `exifr@^7.1.3`)
- `src/components/onboarding/journey/engines/types.ts` (D9 shared-altitude widening)
- `src/components/onboarding/journey/engines/work.ts` (supply `loadStep`)
- `src/components/onboarding/journey/engines/work.test.ts` (seam-widen + commit-path)
- `src/components/onboarding/journey/steps/StepShowWork.tsx` (agnostic lazy frame)
- `e2e/work-onboarding.spec.ts` (EXIF-cluster test + `show-work-dropzone`→`show-work-pick-files`)

NOT touched: `src/modules/wizard/work/rail.ts`. `normalizeWorkGroup` ALREADY
preserves `photos` verbatim (rail.ts:246) — verified by a new test in
`proposeGroups.test.ts` ("normalizeWorkGroup — photos preservation"). No fix
needed, so the file was left untouched per the plan's "ONLY if it needs a fix".

## Shared-altitude seam decision (D9 — for E3 reuse confirmation)

Introduced a NEW shared type `JourneyStepConfig` in `engines/types.ts`:
`{ title; body; icon; loadStep?: () => Promise<{ default: ComponentType<JourneyStepProps> }> }`.
`steps.showWork` now points at it (was an inline `{title;body;icon}`).
`showWork`/`questions`/`plan` did NOT share a config type before (questions is a
function, plan an object), so per the plan I introduced the shared extensible
shape rather than bolting `loadStep` onto `showWork` alone. **E3 reuses this by
typing its STEP-03 question step-config as `JourneyStepConfig` (or a widening of
it) — the `loadStep` field is defined ONCE, here, and must NOT be re-widened.**
`JourneyStepProps` already existed in `JourneyShell.tsx`; `types.ts` references
it via a type-only import (erased — firewall header's "TYPES ONLY" rule holds).
The loader is a DYNAMIC `import('./work/ShowWorkStep')` invoked at RENDER time by
the frame; `journeyAgnostic.test.ts` stays green (no static generation/engine
edge on the pre-confirm seam path — the engine body lives under `engines/work/`,
which is NOT in `SEAM_FILES` or `SEAM_CLOSURE`).

## Per-file notes + D-decisions

- **uploadClient.ts (D3):** `uploadImageFiles(files, tokenId, {concurrency~3, onProgress, signal})`
  — per-file POST `/api/upload-image`, bounded concurrency, INPUT-ORDER-preserving,
  never throws (per-file failures isolated). Returns `{file,url,assetId?,blurDataUrl?}[]`.
  NO route edit (route already returns `metadata.assetId` + `blurDataUrl`).
  `bulkUploadImages` left untouched.
- **readCaptureDates.ts (D4):** `exifr.parse(file, { pick: ['DateTimeOriginal'] })`
  → `Date|null`, read from ORIGINAL File bytes pre-upload. `pick` = the
  DateTimeOriginal-only tree-shake. Never throws (null on any failure).
- **proposeGroups.ts (D11):** PURE. Trust order folder-paths → same-day EXIF
  clusters (LOCAL date components — timezone-stable) → single "Gallery" fallback.
  Per-group cap 24 / total 150, deterministic drop (earliest capture date, then
  file order), `{kept,dropped}` per group + totals. `mergeProposalIntoGroups`:
  case-insensitive name match ATTACHES to an existing group (preserving
  kind/price/prior photos, cover untouched); unmatched APPENDS a new group via
  `normalizeWorkGroup` seed defaults (never kind-less); url-less photos dropped;
  new-group first photo marked cover.
- **ShowWorkStep.tsx (D10, D11 belt, D4, D7a):** `'use client'`, engine-owned.
  Folder input (`webkitdirectory` set imperatively — typed attrs reject it) +
  loose-file input. EXIF read → `uploadImageFiles` → `proposeGroups` →
  `mergeProposalIntoGroups` → **D11 belt clamp** (`clampGroupsToCap` + console.warn
  if any outgoing group > 24) → **D10 funnel** `applyRailEdit({field:'groups'})`
  → `commitRail`. Reads live facts/token via `useWizardStore.getState()` fresh at
  commit time. Progressive rail chips are a consequence of `commitRail`. Skip +
  proposal-summary + continue shown; NO correction board (Phase 4).
- **types.ts / work.ts / StepShowWork.tsx:** the D9 wiring described above.

## Deviations

1. **`e2e/work-onboarding.spec.ts` line 190 stale `show-work-dropzone`.** The work
   engine now renders the functional body (not the stub), so `show-work-dropzone`
   no longer exists on a work journey. Updated that one assertion to
   `show-work-pick-files` (in-scope file). Conservative, minimal.
2. **No dedicated `readCaptureDates.test.ts`** (not in Files-touched). Its EXIF
   path is exercised end-to-end by the e2e (real fixtures, real exifr in-browser).

## Verification (run in WORKDIR)

1. `npx tsc --noEmit` — CLEAN (no founder.jpg error this run).
2. `npm run test:run` — **3852 passed | 18 skipped** (225 files), 0 failures
   (+28 vs Phase-2's 3824). `journeyAgnostic.test.ts` GREEN (shell purity intact —
   the widening added no static engine/generation edge). proposeGroups (19),
   uploadClient (7), work.test.ts seam-widen + commit path all GREEN.
3. `npm run build` — SUCCEEDED (exit 0, full route table).
4. `npm run test:e2e` — **RAN + PASSED this session** (dev server + Clerk booted):
   - `work-onboarding.spec.ts:282` (NEW EXIF same-day clustering: real upload →
     exifr → 2 clusters → rail chips g2/g3 → persist across reload) — PASS (28.8s).
   - `work-onboarding.spec.ts:190` (edited walk 02→04 with `show-work-pick-files`) — PASS.
   Folder→group remains Vitest-only (Playwright can't fabricate `webkitRelativePath`).

## What the impl-reviewer should scrutinize

- **Shell purity / firewall:** confirm `engines/work/ShowWorkStep.tsx` is outside
  `SEAM_FILES`/`SEAM_CLOSURE` and that `loadStep` is dynamic — exifr/upload never
  reach the pre-confirm entry bundle. `journeyAgnostic` green is the evidence.
- **EXIF/timezone clustering edges:** `dayKey` uses LOCAL date components (matches
  how exifr revives the tz-less EXIF datetime) so 23:59 vs 00:01-next-day split and
  same-day stays together on any runner — see proposeGroups.test midnight cases.
- **D11 belt vs proposeGroups cap:** proposeGroups caps its own contribution (24),
  but a merge into an already-photo-bearing existing group can overshoot — the
  belt clamp at the commit point catches exactly that (clamp + warn, never throw).
- **D10 funnel only:** photos ride `applyRailEdit({field:'groups'})` → `commitRail`,
  never the seam's `applyEdit`/`RailEditValue` (unwidened).

---
## Orchestrator record — Phase 3 impl-review

**impl-review verdict: SHIP** (loop 1, no blocking). Verified: shell-purity firewall HOLDS (ShowWorkStep in subdir+.tsx outside SEAM_FILES; `loadStep` dynamic import not matched by static-import regex; types.ts imports are `import type` → no bundle edge; journeyAgnostic green). EXIF clustering CORRECT (pre-upload read; local dayKey matches exifr tz-less revive; 23:59/00:01 → 2 groups locked). D9 shape generic/shared (JourneyStepConfig). D10 funnel unwidened. D11 per-group belt runs pre-commit. Zero AI/schema/credit touch, only exifr added. Gates: tsc clean, test:run 3852 passed / 0 new failures (scoped suites 78 passed, exercised).

Non-blocking → CARRY INTO PHASE 4:
1. Total-150 cap only enforced on proposeGroups' own contribution, not at the belt — a cross-group merge could cumulatively exceed 150. Practically bounded (entry-seeded groups start photoless). → P4: extend `clampGroupsToCap` to also enforce the 150 total at the commit point (P4 touches the merge verb which re-caps anyway).
2. No dedup on re-ingest (bounded per-group by the 24 belt); proposal summary shows latest batch while facts accumulate — rail chips stay correct. P4 correction board (hide/merge) mitigates.
3. `readCaptureDates.ts` has no dedicated unit test (e2e-covered only). → P4: add a 2-case unit test (dated JPEG → Date, PNG → null) as cheap insurance.
