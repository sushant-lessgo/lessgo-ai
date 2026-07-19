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

## Phase 2 — Decider state machine + D1 entry + rail engine field

Branch: `feature/engineDecider` (verified `git branch --show-current` before any edit). No commits (orchestrator commits). UI-only phase — no renderer/published/template/schema/serve-gate code touched; firewall intact (AI still emits only signals; code resolves the engine).

### Files changed (complete scope map — 6 files, all on the plan's Phase-2 Files-touched list)

New (3):
1. `src/app/onboarding/[token]/components/decider/deciderMachine.ts` — the pure R1 status machine. `statusFromResolution(EngineResolution, confidence)` mirrors `buildBriefDraft`'s derivation exactly (committed lookup → known >=0.6 / almost-sure <0.6; tiebreaker → known; `ask` → ambiguous); `screenForStatus` maps status → D2/D3/D4 and is DEFENSIVE on `undefined` (→ resolving); `statusAfterPick` → confirmed. No React, no store, no 'use client'.
2. `src/app/onboarding/[token]/components/decider/deciderMachine.test.ts` — R1 table exhaustively: each committed/tiebreaker/ambiguous/unknown branch, the 0.6 boundary, and garbage/NaN/±Inf/out-of-range confidence (never throws, never flips an `ask` into a resolved screen) + screen-map + undefined defense + pick transition.
3. `src/app/onboarding/[token]/components/decider/D1Entry.tsx` — the hi-fi entry composer: radial-bg composer column (eyebrow pill "Welcome to Lessgo AI", 38px title, 2-tab segmented describe/site, orange Continue CTA, 3 example rows) + a live-read rail on the RIGHT whose `EngineRailField` runs spinner (loading) → resolved card. Wraps `useEntryClassify` (identical submit logic). Dwells 700ms on the resolved read, then hands the draft up via `onSuccess` (cleaned up on unmount).

Modified (3):
4. `src/app/onboarding/[token]/components/EntryInputStep.tsx` — extracted the submit/classify logic into an exported `useEntryClassify(onSuccess)` hook (value/loading/error/creditsBlocked state + URL⇒scrape / text⇒understand branch + credit-block handling, byte-for-byte). The component is now a thin consumer of the hook — same UI, same testids (`entry-credits-notice`), same behavior. Module helpers (`normalizeUrl`/`validateOneLiner`/`hostOf`) unchanged.
5. `src/components/onboarding/journey/UnderstoodRail.tsx` — added the exported `EngineRailField` component + `EngineRailFieldData` type and an OPTIONAL `engine?` prop on `UnderstoodRail` (renders the field at the top of the rail body when present; omitted = legacy rail unchanged). Three states keyed on `engineStatus`: resolving (blue label + spinner, dashed card, striped placeholder) / set — known|almost-sure|confirmed (white card, blue border, icon chip + plain label; green check only when confirmed; almost-sure = dashed "Confirming now…") / ambiguous (amber label + help icon, amber card "Could go two ways"). "Change how buyers decide" link emits `onChangeEngine` (Phase-4 wiring; prop exposed now). Prop-driven, no store read for the engine — so D1 can render it pre-hydration. `EngineStatus` imported type-only (erased; entry-bundle firewall intact — `journeyAgnostic.test.ts` green).
6. `src/components/onboarding/journey/UnderstoodRail.test.tsx` — new `engine field` describe: absent without the prop (legacy unchanged), resolving→spinner/no-link, confirmed→set card + green check, known→card no-check, ambiguous→amber "could go two ways", and the change link renders + fires its callback. Mounted through the real work seam + store as the existing suite does.
7. `src/app/onboarding/[token]/page.tsx` — D1 replaces the bare input step as a FULL-VIEWPORT early return (own chrome + rail, like the journey branches); D1 dynamically imported (ssr:false) so the rail→wizard-store graph stays off the entry bundle. Added a `DeciderState` interface + local state (R4: no new store) capturing oneLiner/entrySignals/engineStatus/resolvedEngine from the D1 read. Existing `confirm|manual|wizard|journey` branches untouched and reachable — D1's `onSuccess` still advances to `confirm` (routing re-pointed to D2–D6 in Phases 3–4). Dropped the now-unused `EntryInputStep` import.

