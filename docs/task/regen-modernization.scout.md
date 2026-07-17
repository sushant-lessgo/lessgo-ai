# regen-modernization — scout findings

Condensed output of 4 read-only scouts. Source of truth for the planner; the planner should NOT re-read the underlying files.

> ⚠️ All 4 scouts ran before the spec was copied into the worktree (the spec is untracked on main, so `git worktree add` didn't carry it). Findings are code-derived and were cross-checked against the spec afterwards by the orchestrator. Two spec premises are **falsified** — see §0.

---

## §0. Spec premises that are WRONG (orchestrator rulings)

**P1 — "only the 3 regen routes import the legacy files" is FALSE.**
Two editor-store modules import `buildPrompt`/`parseAiResponse` and build prompts **client-side, in the browser**:
- `src/hooks/editStore/contentActions.ts:3-4` — `buildFullPrompt`, `buildSectionPrompt`, `buildElementPrompt`, `parseAiResponse`
- `src/hooks/editStore/regenerationActions.ts:4` — `buildFullPrompt` (used :69, :259)

`regenerate-content` and `regenerate-element` do **not** import `buildPrompt` at all — the client builds the prompt and POSTs the finished string. That is H3 seen from the other side. A prior audit already recorded these importers (`docs/task/completed/scale-08-businesstype-config.audit.md:315`), so the spec is stale, not newly wrong.

**ORCHESTRATOR RULING (resolve from spec, do not re-litigate):** re-point those two store modules to **call the routes**, not to a new client-importable builder. The spec's H3 constraint ("prompt construction moves server-side") and its acceptance criteria require it; a new client builder would relocate the same client/server coupling and leave H3 half-fixed. Log this as a plan decision; the plan-reviewer may attack it.

**P2 — "typed fallback" does not mean what the spec assumes.**
`generateRawJson` either resolves valid or **throws**. There is no result-union fallback contract. The model-level fallback (primary → backup) fires on **infrastructure errors only**; content/Zod failures deliberately rethrow (`aiClient.ts:278-279`). Retry-on-bad-content is **each route's job** — both copy rails wrap the call in their own validate→retry-with-error-in-prompt loop. **A regen primitive must bring its own retry loop; it inherits none.**

---

## §1. Caller contracts to preserve (Q1)

| # | Call site | Route | Request body | Response used | Store write |
|---|---|---|---|---|---|
| A | `regenerationActions.ts:77` (content-only) | `POST /api/regenerate-content` | `{prompt, preserveDesign:true, currentDesign:{sections,sectionLayouts,theme}, updatedInputs}` | opaque JSON as `aiResponse` | `updateFromAIResponse(aiResponse, elementsMap)` (:102), `elementsMap = getCompleteElementsMap(...)`; then isDirty, undoStack, `completeSaveDraft(tokenId)` |
| B | `regenerationActions.ts:261` (design+copy) | same | `{prompt, preserveDesign:false, updatedInputs, newDesign:{sections,sectionLayouts,backgroundSystem}}` | same opaque | same. **Design mutations happen CLIENT-side BEFORE the call** (:190-249): random layout pick from `layoutRegistry` + `generateCompleteBackgroundSystem` |
| C | `src/utils/regeneration/contentOnlyRegeneration.ts:26` | same | `{tokenId, updatedInputs, preserveDesign, currentDesign}` — **no `prompt`** | typed `{success, content, warnings, preservedElements, updatedElements}` | none — **unused/dead**, zero importers |
| D | `aiActions.ts:98` | `POST /api/regenerate-section` | `{sectionId, tokenId, userGuidance?, currentContent: section.elements, sectionType, layout}` | `data.content: Record<string, string\|{content,type}>` | shape-preserving merge loop (:147-171), skips image keys → `content[sectionId].elements`; `aiMetadata.lastGenerated`, `queuedChanges`, history, `queueAiBaselinePatch`, `completeSaveDraft` |
| E | `aiActions.ts:543` | `POST /api/regenerate-element?tokenId=…` (**tokenId in QUERY, not body**) | `{sectionId, elementKey, currentContent: string, variationCount}` | `result.variations: string[]` | `elementVariations = {visible:true, variations:[currentContent, ...result.variations], selectedIndex:0, sectionId, elementKey}` — no content write until `applyVariation` |
| F | `aiActions.ts:313` (adjacent, NOT in scope) | `POST /api/audience/work/regenerate-story` | `{tokenId, sectionId, interviewAnswers, brief}` | `data.content` | identical merge to D (:350-372) |

Errors: A/B throw `Error("… failed: ${status} - ${statusText}")` → `aiGeneration.errors` + `status:'Error: …'`. D/E/F read `errorData.error`. **No retries, no fallback anywhere.**

**Note:** C is a stale typed client that already assumes the server-side-prompt contract (`tokenId` instead of `prompt`) — the intended end-state exists on paper.

## §2. What `regenerate-content`'s `prompt` contains (Q4)

Path: `regenerationActions.ts:69`/`:259` → `buildFullPrompt(tempOnboardingStore, pageStoreView)` (`buildPrompt.ts:1348`), composing:
- `buildBusinessContext` (:267) — oneLiner, validatedFields, featuresFromAI, meta.onboardingData.{targetAudience,businessType}
- `buildBrandContext` (:401) — hiddenInferredFields (awarenessLevel, copyIntent, toneProfile, marketSophisticationLevel, problemType) + pricingModel
- `buildCategoryContext` (:288) — static lookup tables
- `buildLayoutContext` (:423) + `buildSectionFlowContext` (:601) + `buildOutputFormat` (:804) — derived from sections + sectionLayouts via `layoutElementSchema`
- content-only mode appends a literal "PRESERVE existing sections/layouts/theme" block (:71-75)

Inputs: `useOnboardingStore.getState()` **overridden** with `changeTracking.currentInputs` (:55-60) + edit store sections/sectionLayouts/theme/content/onboardingData.

**Verdict: can move fully server-side.** Everything is static tables, `layoutElementSchema`-derived, or project state persisted under `tokenId`. Genuinely client-only: (a) **unsaved** `changeTracking.currentInputs`, (b) design+copy path's freshly-randomized `newLayouts` + `backgroundSystem`. Both solved by the C-style contract `{tokenId, updatedInputs, preserveDesign, sections, sectionLayouts}` — ideally move layout/background randomization server-side too. **Verify `featuresFromAI` is persisted per-project before cutting the client loose.**

## §3. Scoped generation (Q2) — VERDICT

**Element-scoped: DOES NOT EXIST, must be built. Section-scoped: exists only as a hard-coded one-off.**

No generic scope parameter anywhere. Only precedent: `src/app/api/audience/work/regenerate-story/route.ts` — a whole route for ONE section (`STORY_SECTION_KEY`). It fakes scope with an identity uiblocks map of size 1 (`{[STORY_SECTION_KEY]: STORY_SECTION_KEY}`, :71), feeds a bespoke prompt (`buildStoryInterviewPrompt`), runs the **full-page parser** (`parseWorkCopy`) over the 1-key result, contract-validates via `validateStoryAbout` (:178). Uses the same `CopyResponseSchema` as full-page (:171) — it's a loose record, so a 1-section response validates fine.

**Smallest thing to build:** a scope-parameterized copy primitive ≈ `generateScopedCopy({scope: {sectionId} | {sectionId, elementKey}, ...})` that:
1. Narrows `uiblocks` to target section(s) — the `ABOUT_UIBLOCKS` trick generalized. **This is the whole mechanism.** `getCompleteElementsMap()` (`src/modules/sections/elementDetermination.ts`) already keys section→layout→elements; filtering its output to one section (or one element key) needs **no new machinery**.
2. Builds prompt from narrowed map + Brief + voice, reusing existing `build*CopyPrompt` builders (not a new bespoke builder per scope).
3. Keeps `CopyResponseSchema` unchanged (loose record already accepts subsets); validates the subset against contract, mirroring `validateStoryAbout`.
4. Reuses the existing retry loop shape (`buildWorkCopyRetryPrompt`, MAX_RETRIES=2) verbatim.

**Element scope = same code path with a 1-key element filter — NOT a separate primitive.**

Generalizing the story route is mostly **deleting hard-coded constants**, not inventing machinery.

## §4. Model + generation config (Q5)

**One shared place: `src/lib/modelConfig.ts`.** Routes never pick models; they pass an `Endpoint` string literal (:5 — 10 endpoints incl. `copy`, `work-copy`, `strategy`).
- Tiers (:18-55): `cheap` (default) = `gpt-4o-mini` primary / `claude-haiku-4-5-20251001` backup. `production` = `claude-sonnet-4-5-20250929` primary / `gpt-4o` backup for strategy/copy/work-copy.
- Env: `AI_MODEL_OVERRIDE` (forces primary, kills backup), `AI_MODEL_TIER`.
- **Temperature: never set anywhere** — provider defaults apply. Introducing it = NEW capability + plumbing, not a tweak.
- **`max_tokens: 8192` hard-coded** at all 4 call sites (`aiClient.ts:143,196,205`) — not per-endpoint. Lowering it for element regen requires touching shared `aiClient.ts`; minimal backward-compatible seam = optional opts arg on `generateRawJson`.
- Structured-output mode is active **only** on `generateWithSchema`. **Every generation route uses `generateRawJson`** (raw completion + regex extract) → no structured output on the copy path today.

**Free knob:** per-scope model tiering costs nothing — add a `'regen'`/`'element-regen'` Endpoint to the union + both tier tables. Intended extension point (cf. `modelConfig.ts:33`).

**PLANNER DECISION — worth taking:** `generateRawJson` is the codebase's entire generation surface yet is the *weaker* of the two clients; it exists only to dodge Anthropic's `z.record()` limitation (`aiClient.ts:213-215`). Regen naturally wants **tighter per-element schemas** → `generateWithSchema` (real structured-output) becomes available, which **deletes** the regex-extraction failure mode instead of patching it. Weigh this against H5 hardening scope.

## §5. `aiClient.ts` hardening (H5 + M14)

### H5 — `generateRawJson:217-254` (inner `tryGenerate:224-240`)
1. `callModelRaw(model, prompt)` → plain text. 2. Extraction (:229-231): ```json fence → bare fence → **greedy `/(\{[\s\S]*\})/`**. 3. (:233) no match → `throw new Error('No JSON found in response')`. 4. (:237-239) **unguarded `JSON.parse`**, then `schema.parse`.

Greedy `{...}` matches first `{` to **last** `}` in the whole response → prose-wrapped/multi-object replies mis-extract; a bare top-level **array** never matches (known gap: `src/modules/email/sequenceEngine.ts:188`, `docs/task/email-sequences.audit.md:140`). `JSON.parse` on a mis-extracted span throws native `SyntaxError` **indistinguishable from a schema failure** at the call site.

Escape paths: retry-loop routes catch inside `while (attempts <= MAX_RETRIES)` → re-prompt → `500 generation_failed, recoverable:true`. Single-shot routes (email-sequences, outreach, social) catch once → `invalid_shape` → `500`.
⚠️ **`src/utils/trackTelemetry.ts:45` string-matches the literal `'No JSON found in response'` — renaming that message breaks telemetry.**

**Target:** keep the exported signature (throw-on-failure); a result union would ripple into every caller. Internals only: brace/bracket-balanced scanner that also accepts top-level arrays; wrap `JSON.parse` in try/catch; rethrow a **tagged** error (`AiParseError` with `cause` + `kind: 'no_json'|'bad_json'|'schema'`) **preserving the `'No JSON found in response'` message** for telemetry. Strictly additive → no caller changes.

### M14 — `isInfrastructureError:166-185`
Only handles `error instanceof Error`; lowercases `message`; substring-matches `'rate limit'|'429'|'503'|'502'|'500'|'timeout'|'network'|'econnrefused'|'unavailable'|'max_tokens'|'length'`. Non-Error → false.
Callers: `generateRawJson:247`, `generateWithSchema:280`. `true` → **a second, full-price call** to `backup`. False positives cost real money + latency.

`'500'` matches any message containing those digits (token counts, IDs, `"maxLength: 500"`). **`'length'` matches every zod `too_long`/`minLength`/`maxLength` issue** — and zod errors are exactly the content errors `:278-279` says must NOT fall back. **So today a schema-validation failure frequently buys a second paid call that cannot possibly succeed.**

Both SDKs carry structured fields: OpenAI `APIError`→`status`/`code`/`type`; Anthropic `APIError`→`status`.
**Target:** fast-exit `ZodError | SyntaxError | AiParseError` → **false unconditionally**; `status` ∈ {429,500,502,503,504} → true; connection/timeout classes (`APIConnectionError`, `APIConnectionTimeoutError`, `RateLimitError`, `InternalServerError`) or `code` (`ECONNREFUSED`/`ETIMEDOUT`) → true; explicit `stop_reason==='max_tokens'`/`finish_reason==='length'` read off the **response**, not sniffed from text; keep the string matcher as narrowed last resort with **`'500'` and `'length'` REMOVED**. Strictly reduces backup calls.

### Blast radius — this is the app's WHOLE AI spend surface
`generateWithSchema`: `v2/understand:161`, `v2/scrape-website:262`, `audience/product/strategy:169,175`, `audience/service/strategy:133`, `audience/work/strategy:138`, `generate-privacy-policy:142`, `outreach/[token]:397`.
`generateRawJson`: `audience/product/generate-copy:239`, `audience/service/generate-copy:189`, `audience/work/generate-copy:243`, `audience/work/regenerate-story:171`, `email-sequences/[token]:152`, `email-sequences/[token]/regenerate:124`, `outreach/[token]:173`, `outreach/[token]/regenerate:145`, `social/[token]/posts:115`.
Non-route: `scripts/dogfoodServicePipeline.ts:413,456`, `scripts/testServicePipeline.ts:94,132`, golden tests `captureGolden.test.ts:73,92,126`, `captureGoldenWork.test.ts:332,367,447,489,598,632`.

### ⚠️ Test coverage — the honest answer: NO, existing tests would NOT catch a regression
Every test touching these **mocks the module out** (`vi.mock('@/lib/aiClient')` at `v2/entryCollections.test.ts:23`, `social/[token]/posts/route.test.ts:47`, `work/regenerate-story/route.test.ts:36`, `product/strategy/route.test.ts:32`). Generation-contract/frozen-fixture tests assert shape **downstream of** aiClient, never its internals. Golden tests call the real fn but are **opt-in behind `CAPTURE=1`** + hit a live LLM → don't run in `test:run`.

**There are ZERO unit tests on `aiClient.ts` itself.** Both hardening items are pure functions over strings/errors → trivially testable. **The plan MUST add `src/lib/aiClient.test.ts`** covering: fenced/unfenced/array/prose-wrapped extraction, malformed JSON, and `isInfrastructureError` verdicts for a ZodError, `{status:429}`, and messages containing "500"/"length". **Without it, this hardening ships unverified.** (Contradicts the spec's claim that "existing generation-contract tests cover this".)

## §6. Credit gating pattern

### Canonical sequence — best route = `audience/work/regenerate-story/route.ts:73-236`
1. **`requireAICredits(req, UsageEventType.SECTION_REGEN, CREDIT_COSTS.SECTION_REGENERATION)`** (:78-86, `@/lib/middleware/planCheck`) — auth + pre-flight balance in one; `{allowed, userId, response}`; `!allowed` → return `creditCheck.response!`. **Does not charge.**
2. **Zod body validation** (:90-97) → `400 validation_error` via `createSecureResponse`.
3. **`assertProjectOwner(userId, tokenId, {action})`** (:113-124) — before any charge/cross-tenant read; skipped when `isMock` (`NEXT_PUBLIC_USE_MOCK_GPT==='true' || tokenId === DEMO_TOKEN`); `!access.ok` → `createSecureResponse({error: access.error}, access.status)`.
4. **Mock short-circuit** (:135-157) → `creditsUsed: 0`.
5. **AI + validation retry loop** (:168-207); exhausted → `500 generation_failed, recoverable:true` — **returns BEFORE step 6 ⇒ no charge**. This is exactly how failure skips the charge: the single `consumeCredits` sits after the last failure exit.
6. **`consumeCredits(userId, UsageEventType.SECTION_REGEN, CREDIT_COSTS.SECTION_REGENERATION, {endpoint, duration, sectionId, metadata})`** (:210-220, `@/lib/creditSystem`) — success only; failure is **warn-only** (:221-225), never fails the request.
7. Respond `creditsUsed` + `creditsRemaining: consumption.remaining`; handler wrapped in `withAIRateLimit`.

`consumeCredits` (`creditSystem.ts:352-433`) internally re-runs `checkCredits`→`deductCredits`→`logUsageEvent`; step 1 exists purely to fail **fast and free**. `checkCredits` (:138-164) has `DEV_BYPASS_CREDITS`. ⚠️ Load-bearing comment `creditSystem.ts:126-137`: **never add a credit gate to save/publish**.

**ID space (silent-poison risk):** `clerkId` (from `auth()`) goes into ledger rows; `internalUserId` (from `assertProjectOwner`) is the Project FK space. Swapping them silently poisons gating counts. `requireAICredits` returns the **Clerk id**; `assertProjectOwner` expects the Clerk id (`security.ts:71-74`).

**Atomic persist+ledger** (`social/[token]/posts:277-306`): `tx.usageEvent.create` called **directly**, never `logUsageEvent()` — the latter uses the module-level prisma client + swallows errors ⇒ cannot join a `$transaction`.

**Rail disagreement for the planner to resolve:** social gates credits *after* ownership; story's `requireAICredits` runs *before* `assertProjectOwner` (:79 vs :118).

### Current state of the 3 routes
- `regenerate-section` — **correct pattern** (:27 requireAICredits, :68 assertProjectOwner, :284 consumeCredits).
- `regenerate-element` — has credits (:12, :130) but **NO `assertProjectOwner`**.
- `regenerate-content` — imports only `parseAiResponse`, `generateMockResponse`, `logger`, `withAIRateLimit`; `POST = withAIRateLimit(regenerateContentHandler)` (:150). **No auth, no ownership, no credit check, no charge** (H3; matches deferred "Class B" note in memory `project_authz_token_fix`).

### Credit constants
`creditSystem.ts:7-26`: `SECTION_REGENERATION:2`, `ELEMENT_REGENERATION:1`, `FULL_PAGE_GENERATION:10`, `GENERATE_COPY:3`. Events (:29-57): `SECTION_REGEN`, `ELEMENT_REGEN`, `PAGE_GENERATION`. `deductCredits` increments per-op counters only for those four event types (:222-235).

**No cost constant exists for `regenerate-content`.** Nearest analogs: `FULL_PAGE_GENERATION:10` (semantically exact — it regenerates whole-page content) or `GENERATE_COPY:3` (modern per-audience copy-phase cost).
**Scout recommendation:** reuse `GENERATE_COPY:3` / `UsageEventType.GENERATE_COPY` rather than mint a new constant+event — precedent set explicitly by regenerate-story ("SAME cost/event as regenerate-section, NO new event", :10,77,209); a new `UsageEventType` is billing-adjacent surface siblings deliberately avoided.

> 🚩 **HUMAN GATE — planner must mark this.** Charging for `regenerate-content` is a **user-visible pricing change**: a currently-FREE endpoint starts costing credits. The spec mandates the gate (so *that* it is gated is settled), but the **cost value** is a founder decision, not an implementer's. Planner: mark as a human gate, default to `GENERATE_COPY:3`, and surface at the gate.

### `assertProjectOwner`
- `src/lib/security.ts:57-124` (def :57; docs :34-45; `ProjectOwnerResult` :47-55). Tested in `src/lib/security.test.ts`.
- `(clerkId: string|null|undefined, tokenId: string, opts: {action: string; claimIfOrphan?: boolean; allowMissing?: boolean}) => Promise<ProjectOwnerResult>` → `{ok:true, isDemo, adminOverride, userRecord, project} | {ok:false, status, error}`.
- Needs the **token** (`Token.value`, the `/edit/<token>` segment — queries `prisma.project.findUnique({where:{tokenId}})`), **not a projectId**, plus the Clerk id.
- ⚠️ Demo token `lessgodemomockdata` short-circuits `ok:true` for **any caller before any auth** (:63-65) — routes must gate mutations behind an explicit `isMock` check.
- For read-only regen (route returns content, client persists) use **neither** `claimIfOrphan` nor `allowMissing`; `regenerate-section:68` is the exact precedent.

**Target for `regenerate-content`:** clone regenerate-story steps 1→3→5→6 verbatim. Body schema must carry `tokenId` — **the current schema likely lacks it; verify.**

---

## §7. Orphan/deletion sweep (Q3)

**No `index.ts` barrel in `src/modules/prompt/`; no dynamic/string-based imports** → the static graph above is complete.

Other exports of the two files, all **0 external importers**, safe to drop: `buildStrategicCopyPrompt`, `validateGeneratedJSON`, `generateCardRequirementsReport`, `debugCardCountDetermination`, `applyManualPreferredDefaults`.

**Transitive orphans (same sweep, once the 2 store modules + 3 routes are re-pointed):**
- `parseStrategyResponse.ts` — only edge is a **type-only** `import type {ParsedStrategy}` at `buildPrompt.ts:15` → fully orphaned. (⚠️ `CLAUDE.md:73` documents `parseStrategyResponse()`/`applyCardCountConstraints()` as the live strategy parser — **the doc is stale**; audience routes use their own builders.)
- `mockResponseGenerator.ts` — imported by `regenerate-section:4` + `regenerate-content:5` only → orphaned iff both migrate. **KEEP the `mockResponseGenerator{Product,Service,Work}.ts` siblings** — live across audience routes, tests, `scripts/`.
- `buildPrompt.ts` also pulls `@/hooks/useOnboardingStore` + `@/hooks/useEditStore` (:29-30) — a prompt builder reaching into client stores, which is *why* the store modules can call it.

**Deletion is clean ONLY after** `contentActions.ts` + `regenerationActions.ts` are re-pointed (§0 P1). Then `buildPrompt.ts` + `parseAiResponse.ts` + `parseStrategyResponse.ts` + `mockResponseGenerator.ts` all go — **a larger win than the spec's ~4,200 lines**.

**Doc updates required by the deletion:** `src/modules/prompt/README.md:13-26`, `CLAUDE.md:73-74`, `docs/guides/copyQualityEval.md:17-18,102`.
