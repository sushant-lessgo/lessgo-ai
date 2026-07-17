# regen-modernization — implementation plan

Spec: `docs/task/regen-modernization.spec.md` · Scout brief: `docs/task/regen-modernization.scout.md` (§-refs below). **Plan-review corrections override the scout brief where they conflict** — notably: `contentActions.ts`'s legacy imports are dead code (never used; the fns are `logger.warn` stubs), `featuresFromAI` IS persisted (`saveDraft/route.ts:169` / `loadDraft/route.ts:146`), and `regenerate-content`'s body schema confirmed lacks `tokenId` (`route.ts:11`).

## Overview

Rebuild the three regeneration endpoints (`regenerate-element`, `regenerate-section`, `regenerate-content`) on the modern generation stack: current models via `modelConfig`, server-side prompt construction, Zod-validated output with a route-owned validate→retry loop, and full gating (auth + `assertProjectOwner` + pre-spend credit check + charge-on-success). First harden the shared `aiClient.ts` (H5 parse, M14 infra-matcher) with real unit tests + a founder-run real-LLM gate, then build the scoped-generation primitive that doesn't exist yet (scout §3), pilot it on `regenerate-element` behind a founder QA gate, extend to section and content, re-point `regenerationActions.ts` (the one LIVE client-side prompt builder) to call the routes, and finally delete the legacy `buildPrompt.ts`/`parseAiResponse.ts` sweep (~4,200+ lines) — which includes stripping `contentActions.ts`'s dead legacy imports.

## Progress log

- phase 1 aiClient hardening + unit tests: **done** (commit `d0ba8849`, impl-review loops 1 → `ship` + a follow-up test-integrity fix). 24 tests in new `src/lib/aiClient.test.ts` (first ever on that file), verified discriminating by simulating the pre-hardening extraction. Suite 3570 passed | 18 skipped. `tsc` clean except the known pre-existing `src/app/page.tsx(6,26)` `founder.jpg` error (this worktree was never built → no `next-env.d.ts`; unrelated to the diff). **Plan-invariant correction logged as audit Deviation #4**: the impl added `ECONNRESET`/`ENOTFOUND`/`EAI_AGAIN`/`'timed out'` beyond the authorized `{ECONNREFUSED, ETIMEDOUT}` — old code returned `false` for all four (notably OpenAI's `APIConnectionTimeoutError` message `"Request timed out."`), so the plan's "never a NEW backup call" wording is what's wrong, not the code (the plan already authorized `ETIMEDOUT` + truncation→backup). Real intent — content failures never buy a backup — is honored by the fast-exit. Code kept per orchestrator ruling.
  - ⏸️ **NEXT: human gate — founder `CAPTURE=1` golden run** (see gate table). Phase 2 must not start until it passes.
- phase 2 scoped-generation primitive: pending
- phase 3 regenerate-element rebuild (pilot): pending
- phase 4 regenerate-section rebuild: pending
- phase 5 regenerate-content rebuild + store re-point: pending
- phase 6 legacy deletion sweep + docs: pending

## Settled rulings (do not re-litigate; logged per orchestrator)