### D1 / rail → design-token mapping
Built entirely on the ui-foundation app-chrome tokens (README §Design Tokens):
- Primary blue `#006CFF` = `app-primary`; deep blue `#003E80` = `app-primary-deep`; blue tint `#e6f0ff` = `app-tint`; orange CTA `#FF6B3D` = `app-cta` (+ `shadow-app-btn-cta`); ink `#191922` = `app-ink`; muted/faint/placeholder = `app-muted`/`app-faint`/`app-placeholder`; slate value text = `app-slate`; green check `#16a34a` = `app-success`; canvas frame `#ececee` = `app-frame`; rail `#fafafb` = `app-surface-sunken`; stripes placeholder = `bg-app-stripes`.
- Amber (ambiguous) has NO app token — used the exact design hexes as arbitrary values: text `#c47d1a`, bg `#fdf7ec`/`#fbf1e0`, border `#f0dcb4`. Blue engine-card border `#cfe0ff` likewise arbitrary (matches design).
- Radial composer bg, radii (`app-modal` 20 / `app-pill` 20 / `app-ctl` 10 / `app-panel` 14 / `app-input` 12), `shadow-app-float` for the input card, `font-app-sans` (UI) / `font-app-mono` (eyebrows/tags) per handoff.

### Deviations from the plan (in-scope judgment calls)
1. **Icons = lucide-react (R3), not the rail's AppIcon.** The existing rail uses `AppIcon` (self-hosted Material Symbols). R3 rules "map Material Symbols names → lucide-react" — followed literally for all NEW decider UI (D1 + engine field). No Google-Fonts runtime dep added. Deliberate minor icon-system mix within `UnderstoodRail.tsx` (lucide field alongside AppIcon rows) — R3 is explicit; visually consistent (both small monochrome glyphs).
2. **`'decider'` EntryStep enum member NOT added; `DeciderState` local state IS.** With no D2–D6 renderers until Phase 3, a `'decider'` step that renders nothing would be dead, unreachable code. Conservative choice: hold the decider fields in `DeciderState` local state (the concrete "hold decider state in local state" requirement) and keep D1 on the existing `'input'` step; the `'decider'` routing branch + D2–D6 render land in Phase 3 when they exist. Captured, not routed — exactly what "do not wire the new routing yet" asks.
3. **`DeciderState` held setter-only (`const [, setDeciderState] = useState`).** Nothing reads it in Phase 2 (Phases 3–5 do). Setter-only destructuring holds the state while avoiding an unused-binding lint error; the reader is added when routing consumes it.
4. **User-facing engine copy is plain-language, no engine jargon.** The closed-5 engine names never surface: engine card labels are "Lead with your work / your experience / your product / your place" + "One clear ask"; example tags are "PRODUCT / EXPERIENCE / COULD GO TWO WAYS" (not THING/TRUST/ASK). Placeholder copy; Phase 7 does final humanization.
5. **D1 dwells 700ms then advances to the existing confirm branch.** Phase 2 has no D2–D6 to route to, so after showing the resolved rail card D1 hands off to the current confirm/journey path (unchanged reachability). The full resolved-card DWELL + D2–D6 routing is Phase 3–4. Satisfies the manual check "spinner → resolved card".

### Firewall / invariants held
- AI never emits an engine; `deciderMachine`/`buildBriefDraft` (code) decide. No blocking confirm added (D1 auto-advances).
- Entry-bundle firewall: D1 dynamically imported (ssr:false) so the rail→`useWizardStore` graph never enters the entry bundle; `EngineStatus` type-only import into `UnderstoodRail`. `journeyAgnostic.test.ts` green.
- No renderer/`.published.tsx`/template/schema/serve-gate/`/api/brief/confirm` code touched. Dual-renderer parity out of blast radius.
- `BriefSchema.copyEngine` enum untouched; place/quick-yes still never written to `brief.copyEngine` (ambiguous rail card shows "could go two ways", no engine claimed).

### Verification
- `npx tsc --noEmit`: sole error is the pre-existing unrelated `src/app/page.tsx(6,26) TS2307 @/assets/images/founder.jpg` (untouched file). No new errors.
- Targeted: `deciderMachine.test.ts` + `UnderstoodRail.test.tsx` + `journeyAgnostic.test.ts` — **3 files / 39 tests passed**.
- `npm run test:run`: **Test Files 251 passed | 1 skipped (252); Tests 4071 passed | 14 skipped (4085).** 0 failures (+15 net vs the Phase-1 base 4056: deciderMachine + rail engine-field).

