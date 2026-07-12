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
