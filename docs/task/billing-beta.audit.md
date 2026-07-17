# billing-beta — implementation audit

Branch: `feature/billing-beta` (verified before any edit). WORKDIR:
`C:\Users\susha\lessgo-ai\.claude\worktrees\billing-beta`.

## Phase 1 — config extraction (prisma-free constants)

### Files changed

- `src/lib/planConfigs.ts` (new)
- `src/lib/creditCosts.ts` (new)
- `src/lib/planConfigs.test.ts` (new)
- `src/lib/planManager.ts` (modified)
- `src/lib/creditSystem.ts` (modified)

No other file was touched. All within the phase's Files-touched list.

### What changed, file by file

**`src/lib/planConfigs.ts` (new)** — receives `PlanTier`, `PlanStatus`, `PlanConfig`,
`PLAN_CONFIGS`, `getPlanConfig`, moved out of `planManager.ts`. No prisma/logger import, no `@/`
alias import (stated as an invariant in the file header — the Playwright runner imports these
modules by relative path and does not resolve tsconfig aliases). Values byte-identical: the
`PLAN_CONFIGS` block and the enum/interface block were diffed line-by-line against
`git show HEAD:src/lib/planManager.ts` — 0 differing lines except the 2 comment lines noted under
Deviations. Load-bearing comments moved with the code (FREE `credits:20` divergence note, the
socialPosts migration-sync note, the trackingPixels config-only note).

**`src/lib/creditCosts.ts` (new)** — receives `CREDIT_COSTS` (`as const`) verbatim; the moved
block is byte-identical to HEAD (verified programmatically). Same prisma-free / no-`@/` header
invariant. Adds `export type CreditOperation = keyof typeof CREDIT_COSTS` (see Deviations).

**`src/lib/planManager.ts`** — the moved declarations are replaced by an import + re-export of the
same five names. `PlanConfig` is re-exported via `export type { PlanConfig }` (required by
`isolatedModules: true`); the `PlanTier`/`PlanStatus` enums re-export as values. The duplicate
`getPlanConfig` definition further down the file was removed (it now comes from the re-export).
Everything else — the prisma-backed functions and the limit-column writer-completeness guard —
is untouched.

**`src/lib/creditSystem.ts`** — same pattern for `CREDIT_COSTS` (+ `CreditOperation` as a type
re-export). `UsageEventType` and all prisma-backed logic untouched.

**`src/lib/planConfigs.test.ts` (new)** — value pins. Scoped deliberately (see Deviations):
pins all 13 `CREDIT_COSTS` values (previously unpinned anywhere in the suite), the two
deliberate-divergence facts (FREE `credits:20`; PRO `price.annual: 24` is per-month, not $290/yr)
with comments so nobody "fixes" them, and `getPlanConfig` tier round-trip. No re-export identity
assertion (cannot fail — theatre), per the plan.

### Deviations from the plan

