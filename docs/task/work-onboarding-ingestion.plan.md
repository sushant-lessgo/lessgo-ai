# work-onboarding-ingestion — plan (E2) · rev 3

**WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\work-onboarding-ingestion`
**BRANCH:** `feature/work-onboarding-ingestion`
**Spec:** `docs/task/work-onboarding-ingestion.spec.md` · Tier: full
**Rev 2:** cutover DESCOPED (orchestrator decision: Path A — pilot on `atelier2`; the atelier→skeleton cutover is its own future feature `atelier-skeleton-cutover`). 5 phases.
**Rev 3:** D14 switched to conformance option (b) — no `capabilitySections` type widening (zero reader-site blast radius; closed-fail verified). D3 switched to a NEW `uploadImageFiles` (no `bulkUploadImages` refactor). Engine-wide-UI vs atelier2-only-binding framing fixed (D7a). Prod-reachability founder-ack added (D7b).

## Overview

E2 makes STEP 02 of the work journey real: upload photos (folder or loose files), propose groups without homework (folders → groups; EXIF same-day clusters for loose files), let the user correct in taps (rename / merge / drag-between / hide / pick cover), and bind the grouped photos into the generated site so the STEP-06 reveal shows the user's real work on the work-skeleton (Atelier skin, `atelier2`). The binding rides the existing dormant collections fan-out — LLM-free, so zero new AI calls and zero new credit ops. The riskiest sub-slice — group→site binding — is phase 1, per spec.

## Progress log

- phase 1 binding spine + gallery covers (fail-fast reveal proof): done (commit 8cf890ab, impl-review=ship loops 1; tsc clean, 3802 tests pass, build ok; e2e authored, registration deferred to P2)
- phase 2 WorkDetail + WorkCatalog blocks, conformance relax, atelier2 works flip + pilot enablement: done (commit a91b9272, impl-review=ship loops 1; founder parity gate PASSED; tsc clean, 3824 tests pass, build ok)
- phase 3 upload spine + functional STEP 02 behind widened seam: done (commit 4791ac72, impl-review=ship loops 1; seam gate approved pre-impl; tsc clean, 3852 tests pass, build ok, e2e ran+passed; 3 non-blocking carried into P4)
- phase 4 correction screen (5 verbs) + ingestion-writer regression: done (commit 2dda3255, impl-review=ship loops 1; tsc clean, 3879 tests pass, build ok, correction e2e passed; CF-1 belt-test → P5)
- phase 5 end-to-end hardening + Kundius pilot: steps 1-3 done (commit 6a6d7637, impl-review=ship loops 1; full gate green). main merged in (E3 work-onboarding-questions seam reconciled — one shared JourneyStepConfig, both engines' tests kept; merge 553ba68e + docs catch-up); re-green post-merge: tsc clean, 4064 tests pass, lint pass, build ok. ALL 5 PHASES COMPLETE + MERGE-READY. Remaining = 2 human gates: Kundius pilot eyeball (founder) + station merge (orchestrator). Step 4 Kundius pilot NOT run (founder gate; checklist in audit) — CF-1 belt exported+tested (clampGroupsToCap: per-group 24 + cumulative 150, 5 cases green); e2e blur/MediaAsset API assert added to the EXIF cluster test (RAN+PASSED authed); docs written (audience/work + generation READMEs, resolveWorkBlock/manifest/engines-work.ts headers); D2 no-schema-touch honored (stale MediaGroup comment left for the cutover track). FULL gate green: tsc clean, test:run 3884 passed/18 skipped/0 fail, lint pass (pre-existing warnings only), build ok, EXIF e2e 2 passed. Step 4 (Kundius real-photo founder pilot) = ORCHESTRATOR human gate, NOT run here; founder-pilot checklist in the audit.

---

## Architecture decisions (resolved, with justification)

**D1 — Photo home = `facts.work.groups[].photos` (WorkPhotoRef), NOT a new table.**
`src/lib/schemas/workFacts.schema.ts` already models `WorkGroupSchema.photos: WorkPhotoRef[] {id,url?,alt?,cover?}` — the E1 stub's own header (`StepShowWork.tsx:12`) names this as E2's write target, and the rail chip-id join + wipe-regression test exist *specifically* to protect this payload. Group truth (names/order/cover/photos) lives in ONE store: the Brief facts bag, persisted via the existing rail `commitRail → /api/saveDraft` path.

**D2 — NO MediaGroup table, NO migration, NO reserved-column references. E2 touches zero Prisma schema.** ← deviation from the `prisma/schema.prisma:303` comment ("MediaGroup model itself lands with E2")
A MediaGroup table would duplicate names/order/cover already modeled in `facts.work.groups` — splitting truth across two stores. Per orchestrator ruling, E2 does **not** add, write, or even reference `MediaAsset.groupId`/`sortOrder`/`selected` (YAGNI + one-schema-branch discipline): nothing in this slice reads or writes them, so nothing mentions them. No EXIF column: capture date is consumed once, at proposal time, client-side (D4). Hide is facts-level (D12). The spec's schema human gate dissolves; no coordination hazard with `secrets-forms-security`.

**D3 — Upload reuse = a NEW `uploadImageFiles` client helper for onboarding; `bulkUploadImages` left UNTOUCHED.** (rev 3, reviewer-preferred)
`bulkUploadImages` is a token-scoped editStore action (needs `EditProvider`; onboarding has none) that returns no `assetId` — not drop-in reusable. The spec's "no second uploader/pipeline" constraint is about the ROUTE + server pipeline (`/api/upload-image` → sharp resize→webp q85 + blur + checksum + MediaAsset row), not the client wrapper: both callers hit the ONE route. So: new `src/lib/media/uploadClient.ts` — `uploadImageFiles(files, tokenId, {concurrency, onProgress})` POSTing `/api/upload-image` per file, returning `{file, url, assetId, blurDataUrl?}[]`. **Verified: the route ALREADY returns `metadata.assetId` + `metadata.blurDataUrl` (`route.ts:136-147`) — no route change of any kind.** Naayom's live `bulkUploadImages` is NOT refactored in E2 (de-risks the shared editStore action; a wrap-later consolidation can ride a future editor slice).

**D4 — EXIF: add `exifr` (APPROVED), read client-side from the ORIGINAL `File` pre-upload.**
Hand-rolling TIFF/IFD parsing is a classic source of silently-wrong dates across camera vendors; sharp exposes only a raw EXIF buffer. `exifr` runs in the browser, tree-shakes to a parse-one-tag build (`DateTimeOriginal` only). Client-side is also *forced* by the pipeline: `processImage()` re-encodes to WebP and strips EXIF; reading pre-upload needs no pipeline change and nothing persisted.

**D5 — Binding shape: gallery = group references + covers; photos = `/works/<slug>` item pages.** ← deviation from the spec's "gallery slots hold grouped photos" assumption
The gallery-holds-photos assumption is FROZEN-wrong: `galleryGroups.test.tsx` enforces group-references-only (`{id,name,cover_image,href}`). Binding = (a) stamp each home-gallery group card's `cover_image` (chosen/first photo) + `href` (`/works/<slug>`, code-derived), and (b) fan real photos into `workdetail` item pages via the existing `runCollectionFanOut` bridge with LLM-free `generateItemCopy: async () => ({status:'done', copy:{}})` (the granth precedent, `wizard/generation/work.ts:179`) — records verbatim, charge flat, zero new AI calls. Covers-only is the right phase-1 slice, not the end state.

**D6 — `CollectionEntry` widens with optional `photos`.**
`buildCollectionItemSlice(key, entry)` sees only the entry, so photos ride it: add `photos?: Array<{id?:string; url:string; alt?:string; cover?:boolean}>` to `CollectionEntry` (`src/modules/brief/collections.ts`), carried through `toEntry`/`makeCollectionEntry`/`setCollections`. A works-specific branch of the item slice seeds the `workdetail` contract shape (`name/client/problem/result/photos[]` — the generic slice seeds `images`, which does NOT match `workdetailContract`), and `photos` joins `VERBATIM_ITEM_FIELDS` so AI copy can never clobber it.

**D7 — Pilot = `atelier2` (Path A, FINAL). Cutover descoped entirely.**
The copy engine emits `work.elements.groups`, consumed only by the skeleton gallery; `atelier2` IS the work skeleton (the spec AC's literal "work-skeleton gallery slots"). E2 flips `works` on **atelier2 only** and proves ingestion→grouped reveal there. NOTHING in this plan touches `registry.ts`'s atelier loader, `templates/atelier/` disposition, or existing atelier drafts. Pilot enablement (real planned work, phase 2): `WORK_COPY_ENGINE_TEMPLATES += 'atelier2'` (dev-note comment; makes atelier2 journey-eligible via `isJourneyEligible → isWorkCopyTemplate` and copy-engine-allowed) + an env-gated confirm-route override (`WORK_JOURNEY_TEMPLATE_OVERRIDE`, server-side env, unset in prod) that swaps the persisted `templateId` `atelier → atelier2` post-`decideServe` — the smallest seam: no `shortlist()`/`fit()`/`bespoke` changes, `TEMPLATE_AUDIENCE.atelier2='service'` already exists (`serveGate.ts:116`).

**D7a — Scope of the STEP-02 UI vs the binding (rev 3 clarification).** The upload/correction UI is ENGINE-keyed (the work seam), not template-keyed: an old-`atelier` work journey ALSO renders ShowWorkStep, uploads photos, and commits `facts.work.groups[].photos`. Only the BINDING/reveal is atelier2-scoped: on `atelier` the fan-out stays dormant (no `works` flip ⇒ no `/works` pages) and `href` is only stamped when the item page exists in `fc.pages` (the guard is explicit in `stampWorkGalleryBinding`, P1 step 2); the stamped `cover_image` on the `groups` collection is additionally a visual no-op on old atelier (verified: zero `groups` consumers in `templates/atelier/` — its gallery reads a different `works` collection). No regression either way; photos committed on an atelier journey become fully visible the day the cutover feature lands.

**D7b — Prod-reachability (FOUNDER-ACK line for the merge gate).** E2 ships ZERO prod-reachable behavior change: `WORK_JOURNEY_TEMPLATE_OVERRIDE` is unset in prod, `atelier` never gets the `works` flip, and `atelier2` is bespoke/off-shortlist — so ingestion→binding is dev/pilot-only BY CONSTRUCTION (matches Path A + the Kundius-dev-eyeball gate). The founder should acknowledge this explicitly at merge: merging E2 does not expose the feature to users; a later enablement decision (the cutover feature) does.

**D8 — Rail second-writer guard ALREADY EXISTS — do NOT re-implement it.**
Verified: `UnderstoodRail.tsx:249-256` keys the chips editor on `${field.id}-${pKey}` (projection of the live bag) — a commit swaps the bag ⇒ new key ⇒ the editor unmounts and a stale chip draft cannot survive; `UnderstoodRail.test.tsx` (~:385) already covers editor behavior across a commit. STEP 03's group question also stays safe (fires only on empty groups; its commit APPENDS via the chip join). The E2 work is exactly two things: (a) ingestion commits MUST go through the store's `commitRail(result)` so the facts identity actually changes and the existing keying fires; (b) a NEW regression test projecting a VM, mutating the bag with an **ingestion-shaped commit** (photo-bearing groups added/merged), then committing a stale chip set — asserting no photo wipe/misattachment. No `UnderstoodRail.tsx` edit.

**D9 — Seam widening: an optional lazy step component at the SHARED step-config altitude (engine-agnostic).** ← human gate PASSED (orchestrator-approved 2026-07-17, with the shared-altitude refinement below)
Add `loadStep?: () => Promise<{default: ComponentType<JourneyStepProps>}>` to the **shared type that ALL `steps.*` entries use** (the `{title,body,icon}` shape today), NOT bolted onto `showWork` alone — so STEP 03 (E3 questions) + STEP 04 (E4 plan) reuse the identical field instead of a second/third competing widening of the same founder-signed seam. If the `steps.*` entries already share one config type, this is a one-line add there; if `showWork` is special-cased, define the shared extensible-step shape now and point showWork/questions/plan at it. Decide the vocabulary ONCE, generically (regen-modernization discipline: don't bolt a mechanism onto one case). The agnostic frame (`StepShowWork.tsx`) renders the engine component via `React.lazy` when `loadStep` exists, else the stub — other engines keep the stub. Firewall holds: loader invoked at RENDER time on STEP 02 (post-confirm), never at seam load; `journeyAgnostic.test.ts` stays green.
**E3 COORDINATION:** E3 builds in parallel on the SAME seam and will *use* this `loadStep?` for its STEP-03 question step (orchestrator is telling E3 to reuse, not re-widen). Define it as the shared field; do not make it work/showWork-specific.

**D10 — Ingestion write funnel = work-module `applyRailEdit`, NEVER the seam's `applyEdit`.**
Photos CANNOT ride `JourneyRailAdapter.applyEdit(fieldId, RailEditValue, …)` — `RailEditValue = text|chips` and `RailChipEdit = {id?, label}` (`engines/types.ts:151`) carry no photo payload, and `RailEditValue` is part of the founder-signed contract — **do not widen it**. The correct funnel: build the full `WorkGroupInput[]` (photos riding), call the work module's `applyRailEdit({field:'groups', value}, liveFacts)` (`src/modules/wizard/work/rail.ts`) → `RailCommit` → store `commitRail(result)` (applies facts in one `set`, POSTs saveDraft, reverts+toasts on failure). One write door, one validation gate (`normalizeWorkGroup` + `WorkFactsSchema`), D8's identity-swap for free.

**D11 — Photo cap: per-group 24 / total 150, dumb code, no schema.** (orchestrator-set)
24 = `workdetailContract.photos.constraints.max`; 150 total. Enforced in `proposeGroups.ts` at proposal time: deterministic drop (keep earliest by capture date, then file order), surplus counts surfaced in the proposal (`{kept, dropped}` per group) so the UI says "kept 24 of 31" — never a silent verdict. Belt: `deriveWorksEntries` clamps `photos` to the contract max (24). Plus ONE size-sanity assertion at the ingestion commit point (dev-guard: no group in the outgoing `WorkGroupInput[]` exceeds 24 — clamp + `console.warn`, never throw in prod). No AI curation (Scope OUT). No schema touch anywhere.

**D12 — "Hide" = PHOTO-level only (orchestrator-confirmed); group removal rides the merge verb.**
Hide drops the photo from the committed `photos[]` in facts — sufficient because facts are the single binding truth (D1/D2): what's not in facts never reaches entries, item pages, or covers. The `MediaAsset` row remains untouched (dormant in E2; the photo stays re-addable from a future library UI precisely because the row survives).

**D13 — `/works` catalog singleton ships as the spine dictates.**
`assembleCollectionPages` always emits the catalog singleton; suppressing it for works would fork the collections spine. Phase 2 builds a real `WorkCatalog` block (covers grid → item links), and the works catalog slice's `items` are seeded from entries at assemble time. Possible nav duplication with a sitemap gallery page is a pilot-eyeball item, not a code fork.

**D14 — Conformance mechanic for the `works` flip = OPTION (b): relax the (d) assert; NO type widening.** (rev 3, verified against source)
Rev 2's union widening (`string | readonly string[]`) broke `tsc` at two READ sites outside the phase's Files-touched (`fit.ts:174-175` — values fed into `Set<string>.has`; `sectionSelection.ts:55` → `sectionGrammar.ts:68`'s narrow `buildSectionList` param). **Decision: do NOT widen the type.** `TemplateMeta.capabilitySections` stays `Partial<Record<CapabilityId, string>>`; atelier2 declares `capabilitySections.works = 'workcatalog'` (single string) — zero reader-site blast radius (`fit.ts` / `sectionSelection.ts` / `sectionGrammar.ts` / `templateMeta.test.ts` all untouched). Instead, relax `assertCollectionCapabilityBacked` (`templateConformance.ts:206-233`): require the CATALOG section (`def.catalogSectionType`) in `Object.values(capabilitySections)`; DROP the item-section `toContain` requirement and instead derive the item section from the registry (`def.itemSectionType`) — which the assert ALREADY independently verifies via `resolvesReal(templateId, def.itemSectionType)` at `:231`.
**Closed-fail verification (done, rev 3):** (i) a template declaring `works` with NO real `workdetail` resolver still goes RED — `resolvesReal` (`templateConformance.ts:118-133`) asserts the resolved block is truthy AND `not.toBe(placeholder)` in BOTH modes, and an unregistered section type falls through to the placeholder ⇒ the assert bites regardless of `capabilitySections`. (ii) the (b) walker (`:275-287`) reads `capabilitySections['works']` = `'workcatalog'` → truthy → `resolvesReal('workcatalog')` — not vacuous; the **(b+) walker (`templateConformance.ts:292-305`)** — named here so the implementer checks it — walks the map entries and gets the single string `'workcatalog'` → `resolvesReal` + no-orphan check — no absent-value read, no vacuous pass. **Negative fixtures (conformance.test.ts, extending the existing `:440` fake-metadata pattern):** (1) declare `works` with `capabilitySections` missing `workcatalog` ⇒ the relaxed (d) still throws; (2) drive the assert with fake caps `['works']` against a templateId whose resolver has NO `workdetail` block (e.g. `meridian`) ⇒ `resolvesReal(def.itemSectionType)` throws — proving closed-fail with zero capabilitySections involvement. Conformance Files-touched shrinks to `templateConformance.ts` + `conformance.test.ts` (+ `templateMeta.ts` only for the declaration/flip itself).

## Constraint compliance map

- **No new AI call / credit op:** item copy = `{status:'done', copy:{}}`; cover/href stamping + grouping = pure code. The one strategy + N page-copy calls are unchanged.
- **No `templateId`/`skeletonId` in prompts:** nothing touches `copyPrompt.ts`/strategy prompts; binding happens post-parse in `work.llm.ts` + pure helpers. `promptFirewall.test.ts` stays green untouched.
- **No second uploader/pipeline:** D3 (one ROUTE + one server pipeline; two thin client callers). **Shell unforked:** D9. **Correction always shown, skippable; five verbs:** phase 4.
- **Rate-limit Bug A (adjacent, NOT fixed here):** fan-out adds pages but zero AI calls — only extra `saveDraft` round-trips. Risk noted; rate-limit surface untouched.

---

## Phase 1 — Binding spine + gallery covers (fail-fast reveal proof)

**Goal:** photos placed in `facts.work.groups[].photos` (seeded, no UI yet) provably (a) flow through the driver into persisted `finalContent` — covers stamped, works item pages assembled with verbatim photos — and (b) render on the skeleton reveal surface. If this can't work, E2 dies here cheaply.

**Steps:**
1. Widen `CollectionEntry` with `photos?` (D6); carry through `toEntry`/`makeCollectionEntry`/`setCollections` + tests.
2. New pure module `src/modules/generation/workCollections.ts`:
   - `deriveWorksEntries(facts)` — `facts.work.groups[]` → `CollectionEntry[]` (name, slugified slug, photos **clamped to 24** per D11; flat groups only — `items` sub-level untouched, story-seller carry-only per spec).
   - `stampWorkGalleryBinding(fc, entries)` — pure: for every home `work`-section group card, join by name→slug against entries; set `cover_image` (photo with `cover:true`, else first, else leave `''`) + `href` **ONLY when that `/works/<slug>` page exists in `fc.pages`, else leave as-is** (this guard is what makes the engine-wide UI safe on non-flipped templates — D7a; cover stamping on old atelier is additionally a visual no-op, zero `groups` consumers there). Join by name/slug, never index (parseCopy preserves group names verbatim — facts law).
3. `src/hooks/editStore/archetypes.ts`: works branch in `buildCollectionItemSlice` seeding the `workdetailContract` shape (`name`, `client:''`, `problem:''`, `result:''`, `photos:[{id,url,alt,cover}]`) and a works branch in `buildCollectionCatalogSlice` seeding `items` from entries (name/cover/href) (D13).
4. `src/modules/generation/multiPageAssembly.ts`: add `'photos'` to `VERBATIM_ITEM_FIELDS` (comment why). No other spine change.
5. `src/modules/wizard/generation/work.llm.ts`: after the sitemap fan-out, before `finalizeMultiPageGeneration` — extract a small `runWorksFanOut(fc, input, declaredCapabilities, persist)` step: derive entries from `input.brief`, persist into `fc.onboardingData.collections` (resume), call `runCollectionFanOut` (LLM-free `generateItemCopy`), then `stampWorkGalleryBinding`. Driver passes `templateMeta[resolvedTemplateId]?.capabilities ?? []`. Resume re-derives from persisted `onboardingData.collections`. `works` is undeclared everywhere in P1 ⇒ prod behavior byte-identical (fan-out no-ops; cover stamping is capability-independent but entries only exist when facts carry photos).
6. **Test mechanisms — stated per assertion (pre-flip honesty: with `works` undeclared, `runCollectionFanOut` returns early at `multiPageAssembly.ts:469-470`, so NO `/works` pages exist via the real driver in P1):**
   - *Item pages + verbatim photos + catalog slice + resume-skip:* **vitest with a FIXTURE capability list `['works']`** — `multiPageAssembly.test.ts` (direct `runCollectionFanOut`/`assembleCollectionPages` calls) + `work.llm.test.ts` driving the extracted `runWorksFanOut` step directly with fixture caps.
   - *Wiring + dormancy:* `work.llm.test.ts` — real `templateMeta` caps ⇒ fan-out no-op, fc byte-identical (dormancy proof); fixture caps ⇒ step fires (wiring proof).
   - *Cover stamping:* pure unit tests (`workCollections.test.ts`) — cover-pick precedence, name-join survives AI-polished framing, no-photos ⇒ no-op, **href NOT stamped when the page is absent (D7a guard)**.
   - *Reveal surface renders covers:* **e2e via HAND-SEEDED `finalContent`** — `e2e/work-binding.spec.ts` (authed): create an `atelier2` project, POST a pre-bound fc (covers stamped, works pages present) via `/api/saveDraft`, open `/preview/{token}`, assert seeded photo URLs render as gallery covers. This proves the reveal SURFACE; the data PATH is the vitest half. The two join end-to-end in phase 2 (post-flip).
7. Extend `e2e/helpers/seedWorkBrief.ts` with a photo-bearing variant (used from P2 onward).

**Files touched:**
- `src/modules/brief/collections.ts`
- `src/modules/brief/collections.test.ts` (create if absent)
- `src/modules/generation/workCollections.ts` (new)
- `src/modules/generation/workCollections.test.ts` (new)
- `src/modules/generation/multiPageAssembly.ts`
- `src/modules/generation/multiPageAssembly.test.ts`
- `src/hooks/editStore/archetypes.ts`
- `src/hooks/editStore/pageActions.test.ts` (slice-shape assertions if impacted)
- `src/modules/wizard/generation/work.llm.ts`
- `src/modules/wizard/generation/work.llm.test.ts`
- `e2e/work-binding.spec.ts` (new)
- `e2e/helpers/seedWorkBrief.ts`

**Verification:** `tsc --noEmit` · `npm run test:run` · `npm run test:e2e -- work-binding` · `npm run build`.
**Human gate:** none (dormant-gated; no behavior change for live templates).

---

## Phase 2 — WorkDetail + WorkCatalog blocks · conformance relax · atelier2 `works` flip + pilot enablement

**Goal:** the two genuinely new render surfaces (`.core.tsx` single-source pattern — core shared, `.tsx`/`.published.tsx` thin wraps guarded by `coreParity.test.ts`), then the double gate opens on atelier2 and the pilot journey resolves to it.

**Steps:**
1. `WorkDetail` block: renders `workdetailContract` — name (title), optional client/problem/result strip (carry-only), photo grid from the `photos` collection (`photos.<id>.url` element keys; cover first). Existing tokens only (`tokenContract.ts` — its test guards).
2. `WorkCatalog` block: covers grid from the catalog slice `items` (name + cover + link) — the `/works` index.
3. Register both in `WORK_BLOCK_REGISTRY` (`resolveWorkBlock.ts`) under `workdetail` / `workcatalog`; manifest entries with honest `consumes` ⊆ contract scalars; ADDITIVE `workcatalog` contract entry in `src/modules/engines/workSections.ts` if absent (the work-core contract is frozen — add, never edit); surface mapping in `sectionRules.ts`; dev-gallery mocks.
4. Parity/invariant tests: extend `coreParity.test.ts` + `renderParity.work.test.tsx` with both pairs; new `workDetailPhotos.test.tsx` mirroring `galleryGroups.test.tsx` (photos ARE a flat list HERE; gallery invariant test stays untouched/green).
5. **Conformance relax (D14, option (b), verified):** `templateConformance.ts` — `assertCollectionCapabilityBacked` keeps the catalog-section `toContain` requirement, DROPS the item-section `toContain`, and continues to `resolvesReal` BOTH `def.catalogSectionType` AND `def.itemSectionType` (registry-derived — the closed-fail spine). NO type change in `templateMeta.ts`; NO edits to `fit.ts` / `sectionSelection.ts` / `sectionGrammar.ts` / `templateMeta.test.ts`. The (b) walker (`:275-287`) and the **(b+) walker (`:292-305`)** are read-verified to behave with the single-string `works: 'workcatalog'` entry (not vacuous, no absent-value read) — implementer re-confirms both stay green.
6. **Flip:** `templateMeta.atelier2.capabilities += 'works'` + `capabilitySections.works = 'workcatalog'` (single string — existing type). Update the dormancy-lock test (`conformance.test.ts:413`) — it now asserts the catalog+item pair resolves real for atelier2 instead of asserting vacuous dormancy. **Negative fixtures (closed-fail proof, D14):** (1) fake meta declaring `works` without a `workcatalog` value ⇒ relaxed (d) throws; (2) fake caps `['works']` against a resolver with no `workdetail` block (e.g. `meridian`) ⇒ `resolvesReal(def.itemSectionType)` throws. `templateMeta.atelier` untouched.
7. **Pilot enablement (D7 — real planned work):**
   - `src/lib/workCopyEngine.ts`: `WORK_COPY_ENGINE_TEMPLATES = ['atelier', 'atelier2']` with a comment ("atelier2 = E2 skeleton pilot; absorb at atelier-skeleton-cutover"). Side effects accepted: atelier2 becomes journey-eligible (`journeyEngines.ts` reads this leaf — no edit there) and the editor story-panel gate opens for atelier2 projects (dev-only drafts).
   - Update the two verbatim allow-list assertions: `work.llm.test.ts:292` and `workCopyEngine.test.ts:10` (`['atelier'] → ['atelier','atelier2']`).
   - `src/app/api/brief/confirm/route.ts`: env-gated override — if `process.env.WORK_JOURNEY_TEMPLATE_OVERRIDE` is a valid templateId and `decision.templateId === 'atelier'`, persist the override instead (server env; unset in prod ⇒ byte-identical — D7b). No `decideServe`/`shortlist`/`fit` changes; `TEMPLATE_AUDIENCE.atelier2` already `'service'`.
8. e2e (real fan-out path now live): extend `e2e/work-onboarding.spec.ts` — seed a confirmed photo-bearing work brief on an **atelier2** project (seed helper sets templateId directly; the env override is for manual dev journeys), run STEP 05 (mock copy via `mockResponseGeneratorWork` — binding is code, so mock suffices, deterministic), assert reveal iframe shows the real covers AND `fc.pages` contains `/works/<slug>` pages carrying the seeded photos.

**Files touched:**
- `src/modules/skeletons/work/blocks/WorkDetail/WorkDetail.core.tsx` (new)
- `src/modules/skeletons/work/blocks/WorkDetail/WorkDetail.tsx` (new)
- `src/modules/skeletons/work/blocks/WorkDetail/WorkDetail.published.tsx` (new)
- `src/modules/skeletons/work/blocks/WorkDetail/styles.ts` (new)
- `src/modules/skeletons/work/blocks/Catalog/WorkCatalog.core.tsx` (new)
- `src/modules/skeletons/work/blocks/Catalog/WorkCatalog.tsx` (new)
- `src/modules/skeletons/work/blocks/Catalog/WorkCatalog.published.tsx` (new)
- `src/modules/skeletons/work/blocks/Catalog/styles.ts` (new)
- `src/modules/skeletons/work/resolveWorkBlock.ts`
- `src/modules/audience/work/elementSchema.ts` (orchestrator-authorized mid-P2: 2-line `WORK_LAYOUT_TO_SECTION` add — WorkCatalog→'workcatalog', WorkDetail→'workdetail' — so the EDIT band resolves content via `getSchemaDefaults`; without it the two new blocks render empty in edit mode and can't enroll in renderParity, hollowing the P2 parity gate)
- `src/modules/skeletons/work/manifest.ts`
- `src/modules/skeletons/work/sectionRules.ts`
- `src/modules/skeletons/work/coreParity.test.ts`
- `src/modules/skeletons/work/renderParity.work.test.tsx`
- `src/modules/skeletons/work/workDetailPhotos.test.tsx` (new)
- `src/modules/engines/workSections.ts` (ADDITIVE `workcatalog` contract only, if absent)
- `src/modules/templates/blockMocks/atelier2.ts`
- `src/modules/templates/templateMeta.ts` (declaration/flip only — NO type change)
- `src/modules/templates/templateConformance.ts`
- `src/modules/templates/conformance.test.ts`
- `src/lib/workCopyEngine.ts`
- `src/lib/workCopyEngine.test.ts`
- `src/modules/wizard/generation/work.llm.test.ts` (allow-list assertion :292)
- `src/app/api/brief/confirm/route.ts`
- `e2e/work-onboarding.spec.ts`
- `e2e/helpers/seedWorkBrief.ts`
- `e2e/work-binding.spec.ts` (extend: item page renders the photo grid via the REAL fan-out path, replacing the P1 hand-seeded mechanism where covered)
- `playwright.config.ts` (P1 carry-over: register `/work-binding\.spec\.ts/` on the `authed` project so the P1-authored spec actually executes here — P2 is where the real post-flip path makes it runnable)

**Verification:** `tsc` · `test:run` (parity + conformance (b)/(b+)/(d) all EXERCISED + frozen gallery test green + negative fixtures bite) · `test:e2e` (work-binding + work-onboarding) · `npm run build`. Manual: `/dev/blocks/atelier2` eyeball of both new blocks, edit vs published bands.
**Human gate: YES — dual-renderer/parity-sensitive skeleton surface (spec's candidate gate). Founder eyeballs the two blocks in the dev gallery before phase 3 builds UI on top.**

---

## Phase 3 — Upload spine + functional STEP 02 behind the widened seam

**Goal:** real folder/multi-file upload through the one pipeline into `MediaAsset`, grouping proposal computed (capped per D11), committed to `facts.work.groups[].photos` via the D10 funnel. Note (D7a): this UI is ENGINE-wide — any work-engine journey (atelier or atelier2) gets it; only the binding/reveal is atelier2-scoped.

**Steps:**
1. Add `exifr` to `package.json`; `npm install` in THIS worktree (worktree-Prisma pitfall: real node_modules).
2. `src/lib/media/uploadClient.ts` (D3): NEW `uploadImageFiles` — per-file POST `/api/upload-image`, concurrency ~3, progress callback, returns `{file,url,assetId,blurDataUrl?}[]`. **No route edit — verified it already returns both fields. `bulkUploadImages` untouched (D3, rev 3).**
3. Pure grouping modules under `src/modules/wizard/work/ingest/`:
   - `readCaptureDates.ts` — exifr wrapper, `File → Date | null` (original bytes, pre-upload).
   - `proposeGroups.ts` — pure, unit-testable: `(files: {name, relativePath?, takenAt?}[]) → proposal`. Trust order: folder paths (subfolder = group) → same-day clusters → single "Gallery" fallback. **Cap enforcement lives HERE (D11): per-group 24 / total 150, deterministic drop (earliest capture date, then file order), `{kept, dropped}` surfaced per group.** Plus `mergeProposalIntoGroups(proposal, existingGroups)` — case-insensitive name match attaches photos to an existing (entry-seeded) group; unmatched appends a new `WorkGroupInput` (normal `normalizeWorkGroup` seed defaults — never a `kind`-less group, landmine 6). Verify + test that `normalizeWorkGroup` preserves `photos`.
4. Seam widening (D9): `engines/types.ts` `showWork.loadStep?`; `engines/work.ts` supplies `loadStep: () => import('./work/ShowWorkStep')` (dynamic — pre-confirm entry path stays clean); `steps/StepShowWork.tsx` renders the lazy engine component when present, stub otherwise.
5. `src/components/onboarding/journey/engines/work/ShowWorkStep.tsx` (new, `'use client'`): folder input (`webkitdirectory`; `webkitRelativePath` captured client-side at change time — it does NOT survive multipart, so paths feed `proposeGroups` locally) + multi-file input; EXIF read → upload via `uploadImageFiles` → proposal (capped) → **commit immediately via the D10 funnel** (`applyRailEdit({field:'groups', value}, liveFacts)` → `commitRail`) — this is also what makes D8's existing projection-key guard fire. **The ONE size-sanity assertion (D11) sits at this commit point** (clamp + warn if any outgoing group exceeds 24). Rail updates progressively (chips + counts) as a consequence of the commit. Skip-entirely path preserved. Proposal summary + continue/skip shown (correction board arrives phase 4).
6. Tests: `proposeGroups.test.ts` (folder precedence, same-day clustering incl. midnight/timezone edges, no-date fallback, cap 24/150 + deterministic drop + `{kept,dropped}`, merge policy, photos-preserved); `engines/work.test.ts` (seam widening + commit path; extend the E2-shaped wipe-regression); `journeyAgnostic.test.ts` untouched-and-green (purity proof).
7. **EXIF fixture assets (real work):** `e2e/fixtures/images/` — small JPEGs with genuine `DateTimeOriginal` across 2 distinct days + 1 dateless PNG, generated by committed `scripts/makeExifFixtures.mjs` (sharp `withExif`); commit script AND binaries. A blank PNG does NOT exercise clustering.
8. e2e (`work-onboarding.spec.ts`): `setInputFiles` with EXIF fixtures on the loose-file input → 2 proposed groups (same-day clusters) surface in rail chips with counts; facts persist across reload. **Known limit, stated:** Playwright cannot fabricate `webkitRelativePath` — folder→group is unit-covered only; loose-file clustering + commit are the e2e surface.

**Files touched:**
- `package.json` / `package-lock.json`
- `src/lib/media/uploadClient.ts` (new)
- `src/lib/media/uploadClient.test.ts` (new)
- `src/modules/wizard/work/ingest/readCaptureDates.ts` (new)
- `src/modules/wizard/work/ingest/proposeGroups.ts` (new)
- `src/modules/wizard/work/ingest/proposeGroups.test.ts` (new)
- `src/modules/wizard/work/rail.ts` (only if `normalizeWorkGroup` needs a photos-preservation fix)
- `src/components/onboarding/journey/engines/types.ts`
- `src/components/onboarding/journey/engines/work.ts`
- `src/components/onboarding/journey/engines/work.test.ts`
- `src/components/onboarding/journey/engines/work/ShowWorkStep.tsx` (new)
- `src/components/onboarding/journey/steps/StepShowWork.tsx`
- `e2e/fixtures/images/` (new binaries)
- `scripts/makeExifFixtures.mjs` (new)
- `e2e/work-onboarding.spec.ts`

**Verification:** `tsc` · `test:run` (incl. journeyAgnostic + wipe-regression) · `test:e2e` · `npm run build`. Manual: real folder upload on `npm run dev` — mobile-width throttled check ("fast-on-phone"); MediaAsset rows carry `blurDataUrl`.
**Human gate: YES — seam-contract widening (D9). Present the widening shape at phase start, before implementation.**

---

## Phase 4 — Correction screen (5 verbs) + ingestion-writer regression

**Goal:** the always-shown, skippable correction board — rename, merge, drag-between-groups, hide (photo-level, D12), pick cover — all taps; skip = accept.

**Steps:**
1. `CorrectionBoard.tsx` (engine-owned, rendered in `ShowWorkStep` after proposal commit): group cards with photo thumbnails (`blurDataUrl` for instant paint — exercises the blur path in-product); verbs: rename (tap-to-edit), merge (select→merge, photos concatenate, re-capped at 24 with `{kept,dropped}` messaging), drag-between (`@dnd-kit`, existing dep), hide (photo-level toggle — hidden photos dropped from committed `photos[]`; MediaAsset rows untouched, D12), pick cover (`cover:true`, exclusive per group). Every accept/change re-commits the FULL rebuilt `WorkGroupInput[]` through the D10 funnel. "Looks right →" (accept) and "Skip" both advance to STEP 03 — the proposal was already committed in phase 3, so skip is a pure advance.
2. Extract `correctionReducer.ts` — the five verbs as pure group-array transforms, testable without DOM.
3. **D8 regression (test-only):** new `UnderstoodRail.test.tsx` case — project VM → apply an ingestion-shaped commit (photo-bearing groups added/merged via the D10 funnel) → attempt a stale chip commit → assert no photo wipe/misattachment and the chips editor remounted (existing `${field.id}-${pKey}` keying). **No `UnderstoodRail.tsx` source edit.**
4. e2e (`work-onboarding.spec.ts`) deterministic verb checks: rename → rail chip label updates + persists; pick cover → that URL is the group's gallery `cover_image` post-generation; hide → hidden URL absent from persisted `finalContent`; merge → group count drops, photo count conserved (minus cap drops). Drag-between: attempt Playwright `dragTo`; if flaky under the serial runner, the reducer unit test is the gate of record and the e2e drag is marked best-effort (stated, not silently skipped).

**Files touched:**
- `src/components/onboarding/journey/engines/work/CorrectionBoard.tsx` (new)
- `src/components/onboarding/journey/engines/work/correctionReducer.ts` (new)
- `src/components/onboarding/journey/engines/work/correctionReducer.test.ts` (new)
- `src/components/onboarding/journey/engines/work/ShowWorkStep.tsx`
- `src/components/onboarding/journey/UnderstoodRail.test.tsx`
- `src/components/onboarding/journey/engines/work.test.ts`
- `e2e/work-onboarding.spec.ts`

**Verification:** `tsc` · `test:run` · `test:e2e` · build. Manual: verb feel at mobile width (taps, not precision-drags).
**Human gate:** none.

---

## Phase 5 — End-to-end hardening + Kundius pilot

**Goal:** journey 01→06 complete on the Work vertical (atelier2); docs; the spec's decision gate.

**Steps:**
1. Full-journey e2e: seeded confirm (atelier2) → STEP 02 upload (fixtures) → correction (accept) → STEP 03/04 → STEP 05 (mock copy) → STEP 06 reveal iframe asserts: covers present, `/works` pages exist with photos, hidden photo absent; MediaAsset rows carry blur (API assert). Resume paths: reload mid-STEP-02 (proposal persisted in facts), resume mid-fan-out (`completedPageKeys` skip).
2. Docs (named files): `src/modules/audience/work/README.md` (binding + covers/href stamping note), `src/modules/generation/README.md` (works fan-out live on atelier2; LLM-free), header comments in `src/modules/skeletons/work/resolveWorkBlock.ts` + `src/modules/skeletons/work/manifest.ts` (two new sections), header comment in `src/components/onboarding/journey/engines/work.ts` (seam widening + ingestion funnel + D8 note). NO `prisma/schema.prisma` edit of any kind (D2 — not even the comment; the stale "MediaGroup lands with E2" comment is corrected by the future cutover/CMS track, noted in the audit instead).
3. Sweep: `npm run lint` · full `test:run` · full `test:e2e` · `npm run build` — all green locally (no CI gate).
4. **Pilot:** real Kundius photo folders through STEP 02 on dev (env override set) → correction → generate → STEP-06 reveal on atelier2.

**Files touched:**
- `e2e/work-onboarding.spec.ts`
- `src/modules/audience/work/README.md`
- `src/modules/generation/README.md`
- `src/modules/skeletons/work/resolveWorkBlock.ts` (header comment)
- `src/modules/skeletons/work/manifest.ts` (header comment)
- `src/components/onboarding/journey/engines/work.ts` (header comment)
- `docs/task/work-onboarding-ingestion.plan.md` (progress log)

**Verification:** the full local gate suite above.
**Human gate: YES — FOUNDER: Kundius real-photo eyeball at STEP-06 (spec's decision gate — her work, grouped, fast-on-phone, on the work skeleton) + the D7b prod-reachability acknowledgement (E2 merges ZERO prod-reachable behavior; enablement is a later, separate decision). Gates E2 "proven" and any merge conversation.**

---

## Explicit deviations from the spec (summary)

1. **"Grouped photos in gallery slots" — wrong render model.** Gallery = frozen group-reference contract; photos bind as covers + `/works/<slug>` item pages (D5). Buyer-shopping structure preserved.
2. **"Reuse `bulkUploadImages`" — not drop-in.** Store-bound, no assetId in its return. Constraint honored at the ROUTE/pipeline level: new `uploadImageFiles` client helper hits the same `/api/upload-image`; `bulkUploadImages` left untouched (D3).
3. **No MediaGroup table / no migration / no reserved-column references** (D2) — the spec's schema human gate dissolves.
4. **Pilot on `atelier2`, not `atelier`** (D7, orchestrator Path A). The spec AC names the work-skeleton gallery slots — atelier2 IS that skeleton. The atelier cutover is its own future feature; the STEP-06 reveal is delivered on the skeleton skin. The STEP-02 UI itself is engine-wide (D7a); E2 merges zero prod-reachable behavior (D7b).
5. **Blur AC read as "present in the pipeline output + used in the correction-UI thumbnails"** — blur-up inside published pages would need a frozen-contract field addition; NOT in E2.
6. **Folder-upload e2e is unit-level** for folder→group (Playwright can't fabricate `webkitRelativePath`); loose-file clustering + commit are the Playwright surface.

## Size honesty

Five phases, all real; genuinely full-tier (generation spine + 2 block pairs + conformance relax + pilot enablement + upload UI + correction UI), but schema-free and cutover-free. All spec ACs met modulo the two reinterpretations above (blur rendering, folder e2e). If cutting is demanded: drop phase 4's drag-between to reducer-only (keep the other 4 verbs tap-complete) — never cut phase 1 or the gates.

## Unresolved questions

1. Blur AC: MediaAsset + correction-UI thumbnails enough, or need blur-up on published pages (= frozen-contract field add)?
2. Drag-between e2e best-effort OK if Playwright dnd flakes (reducer test = gate of record)?
3. Env name `WORK_JOURNEY_TEMPLATE_OVERRIDE` + confirm-route placement for pilot override OK?
