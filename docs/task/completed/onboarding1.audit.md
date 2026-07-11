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

## Phase 3 — onboarding UI: manufacturer fields + hydration + de-SaaS copy + goal gating

**Files changed**
- `src/hooks/useProductGenerationStore.ts` — NOT modified (verified only)
- `src/app/onboarding/product/[token]/components/steps/UnderstandingStep.tsx` — modified
- `src/app/onboarding/product/[token]/components/steps/OneLinerStep.tsx` — modified
- `src/app/onboarding/product/[token]/components/steps/OfferStep.tsx` — modified
- `src/app/onboarding/product/[token]/components/steps/GoalStep.tsx` — modified

**Per file**
- `useProductGenerationStore.ts`: verified `setUnderstanding` (~:171) assigns the FULL `UnderstandingData` object (`state.understanding = data`) — optional manufacturer keys pass through untouched. No field-picking → zero edits needed; file left byte-identical.
- `UnderstandingStep.tsx`: (a) manufacturer branch renders 4 blocks reusing in-file primitives — WhatYouMake (Textarea, 200 max), IndustriesServed (ChipEditor, max 3), ProductCategories (ChipEditor, max 8), ValueAdds (FeatureListEditor, max 8) — SaaS JSX moved into the else-arm byte-identical; 4 manufacturer updaters added. (b) `/api/v2/understand` fetch body now sends `{ oneLiner, templateId }`; manufacturer hydration writes the 4 mfr keys and PADS `categories:[]/audiences:[]/whatItDoes:''/features:[]` (D2). (c) manufacturer `isValid` short-circuits BEFORE the SaaS check (4 mfr fields non-empty + valueAdds all non-blank); SaaS expression unchanged. `templateId`/`isManufacturer` added to `callUnderstandAPI` deps.
- `OneLinerStep.tsx`: (a) scrape hydration branches — manufacturer writes all 8 keys (`?? ''`/`?? []` defaults; scrape mfr response also carries SaaS keys, taken when present, padded otherwise); SaaS writer byte-identical. (b) de-SaaS copy behind branch: manufacturer examples (uniforms/CNC/private-label), one-liner placeholder "Custom workwear manufacturer for hotels and hospitals", product-name placeholder "Apex Uniform Works". (c) scrape body now `{ url, templateId }`.
- `OfferStep.tsx`: manufacturer branch — examples ("Request a quote — MOQ 50 units, samples in 7 days" etc.), placeholder, and sub-heading ("a quote, samples, a catalogue") swapped; SaaS strings byte-identical.
- `GoalStep.tsx`: `visibleGoals` — manufacturer sees all 7 incl. `enquiry`; non-manufacturer filters `enquiry` out (`enquiry` is appended LAST in `landingGoals`, so the filtered list is the original 6 in original order — byte-for-byte criterion holds).

**Deviations**
- Race-hardening (D1 optional: gate OneLinerStep submit/import on templateId resolution) — NOT added. Kept D1 behavior as-is per plan's "accepted for pilot"; conservative/smaller diff.
- `templateId` is sent unconditionally in both fetch bodies (also for SaaS `'meridian'`) — routes derive `isManufacturerFlow('meridian') === false` → SaaS branch, so SaaS behavior unchanged; avoids conditional-body complexity.
- Manufacturer understand hydration pads SaaS fields to `[]/''` (route returns only 4 mfr keys); scrape hydration takes SaaS keys from response when present (mfr scrape shape includes them) — both satisfy D2, `.length` reads safe either way.

**Test results**
- `npm run build` → exit 0 (full build).
- `npm run test:run` → 50 files passed | 1 skipped; 657 tests passed | 2 skipped; exit 0.
- Reasoned parity check: SaaS path — same 4 fields (identical JSX in else-arm), same 6 goals (filter removes only the appended `enquiry`), all original strings intact; manufacturer path — 4 new fields, hydrates from scrape AND manual understand, 7th goal visible, de-SaaS placeholders/examples.

