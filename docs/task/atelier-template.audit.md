# atelier-template — audit

## Phase 1 — audienceType ruling + serve-route reconciliation

### Files changed
- `src/modules/brief/serveGate.ts` — added `TEMPLATE_AUDIENCE` map; `decideServe()` serve branch now derives `audienceType` from the picked template.
- `src/modules/brief/serveGate.test.ts` — added a `TEMPLATE_AUDIENCE` derivation describe block; extended imports.

`src/types/service.ts` was NOT touched — the map homed cleanly in serveGate.ts (both `TemplateId` and `AudienceType` already imported there), so no natural reason to relocate it.

### What changed + why
- **`TEMPLATE_AUDIENCE: Record<TemplateId, AudienceType>`** added right after `BRIDGEABLE_ENGINES`. A FULL Record (not Partial) so tsc will FORCE the `atelier: 'service'` entry when the `TemplateId` union grows in phase 4. Values mirror today's engine→audience result exactly: trust-engine (hearth/lex/surge/lumen)→`service`, thing-engine (meridian/techpremium/vestria)→`product`, work-engine granth→`writer`.
- **`decideServe()` serve branch** now hoists the pick into `const pickedTemplateId = pickTemplate(brief, sl)` (single pick — reused for both fields, no second `pickTemplate` call) and returns `audienceType: TEMPLATE_AUDIENCE[pickedTemplateId] ?? BRIDGEABLE_ENGINES[engine]`. The `??` fallback never fires today (Record is total) but keeps `engine` referenced and is the documented safety net. Net observable behavior: byte-identical to before.

### Where the map is homed
`src/modules/brief/serveGate.ts`, immediately after `BRIDGEABLE_ENGINES`. Exported for testability.

### Premise-verification findings (read-only)
1. **`usesTemplateModule()`** (`src/types/service.ts:79-89`) — blanket-true for `audienceType === 'service'` (line 84). No per-id whitelist for service (only product has `PRODUCT_TEMPLATE_MODULE_IDS`). CONFIRMED: atelier as service needs no whitelist edit.
2. **`contractFor()`** (`src/modules/templates/templateConformance.ts:143-148`) — consults `resolveEngineSectionSchema` then `productElementSchema ?? serviceElementSchema`. Never `writerElementSchema`. CONFIRMED: atelier layouts registered in serviceElementSchema (phase 4) will let `consumes ⊆ contract` resolve.
3. **Consumer grep (`BRIDGEABLE_ENGINES`)** — the ONLY production reader is `serveGate.ts` (now line ~239). Sole authoritative consumer of `decision.audienceType` is `src/app/api/brief/confirm/route.ts:78` (writes `audienceType: decision.audienceType` to the project). No other site recomputes engine→audience. Remaining references are the test file + `serveGate` README doc line. CONFIRMED: changing the derivation inside `decideServe` is sufficient; no downstream recompute to reconcile.

### Tests added (serveGate.test.ts)
New `describe('TEMPLATE_AUDIENCE …')` block:
- map equals the expected full literal;
- map is total over `templateIds` (forces future entries);
- for every current template, `TEMPLATE_AUDIENCE[id] === BRIDGEABLE_ENGINES[engineOfTemplate[id]]` — proves the picked-template derivation is byte-identical to the old engine derivation across all three engines;
- a served work brief that picks granth still yields `audienceType: 'writer'`.
No photographer flip / SERVE case added (atelier not declared yet — photographer still routes MANUAL; existing outcomes unchanged).

### Commands run + results
- `npx tsc --noEmit` — my touched files produce ZERO errors (filtered grep for serveGate/brief/confirm/types-service = empty). PASS for this phase's scope. NOTE: pre-existing, unrelated errors exist in `src/app/api/saveDraft/route.ts` (`aiBaseline`/`editDelta` not on the Prisma client) — a stale/undgenerated Prisma client (the Worktree Prisma pitfall in MEMORY), NOT introduced by this phase; out of files-touched, left alone.
- `npm run test:run -- src/modules/brief` — **PASS: 5 files, 122 tests passed.** All existing serve decisions byte-identical (green) + new derivation cases pass.

### For the next phase (phase 4)
- Adding `'atelier'` to the `TemplateId` union will make tsc FORCE an `atelier: 'service'` entry in `TEMPLATE_AUDIENCE` (as designed) alongside the four service.ts full-Records the plan already lists.
- The `TEMPLATE_AUDIENCE` test's `.toEqual({...})` literal and the `engineOfTemplate` map in the derivation-parity test are hard-coded to the current 8 templates — phase 4 must add `atelier: 'service'` to both (atelier's engine = `work`, but it maps to `service`, so the parity test's `engineOfTemplate` assumption BREAKS for atelier — atelier is exactly the template that deviates from `BRIDGEABLE_ENGINES[engine]`; phase 4 should exclude atelier from that parity assertion or special-case it).
- Serve-flip test updates for the photographer path land in phase 4 (per plan), not here.

### Open risks
- Pre-existing `saveDraft` Prisma-client tsc errors remain in the tree (environment/Prisma-generation, not this phase). If phase 4 runs a full `tsc`, expect them until `prisma generate` is re-run.

---
### Phase 1 — impl-review verdict: SHIP (1 loop)
No blocking issues. Gates green: tsc exit 0, brief suite 122/122. Scope clean (service.ts untouched).
Non-blocking (carry to phase 4): parity test `engineOfTemplate` hand-feeds lumen:'trust' (lumen real engine = 'work', templateMeta.ts:177) + techpremium rows → those 2 rows self-satisfy the parity assertion (harmless: both bespoke/retired, excluded by fit(), never picked). Stronger form = derive engine from templateMeta.copyEngines + skip bespoke/retired. Also: lumen already deviates (work→service) today, so atelier is NOT the first deviation — fix that framing when adding atelier:'service'.

---

## Phase 2 — Served work→multipage skeleton wizard path

### Files changed
- `src/hooks/useWizardStore.ts` — template-aware structure skip + fetchStrategy work+multipage seed branch + exported `briefSignalFromState`.
- `src/hooks/useWizardStore.test.ts` — slot-inclusion cases + phase-2 skeleton-path describe.
- `src/components/onboarding/wizard/GeneratingSlot.tsx` — skeleton dispatch gate + `pages` projection + `isWorkMultipage`.
- `src/components/onboarding/wizard/StructureSlot.tsx` — work-grammar SECTION_LABELS + work-engine microcopy.
- `src/components/onboarding/wizard/StyleSlot.tsx` — vestria-picker gate re-keyed to `templateId === 'vestria'`.
- `src/modules/wizard/generation/work.ts` — `WorkGenerationInput.pages` + new `runWorkSkeleton`.

### What changed + why (and how each gate keys on isMultipage → granth-unchanged)
Every new branch is gated on `isMultipage(templateId, briefSignal)` — the PICKED template's `multipage` capability — never on `engine === 'work'`. Granth declares no `multipage` (templateMeta), so `isMultipage('granth', …)` is `false` and each gate below is inert for granth.

1. **`slotsForEngine(engine, templateId, briefSignal)`** — was pure engine → `getContract(engine).slotSkips`. Now builds a `Set` of skips and, for `engine === 'work' && isMultipage(...)`, deletes `'structure'`. Granth: gate false → skip retained → structure still absent from `slots`. Called once (hydrate), which now passes `templateId` + the full `brief` as the signal. Comment updated ("work keeps its skip UNLESS the picked template is multipage").
2. **`fetchStrategy` work+multipage branch** — inserted BEFORE the `engine !== 'thing' && 'trust'` early-return, AFTER the existing `if (s.strategy)` early-exit. For `work + isMultipage`: seeds `sitemap` from `getPageArchetypesForTemplate(templateId)` `defaultIncluded` pages (proof-filtered via `filterSectionsByProof`, mirroring StructureSlot.addPage), sets `strategyStatus='done'`, NO fetch, NO charge, and returns. Idempotent via the existing top-of-fn `'done'` guard. Granth: gate false → falls through to the unchanged `engine !== thing/trust` early return (byte-for-byte). `strategy` stays `null` on this path (copy-gen stays OUT).
3. **StructureSlot** — verified the strategy-less path: mount effect fires `fetchStrategy` only on `'idle'`; after seeding, `strategyStatus==='done'` + `strategy===null` + `sitemap` set means the `:323` error guard, `:370` loading guard (`!strategy && (idle|fetching)` → false), and `:500` `!draft` guard all pass through to the multipage editor (draft = storeSitemap). Only additions: `work`/`packages`/`quote-band` in `SECTION_LABELS`; the multipage header `<p>` is now `engine === 'work'`-aware ("we'll set up an empty page for each so you can fill it in the editor") for the no-copy path.
4. **GeneratingSlot** — new gate at the top of `run()` (after the tokenId guard): `engine === 'work' && isWorkMultipage()` → `setStage('saving')` → `runWorkSkeleton(input, {onStage})` → route to `result.redirectTo || /edit/${tokenId}`. The MIN_WORKS guard now sits BELOW this branch (generator path only). Granth: `isWorkMultipage()` false → skips skeleton → MIN_WORKS guard + `runGeneration('work')` exactly as before. Did NOT touch the credits-error "Continue without copy" bare redirect.
5. **StyleSlot** — `showVestriaPickers` changed from `isMultipage(templateId)` to `templateId === 'vestria'`. Rationale: HeroVariantPicker/ProductStylePicker are `VestriaHeroVariant`-typed and vestria-only; a multipage WORK template (atelier) must not surface them. vestria=true / granth=false unchanged; atelier=false (falls to the "clean default theme" note). Removed the now-unused `isMultipage` import.
6. **work.ts `runWorkSkeleton`** — plain module (no store import; slot hands it plain data). Builds the draft via the EXISTING `buildMultiPageSkeleton`, then `mergePageIntoFinalContent` per confirmed page with `copy: {}` (empty elements; home gets header/footer chrome + flat top-level), then `finalizeMultiPageGeneration(fc)` to drop the in-progress marker so the draft loads as an ordinary editable multipage draft (not a resumable generation), then `saveDraft`. Returns the shared `{status, redirectTo}`. Existing `runWorkGeneration` untouched. No templateId-guard (unlike the granth generator) — the skeleton materializes whatever confirmed template+pages carry.

