# atelier-template — implementation plan (rev 3, APPROVED post plan-review — 3 review rounds; final 2 blockers folded into phase-4/phase-5 files-touched by orchestrator)

**Branch:** `feature/atelier-template` (already checked out; all phases commit here; subagents hard-stop on mismatch).
**Spec:** `docs/task/atelier-template.spec.md` · **Scout:** `docs/task/atelier-template.scout.md`

## Overview

Build `atelier`, the first on-demand work-engine template (visual-portfolio; anchor customer Kundius Photography), by cloning vestria's `.core.tsx` single-source architecture and registering it through the template-factory machinery (templateMeta / RESOLVERS / auto-enrolled `templateConformance`). Atelier is a **service-audience** template (plan-of-record, per spec); the serve path is reconciled so a served photographer (work engine) routes to service, not the writer wizard — and a NEW wizard skeleton path (phase 2) makes the served work→multipage flow produce an empty 5-page site for manual fill instead of running the writer copy generator. Foundation phases (audience routing, wizard skeleton path, grammar, registration, archetypes, tokens, serve-gate coverage, fonts) all land BEFORE the visual block port, which is human-gated on the still-missing approved designer HTML.

## Key decisions (resolved here, baked into phases)

- **audienceType = `service` (the crux — phase 1).** Three candidates were in tension: vestria (clone source) is product; `BRIDGEABLE_ENGINES['work']='writer'` (serveGate.ts:79) routes served photographers to writer; spec Constraints say "Kundius = service audience today". Ruling: **service**, because (i) spec explicitly steers there; (ii) the closest analog lumen (work-engine photographer template) is service-audience, alongside hearth/lex/surge; (iii) `contractFor()` (templateConformance.ts:143) consults ONLY engine contracts + `productElementSchema` + `serviceElementSchema` — NOT `writerElementSchema` — so atelier layouts registered in `serviceElementSchema` make the manifest `consumes ⊆ contract` check resolve cleanly. Writer-audience would force extending `contractFor` + registering layouts in writer schema — extra risk, rejected. `usesTemplateModule()` (service.ts:79) is blanket-true for `audienceType === 'service'` (only product has a per-id whitelist) — no edit needed. The serve-routing consequence (work engine currently → writer audience) is fixed in phase 1: served audienceType keys off the PICKED TEMPLATE, falling back to `BRIDGEABLE_ENGINES[engine]` — granth work-serves stay writer, atelier work-serves become service.
- **Served work→multipage = SKELETON path, not the writer generator (phase 2 — new, closes the central review blocker).** Verified against source: `GeneratingSlot.tsx:71-74` dispatches on ENGINE — `engine==='work'` → `buildWorkInput()` → `runGeneration('work')`, i.e. the writer/granth generator (writerName/works, MIN_WORKS guard at :105-114), regardless of audienceType. And the work engine SKIPS the structure slot entirely — `workContract.slotSkips = ['structure']` (inputContracts.ts:187), applied by `slotsForEngine()` (useWizardStore.ts:425); `fetchStrategy` additionally early-returns for work (useWizardStore.ts:935-936). So today a served photographer would run the writer generator into sections atelier doesn't register, and `getPageArchetypesForTemplate('atelier')` / `isMultipage` would never fire. There is NO served manual-fill path today. **Ruling:** add a surgical, capability-gated skeleton path — gate everywhere on **`isMultipage(templateId)` (the PICKED template's multipage capability), never on engine alone**: (a) the structure-slot skip is retained UNLESS the picked template is multipage; (b) `fetchStrategy` gets a work+multipage branch that seeds the sitemap from the archetype menu defaults with ZERO LLM/credits (work copy-gen stays OUT); (c) `GeneratingSlot` gets a work+multipage branch that builds an empty multipage draft via the EXISTING `buildMultiPageSkeleton` (multiPageAssembly.ts:97) + confirmed sitemap → saveDraft → editor (no `buildWorkInput`, no MIN_WORKS, no copy). **Granth stays byte-for-byte on its current path:** granth declares no `multipage`, so the skip, the fetchStrategy early-return, and the writer-generator dispatch all behave exactly as today. Spec fenced "work COPY GENERATION out" — a copy-less skeleton is consistent with "manual-fill now", but it DOES open wizard surface the spec didn't name → flagged as unresolved Q#1; plan-of-record proceeds so implementation isn't blocked.
- **Block-manifest posture = (a) real manifest.** Because atelier is service-audience with its layouts in `serviceElementSchema`, `contractFor` resolves and a real `blockManifests['atelier']` entry ships (unlike granth, which passes by shipping NO manifest — blockManifest.ts:369; groups (c)/(e) + consumes then short-circuit, templateConformance.ts:300). Consequence: scope #5 tiered-packages capacity IS enforced via `minCards:2/maxCards:4` on the packages declaration, and groups (c)/(e) actually run — with one block component per sectionType, (c) passes vacuously (it checks block-COMPONENT variants per layoutName in the manifest, NOT `TemplateModule.variants[]` token/typeface variants).
- **G1 (work core grammar):** generalize `engineCoreSections.work` from writer-shaped `['hero','about','books','writing','praise','footer']` to **`['hero','work','about','footer']`**. Granth stays green via a resolver alias: `'work'` → granth's existing books/portfolio block pair (string-keyed map entry only — no closed-union blast, no new granth visuals). This change reaches EVERY `engineCoreSections.work` reader — incl. `templateMeta.test.ts:87` (asserts the work core verbatim), `designKit(work)`'s emitted brief (granth is the work flagship, so the granth kit output changes), and any committed kit/golden fixture — phase 3 greps and updates ALL of them. Fallback if `'work'` unexpectedly hits section-schema union surgery: shrink core to `['hero','about','footer']` and enforce atelier's showcase via the `gallery` capabilitySections check — implementer flags before falling back.
- **designKit is PURE DERIVATION — do not hand-edit for grammar.** `designKit.ts` says "do not hand-edit" and `designKit.test.ts` asserts against the live schema. Decision = option (a): ACCEPT that the new `'work'` sectionType has no granth layout, so `designKit(work)` emits it slotless; consequence: the handoff lint has no required data-slots for the showcase section — acceptable, since the `gallery` capabilitySections conformance check + parity harness cover it. No `designKit.ts` edit in phase 3 (grammar); the only designKit.ts edit in this plan is the `SELF_HOSTED_FONTS` whitelist line (phase 8).
- **G2 (designer HTML missing):** `template-design/` has no atelierKontur HTML/brief today. All foundation phases (1–8) use provisional-but-real block pairs. Phase 9 (visual port) is a **human gate** requiring approved HTML + founder/customer Step-1 tile pick + `kit:lint` pass.
- **templateMeta:** `copyEngines: ['work']`, `capabilities: ['gallery','packages','multipage']` — **`lead-form` DROPPED** (declaring a non-structural capability without a `capabilitySections` entry reds conformance group (b); `fit()` still satisfies lead-form via the shared-block lane, fit.ts:51 `sharedBlockCapabilities`, so the phase-7 fit assertion passes). NOT `bilingual` (platform capability). `capabilitySections: { gallery: <work-showcase sectionType>, packages: <packages sectionType> }`. `designStyles` incl `editorial-craft` (matches photographer `defaultStyle`; confirm vocab at implement).
- **Serve flip is green-at-step (phase 4).** The moment templateMeta declares `gallery` on a non-bespoke work template, the photographer rungC probe flips MANUAL→SERVE and three existing serveGate tests break: `serveGate.test.ts:212` (photographer ⇒ `rungC:gallery` manual), `:296` block (structureHint invariance fixtures), `:480` (photographer corrected-to-coach). Those test updates land IN phase 4 (same phase as the flip), so phase 4 finishes green — NOT deferred to the later coverage phase.
- **Conformance enrollment:** `templateConformance('atelier')` is AUTO-enrolled via the templateIds loop (conformance.test.ts:91) — no explicit call line. Only the opt-ins are explicit lines: `assertKnobConformance` (phase 6) and `assertEditorBasics` (phase 11). `assertEditorBasics` green-passes with an EMPTY `BLOCK_MOCKS[atelier]` (templateConformance.ts:498) — so phase 11 MUST author real per-section mocks (in `src/modules/templates/blockMocks/index.ts` — path confirmed) or the acceptance checkbox is false.
- **Knobs:** declare ALL 5 standard axes (rule: declare one ⇒ declare all). Real alternates on the three spec-named axes — `buttonShape`, `cardStyle`, `density`; `typePairing` and `texture` ship default-only (single-value arrays — CONFORMANCE-VALID, verified). Rendered via shared `knobCss.ts` in SSRTokens + ThemeInjector; blocks never branch on knobs.
- **Looks (List-3):** SKIP for v1 — `templateMeta.looks` optional, spec rules picker-looks UX OUT. No `assertLooksConformance`.
- **Photographer structure:** flip `structureDefault: 'single'` → `'multi'` (config.ts ~:242). This is NOT inert: `isMultipage` consults businessType `structureDefault` (+ persisted `structure.mode`), and after phase 2 the work engine actually REACHES the multipage structure slot when the picked template is multipage — so the flip is what makes a photographer's served atelier flow default to the 5-page menu.
- **Bilingual:** standard `localeContent` overlay + `useTemplateBlock` funnel + plain `.published.tsx` text. Zero atelier-specific i18n code; NO lumen twin-fields. v1 gaps accepted (nav labels / collection-item text / form labels / media locale-shared).
- **Slider:** 4-file behaviors-asset pattern (`atelierSliderBehaviors.js` → buildAssets → `slider.v1.js` → htmlGenerator gate) + paired blocks sharing a data-attr contract; published side first-image-visible no-JS; editor side React hooks. Immutable filename contract.
- **Gate 0 absorption:** vestria multipage machinery PASSED but 7 editor punch-list findings open. Atelier's phase-11/12 verification re-checks these; fixes to SHARED editor code are out of this plan's files-touched (escalate to orchestrator).

