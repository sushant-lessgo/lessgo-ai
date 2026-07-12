# onboarding-fixes — implementation audit

## Phase 1 — Seed shape: offer looks like an offer, proof is numeric-or-empty

**Files changed**
- `src/app/api/v2/scrape-website/route.ts`
- `src/app/api/v2/understand/route.ts`
- `src/hooks/useWizardStore.ts`
- `src/hooks/useWizardStore.test.ts`

### Per-file changes

**`src/app/api/v2/scrape-website/route.ts`** — `buildScrapePrompt`, the `offer:` line. Rewrote to state the offer is the action/deal the VISITOR takes or gets, phrased as that action (e.g. "Start a free 14-day trial", "Book a demo", "Contact sales"); it must NEVER be the business or product name; return `""` if none evident. No schema change — `offer` stays a string.

**`src/app/api/v2/understand/route.ts`** — `buildEntryUnderstandPrompt`, the `offer:` line. Same anti-name guard, same wording pattern. No schema change.

**`src/hooks/useWizardStore.ts`** — `prefillValueFor` chips/upload branch now routes array prefills through a new tiny local helper `applyPrefillArrayFilter(field, values)`. That helper is the ONLY place the numeric-or-empty rule lives: when `field.id === 'realNumbers'` it keeps only entries matching `/\d/` (contains a digit); all other fields pass through unchanged. Scoped by `field.id` (unique to the thing engine), never by `prefillKey` (shared as `outcomes` across thing/trust/work). `entryClassify.schema.ts` was NOT touched.

**`src/hooks/useWizardStore.test.ts`** — added a `proof prefill numeric filter (phase 1)` describe with 3 cases: (a) thing `realNumbers` drops non-numeric entries and keeps numeric ("cut churn by 30%", "ISO 9001 certified" kept; "days to minutes", "trusted by teams" dropped); (b) empty outcomes → `[]`; (c) trust `outcomes` (shared field) passes through UNFILTERED even with zero digits.

### Documented tradeoff (not a bug)

The "contains a digit" filter is intentionally coarse: it DROPS legitimately non-numeric proof (e.g. "cut onboarding from days to minutes") and KEEPS numeric-adjacent non-metrics (e.g. "ISO 9001 certified"). This matches the spec's "actual numbers" intent. The empty state is already covered by `SlotReviewCard`'s placeholder examples. Recorded here so it isn't later mistaken for a defect.

### Deviations

None. Followed the plan exactly. `entryClassify.schema.ts` deliberately untouched (shared-field regression risk per plan).

### Verification

- `npx tsc --noEmit`: one error — `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'`. PRE-EXISTING and unrelated (the asset exists as `.jpg`; it's a missing module type declaration; `page.tsx` is not in this phase's diff). None of the four touched files produce type errors.
- `npm run test:run`: 163 passed | 1 skipped (164 files); 2778 passed | 15 skipped (2793 tests). Includes the 3 new proof-filter tests.

### Open risks

- Steps 1–2 are prompt-string changes only; fixture tests cannot assert AI-output drift. Manual real-LLM verification (URL import on a real SaaS site — step 4 shows an offer-shaped phrase not the name; step 5 shows numeric claims or empty-with-placeholder) is load-bearing and still pending.