### Open risks / notes
- D1's rail is a bespoke lightweight aside (not the store-bound `UnderstoodRail`) because no wizard store is hydrated at entry — it reuses the shared `EngineRailField` for the engine block only. If Phase 3+ wants D1's fact rows editable, they'd need the store; deferred (design shows D1's rail as read-only "first read").
- The 2-tab describe/site control is cosmetic (placeholder/helper only) — submission still auto-detects URL vs text via `normalizeUrl`, matching the single-field architecture. No behavior fork introduced.
- Manual dev check (not automated this phase): submit a one-liner → rail spinner → resolved card → advances to the existing confirm/journey branch. Full D2–D6 routing + e2e land in Phases 3–4.

## Phase 3 — Work lane: D2 / D3 / D6 + journey handoff (O1 dies here)

Branch: `feature/engineDecider` (verified `git branch --show-current` before any edit). No commits (orchestrator commits). No renderer/`.published.tsx`/template/schema/`/api/brief/confirm` server code touched; firewall intact; seam contract (`engines/types.ts`) NOT widened.

### Files changed (complete scope map — 11 entries)

New (4):
1. `src/app/onboarding/[token]/components/decider/D2Known.tsx` — the "known & unambiguous → don't ask" screen. Icon tile + "You're a <type> — so we'll lead with your work." + a change-affordance card (greyed placeholder → D4, Phase 4) + a blue "Looks right — continue" CTA (→ D6) + a right rail carrying `EngineRailField` (status `known`). Exports `ENGINE_LEAD` (plain-language per-engine copy) reused by D3/D6.
2. `src/app/onboarding/[token]/components/decider/D3AlmostSure.tsx` — one-tap confirm. Primary "Yes — that's it" card (→ D6, PURE local state — no re-classify, no extra UNDERSTAND credit) + secondary "It's something else" (greyed placeholder → D4). Rail `EngineRailField` status `almost-sure`.
3. `src/app/onboarding/[token]/components/decider/D6Handoff.tsx` — **owns the confirm handoff.** "ENGINE SET" header + belief-lifecycle card (Inferred → Revised → Committed) + dark handoff banner whose Continue performs `loadJourneySeam(copyEngine)` → `seam.enrichDraftForConfirm(draft)` (PURE) → `POST /api/brief/confirm` → serve = `window.location.assign(redirectTo)` / manual = `onManual(missing)`. Shows NO editable one-liner and never re-classifies (the O1 kill).
4. `src/app/onboarding/[token]/components/decider/D6Handoff.test.tsx` — ports the confirm-owner gate from the retired `JourneyEntryStep.test.tsx`: serve (hard-nav), manual (+ fallback tag), seam enrichment (`facts.work` built, every group `kind`-valid, sibling `facts.entry` survives — landmines 4/6), non-ok + thrown error handling, and a NEW "O1 kill" test asserting no `<textarea>`/one-liner input exists and `/api/v2/understand` is never called. Drops the edited-line re-classify tests (that behavior is deliberately gone).

Modified (3):
5. `src/app/onboarding/[token]/page.tsx` — work-lane routing. Added `'decider'` `EntryStep` + `deciderScreen` state; **WIRED A REAL READER of `DeciderState`** (Phase-2 carry-forward: it was setter-only) — D2/D3/D6 consume `deciderState.resolvedEngine`/`engineStatus`. D1 `onSuccess` now routes `resolvedEngine === 'work'` → `screenForStatus(engineStatus)` → D2 or D3 → D6; every other lane keeps the existing `confirm` path (Phases 4–5 re-point). **Retired the PRE-CONFIRM `JourneyEntryStep` branch** (dynamic import + the `hasJourneySeam` confirm-seam early return both removed; `hasJourneySeam` import dropped, `screenForStatus` added). D2/D3/D6 dynamically imported (`ssr:false`) — same firewall discipline as JourneyShell.
6. `e2e/work-onboarding.spec.ts` — header comment only: the entry path is now the decider; STEP-01 coverage points at `engine-decider.spec.ts` + `D6Handoff.test.tsx` (was `JourneyEntryStep.test.tsx`). The seed-resume tests are unchanged (they enter post-confirm, not through entry).
7. `src/modules/brief/serveGate.test.ts` — STEP-0 serveability pre-check describe (2 tests, below).