## Progress log

- phase 1 audienceType ruling + serve-route reconciliation: done (commit 2697cbee, review loops 1, verdict ship) — carry to phase 4: parity test `engineOfTemplate` hand-feeds lumen:'trust' (real engine 'work') + techpremium rows (harmless/dead, but fix by deriving engine from templateMeta.copyEngines + skip bespoke/retired); lumen ALREADY deviates (work→service) so atelier isn't the first — fix that note when adding atelier:'service' to the map + parity table
- phase 2 served work→multipage skeleton wizard path: done (commit c9af411d, review loops 1, verdict ship) — CARRY: (phase 5) slot-inclusion keys off full `brief` while fetchStrategy/GeneratingSlot key off `briefSignalFromState(store)` — prove atelier's two derivations AGREE (else structure slot shows but skeleton dispatch declines, or vice-versa); (phase 4/5) `selectProductBlocks` is product-only (`LAYOUTS_BY_TEMPLATE={vestria}`) so atelier work/packages/quote-band sections fall to layout 'default' UNLESS phase-4 ships a real `blockManifests['atelier']` whose manifestPick resolves atelier layout names ahead of the fallback — verify at phase 5
- phase 3 work-grammar generalization (G1, granth-safe): done (commit 6ef3cedb, review loops 1 + 1 orchestrator-ruling mid-phase, verdict ship) — core=['hero','work','about','footer']; granth 'work' alias→GranthBooks; inputContracts.ts byte-unchanged, test invariant relaxed via CONTRACT_EXTRA_SECTIONS allowlist; 'work' kit section slotless (accepted)
- phase 4 atelier registration + service element schema + provisional-block scaffold + serve-flip tests: done (commit bb56bf8f, review loops 1 + 1 orchestrator-ruling mid-phase, verdict ship) — atelier registered (51-file vestria-cloned module, 8 provisional triads); photographer flips to SERVE/service green in-phase; quote sectionType=`quote` (NOT quote-band — hyphen breaks id round-trip; USE `quote` in phase-5 archetypes); designStyle=editorial-craft; 2 variants (editorial/compact). Non-blocking: stale obsolete comment serveGate.test.ts:120 (photographer-contrast now wrong; cosmetic)
- phase 5 page archetypes + multipage + photographer multi default: done (commit 22078dea, review loops 2, verdict ship) — 5 archetypes (Home/Work/Experiences/About/Contact); photographer→multi; FIXED reachable phase-2 zero-page bug (hydrate now feeds briefSignalFromState to slotsForEngine so slot-inclusion + dispatch agree) + pipelineGuards StyleSlot allowlist (phase-2 regression). Both phase-2 carries proven. Non-blocking: stale CARRY-test comment (cosmetic)
- phase 6 design system (tokens/palettes/variants/knobs/sectionRules): done (commit f0c808ac, review loops 1, verdict ship) — all 5 knob axes (real: buttonShape/cardStyle/density; default-only: typePairing/texture); ThemeInjector+SSRTokens byte-identical via buildAtelierStylesheet; default=no-attr/no-CSS. **CARRY→phase 11: (1) add `knobs: m.atelierKnobs` to atelier's registry.ts loader block (editor knob-switching reads getLoadedTemplate('atelier').knobs — NOT surfaced yet; registry.ts must be added to phase-11 Files-touched); (2) fix misleading index.ts:20 comment claiming registry already surfaces it. cardStyle visually inert until phase-9 Packages port wires --card-* vars.**
- phase 7 serve-gate + fit + served-path integration coverage: done (commit pending-below, review loops 1, verdict ship) — tests only, no prod change; SERVE-depth + real over-serve guards + fit provenance + composed served-path (real buildBriefDraft→decideServe→hydrate→skeleton) + granth regression. serveGate.test.ts:120 stale comment fixed
- phase 8 fonts (Bricolage Grotesque) + preload + kit whitelist: pending
- phase 9 [HUMAN GATE] visual block port from approved designer HTML: pending
- phase 10 hero-slider behaviors asset: pending
- phase 11 editor basics + atelier block mocks: pending
- phase 12 parity enrollment + [HUMAN GATE] parity QA sign-off: pending
- phase 13 [HUMAN GATE] Kundius EN/NL manual-fill + publish: pending

