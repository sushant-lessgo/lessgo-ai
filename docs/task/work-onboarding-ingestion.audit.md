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