1. **Plan-value pins not duplicated.** Plan step 4 asks to pin FREE `credits:20` and PRO
   `monthly:29`/`annual:24`. `src/lib/planManager.test.ts:148-185` ("PLAN_CONFIGS pricing v2
   numbers") **already pins these**, and since `planManager` now re-exports `planConfigs`, those
   existing pins cover the moved module unchanged. Per the plan's "extend/de-dupe rather than
   duplicate" instruction I did not copy them; I kept a deliberate small overlap only for the two
   values that look like bugs (FREE 20, PRO annual 24), because their *pin comment* is the point.
   Scope note recorded in the test file header. `creditSystem.test.ts` had no `CREDIT_COSTS`
   value pins — that gap is now filled.
2. **Two comment lines reworded** in the `trackingPixels` note. Original read "the
   create/upgrade/downgrade writers **below** do not write this field" — after the move those
   writers are no longer below it (they stayed in `planManager.ts`), so the pointer would be a
   lie. Now reads "…writers **in planManager.ts** do not write this field". Comment text only;
   zero value/semantic change. This is the ONLY textual difference in the moved blocks.
3. **`CreditOperation` type added.** Plan step 2 says move `CREDIT_COSTS` "+ derived operation
   type"; no such type existed in `creditSystem.ts`. I defined
   `export type CreditOperation = keyof typeof CREDIT_COSTS` in `creditCosts.ts` and type-re-exported
   it from `creditSystem.ts`. Additive type-only, no runtime/value impact, no current importer.

### Verification (run in WORKDIR)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | exit 0, clean |
| `npm run test:run` | **212 passed / 1 skipped** files; **3599 passed / 18 skipped** tests |
| `npm run lint` | 0 errors (pre-existing warnings only, all in untouched files) |
| `npm run build` | exit 0 (`PIPESTATUS=0`), full route table emitted |

Diff review: `git diff --stat` = `creditSystem.ts` (+/-29), `planManager.ts` (-203 net) — deletions
only, matching the two new modules. Moved blocks confirmed identical by scripted line-diff vs HEAD.

### Noticed but deliberately NOT touched

- **FREE `credits: 20` vs DB `creditsLimit=0`** — intentional (pool-backed), left as-is with its
  comment; now also pinned by a test.
- **PRO `price.annual: 24`** — a per-month figure; $290/yr lives only at `pricing/page.tsx:77`.
  Left as-is (plan decision 10); pinned with an explanatory comment.
- **`IVOC_RESEARCH: 3`** — dead constant (backend removed in scale-08). Left in config per plan;
  pinned for completeness. Must not be surfaced in UI (phases 3/6).
- `getPlanConfig(tier)` returns `PlanConfig` but is typed non-optional while two callers
  (`publish/route.ts:367`, `verify-dns/route.ts:123`) use `?.` — pre-existing, out of scope.
- No `@/` alias imports exist in either new module; treat as a standing invariant for phases 3+
  (the Playwright relative import depends on it).

### Open risks

- Low. Pure move; the only runtime-visible change is module identity of re-exported symbols, which
  TS/bundler resolve transparently — `tsc`, 3599 tests, lint, and a full production build are green.
- Phases 3/6 e2e specs will import `src/lib/creditCosts` / `src/lib/planConfigs` relatively from
  Playwright — the no-alias/no-prisma invariant must survive future edits to these two files.

---

# Phase 2 — insufficient-credits normalizer

> **⚠️ CORRECTED 2026-07-17 after impl-review.** The first version of this phase was **broken**,
> and two claims in the text below were **false**. See "Correction (2026-07-17)" at the end of
> this section for what actually happened. The per-file text has been rewritten to match the
> shipped code; the original wrong statements are called out rather than silently erased.

## Files changed

- `src/lib/billing/insufficientCredits.ts` (new)
- `src/lib/billing/insufficientCredits.test.ts` (new)
- `docs/task/billing-beta.scout.md` (corrected §F — root cause of the bug; added to Files touched
  by the orchestrator's fix brief)

No other file was touched. No route was modified (response shapes are Scope OUT).

## What changed, file by file

### `src/lib/billing/insufficientCredits.ts` (new)

Client-safe leaf module (no prisma, no React, no `next/*` imports) exporting:

- `interface InsufficientCreditsInfo { required?: number; available?: number }`
- `parseInsufficientCredits(status: number, body: unknown): InsufficientCreditsInfo | null`
- `class InsufficientCreditsError extends Error { required?; available? }` — typed throw for
  call sites (phase 4 consumer).

Claim logic, in order:

1. Non-record body (`undefined` / `null` / `''` / an HTML error page / an array) → `{}` when the
   status is 402, else `null`.
2. Reads the code from BOTH positions, because `body.error` is **dual-purpose**: Pattern A puts
   the *code string* there (`'insufficient_credits'`), Patterns B / checkAIAccess put the *human
   message* there and the code in a top-level `body.code`. Compared case-insensitively, so
   `insufficient_credits` and `INSUFFICIENT_CREDITS` both match the one entry in
   `INSUFFICIENT_CODES`.
3. Reads the human message from top-level `body.message` (Pattern A) first, then `body.error`
   when it is a string that is *not* the code (Patterns B / checkAIAccess).
4. Claims when the code matches OR the message matches `MESSAGE_RE`. A 402 that matches neither
   still returns `{}` (a block with no numbers) rather than `null` or a throw. A non-402 is
   claimed ONLY with the explicit code.
5. Numbers — **structured beats regex**, per-field, in this precedence:
   `details.{required,available}` (checkAIAccess) > `creditsRequired`/`creditsRemaining`
   (Pattern A, ~14 emitters) > `required`/`remaining` (Pattern A's outreach variant,
   `outreach/[token]/route.ts:384`) > the `Required: N, Available: M` message regex. Only finite
   `number`s are accepted; a string/null falls through to the next source. Regex exposure is now
   scoped to **Pattern B only** (`planCheck.ts:100`, `:268`) — the sole shape with no structured
   numbers. This also fixes `generate-privacy-policy:195`, whose message (`consumption.error`)
   need not match the regex at all; only its structured numbers recover the values.

Deliberately NOT claimed: `src/app/api/social/[token]/posts/route.ts:233`, which answers **403**
with `error: 'limit_reached'`. It fails every gate above (not 402, no credit code, no matching
message) → `null`. Pinned by a fixture test. The module header documents why.

### `src/lib/billing/insufficientCredits.test.ts` (new)

Fixture-based per the plan. Five fixtures, each now **transcribed from route source with a
file+line citation in a comment** (`PATTERN_A` ← `v2/scrape-website/route.ts:239-247`,
`PATTERN_A_OUTREACH` ← `outreach/[token]/route.ts:384-392`, `PATTERN_B` ← `planCheck.ts:100`,
`CHECK_AI_ACCESS` ← `planCheck.ts:243`, `SOCIAL_403_WALL` ← `social/[token]/posts/route.ts:233`),
then 14 tests: each of the three
402 shapes; details-beat-message precedence; the social 403 wall → null; a 500 → null; unrelated
200/401/404 → null; the malformed-body matrix (undefined/null/''/HTML string/{}/[]/unknown error)
→ `{}`; numbers omitted rather than guessed; non-402-with-code accepted, non-402-without-code
rejected; and the error class's fields/default+override message.

## Verification

Run in WORKDIR:

- `npx tsc --noEmit` → exit 0, no output.
- **Proof on the REAL body** (the gate the first version failed): a throwaway probe asserted
  `parseInsufficientCredits(402, <verbatim scrape-website:239-247 body>)` → `{required:1,
  available:0}`. Passed; probe deleted. The same body is now pinned permanently as `PATTERN_A`.
- `npm run test:run` → **213 passed | 1 skipped (214) files; 3613 passed | 18 skipped (3631)
  tests**. Baseline was 3599; +14 are this phase's.
- `npm run lint` → no errors; only pre-existing warnings in untouched files
  (`vestria/blocks/publishedPrimitives.tsx`, `providers/ph-provider.tsx`). Nothing from
  `src/lib/billing/`.
- `npm run build` not run — the plan lists it for phases 1 and pre-merge, not phase 2.

## Decisions + why

1. **A 402 we can't parse returns `{}`, not `null`.** The brief requires a blocked op to always
   produce a usable message. `{}` is truthy → the caller renders generic out-of-credits copy;
   `null` would let a 402 fall through to a silent failure — exactly the bug this slice fixes.
   Cost: a hypothetical future non-credit 402 would be mislabelled. No route emits one today, and
   402 is used exclusively for credits in this codebase.
2. **Non-402 accepted only with the explicit code** (plan's "belt-and-braces … else require 402").
   Message-only matching on a non-402 status is rejected — that is what keeps the normalizer from
   drifting onto other conventions.
3. **Structured numbers beat the message text when they disagree.** They are typed fields; the
   message is a formatted string. Pinned by tests for both `details` and Pattern A's
   `creditsRequired`/`creditsRemaining`.
4. **`available` regex allows a leading `-`; `required` does not.** `checkCredits` fails closed at
   `remaining: 0` and cannot go negative today, but a negative balance is a plausible future and
   parsing it beats silently dropping the field. A negative `required` is meaningless.
5. **`InsufficientCreditsInfo` fields omitted, not set to `undefined`.** Keeps `toEqual({})` exact
   and avoids `{required: undefined}` reading as "present but unknown" downstream.
6. **`INSUFFICIENT_CODES` is a Set with one entry.** Both live codes differ only by case, which
   `.toLowerCase()` handles; the Set is the extension seam if a fourth shape appears.
7. **No route imports it yet.** Phase 2 ships the normalizer + tests only; wiring is phase 4.
   The module is dead code until then — intentional, matching the plan's phase split.

## Correction (2026-07-17) — what actually happened

**The bug.** The module assumed Pattern A was `{success:false, error:{code, message}}` — nested.
It is not, and never was. The real body (`v2/scrape-website/route.ts:239-247` and ~14 twins) is
flat: `error` is the *string* `'insufficient_credits'`, `message` is top-level, and the numbers are
structured on the body. Against the real shape: `isRecord(body.error)` → false → `nestedError`
undefined → `hasCode` false → `message` fell back to `body.error`, i.e. the literal string
`'insufficient_credits'` → `MESSAGE_RE` failed → **silent `{}`**. Every Pattern A emitter — ~13 of
~15, including the entire wizard generation lane — lost its numbers. Patterns B and checkAIAccess
were unaffected (they were the shapes I actually matched).

**Root cause: a doc error, propagated and never checked against source.** `billing-beta.scout.md`
§F asserted the nested shape. That claim flowed into the plan → the phase brief → the module →
and then into the *test fixture*, which I wrote from the scout's prose. Because the fixture
encoded the same false assumption as the code, **the suite went green while the module was
broken**. The fixture-as-tripwire mechanism failed on its first use: a fixture only protects you
if it is transcribed from the thing it claims to pin.

**Two false claims in the original audit, corrected above:**
1. "Reads the human message from BOTH positions: nested `body.error.message` (Pattern A)
   preferred … This is the nested-message trap from the brief" — there is no nested-message trap.
   I described defending against a shape that does not exist.
2. "Four fixtures transcribed from the shapes the routes emit" (:147 of the original) — **untrue**.
   They were paraphrased from a doc. `PATTERN_A` pinned a body no route has ever sent.

**How it was caught:** not by my tests — by the impl-reviewer running a runtime probe of
`parseInsufficientCredits` against the verbatim route body, getting `{}` where `{required:1,
available:0}` was expected. Corroborating evidence had been sitting in the repo the whole time:
`audience/product/strategy/route.test.ts:135-140` already asserts `json.error ===
'insufficient_credits'` + `json.creditsRequired`/`creditsRemaining` — direct proof of the flat
shape, one grep away.

**Fixed:** flat-shape parsing (string-code match on `body.error`, top-level `body.message`);
structured numbers preferred over the regex, incl. outreach's `required`/`remaining`; the
misleading module header rewritten with per-shape source citations; fixtures re-transcribed from
source with file+line comments, plus a new outreach-variant fixture; scout §F corrected at the
root with a dated marker so phases 3+ don't re-inherit it.

**Lessons:** (a) a scout doc is a map, not the territory — pin fixtures from source, never from
prose; (b) a fixture written by the same person, from the same wrong belief, as the code is not a
tripwire, it is an echo; (c) when a normalizer's whole job is shape-matching, one probe against a
real body is worth more than eleven tests against an invented one.

## Open risks (post-correction)

- **`{}` fallback still looks like a graceful degrade.** After this fix, no *known* shape reaches
  it; a `{}` now means a route's shape drifted. Commented as a last resort in the module, but it
  is silent — nothing logs. If a route changes, the numbers vanish quietly again (the UI still
  shows generic out-of-credits copy, so the failure is soft, not broken).
- **Nothing links fixture to route.** The citations are comments; a route edit will not fail this
  suite. Reviewer's idea, deferred to **phase 4+** (out of scope now): have the existing
  `route.test.ts` files feed their real mocked 402 body through `parseInsufficientCredits` — a
  genuine tripwire living in test files, no route changes needed.
- The scout doc's other sections were not re-verified against source; only §F was in scope.

## Noticed but deliberately not touched

- **`checkCredits` fails closed** (`creditSystem.ts:160-163`: internal error → `allowed:false,
  remaining:0`), so a solvent user hitting a DB blip is reported as broke and this normalizer will
  faithfully render "Available: 0". Not a presentation bug — a backend behaviour, Scope OUT. Worth
  a line at the phase-8 hardening sweep.
- **`EntryInputStep.tsx:120`** (`if (res.status !== 402)`) silently suppresses 402 — the normalizer
  exists to fix this, but the call site is phase 4's.
- **`aiActions.ts:98/482/557`** never inspect status, so 402 and 500 are indistinguishable. Also
  phase 4.
- **`modules/wizard/generation/{thing,trust,work.llm}.ts`** already hand-roll `status===402 ||
  /credit/i.test(error)` — the reference lane. Candidates to migrate onto the normalizer, but they
  work today and are outside phase 2's Files touched.
- **`generate-privacy-policy` and `regenerate-story` appear under BOTH Pattern A and Pattern B** in
  scout §F — i.e. a single route may emit either shape depending on the path taken. The normalizer
  is shape-driven, not route-driven, so this is handled; noting it because it makes any future
  "just fix the routes" cleanup larger than a per-route rename.

## Open risks

- Low. New leaf module, zero import sites, no behaviour change to anything shipping today.
- The `MESSAGE_RE` fallback is coupled to the exact `Insufficient credits. Required: N,
  Available: M` string that the routes build inline. If a route reworded that message, the numbers
  would silently vanish (degrading to `{}`, not crashing) for every shape except checkAIAccess.
  The fixtures make the coupling explicit and greppable, but there is no compile-time link.
