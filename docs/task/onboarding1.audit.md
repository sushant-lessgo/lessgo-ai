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

## Phase 2 — extraction routes: understand + scrape-website manufacturer branches

**Files changed**
- `src/app/api/v2/understand/route.ts` — modified
- `src/app/api/v2/scrape-website/route.ts` — modified
- `src/lib/schemas/scrapeWebsite.schema.ts` — modified (single authorized reconcile edit)

**Per file**
- `understand/route.ts`: optional `templateId` in request schema → `isManufacturer = !isService && isManufacturerFlow(templateId)` (absent → SaaS, unchanged). New inline `buildManufacturerUnderstandPrompt` (whatYouMake/industriesServed/productCategories/valueAdds with explicit anti-synonym/anti-fluff rules). Manufacturer mock branch. AI call parses with `ManufacturerUnderstandingResponseSchema` (name `manufacturer_understanding`). Credits metadata gains a manufacturer branch (`extractionShape: 'manufacturer'`, counts read the manufacturer keys — no `.categories/.audiences/.features` reads on that path, so no undefined `.length`). Credits cost unchanged (1, `CREDIT_COSTS.UNDERSTAND`). SaaS + service branches byte-identical.
- `scrape-website/route.ts`: same `templateId` → `isManufacturerFlow` signal. New `buildManufacturerScrapePrompt` — full extended-schema field list (schema is a superset) + the 4 manufacturer keys + same anti-fluff rules; landingGoal list includes `enquiry`. `MOCK_DATA_MANUFACTURER` (Golden Shadow-flavored, `landingGoal: 'enquiry'`, no facts/excerpts — mirrors SaaS mock shape). AI call parses with `ScrapeWebsiteManufacturerSchema` (name `scrape_website_manufacturer`). Shared strip/upsert/credits path unchanged (`data.testimonials` exists on all shapes). SaaS + service branches byte-identical.
- `scrapeWebsite.schema.ts` (reconcile): flipped the 4 manufacturer keys from `.optional()` to REQUIRED — `whatYouMake min(1)`, `industriesServed 1–3`, `productCategories 1–8`, `valueAdds 1–8` — matching `ManufacturerUnderstandingResponseSchema`; OpenAI strict structured outputs can reject optional-not-in-required, and required forces the extractor to fill them. SaaS `ScrapeWebsiteExtendedSchema` untouched.

**Deviations**
- Cache-hit guard (in-scope judgment call, scrape route): a SiteContext cache entry written by a SaaS-shaped scrape lacks the 4 manufacturer keys; manufacturer requests now skip such a hit (`'whatYouMake' in cached.extract` check) and fall through to a fresh crawl+extract (1 credit) rather than return an incomplete shape. SaaS cache behavior unchanged; manufacturer scrape's upsert stores the superset, so later SaaS reads still work.
- Manufacturer branches are curl-reachable only until Phase 3 wires `templateId` into the client fetch bodies — expected per plan.

**Mock-shape sanity (reasoned, mock mode)**
- POST `/api/v2/understand` with `templateId:'vestria'` → 4 manufacturer keys; without → SaaS 4 (`categories/audiences/whatItDoes/features`), byte-identical mock.
- POST `/api/v2/scrape-website` same split; manufacturer mock = SaaS client shape + 4 keys.
- Credits metadata never reads `.length` off missing keys on either shape.

**Test results**
- `npm run build` → exit 0.
- `npm run test:run` → 50 files passed | 1 skipped; 657 tests passed | 2 skipped; exit 0.

**Open risks**
- Real-LLM eyeball run against goldenshadowtrading.com (plan verification, 1 credit) not run here — needs live server + credits; first-pass quality check deferred to Phase 5 pilot (or a manual curl before it).
- Required manufacturer keys mean extraction of a site with truly zero value-adds would fail schema validation → `ai_error` (recoverable). Accepted: strictness is the point; retry path exists.
