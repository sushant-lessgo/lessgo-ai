# F27 (generation-killing half) — audit

## Files changed
- `src/modules/audience/product/copyPrompt.ts` — added `legal_links` to the Collection-schemas block.
- `src/lib/schemas/copy.schema.ts` — tolerant coercion: lone object in an array element → `[object]` before zod validation.
- `src/modules/audience/product/promptBranch.test.ts` — updated frozen `COPY_SAAS_BASELINE`; added two `legal_links` prompt assertions.
- `src/lib/schemas/copy.schema.test.ts` — new; tests the tolerant coercion.

## What changed, per file

### src/modules/audience/product/copyPrompt.ts
Added one line to the "Collection schemas (for array fields — emit the exact shape)"
block, right after `link_columns`:
`- legal_links: array of { id: "", label: string, href: string }   (0-4 items; legal/policy links like "Privacy Policy", "Terms of Service", "Cookie Policy")`
Shape matches the only two consumers of `legal_links` (grepped): techpremium
`TechPremiumFooter(.published).tsx` (`FooterLink = { id, label, href }`) and lumen
`LumenFooter(.published).tsx` (`LegalLink = { id, label, href }`; lumen's `label_nl`
is a bilingual extra, not part of the AI-filled shape). `legal_links` is
`fillMode:'ai_generated'` only in the **product** element schema; the service schema
declares it `manual_preferred`, so it is never AI-requested there — the product
copyPrompt is the sole prompt that needs the entry.

### src/lib/schemas/copy.schema.ts
Renamed the union to `ElementValueUnion` and wrapped it in a `z.preprocess` that
narrowly coerces a lone plain object → single-element array. Guard skips: `null`,
arrays, strings, and the `{ value, needsReview }` review-sentinel. Since only
array/collection elements ever carry an object value from the model, the coercion
only affects those — string/scalar elements are untouched. This is the actual zod
validator that hard-failed in F27 (`CopyResponseSchema` → `ElementValueSchema`),
consumed by both product and service `generate-copy` routes via
`generateRawJson(...).parse()`.

### src/modules/audience/product/promptBranch.test.ts
- Updated the byte-identical `COPY_SAAS_BASELINE` to include the new `legal_links`
  line (deliberate re-baseline, per the file's own convention).
- Added a `describe('F27 …')` with two assertions: SaaS and manufacturer copy
  prompts both now contain the `legal_links` array-shape line.

### src/lib/schemas/copy.schema.test.ts (new)
Six assertions: lone `legal_links` object coerced to `[object]`; drift case
`link_columns` object coerced instead of throwing; proper arrays untouched;
`{ value, needsReview }` sentinel preserved; strings / string-arrays / null
untouched.

## Deviations from the plan
1. **Coercion location.** The task pointed at `src/modules/prompt/` (`parseAiResponse`
   or its element validation). The live generation path does **not** use
   `parseAiResponse.ts` (a legacy monolithic parser); the zod validation that actually
   dies in F27 is `ElementValueSchema` in `src/lib/schemas/copy.schema.ts`, invoked by
   the audience `generate-copy` routes through `generateRawJson`. Editing
   `parseAiResponse.ts` would have had zero effect on the bug. Implemented the coercion
   in `copy.schema.ts` — the real "element validation" — to match the task's unambiguous
   mechanism ("coerce a lone object → `[object]` before zod validation"). Conservative
   choice; the mechanism is exactly as specified, only the file differs from the guess.
2. **Narrowness.** The zod layer is a generic `z.record` with no element-name/array
   metadata, so "only elements the schema declares as arrays" is enforced structurally:
   only non-sentinel objects are wrapped, and only collection elements ever receive an
   object value from the model. String/scalar elements are provably unaffected.

## Tests
- `npx vitest run src/lib/schemas/copy.schema.test.ts src/modules/audience/product/promptBranch.test.ts src/modules/audience/service/__tests__/normalizeServiceCopy.test.ts` → **3 files, 23 passed**.
- `npx tsc --noEmit` → clean (exit 0).
- Full suite NOT run (parallel agents on disjoint files, per instructions).

## Out of scope (untouched, per task)
- Error-message UI for the raw ZodError blob — F27's presentation half.
- Per-template element scoping (`legal_links` requested on vestria which never renders
  it) — tracked as F27b.

## Open risks
- The coercion wraps ANY non-sentinel lone object. If the model ever emits an object
  for a genuinely scalar element, it becomes `[object]` rather than failing — a
  degenerate case that previously killed the whole generation, so strictly an
  improvement, but downstream (`processProductCopy`) sees an array where it may expect
  a string. Low likelihood (models emit strings for scalar fields).
- `captureGolden.test.ts` (opt-in real-LLM, `CAPTURE=1`) also parses via
  `CopyResponseSchema`; not run here (no LLM), but the coercion only widens acceptance,
  so it cannot newly fail a previously-passing capture.
