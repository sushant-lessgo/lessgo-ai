# regen-modernization — implementation audit

## Phase 1 — `aiClient.ts` hardening (H5 + M14) + first-ever unit tests

**Files changed**
- `src/lib/aiClient.ts` (modified)
- `src/lib/aiClient.test.ts` (new)
- `docs/task/regen-modernization.audit.md` (new — this file)

> Also shows as modified in `git status`: `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` — this is a **pure CRLF line-ending artifact** written by the vitest run (`git diff` reports zero content lines). Not authored by me, left untouched.

---

### `src/lib/aiClient.ts`

**H5 — extraction/parse (`generateRawJson` → `tryGenerate`)**
- Added `scanBalancedJson(source)`: scans for the FIRST complete brace/bracket-balanced JSON value, respecting string literals and escapes. Accepts a **top-level array** (fixes the known `src/modules/email/sequenceEngine.ts:188` gap). Replaces the greedy `/(\{[\s\S]*\})/` (old `:231`) that spanned first `{` → last `}` and mangled multi-object / prose-trailing responses.
- Added `extractJsonString(text)`: fence-first (```json → bare ``` → whole text), then balanced scan. If a fence exists but holds no braces, the fence body is returned as the candidate — this **preserves the old behavior** (old code fed fence content straight to `JSON.parse`), so fenced garbage still surfaces as `bad_json`, not `no_json`.
- `JSON.parse` is now wrapped in try/catch.
- Added exported `class AiParseError extends Error` with `kind: 'no_json' | 'bad_json' | 'schema'` + `cause`, and exported type `AiParseErrorKind`.
- **`'No JSON found in response'` preserved verbatim** (`trackTelemetry.ts:45` string-match). The `bad_json` message (`Malformed JSON in response: …`) deliberately retains the `JSON` marker so it still matches telemetry's `PARSE_SIGNATURE`.
- Throw-on-failure contract unchanged; no result union; `generateRawJson`/`generateWithSchema` signatures preserved (new arg is optional).

**M14 — `isInfrastructureError`**
- **Fast-exit `false` FIRST** for `ZodError` (via `instanceof` + `name` fallback, so cross-zod-instance errors are still caught), `AiParseError`, and `SyntaxError`. Content errors can never buy a paid backup call.
- `true` for structured signals: `status ∈ {429,500,502,503,504}`; `code ∈ {ECONNREFUSED, ECONNRESET, ETIMEDOUT, ENOTFOUND, EAI_AGAIN}`; and the new `AiTruncationError`.
- **Removed the `'500'` and `'length'` substring matches.** Kept a narrowed last-resort string matcher (`rate limit`, `timeout`/`timed out`, `network`, `econnrefused`, `etimedout`, `unavailable`).
- Note: a numeric `status` present ⇒ verdict is decided by the status list alone (a `status: 400` never falls through to the string matcher). Deliberate — an SDK error with an explicit status is authoritative.

**`callModelRaw` seam**
- Now returns `{ text, truncated }` instead of a bare string. `truncated` reads the **response object**: openai `choices[0].finish_reason === 'length'`, anthropic `stop_reason === 'max_tokens'`. Internal fn; no exported signature changed.
- Also takes `maxTokens = 8192` (default preserves current behavior).

**Step 3 — optional `opts`**
- `generateRawJson(endpoint, prompt, schema, opts?: { maxTokens?: number })` — backward-compatible; all ~20 existing callers unaffected (proven by the full suite staying green).

**Accepted asymmetry (documented in-code):** the stop/finish-reason seam is in `callModelRaw` only. `callModel` / `generateWithSchema` loses the `'length'`/`'max_tokens'` string match with no replacement ⇒ truncation on the structured path is now **non-recoverable**. Out of scope per plan (no regen caller uses that path); already in the plan's Deferred list.

---

### `src/lib/aiClient.test.ts` (new — 24 tests, zero existed before)

> **Phase-1 follow-up (post impl-review):** two test-only fixes, no impl change.
> - The top-level-array test was fenced, so it passed under the OLD greedy regex too (fence branch → `JSON.parse('[…]')` succeeds) and guarded nothing. Now split: an **unfenced** `[{"a":1},{"a":2}]` case (the real `sequenceEngine.ts:188` gap — old regex has no `[` branch, spans first `{`→last `}` ⇒ `{"a": 1}, {"a": 2}` ⇒ parse failure) plus the fenced case retained for coverage.
> - Added an **escaped-quote** case (`{"a": "say \"}\" ok"}` followed by a second object). Doubly discriminating: the old greedy regex spans both objects ⇒ parse failure; a scanner missing `scanBalancedJson`'s `escaped` branch (`aiClient.ts:341-343`) would end the string at the `\"` and close depth at the in-string `}` ⇒ returns `{"a": "say \"}` ⇒ parse failure.

