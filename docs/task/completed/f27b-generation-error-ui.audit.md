# F27b audit — humanize generation validation errors + gate Continue on failure

Branch: `fix/lane-c`. Scope: presentation half of F27 only (the `legal_links`
prompt-schema + coercion fix landed separately). Per-template element scoping is
explicitly OUT of scope and untouched.

## Files changed

- `src/modules/wizard/generation/errorMessage.ts` — NEW (plain helper).
- `src/modules/wizard/generation/errorMessage.test.ts` — NEW (unit test).
- `src/components/onboarding/wizard/GeneratingSlot.tsx` — MODIFIED.
- `src/components/onboarding/wizard/StructureSlot.tsx` — MODIFIED.
- `src/components/onboarding/wizard/WizardShell.tsx` — MODIFIED.

## Where the failure states live

- **Copy generation failure (the F27 blob):** AI response fails
  `CopyResponseSchema.parse` inside `generateRawJson` (`src/lib/aiClient.ts:239`).
  ZodError's `.message` IS a stringified issue array. The copy route
  (`src/app/api/audience/product/generate-copy/route.ts:239,252`) forwards that as
  `lastError` → response `message`. `runCopyAndSave`/`runFanOut` in `thing.ts`
  surface it as `result.error`, and **`GeneratingSlot`** renders it verbatim in the
  `ErrorRetry` "Generation hit a snag" panel — this was the ~1.2 kB JSON leak.
- **Strategy failure (F21 family):** fetched pre-gate by the store's
  `fetchStrategy` (`useWizardStore.ts:904`), displayed on the **StructureSlot**
  (step 7) error branch. Continue was NOT gated there ("stays available" comment).
- The human sibling strings that already read correctly originate at their source
  (`src/lib/rateLimit.ts` "Too many requests…", `src/lib/scrape/fetchSite.ts`
  "Could not read that website."). They are plain sentences, so the new guard
  passes them through untouched.

## What changed

1. **`errorMessage.ts`** — `humanizeGenerationError(raw)`: pure string→string.
   Detects a raw ZodError / JSON blob (leading `[`/`{`, `ZodError`, or Zod issue
   markers like `"code":`, `invalid_type`, `invalid_union`) and returns ONE human
   sentence (`GENERIC_SCHEMA_ERROR`). Empty/missing → `GENERIC_GENERATION_ERROR`.
   Anything else (hand-written siblings) passes through verbatim. It never logs —
   the full error is already captured server-side (route `logger.error(... aiError)`
   at generate-copy route lines 240/306), so no double-log.
2. **`GeneratingSlot.tsx`** — routed the two generation-outcome error setters
   (`result.error` and the catch `e.message`) through `humanizeGenerationError`.
   The already-human setters (missing token, work-count guard) are left as-is.
   Also clears the store's `generationError` on (re)run so the shell gate is
   accurate after a retry.
3. **`StructureSlot.tsx`** — the strategy-error paragraph now runs `strategyError`
   through `humanizeGenerationError` (defends the strategy path too). Updated the
   stale "Continue stays available" comment.
4. **`WizardShell.tsx`** — `gateBlocked` now returns true when the STRUCTURE slot
   shows `strategyStatus === 'error'`, and when the GENERATING slot has a
   `generationError`. Continue is disabled; `Try again` and `Skip to editor`
   (GeneratingSlot) / `Try again` + Back (StructureSlot) remain the escape hatches.

## Deviations from plan

- No explicit Files-touched list was handed down; I kept the change to the two
  failure-state components + the shell that owns Continue + one new plain helper &
  its test. No API routes, schemas, or prompts touched (element-scoping out of
  scope). Conservative choice: humanize at the two UI display chokepoints rather
  than editing every per-engine adapter return — one code path, covers thing/
  trust/work uniformly.
- Added a defensive `generationError`-clear in `GeneratingSlot.run()` (in scope,
  same file) so the new shell gate can't get stuck after a successful retry.

## Test results

- `npx vitest run src/modules/wizard/generation/errorMessage.test.ts` — 5 passed
  (raw blob → human, real thrown ZodError.message → human, prefixed/embedded
  markers → human, siblings preserved, empty → generic; asserts no `{`/`[`/`"code"`
  leak).
- `npx vitest run src/modules/wizard/generation/` — 46 passed (no regression in
  thing/trust adapters).
- `npx tsc --noEmit` — clean.

## Open risks

- `humanizeGenerationError` is heuristic. A hand-written sentence that literally
  starts with `[`/`{` would be rewritten, but no current error source does that.
- The Continue gate on the generating slot is belt-and-braces (that slot is
  terminal, so `isLast` already disables Continue); it holds if slot order changes.
- `setGenerationError` is still called during GeneratingSlot render (pre-existing
  anti-pattern, noted in the scale-06 audit) — untouched here.