### WorkGenerationInput extension shape
Added one optional field: `pages?: SitemapPage[]` (imported `type SitemapPage` from `@/types/product`). GeneratingSlot's `buildWorkInput()` projects `pages: (s.sitemap as SitemapPage[] | null) ?? []`. The granth generator ignores it (single-page work has null sitemap → `[]`). Chose to EXTEND the existing input (not a separate type) so the slot's single `buildInput`/`buildWorkInput` projection feeds both paths.

### Uploads-seeding choice (unresolved Q#6)
IGNORED `theWork` uploads on the skeleton path — the Work page's gallery is left EMPTY for manual fill in the editor. Rationale: conservative + the skeleton is a "manual-fill now" deliverable; the gallery collection is authored in the editor. `runWorkSkeleton` does not read `input.works`. If founder wants uploads pre-seeded into the Work-page gallery collection, that is an additive follow-up (would require the atelier Work section's collection contract, which lands phase 4/5).

### Deviations
- None material. StructureSlot needed NO guard-logic change (guards already tolerated `strategy===null` + `strategyStatus==='done'`), so the change there was limited to labels + microcopy — narrower than "verify guards" might have implied.

### Test (e) realization
No GeneratingSlot/StructureSlot test file exists, so the dispatch gate (e) is proven at the DECISION level in `useWizardStore.test.ts`: `isMultipage(templateId, briefSignalFromState(state))` = true for work+vestria, false for work+granth — the exact expression GeneratingSlot's `isWorkMultipage()` evaluates.

### Commands + results
- `npx tsc --noEmit` → EXIT 0 (clean; no Prisma-client errors surfaced this run).
- `npm run test:run -- src/hooks src/modules/wizard` → PASS: 15 files, 259 tests.
- Manual smoke (writer/granth onboarding) not run in this session; granth-path regression covered by unit tests (slot skip retained, fetchStrategy early-return unchanged, dispatch gate false).