- **R1 — the live client-side prompt builder calls the route.** The spec's "only 3 regen routes import the legacy files" premise is FALSE (scout §0 P1), but narrower than the scout recorded: plan-review verified that in `src/hooks/editStore/contentActions.ts` the `buildFullPrompt`/`buildSectionPrompt`/`buildElementPrompt` (:3), `parseAiResponse` (:4) and `useOnboardingStore` (:2) imports are **never used** — `regenerateSection` (:612), `regenerateElement` (:616), `updateFromAIResponse` (:667) are `logger.warn` stubs delegating to `aiActions`/`generationActions`. So the ONLY genuine client-side prompt construction is `src/hooks/editStore/regenerationActions.ts` (`buildFullPrompt` at :69/:259). Ruling stands, narrowed: re-point `regenerationActions.ts` to CALL the rebuilt `regenerate-content` route (H3 constraint: prompt construction moves server-side); `contentActions.ts`'s work is deleting 3 dead import lines, done in the phase-6 sweep (it's what unblocks the deletion).
- **R2 — tier stays full.** No downgrade.
- **R3 — no inherited fallback.** `generateRawJson` throws on content/Zod failures; model fallback fires on infra errors only (scout §0 P2). The scoped primitive brings its OWN validate→retry loop (phase 2).
- **R4 — one engine for all scopes (orchestrator ruling on D1).** Element scope does NOT get a separate `generateWithSchema` client. All three scopes run on hardened `generateRawJson`; element scope passes a tight `z.object({ variations: z.array(z.string()).min(1) })` schema — that schema is not a `z.record()`, so it parses fine through the same client. This makes the phase-3 pilot gate genuinely decisive for phases 4–5: the pilot exercises the exact engine + narrowed-map prompting the later scopes reuse. `generateWithSchema` (provider structured output) is logged as a **deferred optimization** to revisit after the feature lands — not part of this plan.

## Design decisions (planner positions — reviewer should scrutinize)

- **D1 — single engine, per R4.** All scopes: hardened `generateRawJson` + route-level Zod validation + own retry loop. Element scope's schema is `{ variations: string[] }`; section/all scopes validate a loose record subset (`CopyResponseSchema`-style, `regenerate-story` precedent) then contract-validate against the narrowed elements map.
- **D1b — copy-builder dispatch key = engine, NOT audienceType.** Only 3 copy-prompt builders exist: `src/modules/audience/product/copyPrompt.ts`, `src/modules/audience/service/copyPrompt.ts`, `src/modules/audience/work/copyPrompt.ts`. **`work` is not an audienceType** (atelier = work-engine, SERVICE-audience), so dispatching on `audienceType` would send atelier/Kundius regen through the service builder — silent divergence from first-gen copy for the first paying customer. Correct key, with in-repo precedent: **`isWorkCopyTemplate(project.templateId)`** (`src/lib/workCopyEngine.ts:29` — its doc comment explicitly names the editor's story-regen route as the consumer of the membership predicate, independent of the wizard kill-switch flag; regen of an already-generated work project must not flip engines when the flag flips). Coverage matrix:

  | Project | Builder | Mock generator |
  |---|---|---|
  | `isWorkCopyTemplate(templateId)` (atelier) | `work/copyPrompt.ts` | `mockResponseGeneratorWork` |
  | else `audienceType === 'product'` | `product/copyPrompt.ts` | `mockResponseGeneratorProduct` |
  | else `audienceType === 'service'` | `service/copyPrompt.ts` | `mockResponseGeneratorService` |
  | `audienceType === 'writer'` (granth) | **typed `unsupported_project` error** | falls back to product mock (mock mode never 422s) |
  | `audienceType === 'ecommerce'` (reserved, zero projects) | same error | same fallback |

  **No-builder behavior = REJECT on the real path** (typed error → route returns `422 unsupported_project`, no charge, before any AI call). **Scope-honest justification (corrected in review iteration 3):** the "wrong-contract copy" rationale holds for **section/content scopes only** — there, generating a writer project's copy through the service builder would silently write wrong-contract copy (`src/modules/audience/writer/` has only `elementSchema.ts`; writer first-gen is skeleton/manual-fill, so no first-gen parity target exists). It does **NOT** hold for element scope: today's `regenerate-element/route.ts` imports NO builder and NO parser — it builds a generic inline variations prompt (`:70-81`) that works for any project regardless of audience/template, with zero contract exposure. A writer/ecom 422 on **element** regen prevents no existing risk; it arises solely because R4 routes element scope through the engine builders (consistency + business-context-aware variations, at the cost of dropping a currently-working generic path for two near-zero populations). Blast radius ≈ 0 either way (writer/granth is dev-only pre-Gate-A; ecommerce has no projects). Surfaced honestly as founder question #3, which **must be answered before phase 3 starts** (see phase 3 precondition); a "no" forks element scope to keep an engine-agnostic generic variations prompt — a cheap fork by construction, because element scope already has its own prompt + schema inside `generateScopedCopy` (the fork is one lenient branch when the engine is unresolvable, not a second primitive). The dispatch lives in ONE exported helper (`resolveCopyEngine(project)`, phase 2) consumed by both the real path and (leniently, via `resolveMockEngine`) the mock short-circuit in every route — server-side dispatch is new (today the CALLER picks the route), so it must be single-sourced and matrix-tested.
- **D2 — gate ordering: `requireAICredits` → Zod body validation → `assertProjectOwner` → project load → mock short-circuit → engine dispatch** (scout §6 rail disagreement, resolved; gate order **review-approved**; project-load + mock/dispatch ordering added in review iteration 3 — see the canonical sequence in phase 3 step 1, which phases 4–5 reference). Precedent: `work/regenerate-story` (the report's best route) and `regenerate-section` both run credits-first. It's safe because `requireAICredits` only *checks* (never charges); the single `consumeCredits` sits after the last failure exit, so ownership is always established before any charge or AI spend. **Why project load is an explicit step:** `resolveCopyEngine` needs `project.templateId` + `audienceType`, but `assertProjectOwner` (`src/lib/security.ts:57-95`) returns only `{userId}` — and for the demo token it short-circuits at `:63-65` with `project: null` before any DB read. Both in-repo precedents skip the fetch in demo mode (`regenerate-section/route.ts:76-96` wraps `findUnique` in `if (tokenId !== DEMO_TOKEN)`; `regenerate-story` fetches nothing). **Why mock precedes engine dispatch:** the demo token has no project row, so dispatch-before-mock would 422 a `lessgodemomockdata` request that today returns mock output. Mock mode therefore never 422s; engine 422 is a real-path-only behavior. Standardize all 3 routes on this full sequence.
- **D3 — `regenerate-content` cost defaults to `GENERATE_COPY: 3`**, reusing `UsageEventType.GENERATE_COPY` — no new constant, no new event type (regenerate-story precedent, scout §6). Founder decides the actual value at the phase-5 human gate.
- **D4 — design randomization stays client-side.** The design+copy path (caller B) randomizes layouts + background BEFORE the call; moving `layoutRegistry`/background-system server-side is out-of-proportion blast radius. The new contract sends the resulting *structural state* (`sections`, `sectionLayouts`, design flags) as validated inputs; the server builds the prompt from them + persisted project state. H3 is satisfied: no arbitrary prompt string crosses the wire — only schema-validated structure. **Reconciled with the phase-2 signature (iteration 3):** `getCompleteElementsMap(onboardingStore, pageStore)` (`elementDetermination.ts:244-247`) needs an onboarding view AND `pageStore.layout.sections/sectionLayouts` — neither derivable from the prisma `project` row alone in all cases. So `narrowElementsMap` takes an assembled input, and each route sources the layout state per scope: **'all' scope** → from the REQUEST (`sections`/`sectionLayouts`, the design+copy path per this decision); **section scope** → the request's `sectionId` + `layout` fields (already in caller D's contract), a size-1 layout map (story-route identity-map trick); **element scope** → the section's layout read from PERSISTED project state (`project.content` layout snapshot, the same source `loadDraft` serves the editor; the element caller sends no layout). Onboarding view: always from persisted `project.content.onboarding` (which `saveDraft/route.ts:169` writes, incl. `featuresFromAI`). Missing/unknown section or layout → typed error → 422 validation response, no charge.
- **D5 — model tier: NO new endpoint; map engine → EXISTING `modelConfig` endpoint.** (Changed in review iteration 3, adopting the reviewer's candidate.) `resolveCopyEngine` also yields the modelConfig endpoint: engine `'work'` → `'work-copy'`, engines `'product'`/`'service'` → `'copy'`. Rationale: the spec's acceptance is regen quality = **first-gen** quality — pinning regen to the exact endpoint its first-gen used achieves parity *by construction*, keeps `'work-copy'` as "the ONE knob to bump if NL quality fails" (documented at `modelConfig.ts:33,51`) covering regen for free, and removes the `modelConfig.ts` edit entirely. Element regen at 1 credit rides the same production tier as its first-gen; this moots the former founder question on regen tiering. Revisit tiering later via the same existing knobs if economics demand.
- **D6 — deterministic QA lands as Vitest route tests** (mocked `aiClient` + prisma, following the existing `work/regenerate-story/route.test.ts` harness) for all gate/contract behavior. No new Playwright specs: the gates are pure server logic, and the authed-e2e harness cost exceeds its marginal coverage. **Known residual of mocked `security`:** the demo-token (`lessgodemomockdata`) short-circuit would be asserted against a fake — so phase 3 additionally **creates `src/lib/security.test.ts` (no `*.test.ts` exists anywhere in `src/lib/` today)** to drive the REAL `assertProjectOwner` for the demo-token + regen-action cases (the demo short-circuit at `security.ts:63` needs no prisma/Clerk mocks; the non-demo cases do), and route tests assert the route-level `isMock` pairing on top. Real-LLM quality + visual taste remain founder manual gates.
- **D7 — telemetry string preserved.** `src/utils/trackTelemetry.ts:45` string-matches the literal `'No JSON found in response'`; the hardened client keeps that exact message (scout §5).
- **D8 — response contract for `regenerate-content` (deliberate pick).** Today `regenerationActions.ts:115/:303` pass the **whole response object** to `updateFromAIResponse(aiResponse, elementsMap)` (the route spreads `{...parsed, preservedElements, updatedElements, regenerationType}`), and `generationActions.ts` reads `.content` off that object at `:208` (fn signature at `:123`; `.success`/`.errors`/`.warnings`/`.isPartial` read at `:160-191`; dropping `errors` is safe — `|| []` at `:190`). **Pick: preserve this wire shape exactly.** The rebuilt route responds `{ success, content, warnings?, preservedElements, updatedElements, regenerationType, creditsUsed, creditsRemaining }` (top-level `content` key), and `regenerationActions.ts` keeps passing the whole JSON to `updateFromAIResponse` unchanged — zero shape translation in the store, `generationActions.ts` untouched.

## Human gates (summary)

| Gate | Where | What |
|---|---|---|
| **aiClient regression check** | end of phase 1 | Spec-mandated (§Candidate human gates). Unit tests can't cover real model output (all ~20 callers mock the module; goldens are opt-in). Founder runs a `CAPTURE=1` golden capture (`captureGolden.test.ts` / `captureGoldenWork.test.ts`), which drives the REAL hardened `generateRawJson('copy', …)` through the real prompt builders (`captureGolden.test.ts:72-73/:91-92/:125-126`) — **prompt builder + client directly, not a live copy route** — so a balanced-scanner regression throws and fails the capture. Confirm extraction + no spurious backup-model fallbacks before any later phase merges. **⚠ A bad capture overwrites `e2e/fixtures/generated/*.json`, which `generationContract` then validates — do NOT commit a bad capture.** |
| **Pilot decision** | end of phase 3 | Founder real-LLM `/manual-test`: modern element regen vs current. ≥ current → proceed; regresses → STOP, reassess before touching section/content (live customer paths). Decisive for phases 4–5 per R4: same engine, same narrowed-map prompting. **Precondition to phase 3 START: founder question #3 (writer/ecom 422) answered** — a "no" forks element-scope dispatch (D1b). |
| **Pricing decision** | start of phase 5 | `regenerate-content` goes from FREE to charging credits — user-visible pricing change. Default `GENERATE_COPY: 3`; founder confirms value (alternative anchor: `FULL_PAGE_GENERATION: 10`). |
| **Legacy deletion sign-off** | start of phase 6 | Confirm zero remaining importers + all 3 routes migrated + green before deleting. |

(Merge gate is the orchestrator's, not a plan phase.)

---

## Phase 1 — `aiClient.ts` hardening (H5 + M14) + first-ever unit tests

**Goal:** the shared client — the app's entire AI spend surface (scout §5 blast radius) — stops mis-extracting JSON, stops surfacing untyped throws, and stops buying wrong paid backup calls on content errors. **Exported signatures preserved — but this is NOT behavior-preserving:** swapping the greedy `/(\{[\s\S]*\})/` for a balanced scanner changes extraction behavior on every AI route, and step 2 requires widening an internal seam. That is exactly why the end-of-phase human gate exists; don't rationalize it away.

**Steps:**
1. **H5 — extraction/parse** (`generateRawJson` inner `tryGenerate`):
   - Replace the greedy `/(\{[\s\S]*\})/` with a brace/bracket-balanced scanner that also accepts **top-level arrays** (fixes the known `sequenceEngine.ts` gap).
   - Wrap `JSON.parse` in try/catch.
   - Introduce a tagged `AiParseError` (exported class) carrying `cause` + `kind: 'no_json' | 'bad_json' | 'schema'`; **keep the literal message `'No JSON found in response'`** for the no-json case (D7). Throw-on-failure contract unchanged — no result union.
2. **M14 — `isInfrastructureError`:**
   - Fast-exit `false` for `ZodError | SyntaxError | AiParseError`.
   - `true` for structured signals: SDK `status ∈ {429, 500, 502, 503, 504}`, connection/timeout error classes, `code ∈ {ECONNREFUSED, ETIMEDOUT}`, and explicit `stop_reason === 'max_tokens'` / `finish_reason === 'length'` read off the **response object** — NOTE: `callModelRaw` (`aiClient.ts:191-209`) currently discards the response object and returns only text, so this **requires adding a seam in `callModelRaw`** to surface stop/finish reason alongside content (internal; `aiClient.ts` is in Files touched).
   - Keep the string matcher as a narrowed last resort with **`'500'` and `'length'` REMOVED**. Net effect: strictly fewer backup calls; never more.
   - **Known asymmetry (accepted):** the stop/finish-reason seam is added to `callModelRaw` only. `callModel` (`:104-161`, the `generateWithSchema` path, `max_tokens: 8192` at `:143`) loses the `'length'`/`'max_tokens'` string match with **no replacement** — truncation on the structured path becomes **non-recoverable** (no backup retry). The invariant still holds: strictly fewer backup calls overall. Note this in the code comment; wiring the same seam into `callModel` is out of scope (no regen caller uses it).
3. Add an optional `opts` argument to `generateRawJson` (e.g. `{ maxTokens?: number }`) as a backward-compatible seam — `max_tokens: 8192` is hard-coded at all 4 call sites (scout §4) and element regen shouldn't pay for 8k. Optional param, defaults preserve current behavior.
4. **Write `src/lib/aiClient.test.ts`** — ZERO tests exist today; every existing test mocks this module out (scout §5), so this hardening is unverified without it. **Test-setup hazard: the suite MUST `vi.mock` both `@/lib/openaiClient` and `@/lib/anthropicClient`** — `openaiClient` instantiates the SDK at module load and throws without `OPENAI_API_KEY` (documented at `captureGolden.test.ts:20-22`), so an unmocked import kills the suite on a keyless machine. Cover:
   - Extraction: ```json fence, bare fence, prose-wrapped object, **multi-object response** (greedy-match regression), top-level array, no JSON at all (asserts the literal `'No JSON found in response'` message), malformed JSON inside a fence.
   - `isInfrastructureError` verdicts: ZodError → false; `AiParseError` → false; message containing `"maxLength: 500"` → false; message containing `"length"` (zod too_long) → false; `{status: 429}` → true; `ECONNREFUSED` → true; plain timeout message → true.
   - Fallback behavior: infra error on primary → backup called once; Zod/content error → NO backup call, rethrow.
   - Mock provider SDK call fns only (`callModelRaw` seam / SDK clients), never the module itself.

**Files touched:**
- `src/lib/aiClient.ts`
- `src/lib/aiClient.test.ts` (new)

**Verification:** `tsc` green; `npm run test:run` green (new suite + all existing suites — the mocked-out callers must be unaffected, proving signature preservation).

> **HUMAN GATE — aiClient regression check (spec §Candidate human gates).** Founder runs a `CAPTURE=1` golden capture (real LLM): `captureGolden.test.ts:72-73/:91-92/:125-126` all call the real `generateRawJson('copy', …)`, so the balanced-scanner extraction + fallback behavior is exercised against real model output — via the **prompt builders + hardened client directly** (not a live copy route; a scanner regression WOULD throw and fail the capture). The unit tests use synthetic strings and every other test mocks the module, so this is the only real-output check before the change rides under the app's whole AI spend surface. **Warning: a bad capture overwrites `e2e/fixtures/generated/*.json` (validated by `generationContract`) — review the diff, do not commit a bad capture.** Pass → proceed to phase 2.

---

## Phase 2 — scoped-generation primitive

**Goal:** build the missing capability (scout §3 verdict: element scope does not exist; section scope exists only as the hard-coded `work/regenerate-story` one-off). Generalize the story route's `ABOUT_UIBLOCKS` size-1 identity-map trick into a scope-parameterized primitive. Element scope = same code path + a 1-key element filter — NOT a second primitive (R4: one engine).

**Steps:**
1. Create `src/modules/generation/scopedRegen.ts` exporting:
   - `resolveCopyEngine(project)` — the D1b dispatch helper: `isWorkCopyTemplate(project.templateId)` → `'work'`; else `audienceType` `'product'`/`'service'` → same; `'writer'`/`'ecommerce'`/unknown → typed `UnsupportedProjectError` (routes map it to `422 unsupported_project`, before any AI call or charge — real path only, per D2). The resolved engine also determines the `modelConfig` endpoint (D5): `'work'` → `'work-copy'`, else → `'copy'` — **no `modelConfig.ts` change**. Single source for builder, mock-generator, and endpoint selection in all 3 routes.
   - `resolveMockEngine(project | null)` — lenient companion for the mock short-circuit (D2: mock mode never 422s; the demo token has no project row): resolvable project → its engine; `null`/unsupported → `'product'` mock default. Wraps `resolveCopyEngine`, never throws.
   - `narrowElementsMap(input, scope)` — `input: { onboarding: <onboarding view from persisted project.content.onboarding>, sections: string[], sectionLayouts: Record<string, string> }` (assembled by the route per D4's per-scope sourcing rules — NOT a raw prisma project, since `getCompleteElementsMap(onboardingStore, pageStore)` at `elementDetermination.ts:244-247` needs both stores' views); `scope: { kind: 'all' } | { kind: 'section', sectionId } | { kind: 'element', sectionId, elementKey }`. Builds the map via `getCompleteElementsMap` over a size-N layout view (size-1 for section/element, story-route identity-map trick), filters to the target section/element; typed errors for unknown section/element/missing layout.
   - `generateScopedCopy({ project, layoutState, scope, currentContent, userGuidance?, variationCount? })` — dispatches via `resolveCopyEngine` (engine → builder + endpoint), builds the prompt from the narrowed map + persisted business context (Brief/onboarding data under the project) by reusing the matching copy-prompt builder (`product/copyPrompt.ts` | `service/copyPrompt.ts` | `work/copyPrompt.ts`; no new bespoke builder per scope), calls the AI, validates, retries.
   - **Own retry loop**, modeled on the work route verbatim: `MAX_RETRIES = 2`, re-prompt with the validation error folded in (the `buildWorkCopyRetryPrompt` shape); exhausted → typed failure the route maps to `500 generation_failed, recoverable: true`. Inherits nothing (R3).
   - Per D1/R4: ALL scopes call the hardened `generateRawJson`. Section/all scopes pass a loose `CopyResponseSchema`-style record (already accepts subsets, `regenerate-story` precedent) then contract-validate the subset against the narrowed map (mirroring `validateStoryAbout`). Element scope passes `z.object({ variations: z.array(z.string()).min(1) })` with a variations-focused prompt over the same narrowed 1-key map. (Deferred idea, NOT this plan: move element scope to `generateWithSchema` structured output as a later optimization.)
2. If the three copy-prompt builders don't already accept an elements-map parameter, add a **seam-only** optional param/export (default = full map) — no prompt-logic changes. Any edit beyond an export/optional-param seam is out of scope for this phase.
3. Unit tests `src/modules/generation/scopedRegen.test.ts` (mock `aiClient`): **full dispatch matrix from D1b** (atelier/work-template project → work builder even though `audienceType==='service'`; product → product; plain service → service; writer → `UnsupportedProjectError`; ecommerce → `UnsupportedProjectError`); **endpoint mapping** (`'work'` → `'work-copy'`, `'product'`/`'service'` → `'copy'`, D5); `resolveMockEngine` (null → `'product'`; writer → `'product'`; atelier → `'work'`; never throws); narrowing (section keeps only its elements; element keeps 1 key; unknown ids / missing layout → typed error); retry loop (bad content → retry with error-in-prompt → success; exhaustion → typed failure, exactly MAX_RETRIES+1 calls); subset validation accepts a 1-section response; element scope returns `variations` per `variationCount`.
4. Update `src/modules/generation/README.md` (module inventory) if present.

**Files touched:**
- `src/modules/generation/scopedRegen.ts` (new)
- `src/modules/generation/scopedRegen.test.ts` (new)
- `src/modules/audience/product/copyPrompt.ts` (seam-only: optional elements-map param/export)
- `src/modules/audience/service/copyPrompt.ts` (seam-only, same)
- `src/modules/audience/work/copyPrompt.ts` (seam-only, same)
- `src/modules/generation/README.md` (if present)

**Verification:** `tsc` + `test:run` green. No route touched yet — tree stays green trivially.

---

## Phase 3 — rebuild `regenerate-element` (PILOT)

> **Precondition (D1b):** founder question #3 (writer/ecom → 422) answered before this phase starts. "Yes" → build as written. "No" → element scope keeps an engine-agnostic generic variations prompt when the engine is unresolvable — a one-branch fork inside `generateScopedCopy`'s element path (cheap by construction; element scope's prompt + schema are already distinct), with the 422 mapping dropped from this route only.

**Goal:** smallest live surface on the modern stack, fully gated, contract-preserving. This is a BUILD on the phase-2 primitive, not a port. Per R4 it runs the same engine phases 4–5 will use, so the pilot verdict genuinely covers them.

**Steps:**
1. Rewrite `src/app/api/regenerate-element/route.ts` on the **canonical sequence** (scout §6, story-route steps; order per D2 — phases 4/5 reuse this sequence verbatim):
   1. `requireAICredits(req, UsageEventType.ELEMENT_REGEN, CREDIT_COSTS.ELEMENT_REGENERATION)` — check only, no charge.
   2. Zod validation: body `{ sectionId, elementKey, currentContent: string, variationCount }`; **`tokenId` stays in the QUERY string** (caller contract E — do not move it to the body).
   3. Compute `isMock = NEXT_PUBLIC_USE_MOCK_GPT === 'true' || tokenId === DEMO_TOKEN`. If NOT mock: `assertProjectOwner(clerkId, tokenId, { action })` — **NEW, currently missing on this route**; no `claimIfOrphan`/`allowMissing` (read-only regen precedent; `regenerate-section/route.ts:66-72` + `regenerate-story:115-124` both skip ownership in mock/demo because `requireAICredits` returns a synthetic demo user id).
   4. **Project load** (per D2; precedent `regenerate-section/route.ts:76-96`): `if (tokenId !== DEMO_TOKEN)` → `prisma.project.findUnique({ where: { tokenId }, select: { id, audienceType, templateId, content, title, inputText } })`. Unlike legacy (where the project was an optional enhancement), the project row is now REQUIRED on the real path (engine dispatch + prompt context hang off it): non-mock + no row → 404, no charge. Demo token → no fetch, `project = null`.
   5. **Mock short-circuit** (BEFORE engine dispatch — mock mode never 422s, D2): respond with mock variations, `creditsUsed: 0`, generator picked via `resolveMockEngine(project)` (D1b matrix; demo token / unsupported → product mock default).
   6. `resolveCopyEngine(project)` — real path only; `UnsupportedProjectError` → `422 unsupported_project`, no charge (D1b; subject to the phase precondition fork).
   7. `generateScopedCopy` with element scope + `variationCount` (retry loop inside; section layout for the narrowed map read from persisted `project.content` per D4); exhausted → `500 generation_failed, recoverable: true` — returns BEFORE charge.
   8. `consumeCredits(...)` on success only; consumption failure = warn-only.
   9. Respond `{ variations: string[], creditsUsed, creditsRemaining }`; handler wrapped in `withAIRateLimit`.
   - ID-space care: `requireAICredits` returns the **Clerk id**; `assertProjectOwner` expects the Clerk id (scout §6 silent-poison warning). No internal-id crossover.
   - Remove the route's `callAIProvider` copy + hardcoded model strings + inline variations prompt (M16 slice). (This route imports NO legacy prompt/parse modules today — nothing legacy to strip here.)
2. Contract preserved exactly (caller E, `aiActions.ts:543`): `POST /api/regenerate-element?tokenId=…`, response consumed as `result.variations: string[]`, errors read from `errorData.error`. No editor file changes in this phase.
3. Route tests `src/app/api/regenerate-element/route.test.ts` (harness = `work/regenerate-story/route.test.ts`; mock `aiClient`, prisma/security, credit fns): unauth → 401; insufficient credits → 402-shape response, no AI call; non-owner → 403, no charge; **demo token (`lessgodemomockdata`) → mock variations, `creditsUsed: 0`, NO project fetch, NO 422/404, no `consumeCredits`** (the sequence-order regression test); env-flag mock with a real writer-project token → mock via `resolveMockEngine` fallback, no 422; non-mock unknown token → 404, no charge; unsupported project (writer fixture, real path) → 422, no AI call, no charge; generation failure after retries → 500 recoverable, **no charge**; success → variations shape + `consumeCredits` called exactly once with ELEMENT_REGEN.
4. **Create `src/lib/security.test.ts` (new — no `*.test.ts` exists in `src/lib/` today)** (D6 residual): drive the REAL `assertProjectOwner` for the demo-token (`lessgodemomockdata`) short-circuit (needs no prisma/Clerk mocks — it returns at `security.ts:63` before any DB read) + a regen-action ownership case (mocked prisma), so the isMock-pairing behavior route tests assert against a mock is anchored to the real fn at least once.

**Files touched:**
- `src/app/api/regenerate-element/route.ts`
- `src/app/api/regenerate-element/route.test.ts` (new)
- `src/lib/security.test.ts` (new)
- `src/modules/generation/scopedRegen.ts` (only if pilot surfaces a primitive gap; note in audit)

**Verification:** `tsc` + `test:run` green; manual dev-server smoke of element regen from the editor toolbar (mock + real).

> **HUMAN GATE — pilot decision (spec §Pilot).** Founder runs real-LLM `/manual-test` comparing modern-stack element regen vs current output on a real page. Quality ≥ current → proceed to phase 4 (same engine + narrowed-map prompting, so the verdict transfers). Regresses → STOP the pipeline and reassess the scoped-generation approach before touching section/content paths that hit live customer pages.

---

## Phase 4 — rebuild `regenerate-section`

**Goal:** section regen on the proven pattern. Gating already correct on this route (scout §6) — keep it; swap the engine.

**Steps:**
1. Rewrite `src/app/api/regenerate-section/route.ts` on the phase-3 canonical sequence: keep `requireAICredits(SECTION_REGEN, SECTION_REGENERATION=2)` → Zod → `assertProjectOwner` (skip when `isMock` — already this route's pattern at `:66-72`) → **project load** (keep the existing `if (tokenId !== DEMO_TOKEN)` fetch at `:76-96`, add `templateId` to the select; project becomes REQUIRED on the real path — non-mock + no row → 404, replacing the legacy "proceed without context" leniency) → **mock short-circuit** (before engine dispatch, never 422s) → `resolveCopyEngine` unsupported → `422 unsupported_project` (D1b) → `generateScopedCopy` (section scope, `userGuidance` passed through, `currentContent` as context; narrowed map built from the request's `sectionId` + `layout` per D4) → `consumeCredits`. Replace the legacy `buildPrompt`/`parseAiResponse`/`callAIProvider` internals.
2. Contract preserved exactly (caller D, `aiActions.ts:98`): body `{ sectionId, tokenId, userGuidance?, currentContent, sectionType, layout }`; response `data.content: Record<string, string | { content, type }>` — the editor's shape-preserving merge loop must keep working unchanged. Validate the generated subset against the section's element contract before responding (no filler-copy pass-through).
3. Replace the legacy `mockResponseGenerator` import with the sibling mocks (`mockResponseGenerator{Product,Service,Work}`) **selected via `resolveMockEngine` (D1b matrix — engine key, NOT audienceType; lenient in mock mode)**, filtered to the section — keeps the mock short-circuit alive and unblocks phase-6 deletion.
4. Route tests `src/app/api/regenerate-section/route.test.ts`: same gate matrix as phase 3 (401 / 402 / 403 / demo-token→mock-no-fetch-no-charge / 404-unknown-token / 422-unsupported-real-path-only / fail-no-charge / success-charges-once with SECTION_REGEN) + response `content` record shape with a mixed string/`{content,type}` fixture + a work-template fixture asserting the work engine (not service) is dispatched.

**Files touched:**
- `src/app/api/regenerate-section/route.ts`
- `src/app/api/regenerate-section/route.test.ts` (new)

**Verification:** `tsc` + `test:run` green; manual dev smoke: section regen from editor with and without `userGuidance`.

---

## Phase 5 — rebuild `regenerate-content` + re-point `regenerationActions.ts` (H3 fix)

> **HUMAN GATE — pricing decision (before implementing this phase).** `regenerate-content` is FREE today; this phase makes it cost credits — a user-visible pricing change. The spec settles THAT it's gated; the **cost value** is the founder's call. Default: `GENERATE_COPY: 3` reusing `UsageEventType.GENERATE_COPY` (D3, regenerate-story precedent — no new constant/event). Alternative anchor: `FULL_PAGE_GENERATION: 10`. Founder confirms before build.

**Goal:** close the H3 hole (ungated arbitrary-prompt proxy) by moving prompt construction fully server-side and gating the route; re-point `regenerationActions.ts` — the only live client-side prompt builder (R1, as narrowed by plan-review) — to call the route. Route + store change land together so the tree never carries a half-migrated contract. (`contentActions.ts` needs NO route plumbing — its legacy imports are dead and are stripped in phase 6.)

**Steps:**
1. Rewrite `src/app/api/regenerate-content/route.ts` — new server-side contract modeled on the dead-but-correct typed client C (scout §1/§2): body `{ tokenId, updatedInputs, preserveDesign, sections, sectionLayouts, theme?/backgroundSystem? }`. **No `prompt` field — reject/ignore any client-supplied prompt.** The current body schema (`route.ts:11`) destructures `{prompt, preserveDesign, currentDesign, updatedInputs, newDesign}` only — confirmed no `tokenId`; the new schema adds it (ownership hangs off it). Phase-3 canonical sequence (per D2): `requireAICredits(GENERATE_COPY, <gated value>)` → Zod → `assertProjectOwner` (skip when `isMock`) → **project load** (`if (tokenId !== DEMO_TOKEN)` fetch incl. `templateId`; non-mock + no row → 404) → **mock short-circuit** (before engine dispatch; sibling mock generators via `resolveMockEngine`, not legacy `generateMockResponse`; `creditsUsed: 0`) → `resolveCopyEngine` unsupported → 422 (D1b, real path only) → `generateScopedCopy` scope `'all'` (retry loop inside; layout state from the REQUEST per D4) → `consumeCredits` on success → respond per D8. Wrapped in `withAIRateLimit`.
2. Server-side prompt build (scout §2 verdict: fully movable): business/brand/category/layout context from persisted project state + `layoutElementSchema`-derived structure; genuinely client-only inputs (unsaved `changeTracking.currentInputs`; design+copy path's freshly randomized `sections`/`sectionLayouts`/`backgroundSystem`) arrive as validated fields per D4. `preserveDesign: true` keeps the "PRESERVE existing sections/layouts/theme" behavior server-side. `featuresFromAI` needs no special handling — it IS persisted per-project (`saveDraft/route.ts:169` writes it under `content.onboarding`; `loadDraft/route.ts:146` reads it back).
3. Response contract per **D8**: `{ success, content, warnings?, preservedElements, updatedElements, regenerationType, creditsUsed, creditsRemaining }` — top-level `content` key, preserving today's spread shape, because the store passes the WHOLE response object to `updateFromAIResponse(aiResponse, elementsMap)` and `generationActions.ts:208` reads `.content` off it. No `generationActions.ts` change.
4. Re-point `src/hooks/editStore/regenerationActions.ts` (callers A/B): drop the `buildFullPrompt` import; POST the new body; keep client-side design randomization before the call (D4); keep passing the whole response JSON to `updateFromAIResponse(aiResponse, elementsMap)` unchanged (D8); error/isDirty/undo/`completeSaveDraft` flows unchanged. Surface the route's new 402 (credits) error through the existing `aiGeneration.errors` path.
5. Route tests `src/app/api/regenerate-content/route.test.ts`: gate matrix (401 / 402 / 403 / demo-token→mock-no-fetch-no-charge / 404-unknown-token / 422-unsupported-real-path-only / fail-no-charge / success-charges-once with GENERATE_COPY); **a request carrying a `prompt` field gets it ignored/rejected** (H3 regression test); response shape matches D8 (top-level `content` validating against the elements-map shape for a fixture project, plus `preservedElements`/`updatedElements`).

**Files touched:**
- `src/app/api/regenerate-content/route.ts`
- `src/app/api/regenerate-content/route.test.ts` (new)
- `src/hooks/editStore/regenerationActions.ts`
- `src/modules/generation/scopedRegen.ts` (only if `'all'` scope needs a gap filled; note in audit)

**Verification:** `tsc` + `test:run` green; manual dev smoke of BOTH editor paths — content-only regen (preserveDesign true) and design+copy regen (preserveDesign false) — confirming store writes, undo stack, and auto-save still behave. Founder real-LLM `/manual-test` spot-check of content + section regen quality (extends the pilot verdict to the remaining scopes; part of the spec's acceptance `/manual-test` criterion).

---

## Phase 6 — legacy deletion sweep + docs

> **HUMAN GATE — deletion sign-off.** Proceed only after: phases 3–5 merged into the branch and green, AND a fresh grep shows ZERO remaining importers of every file below (after step 1's dead-import strip). Present the grep evidence at the gate.

**Goal:** delete the orphaned legacy stack — bigger than the spec's ~4,200 lines once transitive orphans are included (scout §7) — and fix the three stale docs.

**Steps:**
1. **Strip dead legacy imports from `src/hooks/editStore/contentActions.ts`** — delete the 3 import lines (`useOnboardingStore` :2; `buildFullPrompt`/`buildSectionPrompt`/`buildElementPrompt` :3; `parseAiResponse` :4). Plan-review verified all are imported and NEVER used (`regenerateSection`/`regenerateElement`/`updateFromAIResponse` are `logger.warn` stubs delegating to `aiActions`/`generationActions`). No behavior change, no route plumbing; this is what unblocks the deletion below.
2. Grep-verify zero importers (scout §7: no barrel, no dynamic imports — static graph is complete), then delete:
   - `src/modules/prompt/buildPrompt.ts`
   - `src/modules/prompt/parseAiResponse.ts`
   - `src/modules/prompt/parseStrategyResponse.ts` (only edge was a type-only import from `buildPrompt.ts`)
   - `src/modules/prompt/mockResponseGenerator.ts` — **KEEP the `mockResponseGenerator{Product,Service,Work}.ts` siblings** (live across audience routes, tests, scripts)
   - `src/utils/regeneration/contentOnlyRegeneration.ts` (dead typed client, zero importers; its contract was absorbed into phase 5)
3. Doc updates required by the deletion:
   - `src/modules/prompt/README.md:13-26` — remove deleted-file entries; describe the module's remaining surface.
   - `CLAUDE.md:73-74` — stale claim that `parseStrategyResponse()`/`parseAiResponse()` are the live parsers; re-point to the per-audience builders + `scopedRegen` for regen.
   - `docs/guides/copyQualityEval.md:17-18,102` — re-point legacy references.
4. Full gate: `tsc`, `test:run`, `lint`, `npm run build` (build ≠ next build — runs published-CSS + assets first; required at end-of-feature).

**Files touched:**
- `src/hooks/editStore/contentActions.ts` (remove 3 dead import lines)
- `src/modules/prompt/buildPrompt.ts` (delete)
- `src/modules/prompt/parseAiResponse.ts` (delete)
- `src/modules/prompt/parseStrategyResponse.ts` (delete)
- `src/modules/prompt/mockResponseGenerator.ts` (delete)
- `src/utils/regeneration/contentOnlyRegeneration.ts` (delete)
- `src/modules/prompt/README.md`
- `CLAUDE.md`
- `docs/guides/copyQualityEval.md`

**Verification:** grep zero references to the deleted modules; `tsc` + `test:run` + `lint` + `build` all green.

---

## Acceptance mapping (spec → phases)

| Spec criterion | Phase |
|---|---|
| aiClient parse guarded, infra-matcher fixed | 1 (+ gate) |
| 3 routes on modern stack, no legacy imports | 3, 4, 5 |
| Auth + ownership + credit gate + charge-on-success on all 3; H3 closed | 3, 4, 5 |
| Same-schema output, editor callers contract-compatible | 2–5 |
| Filler-copy failure mode gone | 2 (validate-or-retry, never default-fill) + 4/5 |
| Legacy deleted, `callAIProvider` de-triplicated | 3–5 (de-dupe), 6 (delete) |
| Real-LLM `/manual-test` quality ≥ first-gen | gates at 3 and 5 |
| `tsc` + `test:run` green | every phase |

## Risks for the reviewer to scrutinize

1. **Prompt-quality parity of narrowed maps**: reusing full-page copy builders with a 1-section/1-element map may carry irrelevant context or lose section-flow context. Pilot gate + phase-5 manual QA are the checks; retry loop bounds the failure mode.
2. **Server-side engine dispatch is new** (today the caller picks the route; no server-side precedent). Mitigated by single-sourcing in `resolveCopyEngine` on the documented `isWorkCopyTemplate` predicate + the full matrix test in phase 2; the highest-stakes cell (atelier → work builder) is explicitly asserted in phases 2 and 4.
3. **Writer/ecommerce regen becomes an explicit 422 on the real path** (D1b reject) — for section/content this replaces a wrong-contract legacy path (genuine risk prevented); for **element** scope it replaces a working generic variations prompt (no contract risk existed — the 422 there is an R4-consistency cost, not a safeguard). Deliberate, near-zero blast radius, but it IS a change; founder question #3, answered before phase 3 starts.
4. **Demo-token bypass** (`assertProjectOwner` short-circuits `ok:true` for `lessgodemomockdata` at `security.ts:63-65` before auth AND before any project read) — every route must pair it with an explicit `isMock` check so demo traffic can't charge or write, AND skip the project fetch for the demo token (no project row exists; sequence order in D2/phase-3 step 1 exists precisely so demo requests hit the mock branch, never engine dispatch). Real-fn anchor in the new `security.test.ts`, phase 3 step 4; demo-token sequence regression tests in phases 3/4/5.
5. **aiClient behavior change under the whole spend surface** — signature-preserving ≠ behavior-preserving; unit tests are synthetic. Bounded by the phase-1 `CAPTURE=1` human gate. Includes the accepted M14 asymmetry: truncation on the `callModel`/`generateWithSchema` path becomes non-recoverable (phase 1 step 2).

## Deferred (logged, not in this plan)

- Element scope on `generateWithSchema` (provider structured output) as a later optimization — revisit after the feature lands and the pilot verdict is in.
- Wiring the stop/finish-reason seam into `callModel` (structured path) so truncation there is recoverable again — no regen caller uses that path.

## Unresolved questions (founder)

1. `regenerate-content` price: 3 credits (GENERATE_COPY, default) or 10 (FULL_PAGE_GENERATION)? Any user comms needed when it stops being free?
2. Pilot gate scheduling: run `/manual-test` right after phase 3, or batch with the phase-5 spot-check? (Plan assumes right after phase 3 — spec says so.)
3. **Answer BEFORE phase 3 starts:** writer (granth) + ecommerce regen → explicit 422 on ALL scopes? For section/content the 422 prevents wrong-contract copy (no builder exists for these audiences). For **element** regen it does NOT prevent an existing risk — today's element route uses a generic, audience-agnostic variations prompt that works for any project; the 422 there is purely the cost of R4's one-engine consistency. "Yes" = 422 everywhere (plan as written). "No" = element scope keeps a generic fallback for unsupported projects (cheap one-branch fork, phase 3 precondition). Writer is dev-only pre-Gate-A; ecommerce has zero projects.
