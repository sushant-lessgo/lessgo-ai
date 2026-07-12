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