### For phases 4 & 5 (must know)
- **This path goes LIVE the moment atelier declares `multipage` in templateMeta (phase 4) + registers `ATELIER_PAGE_ARCHETYPES` (phase 5).** Until then, no template is work+multipage, so every gate is inert and runtime behavior is identical everywhere (tests use vestria as a synthetic stand-in).
- **Layout resolution gap:** `runWorkSkeleton` → `mergePageIntoFinalContent` → `selectProductBlocks`, whose `LAYOUTS_BY_TEMPLATE` is product-only (vestria) and falls back to `MERIDIAN_LAYOUT_NAMES`, then to `'default'` per section. For atelier (service) sections (`work`/`packages`/`quote-band`), layout names will resolve to `'default'` unless phase 4/5 wires atelier layout mappings into the block-selection path so the skeleton's sections map to real atelier blocks. Flag for phase 5 (multipage machinery wiring).
- **Test fixtures to update in phase 4:** the phase-2 tests use `vestria` as the synthetic work+multipage template. Once `atelier` exists, add atelier-based assertions (and phase 5 adds the reachable-path cases c/d against the real archetype menu).
- `briefSignalFromState` is now exported from useWizardStore — reuse it (don't re-inline) in any further served-path detection.

---
### Phase 2 — impl-review verdict: SHIP (1 loop)
No blocking issues. Gates green: tsc exit 0, hooks+wizard 259/259. Scope = 6 files, no creep. Granth byte-unchanged invariant verified against actual code paths (skip retained, fetchStrategy falls to unchanged early-return, MIN_WORKS + writer generator still reached).
Non-blocking carried: (1) slot-inclusion uses full `brief` signal, fetchStrategy/dispatch use `briefSignalFromState(store)` — coincide for granth; phase 5 must prove atelier's two derivations agree. (2) `buildWorkInput` projects `pages` unconditionally — harmless (granth generator ignores it). (3) `selectProductBlocks` product-only → atelier sections fall to 'default' UNTIL phase-4 `blockManifests['atelier']` manifestPick resolves them (runtime-inert now, cleanly fixable).

---

## Phase 3 — Work-grammar generalization (G1, granth-safe) — ⚠️ STOPPED, blast radius outside Files-touched

### Files changed (in-scope edits made)
- `src/modules/engines/coreSections.ts` — `engineCoreSections.work` changed from `['hero','about','books','writing','praise','footer']` to `['hero','work','about','footer']`; rewrote the "revisit work-core" comment (atelier = the anticipated second shortlist-eligible work template; notes granth resolves `work` via alias, visuals byte-unchanged).
- `src/modules/templates/granth/resolveGranthBlock.ts` — added string-keyed `work` alias entry → granth's existing books/portfolio pair (`GranthBooks` / `GranthBooksPublished`), both edit + published. No union surgery; no new granth visuals.
- `src/modules/templates/templateMeta.test.ts` — updated the work-core freeze assertion (~:87) to the new 4-item list.

### New core list (exact)
`work: ['hero', 'work', 'about', 'footer']`

### Granth alias mechanism
`GRANTH_BLOCK_REGISTRY['work'] = { edit: GranthBooks, published: GranthBooksPublished }` — the same component pair as `books`. So `resolveGranthBlock('work','edit')` and `('work','published')` return granth's real books/portfolio (work-showcase) components, NON-placeholder. Granth already resolves `hero`/`about`/`footer` (existing registry entries), so only `work` is new. **Granth-safety PROVEN:** conformance group (a) for granth (requires resolving every section in the new core in both modes) passes — see test results below (templates suite fully green).

### Grep results — all `engineCoreSections.work` readers
- `templateMeta.test.ts:87` — hard-coded work-core assertion → **UPDATED** (now green).
- `conformance.test.ts:192` — filters over `.work` to prove lumen fails core (lumen has no `work` key → still in `missing`, `missing.length > 0` holds) → **verify-only, still green.** (Stale explanatory comment "granth's canonical 6 — lumen has no books/writing/praise" left untouched — out of files-touched; non-load-bearing.)
- `templateConformance.ts:251` — generic loop → verify-only, green.
- `fit.ts:165` — flattens all cores → verify-only, green.
- `sectionGrammar.ts:94` — generic → verify-only, green.
- `TemplateSwapList.tsx:91` — `engineCoreSections[engine] ?? []` → verify-only, green.
- `swap.test.ts`, `structureConvergence.test.ts`, `designKit.test.ts:118` — reference `.thing`/`.trust` only → unaffected.
- **`inputContracts.ts:239` (`lockedSectionsForEngine`)** — generic filter → itself fine.
- **`inputContracts.test.ts:48-62` ("core-section alignment") — BREAKS. See blocker below.**

### 🛑 BLOCKER — requires edit outside Files-touched (STOPPED per phase instructions)
`inputContracts.test.ts` asserts every work-engine CONTRACT field's `section`/`dropTarget` is ⊆ `engineCoreSections.work`. The **work engine contract (`workContract` in `inputContracts.ts`)** — the granth WRITER wizard contract — still keys fields to the removed writer sections:
- `theWork.section = 'books'` (line 195)
- `genresStyle.section = 'writing'` (line 196)
- `praise.section = 'praise'` + `praise.dropTarget = 'praise'` (line 206)

Removing `books`/`writing`/`praise` from core makes these fields no longer ⊆ core → **2 tests fail**:
- `work field sections are ⊆ engine core sections` (:52)
- `work dropTargets are ⊆ engine core sections` (:59)

This is NOT union surgery and NOT a hard-coded old-core fixture — the test invariant is legitimate; the true fix is editing **`src/modules/engines/inputContracts.ts`** (production data: the writer wizard's field→section mapping), which is **outside this phase's Files-touched list** and would alter granth's writer wizard drop-target/section wiring (behavior risk to granth). Per instructions I did NOT edit it and did NOT apply the fallback.

**Key finding — the plan's documented fallback does NOT resolve this.** Shrinking core to `['hero','about','footer']` (plan's fallback) ALSO omits `books`/`writing`/`praise`, so the SAME two contract-alignment assertions still fail. The failure is independent of which generalized core is chosen; it stems from the work engine contract being coupled to the old writer-shaped section names. Both plan-review and the phase-3 "verify-only" classification of `inputContracts.ts`+its test missed this coupling.

### Options for orchestrator (not applied — decision needed)
1. **Add `inputContracts.ts` + `inputContracts.test.ts` to Phase 3 Files-touched** and re-key the writer contract's field sections to the generalized core (e.g. `theWork.section: 'books'→'work'`, `praise` section/dropTarget → `'work'` or drop, `genresStyle.section: 'writing'` → drop/`'work'`). Requires care: these feed granth's wizard drop-targets and section rendering — must prove granth writer flow unchanged. This is the cleanest but expands scope into production data.
2. **Relax the invariant** so contract field sections may reference engine-specific sections beyond the generalized core (granth's `books`/`writing`/`praise` are legit granth sections, just not conformance-core). Smaller code change, but weakens a real guard; still needs `inputContracts.test.ts` in scope.
3. Decouple: keep a separate "writer contract sections" set from the conformance core. Largest change.

### designKit / slotless `work`
Did NOT edit `designKit.ts` (pure derivation). Did NOT yet run `npm run kit:generate` (deferred pending the blocker resolution, since the emitted work brief depends on the final core shape). Per key decision, the new `work` sectionType has no granth layout → `designKit(work)` will emit it **slotless**; consequence: handoff lint has no required data-slots for the showcase section (accepted — gallery capabilitySections + parity cover it). No committed granth kit/golden fixture found asserting the section list (`designKit.test.ts` loops generically; kit markdown lives in gitignored `template-design/`). Will confirm the slotless eyeball once core shape is final.

### Commands
- `npx tsc --noEmit` → **PASS (exit 0)** with all in-scope edits.
- `npm run test:run -- src/modules/templates` → **PASS** (granth auto-enrolled conformance + templateMeta work-core green against new core; alias proven).
- `npm run test:run -- src/modules/engines` → **FAIL: 2 tests** in `inputContracts.test.ts` (the blocker above); 975 passed, 8 skipped otherwise.
- `npm run kit:generate` → deferred (see above).

### Status
In-scope edits complete and green in isolation (templates suite). Phase cannot finish green because closing the engines suite requires an out-of-scope edit to `inputContracts.ts`. Edits left in place on-branch (uncommitted) for orchestrator review; awaiting decision on option 1/2/3.

---

### Phase 3 — RESOLVED (orchestrator ruling: Option 2, invariant relaxation)

**Ruling applied:** `src/modules/engines/inputContracts.ts` kept BYTE-UNCHANGED (granth writer flow untouched). Confirmed: `git diff src/modules/engines/inputContracts.ts` = empty; `git status` shows it NOT modified. The `workContract` field→section mappings (`theWork→books`, `genresStyle→writing`, `praise→praise`/dropTarget `praise`) are granth's WRITER-wizard sections — legitimate granth sections that atelier need not render (atelier uses the phase-2 skeleton path, never these copy fields). Only the stale test invariant was fixed.

**Files changed (this resolution): `src/modules/engines/inputContracts.test.ts` only.**
- Relaxed the "core-section alignment" invariant. Added a documented per-engine allowlist constant inside the describe:
  ```
  const CONTRACT_EXTRA_SECTIONS: Record<CopyEngine, readonly string[]> = {
    thing: [], trust: [], work: ['books', 'writing', 'praise'],
  };
  ```
- Both `it.each` checks (field `section` and `dropTarget`) now assert membership in `new Set([...engineCoreSections[engine], ...CONTRACT_EXTRA_SECTIONS[engine]])` instead of core alone.
- **WHY:** `engineCoreSections.work` is now the minimal, template-agnostic conformance core (every work template must resolve `hero/work/about/footer`). The old invariant was written under the OLD semantics where the work core WAS granth's full writer section list — now stale. Consistent with existing codebase precedent (coreSections.ts note: "pricing and cta are meridian-specific extras, not engine guarantees"). Typo-catching value preserved: anything outside core∪extras still fails.

**Final phase-3 Files-touched set (all in scope):**
- `src/modules/engines/coreSections.ts`
- `src/modules/templates/granth/resolveGranthBlock.ts`
- `src/modules/templates/templateMeta.test.ts`
- `src/modules/engines/inputContracts.test.ts` (invariant relaxation — NOT inputContracts.ts)

**Verification (all green):**
- `npx tsc --noEmit` → EXIT 0.
- `npm run test:run -- src/modules/templates` → 23 files, 802 passed / 8 skipped (granth conformance + templateMeta green).
- `npm run test:run -- src/modules/engines` → 4 files, 175 passed (ALL green, incl. inputContracts.test.ts).
- `npm run kit:generate` → eyeballed. Granth brief emits `### \`work\`  _(source: legacy-layout)_` with `_No slots derivable (unmapped section)._` — slotless `work` section is PRESENT and expected/accepted (new work sectionType has no granth layout mapping; gallery capabilitySections + parity cover it). No new out-of-scope edit forced.

**inputContracts.ts diff confirmation:** empty (byte-unchanged, granth writer flow intact).

---
### Phase 3 — impl-review verdict: SHIP (1 loop + 1 orchestrator ruling)
No blocking issues. Gates green: tsc exit 0; templates+engines 977 passed/8 skipped. Scope = 4 source files, inputContracts.ts confirmed byte-unchanged. Granth-safety proven: 'work' alias→GranthBooks/GranthBooksPublished (real pair); granth's GENERATED section list comes from granthSeed not engineCoreSections (reviewer gate-6 trace), so unaffected. Allowlist work:['books','writing','praise'] exactly matches workContract's beyond-core refs — not over/under-broad; typos still fail.
Non-blocking: slotless 'work' kit section (accepted per ruling — designer-handoff artifact, not runtime).

---
### Phase 4 — atelier registration + service element schema + provisional blocks + serve-flip

**Files changed (complete scope for review):**
- `src/types/service.ts` — `'atelier'` added to `templateIds`; entries in the four forced Records (`defaultVariantForTemplate: 'editorial'`, `templateLabels`, `templateBlurbs`, `PALETTES_BY_TEMPLATE`); new `atelierPalettes`/`AtelierPalette` (vermilion default + indigo/olive placeholders).
- `src/modules/brief/serveGate.ts` — `TEMPLATE_AUDIENCE.atelier = 'service'` (the work→service deviation).
- `src/modules/brief/serveGate.test.ts` — TEMPLATE_AUDIENCE map assertion +atelier; parity-table test rewritten (derive engine from `templateMeta.copyEngines`, skip retired, special-case lumen+atelier as work→service, corrects the phase-1 lumen:'trust' mislabel); photographer flip MANUAL→SERVE/service/atelier; writer-shortlist assertions `['granth']`→`['granth','atelier']` (F15 + writer-serve); photographer added to structureHint-invariance fixtures.
- `src/modules/brief/serveMatrix.test.ts` *(orchestrator-added to scope)* — photographer rows flipped to SERVE/service/atelier.
- `src/modules/templates/fit.test.ts` *(orchestrator-added to scope)* — `ALL_TEMPLATES` +atelier; photographer-gallery, work+[], work+lead-form shortlist expectations refreshed; the "gallery unsatisfiable everywhere" assertion rewritten to "only atelier on work, nobody on trust"; fitsBrief loop uses ALL_TEMPLATES.
- `src/modules/templates/registry.ts` — atelier async loader (dispatch firewall).
- `src/modules/templates/templateMeta.ts` — atelier entry: `copyEngines:['work']`, `capabilities:['gallery','packages','multipage']` (NO lead-form), `capabilitySections:{gallery:'work',packages:'packages'}`, `designStyles:['editorial-craft']`.
- `src/modules/templates/templateMeta.test.ts` — count assertions 8→9 (keys) and 7→8 (non-retired).
- `src/modules/templates/templateConformance.ts` — RESOLVERS atelier entry + imports (resolver + placeholder).
- `src/modules/templates/blockManifest.ts` — real `atelierManifest` (8 sections, one variant each; packages `minCards:2/maxCards:4`; consumes = each layout's top-level scalar keys).
- `src/modules/audience/service/elementSchema.ts` — 8 Atelier-named layouts.
- `src/modules/templates/atelier/**` — new module (vestria clone, mood axis dropped): tokens, palettes, sectionRules, imageKeywords, paletteSelection, ThemeInjector, components/{AtelierSSRTokens,AtelierEditable}, hooks/useAtelierBlock, AtelierPlaceholderBlock, resolveAtelierBlock, index; blocks/{primitives,editPrimitives,publishedPrimitives,shared/styles}; 8 provisional triads (Header/Hero/Work/Packages/About/Quote/Contact/Footer × core+tsx+published+styles); coreParity.test, registration.test, README.

**Section types → layoutNames (two-identifier discipline, hyphen-free types):**
| sectionType | layoutName | resolveAtelierBlock key | elementSchema key | manifest key | capabilitySections |
|---|---|---|---|---|---|
| header | AtelierNavHeader | header | AtelierNavHeader | header | — |
| hero | AtelierHero | hero | AtelierHero | hero | — (work core) |
| work | AtelierWorkGallery | work | AtelierWorkGallery | work | gallery→work |
| packages | AtelierPackages | packages | AtelierPackages | packages | packages→packages |
| about | AtelierAbout | about | AtelierAbout | about | — (work core) |
| quote | AtelierQuoteBand | quote | AtelierQuoteBand | quote | — |
| contact | AtelierContact | contact | AtelierContact | contact | — |
| footer | AtelierFooter | footer | AtelierFooter | footer | — (work core) |
- Dispatch is by lowercase sectionType; schema/manifest use the PascalCase layoutName; `contractFor(layoutName)` resolves via serviceElementSchema (resolveEngineSectionSchema returns null for atelier). `manifest.consumes ⊆ contract` verified by conformance group (3). Work core (`hero/work/about/footer`) all resolve real in both modes (group a). capabilitySections values are SECTION TYPES (`work`,`packages`), resolved real by (b)/(b+).
- **The quote band is sectionType `quote`, NOT `quote-band`** — `extractSectionType` matches `^[a-zA-Z]+`, so a hyphenated type would dispatch as `quote` and break the id round-trip. Conservative single-token choice; logged under Deviations.

**serveGate parity-table fix:** the phase-1 hand-fed `engineOfTemplate` map (lumen:'trust', +techpremium rows) was replaced by deriving each engine from `templateMeta.copyEngines[0]`, skipping retired templates, and encoding the deviating pair `{lumen, atelier}` (both work-engine→service-audience) as an explicit `service` assertion. This corrects the lumen mislabel and the "atelier is first to deviate" framing (lumen already deviated).

**Photographer flip is GREEN in-phase:** serveGate.test.ts (serve/service/atelier, shortlist `['atelier']`), serveMatrix.test.ts (all photographer intents serve), fit.test.ts (atelier the sole work+gallery fit) all pass. No deferred red.

**DesignStyle chosen:** `editorial-craft` (existing closed-vocab value; matches `businessTypes.photographer.defaultStyle`, so the served photographer's shortlist pick resolves to atelier by style — while writer briefs still pick granth via `literary-quiet`).

**Deviations:**
- Quote band sectionType = `quote` (not `quote-band`) — extractSectionType constraint (above).
- Writer shortlist now `['granth','atelier']` (was `['granth']`): atelier fits any work brief (no required caps); pick stays granth by style. Orchestrator-confirmed acceptable.
- Scope EXPANDED by orchestrator ruling to include `fit.test.ts` + `serveMatrix.test.ts` (the deliberate serve-flip breaks them; both are run by the phase's own verification commands). Surfaced and confirmed before editing.
- `features` (packages string[]) rendered statically this phase (not per-item editable) — rich editing lands phase 9/11. Provisional-block scope.
- No knobs declared (phase 6); no lead-form capability (shared-block lane); atelier registry loader omits `knobs` like surge/lex.

**Test results (all PASS):**
- `npx tsc --noEmit` — exit 0.
- `test:run src/modules/templates/conformance.test.ts` — 371 passed, 8 skipped.
- `test:run src/modules/templates/atelier` — 55 passed.
- `test:run src/modules/brief` — 123 passed (incl. flipped photographer/writer cases).
- `test:run src/modules/templates` — 904 passed, 8 skipped (incl. publishedClientBoundary — no 'use client'→published import leaks).
- Collateral check `test:run src/types src/modules/audience/service src/modules/engines` — 234 passed.

**Notes for later phases:**
- Phase 5: `blockManifests['atelier']` layout names (AtelierWorkGallery/AtelierPackages/AtelierQuoteBand) resolve real via the manifest, so `selectProductBlocks`→`selectEligibleBlock` no longer falls to `'default'` for atelier work/packages/quote sections — verify at phase 5. Archetype `defaultSections` must use these sectionTypes (`work`,`packages`,`quote`,`contact`).
- Phase 6: tokens/palettes/variants are provisional; `atelier` uses generic CSS vars + `lg-atelier-` classes; 2 variants (`editorial` default, `compact`) with distinct typeface/spacing overrides already declared. Knobs to be added (all 5 axes rule).
- Phase 9: blocks are provisional (Hero static image — slider markup here; contact has form_id in contract but no shared lead-form placement yet; packages `features` not per-item editable). `AtelierEditable` does NOT emit `data-edit-primitive` markers yet → BLOCK_MOCKS[atelier] empty, so assertEditorBasics green-passes vacuously until phase 11.
- Bricolage Grotesque referenced in tokens.fontDisplay but not self-hosted until phase 8 (falls back to Hanken meanwhile).

---
### Phase 4 — impl-review verdict: SHIP (1 loop + 1 orchestrator ruling)
No blocking issues. Gates green: tsc exit 0; templates+brief+audience/service = 1076 passed/8 skipped. Scope = 12 modified + atelier/** (51 files); componentRegistry{,.published}.ts untouched. Verified: dual-renderer discipline (Hero/Work/Packages triads pure-core, boundary-safe; coreParity + publishedClientBoundary tests cover atelier non-vacuously); conformance non-vacuous (all core+capability sections resolve REAL components, not placeholder); two-identifier consistency across resolve/meta/manifest/sectionRules/elementSchema; quote (not quote-band) everywhere; flip correct (photographer SERVE/service, writer shortlist ['granth','atelier'] pick=granth, parity-table lumen:'trust'→work corrected).
Non-blocking (cosmetic): serveGate.test.ts:120 stale comment (photographer-contrast obsolete post-flip). Leave; note for phase 7 sweep.

---
### Phase 5 — Page archetypes + multipage + photographer multi default

**Files changed**
- `src/modules/audience/product/pageArchetypes.ts` — added `ATELIER_PAGE_ARCHETYPES` (5 defs) + registered in `PAGE_ARCHETYPES_BY_TEMPLATE`.
- `src/modules/businessTypes/config.ts` — photographer `structureDefault` `'single'`→`'multi'`.
- `src/modules/businessTypes/config.test.ts` — `:104` assertion `'single'`→`'multi'`.
- `src/modules/audience/product/pageArchetypes.test.ts` — relaxed the structureDefault invariant (photographer now multi alongside manufacturer). [see Deviations]
- `src/hooks/useWizardStore.test.ts` — photographer+atelier fixture + phase-5 describe (cases c/d + signal-consistency CARRY).
- `src/modules/audience/product/pageArchetypes.atelier.test.ts` — NEW (cases a/b + block-resolution CARRY proof).
- `src/modules/businessTypes/pipelineGuards.test.ts` — allowlisted StyleSlot.tsx (orchestrator ruling; see below).
- `src/hooks/useWizardStore.ts` — hydrate now feeds `briefSignalFromState(state)` (confirmed-only signal) to `slotsForEngine`, not the raw brief (fix-first bug; see below).

**The 5 archetypes** (all `defaultIncluded`; body sectionTypes cross-checked against `resolveAtelierBlock` registry — every one resolves a REAL atelier block in both modes, none hits `AtelierPlaceholderBlock`):
- **home** `/` (required) — default `[hero, work, quote, contact]`; allowed adds `packages, about`.
- **work** `/work` (required) — default `[work, quote]`; allowed adds `contact`.
- **experiences** `/experiences` — default `[packages, quote]`; allowed adds `contact`.
- **about** `/about` — default `[about, quote]`; allowed adds `packages`.
- **contact** `/contact` — default `[contact]`.

All sectionTypes ∈ atelier body types `{hero, work, packages, about, quote, contact}` (chrome header/footer excluded). Quote-band type is `quote` (hyphen-free per phase-4). `getPageArchetypesForTemplate('atelier')` returns the menu because atelier's templateMeta already declares `multipage` (phase 4).

**Photographer multi flip** — `structureDefault:'multi'`. Live (not inert) post-phase-2: the served work→multipage flow now reaches the structure slot, and `isMultipage` reads this businessType signal.

**Signal-consistency CARRY (phase-2 forward hazard) — RESULT: derivations AGREE.** For a photographer+atelier store state, slot inclusion (`slotsForEngine` at hydrate, keyed off the FULL brief) and the dispatch/fetchStrategy gate (keyed off `briefSignalFromState(store)`) BOTH resolve `isMultipage` TRUE. Proven by the `(CARRY)` test in useWizardStore.test.ts (asserts `slots` contains `structure` AND `isMultipage(templateId, briefSignalFromState(s))===true` for the same state; signal carries `businessType:'photographer'`). No bug — did NOT need a phase-2 file. Known non-blocking asymmetry (documented, NOT on the served path): an UNCONFIRMED `brief.structure.mode:'single'` would make the full-brief derivation false while `briefSignalFromState` (which only adopts CONFIRMED structure mode, useWizardStore.ts:783) stays photographer→multi. The served photographer brief carries no structure at hydrate, so this cannot fire on the reachable path; flag for phase 9/13 if a resume-with-unconfirmed-structure flow is ever added.

**Block-resolution CARRY (phase-2 forward hazard) — RESULT: resolves REAL atelier layouts, NOT 'default'.** `selectProductBlocks({templateId:'atelier', sections})` → `selectEligibleBlock` reads `blockManifests['atelier']` (real, phase 4) → `pickFromSet` returns the section's default declaration (eligible with no hints/assets): `work→AtelierWorkGallery`, `packages→AtelierPackages`, `quote→AtelierQuoteBand`, `hero→AtelierHero`, `about→AtelierAbout`, `contact→AtelierContact`. Proven by the `selectProductBlocks` test in pageArchetypes.atelier.test.ts. The meridian fallback map is never hit for atelier. No manifest gap.

**Deviations**
- Fixed `pageArchetypes.test.ts:137` (a photographer-single assertion the flip broke) even though the plan's step-4 grep-note named only `config.test.ts`. In-scope: my Files-touched lists "existing pageArchetypes/businessTypes test file"; this is a pure test-expectation update from my flip, same class as config.test.ts:104. Generalized the invariant to `MULTI_DEFAULTS={manufacturer, photographer}`.
- Left the now-stale prose comment in config.ts (:246-248, "no shipped template declares [gallery], so the serve gate rejects photographer to MANUAL") untouched — cosmetic, and editing narrative beyond the flip is scope creep. Flag for a later sweep alongside the phase-4 serveGate.test.ts:120 stale comment.

**Test results**
- `npx tsc --noEmit` — exit 0. PASS.
- `npx vitest run src/modules/audience/product src/modules/businessTypes/config.test.ts src/hooks` — 269 passed. PASS.
- `npx vitest run src/modules/templates/conformance.test.ts` — 371 passed / 8 skipped. PASS (archetype addition didn't disturb conformance).

**pipelineGuards allowlist fix (orchestrator ruling — folded into phase 5).** `src/modules/businessTypes/pipelineGuards.test.ts:62` was failing: it asserts literal `templateId === 'vestria'` appears ONLY in `RENDER_LAYER_ALLOWLIST`, but **phase 2** (commit c9af411d) added such a gate to `src/components/onboarding/wizard/StyleSlot.tsx` (`showVestriaPickers = templateId === 'vestria'` — the vestria hero-variant/style pickers) WITHOUT allowlisting it. It escaped phase-2's narrower test scope and surfaced under phase 5's `test:run -- src/modules/businessTypes` verification command. StyleSlot is render-layer wizard UI (vestria-only pickers, not a copy-pipeline fork), so the guard's own header (b) sanctions the allowlist. **Fix applied (added to phase-5 Files-touched):** added `'components/onboarding/wizard/StyleSlot.tsx'` to `RENDER_LAYER_ALLOWLIST`. StyleSlot.tsx itself NOT touched. File added to the Files-changed list below.

**Final all-green results (after pipelineGuards fix):**
- `npx tsc --noEmit` — exit 0. PASS.
- `npx vitest run src/modules/audience/product src/modules/businessTypes src/hooks` — 272 passed (20 files, incl. pipelineGuards.test.ts). PASS.
- `npx vitest run src/modules/templates/conformance.test.ts` — 371 passed / 8 skipped. PASS.

**For phase 9/13**
- Archetype `defaultSections` are the served skeleton seed (all 5 pages, chargeless). Phase 13 Kundius run reaches the structure slot with this 5-page menu.
- `quote` survives `filterSectionsByProof` (only `testimonials` is proof-gated); when the photographer has no captured testimonials, `quote` sections still seed — confirm this is desired for the manual-fill flow, or gate `quote` at phase 9 if empty-quote bands are undesirable.
- Unconfirmed-structure signal asymmetry (above) — revisit only if a resume flow persists an unconfirmed `structure.mode`.

**FIX-FIRST — reachable zero-page-skeleton bug (review verdict, scope expanded to `useWizardStore.ts`).**
- **Bug:** `classify.ts` stamps EVERY brief with an UNCONFIRMED `structure:{ mode: structureHint, pages: [] }` (raw AI guess). At hydrate `useWizardStore.ts` passed the RAW brief to `slotsForEngine`. For a served photographer the AI read as single-page (`structure.mode==='single'`): (1) `isMultipage('atelier', brief)` → `mode==='single'` → FALSE → structure skip RETAINED → StructureSlot never mounts → its mount-effect `fetchStrategy` never runs → sitemap stays null; BUT (2) `GeneratingSlot.isWorkMultipage()` keys off `briefSignalFromState(s)`, which carries `structure` ONLY when `briefStructureMode` is set — and that is set (hydrate) ONLY for a CONFIRMED structure (`sections?.length>0 || pageDetails?.length>0`). A bare `{mode:'single',pages:[]}` hint is NOT confirmed → signal omits structure → `isMultipage('atelier',{businessType:'photographer'})` → TRUE → `runWorkSkeleton` dispatches with `pages = sitemap ?? [] = []` → ZERO-PAGE multipage draft saved. The two derivations DISAGREED. (My earlier "signal-consistency" proof used a brief with NO `structure` field, so it missed this case.)
- **Fix (minimal, `useWizardStore.ts` only):** at hydrate, compute the CONFIRMED-structure check and set `state.briefStructureMode` BEFORE the `state.slots = …` line, then call `state.slots = slotsForEngine(engine, templateId, briefSignalFromState(state))`. Now slot inclusion and the dispatch/fetchStrategy gate read the SAME confirmed-only signal (`businessTypeKey` is already set upstream, so `briefSignalFromState(state)` is valid at that point). Deduped the later `briefStructureMode = persisted.mode` assignment (single assignment now); the later block still seeds sitemap/structureSections from a confirmed structure. `isMultipage`'s "explicit CONFIRMED single wins → false" logic is UNCHANGED — only which signal hydrate feeds it changed.
- **Net behavior:** a bare/unconfirmed classify `mode` NEVER suppresses the structure slot for a multipage-capable template; businessType default (photographer=multi) drives when structure is unconfirmed; a CONFIRMED single still correctly stays single.
- **Representative tests (useWizardStore.test.ts, the ones the earlier proof missed):** (i) photographer+atelier brief WITH bare `structure:{mode:'single',pages:[]}` → asserts `slots` INCLUDES `'structure'` AND `isMultipage(templateId, briefSignalFromState(state))` TRUE (derivations AGREE) AND `briefStructureMode` stays null; (ii) photographer+atelier brief WITH a CONFIRMED single (`structure.sections=['hero','work','footer']`) → asserts `briefStructureMode==='single'`, `slots` does NOT contain `'structure'`, and the dispatch derivation is FALSE (legitimate single path unbroken).
- **Granth unchanged:** the phase-2 granth cases (`work + granth STILL skips structure`, `fetchStrategy work+single-page granth early-returns idle`, `dispatch work+single → writer generator`) all still pass — granth declares no `multipage`, so `isMultipage` is false regardless of which signal is fed; the confirmed-only change is inert for it.

**Final all-green results (after fix-first):**
- `npx tsc --noEmit` — exit 0. PASS.
- `npx vitest run src/hooks src/modules/audience/product src/modules/businessTypes src/modules/wizard` — 343 passed (25 files). PASS.
- `npx vitest run src/modules/templates/conformance.test.ts` — 371 passed / 8 skipped. PASS.

---
### Phase 5 — impl-review verdict: SHIP (2 loops)
Loop 1 = fix-first: reviewer caught a REACHABLE zero-page-draft bug (bare classify structure hint diverged slot-inclusion vs dispatch). Loop 2 = ship after fix.
Gates green: tsc exit 0; hooks+audience/product+businessTypes+wizard+conformance = 714 passed/8 skipped. Scope = 8 files (useWizardStore.ts added mid-phase per ruling), GeneratingSlot.tsx untouched.
Fixes this phase: (1) hydrate feeds briefSignalFromState(state) to slotsForEngine (both derivations now confirmed-only signal) — representative bare-hint + confirmed-single tests added; (2) pipelineGuards RENDER_LAYER_ALLOWLIST += StyleSlot.tsx (phase-2 regression). Both phase-2 carries proven (signal consistency real now; manifestPick resolves real Atelier layouts not 'default'). Granth inert (no multipage cap).
Non-blocking (cosmetic): stale CARRY-test inline comment ("keys off full brief" now via briefSignalFromState).

## Phase 6 — Design system: tokens / palettes / variants / knobs / sectionRules

### Files changed
- `src/modules/templates/atelier/tokens.ts` — knob declaration + token map + shared stylesheet builder; knob-consumed :root baselines; button radius now `--btn-r`.
- `src/modules/templates/atelier/palettes.ts` — no code change (already provisional vermilion default + indigo/olive placeholders; confirmed only).
- `src/modules/templates/atelier/sectionRules.ts` — comment-only (confirmed all-8-type band alternation; final-refinement pointer → phase 9).
- `src/modules/templates/atelier/ThemeInjector.tsx` — knob-aware: shared `buildAtelierStylesheet(knobs)` + `knobDataAttributes` on documentElement.
- `src/modules/templates/atelier/components/AtelierSSRTokens.tsx` — knob-aware: same shared builder + `{...knobAttrs}` on wrapper.
- `src/modules/templates/atelier/index.ts` — export knob surface (`atelierKnobs`, `atelierKnobTokenMap`, `serializeAtelierKnobOverrides`, `buildAtelierStylesheet`).
- `src/modules/templates/conformance.test.ts` — `assertKnobConformance('atelier', atelierKnobs)` + phase-6 back-compat/parity evidence block.

### 5-axis knob declaration
`atelierKnobs` declares ALL 5 standard axes (declare-one⇒declare-all):
- REAL alternates: `buttonShape` [square, rounded*, pill], `cardStyle` [hairline*, shadow, flat], `density` [compact, comfortable*, spacious] (* = axis default).
- DEFAULT-ONLY (single-value): `typePairing` ['classic'], `texture` ['none'] — conformance-valid, no knob CSS.

### Per-axis CSS added to tokens.ts (`atelierKnobTokenMap`, non-default values only)
- buttonShape: square → `--btn-r:0px`; pill → `--btn-r:999px` (rounded default = `:root --btn-r:var(--r)`, ~3px).
- cardStyle: shadow → `--card-bd:1px solid transparent; --card-shadow:0 6px 22px …; --card-bg:var(--paper)`; flat → transparent border, no shadow, `--card-bg:var(--paper-2)` (hairline default = :root).
- density: compact/spacious retune `--pad-y`/`--pad-y-sm` (comfortable default = :root). This axis has real effect NOW — `.lg-atelier-pad{,-sm}` in tokens.ts consume the vars.
New `:root` baselines added so defaults emit nothing: `--btn-r`, `--card-bd`, `--card-shadow`, `--card-bg`. `.lg-atelier-btn` switched `var(--r)`→`var(--btn-r)`.

### How knobs wire into both renderers (identical, hearth precedent)
Single source of truth `buildAtelierStylesheet(knobs)` in tokens.ts = base+palette+variant, appends `serializeAtelierKnobOverrides()` ONLY when `knobDataAttributes(knobs)` is non-empty. Both `AtelierThemeInjector` (edit; documentElement attrs, `+ EDIT_AFFORDANCE_STYLES`) and `AtelierSSRTokens` (published; wrapper `{...knobAttrs}`) call the SAME builder + `knobDataAttributes`, so knob CSS + wrapper attrs are byte-identical across renderers (edit-affordance CSS is the only allowed divergence). LAW upheld: default value → no attr, no CSS (evidence test asserts byte-identical baseline + no `data-knob-` in default published markup).

### Registry loader gap (flagged, NOT edited — registry.ts out of Files-touched)
The atelier registry loader block (`registry.ts:115`) does NOT surface `knobs: m.atelierKnobs` (hearth does at :29). This is NOT needed for phase 6: the render path passes `knobs` DIRECTLY to the injector props from `themeValues.knobs` (`LandingPageRenderer.tsx:963`, `LandingPagePublishedRenderer.tsx:220`) — it does not read `mod.knobs`; and `assertKnobConformance` takes the declaration as a direct argument. So phase 6 render + conformance both work without it. The one-line registry addition (`knobs: m.atelierKnobs`) becomes relevant in PHASE 11 (editor knob-switching / `assertEditorBasics` reads the module-level declaration). Reporting per instructions — did not silently edit registry.ts.

### Palette set (provisional; final = phase-9 human gate)
`vermilion` (default), `indigo`, `olive` — unchanged from phase 4 scaffold; accent duo `--accent`/`--accent-deep` under `[data-palette]`.

### Deviations
- cardStyle alternates emit real scoped CSS + attrs (mechanism REAL, conformance-valid), but the provisional Packages block (`blocks/Packages/styles.ts`, out of Files-touched) does not yet consume `--card-bd/--card-shadow/--card-bg`, so cardStyle has no VISIBLE effect until the phase-9 block port wires the card to those vars. Conservative: added the baselines + emission now; deferred block consumption to phase 9. buttonShape (`.lg-atelier-btn`) and density (`.lg-atelier-pad`) DO have live effect (their consumers live in tokens.ts).
- palettes.ts / sectionRules.ts required no substantive change (phase-4 scaffold already correct) — only a sectionRules comment update.

### Test results
- `npx tsc --noEmit` → exit 0.
- `npm run test:run -- src/modules/templates/conformance.test.ts` → 385 passed | 8 skipped (incl. atelier 5-axis knob conformance + back-compat/parity evidence).
- `npm run test:run -- src/modules/templates/atelier` → 55 passed (coreParity + registration still green).

### Open risks
- Registry `mod.knobs` surface deferred (see gap above) — phase 11 must add `knobs: m.atelierKnobs` to the atelier loader for editor knob-switching.
- cardStyle visual effect deferred to phase-9 block port (card must reference the new vars).
- All design values (paper/ink/vermilion/rhythm/knob CSS) remain PROVISIONAL — locked against approved Kontur HTML in phase 9.

---
### Phase 6 — impl-review verdict: SHIP (1 loop)
No blocking issues. Gates green: tsc exit 0; conformance+atelier = 440 passed/8 skipped. Scope = 6 files (palettes.ts needed no change). Verified: all 5 knob axes conformance-valid (assertKnobConformance enrolled+passing); default=byte-empty (no attr/no CSS); ThemeInjector+SSRTokens byte-identical knob emission via shared buildAtelierStylesheet; blocks never branch on knobs; no default-value regression (--btn-r/--card-* baselines = prior values).
Deferrable (confirmed): registry loader doesn't surface m.atelierKnobs — nothing reads it in current render/publish/conformance path (props-threaded); needed only for phase-11 editor knob-switching. cardStyle emits real CSS but no consumer until phase-9 Packages port — conformance is declaration-only so valid.
Non-blocking (CARRY→phase 11): (1) index.ts:20 comment misleadingly says registry surfaces atelierKnobs; (2) density/variant --pad-y overlap (intended, knob wins, default emits nothing).

---

## Phase 7 — Serve-gate + fit + served-path integration coverage

### Files changed
- `src/modules/brief/serveGate.test.ts` — fixed the stale line-120 comment; added an "atelier phase 7 — serve backing + over-serve guards" describe block.
- `src/modules/templates/fit.test.ts` — added `templateMeta` import + an "atelier full-capability satisfaction" describe block.
- `src/hooks/useWizardStore.test.ts` — added `buildBriefDraft`/`EntrySignals`/`decideServe` imports + a "COMPOSED served photographer path" describe block (composed served-path proof + granth regression).

**No production code changed — tests only, as scoped.** No production defect found.

### Coverage added
- **serveGate (SERVE depth):** pins the templateMeta backing behind the rungC gallery probe (`atelier.copyEngines`/`capabilities`/`capabilitySections` exact values, not retired/bespoke); photographer ⇒ SERVE/service/atelier with `shortlist === ['atelier']` and `audienceType === TEMPLATE_AUDIENCE.atelier !== BRIDGEABLE_ENGINES.work`.
- **serveGate (negative / over-serve guards):** trust serve (agency) shortlist `['hearth','lex','surge']` `.not.toContain('atelier')`; product serve (saas) shortlist `['meridian','vestria']` `.not.toContain('atelier')`; out-of-ICP (photographer + `platformNeeds:'checkout'`) ⇒ manual/`out-of-icp` — atelier cannot rescue an out-of-ICP brief.
- **fit():** `fit('atelier','work',['gallery','packages','lead-form','multipage','bilingual']) === true`, with non-vacuous lane provenance (lead-form + bilingual asserted ABSENT from `templateMeta.atelier.capabilities`, so the TRUE result is proven to come from the shared-block + platform lanes, not templateMeta); plus atelier engine-gate negatives (`trust`/`thing` false).
- **Composed served-path (store level):** REAL `buildBriefDraft` photographer brief (carrying the bare unconfirmed `structure:{mode:'single',pages:[]}` classify hint) → `decideServe` = serve/atelier/service → store hydrate with the decision's audience/template → `slots` include `structure` (`briefStructureMode` null, hint ignored) → chargeless `fetchStrategy` seeds the 5 archetype pages (`['home','work','experiences','about','contact']`, `strategy` null, fetch never called) → `isMultipage(...)` true (skeleton dispatch). Representative brief, not idealized.
- **Composed granth regression:** REAL writer `buildBriefDraft` brief → serve/granth/writer → store skips `structure` + `isMultipage` false (writer-generator dispatch, not skeleton) — the granth-unchanged proof composed across phases 1+2+4.

### Comment sweep (phase-4 nit)
`serveGate.test.ts` line-120 stale comment ("Contrast with photographer, whose unbacked gallery cap sends it to the manual/demand lane") rewritten to a historical note: photographer's gallery cap is now backed by atelier (phase 4) so photographer SERVES atelier.

### Deviations
- Negative-case out-of-ICP fixture uses `businessTypeGuess:'photographer'` (not the pre-existing `boutique`/`restaurant` checkout fixtures) so the test proves a WORK/gallery type is still pushed to manual by the exclusive out-of-icp rung — a stronger over-serve guard for atelier specifically. Conservative, in-scope.

### Test results
- `npx tsc --noEmit` → exit 0.
- `npm run test:run -- src/modules/brief src/modules/templates/fit.test.ts src/hooks` → 16 files, 353 tests, all PASS.

### Open risks
- None new. Composed path is pure unit composition (no browser); true E2E of the served flow remains the phase 12/13 manual gates.

---
### Phase 7 — impl-review verdict: SHIP (1 loop)
No blocking issues, no material nits. Gates green: tsc exit 0; brief+fit+hooks = 353 tests pass. Tests-only confirmed (no production change). Verified NON-VACUOUS + correct against production: SERVE-depth (photographer→serve/atelier/service, shortlist=['atelier']); over-serve guards REAL not tautologies (out-of-icp checkout fires before serve logic; agency/saas .not.toContain('atelier') pin exact shortlists); fit() provenance real (lead-form via sharedBlockCapabilities, bilingual via PLATFORM, both absent from atelier.capabilities); composed served-path threads real fns (buildBriefDraft→decideServe→hydrate→isMultipage, fetch stubbed+never-called=chargeless, 5-page seed); granth regression composes writer→skip→writer-gen. No existing test weakened; line-120 comment fix sanctioned.

## Phase 8 — Fonts: Bricolage Grotesque + preload + kit whitelist

### Files changed
- `src/styles/fonts-self-hosted.css` — added `@font-face` for Bricolage Grotesque.
- `src/modules/templates/CriticalFontPreload.tsx` — added `case 'atelier':` to `criticalFontHrefs`.
- `src/modules/engines/designKit.ts` — added `'Bricolage Grotesque'` to `SELF_HOSTED_FONTS`.

(No file added under `public/fonts/bricolage-grotesque/` — the woff2 was pre-placed; peer dirs hanken-grotesk/space-grotesk carry no README, so none added.)

### @font-face block
`font-family: 'Bricolage Grotesque'`; variable `font-weight: 200 800`; `font-style: normal`; `font-display: swap`; `src: url('/fonts/bricolage-grotesque/bricolage-grotesque-latin-wght-normal.woff2') format('woff2-variations')` — mirrors the Archivo / Space Grotesk / Hanken variable-wght precedent in the same file. Placed just before the Cormorant Garamond block.

### Preload case (variant-branched)
`case 'atelier':` returns the display face only, branched by variant:
- `compact` → `/fonts/fraunces/fraunces-latin-opsz-normal.woff2` (Fraunces — confirmed present).
- default (`editorial` baseline) → `/fonts/bricolage-grotesque/bricolage-grotesque-latin-wght-normal.woff2` (confirmed present, 41KB).
Body face (Hanken Grotesk) intentionally not preloaded — rides CSS discovery like the other grotesk templates (vestria/surge precedent).

### Whitelist entry
`'Bricolage Grotesque'` inserted alphabetically between `'Bodoni Moda'` and `'Cormorant Garamond'` in `SELF_HOSTED_FONTS`.

### Three-way family-name match
Identical string `Bricolage Grotesque` across:
1. `@font-face` `font-family` (fonts-self-hosted.css).
2. atelier `tokens.ts:65` `fontDisplay: "'Bricolage Grotesque', 'Hanken Grotesk', ..."` (unchanged — set in phase 6; not edited).
3. `SELF_HOSTED_FONTS` whitelist (designKit.ts).
CONFIRMED match. tokens.ts NOT touched (in-name already correct).

### Verification
- `npx tsc --noEmit` → exit 0. PASS.
- `npm run test:run -- src/modules/engines` → 4 files, 175 tests passed. PASS.
- `npm run build` → exit 0 (buildPublishedCSS + buildAssets + next build all green). PASS. Built `public/assets/fonts-self-hosted.css` contains 2 `Bricolage Grotesque` references + the woff2 url. Confirmed.

### Deviations / risks
- Bricolage wght range set to `200 800` (fontsource standard for the wght axis). If the placed binary's actual axis differs the range would clamp — conservative and matches source naming; no runtime error either way.
- No open risks. Phase-9 `kit:lint` prerequisite (whitelist entry) satisfied.

---
### Phase 8 — impl-review verdict: SHIP (1 loop)
No blocking issues. Gates green: tsc exit 0; `npm run build` exit 0 (FIRST full build of run — validates whole tree); engines 175 passed. Bricolage woff2 (41KB fontsource variable, orchestrator-placed) wired: @font-face wght 200-800 woff2-variations; preload case atelier (editorial→Bricolage / compact→Fraunces, both files present); SELF_HOSTED_FONTS +1. Family-name 'Bricolage Grotesque' 3-way match (@font-face / tokens.ts:65 fontDisplay / whitelist). Build artifact public/assets/fonts-self-hosted.css regenerated (expected). Non-blocking: cosmetic comment.

## FOUNDATION COMPLETE (phases 1-8). Phase 9 = HUMAN GATE (designer HTML missing).

---
### Phase 9a — design system + Header + Hero (+slider markup + marquee + page-head)

**Files changed:**
- `src/modules/templates/atelier/tokens.ts` — real Kontur :root values + ported base/type/label/lede/button/qlink utilities; density knob re-mechanised onto `--space`; knob declaration + token map realigned.
- `src/modules/templates/atelier/palettes.ts` — real Kontur accent oklch values (vermilion exact; cobalt/moss values under existing indigo/olive ids — see Deviations).
- `src/modules/templates/atelier/sectionRules.ts` — hero surface flipped paper→dark (Kontur cover + page-head are both dark).
- `src/modules/templates/atelier/blocks/Header/AtelierNavHeader.core.tsx` — ported 3-col nav grammar, overlay+solid modes, EN/NL toggle, CSS-only mobile drawer.
- `src/modules/templates/atelier/blocks/Header/styles.ts` — ported NAV CSS (overlay/solid/burger/drawer/lang/btn-nav + responsive).
- `src/modules/templates/atelier/blocks/Hero/AtelierHero.core.tsx` — cover slider DOM contract + marquee (home) + page-head mode.
- `src/modules/templates/atelier/blocks/Hero/styles.ts` — ported COVER/arrows/dots/scroll/MARQUEE/page-head CSS (keyframe atl-scrollx→lg-atelier-scrollx); placeholders scoped under `.lg-atelier-cover`.
- `src/modules/templates/conformance.test.ts` — phase-6 atelier knob-evidence block updated to the shipped values (cardStyle `shadow`→`flat`).
- `index.ts`, `ThemeInjector.tsx`, `components/AtelierSSRTokens.tsx` — reviewed, NOT edited (knob decl lives in tokens.ts and is already re-exported; both renderers consume `buildAtelierStylesheet`+`knobDataAttributes` generically with no hardcoded knob values, so the realignment flows through automatically).

**Tokens/palettes reconciled (real Kontur values):** `:root` now carries the design's `--atl-*` values mapped onto atelier's phase-6 token names — paper `oklch(0.978 0.004 95)`, paper-2 `0.945…`, ink `0.165 0.010 60`, ink-soft (=design ink-2) `0.385…`, ink-mute (NEW, =design ink-3) `0.560…`, line `ink/0.16`, line-dark `paper/0.20`, on-dark-soft `0.82 0.008 90`, wrap `1380px`, gutter `clamp(20px,5vw,76px)`, fs-body `16px`. Dark surfaces (`--dark`/`--dark-2`) both resolve to `--ink` because the design paints every dark band (`.atl-sec.dark`, `.atl-page-head`, `.atl-footer`) with `var(--atl-ink)` — the platform's 4-surface `data-surface` mechanism is retained unchanged (base→paper, alt→paper-2, dark→dark). Ported the button family (`.lg-atelier-btn` + `.lg-atelier-fill/-line/-accent/-ghost/-ghost-d/-lg/-on-dark`), the `.lg-atelier-label` eyebrow (sans, tracked, accent dot), `.lg-atelier-lede`, `.lg-atelier-qlink`. Palette accents are the exact design duos.

**Knob-value realignment (cardStyle / density) + conformance:**
- cardStyle: `['hairline','shadow','flat']` → **`['hairline','flat']`** (design has no shadow; dropped `shadow` from decl + token map). flat = `--card-bd:1px solid transparent; --card-bg:var(--paper-2)` (Kontur `[data-variant~=flat]`).
- density: `['compact','comfortable','spacious']` → **`['comfortable','compact']`** (dropped `spacious`). compact = Kontur `[data-variant~=dense]`. It emits `--space:0.82` (for the DIRECT `calc(X * var(--space))` consumers — button padding, page-head, gaps) AND redeclares the final `--sec-y`/`--pad-y`/`--pad-y-sm` with `0.82` baked in — see the dual-renderer fix below.
- buttonShape unchanged `['square','rounded','pill']`; `:root --btn-r` set to the design's rounded value `10px` (square→0px, pill→999px).
- conformance.test.ts phase-6 evidence block: `cardStyle:'shadow'` → `cardStyle:'flat'` (the only test that referenced a dropped value). `assertKnobConformance('atelier', atelierKnobs)` passes with the new subsets (both include their axis default; default emits nothing — verified by the byte-identical baseline test).

**Header dual-mode:** one core, two modes via `content.mode`. Default `solid` = sticky blurred-paper bar (dark text, inner pages); `overlay` = transparent bar with light text (home, over the dark hero). Overlay uses `position:absolute` per the design; whether it visually lands over the following hero section in the multipage stack is a phase-12 parity check (default is the safe always-visible solid bar). Mobile drawer is the design's CSS-only checkbox hack — a top-level `<input id="lg-atelier-menu">` + a sibling `.lg-atelier-drawer` (both siblings of `<header>` inside the section wrapper, so `:checked ~` resolves). EN/NL toggle is static visual chrome (aria-pressed); real locale switching is the platform i18n layer.

**Page-head mode:** the inner-page dark hero band (`.atl-page-head`) is rendered by the **Hero** block when `content.mode === 'pageHead'` — NOT a new section type, NOT a resolver/manifest change. label + accent-`em` h1 + lede, dark surface (hero's sectionRules surface is `dark`, which serves both modes).

**Marquee:** part of the Hero region, home mode only. `.lg-atelier-marquee[data-surface="dark"][aria-hidden="true"]` after the cover; `.lg-atelier-marquee-track` runs `animation:lg-atelier-scrollx 32s linear infinite` (keyframe renamed from `atl-scrollx`), words duplicated ×2 for a seamless loop, `prefers-reduced-motion` halts it. Pure CSS. Words come from `content.marquee_items` (else a 5-word default). This is the Hero's marquee — NOT the QuoteBand.

**Hero slider DOM contract (VERBATIM — phase-10 asset selectors must match; class prefix renamed atl-→lg-atelier-, but the `data-atl-*` hooks are EXACT):**
```
.lg-atelier-cover                                     <- JS: slider.closest('.lg-atelier-cover')
  .lg-atelier-slides[data-atl-slider][data-interval="5000"]
    .lg-atelier-slide.is-active   (slide 1)           <- first slide default-visible (no-JS fallback)
    .lg-atelier-slide             (slides 2..N)
      .lg-atelier-slide-ph > .lg-atelier-ph.dark > .lg-atelier-ph-num   (or customer <img class="lg-atelier-slide-img">)
  .lg-atelier-cover-in            (z2 -- eyebrow/h1/tagline/actions)
  .lg-atelier-arrows
    button.lg-atelier-arrow.lg-atelier-arrow-prev[data-atl-prev]
    button.lg-atelier-arrow.lg-atelier-arrow-next[data-atl-next]
  .lg-atelier-dots[data-atl-dots]                      <- EMPTY container; JS injects button.lg-atelier-dot[aria-current]
  .lg-atelier-scroll
```
Data-attribute hooks (do NOT rename in phase 10): `data-atl-slider`, `data-interval` (="5000"), `data-atl-prev`, `data-atl-next`, `data-atl-dots`. Active-slide class: `.is-active`. JS-injected dot class: `.lg-atelier-dot`. Slides are rendered from the block's `slides` image collection (`slides.<id>.image` through the standard funnel); an empty collection renders ONE `.is-active` dark placeholder slide.

**No-JS first-slide fallback:** `.lg-atelier-slide{opacity:0}` + `.lg-atelier-slide.is-active{opacity:1}` in CSS, and the first slide ships `is-active` in the static markup. With JS disabled the first slide is opaque and the rest are transparent; arrows and the empty `[data-atl-dots]` are inert (no handlers). Phase-10 JS injects dots and toggles `.is-active` for autoplay/controls.

**Deviations (in-scope judgment calls, logged):**
1. **Palette ids/4th accent (out-of-scope file):** the design ships FOUR accents (vermilion + cobalt + moss + ochre) but the `AtelierPalette` union in `src/types/service.ts` (NOT in 9a Files-touched) declares three ids `vermilion|indigo|olive`. Conservative choice: applied the exact vermilion duo, and carried the design's **cobalt** and **moss** values under the existing `indigo`/`olive` ids. The id-rename to cobalt/moss/ochre AND the 4th (ochre) palette require editing `types/service.ts` (the union tuple `atelierPalettes` + its `PALETTES_BY_TEMPLATE` entry) — **REPORTED as a follow-up needing that file**; not done here to stay in Files-touched.
2. **buttonShape default:** platform law fixes the buttonShape axis DEFAULT to `rounded` (must be the no-emit `:root`), but the Kontur design's `:root` default is square (`0px`). Kept the law: `:root --btn-r:10px` (the design's rounded value, so the `rounded` knob is honest), with `square` (0px) as an explicit alternate. Kundius/atelier projects reproduce the exact square Kontur look by selecting `buttonShape:'square'` in `themeValues.knobs`. Documented so phase 13 sets it.
3. **Hero `hero_image` field dropped** from `AtelierHeroContent` in favour of the `slides` collection (the design is a slider, not a single image). No test referenced `hero_image`.
4. **Header overlay-over-hero** positioning verified only in phase-12 parity (default is solid); noted above.

**Guardrails honored:** no new section type; `resolveAtelierBlock`/`blockManifest.ts` untouched (page-head is a Hero mode); slider `data-atl-*` hooks preserved exactly; default knob values emit nothing (byte-identical baseline test green). Class rename atl-→lg-atelier- applied throughout markup + styles.ts.

**Commands / results:**
- `npx tsc --noEmit` -> exit 0 (PASS)
- `npx vitest run src/modules/templates/conformance.test.ts` -> 385 passed, 8 skipped (PASS; incl. realigned knob conformance + atelier default-emits-nothing + non-default parity evidence)
- `npx vitest run src/modules/templates/atelier` -> 55 passed (PASS; coreParity 8 cores stay pure + render server-side, registration all 8 types)

**Open risks:**
- Palette id-rename + ochre accent (Deviation 1) needs `types/service.ts` — orchestrator to schedule a small follow-up (or fold into 9b) so all four Kontur palettes ship with correct ids.
- Header overlay-over-dark-hero visual overlap depends on the multipage renderer's section stacking; confirm at phase 12. Solid default is safe meanwhile.
- 9b provisional blocks (Work/Packages/About/Quote/Contact/Footer) still emit the shared HATCH placeholder + old button-modifier styling; they will be re-ported in 9b and may look mixed until then (no test impact).

---
#### Phase 9a — review fix (density dual-renderer parity trap)

**Blocking bug (verdict fix-first):** the compact density knob emitted ONLY `[data-knob-density="compact"]{--space:0.82}`, while `--sec-y`/`--pad-y`/`--pad-y-sm` were declared at `:root` as `calc(… * var(--space))`. CSS custom-property `var()` substitution resolves at the DECLARING scope (`:root`) and descendants inherit the already-computed value. ThemeInjector (edit) sets `data-knob-*` on `documentElement` (=`:root`) so rhythm recompressed; AtelierSSRTokens (published) sets them on a wrapper `<div>` (a `:root` descendant), so `--pad-y`/`--sec-y` stayed resolved with `--space:1` → section rhythm did NOT compress in published. Emitted CSS text is byte-identical (byte-compare evidence test misses it) but the RENDERED layout diverged editor vs published — the exact parity trap the track guards against. Regression from my phase-9a re-mechanisation.

**Fix (`tokens.ts`, `atelierKnobTokenMap.density.compact`):** the compact block now redeclares the FINAL section-rhythm vars directly (0.82 baked in, not via `var(--space)`), so a wrapper-scoped `data-knob` recomputes them for descendants in the published renderer too:
```
compact: {
  '--space': '0.82',
  '--sec-y':   'calc(clamp(72px, 10vw, 150px) * 0.82)',
  '--pad-y':   'calc(clamp(72px, 10vw, 150px) * 0.82)',
  '--pad-y-sm':'calc(clamp(52px, 7vw, 100px) * 0.82)',
}
```
`--space` is still emitted for the direct consumers (button padding, page-head, marquee gaps). DEFAULT (comfortable) still emits nothing — verified by the unchanged byte-identical baseline test.

**Regression guard added (`conformance.test.ts`):** new test asserts the compact block declares `--pad-y:`/`--pad-y-sm:` directly (not only `--space`), so a future "multiplier-only" regression on any `:root`-declared rhythm var goes red.

**Comments corrected:** the token-map + knob-declaration comments in `tokens.ts` no longer claim `--space` scales section rhythm "in one lever" (true only on the edit side); they now document why the final vars must be redeclared.

**Re-verify:** `npx tsc --noEmit` exit 0 (PASS) · `npm run test:run -- src/modules/templates/conformance.test.ts src/modules/templates/atelier` → 441 passed, 8 skipped (PASS; new parity guard green, default still no-emit). Fix stayed within phase-9a Files-touched (tokens.ts + conformance.test.ts).

---
### Phase 9a — impl-review verdict: SHIP (2 loops)
Loop 1 = fix-first: density=compact editor↔published parity divergence (--space multiplier resolved at :root declaring-scope; published wrapper is a :root descendant so section rhythm didn't compress there). Loop 2 = ship after fix (compact block redeclares final --sec-y/--pad-y/--pad-y-sm directly + guard test).
Gates green: tsc exit 0; conformance+atelier = 441 passed/8 skipped. Verified: class rename atl-→lg-atelier-, knob realignment (cardStyle=[hairline,flat]/density=[comfortable,compact], defaults no-emit), ThemeInjector/SSRTokens parity, Hero slider DOM contract exact, Header overlay+solid+drawer+page-head-mode, marquee, core purity, data-surface. Scope = 8 files.
CARRY→9b: palette ids (types/service.ts vermilion/indigo/olive → vermilion/cobalt/moss/ochre + 4th). CARRY→12/13: buttonShape default rounded≠Kontur square (per-project knob seed decision at parity gate).