---

## Phase 1 — audienceType ruling + serve-route reconciliation

**Goal:** Lock atelier's audienceType = `service` (plan-of-record) and make the serve path derive audienceType from the picked TEMPLATE, not the engine, so a served photographer reaches a service-audience atelier site instead of mis-routing to the writer wizard. Lands template-agnostically (atelier doesn't exist yet — granth behavior proven unchanged); atelier's map entry arrives in phase 4.

**Steps:**
1. Verify the ruling's premises in source: `usesTemplateModule()` (service.ts:79-89) blanket-true for service (no whitelist edit needed); `contractFor()` (templateConformance.ts:143-148) consults product+service schemas only.
2. Add a template→audience map (e.g. `TEMPLATE_AUDIENCE: Record<TemplateId, AudienceType>` in serveGate.ts, or co-locate in service.ts if a natural home exists — check for an existing helper first; full Record preferred so tsc FORCES the atelier entry when the union grows in phase 4). Change `decideServe()` (serveGate.ts:213-219) to return `audienceType: TEMPLATE_AUDIENCE[templateId] ?? BRIDGEABLE_ENGINES[engine]` where `templateId = pickTemplate(...)`. Existing entries mirror current behavior (granth→writer, hearth/lex/surge/lumen→service, meridian/techpremium/vestria→product) so nothing observable changes yet.
3. Verify the authoritative consumer `/api/brief/confirm/route.ts:78` takes `decision.audienceType` (sole consumer — grep `BRIDGEABLE_ENGINES` readers to confirm no separate engine→audience recompute).
4. NOTE the post-serve flow question is answered by phase 2 (served work+multipage → skeleton, no copy-gen); this phase only fixes the audience decision.
5. Unit tests: work-engine brief that picks granth → audienceType `'writer'` (unchanged); map-fallback logic covered; existing serveGate tests green.

**Files touched:**
- `src/modules/brief/serveGate.ts` (map + decideServe derivation)
- `src/types/service.ts` (only IF the map homes here)
- `src/modules/brief/serveGate.test.ts` (add derivation cases; NO flip yet — existing outcomes unchanged)

**Verification:** `npx tsc --noEmit`; `npm run test:run -- src/modules/brief` (all existing serve decisions byte-identical; new derivation covered).

---

## Phase 2 — Served work→multipage skeleton wizard path

**Goal:** A served **work-engine brief whose picked template declares `multipage`** goes THROUGH the structure slot (5-page archetype menu) and then produces an **empty multipage skeleton for manual fill** — zero LLM calls, zero credits, zero copy — instead of running the writer/granth generator. Granth's served writer flow (work + single-page) is byte-for-byte unchanged. Lands template-agnostically: no current template is work+multipage, so behavior today is identical everywhere; the path goes live when atelier declares `multipage` (phase 4) + archetypes (phase 5).

**Gating rule (everywhere in this phase):** branch on `isMultipage(templateId, briefSignal)` — the PICKED template's multipage capability + persisted `structure.mode` — NEVER on `engine === 'work'` alone. Granth lacks `multipage` ⇒ every gate below evaluates false ⇒ granth's skip/dispatch/guard code paths untouched at runtime.