Deleted (2):
8. `src/components/onboarding/journey/JourneyEntryStep.tsx` — the O1 double-entry screen. Sole non-comment importer was `page.tsx` (now routes to the decider). Not referenced by `resolveResumeStep`/resume (STEP 01 is pre-confirm, never resumed). Confirmed via grep before deleting.
9. `src/components/onboarding/journey/JourneyEntryStep.test.tsx` — its test (would fail to import). Coverage ported to `D6Handoff.test.tsx`.

Registration (1):
10. `playwright.config.ts` — added `/engine-decider\.spec\.ts/` to the `authed` testMatch allowlist. **DEVIATION — file NOT on Files-touched (see Deviations).**

### Serveability pre-check RESULT (STEP 0) — photographer SERVES atelier
Ran the pre-check FIRST, before building the happy path. A photographer one-liner classified the way D1 hands it to the decider — `buildBriefDraft` → `resolvedEngine: 'work'`, `classificationSource: 'lookup'`, `tiebreaker: 'none'` (the WORK_BRIEF_FIXTURE shape, NOT `portfolio-is-proof`) — `decideServe` returns `{ outcome: 'serve', audienceType: 'service', templateId: 'atelier', shortlist: [...atelier] }`. Evidence: the two new `serveGate.test.ts` tests ("photographer (lookup, tiebreaker none) => serve / service / atelier — no rungC probe" and "designer PICKED work => serve / atelier") are GREEN, alongside the pre-existing photographer/atelier serve tests (`:291`, `:446`) and the live `seedWorkBrief`/`workBriefFixture` drift guard. The stale config/serveGate comments claiming `gallery` is unbacked are wrong — atelier natively declares `gallery` on the work engine, so a work brief shortlists atelier through the NORMAL capability path (no `portfolio-is-proof` rungC injection needed). The work critical path is met; I proceeded.

### Where the confirm-handoff now lives (the load-bearing move)
The WHOLE pre-journey handoff sequence moved from `JourneyEntryStep.confirmDraft` to **`D6Handoff.tsx`** verbatim: `loadJourneySeam(engine)` → `seam.enrichDraftForConfirm(draft)` → `POST /api/brief/confirm` → serve => `window.location.assign(redirectTo)` (a full load re-runs page.tsx load-detection `:136-155`, which mounts `JourneyShell` at `showWork` because the confirm serve branch persisted `brief.copyEngine` + `audienceType` + `templateId`) / manual => `onManual(missing)` → the existing `ManualOnboardStep` branch (Phase 5 reskins it; it is NOT a dead-end now). `page.tsx` only ROUTES; it does not duplicate the POST. `/api/brief/confirm/route.ts` was NOT edited — request `{tokenId, brief}` / response `{outcome, redirectTo|missing}` unchanged.

### What happened to JourneyEntryStep — DELETED
Retired from the entry path AND deleted (both file + test). It was reachable only via page.tsx's PRE-CONFIRM seam branch, which the work lane now bypasses (D1 → decider → D6). No resume/other importer. Its confirm-owner coverage is ported to `D6Handoff.test.tsx`; its edited-line re-classify tests are intentionally gone (that second editable one-liner + second UNDERSTAND credit WAS the O1 defect).