**Open risks**
- Persona-fetch race window remains (accepted, D1): manufacturer submitting on step 1 before `/api/user/persona` resolves takes SaaS branch.
- Manual dev-server walk (plan's manual verification) not run in this phase — recommend covering during Phase 5 pilot / impl-review.

## Phase 4 — downstream generation wiring (strategy + copy consume manufacturer fields)

**Files changed**
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` — D3 client remap on `isManufacturerFlow(storeTemplateId)`: `features ← valueAdds`, strategy body `otherAudiences ← industriesServed`, `categories ← productCategories`, `whatYouMake` added to strategy body; fan-out `fanFeatures ← ob.understanding.valueAdds ?? features` (vestria-only path). SaaS path passes the old fields exactly as before.
- `src/app/onboarding/product/[token]/components/steps/SitemapReviewStep.tsx` — same D3 remap in the sitemap-gate strategy fetch body (this is where vestria strategy is actually charged).
- `src/app/api/audience/product/strategy/route.ts` — zod widened with `whatYouMake: z.string().optional()`; derives `voiceId` via `isManufacturerFlow(data.templateId)` → `'tailored-trade'` else `'modern-tech'` (mirror of generate-copy:156); passes `voiceId` + `whatYouMake` into `buildProductStrategyPrompt`. Firewall intact — templateId never enters the prompt builder (`assertNoTemplateLeak` untouched, input carries only the derived voice).
- `src/modules/audience/product/strategy/promptsProduct.ts` — input gains `voiceId?: ProductVoiceId` + `whatYouMake?`; `isTrade` branch: `What they make:` line after Categories, `Other audiences:` relabeled `Industries served:`, trailing framing paragraph branched (tailored-trade: "manufacturer / trade-supplier page — concrete, capability-led, enquiry-driven, no startup hype"). SaaS output byte-identical (proven by frozen-baseline test).
- `src/modules/audience/product/copyPrompt.ts` — existing `isTrade` branch: features block header relabeled "Value-adds / USPs (raw, from the founder):". SaaS byte-identical.
- `src/modules/audience/product/promptBranch.test.ts` (NEW) — SaaS strategy+copy prompts asserted byte-identical to frozen inline baselines CAPTURED FROM THE PRE-PHASE-4 BUILDERS (captured before editing, then frozen as JSON-escaped literals); manufacturer prompts asserted to contain `What they make:` / `Industries served:` / value-adds label / trade framing and to NOT contain `Other audiences:` / "Modern Tech" / builder-to-builder / Meridian identity.

**voiceId threading**: client sends `templateId` (already did) → strategy route derives `voiceId` via `isManufacturerFlow` → prompt builder receives voice only (same D4 pattern as generate-copy). Copy side needed no new plumbing — route already derived `tailored-trade`.

**Framing-paragraph branch**: promptsProduct.ts trailing paragraph now a `framing` const branched on `isTrade`; SaaS string preserved character-for-character.

**Deviations**
- Conservative fallbacks in the remaps (`valueAdds ?? features`, `productCategories ?? categories`) per D2's sanctioned mapping style — keeps old-shape vestria drafts (Golden Shadow v1) generating instead of sending empty `features` (strategy zod requires min 1).
- `whatYouMake` only added to the body when non-empty (optional key; keeps prompt clean).
- `primaryAudience` untouched for manufacturer (plan remaps only the 3 keys + whatYouMake); manufacturer padding leaves `audiences` empty → falls back to 'early adopters'. Flagged for Phase 5 pilot eyeball.

**Tests/build**
- `npm run test:run`: 51 passed | 1 skipped (665 tests passed | 2 skipped) — includes new `promptBranch.test.ts` (8 tests).
- `npm run build`: green.

**Open risks**
- Frozen copy-prompt baseline covers a 2-section (hero+cta) Meridian fixture — layout-schema edits to those sections will legitimately require re-freezing the baseline.
- Manufacturer real-LLM prompt quality unverified until Phase 5 pilot (mock short-circuit precedes prompt build; unit test is the verification, per plan).

**Follow-up fix (post-Phase-4): manufacturer primaryAudience fallback**
- Resolves the Deviation flagged above ("falls back to 'early adopters'"): in `GeneratingStep.tsx` (~:546) and `SitemapReviewStep.tsx` (~:97), the `primaryAudience` fallback is now gated on the existing `isMfr` flag — manufacturer defaults to `'trade buyers / procurement teams'` when `audiences[0]` is empty; SaaS keeps `audiences[0] || 'early adopters'` exactly as before.
- No test changes needed: `promptBranch.test.ts` manufacturer fixture sets `primaryAudience: 'procurement managers'` explicitly and never asserts the fallback string; SaaS byte-baselines untouched.
- Verify: `npx tsc --noEmit` exit 0; `npm run test:run` 51 passed | 1 skipped (665 passed | 2 skipped).
