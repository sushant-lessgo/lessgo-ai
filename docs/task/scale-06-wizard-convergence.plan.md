# scale-06 — one wizard engine, resolved by contract — PLAN

**Branch:** `feature/scale-06-wizard-convergence`
**Spec:** `docs/task/scale-06-wizard-convergence.spec.md`
**Strategy:** pilot-first. Phases 1–6 = thin vertical slice (THING engine end-to-end through the unified wizard) → human gate → expand to trust (8), work/writer (9) → kills/redirects (10) → QA (11). Old wizards stay fully functional until phase 10; nothing breaks mid-build.

## Overview

Kill the product/service wizard fork. One wizard renderer + one Brief-backed store serves all engines; the question set is computed, not designed: `ask = contract(engine) − scraped − inferred − dropped`. Fixed slot skeleton (identity · understanding · goal · offer · proof · style [· structure, thing-only] · generating) with per-engine slot skips; scrape prefill gives review-mode, manual entry gives fill-mode — same components. Writer becomes a self-serve path (work engine), the vestria scrape-schema coupling and template/persona bridges die, and the proof hard rule (no promised proof ⇒ section never generated) is enforced in the pipeline for product too.

## Progress log

- phase 1 engine input contracts + waterfall: done (commit a67e4ac, review loops 1, ship — 38/38 tests, tsc clean)
- phase 2 unified Brief-backed wizard store: done (commit c1c30fe, review loops 1, ship — 18/18 tests, tsc clean)
- phase 3 wizard shell + entry→wizard handoff + core slots: done (commit 1884447, review loops 1, ship — tsc clean, full suite 1198 green)
- phase 4 goal/proof/style/structure slots + product proof hard rule: done (commit 619005a, review loops 1, ship — 64/64 tests, tsc clean; WizardShell edited not page.tsx [stale filename])
- phase 5 shared generation core + GeneratingSlot (thing): done (commit 27c5811, review loops 1, ship — 50/50 tests, tsc clean; PILOT SLICE COMPLETE)
- phase 6 HUMAN GATE — thing pilot review: SIGNED OFF by founder. Decisions: differentiator=GUIDED CHIPS (implement now, phase 6b); numbers=require≥1 skippable-with-warning (already built); cosmetic fixes (GeneratingSlot setState) deferred to phase 10.
- phase 6b differentiator guided chips: done (commit 0cf803d, orchestrator spot-verified — all 3 engines' differentiator field [thing differentiator/trust process/work bioStory, all askCandidate:'differentiator' WHY-YOU] now guided-chips; tsc clean, 49 tests)
- phase 7 scrape convergence (businessType-keyed extraction): done (commit pending-sha, review loops 1, ship — 103 tests, tsc clean; +config.test.ts fix authorized; businessType field dormant until a caller wires it [phase 8/11])
- phase 8 trust engine through unified wizard: pending
- phase 9 work engine / writer self-serve: pending
- phase 10 kills, redirects, old-store retirement: pending
- phase 11 fixtures, e2e, acceptance QA: pending

## Design decisions (binding for all phases)

- **Route + handoff mechanism:** the unified wizard lives inside the existing universal entry route `src/app/onboarding/[token]/`. Handoff works via the CONFIRM ROUTE + LOAD-DETECTION pair (both change in phase 3):
  - `/api/brief/confirm` branches `redirectTo` per engine: engines migrated to the unified wizard ⇒ `/onboarding/${tokenId}`; not-yet-migrated engines ⇒ old `/onboarding/${audienceType}/${tokenId}`. Migration set grows per phase: thing (3) → +trust (8) → +work (9) → branch deleted, always unified (10).
  - `ConfirmBriefStep` keeps its hard `window.location.assign(redirectTo)` — no in-memory continuation.
  - `[token]/page.tsx` gains load-detection: on mount, fetch the project (loadDraft path); if a DB-confirmed brief exists (`Project.brief` non-null + `audienceType` set) ⇒ render the WIZARD dispatcher; else ⇒ entry flow (`input|confirm|manual`). This one mechanism gives both the post-confirm landing AND reload/resume-mid-wizard (net-new capability — old entry was in-memory, reload = restart).
- **Store:** new `useWizardStore` (Zustand+Immer, `src/hooks/`) is the single source of truth. Slot machine keyed by slot IDs (not indices). Field state model reuses the `useOnboardingStore` idea: `{ value, source: 'scraped'|'inferred'|'user', confirmed }`. Hydrates from `Project.brief`; persists onboarding progress the same way old stores do (draft save).
- **Contracts:** per-engine input contract = 5 fact groups (WHO / WHAT / WHY-BELIEVE / WHY-YOU / ACT), each field tagged `tier` (T1 word / T2 existence boolean / T3 artifact), `required|optional`, `slot`, optional `dropTarget` (section type cut when unanswered). businessType entry (`src/modules/businessTypes/config.ts`) supplies ONLY labels/examples/extraction-schema key (`wizardFields`), never shape.
- **API routes unchanged in contract** (except product strategy gaining proof booleans in phase 4, and `/api/brief/confirm`'s redirect branching above). The generation core adapts wizard/brief state → the exact payloads `/api/audience/{product,service}/strategy` + `/generate-copy` already expect (UnderstandingData vs ServiceUnderstanding reconciled by adapters, not by changing routes).
- **Timing tiers:** T1 → wizard text; T2 → wizard 1-tap booleans (ProofSlot); T3 → editor-only, EXCEPT work engine asks 3–5 work uploads in the wizard.
- **Old code untouched until phase 10** (sole exceptions: the confirm-route redirect branch + additive proof field on product strategy). Shared field components (ChipInput, PaletteSwatch) are copied into `src/components/onboarding/shared/`, not moved, so old wizards keep working; originals deleted with the fork.
- **Dual-renderer:** no block edits planned. GoalSlot reuses scale-05 machinery (FollowStrip etc. already have `.published` pairs). If any phase ends up touching a block, both `.tsx` + `.published.tsx` must move together.
- **Landmines:** no schema/migration expected (Brief already persisted). `npm run build` (not bare `next build`) in phases 10–11. Type imports from old stores (paletteSelection files, understandService.schema, types/service) are RE-POINTED before deletion — never dropped (field-drop regression lesson).

---

## Phase 1 — engine input contracts + question waterfall (pure modules)

**Files touched**
- create `src/modules/engines/inputContracts.ts`
- create `src/modules/engines/inputContracts.test.ts`
- create `src/modules/wizard/waterfall.ts`
- create `src/modules/wizard/waterfall.test.ts`

**Steps**
1. `inputContracts.ts`: types (`FactGroup`, `ContractField`, `EngineContract`) + contracts for `thing`/`trust`/`work` per spec §8 table. Encode slot membership, tiers, required/optional, `dropTarget` section types, and per-engine slot skips (reserve `quick-yes` skips-offer flag — data only, no engine). ASK candidates converge on: differentiator · real numbers · proof artifacts · goal param.
2. `waterfall.ts`: `computeFieldStates(brief, contract, businessTypeEntry)` → per-field `scraped | inferred | ask | drop`; `computeAsks(...)` returns the ordered ask list. Consumes `brief.facts` (+ `brief.facts.entry` superset) and confidence. Deterministic, no store/UI deps.
3. Tests: contract shape invariants (5 groups per engine, thing/trust/work core-section alignment with `src/modules/engines/coreSections.ts`); waterfall: rich-brief fixture ⇒ asks ≤3, bare one-liner brief ⇒ asks ≤6 (acceptance encoded as unit tests from day one).
4. Open-question defaults baked in (tunable at phase-6 gate): differentiator = free text; numbers = require ≥1 of outcomes/credentials, skippable with warning.

**Verification:** `npx tsc --noEmit` + `npm run test:run -- src/modules/engines src/modules/wizard`.

## Phase 2 — unified Brief-backed wizard store

**Files touched**
- create `src/hooks/useWizardStore.ts`
- create `src/hooks/useWizardStore.test.ts`
- edit `src/hooks/README.md`

**Steps**
1. `useWizardStore`: token scope; `engine`/`businessTypeKey`/`audienceType`/`templateId` resolved from Brief + serveGate result; slot list computed from contract (skips applied); per-field state map; `mode: 'review'|'fill'` derived from entry source (URL/scrape ⇒ review, manual ⇒ fill); goal state reuses scale-05 vocabulary (`goalIntent`/`goalParam`, `intentToBriefGoal` composer from `src/modules/brief/bridge.ts`); proof booleans (superset of `ServiceAssetAvailability`); thing-only: sitemap/strategy + hero/style/mood picks; trust-only: variantId/paletteId.
2. Hydration: from `Project.brief` on mount (same loadDraft path the entry funnel already uses) + resume-from-DB parity with old stores.
3. Persistence: mirror old stores' draft-save cadence (write brief-draft + onboarding progress).
4. Tests: slot machine transitions per engine (skips honored), hydration from brief fixtures, review/fill mode derivation.

**Verification:** `npx tsc --noEmit` + `npm run test:run -- src/hooks/useWizardStore.test.ts`.

## Phase 3 — wizard shell + entry→wizard handoff + core slots (identity / understanding / offer)

**Files touched**
- edit `src/app/api/brief/confirm/route.ts` (redirect branch keyed by the `WIZARD_ENGINES` set from `rollout.ts` — `WIZARD_ENGINES.has(brief.copyEngine)` ⇒ `redirectTo: /onboarding/${tokenId}`; else keep `/onboarding/${decision.audienceType}/${tokenId}` — line 71 today is hard-coded to old wizards. NOTE: key on the const set, NOT a literal `=== 'thing'`, so phases 8/9 are genuine no-ops in this route — plan-review nit 2)
- edit `src/app/onboarding/[token]/components/ConfirmBriefStep.tsx` (no behavior change to the `window.location.assign` at lines 79–86 — touched only if the response shape gains the branch field; keep the hard navigate)
- edit `src/app/onboarding/[token]/page.tsx` (load-detection + wizard dispatcher: extend `EntryStep` `'input'|'confirm'|'manual'` with `'wizard'`; on mount fetch project — DB-confirmed brief (`Project.brief` + `audienceType` set) whose engine ∈ `WIZARD_ENGINES` ⇒ `'wizard'`, else `'input'`; `'wizard'` renders WizardShell + slots off `useWizardStore`. FIREWALL: dynamic-import the wizard dispatcher (`next/dynamic`) so the entry `input|confirm|manual` path stays firewall-pure and template-adjacent slot code (StyleSlot pickers) stays out of the entry bundle — plan-review nit 3)
- create `src/modules/wizard/rollout.ts` (single shared `WIZARD_ENGINES` migrated-engine set — consumed by BOTH the confirm route and the load-detection; grows in phases 8/9, deleted in 10)
- create `src/components/onboarding/wizard/WizardShell.tsx` (progress, slot chrome, back/next)
- create `src/components/onboarding/wizard/SlotReviewCard.tsx` (confirm-per-slot fast path)
- create `src/components/onboarding/wizard/IdentitySlot.tsx`
- create `src/components/onboarding/wizard/UnderstandingSlot.tsx`
- create `src/components/onboarding/wizard/OfferSlot.tsx`
- create `src/components/onboarding/shared/ChipInput.tsx` (copy of service field cmp; original untouched)

**Steps**
1. Handoff (BLOCKING-1 fix): confirmed THING brief → confirm route redirects to `/onboarding/${tokenId}` → hard navigate → `[token]/page.tsx` load-detection sees the persisted brief → renders wizard. Trust/work briefs keep redirecting to the OLD wizards via the unchanged else-branch (the split lives in ONE place: the confirm route, keyed by `WIZARD_ENGINES`). Reload mid-wizard re-enters via the same load-detection (net-new resume capability).
2. Guard the load-detection with the same `WIZARD_ENGINES` set: a confirmed brief whose engine is NOT yet migrated (trust/work until phases 8–9) landing directly on `/onboarding/[token]` must be forwarded to its old wizard route, never render the unified wizard.
3. Slots render fields from the engine contract; labels/examples from businessType `wizardFields`. Review-mode: prefilled values + one-tap confirm-per-slot; fill-mode: standard inputs. Same components, `mode` from store.
4. UnderstandingSlot covers WHO/WHAT groups; only `ask`-state fields render as questions — `scraped`/`inferred` render as confirmable chips; `drop` fields never render.

**Verification:** `npx tsc --noEmit`; manual dev: thing brief (URL entry) → confirm → LANDS in unified wizard prefilled review-mode; reload mid-wizard resumes; manual-entry thing brief → fill-mode; a trust brief still lands on the old service wizard.

## Phase 4 — goal / proof / style / structure slots + product proof hard rule

**Files touched**
- create `src/components/onboarding/wizard/GoalSlot.tsx` (port scale-05 intent-first GoalStep off old store; reuse `src/components/onboarding/shared/GoalParamFields.tsx` + `src/modules/goals/vocabulary.ts`)
- create `src/components/onboarding/wizard/ProofSlot.tsx` (generalized AssetsStep: per-engine T2 booleans from contract; product gets proof step for the first time)
- create `src/components/onboarding/wizard/StyleSlot.tsx` (thing: wraps existing `HeroVariantPicker`/`ProductStylePicker` via import from old tree for now — re-homed in phase 10)
- create `src/components/onboarding/wizard/StructureSlot.tsx` (port SitemapReviewStep, thing-only; behavior as-is — structure changes are scope 07)
- edit `src/modules/audience/product/strategy/parseStrategyProduct.ts` AND/OR `src/modules/audience/product/sectionSelection.ts` — grep FIRST (see step 3) to find which one actually decides the emitted product section list; filter there
- edit `src/app/api/audience/product/strategy/route.ts` (accept + validate proof booleans in request, pass to the assembler/selector)
- create `src/modules/audience/product/strategy/proofFilter.test.ts`
- edit `src/app/onboarding/[token]/page.tsx` (register slots)

**Steps**
1. GoalSlot writes `goalIntent/goalParam` to `useWizardStore` AND composes `brief.goal` via `intentToBriefGoal`; legacy-enum mirroring only inside the phase-5 adapters (old stores untouched).
2. ProofSlot: 1-tap booleans + testimonial-type sub-choice; unanswered optional proof ⇒ `drop`.
3. Proof hard rule (spec item 7) enforced at section assembly, NOT in `injectRealTestimonials`. Product decision point is AMBIGUOUS: both `parseStrategyProduct.assembleProductStrategy` (route.ts:163, "deterministic per-template sections") and `src/modules/audience/product/sectionSelection.ts` (lists `testimonials` at lines 14/32) exist. Implementer: trace which produces `strategyData.sections`, apply the filter at that single point, leave the other alone. Service already drops via `sectionSelection` asset booleans.
4. Strategy route change is additive/back-compat: proof field optional in schema, default = current behavior (old wizard keeps working).

**Verification:** `npx tsc --noEmit` + `npm run test:run -- src/modules/audience/product`; manual dev: proof booleans off ⇒ testimonial section absent from assembled strategy.

## Phase 5 — shared generation core + GeneratingSlot (thing)

**Files touched**
- create `src/modules/wizard/generation/finalize.ts` (shared tail: buildFinalContent → `seedGoalForm` → `injectGoalSections` → saveDraft — extracted from the near-identical product/service GeneratingStep tails)
- create `src/modules/wizard/generation/thing.ts` (adapter: wizard/brief state → product strategy + generate-copy payloads; ports multi-page fan-out `runFanOut`, manufacturer deterministic path `buildTechPremiumHomeFinalContent`, manufacturer field remap, resume-from-DB from the 930-line product GeneratingStep — port, don't edit the old file)
- create `src/modules/wizard/generation/index.ts` (`runGeneration(engine, ...)` dispatch)
- create `src/modules/wizard/generation/thing.test.ts` (adapter payload-shape tests against product route schemas)
- create `src/components/onboarding/wizard/GeneratingSlot.tsx` (progress UI + error/retry, thin over `runGeneration`)
- edit `src/app/onboarding/[token]/page.tsx`

**Steps**
1. Adapters produce EXACT payloads the audience routes expect today (incl. UnderstandingData shape) — route contracts untouched except phase-4 proof field.
2. `finalize.ts` must be a plain module (published/client boundary: no `'use client'` imports leak toward published rendering).
3. End state: thing brief → unified wizard → generate → redirect `/edit/[token]`.

**Verification:** `npx tsc --noEmit` + `npm run test:run -- src/modules/wizard`; manual dev: full thing run (mock LLM ok) lands in editor; multi-page fan-out + manufacturer path smoke-checked.

## Phase 6 — HUMAN GATE: thing pilot review 🚧

**Files touched**
- edit `docs/task/scale-06-wizard-convergence.plan.md` (record decisions only)

**Steps (founder checklist, dev server, real LLM)**
1. URL entry + rich site ⇒ ≤3 questions asked; bare one-liner ⇒ ≤6. (Executable now: confirm → unified wizard handoff landed in phase 3.) 1. Gave naayom.com.. wizard had 8 questions but mostly pre-filled. 2. Gave 'A growth marketing agency specializing in helping SaaS startups' it went to onboarding/service path so old wizard 3. Gave 'AI - tool to increase sales' 8 wizards.. few things pre-filled.. looks correct
2. Review-mode confirm-per-slot feels fast; fill-mode complete. 1. Scrape - mode good info already there.. One confusing that 2 cuttons looks right and continue.. bad ux 2. manual.. partial pre-fill correct
3. Proof booleans off ⇒ sections absent on generated page (check editor AND publish preview — dual-renderer parity). This shoud be ok. getting too many requests error now. will check later. notblocking
4. Resume mid-wizard works — NET-NEW capability (old entry flow was in-memory; reload = restart). Gets dedicated test coverage in phase 11, not treated as parity. I restarted at 3/8 but then it wnet banck to 1/8 after refresh
5. Resolve spec open questions: differentiator free-text vs chips; numbers-ASK skippable — adjust phase-1 defaults if overruled.
**Do not proceed to phases 7–10 without sign-off.** (Decision gate: pilot proves the slot/waterfall architecture before 3× expansion.)

## Phase 7 — scrape convergence (businessType-keyed extraction)

**Files touched**
- create `src/lib/schemas/extraction/index.ts` (registry keyed by `extractionSchemaKey`)
- create `src/lib/schemas/extraction/thing.ts`, `src/lib/schemas/extraction/trust.ts`, `src/lib/schemas/extraction/work.ts` (+ `manufacturer.ts` if manufacturer needs richer fields than base thing)
- create `src/lib/schemas/extraction/extraction.test.ts`
- edit `src/app/api/v2/understand/route.ts` (kill the audienceType/manufacturer schema switch for wizard path; select schema via businessType `extractionSchemaKey`; entry-mode convergent path stays the base)
- edit `src/app/api/v2/scrape-website/route.ts` (same)
- edit `src/modules/businessTypes/config.ts` (replace `<key>-v0` placeholders with real registry keys)

**Steps**
1. All engines route through the entry-mode convergent path (EntryUnderstand/EntryScrape → neutral prefill + EntrySignals → buildBriefDraft), enriched by the businessType extraction schema for engine-specific fields.
2. Manufacturer keeps extraction richness via its businessType key — the vestria/templateId coupling in scrape dies here. `isManufacturerFlow` itself is NOT touched (melts in scale-08).
3. Preserve legacy schema branch behind the non-wizard callers if any remain (old wizards still live until phase 10) — flag-gate, delete in phase 10.

**Verification:** `npx tsc --noEmit` + `npm run test:run -- src/lib/schemas/extraction`; manual dev: scrape a known SaaS URL + a service URL, confirm brief prefill quality unchanged/better.

## Phase 8 — trust engine through unified wizard

**Files touched**
- edit `src/modules/wizard/rollout.ts` (`WIZARD_ENGINES` += trust)
- edit `src/app/api/brief/confirm/route.ts` (only if the branch isn't purely rollout-const-driven; else no-op)
- create `src/components/onboarding/shared/PaletteSwatch.tsx` (copy of service field cmp)
- edit `src/components/onboarding/wizard/StyleSlot.tsx` (trust: variant/palette picker)
- edit `src/components/onboarding/wizard/ProofSlot.tsx` (trust boolean set + testimonial-type sub-choice writes shape `sectionSelection` expects)
- create `src/modules/wizard/generation/trust.ts` (adapter → service strategy/generate-copy; ported from ~410-line service GeneratingStep incl. ServiceUnderstanding mapping)
- create `src/modules/wizard/generation/trust.test.ts`
- edit `src/modules/wizard/generation/index.ts`
- edit `src/hooks/useWizardStore.ts` (trust state gaps if any)
- edit `src/app/onboarding/[token]/page.tsx` (trust slots registered; load-detection now admits trust via rollout const)

**Steps**
1. Trust asset booleans must reach `src/modules/audience/service/sectionSelection.ts` unchanged in shape (section-drop behavior preserved); `injectRealTestimonials` path untouched.
2. Awareness-driven section ordering preserved via adapter fidelity — assert in adapter test against a frozen service fixture.

**Verification:** `npx tsc --noEmit` + `npm run test:run` (service section-selection + generation-contract + paletteSelection regression); manual dev: trust brief → confirm → unified wizard → editor.

## Phase 9 — work engine / writer self-serve 🚧 HUMAN GATE

**Files touched**
- edit `src/modules/brief/serveGate.ts` — THREE coordinated changes (partial edit = silent MANUAL fallthrough):
  1. widen `BRIDGEABLE_ENGINES` type `Record<'thing'|'trust', AudienceType>` (line 44) → include `work: 'writer'`;
  2. widen the `bridgeable` predicate `engine==='thing'||engine==='trust'` (line 138) to include `'work'` — without this, served work never reaches the serve branch even with the map widened;
  3. delete the `bridge:work` MANUAL clause (lines 124–128, per its own comment at 41–43).
- edit `src/modules/brief/serveGate.test.ts` (work-brief ⇒ serve with `audienceType:'writer'`, `templateId:'granth'`; no more `bridge:work` tag)
- edit `src/modules/templates/templateMeta.ts` IF NEEDED (step 2 hazard: granth `capabilities: []` vs rungC gallery-cap injection)
- edit `src/modules/templates/fit.ts` IF NEEDED (`templateMeta.granth.copyEngines=['work']` already exists at lines 78–79 and `shortlist()` filters by `copyEngines`, so fit.ts likely needs NO change — verify, don't assume)
- edit `src/modules/wizard/rollout.ts` (`WIZARD_ENGINES` += work ⇒ confirm route redirects work briefs to `/onboarding/${tokenId}` — the phase-3 unified wizard; `/onboarding/writer/[token]` does NOT exist and is never created)
- create `src/modules/wizard/generation/work.ts` (thin path: brief facts → `buildGranthHomeFinalContent` (`src/hooks/editStore/granthSeed`) → saveDraft; project `audienceType='writer'`, `templateId='granth'`)
- edit `src/hooks/editStore/granthSeed.ts` ONLY if the builder needs brief-derived params (flag if signature must change)
- edit `src/components/onboarding/wizard/ProofSlot.tsx` (work exception: ask 3–5 work uploads via existing `/api/upload-image`, or accept scraped images)
- edit `src/modules/wizard/generation/index.ts`
- delete `src/app/dev/seed-writer/route.ts`
- edit `src/app/onboarding/[token]/page.tsx`

**Steps**
1. Serve-time template resolution for work (BLOCKING-2 fix): the confirm route PERSISTS `decision.templateId` to the Project (route.ts:61–68), so serveGate MUST resolve granth at serve time — no downstream override. Once the `bridgeable` predicate admits work, `shortlist()` should yield granth via templateMeta.
2. HAZARD — unit-test BEFORE wiring UI: serveGate rungC does source-gated gallery-cap injection (serveGate.ts ~102) while granth declares `capabilities: []` — if a work brief gets a gallery capability requirement injected, `fit()` fails, `shortlist` returns EMPTY, and the brief silently falls to MANUAL/`shortlist-empty` (or worse: a wrong templateId persists, conflicting with granth). Fix per what rungC actually gates: PREFER adding the gallery capability to granth's templateMeta entry (granth HAS gallery blocks) — this covers BOTH failure paths (rungC injection AND a businessType/`goal.mechanism`-required capability that `shortlist()`+`fit()` demand at line 139). Exempting work from rungC alone is INSUFFICIENT — it does not fix a shortlist-empty caused by a required capability granth doesn't declare (plan-review nit 1). Assert `decideServe(workBrief).outcome==='serve'` + `templateId==='granth'` in serveGate.test.ts FIRST.
3. Generation stays thin (bio + work framing) — the PATH is the deliverable, not a new copy engine. `work.ts` asserts persisted `Project.templateId` is already `granth` (defense: throw, don't silently overwrite).
4. Empty-gallery guard: block generate until ≥3 works present (upload or scrape).
5. **Human gate:** serveGate change routes a new audience to self-serve; founder eyeballs one writer run end-to-end (entry → confirm → wizard → generate → editor → publish preview) before sign-off.

**Verification:** `npx tsc --noEmit` + `npm run test:run -- src/modules/brief src/modules/templates` + full `npm run test:run`; manual: writer end-to-end WITHOUT dev seed; confirm persisted `Project.templateId === 'granth'`.

## Phase 10 — kills, redirects, old-store retirement 🚧 HUMAN GATE (before deletions)

**Files touched**
- edit `src/app/api/brief/confirm/route.ts` (delete the migrated-engine branch — all serve outcomes redirect to `/onboarding/${tokenId}`)
- delete `src/modules/wizard/rollout.ts` (rollout complete)
- replace `src/app/onboarding/product/[token]/page.tsx` → server redirect stub to `/onboarding/[token]` (kills `?template=` whitelist, persona→vestria, resume→vestria branches with it)
- replace `src/app/onboarding/service/[token]/page.tsx` → server redirect stub
- delete `src/app/onboarding/product/[token]/components/` (steps, fields, StepContainer) — after re-homing `HeroVariantPicker`/`ProductStylePicker` to `src/components/onboarding/wizard/fields/` (create) and re-pointing StyleSlot
- delete `src/app/onboarding/service/[token]/components/`
- re-point type imports THEN delete stores:
  - edit `src/types/service.ts`, `src/lib/schemas/understandService.schema.ts`, `src/modules/templates/{hearth,lex,surge,lumen}/paletteSelection.ts`, `src/modules/templates/paletteSelection.regression.test.ts` (move `ServiceUnderstanding`/related types into `src/types/service.ts` as canonical home)
  - delete `src/hooks/useProductGenerationStore.ts`, `src/hooks/useServiceGenerationStore.ts`
- delete `src/hooks/useGenerationStore.ts` (CONFIRM zero live consumers first — current grep shows README-only)
- edit `src/hooks/README.md`, `src/app/README.md`
- kill persona-seeded `serviceType`: implementer PINS the exact file first (grep `serviceType` across `src/app/api/start/route.ts`, `src/app/onboarding/persona/`, service store remnants) — Brief carries it now; edit whichever file(s) the grep finds, list them in the phase audit
- remove phase-7 legacy scrape-schema flag-gate in `src/app/api/v2/{understand,scrape-website}/route.ts`
- grep-verify `hardware→techpremium` bridge already gone (no edit expected)

**Steps**
1. **Human gate FIRST:** founder confirms phases 6/8/9 outputs healthy in real use before the fork is deleted (deletion is cheap to defer, expensive to rush).
2. Deletion order: re-point type imports → tsc green → delete components → tsc → delete stores → tsc (blast-radius lesson: fix iteratively via TS errors).
3. Redirect stubs preserve token: `/onboarding/product/abc` → `/onboarding/abc`.

**Verification:** `npx tsc --noEmit` + full `npm run test:run` + `npm run build` (~2 min); manual: old URLs redirect; paletteSelection regression tests green.

## Phase 11 — fixtures, e2e, acceptance QA

**Files touched**
- edit `e2e/generation.spec.ts` (unified route; product + service flows through one wizard; add a mid-wizard reload step — resume coverage for the net-new phase-3 capability)
- edit `e2e/render.spec.ts` (only if route-dependent)
- edit generation-contract frozen-fixture tests (locate under `src/modules/` — product + service fixtures re-run through `runGeneration`; add writer fixture)
- create `src/modules/wizard/acceptance.test.ts` (rich-site brief ⇒ ≤3 asks; bare one-liner ⇒ ≤6; unpromised proof ⇒ section absent from assembled sections — locks acceptance permanently)
- create/extend unit coverage for `[token]` load-detection (persisted brief ⇒ wizard; none ⇒ entry; store rehydration)
- edit `docs/task/scale-06-wizard-convergence.plan.md` (progress log final)

**Steps**
1. All three fixtures (product/service/writer) generate green through the ONE engine.
2. Run `/manual-test` P0 subset for editor↔published parity on one generated page per engine (dual-renderer check).

**Verification:** `npm run test:run` + `npm run test:e2e` (mock mode) + `npm run build` all green.

---

## Scope guards

- OUT (per spec): section/structure changes (07), voice re-key + `manufacturerFlow` melt (08), anonymous entry. StructureSlot ports sitemap behavior verbatim; `isManufacturerFlow` survives except its scrape-schema use.
- No Prisma changes anticipated. If any emerge: `prisma migrate dev`, never `db push`, and it becomes a human gate.

## Unresolved questions

1. Differentiator UX: free text vs chips? (default: free text; decide at phase-6 gate)
2. Numbers ASK: skippable w/ warning ok? (default: require ≥1 of outcomes/credentials, skip allowed)
3. Wizard lives inside `/onboarding/[token]` via confirm-route redirect + load-detection (no new route) — ok?
4. Old stores: hard delete (planned) vs keep as type-only wrappers?
5. `useGenerationStore` retirement in scope? (grep shows README-only refs — planned delete phase 10)
6. Writer work-uploads minimum = 3 blocks generate — too strict?
7. Phase 10 timing: delete fork right after phase 9 gate, or let unified wizard soak on prod first?
8. rungC gallery-cap vs granth `capabilities: []`: add gallery capability to granth or exempt work from rungC? (phase-9 unit test decides; founder confirms at phase-9 gate)
