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

---

# Phase 3 — dashboard header credit counter

**Files changed**
- `src/components/billing/CreditBadge.tsx` (rewritten in place)
- `src/components/dashboard/DashboardTopBar.tsx` (modified)
- `e2e/billing-beta.spec.ts` (new)
- `playwright.config.ts` (modified)

## What changed, per file

### `src/components/billing/CreditBadge.tsx`
- **`app-*` reskin.** Dropped lucide (`Coins`/`AlertCircle`/`TrendingUp`) and every stock-Tailwind
  key (`bg-red-50`, `text-green-600`, `bg-gray-200`, `rounded-lg`, `text-sm`…). Now: `AppIcon`
  (`credit_card` on the pill, `workspace_premium` on the upgrade link — both already in the
  committed subset; `icons.txt` and the font binaries untouched), `app-*` colors
  (`app-ink/muted/faint/border/divider/surface/hover/track/primary/danger/danger-bg/review-*`),
  `rounded-app-pill`/`rounded-app-ctl`, `font-app-sans` (via the panel primitive), px type sizes.
- **Hardcoded costs at old :179-191 killed.** Rows now render from a `SHOWN_COSTS` list mapped over
  `CREDIT_COSTS` (`@/lib/creditCosts`) — `FULL_PAGE_GENERATION`, `SECTION_REGENERATION`,
  `ELEMENT_REGENERATION`. `IVOC_RESEARCH` deliberately not surfaced (dead constant, scale-08).
  Header comment states the config-driven rule + the single-fetcher rule so a future edit is a
  conscious act.
- **Preserved verbatim:** pool-aware math (`totalAvailable` fallback, `hasMonthly`, `isOut`/`isLow`
  severity split), the 30s polling effect, the `/api/credits/balance` fetch, all copy semantics.
  Still the ONLY balance fetcher; no second fetch added.
- **Upgrade link** `/pricing` → `/dashboard/billing`.
- Added `data-testid` hooks (`credit-badge`, `credit-badge-value`, `credit-badge-panel`,
  `credit-cost-row[data-cost-op]`, `credit-cost-value`) for the e2e.

### `src/components/dashboard/DashboardTopBar.tsx`
- Import + `<CreditBadge />` mounted between the `flex-1` spacer and the greyed bell, with a comment
  restating decision 6 (client fetch only; absent on `/dashboard/[token]/*` by the bar's existing
  self-suppression). No other change; the bar stays `'use client'` and adds zero server reads.

### `playwright.config.ts`
- `/billing-beta\.spec\.ts/` added to the `authed` project's `testMatch` ALLOWLIST (the registration
  trap this phase exists for). No other config change.

### `e2e/billing-beta.spec.ts` (new)
- `authed`, serial, `HAS_AUTH_ENV` skip guard (same triple as the other authed specs). No seeding —
  the counter needs only a Clerk session.
