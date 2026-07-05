# onboarding1 — audit

## Phase 1 — types + goal enum + schemas + mocks foundation

**Files changed**
- `src/types/generation.ts` — modified
- `src/modules/audience/product/manufacturerFlow.ts` — NEW
- `src/lib/schemas/understand.schema.ts` — modified
- `src/lib/schemas/scrapeWebsite.schema.ts` — modified
- `src/app/onboarding/product/[token]/components/steps/GoalStep.tsx` — modified
- `src/modules/audience/product/copyPrompt.ts` — modified

**Per file**
- `src/types/generation.ts`: added `'enquiry'` to `landingGoals`; `landingGoalLabels.enquiry = 'Send enquiry'`; extended `UnderstandingData` with optional `whatYouMake? / industriesServed?[] / productCategories?[] / valueAdds?[]` (D2 — 4 SaaS fields stay required).
- `src/modules/audience/product/manufacturerFlow.ts` (NEW): `isManufacturerFlow(templateId) => templateId === 'vestria'`. Plain module (no `'use client'`); comment marks it as the single home of the manufacturer↔vestria 1:1 assumption.
- `src/lib/schemas/understand.schema.ts`: added parallel `ManufacturerUnderstandingResponseSchema` (whatYouMake min(1); industriesServed 1–3; productCategories 1–8; valueAdds 1–8) + inferred type. SaaS schema untouched.
- `src/lib/schemas/scrapeWebsite.schema.ts`: added parallel `ScrapeWebsiteManufacturerSchema = ScrapeWebsiteExtendedSchema.extend({4 optional keys})` + inferred type. Existing SaaS parse path byte-for-byte untouched (parallel schema chosen over widening the superset — smaller diff, no drift in the structured-outputs schema SaaS sends to the model).
- `GoalStep.tsx`: entries only — `goalIcons.enquiry` (lucide `Mail`), `goalDescriptions.enquiry = 'Get enquiries / quote requests from buyers'`. No gating/branching (Phase 3).
- `copyPrompt.ts`: `enquiry` entry in `getGoalCtaGuidance` map — "Send enquiry / Request a quote / Get in touch", every CTA points to on-page contact form. Nothing else changed.

**Deviations**
- None from plan scope. Env note: `node_modules/.bin` was missing at start (deps half-installed); ran `npm install --ignore-scripts` + `npx prisma generate` to restore toolchain (no DB touch — postinstall's `migrate deploy` skipped intentionally). No source impact.
- `objectionFlowEngine.ts:666` (different enum `LandingGoalType`) untouched, per plan.

**Test results**
- `npx tsc --noEmit` → exit 0.
- `npm run build` → exit 0 (full build incl. published-css + assets).
- `npm run test:run` → 50 files passed | 1 skipped; 657 tests passed | 2 skipped; exit 0.

**Open risks**
- As flagged in plan: `enquiry` now renders as a 7th goal for ALL product personas until Phase 3 gates it to manufacturer flow. Feature-branch-only state, intentional.
- `ScrapeWebsiteManufacturerSchema` keys are `.optional()` per plan wording; Phase 2 may want them required for structured-outputs strictness — decision deferred to route wiring.
