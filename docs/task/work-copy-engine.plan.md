# work-copy-engine — implementation plan (phase C of the work vertical)

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\work-copy-engine`
- **Branch:** `feature/work-copy-engine` (all commits here; merge to main = human gate)
- **Tier:** **full** — escalated from `standard` by the orchestrator. Reason: full engine footprint is >15 files (new `src/modules/audience/work/` module + 2 API routes + adapter wiring + fixtures/tests), and the story-interview tier adds a billing/credits-adjacent regen route.
- **Spec:** `docs/task/work-copy-engine.spec.md` — NOTE: the spec file is currently untracked and lives only in the MAIN repo checkout (`C:\Users\susha\lessgo-ai\docs\task\work-copy-engine.spec.md`); it does NOT exist in this worktree. Orchestrator: copy it into the worktree (or commit it) before implement phases start, so implementers/reviewers can read it.
- **Scout findings:** provided inline by the orchestrator (2026-07-14); cited throughout — do not re-derive.
- **Plan-review round 1 (2026-07-14):** folded in — B1 (work-local praise injector; service `injectRealTestimonials` is wrong-shaped for work), B2 (story regen on the `work-copy` path, contract-validated; no second weak generator), N1–N5.

## Overview

Build the WORK copy engine: from a work Brief (`brief.facts.work`, phase-A contracts) plus the work library (groups/photos/praise), generate a complete, lean, voice-true multi-page work site. Deterministic CODE decides structure (pages, sections, leads, card counts, story branch); ONE small AI strategy call decides only positioning angle / story angle / voice notes; a facts-bound per-page copy call writes the words. Facts are law (verbatim-or-derived, anti-invention, anti-padding), copy never sees templateId/skeletonId, and output rides the existing newGeneration multi-page fan-out. Pilot-first: Home page only on the Kundius Brief fixture, founder reads it (THE quality gate), then fan-out + story-interview tier + NL pass.

## Progress log

- phase 1 deterministic slim-strategy core: done (commit e7be5151, review loops 1, verdict ship) | tsc+test green, workPages.ts untouched, Kundius→premium asserted
- phase 2 work strategy route (the ONE small AI call): done (commit cc5cc7b1, review loops 1, verdict ship) | AI-only-angle schema + firewall tested; clampSectionList/creditSystem untouched. CARRY→p3: harden firewall substring→word-boundary; confirm copy reads sections/sitemap not uiblocks
- phase 3 work copy prompt + parser + generate-copy route: done (review loops 1, verdict ship) | facts-law core: verbatim praise→proof.quotes + empty-praise fabrication-strip, exact-group binding, no padding, story facts-only, firewall word-boundary. KNOWN-RISK→p4 gate: parser doesn't hard-clamp rogue group over-emission vs facts.groups (prompt-enforced only; validate at real-LLM gate)
- phase 4 PILOT — Kundius golden, Home page only [HUMAN GATE]: scaffold done (harness + placeholder fixture, suite green, capture SKIPPED) | AWAITING FOUNDER: real Kundius facts + CAPTURE=1 authorization + golden read. BLOCKS phase 5+ and merge.
- phase 5 adapter fan-out — full multi-page generation: pending
- phase 6 story interview tier (Sugarman regen) [HUMAN GATE — orchestrator escalation re-check]: pending
- phase 7 NL language pass [HUMAN GATE]: pending
- phase 8 close-out — full suite green, README, track doc: pending

## Design decisions (locked for this plan)

1. **Work-LOCAL module, mirror of product.** All engine code lives in NEW `src/modules/audience/work/` + `src/app/api/audience/work/{strategy,generate-copy,regenerate-story}/`. Modeled on the PRODUCT pipeline (`src/modules/audience/product/strategy/parseStrategyProduct.ts`, `src/app/api/audience/product/strategy/route.ts`, `src/modules/audience/product/copyPrompt.ts`), NOT the legacy `parseStrategyResponse()`/`parseAiResponse()` shapes in `src/modules/prompt/`. The work assembler CALLS shared helpers (`clampSectionList`, multiPageAssembly) — it NEVER edits them (`assembleProductStrategy`/`clampSectionList` are shared by service+product; cross-audience blast radius). Praise injection is work-LOCAL (see #9) — the service `injectRealTestimonials` is neither reused nor edited.
2. **Slim strategy = code.** `sections`/`pages`/`cardCounts`/`leads`/`storyBranch` computed deterministically from `WorkFacts` + phase-A contracts (`workSections.ts`, `workPages.ts`, `workSlots.ts`, `workVocabulary.ts`). The single AI strategy call returns ONLY `{positioningAngle, storyAngle, voiceNotes}` (zod-schema'd). Anti-invention philosophy in code.
3. **Price position is DERIVED, not a new slot.** Phase-A ships price *mode/amount* but not the premium/middle/friendly *position* the voice key needs. Decision: derive a `PricePosition` band in pure code (`pricePosition.ts`) from group price amounts/modes + dreamClient text signals + praise signals, with `'middle'` as the safe default. The rubric MUST provably classify the Kundius/Atelier fixture as `'premium'` (premium studio; a `'middle'` fallback at the founder gate = wrong voice) — phase-1 test asserts it. No contract/schema change, no new wizard question. (If the founder later wants it explicit, that's a contract amendment — flagged in Unresolved questions.)
4. **Brief travels in the POST body** (mirrors product: `ProductStrategyRequestSchema.brief = BriefSchema.optional()` in `src/app/api/audience/product/strategy/route.ts`). Work routes read `getWorkFacts(brief.facts)` (`src/lib/schemas/workFacts.schema.ts` L158). No new server-side Brief loader.
5. **Voice pattern = service/voice.ts clone, work-keyed.** `selectWorkVoice(professionRow × pricePosition × establishment)` → `WorkVoiceSpec` (identity + forbidden lexicon), rendered by `formatWorkVoiceForPrompt`. NEVER keyed to templateId (firewall).
6. **Story-interview = a dedicated WORK route on the `work-copy` path — no second, weaker generator.** The legacy `/api/regenerate-section` runs hard-coded `gpt-3.5-turbo`/Mixtral via `callAIProvider` (route.ts L113-114, L152) and returns UNVALIDATED loosely-coerced content (L181-241). Letting it write the work story section would create a dual-generator parity trap: two paths filling the SAME element schema — phase-3 `generate-copy` (contract-validated, `work-copy` model) vs an unvalidated 3.5-turbo path. Decision: story-interview regen gets its OWN handler `POST /api/audience/work/regenerate-story` that reuses the work storyInterview prompt + work parser + `generateWithSchema` on endpoint `'work-copy'` (the SAME strong path phase-3 uses), and VALIDATES output against the work story-section contract (`workElementContract.about`) before returning. `/api/regenerate-section` stays byte-identical (cleaner than branching a legacy billing-adjacent shared route). Billing semantics preserved: `assertProjectOwner` + `requireAICredits(SECTION_REGEN, 2)` — **NO new credit event**; route returns `content` for the CLIENT to apply (does not persist), exactly like regenerate-section today.
7. **Model selection:** add two new `Endpoint` values `'work-strategy'` and `'work-copy'` with their own MODELS rows in `src/lib/modelConfig.ts` (scoped; NOT the global `AI_MODEL_OVERRIDE`). Start both on the default tier (gpt-4o-mini cheap / sonnet production); the `work-copy` row is the ONE knob to turn if NL quality fails (phase 7 empirical check).
8. **Guarded LLM branch; existing paths byte-identical.** New `runWorkLLMGeneration` in `src/modules/wizard/generation/work.ts`; `runWorkGeneration` (granth) and `runWorkSkeleton` (atelier empty skeleton) are NOT edited. Dispatch in `GeneratingSlot.tsx` (the existing `engine === 'work' && isWorkMultipage()` fork at L127) gains a flag check: env kill-switch `NEXT_PUBLIC_WORK_COPY_ENGINE` — LLM path only when enabled; disabled ⇒ today's skeleton path, byte-identical. Default OFF until the phase-4 human gate passes (flip decision recorded at the gate). **Deploy reality:** `NEXT_PUBLIC_*` env vars are build-time INLINED — toggling the flag requires a REDEPLOY, not a runtime flip; the "kill-switch" is redeploy-speed, not instant. **Scope reality:** flag ON fires the LLM path for ALL `isWorkMultipage()` templates (capability check via `isMultipage(templateId)`), not just atelier — phase 5 confirms no other work-multipage template must stay manual-fill skeleton, and narrows the guard if one must.
9. **Praise (verbatim proof) — work-LOCAL injector; the service seam is wrong-shaped and NOT reused.** Contract facts (verified in `src/modules/engines/workSections.ts`): the work proof/praise section key is **`proof`** (a `workMustSections` member), default proof shape `testimonials` (`workProofShapeContracts.testimonials` === `workElementContract.proof`, donor GranthCriticsGrid), and praise lives as a **multi-item collection `quotes`** — items `{id, text, source}`, constraints **min 0 / max 3**. It is a collection, NOT one flat `quote/author_name/author_role` element. The service `injectRealTestimonials` (`src/modules/audience/service/parseCopy.ts` L133-157) hard-codes target `sections['testimonials']` (work's key is `proof` → silent no-op), picks a SINGLE best quote (`pickBestTestimonial` L126-131 → drops all-but-one), and expects `ScrapedTestimonial` objects (work praise is `string[]`) — three shape mismatches; do NOT reuse or edit it. Instead: NEW `src/modules/audience/work/injectPraise.ts` maps EVERY stated praise string verbatim into `proof.quotes[].text` (in facts order; `source` empty/omitted-tolerant), never invents, never pads beyond the stated list; if praise count exceeds the contract max (3), clamp deterministically to the first max-N (contract law: amend the contract, never bypass — flagged in Unresolved questions). The work story section is `about` (donor GranthParichay) — a type name DISTINCT from `testimonials`/`proof`, so `isTestimonialsSection` (`service/parseCopy.ts` L17) can never touch it even if service code is nearby.
10. **Multipage invariants:** plain sitemap pages NEVER set `collectionKey`/`kind:'collectionItem'` or call `materializeIntoPages` (`src/modules/generation/multiPageAssembly.ts` L8-20 hard invariant); `finalizeMultiPageGeneration` MUST be called (goal-CTA stamping); retry×2 stays SERVER-side in the copy route; resume via `isResumableGeneration` + completedPageKeys skip (thing.ts L638-649 pattern).
11. **No touches** to renderers/registries, editStore core, prisma schema, publish path, or `/api/regenerate-section`. Phase 6 touches `aiActions.ts` (editStore action file) and phase 5 touches `GeneratingSlot.tsx` — both flagged below for orchestrator re-check.

---

## Phase 1 — deterministic slim-strategy core (pure code, zero AI)

The engine's spine: everything decidable from facts is decided here, unit-tested, no LLM.

**Steps**
1. `pricePosition.ts`: `derivePricePosition(facts: WorkFacts): 'premium' | 'middle' | 'friendly'` — pure heuristic over group price amounts/modes (`WorkPrice`, workFacts.schema.ts L59-68), dreamClient keywords, praise signals; default `'middle'`; document the rubric in the file header. The rubric must classify a Kundius-shaped premium-studio fixture as `'premium'` (N1 — see tests).
2. `slimStrategy.ts`: `assembleWorkStructure(facts, professionRow, signals)` returning the deterministic half: pages (via `proposeWorkSiteStructure` in `src/modules/engines/workPages.ts` L265 — the function is FULLY IMPLEMENTED with a documented rubric; before assuming anything needs amending, verify whether only some constant VALUES are placeholder; amend `workPages.ts` ONLY if a verified-unusable value blocks correct archetypes — never bypass, never amend preemptively), sections per page (from `workMustSections`/`workOptionalSections`/`workProofShapes` + `workElementContract`, `src/modules/engines/workSections.ts`), which work groups lead (curation signals: cover photos, group size, kind), gallery sizes/card counts clamped to `workElementContract` min/max from actual group sizes, story branch from `establishment` slot (new/established), primary language from `languages[0]` (slot 8), profession wording from `professionWording` (`src/modules/engines/workVocabulary.ts` L168-193).
3. `voice.ts`: `WorkVoiceSpec` + `selectWorkVoice({professionRow, pricePosition, establishment})` + `formatWorkVoiceForPrompt` — clone the `src/modules/audience/service/voice.ts` pattern (interface + specs + selector + formatter). No templateId anywhere in inputs.
4. Unit tests: determinism (same facts ⇒ same structure, twice), archetype selection (one-pager/compact/standard), card counts track group sizes and never exceed contract max / pad below actual, story branch fork, price-position rubric edge cases (on-request, missing amounts), **Kundius-fixture test: a Kundius-shaped premium-studio `WorkFacts` fixture (minimal inline; phase 4's full fixture must keep satisfying it) → `'premium'`, provably not the `'middle'` default**, voice keying matrix.

**Files touched**
- ADD `src/modules/audience/work/pricePosition.ts`
- ADD `src/modules/audience/work/pricePosition.test.ts`
- ADD `src/modules/audience/work/slimStrategy.ts`
- ADD `src/modules/audience/work/slimStrategy.test.ts`
- ADD `src/modules/audience/work/voice.ts`
- ADD `src/modules/audience/work/voice.test.ts`
- MODIFY (only if a VERIFIED-unusable constant blocks correct archetypes — contract amendment, not preemptive) `src/modules/engines/workPages.ts`

**Verification:** `npx tsc --noEmit` + `npm run test:run` green; new tests prove AC-3 first half ("assembly decisions provably deterministic, unit-tested, no AI") + Kundius→premium. No file outside the list.

---

## Phase 2 — work strategy route: the ONE small AI call

**Steps**
1. `workStrategy.schema.ts`: zod response schema with ONLY `positioningAngle`, `storyAngle`, `voiceNotes` (strings/small shapes). Nothing structural — the schema itself enforces AC-3's second half.
2. `strategy/promptsWork.ts`: lean prompt from praise + dreamClient + price position + profession wording + establishment branch. Written in/for the site's primary language context (full language handling in phase 3/7).
3. `promptFirewall.ts`: work `assertNoTemplateLeak` (clone `src/modules/audience/product/promptFirewall.ts` pattern) applied to every prompt string + engine input object (no `templateId`/`skeletonId`/template names).
4. `strategy/parseStrategyWork.ts`: work-LOCAL assembler — merges phase-1 deterministic structure + the AI angle fields into a `WorkStrategyOutput` (shape parallel to `ProductStrategyOutput`, `src/types/product.ts` L134-140: deterministic `sections`/`uiblocks`/`sitemap` + narrative fields). CALLS the shared clamp (`clampSectionList` from `parseStrategyProduct.ts`) — does NOT edit shared code.
5. Route `api/audience/work/strategy/route.ts`: mirror product strategy route — request zod schema (`brief: BriefSchema` carrying `facts.work`, read via `getWorkFacts`), `requireAuth`, credits (same `STRATEGY_GENERATION` cost/event as product — no new events), `generateWithSchema` on endpoint `'work-strategy'`, mock path for DEMO_TOKEN via a work mock generator, assemble, consume credits, return.
6. `modelConfig.ts`: add `'work-strategy'` + `'work-copy'` to the `Endpoint` union with MODELS rows (default tiers).
7. Mock: `mockResponseGeneratorWork.ts` — canned strategy (+ copy stub for phase 3) so mock/degraded runs carry `meta.mock`.
8. Firewall test: feed inputs salted with template ids; assert prompts clean (AC-7 first half).

**Files touched**
- ADD `src/lib/schemas/workStrategy.schema.ts`
- ADD `src/modules/audience/work/strategy/promptsWork.ts`
- ADD `src/modules/audience/work/strategy/parseStrategyWork.ts`
- ADD `src/modules/audience/work/strategy/parseStrategyWork.test.ts`
- ADD `src/modules/audience/work/promptFirewall.ts`
- ADD `src/modules/audience/work/promptFirewall.test.ts`
- ADD `src/modules/prompt/mockResponseGeneratorWork.ts`
- MODIFY `src/lib/modelConfig.ts`
- ADD `src/app/api/audience/work/strategy/route.ts`

**Verification:** tsc + test:run green; firewall test green (AC-7); parse test proves AI output can ONLY contribute angle/story/voice fields (AC-3). `npm run lint` on touched files.

---

## Phase 3 — work copy prompt + parser + generate-copy route

**Steps**
1. `workLibrary.ts`: `buildWorkLibraryPromptBlock(facts)` — renders groups (name/kind/price verbatim), sub-items, photo counts, praise, dream client into a bounded prompt block (mirror `buildSiteContextPromptBlock` in `src/lib/siteContext.ts` L144-180). There is no typed work-library object today — this file introduces it (nearest prior art: `CollectionsFacts`).
2. `copyPrompt.ts`: per-page copy prompt. Inherit the `src/modules/audience/service/copyPrompt.ts` binding-rules pattern (5b4da96f): static numbered RULES (anti-invention rule-4, no-placeholder rule-3, voice-forbidden rule-9 analogues), dynamically-appended binding lines (one-card-per-stated-group, no padding beyond user's list, prices verbatim-or-mode-phrased: exact/from/on-request), conditional bracketed-placeholder rule ONLY for agency case-study metrics (the ONE placeholder zone, rule-10 pattern L246), FINAL SELF-CHECK echo. Plus: LEAN length caps per section (promise line, gallery intros/captions, story, prices framing, proof framing, contact nudge, per-page one-liners), voice block via `formatWorkVoiceForPrompt`, PRIMARY-LANGUAGE directive ("write every string in <language>"), story ship-grade rules (facts-only, graceful omission, no fabricated biography — AC-4).
3. `injectPraise.ts` (work-LOCAL — design decision #9): `injectPraise(pageContent, praise: string[])` maps EVERY stated praise string verbatim into the `proof` section's `quotes` collection items (`text` = verbatim string, `source` empty/omitted-tolerated), in facts order; zero invention, zero padding, deterministic clamp to the contract max (3) if over. Dedicated unit test: praise `string[]` in → all present verbatim, no extras, no drops (≤ max), no-op when the page has no `proof` section, over-max clamp case.
4. `parseCopy.ts`: parse/validate per-page copy against `workElementContract`; call the work-local `injectPraise` (NOT the service `injectRealTestimonials` — wrong-shaped, see decision #9); story section is `about`, DISTINCT from `testimonials`/`proof`.
5. Route `api/audience/work/generate-copy/route.ts`: mirror product copy route — consumes `{strategy, page, uiblocks, brief, sourceUrl, ...}`, server-side `MAX_RETRIES=2`, SiteContext fed server-side via `getFreshSiteContext` + prompt block (adapter only passes `sourceUrl`), endpoint `'work-copy'`, mock path, `meta.mock`/`meta.complete`/`missingSections` degraded signals (spec constraint), same credit events as the existing copy routes (no new events).
6. **Facts-law test** (AC-2, deterministic — no LLM): fixture Brief with distinctive fake groups/prices ("Umbrella-Drone Weddings — €7,777") AND **≥2 DISTINCT praise strings**; assert prompt contains groups/prices verbatim, binding lines enumerate exactly them (no extras), **ALL praise strings appear word-for-word in the parsed `proof.quotes` output — zero extras, zero drops**, parser output card counts never exceed stated groups.

**Files touched**
- ADD `src/modules/audience/work/workLibrary.ts`
- ADD `src/modules/audience/work/copyPrompt.ts`
- ADD `src/modules/audience/work/copyPrompt.factsLaw.test.ts`
- ADD `src/modules/audience/work/injectPraise.ts`
- ADD `src/modules/audience/work/injectPraise.test.ts`
- ADD `src/modules/audience/work/parseCopy.ts`
- ADD `src/modules/audience/work/parseCopy.test.ts`
- MODIFY `src/modules/prompt/mockResponseGeneratorWork.ts` (copy mock)
- ADD `src/app/api/audience/work/generate-copy/route.ts`

**Verification:** tsc + test:run green; facts-law test green (AC-2 code half, incl. multi-praise verbatim no-drop/no-extra); injectPraise unit test green; lean length caps unit-asserted; degraded-signal path unit-tested (AC-7 second half).

> Spec-constraint note: the spec says "reuse injectRealTestimonials seam" — scout+review found that seam wrong-shaped for work (keying, arity, input type; decision #9). We keep the seam's LAW (verbatim injection at parse time, code not LLM) but implement it work-locally. Recorded here so implementers don't "fix" this back.

---

## Phase 4 — PILOT: Kundius golden, Home page only  ⛔ **HUMAN GATE**

The spec's smallest slice. Deliberately single-page — sidesteps the multi-page fan-out and the newGeneration Gate-0-QA prerequisite.

**Steps**
1. Build the Kundius Brief fixture: her real facts (identity, groups+prices, established branch, dream client, verbatim praise incl. old-site about text harvest, contactMethod, languages) as a `WorkFacts`/Brief fixture. Source from the founder / existing Kundius materials — implementer asks via mailbox if facts are missing. Fixture must satisfy the phase-1 pricePosition test (→ `'premium'`).
2. `captureGoldenWork.test.ts` following the `src/modules/audience/__tests__/captureGolden.test.ts` pattern: opt-in `CAPTURE=1` real-LLM run — slim strategy (code) → strategy call → generate-copy for HOME only → write golden artifact (strategy JSON + home copy JSON + rendered-strings dump for founder reading).
3. Run with `CAPTURE=1`; commit the golden artifact.

**Files touched**
- ADD `src/modules/audience/work/__tests__/fixtures/kundiusBrief.ts`
- ADD `src/modules/audience/work/__tests__/captureGoldenWork.test.ts`
- ADD `src/modules/audience/work/__tests__/goldens/kundius.home.json` (captured artifact)

**Verification:** capture run completes on real LLM; tsc/test:run still green (golden test skips without CAPTURE=1).

**⛔ HUMAN GATE (THE quality gate):** founder reads the Kundius Home output — promise line, gallery framing, ship-grade story, prices framing, proof, contact nudge. **No phase 5+, and no merge to main, until the founder approves.** Founder also rules here: flip `NEXT_PUBLIC_WORK_COPY_ENGINE` default ON at merge, or keep OFF? **Note for the ruling: the flag is build-time inlined (`NEXT_PUBLIC_*`) — any later flip requires a redeploy, not a runtime toggle; there is no instant kill-switch.** (AC-8 partially — full AC-8 after fan-out.)

---

## Phase 5 — adapter fan-out: full multi-page generation

**Steps**
1. `work.llm.ts` (new file, keeps `work.ts` diff minimal) exporting `runWorkLLMGeneration(input, cb)`: mirror `runThingGeneration`/`runFanOut` (`src/modules/wizard/generation/thing.ts` L410/L456-635) — strategy fetch (or reuse pre-gate strategy if the wizard already ran it), `buildMultiPageSkeleton`, iterate sitemap pages, skip `completedPageKeys` (resume check, thing.ts L638-649 / `isResumableGeneration`), POST each page to work generate-copy, `mergePageIntoFinalContent` + `saveDraft` per page, `onPageProgress`, thread `meta.mock`/`complete` up, and `finalizeMultiPageGeneration` at the end (MANDATORY — goal-CTA stamping). HARD INVARIANT: plain pages never touch collections (no `materializeIntoPages`, no `collectionKey`). *Divergence-risk note:* this clones ~180 lines of thing.ts fan-out; extracting ONE audience-agnostic fan-out driver was considered and DEFERRED (don't do it in this track) — record the duplication in the phase audit so a future refactor can find both copies.
2. `work.ts`: re-export `runWorkLLMGeneration`; ZERO edits to `runWorkGeneration`/`runWorkSkeleton` bodies.
3. `GeneratingSlot.tsx`: at the existing L127 fork — `engine === 'work' && isWorkMultipage() && workCopyEngineEnabled()` → LLM path; else existing skeleton path unchanged. Extend `buildWorkInput` to project the resolved Brief + `sourceUrl` + goal (mirror `buildThingInput`'s Brief projection; if that projection helper lives in `useWizardStore.ts`, that file joins the diff — listed below).
4. **Flag-scope check (N4):** flag ON routes ALL `isWorkMultipage()` templates (capability = `isMultipage(templateId)`) to the LLM path — atelier today, but enumerate every current/near-term work-multipage template (check `pageArchetypes`/template registry + track docs, e.g. lumen's work-vertical bench status) and confirm none must remain manual-fill skeleton. If one must, narrow the guard (template allow-list or per-template capability flag) INSIDE `workCopyEngineEnabled()`/the fork — decide with the orchestrator before implementing this step.
5. Flag helper `workCopyEngineEnabled()` reading `NEXT_PUBLIC_WORK_COPY_ENGINE` (kill-switch; default per phase-4 gate ruling; build-time inlined — see decision #8).
6. Adapter tests: fan-out order, resume-skip, finalize called, degraded meta threading; regression assertions that granth input still routes to `runWorkGeneration` and flag-OFF multipage still routes to `runWorkSkeleton` (byte-identical guard, extend `src/hooks/useWizardStore.test.ts` cases L1310/L1333 pattern if needed).
7. Full-site golden: extend `captureGoldenWork.test.ts` to capture ALL pages of the standard archetype (AC-1 + completes AC-8 evidence).

**Files touched**
- ADD `src/modules/wizard/generation/work.llm.ts`
- ADD `src/modules/wizard/generation/work.llm.test.ts`
- MODIFY `src/modules/wizard/generation/work.ts` (re-export only)
- MODIFY `src/modules/wizard/generation/index.ts` (export new adapter type if needed)
- MODIFY `src/components/onboarding/wizard/GeneratingSlot.tsx`
- MODIFY `src/hooks/useWizardStore.ts` (only if the Brief projection for `buildWorkInput` lives there, mirroring buildThingInput)
- MODIFY `src/modules/audience/work/__tests__/captureGoldenWork.test.ts`
- ADD `src/modules/audience/work/__tests__/goldens/kundius.full.json` (captured artifact)

**Verification:** tsc + test:run green; AC-1 (full standard-archetype site, lean lengths); flag-OFF path proven unchanged; flag-scope check (step 4) recorded in the audit. **Risk flag for orchestrator:** touches `GeneratingSlot.tsx` (live wizard UI) + possibly `useWizardStore.ts` — re-check escalation; prerequisite check: phase B (newGeneration Gate-0 QA) status before enabling the flag anywhere real.

---

## Phase 6 — story interview tier (Sugarman regen)  ⛔ **orchestrator escalation re-check**

Runs on the `work-copy` path (design decision #6) — NOT the legacy `/api/regenerate-section` (hard-coded gpt-3.5-turbo/Mixtral, unvalidated coercion; that route is untouched).

**Steps**
1. `storyInterview.ts`: single-section prompt builder for the work `about`/story section — inputs: 3 answers (origin one-liner · unforgettable client moment · craft belief) + WorkFacts + voice spec. Copy technique baked into rules: hook on the specific moment, belief as spine, praise as landing; same anti-invention binding; primary-language directive.
2. NEW route `api/audience/work/regenerate-story/route.ts`: body zod `{tokenId, sectionId, interviewAnswers: {origin, moment, belief}, brief}`; `assertProjectOwner` + `requireAICredits(SECTION_REGEN, 2)` — same guards/cost as regenerate-section, **no new credit event**; `generateWithSchema` on endpoint `'work-copy'` (same model row as phase-3 copy, server-side retry consistent with the copy route); **validate the returned story content against `workElementContract.about` via the phase-3 work parser (same element keys phase-3 enforces) — reject/repair on shape mismatch before returning**; response returns `content` for the CLIENT to apply (route does not persist), mirroring regenerate-section's contract.
3. **Generator-parity test:** assert BOTH story generators — phase-3 generate-copy and this regen route — validate against IDENTICAL `about`-section element keys (single source of truth = `workElementContract.about`; the test fails if either path drifts to its own key set).
4. `aiActions.ts`: thin store action calling the new route and applying the returned content exactly the way the regenerate-section action does today (no changes to existing actions).
5. Minimal entry point (spec: "a working entry point", polish is scope-OUT): `StoryInterviewPanel.tsx` — 3 freeform inputs + submit; surfaced from the About/story section in the editor via ONE wiring point in `MainContent.tsx` (the existing regenerate-section host). Post-reveal only; never in the main wizard flow (≤5-question ceiling sacred). Weekly-email entry = scope-OUT (email-sequences track).
6. Tests: route unit test (owner/credits guards enforced, contract validation rejects malformed shapes, happy path returns validated `about` content; `/api/regenerate-section` untouched — no diff), prompt shape test (hook/belief/landing rules present), parity test (step 3).

**Files touched**
- ADD `src/modules/audience/work/storyInterview.ts`
- ADD `src/modules/audience/work/storyInterview.test.ts`
- ADD `src/app/api/audience/work/regenerate-story/route.ts`
- ADD `src/app/api/audience/work/regenerate-story/route.test.ts`
- MODIFY `src/hooks/editStore/aiActions.ts`
- ADD `src/app/edit/[token]/components/StoryInterviewPanel.tsx`
- MODIFY `src/app/edit/[token]/components/layout/MainContent.tsx` (single wiring point; if the real host is a different toolbar file, implementer amends the plan line via audit note BEFORE editing anything else)

**Verification:** tsc + test:run green; AC-5 (3 answers in → ONLY the story section regenerates, Sugarman-shaped, contract-validated on the `work-copy` model). Manual dev check: run interview on the Kundius draft, story updates in editor, other sections untouched. **Risk flags for orchestrator:** billing-adjacent NEW route (mitigated: SECTION_REGEN reuse, no new event, assertProjectOwner) + editStore action file + editor UI — re-check escalation before implement.

---

## Phase 7 — NL language pass  ⛔ **HUMAN GATE**

**Steps**
1. NL fixture: NL-primary Brief (Kundius-shaped, `languages: ['nl']`).
2. Golden capture in NL (CAPTURE=1): full pipeline; every generated string must be Dutch (automated assert: no-English heuristic on headline/CTA strings + founder read).
3. If gpt-4o-mini drops voice/grammar in NL (empirical): bump ONLY the `'work-copy'` (and if needed `'work-strategy'`) MODELS row in `modelConfig.ts` — scoped knob, no global override — and re-capture. Founder rules on quality-vs-cost.
4. Harden the language directive in `copyPrompt.ts` if the capture shows leakage (English fragments, mixed-language cards).

**Files touched**
- ADD `src/modules/audience/work/__tests__/fixtures/nlBrief.ts`
- MODIFY `src/modules/audience/work/__tests__/captureGoldenWork.test.ts`
- ADD `src/modules/audience/work/__tests__/goldens/nl.home.json` (captured artifact)
- MODIFY `src/modules/audience/work/copyPrompt.ts` (directive hardening, if needed)
- MODIFY `src/lib/modelConfig.ts` (model bump, only if NL fails on default)

**Verification:** AC-6 (NL-primary Brief → NL copy throughout). **⛔ HUMAN GATE:** founder reads the NL golden and rules the model-strength question (cost implication).

---

## Phase 8 — close-out: full green + docs

**Steps**
1. Full sweep: `npx tsc --noEmit`, `npm run test:run`, `npm run lint`, `npm run build` (build ≠ next build — runs published-CSS + assets scripts first) — all green.
2. `src/modules/audience/work/README.md`: agent-oriented — module purpose, slim-strategy split (code vs the one AI call), facts-law rules, firewall invariants, price-position rubric, story two-tier + the two-generator parity rule (`workElementContract.about` is the single source), pitfalls (work-local `injectPraise` — service `injectRealTestimonials` is wrong-shaped for work, do not "reuse" it back; story section = `about`, distinct from `testimonials`/`proof`; flag is build-time inlined).
3. Acceptance-criteria sweep: check every AC box in the spec against its phase evidence; record in the plan's progress log.
4. Track doc note: mark phase C status in `docs/tracks/workEndtoEnd.md`.

**Files touched**
- ADD `src/modules/audience/work/README.md`
- MODIFY `docs/tracks/workEndtoEnd.md`
- MODIFY `docs/task/work-copy-engine.plan.md` (progress log finalization)

**Verification:** all four commands green locally (no-PR workflow: green BEFORE the merge gate). Merge to main = standard human gate.

---

## Acceptance-criteria map

| AC | Phase(s) |
|---|---|
| Full site, standard archetype, lean lengths | 5 |
| Facts law (fake-services fixture, zero invention/padding; ≥2 praise strings verbatim, no drops/extras) | 3 (+4/5 golden) |
| Slim strategy deterministic; AI returns only angle/story/voice | 1 + 2 |
| Story ship-grade (facts-only, graceful omission) | 3 (+4 golden) |
| Story interview → only About regenerates, Sugarman-shaped (contract-validated, `work-copy` model, generator-parity test) | 6 |
| NL-primary → NL throughout | 7 |
| Copy firewall green; degraded flagged | 2 + 3 (+5 threading) |
| Kundius golden founder-approved | 4 (home) + 5 (full) |

## Risky-surface flags (orchestrator re-check)

- Phase 5: `GeneratingSlot.tsx` + possibly `useWizardStore.ts` (live wizard); phase-B Gate-0 QA prerequisite before flag-on; flag-scope check for non-atelier work-multipage templates.
- Phase 6: NEW billing-adjacent route `/api/audience/work/regenerate-story` (mitigated: SECTION_REGEN reuse, no new event, assertProjectOwner) + `editStore/aiActions.ts` + editor UI wiring. `/api/regenerate-section` itself is now UNTOUCHED by this plan.
- Nowhere: renderers/registries, prisma schema, publish path, new credit events, `/api/regenerate-section`, `service/parseCopy.ts` — if any phase's implementation drifts onto these, STOP and re-plan.

## Unresolved questions

1. NL model: ok to pay sonnet-tier per work-copy call if 4o-mini flops Dutch? Ceiling?
2. Price position: derived heuristic ok, or want explicit wizard ask later (contract amendment, track E)?
3. `NEXT_PUBLIC_WORK_COPY_ENGINE` default after phase-4 gate: ON at merge or OFF till beta? (Reminder: build-time inlined — any flip = redeploy.)
4. Kundius Brief fixture facts: who supplies verbatim praise + old-site about text — founder hands over, or scrape her old site?
5. Story-interview entry: About-section panel enough for v1, or also dashboard nudge? (weekly-email entry stays out — email-sequences held.)
6. Phase B (newGeneration Gate-0 QA) still pending — run it before phase 5 flag-on, or accept risk on work vertical only?
7. Spec file untracked in main repo only — commit it into the feature branch?
8. Proof `quotes` contract max = 3: if user states >3 praise quotes, clamp to first 3 ok, or amend contract max?
9. Flag scope: any near-term work-multipage template (lumen bench?) that must STAY manual-fill skeleton when flag is ON?