**Steps:**
1. `useWizardStore.ts`: make the structure-slot skip template-aware — `slotsForEngine()` (:425-429, currently pure engine → `getContract(engine).slotSkips`) drops the `'structure'` skip when the store's picked `templateId` is multipage (recompute at the point templateId is known; keep `inputContracts.ts` DATA untouched — the engine contract stays engine-keyed, the conditioning lives at the store layer). Update the store comment ("work keeps its skip" → "work keeps its skip unless the picked template is multipage").
2. `useWizardStore.ts` `fetchStrategy` (:935-936): add a work+multipage branch BEFORE the thing/trust guard — seed `sitemap` from `getPageArchetypesForTemplate(templateId)` defaultIncluded pages (`defaultSections`, proof-filtered like StructureSlot's addPage), set `strategyStatus='done'`, NO fetch, NO charge (mirror the existing "strategy already present" early-exit shape). Work + single-page (granth) keeps the existing early return.
3. `StructureSlot.tsx`: tolerate the strategy-less work seeding (draft already prefers `storeSitemap`; verify the guards at :323/:370/:500 behave with `strategy === null` + `strategyStatus === 'done'`); add work-grammar entries to `SECTION_LABELS` (`work`, `packages`, `quote-band`, `contact` as needed) so archetype sections don't render raw keys; adjust the "we'll write the copy next" microcopy for the no-copy path.
4. `GeneratingSlot.tsx`: gate the `engine==='work'` dispatch (:71-74) — work + multipage takes a SKELETON path instead of `buildWorkInput()`/`runGeneration('work')`; the MIN_WORKS guard (:105-114) applies ONLY to the generator path. Skeleton path calls a new `runWorkSkeleton(input)` and routes to `/edit/${tokenId}` on success (stage UI: jump to 'saving'). Do NOT reuse the credits-error "Continue without copy" branch (:164) — it's a bare redirect with no draft; multipage needs a pages skeleton.
5. `@/modules/wizard/generation/work`: add `runWorkSkeleton` (plain module — keeps GeneratingSlot thin per its FIREWALL header): build the draft via the EXISTING `buildMultiPageSkeleton` (multiPageAssembly.ts:97), materialize one page entry per CONFIRMED sitemap page with section IDs (`${type}-${uuid}`) + layout mappings and EMPTY content elements (reuse `mergePageIntoFinalContent`/assembly helpers where they fit — invent nothing), persist via saveDraft, return the shared `{status, redirectTo}` result shape. NOTE: `WorkGenerationInput` (work.ts:34) carries no sitemap field and the module firewall forbids importing the store — so extend `WorkGenerationInput` (or give `runWorkSkeleton` its own input type) to carry the confirmed page list, and project `s.sitemap` into it from `GeneratingSlot` (both files already in files-touched); without this the skeleton has zero pages. Existing writer exports untouched. Optional (implementer's call, flag in audit): seed the Work page's gallery collection from `theWork` uploads if trivial; otherwise uploads are simply unused on this path.
6. `StyleSlot.tsx` coherence: work falls through to `ThingStyleSlot` (:180-181), whose `showVestriaPickers = isMultipage(templateId)` (:194) would wrongly surface the VESTRIA-typed hero-variant/style pickers for atelier. Fix: gate those pickers on `templateId === 'vestria'` (they import `VestriaHeroVariant` — vestria-only by construction; vestria + granth behavior unchanged: true/false respectively today).
7. Unit tests (`useWizardStore.test.ts` + a GeneratingSlot/StructureSlot-level test if one exists): (a) slots for work + non-multipage template (granth) still skip structure; (b) slots for work + a multipage template include structure (synthetic combo — use vestria or a mocked templateMeta until atelier exists); (c) `fetchStrategy` work+multipage seeds sitemap with zero fetch/charge; (d) work+single-page fetchStrategy still early-returns; (e) skeleton dispatch gate: work+multipage → skeleton, work+single → writer generator.

**Files touched:**
- `src/hooks/useWizardStore.ts` (template-aware skip + fetchStrategy seed branch)
- `src/hooks/useWizardStore.test.ts`
- `src/components/onboarding/wizard/GeneratingSlot.tsx` (skeleton dispatch gate)
- `src/components/onboarding/wizard/StructureSlot.tsx` (strategy-less tolerance + labels + microcopy)
- `src/components/onboarding/wizard/StyleSlot.tsx` (vestria-picker gate)
- `src/modules/wizard/generation/work.ts` (add `runWorkSkeleton`; existing generator path untouched)

**Verification:** `npx tsc --noEmit`; `npm run test:run -- src/hooks src/modules/wizard` (granth-path regression cases green + new gates covered); manual smoke: writer/granth onboarding run unchanged (`npm run dev`).

> **Scope flag (top unresolved question):** this phase adds served-work wizard surface the spec fenced as "copy-gen OUT". A copy-less skeleton honors "manual-fill now", but founder must confirm this scope vs. deferring the served flow entirely and building Kundius via direct editor.

---

## Phase 3 — Work-grammar generalization (G1, granth-safe)

**Goal:** `engineCoreSections.work` = `['hero','work','about','footer']`; granth resolves the new core via alias (zero visual change). No designKit edit — the kit DERIVES from live schema and will emit the new `'work'` section slotless (accepted, per key decision). No atelier code yet — phase green standalone.

**Steps:**
1. Edit `engineCoreSections.work` in `src/modules/engines/coreSections.ts`; update the "revisit work-core" comment (atelier is the second work template it anticipated).
2. Add `'work'` alias entry in granth's block resolver mapping → its existing books/portfolio block pair, both edit + published modes (string-keyed map — no union surgery expected; if a closed sectionType union bites anyway, STOP and report blast radius; fallback core documented in key decisions).
3. **Grep ALL `engineCoreSections.work` readers and update every affected assertion/fixture** (known from scout+review sweep): `src/modules/templates/templateMeta.test.ts:87` asserts the work core verbatim → update; `conformance.test.ts:192` filters over it generically → verify no fixture change; `inputContracts.ts:239` locked-sections + its test, `fit.ts:165`, `sectionGrammar.ts:94`, `TemplateSwapList.tsx:91` are generic readers → verify only. **Because granth is the work flagship, `designKit(work)`'s emitted brief changes too** — grep for any committed granth kit/golden fixture asserting the old section list and update it (designKit.test.ts loops generically; kit markdown output lives in gitignored template-design/ unless a fixture was committed — confirm).
4. Do NOT edit `designKit.ts` for grammar (derived, hand-edits are no-ops). Run `npm run kit:generate` and eyeball the work brief: `'work'` section present, slotless — record in audit that handoff lint therefore has no required data-slots for the showcase section.

**Files touched:**
- `src/modules/engines/coreSections.ts`
- `src/modules/templates/granth/resolveGranthBlock.ts` (exact resolver filename per granth dir — alias entry only)
- `src/modules/templates/templateMeta.test.ts` (work-core assertion)
- `src/modules/engines/*.test.ts` fixtures IF they assert the old work core (test-expectation updates only) — **includes `inputContracts.test.ts`: its "core-section alignment" invariant (`field/dropTarget ⊆ engineCoreSections`) is stale under the new minimal-core semantics. FIX = relax the TEST only (keep `inputContracts.ts`/`workContract` byte-unchanged — those are granth's writer-wizard field→section maps, legit granth sections atelier never uses via the skeleton path) via a documented per-engine allowlist `CONTRACT_EXTRA_SECTIONS = { thing:[], trust:[], work:['books','writing','praise'] }`, checking membership in core∪extras. Orchestrator ruling after implementer stopped on the blast radius — both plan-review rounds missed this coupling.**
- granth kit/golden fixture file IF one is committed (per step-3 grep)

**Verification:** `npx tsc --noEmit`; `npm run test:run -- src/modules/templates` (granth auto-enrolled conformance + templateMeta.test green against new core); `npm run test:run -- src/modules/engines` (kit/designKit/inputContracts tests); `npm run kit:generate` manual eyeball of the work brief.

---

## Phase 4 — Atelier registration + service element schema + provisional-block scaffold + serve-flip tests

**Goal:** `'atelier'` fully registered (TemplateId, registry async loader, templateMeta, RESOLVERS, real block manifest, service element-schema entries) with a vestria-cloned module skeleton and provisional-but-real dual block pairs so the AUTO-enrolled conformance suite passes end-to-end. **This phase FLIPS the photographer serve decision** (first non-bespoke work template declaring `gallery`) — so the broken serveGate tests are updated HERE, and the phase ends green. Mood axis dropped; everything prefixed `Atelier*`/`atelier*`/`lg-atelier-`; CSS vars stay generic (`--paper`/`--ink`/`--accent`).

**Steps:**
1. Add `'atelier'` to the `TemplateId` union in `src/types/service.ts`. tsc then FORCES entries in the four full-`Record<TemplateId,…>` maps there: `defaultVariantForTemplate` (:42), `templateLabels` (:320), `templateBlurbs` (:331), `PALETTES_BY_TEMPLATE` (:343) — plus phase 1's `TEMPLATE_AUDIENCE` (`atelier: 'service'`). (BLOCK_MOCKS / blockManifests / TEMPLATE_CATALOG / registry cache are Partial — no forced entry.) `usesTemplateModule()` needs NO edit (service blanket-true).
2. Add async loader block in `src/modules/templates/registry.ts` (dispatch firewall). **Zero edits to `componentRegistry{,.published}.ts`.**
3. Clone vestria structure → `src/modules/templates/atelier/`: `index.ts` (server-safe barrel, generic `resolveBlock` wrapper, no client re-exports), `tokens.ts` (drop mood axis), `palettes.ts` (vermilion default + 2 placeholder accents), `sectionRules.ts`, `ThemeInjector.tsx`, `resolveAtelierBlock.ts`, `components/AtelierSSRTokens.tsx`, `hooks/useAtelierBlock.ts`, `paletteSelection.ts`, `imageKeywords.ts`, `AtelierPlaceholderBlock.tsx`, `blocks/{primitives.ts,editPrimitives.tsx,publishedPrimitives.tsx,shared/styles.ts}`, `coreParity.test.ts`, `registration.test.ts`, `README.md`.
4. Provisional `.core.tsx` triads (+ `styles.ts`) for: NavHeader, Hero (static image; slider markup lands phase 9/10), Work/Gallery showcase, Packages (2–4 cards), About, QuoteBand, Contact, Footer. Structurally real (data-surface-safe, padded not margined, `lg-atelier-` classes), visually plain.
5. Register atelier layoutNames in `src/modules/audience/service/elementSchema.ts` (per phase-1 ruling — this is what makes `contractFor` resolve them). Follow service-schema precedent (hearth/lex layout entries) for shape.
6. `templateMeta` entry per key decision (capabilities `['gallery','packages','multipage']` — NO lead-form); RESOLVERS entry `{resolve, placeholder}` in `src/modules/templates/templateConformance.ts`; REAL manifest entry in `src/modules/templates/blockManifest.ts` — packages `minCards:2/maxCards:4` (scope #5 capacity enforcement), `consumes ⊆` the serviceElementSchema contract.
7. ≥2 `TemplateModule.variants[]` (typeface/spacing token overrides) — required by the module contract + picker. NOTE: this does NOT feed conformance group (c); (c) checks block-component variants per layoutName in the manifest and passes vacuously with one block per section.
8. **Serve-flip test updates (same phase as the flip, green-at-step):** `src/modules/brief/serveGate.test.ts` — (a) `:212` photographer `rungC:gallery` MANUAL expectation → now SERVE with atelier in shortlist + `audienceType:'service'` (template-derived, phase 1); (b) `:296` structureHint-invariance block — add/adjust photographer fixture so the invariance property holds across the now-serving outcome; (c) `:480` photographer-corrected-to-coach — re-verify expectations (coach path serve/service; confirm no rungC:gallery leakage now that gallery IS backed). Sweep the file for any other fixture that assumed "no template declares gallery".

**Files touched:**
- `src/types/service.ts`
- `src/modules/brief/serveGate.ts` (TEMPLATE_AUDIENCE atelier entry — forced by tsc if Record; wherever phase 1 homed the map)
- `src/modules/brief/serveGate.test.ts` (flip updates — step 8)
- `src/modules/templates/registry.ts`
- `src/modules/templates/templateMeta.ts`
- `src/modules/templates/templateMeta.test.ts` (adding `'atelier'` to `templateIds` breaks the hard-coded counts: `:21` `toHaveLength(8)`→9 and `:26` non-retired `toHaveLength(7)`→8 — separate `it` blocks from phase 3's work-core edit; update both)
- `src/modules/templates/templateConformance.ts` (RESOLVERS entry only)
- `src/modules/templates/blockManifest.ts`
- `src/modules/audience/service/elementSchema.ts`
- `src/modules/brief/serveMatrix.test.ts` (**added mid-phase, orchestrator ruling**: `:82` photographer-intents⇒MANUAL/rungC:gallery flips to SERVE — run by phase-4's `test:run -- src/modules/brief`)
- `src/modules/templates/fit.test.ts` (**pulled from phase 7 to phase 4, orchestrator ruling**: the flip makes `shortlist(work+[])` and `shortlist(work+lead-form)` `['granth']→['granth','atelier']` at `:65`/`:108`; also refresh the stale hardcoded-array assertions `:42-52`/`:111-116`/`ALL_TEMPLATES` so they don't falsely assert "gallery unsatisfiable everywhere")
- `src/modules/templates/atelier/**` (all new files, steps 3–4)

> **Orchestrator ruling (phase 4 flip blast-radius, implementer stopped pre-edit):** atelier = 2nd non-bespoke `work` template ⇒ it joins EVERY work-engine shortlist. Writer brief (requiredCapabilities:[]) now fits atelier too, so writer shortlist grows `['granth']→['granth','atelier']` — **ACCEPTED intended behavior**: pick stays granth (style literary-quiet vs atelier editorial-craft), writers still get granth; inherent to the fit(caps)/pick(style) model. serveGate.test.ts writer-shortlist assertions (`:176/:204/:262`) update to `['granth','atelier']` (in-scope, file already listed). Neither plan-review round caught the two sibling test files above.

**Verification:** `npx tsc --noEmit`; `npm run test:run -- src/modules/templates/conformance.test.ts` (atelier picked up by the auto-enrollment loop: group (a) NEW work core resolves both modes, (b) gallery+packages capabilitySections resolve with no orphans, manifest data checks incl. minCards≤maxCards + consumes⊆contract, (c)/(e) run — vacuous-pass with single blocks — plus global RESOLVERS/templateMeta/templateIds key-set parity); `npm run test:run -- src/modules/templates/atelier` (coreParity + registration); `npm run test:run -- src/modules/brief` (**fully green INCLUDING the flipped photographer cases — no deferred red**).

---

## Phase 5 — Page archetypes + multipage + photographer multi default

**Goal:** 5-page contract (Home / Work / Experiences / About / Contact) live via vestria multipage machinery (registry is template-keyed, so its product-dir location is fine for a service template — confirm at implement); photographer briefs default to multi **on the now-reachable served path** (phase 2 opened the structure slot for work+multipage). Work-engine COPY GEN stays OUT (skeleton + manual-fill).

**Steps:**
1. `ATELIER_PAGE_ARCHETYPES` in `src/modules/audience/product/pageArchetypes.ts`: Home (required; hero + work teaser + quote-band + contact CTA; header/footer chrome), Work (required; work/gallery), Experiences (packages), About (about), Contact (contact/lead-form via shared block). Fill `key/title/pathSlug/required/defaultIncluded/allowed-/required-/defaultSections` with platform-valid sectionTypes only.
2. Register in `PAGE_ARCHETYPES_BY_TEMPLATE`; `multipage` already in templateMeta (phase 4) → `getPageArchetypesForTemplate()` returns the menu.
3. Flip photographer `structureDefault: 'single'` → `'multi'` in `src/modules/businessTypes/config.ts` (~:242). Post-phase-2 this is LIVE, not inert: it's the businessType signal `isMultipage` reads inside the structure slot the served work flow now reaches.
4. Targeted tests **against the reachable served path**: (a) atelier archetype menu returned; (b) `isMultipage('atelier', {businessType:'photographer'})` true using the SAME brief-signal shape StructureSlot builds (:303-313); (c) wizard slot list for engine `'work'` + templateId `'atelier'` INCLUDES `'structure'` (phase-2 conditioning now firing on a real template); (d) `fetchStrategy` work+atelier seeds the 5 default pages.

**Files touched:**
- `src/modules/audience/product/pageArchetypes.ts`
- `src/modules/businessTypes/config.ts`
- `src/modules/businessTypes/config.test.ts` (flipping photographer `structureDefault` breaks `:104` `expect(p.structureDefault).toBe('single')` → `'multi'`; grep the file for any other photographer-single assertion)
- `src/hooks/useWizardStore.test.ts` (reachable-path cases c/d)
- existing pageArchetypes/businessTypes test file (cases a/b) — or new `src/modules/audience/product/pageArchetypes.atelier.test.ts`
- `src/modules/audience/product/pageArchetypes.test.ts` (relaxed structureDefault invariant for the photographer multi flip)
- `src/hooks/useWizardStore.ts` (**added mid-phase, orchestrator ruling — phase-2 REACHABLE BUG caught by phase-5 review**: hydrate `:732 slotsForEngine(engine, templateId, brief)` passes the RAW brief carrying the unconfirmed classify `structure.mode` hint; when the AI guesses `'single'`, slot-inclusion skips the structure slot while `GeneratingSlot` dispatch (`briefSignalFromState`, confirmed-only) still fires the skeleton → served photographer gets a broken ZERO-PAGE draft. FIX = feed `slotsForEngine` the confirmed-only signal (`briefSignalFromState(state)` / same `isConfirmedStructure` rule as :779-784), so slot-inclusion + dispatch key off the IDENTICAL signal per the :775-777 design intent. The `structureDefault→multi` flip activates this.)
- `src/modules/businessTypes/pipelineGuards.test.ts` (**added mid-phase, orchestrator ruling**: phase-2 REGRESSION — StyleSlot.tsx's `templateId === 'vestria'` render-layer gate tripped the guard; fix = add `components/onboarding/wizard/StyleSlot.tsx` to `RENDER_LAYER_ALLOWLIST` per the guard's own render-layer exception. Escaped phase-2 review — that phase's test scope was `src/hooks src/modules/wizard`, not businessTypes)

**Verification:** `npx tsc --noEmit`; `npm run test:run -- src/modules/audience/product src/modules/businessTypes src/hooks`.

---

## Phase 6 — Design system: tokens / palettes / variants / knobs / sectionRules

**Goal:** Provisional Kontur design system from spec values (Bricolage Grotesque + Hanken Grotesk, warm paper/ink, vermilion accent), all 5 knob axes declared, surfaces alternating per sectionRules. Final values refined in phase 9 against approved HTML.

**Steps:**
1. `tokens.ts`: base CSS vars (paper/ink neutrals, hairlines, type scale on Bricolage display + Hanken body, spacing, radius, section rhythm) + per-variant overrides + per-axis knob CSS values; `serializeBaseTokens/VariantOverrides`.
2. `palettes.ts`: vermilion default + 2–3 curated-accent placeholders under `[data-palette]` (final curation = phase 9 human gate).
3. `knobs` declaration on the TemplateModule (`index.ts`): all 5 axes, values ⊆ standard vocab incl. defaults; `buttonShape`/`cardStyle`/`density` real alternates; `typePairing`/`texture` default-only. Wire `serializeKnobOverrides`/`knobDataAttributes` from `src/modules/templates/shared/knobCss.ts` into `AtelierSSRTokens.tsx` + `ThemeInjector.tsx` (hearth precedent).
4. `sectionRules.ts`: `getSurfaceForSection` band alternation for the 5-page grammar.
5. Enroll `assertKnobConformance('atelier', <knobs>)` in `conformance.test.ts` (explicit opt-in line — unlike templateConformance which is auto-enrolled).

**Files touched:**
- `src/modules/templates/atelier/tokens.ts`
- `src/modules/templates/atelier/palettes.ts`
- `src/modules/templates/atelier/sectionRules.ts`
- `src/modules/templates/atelier/ThemeInjector.tsx`
- `src/modules/templates/atelier/components/AtelierSSRTokens.tsx`
- `src/modules/templates/atelier/index.ts`
- `src/modules/templates/conformance.test.ts` (knob enrollment)

**Verification:** `npx tsc --noEmit`; `npm run test:run -- src/modules/templates/conformance.test.ts` (incl. knob conformance; the two TemplateModule variants render distinct token CSS — manual eyeball, NOT a group-(c) claim).

---

## Phase 7 — Serve-gate + fit + served-path integration coverage

**Goal:** Deepen coverage of the (already-green, phase 4) photographer flip and the phase-2/5 served skeleton path end-to-end at unit level, and prove no over-serving. Tests only — no production-code changes expected.

**Steps:**
1. serveGate tests (beyond the phase-4 flip updates): photographer Brief (requiredCapabilities `['gallery']`) → `decideServe()` = SERVE with atelier in `shortlist()` **and `audienceType: 'service'`**; rungC gallery probe passes via templateMeta.
2. Negative: non-fitting Brief (required capability no template supplies / out-of-ICP businessType) → not served / atelier absent from shortlist.
3. Regression: a work Brief that picks granth still yields `audienceType: 'writer'` AND (store-level) still skips the structure slot + dispatches the writer generator (composed granth-unchanged proof across phases 1+2+4).
4. fit() test in `src/modules/templates/fit.test.ts` (file exists): `fit('atelier','work',['gallery','packages','lead-form','multipage','bilingual'])` true (bilingual via PLATFORM_CAPABILITIES; lead-form via `sharedBlockCapabilities` — the shared-block lane, NOT templateMeta).
5. Composed served-path test (store level): photographer brief → serve decision (atelier/service) → wizard slots include structure → archetype-default sitemap seeded chargeless → skeleton dispatch selected. (Pure unit composition — no browser; E2E remains phase 12/13 manual.)

**Files touched:**
- `src/modules/brief/serveGate.test.ts`
- `src/modules/templates/fit.test.ts`
- `src/hooks/useWizardStore.test.ts` (composed-path + granth regression cases)

**Verification:** `npm run test:run -- src/modules/brief src/modules/templates/fit.test.ts src/hooks`; `npx tsc --noEmit`.

---

## Phase 8 — Fonts: Bricolage Grotesque + preload + kit whitelist

**Goal:** Bricolage Grotesque self-hosted (variable woff2, `woff2-variations` weight range per Archivo/Space Grotesk precedent); Hanken Grotesk reused as-is. Preload + lint whitelist updated. Rebuild mandatory for published pages.

**Steps:**
1. Add `public/fonts/bricolage-grotesque/*.woff2` (variable opsz+wght; OFL-licensed from Google Fonts source).
2. `@font-face` block in `src/styles/fonts-self-hosted.css`.
3. `case 'atelier':` in `criticalFontHrefs` (`src/modules/templates/CriticalFontPreload.tsx`) → hero display font woff2.
4. Add `Bricolage Grotesque` to `SELF_HOSTED_FONTS` whitelist (`src/modules/engines/designKit.ts:80` — the whitelist constant is the ONE hand-edited line in that derived file) — MUST precede phase-9 `kit:lint` of designer HTML.

**Files touched:**
- `public/fonts/bricolage-grotesque/` (new woff2)
- `src/styles/fonts-self-hosted.css`
- `src/modules/templates/CriticalFontPreload.tsx`
- `src/modules/engines/designKit.ts` (whitelist line only)

**Verification:** `npx tsc --noEmit`; `npm run build` (buildAssets copies fonts CSS; confirm `public/assets/` output references new family); `npm run test:run -- src/modules/engines`.

---

## Phase 9 — 🔒 HUMAN GATE — Visual block port from approved designer HTML

**GATE (before any work):** requires (1) approved `template-design/KPDirection2Atelier.html` + `KPDirection3Kontur.html` + `atelierKonturBrief.md` delivered; (2) founder+customer Step-1 style-tile pick done; (3) `npm run kit:lint <approved.html>` PASS (data-section coverage of work core — NOTE: `'work'` section has no required data-slots since the kit derives it slotless; showcase completeness is covered by the gallery capabilitySections check + parity instead — axes structured, fonts ⊆ whitelist, self-contained); (4) founder curated-palette taste pass. Do not start without explicit sign-off.

**Goal:** Replace provisional block markup with the real Atelier×Kontur design across ALL dual pairs, keeping `.core.tsx` single-source. Hero ships slider MARKUP + data-attr contract + first-image-visible no-JS fallback (JS asset = phase 10).

**Steps:**
1. Port each section from approved HTML into its `.core.tsx` (+ `styles.ts`): NavHeader, Hero (slider frame: `data-lg-slider`, slides, arrows/dots; slide 1 visible via CSS default), Work/Gallery (reuse `EditableImageCollection.tsx` edit-side primitive), Packages (2/3/4-card, Kontur accents), About, QuoteBand (marquee playfulness), Contact (shared lead-form placement), Footer.
2. Finalize `tokens.ts`/`palettes.ts`/`sectionRules.ts` from real Kontur values; lock curated palettes per taste pass.
3. All text/images through the standard block funnel (`useAtelierBlock`/`useTemplateBlock` + published flat props) — bilingual stays free; NO twin-fields, NO `'use client'` imports into `.published`.
4. Confirm `blockManifest.ts` atelier entry (card ranges, consumes) still matches ported markup.

**Files touched:**
- `src/modules/templates/atelier/blocks/**` (all block triads + styles)
- `src/modules/templates/atelier/tokens.ts`
- `src/modules/templates/atelier/palettes.ts`
- `src/modules/templates/atelier/sectionRules.ts`
- `src/modules/templates/blockManifest.ts` (card ranges/consumes updates only)

**Verification:** `npx tsc --noEmit`; `npm run test:run -- src/modules/templates/atelier src/modules/templates/conformance.test.ts`; manual: `npm run dev` → all 5 pages render real design; published no-JS hero shows first image.

---

## Phase 10 — Hero-slider behaviors asset

**Goal:** Autoplay crossfade + arrows/dots on published static HTML via a tiny vanilla asset; editor side React hooks with IDENTICAL layout/CSS. #1 parity risk — the data-attr contract is shared; behavior implementations are the only allowed divergence.

**Steps:**
1. `src/lib/staticExport/atelierSliderBehaviors.js` — vanilla IIFE, idempotent boot guard, no-op when `[data-lg-slider]` absent (mirror `lumenBehaviors.js`).
2. `scripts/buildAssets.js` (~:51): add `{src:'atelierSliderBehaviors.js', out:'slider.v1.js'}`. Immutable filename: behavior changes post-release ⇒ `slider.v2.js`.
3. `src/lib/staticExport/htmlGenerator.ts`: `usesAtelier` flag (~:145) + gated `<script src=".../assets/slider.v1.js" defer>` (~:388) — atelier pages only.
4. Editor-side hero `.tsx` wrapper: hooks-based autoplay/controls, same DOM/classes as published (TechPremium Gallery / Lumen split precedent).
5. Unit test on htmlGenerator gating (script present for atelier project, absent for meridian/hearth) — target `src/lib/staticExport/htmlGenerator.test.ts` or the existing generateStaticHTML test file (deliberate hedge: confirm exact filename at implement).

**Files touched:**
- `src/lib/staticExport/atelierSliderBehaviors.js` (new)
- `scripts/buildAssets.js`
- `src/lib/staticExport/htmlGenerator.ts`
- staticExport test file (name confirmed at implement, see step 5)
- `src/modules/templates/atelier/blocks/Hero/` (edit wrapper hooks wiring only)

**Verification:** `npm run build` (emits `public/assets/slider.v1.js`); `npx tsc --noEmit`; `npm run test:run -- src/lib/staticExport`; manual: publish draft → slider autoplays, arrows/dots work, JS-disabled → static first image.

---

## Phase 11 — Editor basics + atelier block mocks

**Goal:** Full editor-basics contract green on atelier FOR REAL — `assertEditorBasics('atelier')` green-passes VACUOUSLY on an empty `BLOCK_MOCKS[atelier]` (templateConformance.ts:498), so authoring the mocks is the substance of this phase. Re-check the vestria Gate-0 editor punch-list on atelier.

**Steps:**
1. Author per-section atelier entries in `BLOCK_MOCKS` — **path pinned: `src/modules/templates/blockMocks/index.ts`** (reviewer-confirmed): text elements, buttons/links, image slots, and collections — including the gallery collection so add/remove/reorder is actually exercised, and the packages collection at 2/3/4 cards (re-homes the tiered-packages capacity exercise on the editor side, complementing the manifest minCards/maxCards).
2. Enroll `assertEditorBasics('atelier')` in `conformance.test.ts` (explicit opt-in line).
3. Fix atelier-side gaps it surfaces (logo upload, all text editable, image slots wired, button/link configure, nav+footer links, collection add/remove/reorder, social links, form config, knob switching) — fixes limited to atelier module files.
4. Manually re-test the 7 Gate-0 vestria editor findings on atelier (rich-text toolbar, undo/redo, section delete, section-regen). SHARED-editor-rooted failures → report to orchestrator; do not patch shared editor here.

**Files touched:**
- `src/modules/templates/blockMocks/index.ts` (atelier mock entries)
- `src/modules/templates/conformance.test.ts` (enrollment)
- `src/modules/templates/atelier/**` (gap fixes only)

**Verification:** `npm run test:run -- src/modules/templates/conformance.test.ts` fully green WITH non-empty atelier mocks (spot-check: temporarily empty the mocks → suite must exercise fewer assertions, confirming non-vacuous enrollment); `npx tsc --noEmit`; manual Gate-0 punch-list re-check noted in audit.

---

## Phase 12 — Parity enrollment + 🔒 HUMAN GATE — parity QA sign-off

**Goal:** Screenshot + content parity harnesses enrolled and green; founder signs off editor↔published parity, slider + language toggle the two declared hot spots. Absorbs the open newGeneration Gate-0 parity obligation.

**Steps:**
1. `e2e/parity.spec.ts`: add `'atelier'` to `TEMPLATES` (:18); parity mocks for every atelier section (reuse phase-11 BLOCK_MOCKS where the harness shares them); ensure `/dev/blocks/atelier` stage renders — add atelier case to `TemplateBlocksStage.tsx` IF it is template-keyed (deliberate hedge: confirm file path + keying at implement).
2. Add jsdom content-parity test `renderParity.atelier.test.tsx` (per existing `renderParity.<t>.test.tsx` pattern).
3. Run `?parityBreak=1` negative control (must exceed 0.03 threshold).
4. **HUMAN GATE:** founder parity sign-off checklist — every section pair pixel-matched; slider: autoplay + manual controls on published static HTML + no-JS static first image; bilingual: editor toggle + published `/{loc}` docs + hreflang + geo/localStorage boot via `switcher.v1.js`; knob/palette live-switch both renderers; D5 manual Dutch typography fidelity check (i18nHonesty note: "first exercised in the atelier build"). Run `/manual-test` P0 items against `npm run dev`.

**Files touched:**
- `e2e/parity.spec.ts`
- `src/app/dev/blocks/**/TemplateBlocksStage.tsx` (atelier entry, if template-keyed — exact path per existing file)
- `src/modules/templates/atelier/renderParity.atelier.test.tsx` (new; co-locate per existing pattern)

**Verification:** `npm run test:parity` green incl. negative control; `npm run test:run -- renderParity.atelier`; founder sign-off recorded in audit. Full sweep: `npx tsc --noEmit && npm run test:run && npm run build` before gate review.

---

## Phase 13 — 🔒 HUMAN GATE — Kundius EN/NL site: manual-fill + publish

**GATE:** phases 1–12 green + parity sign-off done. Content/ops only — **ZERO platform code, zero Kundius-named field/file/branch** (spec acceptance).

**Steps:**
1. Onboard Kundius as photographer Brief → serve gate offers atelier (**service audience**, phase 1 routing) → wizard reaches the STRUCTURE slot with atelier's 5-page archetype menu (phase 2 + 5; default = all 5 pages, photographer `structureDefault:'multi'`) → confirm → **skeleton path** builds the empty 5-page draft (zero credits, zero copy — phase 2) → editor.
2. Manual-fill EN base content in editor; NL via LocaleSettings + `localeContent` overlay; hand-work around v1 i18n gaps (nav labels, collection-item text, form labels, media locale-shared).
3. Publish; verify `/{loc}` docs, hreflang, geo default + toggle, per-host sitemap, form submit → lead email, slider on live static HTML.
4. Custom domain: deferred until customer ready (none live today); blog-track gate #8 note does not apply (no blog).

**Files touched:** none (content + publish ops only; audit.md records checklist results).

**Verification:** manual acceptance checklist — 5-page EN/NL published, toggle + geo default work, slider correct on live HTML, "founder would NOT have intervened" self-serve quality bar; founder sign-off.

---

## Post-plan notes

- **Merge to main = human gate** (pipeline rule): serve-gate flip, template-derived serve audienceType, the served work→skeleton wizard path, and photographer `structureDefault:'multi'` go live to prod behavior at merge — call out at merge review.
- Rebuild reminder: fonts (phase 8) + slider asset (phase 10) only reach published pages after `npm run build`.
- Lumen untouched (retires as bespoke-off separately).
- Deliberate filename hedges kept (confirm at implement): staticExport htmlGenerator test file (phase 10 step 5), `TemplateBlocksStage.tsx` path/keying (phase 12 step 1). `blockMocks` path is PINNED (`src/modules/templates/blockMocks/index.ts`).

## Unresolved questions

1. **Served work→skeleton wizard path (phase 2) — TOP question:** spec fenced "work copy-gen OUT"; skeleton (no copy) added to make the served 5-page manual-fill flow real. Confirm acceptable, vs deferring served-flow entirely + building Kundius via direct editor?
2. audienceType ruling: atelier = service + serve audience keyed off picked template (granth stays writer) — confirm? (plan-of-record proceeds regardless)
3. New sectionTypes (`work`/`packages`/`quote-band`): reuse existing platform types (gallery/pricing/testimonial?) or add new — implementer audits phases 3/5; founder preference?
4. Looks (List-3): skip for v1 confirmed, or picker needs ≥1 look entry?
5. Photographer `structureDefault → 'multi'`: confirm — affects ALL future photographer briefs, not just Kundius.
6. Skeleton path + `theWork` uploads: seed Work-page gallery from wizard uploads, or ignore uploads on skeleton path (fill in editor)?
7. Gate-0 editor punch-list (toolbar/undo/delete): fix inside this build if they hit atelier, or separate track?
8. Bricolage Grotesque woff2: who sources file (Google Fonts OFL assumed fine)?
9. Kundius NL v1 gaps (nav/form labels + media locale-shared): acceptable for launch or hand-fill workaround?
10. Designer HTML ETA — phase 9 blocked until delivered; proceed phases 1–8 meanwhile?
