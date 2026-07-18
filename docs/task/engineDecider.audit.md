# engineDecider — implementation audit

## Phase 1 — Engine-resolution core (logic only, no UI)

Branch: `feature/engineDecider` (verified before any edit). No commits made (orchestrator commits).

### Files changed (complete scope map — 13 files)

Source (7):
1. `src/types/brief.ts` — NEW `resolvedEngines` const + `ResolvedEngine` type (canonical home; breaks the config↔classify cycle).
2. `src/modules/businessTypes/config.ts` — `EngineBinding` discriminated union on `BusinessTypeEntry`; `engineState:'committed'` on the 7 committed keys; flipped `designer`/`agency` to `ambiguous`; NEW `workCandidateBusinessKeys()` helper (R2 semantic redefinition); fixed the stale `gallery`-unbacked comments on `photographer`/`designer` (atelier natively declares gallery).
3. `src/modules/brief/classify.ts` — `ResolvedEngine` re-export (back-compat); NEW `EngineStatus` + `EngineResolution` types; `ClassificationSource` gains `'user-pick'`; `EntryFacts.resolvedEngine` now nullable + optional `engineStatus`; `resolveEngine` returns the `EngineResolution` union (committed→resolved/lookup, ambiguous→ask, unknown+definite-rung→resolved/tiebreaker, unknown+none→ask/unknown-type); `buildBriefDraft` folds the union + sets status/engine + clamps confidence; `applyBusinessTypeCorrection` union-aware; NEW `applyEnginePick` (D4-pick writer, place/quick-yes never written to copyEngine); NEW `clampConfidence`.
4. `src/modules/brief/serveGate.ts` — `engine` typed null-safe; NEW `engine-unresolved` backstop (null engine ⇒ manual, dedicated tag, never `rungC:*`/`rungE:*`).
5. `src/lib/schemas/entryClassify.schema.ts` — comment-only: `businessTypeConfidence` stays `z.number()` (no `.min/.max`) with a note that the R1 clamp lives post-parse in code (see Deviations).
6. `src/app/admin/page.tsx` — union-aware engine column (`ask (candidates)` for ambiguous) + union-aware `fit()` probe engine (priorEngine for ambiguous).
7. `src/lib/schemas/extraction/index.ts` — **reader discovered via the two-sweep audit** (NOT on the plan's Files-touched list). `entryExtractionForSignals` destructured `resolveEngine().engine`; adapted to the union (`resolved.engine` / `ask.prior`). Behavior preserved byte-for-byte for extraction-vocab selection.

Tests (6):
8. `src/modules/businessTypes/config.test.ts` — union-aware binding-validity test; narrowed photographer/app `copyEngine` reads; NEW `EngineBinding union` describe (exact ambiguous set = {agency,designer}; manufacturer stays committed thing; designer/agency shapes; `workCandidateBusinessKeys` = {agency,designer,photographer,writer}).
9. `src/modules/brief/classify.test.ts` — resolveEngine split into committed-lookup / ambiguous-ask / unknown-tiebreaker; agency carrier test repointed to consultant (committed); NEW ambiguous-buildBriefDraft + confidence-clamp + full `applyEnginePick` describe.
10. `src/modules/brief/serveGate.test.ts` — agency serve cases wrapped with `applyEnginePick(...,'trust')` (agency now needs a D4 pick to serve); agency dropped from the `serveableFixtures` invariance loop; NEW null-engine (`engine-unresolved`) describe + designer/agency/place-pick paths.
11. `src/modules/engines/workContract.test.ts` — "work businessType key" derivation now uses `workCandidateBusinessKeys()`; expected set `['agency','designer','photographer','writer']`.
12. `src/lib/schemas/extraction/extraction.test.ts` — `extractionSchemaKey` alignment test now union-aware (committed→copyEngine, ambiguous→priorEngine, manufacturer special).
13. `src/lib/schemas/entryClassify.schema.test.ts` — the `output feeds buildBriefDraft cleanly` test split into (a) ask-path (shared agency fixture → copyEngine undefined / resolvedEngine null / engineStatus ambiguous) + (b) committed-path (consultant → trust lookup).

### Final ambiguous-entry set (per orchestrator ruling)
Exactly **{designer, agency}** are `ambiguous`. All 7 other keys are `committed`:
- `designer` → `{candidateEngines:['work','trust'], priorEngine:'work'}`
- `agency` → `{candidateEngines:['trust','work'], priorEngine:'trust'}`
- `manufacturer` **KEPT committed `thing`** (flip deferred to the Phase-1 human gate, per ruling).

### resolveEngine semantics (the load-bearing decision)
The union collapses to `ask`/null (⇒ D4) for exactly two cases: **known-ambiguous** types AND **unknown + tiebreaker `none`** (the old silent `→thing` collapse). Unknown types WITH a definite tiebreaker rung still **resolve** (source `tiebreaker`) — this deliberately preserves the serve gate's honest place/quick-yes→demand routing (e.g. an unknown restaurant with `browsing-place` resolves to `place` → `rungE:place,rungA:restaurant`, unchanged). "place resolves but copyEngine unset" from the plan = this path. Confirmed against the existing restaurant/browsing-place serveGate fixtures (still green).

### Readers discovered via the two-sweep audit
**Sweep 1 (registry `.copyEngine` readers):** the plan named voice.ts and journeyEngines.ts as needing guards — both were FALSE positives and left untouched:
- `src/modules/audience/product/voice.ts:122` reads `.voiceHint` (a SHARED field on the union), NOT `.copyEngine` → no change needed, no narrowing required.
- `src/lib/journeyEngines.ts` takes `engine` as a parameter; it never reads the registry → no change.

**Sweep 1 (extra reader, added to scope):** `src/lib/schemas/extraction/index.ts:249` destructured the old `resolveEngine().engine` — a genuine compile break not on the plan's list. Fixed minimally + recorded (item 7 above), per the plan's explicit rule "if the implementer finds ANOTHER reader … it goes in the audit + this list, not silently patched."

**Sweep 2 (behavioral-output tests for flipped keys):** the plan flagged this exact class. Findings:
- `serveGate.test.ts` had ~5 agency SERVE assertions that break once agency is ambiguous → rewrote via `applyEnginePick(...,'trust')` (preserves the exact serve/surge/shortlist assertions AND exercises the real D4→serve flow). In Files-touched.
- `serveMatrix.ts` / `serveMatrix.test.ts` (**verified-not-touched, confirmed**): designer/agency rows flip serve→`engine-unresolved` manual, which still satisfies the shape test (`missing` non-empty) and the single==multi invariance (both manual, equal). Left as-is per plan; both green.
- `bridge.test.ts` (agency) — UNAFFECTED: `briefToServicePrefill`/`briefToProductPrefill` are gated on `getEntryFacts` non-null, NOT on engine; ambiguous agency still carries facts. Confirmed green, untouched.
- `entryCollections.test.ts` (agency) — UNAFFECTED: asserts collection folding only, never resolution output. Green, untouched.
- `extraction.test.ts:335` (`entryExtractionForSignals` agency) — UNAFFECTED: routes via `extractionForBusinessType` (the unchanged `extractionSchemaKey` field). Green.

### Deviations from the plan
1. **R1 confidence clamp location (in-scope judgment call).** The plan (R1) says add a Zod `.min(0).max(1)` clamp on `businessTypeConfidence` in `entryClassify.schema.ts`. Evidence found during implementation: that field is part of the AI-response schema, sent through `zodResponseFormat`/`zodToJsonSchema` in `src/lib/aiClient.ts` (OpenAI strict structured outputs), and the file header explicitly forbids numeric min/max because strict json-schema conversion rejects `minimum`/`maximum`. Adding it would risk 500-ing the live `/api/v2/understand` + `/api/v2/scrape-website` calls (a beta-blocker). Conservative choice: honor R1's INTENT (defend the D2/D3 presentation from a garbage/out-of-range confidence) via a deterministic post-parse clamp `clampConfidence` in `classify.ts`→`buildBriefDraft` (used for both the `known`/`almost-sure` split and `brief.confidence`), and leave the AI-facing field as `z.number()` with an explanatory comment. Net effect matches R1; strict structured outputs are not touched. Tested (`classify.test.ts` clamp cases).
2. **workContract expected set includes `agency`.** The plan's R2 prose gives the derivation "committed-work ∪ ambiguous-with-`work`-in-candidateEngines" but states the expected set stays `{designer,photographer,writer}` — internally inconsistent once the orchestrator ruling gives `agency` `candidateEngines:['trust','work']` (agency IS a work-candidate). I followed the ruling + the definition + the test's stated PURPOSE ("every possible D4 work-pick must map to a professionWording row" — agency can be picked into work and HAS a `professionWording['agency']` row). Expected set = `['agency','designer','photographer','writer']`. This is the only reading consistent with the authoritative ruling.
3. **`engineStatus` is OPTIONAL on `EntryFacts`.** Made optional (`engineStatus?`) rather than required to avoid churning out-of-scope `EntryFacts` fixtures (workBriefFixture, rail/JourneyEntryStep test objects). `buildBriefDraft`/`applyEnginePick`/`applyBusinessTypeCorrection` always set it at runtime; the entryClassify assertion `engineStatus === 'ambiguous'` holds.
4. **`ConfirmBriefStep.tsx` NOT edited.** The plan listed it for "minimal compile fix for `applyBusinessTypeCorrection` signature". That signature is unchanged `(draft, businessTypeKey)`, so no compile fix was needed. Left untouched (behavior unchanged).

### Firewall / invariants held
- AI never emits an engine; only `resolveEngine`/`applyEnginePick` decide. `entryClassify.schema` still forbids engine output. No UI added this phase.
- `BriefSchema.copyEngine` enum unchanged `{thing,trust,work}`; place/quick-yes never written to `brief.copyEngine` (guarded by `isSchemaEngine` in both `buildBriefDraft` and `applyEnginePick`). Asserted.
- `/api/brief/confirm` request/response shape untouched (not edited).
- Null resolvedEngine → `engine-unresolved` manual backstop (never a misleading rung tag). Asserted.
- No renderer/template/published-page code touched.

### Verification
- `npx tsc --noEmit`: **no new errors.** Sole error is pre-existing and unrelated — `src/app/page.tsx(6,26) TS2307 @/assets/images/founder.jpg` (an untouched file; confirmed present on the base branch via stash → same error with my changes reverted; a standalone-tsc image-declaration artifact resolved by Next's build, not by my scope).
- `npm run test:run`: **Test Files 250 passed | 1 skipped (251); Tests 4056 passed | 14 skipped (4070).** 0 failures.
- Affected-subset run (classify, serveGate, serveMatrix, config, pipelineGuards, workContract, extraction, entryClassify): 8 files / 187 tests passed.

### Open risks / notes for the human gate
- **Manufacturer trade-off (Phase-1 human gate):** kept committed `thing` per ruling — its zero-question path is preserved. If the founder later flips it to ambiguous, every `manufacturer` fixture in classify/serveMatrix/entryClassify/serveGate would need the same union-aware treatment (Phase-1 audit rule).
- **Admin serveMatrix diagnostic shift (expected):** designer/agency rows now display `ask (...)` and serve→`engine-unresolved` manual (pre-pick state; the matrix does not simulate a D4 pick). Honest, ruled keep-as-is.
- **Kundius/photographer zero-question path preserved:** photographer stays committed `work` → resolves via lookup with zero prompts → serves atelier (gallery backed). Verified green in serveGate + serveMatrix tests.

## Phase 1 — manufacturer amendment (founder decision at the Phase-1 human gate)

The founder flipped `manufacturer` from committed `thing` to **ambiguous** at the Phase-1 gate. This amendment applies only that flip + its test/fixture fallout.

### Files changed (complete scope map — 3 files)
1. `src/modules/businessTypes/config.ts` — `manufacturer` entry flipped `{engineState:'committed', copyEngine:'thing'}` → `{engineState:'ambiguous', candidateEngines:['thing','trust'], priorEngine:'thing'}`. ALL other fields preserved byte-for-byte: `structureDefault:'multi'`, `voiceHint:'tailored-trade'`, `requiredCapabilities:['lead-form']`, `extractionSchemaKey:'manufacturer'`, `defaultStyle:'editorial-craft'`, `wizardFields`, `likelyIntents`. Added an explanatory comment (thing = product it makes / trust = trusted trade supplier; prior thing preserves tailored-trade voice + vestria default). `voiceHint` is a SHARED union field on `BusinessTypeEntry` (not gated to committed), so it survives the flip and is still consumed by `productVoiceForBusinessType` regardless of `engineState` — no voice change, no data loss (handled the same union-aware way designer/agency were).
2. `src/modules/businessTypes/config.test.ts` — the `EngineBinding union` describe: the "exactly designer + agency are ambiguous" test became "exactly designer + agency + manufacturer are ambiguous" (`ambiguous.sort()` now `['agency','designer','manufacturer']`); the old committed-thing manufacturer assertion (previously folded into that test) was replaced with a NEW dedicated test asserting `manufacturer → ambiguous {candidateEngines:['thing','trust'], priorEngine:'thing'}` + `voiceHint === 'tailored-trade'` (preservation).
3. `src/lib/schemas/extraction/extraction.test.ts` — comment-only accuracy fix in the `extractionSchemaKey aligns…` test: the union-aware comment now names the ambiguous set as `designer/agency/manufacturer` and notes manufacturer's `priorEngine 'thing'` is special-cased to its `'manufacturer'` variant schema. The TEST BODY needed NO change — it already read `entry.engineState === 'committed' ? copyEngine : priorEngine` and special-cased `bt === 'manufacturer' ? 'manufacturer'`; manufacturer's priorEngine 'thing' + the special-case still yield `expected === 'manufacturer'`, which matches `extractionForBusinessType('manufacturer').key`.

### Reader-audit (both sweeps) — how each flagged reader was handled
- **`workCandidateBusinessKeys()` + its test (config.test.ts):** manufacturer's `candidateEngines` = `['thing','trust']` does NOT include `'work'`, so the work-candidate set is UNCHANGED — still `{agency,designer,photographer,writer}`. The existing test asserting exactly that sorted set stays correct and green. VERIFIED, no change.
- **`src/modules/audience/product/promptBranch.test.ts`** (the reviewer's flag; note: the file lives under `audience/product/`, not `engines/`): it references `resolveEngineSectionSchema` ONLY in comments and builds prompts via `buildProductStrategyPrompt`/`buildProductCopyPrompt` from explicit fixture inputs — it does NOT call `resolveEngine` on the `manufacturer` businessType, so it asserts NO resolved-`thing` engine. Keys off input fields/voiceHint, not the engine resolver. SAFE, no change (green).
- **`src/modules/audience/product/voice.ts` / `voice.test.ts`:** `productVoiceForBusinessType` reads the SHARED `.voiceHint` field (not `copyEngine`), so `manufacturer ⇒ 'tailored-trade'` still resolves. SAFE, no change (green).
- **`classify.test.ts` / `serveGate.test.ts` / `serveMatrix.test.ts` / `entryClassify.schema.test.ts` / `workContract.test.ts`:** grep confirmed NONE of these use a `manufacturer` fixture in a resolution/serve assertion (their flipped-key fixtures are agency/designer). No manufacturer-specific engine or serve outcome is asserted anywhere in the suite. VERIFIED, no change. (serveMatrix iterates all keys generically: manufacturer now joins designer/agency in flipping serve→`engine-unresolved` manual, which still satisfies the generic row-shape test + the single==multi invariance — both manual, equal. Confirmed green.)
- **Runtime generation/extraction tests using `manufacturer`** (thing.test.ts, generationContract.test.ts, captureGolden.test.ts, entryCollections.test.ts, pageArchetypes.test.ts, collections/registry.test.ts, useWizardStore.test.ts, copyGuidance.test.ts, goals): all key off `businessTypeKey` / `extractionSchemaKey` / `structureDefault` (shared, unchanged fields), NOT the engine resolver. Unaffected, all green.

### Final ambiguous-entry set
Now exactly **{designer, agency, manufacturer}**. The other 6 keys stay committed (saas/app→thing, consultant/coach→trust, writer/photographer→work).
- `manufacturer` → `{candidateEngines:['thing','trust'], priorEngine:'thing'}` — resolves to `ask` (prior `thing`); D4 now fires on every manufacturer (its former zero-question committed-thing path is retired, per the founder's Phase-1-gate decision). copyEngine undefined / resolvedEngine null pre-pick.

### Deviations
None. Scope was exactly the manufacturer flip + fixture fallout. The two comment-accuracy touches (config.ts entry comment, extraction.test.ts test comment) are within the flip's blast radius. No new readers surfaced beyond those already union-aware from the base Phase-1 work.

### Verification
- `npx tsc --noEmit`: sole error is the pre-existing unrelated `src/app/page.tsx(6,26): error TS2307 @/assets/images/founder.jpg` (untouched file). No new errors.
- Affected subset (config, pipelineGuards, workContract, extraction, entryClassify, classify, serveGate, serveMatrix, voice, promptBranch): **10 files / 205 tests passed**.
- `npm run test:run`: **Test Files 250 passed | 1 skipped (251); Tests 4056 passed | 14 skipped (4070).** 0 failures (identical totals to the base Phase-1 audit — the flip re-pointed assertions without adding/removing tests net; config.test.ts swapped one assertion into a dedicated test, keeping the count stable).
