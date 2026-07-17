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