- **Mocks BOTH `@/lib/openaiClient` and `@/lib/anthropicClient`** via `vi.hoisted` factories, so the suite runs on a keyless machine (`openaiClient` instantiates the SDK at module load). Mocks the SDK call fns only, never the module under test.
- Extraction: ```json fence, bare fence, unfenced, prose-wrapped, **top-level array**, **multi-object (greedy-match regression → takes the first)**, braces-inside-strings, no-JSON (asserts the exact `'No JSON found in response'` literal + `kind === 'no_json'`), malformed-in-fence (`kind === 'bad_json'`, tagged — not a bare `SyntaxError`), `opts.maxTokens` pass-through + 8192 default.
- `isInfrastructureError` asserted **through observable fallback behavior** (backup called / not called), which is what actually costs money: ZodError → no backup; zod `too_long` (message contains "length") → no backup; parse failure → no backup; message containing `maxLength: 500` → no backup; `{status:429}` → 1 backup; `{status:503}` → 1 backup; `{status:400}` → no backup; `ECONNREFUSED` → backup; plain timeout → backup; truncated-unparseable → backup; truncation with no backup → `AiTruncationError`; anthropic `stop_reason: 'max_tokens'` → `AiTruncationError`.

---

### Deviations from the plan

1. **`AiParseError` kind `'schema'` is reserved, never thrown.** The plan lists `kind: 'no_json' | 'bad_json' | 'schema'`, but wrapping the zod failure would (a) change the message shape telemetry keys on (a ZodError message is a JSON issues array starting with `[`) and (b) hide `.issues` from ~20 callers. Conservative choice: `schema.parse` still throws the raw `ZodError`; `isInfrastructureError` fast-exits `false` on it, so the M14 intent is fully met. Union member kept for the phase-2 primitive.
2. **Truncation tagging is scoped to parse failures only.** `AiTruncationError` is raised only when extraction/`JSON.parse` fails AND the provider hit the cap — a truncated-but-valid-JSON response, and a ZodError on a truncated response, are NOT converted to infra errors. Tighter than a blanket "truncated ⇒ infra", and keeps the "never more backup calls than before" spirit closer.
3. **Extra `status: 400` and braces-in-strings tests** beyond the plan's list (cheap, guard the two riskiest new branches).
4. **`isInfrastructureError` classifies 4 signals the plan did not authorize — the plan's invariant wording is what's wrong, not the code (orchestrator ruling: KEEP as-is).**
   - What was added beyond authorization: `src/lib/aiClient.ts:97-107` accepts `code ∈ {ECONNRESET, ENOTFOUND, EAI_AGAIN}` (plan authorized only `{ECONNREFUSED, ETIMEDOUT}`), and `:117` adds the `'timed out'` substring to the last-resort string matcher.
   - Old behavior for all four: **`false`** (no backup). The old `code` list contained `econnrefused` only, and the old string matcher had `'timeout'` — which does **not** match `'timed out'`. Notably OpenAI's `APIConnectionTimeoutError` carries the message `"Request timed out."`, so it never bought a backup before and now does.
   - Why it is correct: all four are genuine transport/infrastructure failures (connection reset, DNS lookup failure, DNS temporary failure, request timeout) where the model never produced content — a backup-provider retry is exactly the right response, and is indistinguishable in kind from `ECONNREFUSED`/`ETIMEDOUT` which the plan DID authorize.
   - Why the invariant is the defect: the plan states "strictly fewer backup calls, never a new one", but the plan itself already authorizes `ETIMEDOUT` (old `code` list had only `econnrefused` ⇒ new backup path) and the truncation→backup path (deviation 3 / "For the impl-reviewer" item 3 ⇒ new backup path). The invariant was never achievable as written. The **real** intent it was protecting — *content* failures (zod/parse/truncation-as-syntax-error) must never buy a paid backup — is fully honored via the fast-exit `false` block. Correct classification, mis-stated invariant; no code change.

### Follow-up notes (phase 6 / out of scope — NOT fixed here)

- `src/modules/email/sequenceEngine.ts:186-190` — the comment still claims a bare top-level array "would not match"; that is now **false** (`scanBalancedJson` handles unfenced arrays). Its `{ emails: [...] }` wrapper workaround is therefore unnecessary and can be dropped with the comment.
- `src/utils/trackTelemetry.ts:44-46` — cites `aiClient.ts` "L234" and "native JSON.parse SyntaxErrors"; both stale (line moved, `JSON.parse` is now wrapped in `AiParseError`).
- **Telemetry drift (cosmetic):** `AiTruncationError`'s message (`Model X response truncated (max_tokens) and did not parse`) does NOT match telemetry's `PARSE_SIGNATURE` (`/no json found|json|unexpected token/i`), so truncation failures are no longer classified as parse failures — previously they surfaced as `SyntaxError: Unexpected end of JSON input`, which matched. Only reachable when there is no backup model or the backup also fails.

### Green gate (run in WORKDIR)

- `npx tsc --noEmit` → **one pre-existing, unrelated error**:
  `src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg'`
  Cause: this worktree has never been built, so `next-env.d.ts` and `.next/types` don't exist ⇒ no image-module declarations. The asset file exists; `src/app/page.tsx` is untouched and clean in `git status`. Not caused by this phase. **Zero errors in `src/lib/aiClient.ts` / `aiClient.test.ts`.**
- `npm run test:run` → **210 passed | 1 skipped (211 files); 3568 passed | 18 skipped (3586 tests)**. All ~20 mocked-out callers unaffected ⇒ signature preservation proven.

### For the impl-reviewer / founder `CAPTURE=1` gate to scrutinize

1. **The balanced scanner is the real behavior change** under the app's entire AI spend surface. Highest-value real-output check: a model that emits a preamble object (e.g. a "plan" object) before the actual payload now yields the **FIRST** object, where the greedy regex yielded first-`{`→last-`}` (usually a throw). If any real prompt relies on the old span, the capture will show it.
2. **The fence-with-no-braces fallback** in `extractJsonString` — preserves legacy behavior; confirm no real response takes that path unexpectedly.
3. **Truncation → backup is a NEW backup path on the raw route** (previously a truncated response died as an unmatched `SyntaxError`). Watch for unexpected backup-model calls in the capture logs.
4. `AiTruncationError` / `AiParseError` are new exported classes — phase 2's retry loop should key on `AiParseError` rather than message strings.
5. `trackTelemetry.ts` was NOT touched; the `PARSE_SIGNATURE` regex still matches both new messages by construction, but it is asserted only indirectly (message-content assertions in the new suite).

---

## Phase 2 — scoped-generation primitive

**Files changed**
- `src/modules/generation/scopedRegen.ts` (new)
- `src/modules/generation/scopedRegen.test.ts` (new — 32 tests)
- `src/modules/generation/README.md` (modified — module inventory entry)
- `docs/task/regen-modernization.audit.md` (this section)

> NOT touched (plan listed them as *optional* seam edits): `src/modules/audience/{product,service,work}/copyPrompt.ts`. **No seam was needed** — all three builders already narrow by `uiblocks` / `strategy.sections` / `page.sections` (the story route's identity-map trick), so a size-1 map is expressible through the EXISTING exported signatures. Conservative: zero edits to live first-gen prompt builders.
> Also modified in `git status`: `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` — the same CRLF-only artifact phase 1 recorded; not authored here.

### `src/modules/generation/scopedRegen.ts`

Exports (actual shapes):
- `resolveCopyEngine(project | null): { engine: 'product'|'service'|'work'; endpoint: 'copy'|'work-copy' }` — **D1b matrix, single-sourced**: `isWorkCopyTemplate(templateId)` FIRST (atelier ⇒ `work`, regardless of its `audienceType: 'service'`), then `audienceType` `'product'`/`'service'`; everything else (writer/ecommerce/unknown/null) → `UnsupportedProjectError`. Endpoint per D5 via `endpointForEngine` — **no `modelConfig.ts` edit**.
- `resolveMockEngine(project | null): CopyEngine` — wraps the above in try/catch; null/unsupported → `'product'`. Never throws.
- `narrowElementsMap(input, scope): ElementsMap` — `input = { onboarding, sections, sectionLayouts }` (the exact assembled shape `regenerationActions.ts:102-105` already passes; `meta.onboardingData` is re-supplied because the `PageStore` TYPE declares it, though it is never read). `'all'` → full map; `'section'`/`'element'` → size-1 layout view → `getCompleteElementsMap` → filter. Element scope rewrites `mandatory/optional/all` to the single key.
- `readOnboardingView(project)` — `project.content.onboarding`, always the onboarding source (D4).
- `validateScopedSubset(response, map): string | null` — every narrowed section present + every mandatory element non-empty; the reason string is what gets folded into the retry prompt. Dotted (`items.title`) requirements are checked at the COLLECTION level only.
- `generateScopedCopy({ project, layoutState, scope, currentContent?, userGuidance?, variationCount?, maxTokens? }) → { engine, endpoint, attempts, elementsMap, sections?, variations? }`.
- Errors: `UnsupportedProjectError` (`code: 'unsupported_project'` → 422), `ScopeInputError` (`'invalid_scope'` → 422), `ScopedGenerationError` (`'generation_failed'`, carries `attempts` → 500 recoverable). Plus `MAX_RETRIES = 2`, `ElementVariationsSchema`.

Flow: dispatch → narrow → engine builder prompt + a `## REGENERATION CONTEXT` block (scope label + current copy + userGuidance) → `generateRawJson(endpoint, prompt, schema, opts?)` → validate → on failure re-prompt via the engine's OWN `build*CopyRetryPrompt(prompt, error, '')` → at most `MAX_RETRIES + 1` attempts → throw. Element scope = the SAME path, with an appended `## OVERRIDE — OUTPUT FORMAT` block and `z.object({ variations: z.array(z.string()).min(1) })` (a z.object, not a z.record ⇒ parses through the same client, per R4). AI throws and content rejections are treated identically (both retry) — `generateRawJson` already refuses to buy a backup call on content errors (phase 1).

### Deviations from the plan (and why)

1. **The three copy-prompt builders were NOT touched** (plan step 2 made the seam conditional). Narrowing rides `uiblocks` + the section list, which are already parameters. Less blast radius on live first-gen paths.
2. **The strategy phase is NOT persisted anywhere — so scoped prompts derive builder inputs from persisted state only.** `Project` has `content` / `brief` / `aiBaseline` but no strategy blob (grep-verified; `saveDraft` writes only `content.onboarding` + `finalContent` + `brief`). The plan assumed "persisted business context" would feed the builder; the strategic half (`oneReader`/`oneIdea`/`oneClient`/`ourPosition`/`positioningAngle`/`storyAngle`) does not exist at regen time. Conservative choice: map every builder field from persisted data (`content.onboarding.validatedFields` / `hiddenInferredFields` / `featuresFromAI`, `project.title`, `project.inputText`, `brief.businessType`, `brief.facts.work`), and leave strategy fields the model would otherwise get as EMPTY strings / neutral "keep the existing angle" text rather than fabricating a persona/promise. Nothing is invented; the prompt is honestly thinner than first-gen's. **This is the single biggest thing for the impl-reviewer + the phase-3 pilot gate to judge** (it is plan risk #1, now concrete). If the pilot shows regressions, the fix is to persist the strategy at first-gen — a NEW scope, not a phase-2 patch.
3. **Work-engine facts are mandatory:** `brief.facts.work` missing/invalid → `ScopeInputError` (route → 422 validation, no charge) rather than a silent degraded prompt. `positioningAngle`/`storyAngle` are neutral "keep the existing angle, sharpen wording" directives; `storyBranch`/`primaryLanguage` come from facts (same derivation the story route uses, incl. `derivePricePosition` + `selectWorkVoice`).
4. **`sectionTypeKey()` splits `hero-abc12345` → `hero`** (the builders and model responses are keyed by section TYPE; the elements map is keyed by section ID). `validateScopedSubset` accepts EITHER key. Deliberate, because editor sections carry uuid suffixes while first-gen uiblocks do not.
5. **Extra exports `validateScopedSubset` + `readOnboardingView`** beyond the plan's list — needed by the phase 3–5 routes and directly testable.

### Work-engine vocabulary — the real behavior (supersedes the original "Known gap")

**The original "Known gap" section was wrong in both directions and is retracted.** It claimed atelier element scope 422s while "section/'all' scope is unaffected". The truth, proven by the reviewer's probe on the real atelier path:

- Atelier `about`/`contact`/`hero` **did** resolve to layout element lists — the WRONG ones. The work prompt is built from `workElementContract` (`buildWorkCopyPrompt` walks `workElementContract[section]`), so it asked for `about: { heading, bio }` while the layout-derived map demanded `headline`/`body` (and `contact: heading + contact_method` vs `headline`). Result: **100% validation failure**, `ScopedGenerationError` after 3 real paid `work-copy` calls per request.
- Atelier `work`/`services` layouts resolved to an **empty** element list ⇒ `validateScopedSubset` passed **vacuously** on `{ elements: {} }` — the opposite failure, and a spec violation ("never default-fill / filler-copy failure mode gone").
- Element scope named keys from a vocabulary the work prompt never defines.
- The engine post-processing the story route runs BEFORE validating (`parseWorkCopy` → defaults + verbatim praise + collection ids) was skipped, so regen was both stricter than first-gen and silently dropped the seller's praise.

**Post-fix behavior:** engine `'work'` narrows and validates against `workElementContract` (via `resolveWorkSchema`), and runs `parseWorkCopy(raw, uiblocks, facts.praise)` → `validateScopedSubset` → (if the scope covers `about`) `validateStoryAbout` — the story route's order. Atelier `about`, `contact`, `work`, `proof`, `packages`, `hero`, `footer`, … all resolve to their contract floors; `work` now requires `heading` + `groups`; `proof` never demands the system-injected `quotes`; element scope accepts contract keys (`bio`) and rejects layout keys (`body`). A section with no work contract entry → `ScopeInputError` (422, no charge). Product/service are **unchanged** (their prompts ARE layout-schema-built; the reviewer verified every mandatory key of `TerminalHero`/`HairlineFeatureGrid`/`HairlineFooter` appears in the built prompt).

### Tests — `src/modules/generation/scopedRegen.test.ts` (32)

- `vi.mock('@/lib/aiClient')` (hoisted) ⇒ `@/lib/openaiClient` is never imported ⇒ suite runs keyless.
- **Dispatch matrix**: atelier(+`audienceType: 'service'`) → `work`/`work-copy` (**the named regression — fails if dispatch is re-keyed on audienceType**); work template beats any audienceType; product → `product`/`copy`; service → `service`/`copy`; writer/ecommerce/unknown/null → `UnsupportedProjectError`; non-work never yields `work-copy` (D5).
- `resolveMockEngine`: null/writer/ecommerce/`{}` → `'product'`, never throws; atelier → `'work'`.
- Narrowing: `'all'` keeps all 3 sections; section keeps 1 (with >1 element); element keeps 1 section + exactly 1 element; unknown section / missing layout / unknown element / empty page → `ScopeInputError`.
- `validateScopedSubset`: accepts a 1-section subset; rejects a missing section; rejects a whitespace-only mandatory element.
- `generateScopedCopy`: section success (1 call, endpoint `'copy'`); `'all'` validates every section (missing footer ⇒ retry); **atelier → work engine + `work-copy` endpoint asserted on the actual `generateRawJson` call**; unsupported project → throws with **zero** AI calls; retry folds the reason into the prompt (asserts the retry prompt CONTAINS the failing element name + `PREVIOUS ATTEMPT FAILED` and differs from attempt 1); exhaustion → exactly `MAX_RETRIES + 1 = 3` calls + `ScopedGenerationError`; element scope → `variationCount` variations, `maxTokens` passed through, prompt carries the element key + current content, and the passed schema accepts `{variations}` but REJECTS a copy record (proves the tight schema, not the loose one); empty variations → retried; `userGuidance` reaches the prompt; bad scope → `ScopeInputError` with zero AI calls.
- Mandatory-element fixtures are derived from the real map at test time (schema-drift proof), not hard-coded.

### Green gate (actual output, run in WORKDIR)

- `npx tsc --noEmit` → **only** the known pre-existing `src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg'`. Zero errors in the new files.
- `npm run test:run` → **Test Files 211 passed | 1 skipped (212); Tests 3604 passed | 18 skipped (3622)**. No route touched, so the rest of the tree is green trivially (baseline per the task brief was 3570/18; +34 vs the 32 new tests — a 2-test baseline drift, not new failures: zero suites fail).

---

## Phase 2 — fix round (impl-review `fix first`: 2 blockers)

**Files changed**
- `src/modules/generation/scopedRegen.ts` (modified)
- `src/modules/generation/scopedRegen.test.ts` (modified — now 44 tests)
- `src/modules/generation/README.md` (modified — vocabulary pitfall + drift-risk notes)
- `docs/task/regen-modernization.audit.md` (this section; the phase-2 "Known gap" section retracted/rewritten above)

### Blocker 1 — engine-aware narrowing + validation (the atelier path)

Root cause accepted as diagnosed: the work engine's **prompt vocabulary** (`workElementContract`) and the phase-2 **validation vocabulary** (`layoutElementSchema`) were different contracts. Fix, per the reviewer's prescription:

- `narrowElementsMap(input, scope, engine: CopyEngine = 'product')` — new third argument. `engine === 'work'` → `narrowWorkContractMap`, which builds `SectionElementRequirements` from `resolveWorkSchema(sectionType)`: non-system elements split by `requirement`, collections folded in at COLLECTION level (matching `validateScopedSubset`'s dotted-key rule), `quotes` excluded (system-injected — the prompt explicitly tells the model not to write it), and `layout = sectionType` so `uiblocksFromMap` yields the contract IDENTITY map that both `buildWorkCopyPrompt` and `parseWorkCopy` consume. Product/service fall through to the untouched layout-derived path.
- `generateScopedCopy` passes `engine` into narrowing, and for work runs `parseWorkCopy(response, uiblocks, facts.praise)` **before** `validateScopedSubset` (the story route's order), then `validateStoryAbout` when the scope covers `about` (the extra ship-grade `bio` floor, shared with the story route). Work facts are resolved once up front via a new `requireWorkFacts()` (still `ScopeInputError` → 422 before any AI call — deviation 2 kept).
- `oneIdea.bigBenefit` no longer re-labels `project.inputText` (already passed as `oneLiner`); it is now `''` like the other unavailable strategy fields. Nothing else in the "no strategy persisted" deviation was changed — that stays a phase-3 founder call.

Untouched as instructed: `resolveCopyEngine` dispatch, `resolveMockEngine` leniency, `modelConfig.ts` (still no edit), the R3 retry-loop shape, product/service narrowing+validation.

### Blocker 2 — test discrimination re-audit

The old atelier test built its mock from `narrowElementsMap(...)`'s own output, so it asserted the implementation against itself and passed while the real path 500s. Deleted. **Every test group re-audited by literally reverting the behavior and running the suite** (probes run, then reverted back):

| Group | Would it fail on revert? | Evidence |
|---|---|---|
| Atelier pipeline (5 new tests: contract-shaped `about` accepted in 1 call; `contact` layout-vocabulary rejected; `contact` contract keys accepted; `work` empty-elements rejected at 3 calls; `work` heading+groups accepted) | **YES — proven** | Reverted the `engine` arg in `generateScopedCopy` → **5 failed | 39 passed**. Mocks are hand-written from `workElementContract` (`{about:{elements:{heading,bio}}}`), never derived from the implementation. |
| `parseWorkCopy`-before-validate | **YES — proven** | Disabled just the work post-processing branch → **2 failed** (`work` heading+groups: system `groups[].id` backfill missing; praise-injection test: verbatim praise absent). |
| `narrowElementsMap` work-contract group (6 new tests: about=heading/bio and NOT headline; contact=heading/contact_method; work=heading/groups; proof excludes `quotes`; element scope accepts `bio`/rejects `body`; non-work section → `ScopeInputError`) | **YES** | Asserts contract keys by NAME against the layout keys by name; the layout path yields `headline`/`body`/empty ⇒ every assertion inverts. |
| Atelier missing `brief.facts.work` → `ScopeInputError`, 0 AI calls | **YES** | Removing the `requireWorkFacts` guard lets the call through ⇒ `not.toHaveBeenCalled()` fails. |
| `resolveCopyEngine` matrix (kept as-is) | **YES** (reviewer-verified) | Re-keying dispatch on `audienceType` fails the atelier cell. |
| Product/service pipeline + retry/exhaustion/element-scope groups (kept as-is) | **YES** | Each asserts an observable the behavior owns (call count, endpoint, retry-prompt content, tight-schema accept/reject). Fixtures derive from the real layout map, which IS the vocabulary the product prompt is built from — reviewer-verified aligned. |

### Also fixed
- README: new **vocabulary pitfall** note (engine ⇒ vocabulary; adding an engine means deciding it) and an explicit **drift-risk** note — this primitive is a *parallel reimplementation* of `regenerate-story`'s loop, not a re-point; the story route keeps its own MAX_RETRIES/prompt/validate call. Same warning condensed into the `scopedRegen.ts` header invariants.

### Deviations (fix round)
1. **`validateStoryAbout` is used as an ADDITIONAL gate, not the primary one.** It is `about`-only; the contract-derived `validateScopedSubset` generalizes to every work section (and is a superset of its presence checks). Running both keeps the story route's `bio`-length floor without a second validation vocabulary. Only applied when the scope covers `about` (matched on section TYPE, so `about-abc12345` counts).
2. `narrowElementsMap`'s `engine` parameter defaults to `'product'` (layout path) so existing call sites/tests keep their exact behavior; `generateScopedCopy` always passes the resolved engine explicitly.

### Green gate (actual output, run in WORKDIR)
- `npx tsc --noEmit` → `src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg' or its corresponding type declarations.` — that line only; nothing else.
- `npm run test:run` → **Test Files 211 passed | 1 skipped (212); Tests 3616 passed | 18 skipped (3634)** (baseline 3604 + 12 net new atelier/work-contract tests; zero failures).

### Open risks
- The work path's correctness now rests on `workElementContract` being what `buildWorkCopyPrompt` walks. Both are pinned by the new narrowing tests **by key name**, so contract drift surfaces as a test failure rather than a paid 500.
- Still unverified against a REAL LLM (mocked `generateRawJson` throughout) — atelier regen quality remains a phase-3 pilot-gate question, as does the unpersisted-strategy deviation.
- The story-route drift risk is documented, not eliminated.

### For the impl-reviewer to scrutinize

1. **Deviation 2 (no persisted strategy)** — the prompt-parity question the pilot gate must answer. Is "derive-from-persisted-only + neutral strategy fields" acceptable, or should phase 3 be blocked on persisting the strategy at first-gen?
2. `sectionTypeKey` (`hero-abc12345` → `hero`) — confirm against the real editor `sectionLayouts` keys the phase-3/4 routes will send.
3. The element-scope OVERRIDE block appends to a full-page-format prompt (it tells the model to ignore the earlier output format). Real-LLM behavior is the pilot's job; a mis-followed override surfaces as an `AiParseError` → retry → 500 recoverable, never filler copy.
4. The work-engine synthetic `page: { archetypeKey: 'regen', pathSlug: '/', isHome: true }` — `buildWorkCopyPrompt` reads only `page.sections`/`title`/`isHome`/`pathSlug`, but multi-page nuance (which page a section belongs to) is lost for atelier regen.
5. `ScopeInputError` vs `UnsupportedProjectError` are BOTH 422 but semantically different (`invalid_scope` vs `unsupported_project`) — phases 3–5 must map both, or a work-facts gap will read as a 500.

---

## Phase 3 — rebuild `regenerate-element` (PILOT)

**Files changed**
- `src/app/api/regenerate-element/route.ts` (rewritten)
- `src/app/api/regenerate-element/route.test.ts` (new — 18 tests)
- `src/lib/security.test.ts` (modified — +3 tests appended; **the file already existed**, see Deviation 1)
- `docs/task/regen-modernization.audit.md` (this section)

> NOT touched: `src/modules/generation/scopedRegen.ts` — the plan listed it as *conditional* ("only if the pilot surfaces a primitive gap"). **No gap surfaced.** The primitive's element scope, its `ScopeInputError`/`UnsupportedProjectError`/`ScopedGenerationError` taxonomy, and its `maxTokens` seam covered the route with zero changes.
> Also modified in `git status`: `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` — the same **CRLF-only** vitest artifact phases 1 and 2 recorded (`git diff` reports zero content lines). Not authored here. And `e2e/fixtures/generated/` shows untracked — that is the founder's gate-1 `CAPTURE=1` output (gitignored, `.gitignore:89`), not mine.

### The canonical sequence, exactly as implemented

Verbatim from `route.ts` (phases 4–5 reuse this order; the numbered comments are in the file):

1. `requireAICredits(req, UsageEventType.ELEMENT_REGEN, CREDIT_COSTS.ELEMENT_REGENERATION)` — check only, never charges.
2. `tokenId` read from the **QUERY string** (`?tokenId=…`, caller contract `aiActions.ts:543`) + Zod body validation (`{sectionId, elementKey, currentContent, variationCount default 5}`). Missing tokenId or bad body → 400.
3. `isMock = NEXT_PUBLIC_USE_MOCK_GPT === 'true' || tokenId === DEMO_TOKEN`; **`if (!isMock)` → `assertProjectOwner(userId, tokenId, { action: 'regenerate-element' })`** — NEW on this route; no `claimIfOrphan`/`allowMissing`.
4. **Project load wrapped in `if (tokenId !== DEMO_TOKEN)`** → `prisma.project.findUnique({ select: { id, audienceType, templateId, content, brief, title, inputText } })`; `if (!project && !isMock)` → **404**, no charge. Demo → no fetch, `project = null`.
5. **Mock short-circuit BEFORE engine dispatch** → `resolveMockEngine(project)` + mock variations, `creditsUsed: 0`, `meta.mock: true`.
6. `resolveCopyEngine(project)` — real path only. `UnsupportedProjectError` → **422 `unsupported_project`**, no AI call, no charge.
7. `generateScopedCopy({ scope: {kind:'element', sectionId, elementKey}, layoutState: readPersistedLayoutState(project.content), currentContent, variationCount, maxTokens: 2048 })`. `ScopeInputError` → **422 `invalid_scope`** + honest message; `ScopedGenerationError` → **500 `generation_failed`, `recoverable: true`** — both return BEFORE the charge.
8. `consumeCredits(userId, ELEMENT_REGEN, 1, …)` — success only; `!consumption.success` is `logger.warn` only.
9. Respond `{ variations, originalContent, elementKey, sectionId, creditsUsed, creditsRemaining, meta }` via `createSecureResponse`; handler wrapped in `withAIRateLimit`.

**ID-space:** `requireAICredits` → Clerk id → `assertProjectOwner` (expects Clerk id) → `consumeCredits` (same id, as the legacy route did). No internal-id crossover; pinned by a test asserting the exact `assertProjectOwner` args.

**Removed (M16 slice):** the route's private `callAIProvider` copy, the hardcoded `gpt-3.5-turbo`/`Mixtral-8x7B` strings, the raw `fetch` to OpenAI/Nebius, the inline generic variations prompt (old `:70-81`), the line-splitting parse fallback, and BOTH filler-copy exits (old `:93-104` provider-failure and `:147-167` catch-all). This route imported no legacy `buildPrompt`/`parseAiResponse` modules, so there was nothing legacy to strip for the phase-6 sweep.

### New helper: `readPersistedLayoutState(content)` (module-local to the route — see the phase-4 addendum; it was briefly `export`ed, which is illegal in an App Router route module)

D4 says element scope reads the section's layout from PERSISTED state (the element caller sends no layout). The persisted `content.finalContent` is an `export()` payload, and its layout state lives in **four** places — so the helper merges all of them: the body-only home slice (top-level `sections`/`sectionLayouts`), the legacy `layout.*` nesting (`persistenceActions.ts:113-114` accepts both), every entry of the multi-page `pages` map, and the **shared `chrome` header/footer entries** — which carry `{id, layout}` and live OUTSIDE `sections` (`pageHelpers.ts:47-68`). Missing them would have made header/footer element regen a spurious 422. Legacy projects whose `content` IS the page data (no `finalContent` key) fall back to `content` itself, mirroring `loadDraft/route.ts:120-125`.

### Deviations from the plan (and why)

1. **🚩 `src/lib/security.test.ts` ALREADY EXISTED — the plan's D6 premise is FALSE.** The plan says (twice: D6 + phase-3 step 4) "no `*.test.ts` exists anywhere in `src/lib/` today" and instructs me to CREATE the file. It is tracked, and has been since commit `1baeb6ed` ("Fix token-only edit bypass"), with 10 tests already covering owner / non-owner / admin override / orphan claim / missing / 401 / demo. **Conservative choice: I did NOT rewrite it** (that would delete a live A01 regression suite to re-derive it). I appended a 3-test `describe('assertProjectOwner — regen routes (isMock pairing)')` block covering only the genuine D6 gap:
   - the existing demo test passes an **authenticated** `clerkId`, so it does not pin the actual residual — that the demo token yields `ok: true` **for a caller with no identity at all**, before any read. That property is exactly why routes must pair `ok` with their own `isMock`; it is now asserted.
   - the regen action's ownership matrix + "regen never claims and never creates" (no `claimIfOrphan`/`allowMissing` ⇒ missing project is a 404).
2. **Mock variations are generated locally, NOT by a `mockResponseGenerator{Product,Service,Work}` sibling** (plan step 5 said pick the generator via `resolveMockEngine`). The siblings emit whole-page `SectionCopy` records and require strategy / work-facts inputs; the demo token has `project === null`, so there is no honest source for them — driving them would mean fabricating a strategy just to mock five variations of one string. `resolveMockEngine(project)` **is** still called (it is the seam the sequence test guards) and its verdict is returned as `meta.engine`; only the string generator is local, preserving the legacy mock output shape byte-for-byte. Phases 4–5 regenerate whole sections and CAN use the siblings — this deviation does not transfer to them.
3. **404 is conditioned on `!isMock`, not on `!project` alone.** The plan says "non-mock + no row → 404". With the env mock flag ON and an unknown token, a 404 would contradict "mock mode never fails". Implemented as `if (!project && !isMock) → 404`, so: real path + unknown token → 404 (tested); demo → never fetched; env-mock + unknown → mock output.
4. **`ELEMENT_MAX_TOKENS = 2048`** (the plan only said "element regen shouldn't pay for 8k", no number). 2048 comfortably covers 5 variations of even a long bio; the 8192 default is preserved for every other caller.
5. **Responses go through `createSecureResponse`** (the story route's pattern: no-store + security headers) rather than the legacy route's bare `NextResponse.json`. The caller reads `response.ok` + `result.variations`, both unaffected.

### Tests — per-group MUTATION results (every probe run, then reverted)

`route.test.ts` mocks only module boundaries (planCheck / creditSystem / rateLimit / security / prisma / **aiClient**). **The phase-2 primitive runs FOR REAL**, so the suite pins the route→primitive wiring, not a fake of it. Mocks are hand-written from contracts: the AI mock returns `{ variations: [...] }` because `ElementVariationsSchema` declares that shape; `elementKey: 'headline'` is read by hand from `product/elementSchema.ts:83` (a REQUIRED TerminalHero element); the project fixture's `content.finalContent` is the shape `saveDraft` actually stores.

| # | Mutation (behavior reverted) | Result | Group proven discriminating |
|---|---|---|---|
| M1 | `if (!isMock)` → `if (true)` around `assertProjectOwner` | **2 failed** | demo-token + env-mock sequence tests |
| M2 | `if (tokenId !== DEMO_TOKEN)` → `if (true)` around the project fetch | **1 failed** | demo-token "NO project fetch" |
| M3 | `if (!project && !isMock)` → `if (false)` (404 branch removed) | **1 failed** | unknown-token → 404 |
| M4 | **`resolveCopyEngine(project)` inserted BEFORE the mock short-circuit** (the D2 sequence-order regression) | **4 failed** | the whole sequence group — demo 200 becomes a throw |
| M5 | `if (err instanceof UnsupportedProjectError)` → `if (false)` (422 mapping dropped) | **2 failed** | writer + ecommerce → 422 |
| M6 | `if (err instanceof ScopeInputError)` → `if (false)` (the 2nd 422 code) | **2 failed** | unknown-section + unknown-element honesty |
| M7 | `consumeCredits` inserted before the generation-failure exit | **1 failed** | "generation failure → NO charge" |
| M8 | `variations: result.variations ?? []` → `variations: []` | **3 failed** | caller-contract group |
| M9 | `security.ts:63` demo short-circuit narrowed to `&& clerkId` | **1 failed** (12 passed) | the NEW unauth-demo test — and note the 10 pre-existing tests ALL still passed, which is precisely the gap deviation 1 describes |

M5 and M6 are the two separate 422 codes the phase-2 carry-forward warned about; both are mapped and both are independently pinned.

### Green gate (actual output, run in WORKDIR)

- `npx tsc --noEmit` → **one line only**:
  `src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg' or its corresponding type declarations.`
  The known pre-existing worktree-never-built error. Zero errors in any phase-3 file.
- `npm run test:run` → **Test Files 212 passed | 1 skipped (213); Tests 3637 passed | 18 skipped (3655)**. Baseline was 3616/18 → +21 = 18 new route tests + 3 new security tests. Zero failures.

### 🚩 FOR THE FOUNDER — pilot gate (real-LLM element regen vs current)

1. **The honest 422 message does NOT reach the user — and never could with the current caller.** The route returns `{error, message, detail}`, but `aiActions.ts:556-558` is ``if (!response.ok) throw new Error(`API error: ${response.status}`)`` — **the body is discarded**. So the "this element isn't AI-written" / "AI copy isn't available for this kind of project" text the plan asked for is produced and logged server-side, but the editor shows only `API error: 422`. **Confirmed as asked: it is NOT a silent spinner** — the catch at `:591-598` sets `isGenerating=false` and pushes the message into `aiGeneration.errors`. Making the message visible needs a ~3-line change in `aiActions.ts` (read `errorData.error`/`errorData.message` before throwing) — that file is **outside phase 3's Files-touched**, so I did not touch it. Recommend folding it into phase 4 or 5, where the same 422s become far more likely (atelier's `quote` band).
2. **Failures are now visible, by design.** Old behavior: an AI failure returned **200 + fabricated** `"<your copy> - Enhanced version"` variations. New: 500 → an error in the editor. If the founder sees element-regen errors during the pilot that they "never saw before", that is the filler-copy criterion working, not a regression — the errors were always happening, silently, dressed as copy.
3. **The prompt-thinness question (phase-2 deviation 2) is what the pilot must actually judge.** Element regen builds the full product/service copy prompt with **empty strategy fields** (`bigBenefit`/`uniqueMechanism`/`reasonToBelieve` = `''`) because no strategy is persisted. Per the plan's amended gate rule, element scope's status quo (a generic "vary this string" prompt with no business context at all) is strictly worse, so **this pilot cannot surface the strategy gap** — it will look green. The three options (persist strategy at first-gen / re-run strategy at regen / amend the acceptance criterion) still need a decision before phase 4.
4. **`aiActions.ts:451` `regenerateElement` is a STUB that never calls this route** (a `setTimeout(1500)` that only stamps `aiMetadata`). The live caller is `regenerateElementWithVariations` (`:493`, default 5 variations). If pilot QA "regenerates an element" through a UI path wired to the stub, it will pass without touching the new code — make sure QA drives the **variations** flow (the picker showing current + 5 alternatives).
5. **Cost per failed request is now up to 3 paid `copy` calls** (MAX_RETRIES=2) charged to nobody — charge-on-success means a hard-failing element burns real OpenAI spend at 0 credits. Intended (never charge for filler), but worth knowing.
6. Element regen rides the **`copy` endpoint** (product/service) / **`work-copy`** (atelier) — the same model tier as first-gen (D5), at 1 credit.

---

## Phase 4 — rebuild `regenerate-section` (ENGINE SWAP)

**Files changed**
- `src/app/api/regenerate-section/route.ts` (rewritten)
- `src/app/api/regenerate-section/route.test.ts` (new — 19 tests)
- `src/hooks/editStore/aiActions.ts` (modified — the owed ~3-line honest-error fix, at TWO call sites)
- `src/hooks/editStore/aiActionsErrorSurfacing.test.ts` (new — 4 tests; see Deviation 3)
- `docs/task/regen-modernization.audit.md` (this section)

> NOT touched: `src/modules/generation/scopedRegen.ts` — no primitive gap surfaced. Section scope, both 422 taxonomies and the work-contract narrowing covered the route with zero changes.
> Also modified in `git status`: `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` — the same CRLF-only vitest artifact phases 1–3 recorded. Not authored here. `e2e/fixtures/generated/` untracked = the founder's gate-1 `CAPTURE=1` output (gitignored).

### The canonical sequence, exactly as implemented (phase 3's order, verbatim)

1. `requireAICredits(req, UsageEventType.SECTION_REGEN, CREDIT_COSTS.SECTION_REGENERATION /* 2 */)` — check only.
2. Zod body validation — **`tokenId` stays in the BODY** (caller D contract): `{sectionId, tokenId, userGuidance?, currentContent?, sectionType?, layout?}`. Legacy's hand-rolled `if (!sectionId || !tokenId)` became a real schema; still a 400.
3. `isMock = NEXT_PUBLIC_USE_MOCK_GPT === 'true' || tokenId === DEMO_TOKEN`; `if (!isMock)` → `assertProjectOwner(userId, tokenId, { action: 'regenerate-section' })` (this route already had it — kept unchanged).
4. **Project load** wrapped in `if (tokenId !== DEMO_TOKEN)` (the precedent this route itself set) → `findUnique({ select: { id, audienceType, templateId, content, brief, title, inputText } })`; **`templateId` + `brief` added** (engine dispatch + work facts). `if (!project && !isMock)` → **404**. This REPLACES legacy's "swallow the DB error and prompt without context" leniency — legacy's `try/catch` around the fetch is gone too, so a DB failure is now a 500 rather than a silently context-free paid call.
5. **Mock short-circuit BEFORE engine dispatch** → `resolveMockEngine(project)` + local mock content, `creditsUsed: 0`, `isMock: true`, `meta.engine`.
6. `resolveCopyEngine(project)` — real path only. `UnsupportedProjectError` → **422 `unsupported_project`**, no AI call, no charge.
7. `generateScopedCopy({ scope: {kind:'section', sectionId}, layoutState: {sections:[sectionId], sectionLayouts:{[sectionId]: layout}} /* D4: from the REQUEST */, currentContent: JSON.stringify(currentContent), userGuidance })`. `ScopeInputError` → **422 `invalid_scope`** + honest message; `ScopedGenerationError` → **500 `generation_failed`, recoverable** — both BEFORE the charge.
8. `consumeCredits(userId, SECTION_REGEN, 2, …)` — success only; failure `logger.warn` only.
9. Respond `{ content, sectionId, originalContent, regenerationType:'section', aiMetadata?, creditsUsed, creditsRemaining, meta }` via `createSecureResponse`; `withAIRateLimit`.

**Engine/AI internals removed (M16 slice + the phase-6 unblock):** `buildSectionPrompt` (`@/modules/prompt/buildPrompt`), `parseAiResponse`, `generateMockResponse` (`@/modules/prompt/mockResponseGenerator`) — **all three legacy imports gone**. Confirmed the brief's suspicion: the `generateMockResponse` import was **unused** (the route always called the local `generateMockSectionContent`); `parseAiResponse` was **also imported but never called** (the route hand-rolled its own `JSON.parse` + type-guessing + key:value line-splitting parser). Also deleted: the private `callAIProvider` copy, the `gpt-3.5-turbo`/`Mixtral-8x7B` strings, the raw OpenAI/Nebius `fetch`, the two-provider fallback, and **all three filler-copy 200 exits** (providers-failed `:161`, parse-fallback `:238`, and the catch-all `:312` that re-read the request body to serve mock content on ANY server error).

**Preserved deliberately:** the proof-truth real-testimonial re-injection block (`listTestimonialsByOwner` → `injectRealTestimonials`) and its `aiMetadata.realProof` provenance field — a live acceptance criterion of another feature, out of this phase's remit to change. It is now gated on `engine !== 'work'` (work injects praise inside `parseWorkCopy`, per scopedRegen) and on `project?.id`, mirroring the legacy `projectData &&` guard.

**Response shape:** `pickSectionElements(result.sections, sectionId)` resolves the model's section-TYPE key (what the builders' `uiblocks` carry), then the raw `sectionId`, then the single key if the scope produced exactly one. Values pass through in their generated shape (`string | string[] | object[]`) — **not** re-wrapped in legacy's `{content, type, isEditable, editMode}` envelope. The store's merge loop (`aiActions.ts:147-171`) accepts `string | {content,type}` and is shape-preserving; keeping strings as strings is what that loop wants (the envelope existed only to feed a parser that is now gone). A contract test asserts every emitted value is a string / array / `{content,…}`.

### The `aiActions.ts` fix (R6.3) — and how I verified it reaches the caller

Two call sites, both minimal, error-surfacing only — **no request/response contract altered, no other action touched**:
- **Element caller** (`:556`, the one the brief named): was `throw new Error("API error: " + response.status)` with the body DISCARDED. Now reads the body and throws `errorData?.message || errorData?.error || "API error: " + status`.
- **Section caller** (`:113-116`): already read the body but threw `errorData.error` — the **machine CODE**. For the quote band that renders "**invalid_scope**", which is no more honest to a user than `API error: 422`. Now prefers `message`, falls back to `error`. (In-scope judgment call — Deviation 1.)

Verified by `aiActionsErrorSurfacing.test.ts`, which drives the **REAL** token-scoped store (`createEditStore`) with a stubbed `fetch` returning the exact 422 body the rebuilt routes emit, and asserts the honest text lands in `aiGeneration.errors` (the array the editor renders) — plus explicit negative assertions that it is NOT `'invalid_scope'` and NOT `'API error: 422'`. Both mutation-proven (M9/M10). A body-less 500 still degrades to `API error: 500` (no crash); an `{error}`-only 403 still surfaces `Access denied`.

### The atelier `quote` band, end-to-end (R6.3)

`quote` is a DEFAULT atelier home section (`product/pageArchetypes.ts:141`) with a real block but **no `workElementContract` entry**. Traced and test-pinned end to end:
1. Editor → `POST /api/regenerate-section` with `sectionId: 'quote-…'`.
2. Route: gates pass → project loads → `resolveCopyEngine` → `work` → `generateScopedCopy` → `narrowWorkContractMap` → `resolveWorkSchema('quote')` = null → `ScopeInputError('No work element contract for section "quote"')` — **before any AI call, before any charge**.
3. Route maps it to **422 `invalid_scope`** with `message: "This section isn't AI-written, so it can't be regenerated: No work element contract for section \"quote\""` (+ the machine `error` code + `detail` for logs).
4. `aiActions.ts` now surfaces that **message** (not the code) → `aiGeneration.errors` → the editor's existing error path. Not a spinner, not filler, not a silent drop.

**This is a VISIBLE behavior change for Kundius**: today's legacy route answers a quote-band regen with hardcoded "Section Title / This is placeholder content…" mock filler (the `default` mock template) at 2 credits. It now honestly refuses at 0 credits. Per R6.3 that is the intended direction; the founder should still expect the report. **Residual (already carried to phase 5):** an in-toolbar *disabled+greyed* control with a tooltip is a UI change — this phase delivers the honest message on ATTEMPT, not a pre-emptive disabled state.

### Tests — per-group MUTATION results (every probe run, then reverted)

Mocked: module boundaries ONLY (planCheck / creditSystem / rateLimit / security / prisma / testimonials repo / **aiClient**). **The phase-2 primitive runs FOR REAL.** Mocks hand-written from the CONTRACT: product = TerminalHero's REQUIRED `headline`/`lede`/`cta_text` (`product/elementSchema.ts:82-84`, read by hand — my first draft used `subheadline`, which the real contract does not require, and the suite correctly rejected it); atelier = `workElementContract.about` = `heading`/`bio`, **never** the layout vocabulary.

| # | Mutation (behavior reverted) | Result | Group proven discriminating |
|---|---|---|---|
| M1 | `if (!isMock)` → `if (true)` around `assertProjectOwner` | **2 failed** | demo-token + env-mock sequence |
| M2 | `if (tokenId !== DEMO_TOKEN)` → `if (true)` around the project fetch | **1 failed** | demo-token "NO project fetch" |
| M3 | `if (!project && !isMock)` → `if (false)` (404 branch removed) | **1 failed** | unknown-token → 404 |
| M4 | `resolveCopyEngine(project)` inserted BEFORE the mock short-circuit (the D2 order regression) | **4 failed** | the whole sequence group |
| M5 | `if (err instanceof UnsupportedProjectError)` → `if (false)` | **2 failed** | writer + ecommerce → 422 |
| M6 | `if (err instanceof ScopeInputError)` → `if (false)` (the 2nd 422 code) | **2 failed** | **atelier `quote` band** + unknown-section honesty |
| M7 | `consumeCredits` inserted before the generation-failure exits | **6 failed** | every no-charge assertion |
| M8 | `content: sectionContent` → `content: {}` | **3 failed** | caller-contract group (incl. atelier `bio`) |
| M9 | element caller reverted to discarding the body (`API error: ${status}`) | **1 failed** | element honest-message test |
| M10 | section caller reverted to `errorData.error` (the machine code) | **1 failed** | section honest-message test |

Not separately mutated (would require editing `scopedRegen.ts`, out of scope): engine-aware work narrowing — already mutation-proven in phase 2's fix round, and pinned HERE by construction, because the atelier tests' AI mock speaks `workElementContract` vocabulary, so a layout-keyed narrowing regresses them to 3 calls + 500. The "empty required element → retried, 3 calls, no charge" test independently pins that validation is real (an always-pass validator makes it a 1-call 200).

### Deviations from the plan (and why)

1. **The `aiActions.ts` fix touched TWO call sites, not one.** The brief named the element caller (`:556-558`). But the atelier `quote` band's 422 arrives through the **section** caller (`:113-116`), which read the body yet threw `errorData.error` = `'invalid_scope'`. Leaving it would have shipped R6.3's headline case still unrenderable. Conservative in-scope choice: prefer `message`, keep `error` as the fallback — same file, error-surfacing only, request/response contract untouched.
2. **Mock content is generated locally, NOT via a `mockResponseGenerator{Product,Service,Work}` sibling** (plan step 3 asked for the siblings). Same reason phase 3 recorded, same judgment: the siblings emit WHOLE-PAGE copy and require strategy / work-facts inputs the demo token (`project === null`) has no honest source for. `resolveMockEngine(project)` **is** still called (it is the seam M4 guards) and reported as `meta.engine`; only the string content is local, preserving legacy's mock output byte-for-byte. **Phase 6 impact: none** — the legacy `mockResponseGenerator.ts` import is gone from this route either way, which is what the deletion sweep needed.
3. **A new test file, `aiActionsErrorSurfacing.test.ts`.** The brief required "a test that the error BODY reaches the caller" and no `aiActions` test file existed. Named narrowly so it never grows into a general aiActions suite.
4. **404 conditioned on `!isMock`, not `!project`** — identical to phase 3 (env-mock + unknown token must not 404).
5. **No `maxTokens` override.** Section scope can legitimately produce a large collection; the 8192 default stands (element scope's 2048 was a phase-3 choice about one short field).
6. **Legacy's DB-error `try/catch` removed** (sequence step 4). A DB failure now surfaces as a 500 instead of buying a context-free paid AI call. Strictly better; noted because it is a behavior change the plan did not enumerate.

### Green gate (actual output, run in WORKDIR)

- `npx tsc --noEmit` → **ONE error, and it is NOT the expected pre-existing one**:

  ```
  .next/types/app/api/regenerate-element/route.ts(8,13): error TS2344: Type 'OmitWithTag<typeof import(".../src/app/api/regenerate-element/route"), "POST" | "config" | … | "PATCH", "">' does not satisfy the constraint '{ [x: string]: never; }'.
    Property 'readPersistedLayoutState' is incompatible with index signature.
      Type '(content: unknown) => LayoutState' is not assignable to type 'never'.
  ```

  The baseline `src/app/page.tsx(6,26) founder.jpg` error is **GONE** — a `.next/` now exists in this worktree (the founder's gate runs built it), so `next-env.d.ts` / `.next/types` finally resolve image modules. That same `.next/types` presence is what surfaces the error above. **See the 🚩 below — it is phase 3's, not mine, and I did not touch it.** Zero errors in any phase-4 file.
- `npm run test:run` → **Test Files 213 passed | 1 failed | 1 skipped (215); Tests 3659 passed | 1 failed | 18 skipped (3678)**. Baseline 3637 + 23 new = 3660 ✔. The single failure is a **flake unrelated to this diff**: `src/modules/businessTypes/pipelineGuards.test.ts > no 'isManufacturerFlow' anywhere in src` — a whole-`src` filesystem walk that exceeded the 5s default timeout under full-suite IO load. **Re-run in isolation: `Test Files 1 passed; Tests 3 passed (3.70s)`.** It reads files with `fs.readFileSync`; nothing in phase 4 changes its inputs.

### 🚩 BLOCKER FOUND OUTSIDE MY FILES-TOUCHED — reported, NOT fixed

`src/app/api/regenerate-element/route.ts:75` does `export function readPersistedLayoutState(...)`. **Next.js App Router route modules may only export route handlers + a fixed config allow-list**; any other export fails the generated `.next/types` constraint. Latent since phase 3, invisible only because the worktree had no `.next/`. **It will fail `npm run build`** (the plan's phase-6 full gate). Fix is one word — drop the `export` (nothing imports it; its own route is the only consumer) or move it to a plain module. **I did not touch it** (not in phase 4's Files-touched). Orchestrator: assign it as a one-line fix in phase 5/6, or as a quick phase-3 amendment.

### Open risks

- **Prompt thinness is now live on a customer path** (R6.1/R6.2): section regen builds the full engine prompt with `bigBenefit`/`uniqueMechanism`/`reasonToBelieve`/`ourPosition` = `''`. Judged against "≥ today's legacy regen": today's legacy section prompt is a ~15-line generic template carrying `Project Title` + `Input Text` and **no element contract at all**, so the modern path is strictly richer in every dimension except the (nonexistent) persisted strategy. Still — real-LLM quality is a founder gate, not a test.
- **A hard-failing section now burns up to 3 paid `copy`/`work-copy` calls at 0 credits** (MAX_RETRIES=2, charge-on-success). Same intentional trade phase 3 recorded; section-scope calls are bigger.
- **Kundius will see the quote-band refusal** on her next quote regen (see above). Honest, but new.
- **Collections in the merge loop:** an array value landing on a non-empty array slot is *skipped* by the store's merge (`aiActions.ts:162-166`, "never clobber a collection with scalar copy" — arrays fall through every branch). Pre-existing store behavior, not introduced here; noted because the new route emits real collections (e.g. hero `stats`) where the legacy route emitted only guessed scalars, so it becomes newly observable.

---

## Phase 4 addendum — illegal App Router export FIXED (assigned follow-up to the blocker above)

**Files changed:** `src/app/api/regenerate-element/route.ts` (one word), `docs/task/regen-modernization.audit.md`.

Resolves the 🚩 blocker recorded above. `src/app/api/regenerate-element/route.ts:75` went from `export function readPersistedLayoutState(...)` to `function readPersistedLayoutState(...)`.

- **Why it's illegal:** App Router route modules may only export route handlers (`GET`/`POST`/…) plus a fixed config allow-list. Next generates `.next/types/app/**/route.ts` asserting every *other* export is `never`; this one produced `TS2344 … Type '(content: unknown) => LayoutState' is not assignable to type 'never'`.
- **Why it was masked:** the worktree had never been built, so no `.next/types` existed and route-type checking never ran. The founder's `CAPTURE=1` gate runs created `.next/`, which surfaced it.
- **Why dropping `export` was safe (not a move/redesign):** `readPersistedLayoutState` had **zero importers** — grep across `src/` found exactly two hits, the definition (`:75`) and its single in-file call site (`:242`). The `export` was dead surface area.
- **`regenerate-section/route.ts` (phase 4) does NOT have this problem.** Audited both route files against the App Router rule: each exports only `dynamic` (allowed config) + `POST` (handler). No other non-handler exports in either file.

**Green gate (actual output, run in WORKDIR):**
- `npx tsc --noEmit` → **0 errors.** The old `src/app/page.tsx(6,26)` `founder.jpg` baseline error is gone, as predicted — `.next/` now exists so Next's image-module types resolve.
- `npm run test:run` → **214 files passed | 1 skipped; 3660 tests passed | 18 skipped**, 83.8s. No `pipelineGuards.test.ts` flake this run. (Count is 3660 vs the 3659 baseline quoted to me — one extra test in the suite; no test files were touched in this fix, so this is baseline-count drift, not a regression.)
- `npm run build` → **SUCCESS** (first-ever build in this worktree; full `build:published-css` → `build:assets` → `next build`, route table emitted, no errors). This is the real proof the illegal export is gone and the phase-6 / merge build gate will pass. No other pre-existing breakage surfaced.