### The O1-kill e2e assertion
`e2e/engine-decider.spec.ts` (authed, `/api/v2/understand` route-intercepted to a photographer→work brief since mock mode can't classify work): photographer one-liner at D1 → D2 → D6 → `step-show-work`. The one-liner input (`d1-entry-input`) is asserted `toHaveCount(1)` at D1 and `toHaveCount(0)` at D2 / D6 / the journey; the retired O1 ids (`journey-entry-oneliner`, `journey-entry-step`) are asserted `toHaveCount(0)` at every post-D1 screen; D6 is asserted to carry zero `<textarea>`. Conjunction = the one-liner appears EXACTLY ONCE. The real authed `/api/brief/confirm` serves (`loadDraft` asserts `service`/`atelier`/`copyEngine:'work'` + enrichment-built `facts.work`), proving serve — not demand.

### Deviations from the plan
1. **`playwright.config.ts` registration (out-of-Files-touched edit — flagged).** The `authed` testMatch is an explicit ALLOWLIST (the config's own comment warns an unregistered spec silently runs under no project = false confidence), and the orchestrator's verification command `npx playwright test e2e/engine-decider.spec.ts` finds zero tests unless the spec is registered. Adding a runnable Playwright spec in this repo is impossible without it. I made the single minimal one-line addition (matching the pre-registration pattern used for blog/media specs) rather than shipping a spec that cannot run. Flagged here for review since the file was not on the Phase-3 Files-touched list.
2. **D2 auto-continue = CTA-only, NO timer (Unresolved Q3, conservative).** The design says "auto-continues in a moment"; the plan's own Q3 flags that a timed advance can race the change-affordance (and would race the e2e). Conservative pick: a primary Continue CTA, no `setTimeout` auto-advance. Founder can revisit at the Phase-7 copy/hi-fi gate.
3. **D2/D3 change-affordance + D3 "something else" = greyed placeholder, not a route.** D4 does not exist until Phase 4; the plan permits "a safe stub/no-op." Rather than route to the legacy `ConfirmBriefStep` (jarring), these render disabled/greyed with a "coming soon" hint (matches the greyed-placeholder-for-missing-functionality rule) — no dead-end. Phase 4 wires the real `onChange`/`onSomethingElse` → D4. In the work lane D3's only live action is "Yes" (confirms work), the intended critical path.
4. **D6 rail/top-bar fidelity is lightweight, not the full store-bound rail.** Like Phase 2's D1, the decider screens render a bespoke read-only right rail (reusing the prop-driven exported `EngineRailField`) — the wizard store is not hydrated pre-confirm. D6 uses `JourneyTopBar step={null}` (pre-confirm, no dot progress) rather than faking a 6-dot tracker. Hi-fi polish is Phase 7.
5. **`D6Handoff.test.tsx` created (companion of a Files-touched file).** Not separately listed in the plan, but it is the test FOR `D6Handoff.tsx` and the replacement for the retired `JourneyEntryStep.test.tsx` — required to preserve the confirm-owner gate. In-scope decider work.
6. **D2 rail shows `known` (blue card, no green check), not `confirmed`.** The scout's D2 sketch shows a green check; the state machine says D2 is `engineStatus: 'known'` (user hasn't confirmed yet — confirmation is the D6 continue). Showed `known` to stay honest to the machine; Phase 7 can adjust the visual per founder taste.

### Not touched (noted)
- `e2e/helpers/seedWorkBrief.ts` + `e2e/helpers/workBriefFixture.ts` carry a stale comment mentioning `JourneyEntryStep.test.tsx`; they are OUT of Files-touched and only comments — left untouched.

### Verification
- `npx tsc --noEmit`: **exit 0, clean** (the previously-noted `founder.jpg` TS2307 resolved once `.next/types` regenerated during the e2e dev-server boot — no source change; no new errors either way).
- `npm run test:run` (full vitest): **Test Files 251 passed | 1 skipped (252); Tests 4069 passed | 14 skipped (4083).** 0 failures. (Net −2 vs the Phase-2 base 4071: deleted JourneyEntryStep's ~13 tests incl. the removed edited-line re-classify, added D6Handoff's 9 + serveGate's 2.)
- Targeted: decider dir (`D6Handoff.test.tsx`) + `serveGate.test.ts` + `journeyAgnostic.test.ts` — 4 files / 77 tests passed.
- `npx playwright test e2e/engine-decider.spec.ts`: **2 passed** (setup + the O1-kill spec, 23.7s) — REAL run (dev server booted, real Clerk auth, real `/api/brief/confirm` serve, real `loadDraft`).
- `npx playwright test e2e/work-onboarding.spec.ts -g "resumes the JOURNEY shell|legacy unchanged"`: **3 passed** (dispatch resume-mount + legacy-unchanged still green after the JourneyEntryStep deletion + page.tsx rewire). The remaining work-onboarding tests are the multi-minute real-generation runs; they enter post-confirm (seed-resume) and my only change to that file was a comment, so they are unaffected — not re-run here to bound time.

### Open risks / notes for the human gate (spec gate 3, part 2/2)
- Mock mode still cannot classify work, so the e2e pins the ONE classifier call via route-intercept. The founder-QA on dev (real `/api/v2/understand`) is the only place the true photographer→work classification is exercised end to end — the gate the plan reserves. Everything downstream of that call is real in the e2e.
- Ambiguous/non-work lanes (designer, thing/trust, place) still route to the legacy `confirm` path this phase — Phase 4 (D4) + Phase 5 (D5) re-point them. Deliberate (work lane only).
- Greyed change-affordances mean a work-lane visitor who genuinely isn't work has no in-decider escape until Phase 4; interim + honest (Phase 4 is the immediate next slice).

## Phase 3 — follow-up (cut D2/D6 for clear path, rail left)

Branch: `feature/engineDecider` (verified `git branch --show-current` before any edit). No commits (orchestrator commits). No renderer/`.published.tsx`/template/schema/`/api/brief/confirm` server code touched; seam contract (`engines/types.ts`) NOT widened; firewall intact.

Founder QA at the Phase-3 gate dictated two flow changes; this amends Phase 3.

### Files changed (complete scope map — 8 entries)

New (2):
1. `src/app/onboarding/[token]/components/decider/engineCopy.ts` — NEW shared module. Holds `ENGINE_LEAD` (moved from the deleted `D2Known.tsx`, whose export `D3AlmostSure`/D6 imported) + `ENGINE_QUESTION` (moved from `D3AlmostSure.tsx` local). Nothing now imports engine copy from a deleted screen. `.ts` (not `.tsx`) so icons are built with `createElement` instead of JSX. Plain-language, no engine jargon.
2. `src/app/onboarding/[token]/components/decider/FinalizeHandoff.tsx` — the RENAMED, headless replacement for `D6Handoff.tsx`. Same confirm-handoff ownership; the ONLY behavioural change is the TRIGGER — it fires the WHOLE sequence AUTOMATICALLY in a mount-once `useEffect` behind a minimal "Setting up your site…" spinner (NO Continue button, NO belief-lifecycle card, NO engine-ceremony copy). Added a `seam == null` guard (the old D6 disabled its CTA until the seam loaded; the headless version guards inline). `data-testid="decider-finalize"` + `decider-finalize-error`.

New/renamed test (1):
3. `src/app/onboarding/[token]/components/decider/FinalizeHandoff.test.tsx` — the ported `D6Handoff.test.tsx`, rewritten for auto-fire (mount → `waitFor` the outcome, no CTA click). Preserves every gate: serve hard-nav, manual + fallback tag, seam enrichment (`facts.work` built, every group `kind:'category'`, sibling `facts.entry` survives), non-ok error (no nav/manual), thrown fetch, and the O1 kill (no `<textarea>`, no `journey-entry-oneliner`, never `/api/v2/understand`).

Deleted (2):
4. `src/app/onboarding/[token]/components/decider/D2Known.tsx` — cut from the flow (the clear/known path no longer shows a "you're a photographer" screen).
5. `src/app/onboarding/[token]/components/decider/D6Handoff.tsx` — renamed to `FinalizeHandoff.tsx` (see #2). (There was no separate `D2Known.test.tsx`; the D6 test became `FinalizeHandoff.test.tsx`.)

Modified (3):
6. `src/app/onboarding/[token]/components/decider/D3AlmostSure.tsx` — imports `ENGINE_LEAD` + `ENGINE_QUESTION` from `./engineCopy` (was `./D2Known` + a local const); rail moved to the LEFT (aside first, `border-r`; composer to its right). "Yes" behaviour unchanged (pure local state; page now routes it to `finalize`).
7. `src/app/onboarding/[token]/components/decider/D1Entry.tsx` — rail moved to the LEFT (aside first with `border-r`, composer to its right); header comment updated. No logic change.
8. `src/app/onboarding/[token]/page.tsx` — routing rework. `DeciderScreen` type `'D2'|'D3'|'D6'` → `'D3'|'finalize'`; default state `'D2'` → `'finalize'`. D1 `onSuccess` work-lane: `screenForStatus` `'D3'` → D3, everything else (i.e. `known`) → STRAIGHT to `finalize`. Decider render: D2 branch DELETED; D3 `onYes` → `finalize`; the fall-through renders `FinalizeHandoff`. Dynamic import `D6Handoff` → `FinalizeHandoff`; `D2Known` import removed. `screenForStatus` still consumed (unchanged).

Also updated (e2e, in this phase's Files-touched):
9. `e2e/engine-decider.spec.ts` — photographer test now asserts the CUT path: after D1 Continue, `decider-d2` / `decider-d6` / `decider-d6-continue` all `toHaveCount(0)` (no second screen, no second Continue), then the work journey (`step-show-work`) renders via the silent finalize. O1 assertion KEPT + meaningful: `d1-entry-input` visible + `toHaveCount(1)` at D1, and `assertNoOneLinerInput` (count 0) at the journey — appears exactly once. `decider-d2` testid removed.
10. `e2e/work-onboarding.spec.ts` — comment-only: stale `D2 → D6` / `D6Handoff.test.tsx` references repointed to the silent-finalize flow + `FinalizeHandoff.test.tsx`.

### Where the confirm-handoff now fires (proving it is preserved)
The load-bearing sequence moved from `D6Handoff.confirm handler` (Continue click) to `FinalizeHandoff`'s mount-once `useEffect`, byte-equivalent:
`loadJourneySeam(briefDraft.copyEngine)` → `seam.enrichDraftForConfirm(briefDraft)` [PURE] → `POST /api/brief/confirm` `{tokenId, brief: enriched}` → `res.ok && json.outcome`: `serve` + `redirectTo` ⇒ `window.location.assign(redirectTo)` (hard nav → load-detection mounts `JourneyShell` at showWork) / else ⇒ `onManual(typeof json.missing === 'string' ? json.missing : 'rungA:unclassified')`. Non-ok/no-outcome ⇒ inline error, no nav/manual. `/api/brief/confirm/route.ts` and the seam contract UNEDITED. The e2e's real authed confirm still serves atelier (`loadDraft` → `service`/`atelier`/`copyEngine:'work'` + enrichment-built `facts.work`).

### The new known-path flow
- KNOWN (clear committed engine, e.g. explicit photographer→work): D1 → `finalize` (silent spinner, auto-confirm on mount) → hard-nav → work journey at Show Your Work. No D2, no D6 ceremony, one Continue click total.
- ALMOST-SURE: D1 → D3 (one-tap "Yes") → `finalize` → journey. No D6 ceremony.
- D4 (Phase 4) work-pick will route through the SAME `finalize` transition — seam left obvious in `page.tsx` (comment) and `FinalizeHandoff.tsx` (header).

### Rail placement
Rail moved to the LEFT on `D1Entry.tsx` and `D3AlmostSure.tsx` (aside first in DOM, `border-r`, composer to its right) — matches the work journey's "what we understood" rail. `FinalizeHandoff` shows a minimal centered spinner (no rail, per "minimal setting-up spinner").

### Deviations
None material. In-scope judgment calls:
- Kept `resolvedEngine` in `FinalizeHandoff`'s prop interface (destructured out) — unused for display but load-bearing signal for D4's future work-pick seam; matches the e2e/test which pass `resolvedEngine="work"`.
- `FinalizeHandoff` shows NO rail (founder: "if it shows a rail" — it does not; a bare spinner is the minimal transition asked for).
- Reused the machine's `screenForStatus` unchanged (still returns `'D2'` for `known`); `page.tsx` maps anything-not-`'D3'` → `finalize`, so `deciderMachine.ts` needed no edit (out of this phase's touch set).

### Firewall / invariants held
- AI never emits an engine; only code resolves it. No blocking confirm — the known path never stops; D3 is one-tap.
- `BriefSchema.copyEngine` enum untouched; `/api/brief/confirm` request/response shape unchanged. Seam contract not widened.
- FinalizeHandoff dynamically imported (ssr:false) — seam/generation graph off the entry bundle. No renderer/template/published code touched.

### Verification
- `npx tsc --noEmit`: clean, exit 0 (no `founder.jpg` artifact this run — `.next/types` regenerated during the e2e dev boot).
- `npm run test:run`: **Test Files 251 passed | 1 skipped (252); Tests 4069 passed | 14 skipped (4083).** 0 failures (identical totals to the Phase-3 base — D6's 7 tests became FinalizeHandoff's 7).
- Decider dir targeted: `deciderMachine.test.tsx` + `FinalizeHandoff.test.tsx` — 2 files / 16 tests passed.
- `npx playwright test e2e/engine-decider.spec.ts`: **2 passed** (setup + photographer silent-finalize spec, 26.2s) — REAL run (dev server, real Clerk auth, real `/api/brief/confirm` serve, real `loadDraft`).

### impl-review fixes (blocking + 2 nits)

Files changed (2): `FinalizeHandoff.tsx`, `FinalizeHandoff.test.tsx`. (NIT 2's D3 greying was already present — see below.)

**BLOCKING — mount-once guard on `FinalizeHandoff.tsx`.** The auto-confirm effect had only a per-invocation `cancelled` cleanup flag, which stops post-unmount setState but NOT a second effect invocation's `fetch`. Under Next's default `reactStrictMode:true`, StrictMode dev-double-invokes the effect (setup→cleanup→setup) → two `/api/brief/confirm` POSTs → `importScrapedTestimonials` (read-then-write, no unique index) races itself → duplicate testimonial rows + double nav. Fix: a persistent `firedRef = useRef(false)` guard — survives the same-fiber remount, so the confirm fires EXACTLY once.

- **Deviation from the literal spec (in-scope, necessary):** the spec said "keep the existing `cancelled` cleanup logic as-is." Implemented literally (`firedRef` guard + closure `cancelled`), this yields ZERO POSTs under StrictMode, not one: setup1 fires the single async, cleanup1 flips its captured `cancelled=true`, setup2 is skipped by the guard, and the one async then aborts at its post-await `if (cancelled) return`. Empirically confirmed — the test hung at 0 POSTs. Replaced the per-invocation `cancelled` closure with a component-level `activeRef = useRef(true)` set true at the TOP of every setup (before the fired guard) and false in cleanup. StrictMode's re-setup restores `activeRef=true`, so the single in-flight async (kept alive by `firedRef`, not restarted) resumes against an active component and POSTs once; on a REAL unmount there is no re-setup so it stays false and late setState/nav is skipped. The spec's INTENT (single confirm + post-unmount guard) is preserved; only the mechanism differs.

**NIT 1 — real Retry on the error path.** Non-ok/thrown confirm now renders a `Try again` button (`data-testid="decider-finalize-retry"`) whose `handleRetry` resets `firedRef.current = false`, clears the error, and bumps a `retryNonce` state that the confirm effect depends on — the only way the effect re-runs. Guarded against concurrent double-fire: `inFlight` state disables the button and `handleRetry` early-returns while a confirm is in flight.

**NIT 2 — greyed inert D3 affordance (already satisfied; no edit needed).** `D3AlmostSure.tsx` already renders "It's something else" as visibly disabled/greyed (`disabled={!onSomethingElse}`, `opacity-60 cursor-not-allowed`, "Coming soon" `title`, "Changing this is coming soon" subtext) when `onSomethingElse` is absent — which is exactly how `page.tsx` renders it (only `onYes` wired). The rail's "Change how buyers decide" affordance does NOT render on D3 (`EngineRailField` only shows the button when `onChangeEngine` is truthy; D3 passes the undefined `onSomethingElse`), so there is no live-but-dead rail control to grey; greying an absent control would require editing the shared `UnderstoodRail.tsx`, out of this fix's scope. Left as-is; D4 (Phase 4) re-enables both by wiring `onSomethingElse`.

**StrictMode test strengthening.** Added `mountFinalizeStrict` (wraps in `<React.StrictMode>`) + a new test asserting `/api/brief/confirm` is POSTed EXACTLY once and `window.location.assign` called exactly once under StrictMode — this is the regression the pre-existing `:153` test (non-strict mount) missed. Also added a Retry test (first confirm fails → click Retry → second confirm serves + hard-navs; asserts exactly 2 confirm POSTs, proving the re-fire). The 0-POST hang seen during development proves this env genuinely double-invokes effects, so the test exercises the real StrictMode path.

Verification (re-run after these fixes):
- `npx tsc --noEmit`: clean, exit 0.
- `FinalizeHandoff.test.tsx`: **9 passed** (was 7 + 2 new).
- `npm run test:run`: **Test Files 251 passed | 1 skipped (252); Tests 4071 passed | 14 skipped (4085).** 0 failures.
- `npx playwright test e2e/engine-decider.spec.ts`: **2 passed** (setup + photographer silent-finalize, real authed run).

Open risks: none new. StrictMode double-invoke behaviour is dev-only; production fires once regardless, but the `firedRef` guard also protects against any future genuine remount. `importScrapedTestimonials` remains single-flight-by-contract (no DB unique index) — the guard removes the only known client-side double-fire; a server-side idempotency key is still a separate hardening opportunity (out of scope).