- Test 1: `/dashboard` header renders the badge with a numeric value (`/^\d+(\/\d+)?$/`).
- Test 2: hover → panel; each cost row's rendered text must equal `CREDIT_COSTS[op]` **imported via
  relative path** `../src/lib/creditCosts` (no `@/` — the Playwright runner has no alias resolution;
  the module's phase-1 no-alias/prisma-free invariant is what makes this possible). Plus a negative
  assertion that no `IVOC_RESEARCH` row exists.

## Deviations from the plan

1. **`AppPopoverPanel` instead of `AppTooltip`** (plan step 1 named `AppTooltip`). `AppTooltip`'s
   content surface is a `max-w-[220px]` dark-ink bubble — it cannot carry the panel's progress bar,
   pool row and cost table without restyling a shared primitive (forbidden) or hand-rolling a second
   popover (explicitly banned by `ui/README.md`, "ONE primitive, two surfaces"). The old code's
   `showTooltip` div WAS an improvised popover; it is now the sanctioned `Popover` +
   `AppPopoverPanel`. Conservative choice: same hover-open UX preserved (controlled `open` +
   mouseenter/leave on both trigger and panel), with `onOpenAutoFocus` prevented so a hover-open
   popover does not steal focus; click/keyboard open now works for free (an a11y improvement over the
   hover-only div). `AppIcon` is used as planned.
2. **Loading state renders a `Spinner`** (size 16) instead of the old `return null`. Decision 7 names
   `Spinner` as the loading treatment; it also avoids a layout jump in the bar. Signed-out and
   fetch-failure still return `null`, unchanged.
3. **Severity palette:** `isLow` uses the `app-review-*` trio (`#fff2ec`/`#ffd9c7`/`#d9531f`) — there
   is no `app-warning`/amber `app-*` key, and adding one would mean editing `tailwind.config.js`,
   which is NOT on this phase's Files-touched list. `isOut` uses `app-danger`/`app-danger-bg` with the
   review border (no `app-danger-border` key exists).

## Verification (WORKDIR, all green)

- `npx tsc --noEmit` — clean, no output.
- `npm run test:run` — `213 passed | 1 skipped (214)` files, `3613 passed | 18 skipped` tests.
- `npm run lint` — no new errors/warnings (pre-existing template `no-img-element` /
  `exhaustive-deps` warnings only).
- `npm run build` — green (published-css + assets + next build).
- Isolation guards re-run against the FRESH build artifact:
  - `uiFoundationIsolation.test.tsx` (published.css sha256) — 5 passed.
  - `tailwindConfigFreeze.test.ts` — 3 passed.
  - `e2e/ui-isolation.spec.ts` — 2 passed (below).
- **Playwright, with EXECUTION evidence** (`E2E_PORT=3037 npx playwright test e2e/billing-beta.spec.ts e2e/ui-isolation.spec.ts --project=authed --project=public`):

```
Running 5 tests using 1 worker
  ✓  1 [setup] › e2e\auth.setup.ts:9:6 › authenticate (6.2s)
  ✓  2 [public] › e2e\ui-isolation.spec.ts:55:7 › ui-foundation isolation — main-app surface › computed-style baselines on /dev/meridian/blocks are unchanged (15.5s)
  ✓  3 [public] › e2e\ui-isolation.spec.ts:86:7 › ui-foundation isolation — main-app surface › no app-chrome fonts/classes on the block surface (4.3s)
  ✓  4 [authed] › e2e\billing-beta.spec.ts:27:7 › billing-beta — dashboard credit counter › header shows a numeric credit balance (10.0s)
  ✓  5 [authed] › e2e\billing-beta.spec.ts:37:7 › billing-beta — dashboard credit counter › cost rows render from CREDIT_COSTS config (not hardcoded) (4.3s)

  5 passed (1.2m)
```

Both billing-beta tests are named in the output **under the `[authed]` project** — the spec really
executed, against a real Clerk session and a really-rendered badge (not skipped, not unmatched). The
`HAS_AUTH_ENV` guard did not fire (creds present in `.env.local`); a skip would have printed `-`, not
`✓`. The assertions are non-vacuous: a missing `credit-badge` or a non-numeric value fails test 1, and
a missing/mismatched row fails test 2.

## Noticed but deliberately untouched

- The panel's own `Resets in {daysUntilReset} days` row still renders for monthly tiers. It reads a
  real value from the balance response (unrelated to the phase-4 modal's dropped `daysUntilReset`
  prop), so it is correct here; left as-is.
- `CREDIT_COSTS` carries other live costs (`SCRAPE_WEBSITE`, `GENERATE_COPY`,
  `PRIVACY_POLICY_GENERATION`, `OUTREACH_SCRAPE`…). Only the plan's three are surfaced — the panel is
  a hint, not the full price table. Costs-at-action is phase 7.
- `FIELD_INFERENCE`/`FIELD_VALIDATION`/`IVOC_RESEARCH` look dead post-scale-08, but reconciling the
  cost table is a config-value change — Scope OUT.
- `SeoSettingsModal.tsx:135` comments that it "mirrors CreditBadge's plan fetch" — it fetches
  `/api/billing/plan`, not the balance, so it is not a second *balance* fetcher; untouched.
- The project workspace header (`/dashboard/[token]/*`) still has no counter (decision 6, accepted).

## Open risks

- **The config-driven check is directional, not airtight.** The e2e compares the rendered number to
  `CREDIT_COSTS[op]` — if someone re-inlined the literal `10` today it would still pass, because the
  config also says 10. It catches drift the moment the config changes (which is the stated acceptance
  criterion), but it cannot detect a same-value re-inline. The `data-cost-op` attributes derive from
  the same `SHOWN_COSTS` keys, which at least makes the coupling greppable.
- Hover-driven popovers are timing-sensitive; the panel assertion relies on Radix mounting on
  `hover()`. It passed cleanly, and the popover also opens on click, so a flake would surface as a
  visible failure rather than a silent pass.

---

# Phase 4 — gating message + upgrade path (THE beta blocker) 🚧 HUMAN GATE

## Files changed

- `src/lib/billing/creditsBlockedBus.ts` (new)
- `src/components/billing/CreditsBlockedHost.tsx` (new)
- `src/components/billing/OutOfCreditsModal.tsx`
- `src/components/billing/OutOfCreditsModal.test.tsx` (new)
- `src/hooks/editStore/aiActions.ts`
- `src/hooks/editStore/aiActions.credits.test.ts` (new)
- `src/app/edit/[token]/page.tsx`
- `src/app/onboarding/[token]/components/EntryInputStep.tsx`
- `e2e/billing-beta.spec.ts`

(Also dirty in the worktree but NOT touched by this phase: `docs/task/billing-beta.plan.md`,
`docs/task/plan-credits-surface.spec.md`, `docs/task/pricing-v2.spec.md`,
`src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` — pre-existing
uncommitted phase-3 progress-log edits + CRLF-only noise. Left alone.)

## What changed, per file

**`src/lib/billing/creditsBlockedBus.ts`** (new) — module-level subscribe/emit for
`{required?, available?}`, editor-toast-singleton idiom but with a `Set` of listeners (a stale
unmounted host can't swallow an event). `emitCreditsBlocked` never throws — it is called from
error paths and must not convert "blocked" into an unrelated crash. Exports a test-only reset.

**`src/components/billing/CreditsBlockedHost.tsx`** (new) — `'use client'`, subscribes on mount,
renders `OutOfCreditsModal`. Last-emit-wins. Header carries the MOUNT-IT-OR-IT'S-SILENT warning.

**`src/components/billing/OutOfCreditsModal.tsx`** — rewritten:
- `app-*` reskin (+ `AppIcon`); lucide (`X`, `Zap`, `Clock`, `TrendingUp`) fully removed.
- All numbers now read `PLAN_CONFIGS` / `CREDIT_COSTS`. Stale pricing-v1 copy deleted: `$39`,
  "14-day free trial", "Start Free Trial", "Free plan: 30 credits/month", hardcoded 10/2/1 costs.
- `daysUntilReset`: `= 0` default DROPPED and the block gated on `typeof === 'number'` (kept, but
  never renders this slice — no caller passes it).
- `creditsRequired`/`creditsAvailable` made OPTIONAL: the normalizer returns `{}` for a 402 with an
  unrecognized body, so copy degrades to a number-free sentence rather than printing `undefined`.
- CTA = `<Link href="/dashboard/billing">`. No Stripe, no `stripeClient` (decision 9).

**`src/hooks/editStore/aiActions.ts`** — one `creditBlockFrom(status, body)` helper (parse → emit →
typed error) applied at the THREE real credit-gated fetches: `regenerateSection`
(`/api/regenerate-section`), `regenerateStoryFromInterview` (`/api/audience/work/regenerate-story`),
and `regenerateElementWithVariations` (`/api/regenerate-element`). The last one previously threw on
`response.status` **without reading the body** — it now reads it (try/catch-wrapped). Non-credit
errors are unchanged. `regenerateElement` (the setTimeout mock stub) NOT touched.

**`src/app/edit/[token]/page.tsx`** — `<CreditsBlockedHost />` mounted inside `<ToastProvider>`.

**`src/app/onboarding/[token]/components/EntryInputStep.tsx`** — on `parseInsufficientCredits`
match, render an inline credits notice + `/dashboard/billing` link INSTEAD of the misleading
generic "Couldn't read that site…". **The `if (res.status !== 402)` analytics suppression is
untouched** — credit blocks still never log `scrape_failed`.

**`e2e/billing-beta.spec.ts`** — added the phase-4 wiring proof (see below).

## Deviations from the plan

1. **The plan's `regenerateStorySection` does not exist** — the real action is
   `regenerateStoryFromInterview(sectionId, interviewAnswers, brief)`, and it no-ops unless the
   section is `about-*`. Same fetch/line the plan meant; name + test fixture corrected. (Same class
   of plan-vs-source drift as phase 2's Pattern-A error.)
2. **`regenerateSection`'s bare `await response.json()` became `.json().catch(() => ({}))`** —
   required so a 402 with an empty/non-JSON body still reaches the normalizer. Side effect: a
   malformed error body now yields `'Failed to regenerate section'` instead of a raw `SyntaxError`
   from the outer catch. Strictly better; noted because it is a change beyond the credit path.
3. **The onboarding notice uses STOCK utilities, not `app-*`** (decision 7 says `app-*` for touched
   chrome). `EntryInputStep` is entirely stock (`Label`/`Textarea`/`Button`, `text-red-500`,
   `brand-accentPrimary`); a lone `app-*` island would render off-palette next to them.
   Conservative choice: match the file. Nothing here touches template/published surfaces, so no
   isolation risk. Flagging for the reviewer — a one-line ruling either way is cheap.
4. **Icons used: `close`, `credit_card`, `workspace_premium`** — all three are ALREADY in
   `public/fonts/material-symbols-rounded/icons.txt`, so no new ligature, no `icons.txt` edit and no
   font-subset regen (decision 7's actual constraint holds; it named only two of them).
5. **Added a mutation-probe vitest** beyond plan step 8 (fabricates `PLAN_CONFIGS`/`CREDIT_COSTS`
   via `vi.doMock` and asserts the DOM follows). Reason below — the plan's "assert against imported
   config" check is not sufficient alone. This is exactly carry-forward item (b) from phase 3,
   applied here rather than deferred to phase 8.

## Test results

- `npx tsc --noEmit` — exit 0.
- `npm run test:run` — **215 files / 3630 passed**, 1 file + 18 tests skipped (pre-existing).
  Includes 11 new modal tests + 6 new aiActions credit tests.
- `npm run lint` — no errors; zero warnings on any touched file.
- `npm run build` — green.
- `E2E_PORT=3037 npx playwright test e2e/billing-beta.spec.ts --project=authed` — **4 passed**, with
  the phase-4 spec EXECUTED (`✓`, not `-`) under `[authed]`:

```
✓  2 [authed] › billing-beta.spec.ts:32:7  › header shows a numeric credit balance (7.8s)
✓  3 [authed] › billing-beta.spec.ts:42:7  › cost rows render from CREDIT_COSTS config (3.4s)
✓  4 [authed] › billing-beta.spec.ts:154:7 › a 402 from /api/regenerate-element raises the
     out-of-credits modal (32.2s)
```

  Real seeding (persona → `/api/start` → `seedDraft` Meridian, serial, `HAS_AUTH_ENV` guard,
  `afterAll` hard-delete), real editor, real toolbar click; only the 402 response is stubbed, in the
  route's REAL body shape (Pattern B + `details`).

### Both green results were proven non-vacuous (the "fixture echoed the code's belief" lesson)

- **e2e negative control**: unmounted `<CreditsBlockedHost />` → the spec FAILED with
  `credit block did not surface — is CreditsBlockedHost mounted?`. Re-mounted → green. The test
  really pins the wiring, not just the ends.
- **vitest mutation probe**: replaced `${PRO.price.monthly}` with the literal `$29` → **the
  compare-to-imported-config tests all still passed**; only the fabricated-config probe failed
  (`expected '$29' to be '$1234'`). Reverted → 11/11 green. This confirms the plan's step-8 check
  would NOT have caught a re-inline, and that the probe is the load-bearing one.

## User-facing copy — VERBATIM (APPROVED at the phase-4 gate)

> **Founder sign-off (phase-4 gate):** approved with three changes, applied below and in code —
> (1) title reworded `Out of AI credits` → **`Not enough credits`** (unconditional flat rename, NOT a
> branch on `available`: it is accurate both at zero and when merely short of this op's cost, and
> `available` is unknown on malformed 402 bodies); (2) the Free-plan note
> (`The Free plan includes 20 one-time credits.`) **dropped entirely** — it described credits the
> blocked Free user had just spent, phrased as an inducement, and the credit-costs block already
> teaches cost; (3) the two number-free fallbacks **aligned** on the modal's wording.
> The **tier-blind "Upgrade to Pro" card was explicitly DEFERRED to phase 6**, which rebuilds the
> billing view and already reads plan/tier — fixing it here would need a second balance/plan fetch,
> contradicting decision 3 (a PRO user at 0 of 200 is rare in beta).

**Modal — `OutOfCreditsModal`** (values shown are today's config: PRO $29 / 200 credits / 3 pages):

- Title: `Not enough credits`
- Detail, numbers known (e.g. required 1, available 0):
  `This needs 1 credit — you have 0 left.`  *(pluralizes: "This needs 2 credits — you have 0 left.")*
- Detail, no numbers from the route:
  `You don't have enough credits left for this.`
- Upgrade card heading: `Upgrade to Pro`
- Upgrade card blurb: `200 AI credits every month, 3 published pages, and custom domains.`
- Price: `$29` `/month`   *(monthly only — decision 10; no annual figure anywhere in-app)*
- Primary CTA button (a LINK to `/dashboard/billing`): `See plans & top-ups`
  *(no note under the CTA — the Free-plan line was dropped at the gate)*
- Credit-costs block: `Credit costs:` then
  `Full page generation` `10 credits` · `Section regeneration` `2 credits` ·
  `Element variation` `1 credit`
- Close button: icon only, `aria-label="Close"`
- **NOT SHOWN this slice** (decision 3 — no second balance fetcher, so no reset date is known): the
  "Wait for reset" block. Its copy exists but is gated off:
  `Wait for reset` / `Your monthly credits refresh in N days.`

**Onboarding inline notice — `EntryInputStep`** (replaces the misleading generic error):

- With numbers: `Not enough credits — this needs 1 credit and you have 0 left.` *(approved as-is)*
- Without numbers: `You don't have enough credits left for this.` *(aligned on the modal at the gate)*
- Link (→ `/dashboard/billing`): `Get more credits`

## Open risks

- **The upgrade card is tier-blind.** The modal has no balance/plan fetch (decision 3), so a PRO user
  who exhausts 200 credits is still shown "Upgrade to Pro". **Founder ruling: DEFERRED to phase 6**
  (which rebuilds the billing view and already reads plan/tier); fixing it here would add a second
  fetcher against decision 3, and the case is rare in beta. Do not re-litigate in this phase.
- **`/dashboard/billing` is still the OLD billing page** — real, ugly, replaced in phase 6 (the gate
  explicitly does not review the destination).
- **Onboarding's 402 analytics suppression keys on `res.status !== 402`, not on the normalizer.** If
  a route ever emits a credit block at a non-402 status, it would log as `scrape_failed` AND show the
  credits notice. Left exactly as-is per the hard constraint; noted only as a latent seam.
- **No host outside the editor.** Dashboard/other trees that later spend credits must mount
  `CreditsBlockedHost` or the block goes silent again. Documented in both module headers; the bus
  cannot enforce it.
- The `⨯ ReferenceError: window is not defined` in the e2e web-server log is pre-existing dev-only
  noise from `useEditStoreBootstrap.ts:238`, unrelated to this phase (the page renders; spec passes).

---

## Phase 4 — post-review fixes

Two cheap follow-ups recommended by the impl-review (verdict was **ship**; these are not blockers).
Comments/docs + test-stub fidelity only — **no product-code behavior changed**.

**Files changed**
- `e2e/billing-beta.spec.ts`
- `src/hooks/editStore/aiActions.credits.test.ts`
- `src/app/onboarding/[token]/components/EntryInputStep.tsx` (comment only)
- `docs/task/billing-beta.audit.md`

### RETRACTION — the `details` claim above is FALSE

This audit asserts at **line 510** that `/api/regenerate-element`'s real body shape is
"Pattern B + `details`". **That is wrong. Retracted.** Verified against source this phase:

- The route (`route.ts:4,12`) calls `requireAICredits` → `createErrorResponse`
  (`planCheck.ts:193-203`), which emits **`{error, code}` and nothing else**.
- `details:{required,available}` belongs to `checkAIAccess` (`planCheck.ts:265-274`), which
  **this route never calls**. Scout §F was right to list the route under Pattern B; I conflated
  Pattern B with the checkAIAccess variant and propagated the invented `details` into two comments.

Consequence for **phase 6**: on this route the required/available numbers exist ONLY inside the
`error` string (`"Insufficient credits. Required: 1, Available: 0"`). The regex fallback in
`parseInsufficientCredits` is therefore **load-bearing, not a safety net** — do not remove it
assuming `details` is present. (The normalizer's `details` support noted at lines 145/195 remains
correct — other emitters, e.g. checkAIAccess callers, do send it.)

### FIX 1 — stub bodies now match what the route really emits
Removed the fabricated `details` from both stubs and corrected the comments to state the real
shape + why the regex fallback is the path under test.
- `e2e/billing-beta.spec.ts` — header comment + `page.route` fulfill body.
- `src/hooks/editStore/aiActions.credits.test.ts` — test name ("Pattern B, no details — emits via
  the regex fallback") + comment + `fetch` stub body.

Test fidelity, not a product bug: the spec passed with `details` stripped (the reviewer predicted
this), so the modal's numbers were already coming from the regex. The e2e now exercises the path
production actually depends on instead of a shape it never sends.

### FIX 2 — stale/misleading comment in `EntryInputStep.tsx:125-129`
The comment claimed the v2 routes "have no credit-blocking branch (credits are consumed post-hoc),
so every non-2xx here is a real failure" — demonstrably false, and it sat beside the `!== 402`
guard reading as that guard's justification. Verified the opposite in source: pre-check 402s at
`v2/scrape-website:239` and `:360`, `v2/understand:174`. Rewritten to state reality: the v2 routes
DO pre-check credits and emit Pattern A 402s, so the `!== 402` guard deliberately keeps credit
blocks OUT of `trackFailure('scrape_failed')` (funnel integrity) and the credits notice renders
instead. Pre-existing text from the data-capture phase; my change made it actively misleading.
**Guard behavior untouched — comment only.**

### Deviations
None.

### Test results
- `npx tsc --noEmit` — clean.
- `npm run test:run` — **215 files / 3630 passed**, 1 file + 18 skipped (pre-existing).
- `npm run lint` — no new errors (pre-existing `no-img-element` / `exhaustive-deps` warnings only).
- `npx playwright test e2e/billing-beta.spec.ts --project=authed` — **4 passed**; the credit-block
  test **EXECUTED** (`✓`, not `-`) and passes with the corrected `details`-free stub.

### Open risks
- None added. The pre-existing dev-only `window is not defined` web-server noise
  (`useEditStoreBootstrap.ts:238`) is unchanged and does not affect the spec.

---

## Phase 4 — founder-approved copy changes (post-gate)

**Files changed**
- `src/components/billing/OutOfCreditsModal.tsx`
- `src/components/billing/OutOfCreditsModal.test.tsx`
- `src/app/onboarding/[token]/components/EntryInputStep.tsx`
- `docs/task/billing-beta.audit.md`

Copy-only. No behavior, wiring, or config-read changes.

### `OutOfCreditsModal.tsx`
1. Title `Out of AI credits` → `Not enough credits` — **unconditional**, no branch on `available`
   (founder chose the flat rename; `available` is unknown on malformed 402 bodies). The old title
   overstated whenever the user held credits but fewer than the op costs.
2. Dropped the `free-note` line (`The Free plan includes 20 one-time credits.`) and its now-dead
   `const FREE = PLAN_CONFIGS[PlanTier.FREE]` read. `PLAN_CONFIGS` / `PlanTier` imports are still
   live (PRO), so nothing became an unused import — `lint` confirms.
3. `data-testid="free-note"` no longer exists in the DOM.

### `EntryInputStep.tsx`
Number-free fallback `You're out of credits, so we couldn't run this.` →
`You don't have enough credits left for this.` — exact modal wording. The WITH-numbers variant
(`Not enough credits — this needs N credit(s) and you have M left.`) is untouched, per the ruling.

### `OutOfCreditsModal.test.tsx`
- Removed the `renders the FREE one-time credit note` test and the fabricated-config probe's
  `free-note` assertion (assertion **removed**, not weakened — the probe still fabricates
  `PLAN_CONFIGS`/`CREDIT_COSTS` and pins name/price/credits/pages + all 3 cost rows, so it still
  fails the moment the component stops reading the modules).
- Added two tests pinning the NEW approved copy: the title is `Not enough credits` for BOTH
  `{required:10, available:2}` and the no-numbers case (pins the *unconditional* rename), and the
  Free note is gone (`free-note` null + no `/one-time credits/i` anywhere in the modal text).
- 12 passed (was 11).

### Deviations
None. The tier-blind "Upgrade to Pro" card was left alone per the founder's deferral to phase 6.

### Test results
- `npx tsc --noEmit` — clean.
- `npm run test:run` — **215 files / 3631 passed**, 1 file + 18 skipped (pre-existing).
- `npm run lint` — no new errors (pre-existing `no-img-element` / `exhaustive-deps` warnings only).
- `npx playwright test e2e/billing-beta.spec.ts` — **4 passed**; the credit-block test **EXECUTED**
  (`✓` under `[authed]`, not `-`). First run had one flaky failure in an UNRELATED test
  (`credit-badge` not found on a cold-started dashboard — copy-only changes cannot affect it); the
  re-run was 4/4 green.

### Open risks
- Tier-blind upgrade card persists until phase 6 (deferred by ruling, recorded above).
- Nothing else added.
