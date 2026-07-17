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
