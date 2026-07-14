# work-copy-engine — implementation audit

## Phase 1 — deterministic slim-strategy core (pure code, zero AI)

### Files changed
- ADD `src/modules/audience/work/pricePosition.ts`
- ADD `src/modules/audience/work/pricePosition.test.ts`
- ADD `src/modules/audience/work/slimStrategy.ts`
- ADD `src/modules/audience/work/slimStrategy.test.ts`
- ADD `src/modules/audience/work/voice.ts`
- ADD `src/modules/audience/work/voice.test.ts`
- ADD `docs/task/work-copy-engine.audit.md` (this file)

`src/modules/engines/workPages.ts` was **NOT touched** — see below.

### What was built

**pricePosition.ts** — `derivePricePosition(facts): 'premium'|'middle'|'friendly'`, pure/deterministic, no AI. Also exports `PricePosition`, `DEFAULT_PRICE_POSITION`, and the tuning constants.

Rubric (full text in the file header): two opposing scores summed from three signal families, then netted; `'middle'` is the safe default.
- PREMIUM: any group `on-request` +1; a high stated amount (max ≥ `HIGH_AMOUNT_HINT`=2000) +1; dreamClient premium keywords +2; praise premium keywords +1.
- FRIENDLY: a low stated amount (max ≤ `LOW_AMOUNT_HINT`=300) +1; dreamClient friendly keywords +2; every priced group uses `from` mode +1.
- CLASSIFY on `net = premium − friendly`: `net ≥ +2` → premium, `net ≤ −2` → friendly, else middle.
- Amount hints are deliberately WEAK (currency-naive; keywords + mode dominate) — documented as track-E tuning knobs. On-request-only with no other signal stays `middle` (conservative, not auto-premium).
- The Kundius-shaped premium fixture (established studio, `from €4500` + `on-request`, "discerning… editorial, timeless" dream client, premium praise) scores premium ≥ 4, friendly 0 → `'premium'` (asserted, and asserted `!== 'middle'`).

**slimStrategy.ts** — `assembleWorkStructure(facts, professionRow, signalsOverride?)` returns the deterministic half only (`WorkStructure`): archetype + ordered pages via `proposeWorkSiteStructure`; per-page section lists from each page's contract `defaultSections`; per-section collection plans with facts-derived `count` for the three facts-backed collections (`work.groups`, `packages.packages`, `proof.quotes`) clamped to the contract max (anti-padding: `count = min(actual, max)`, never forced up to `min`); curated `leadGroups` (cover-photo dominates, then story-kind, then size, stable on ties); `storyBranch` from establishment; `primaryLanguage = languages[0] ?? 'en'`; profession `wording` from `professionWording`. Also exports `deriveStructureSignals`. Calls `proposeWorkSiteStructure` — never edits it.

**voice.ts** — `WorkVoiceSpec` + `selectWorkVoice({professionRow, pricePosition, establishment})` + `formatWorkVoiceForPrompt` + `resolveWorkProfession`. Composed from three orthogonal axes (profession identity × price-position tone/lexicon × establishment authority note) rather than a fixed set. Forbidden lexicon = shared marketing-fluff base + per-position additions (premium forbids cheap/affordable/…; friendly forbids exclusive/luxury/…). The `new` establishment note carries explicit anti-invention language. NEVER keyed to templateId/skeletonId; the format output is asserted free of template names.

### workPages.ts decision (plan N2)
`proposeWorkSiteStructure` is fully implemented with a documented rubric, and its threshold constants are genuinely usable: `ONE_PAGER_MAX_ITEMS=3`, `STANDARD_MIN_GROUPS=3`, `PROMOTE_GROUP_MIN=2`. These produce correct one-pager / compact / standard selection for realistic fixtures (verified by the archetype tests). No verified-unusable value blocks correct archetypes, so per the plan (amend ONLY if a value is unusable) the file was **left untouched**.

### Deviations from the plan
- **`assembleWorkStructure` signals param.** The plan signature lists `(facts, professionRow, signals)`. Since the structure signals are fully derivable from facts (plan §2: "everything decidable from facts is decided here"), the third arg is an OPTIONAL override (`signalsOverride?`) and the function derives signals from facts by default. Conservative, in-scope choice — no caller yet exists, and default behavior is fully deterministic-from-facts.
- **`professionRow` input type.** Typed as `Pick<BusinessTypeEntry, 'key'>` (only `.key` is read) so callers can pass a real `businessTypes.*` row or a minimal object; `resolveWorkProfession` maps the key to a `WorkProfession`, defaulting unknown keys to `'photographer'` (the pilot profession) — documented.
- **`storyBranch` default = `'established'`** when the establishment slot is absent. Rationale: praise in facts is verbatim testimonials; treating an absent slot as `new` would reframe real praise as "what to expect" and is the less common case. Anti-invention is still enforced downstream by the `new` voice note regardless. Logged here as an in-scope judgment call.
- Praise-count anti-padding: `count = min(actual, max)`; counts are NOT forced up to the contract `min` (inventing empty cards = padding, forbidden). `min`/`max` are reported alongside for the copy phase.

### Test results
- `npx tsc --noEmit`: clean for all Phase-1 files. One PRE-EXISTING unrelated error remains — `src/app/page.tsx(6,26)` missing `@/assets/images/founder.jpg` — a file NOT in this phase and not touched here.
- New tests: `src/modules/audience/work` — 3 files, 31 tests, all pass (incl. Kundius→premium, determinism, archetype selection, card-count clamp/no-pad, story-branch fork, price-position edge cases, voice keying matrix + firewall).
- Full suite `npm run test:run`: 170 passed | 1 skipped (171 files); 2885 passed | 15 skipped (2900 tests). No regressions.

### Open risks
- Amount hints (`HIGH_AMOUNT_HINT`/`LOW_AMOUNT_HINT`) are currency-naive; they are weak (+1, never decisive alone) and keyword/mode-dominated, but real INR/EUR/USD tuning is a track-E concern.
- `storyBranch` default (`established`) is a judgment call; revisit if the founder wants absent-slot to be conservative-`new`.

## Phase 2 — work strategy route (the ONE small AI call)

### Files changed
- ADD `src/lib/schemas/workStrategy.schema.ts`
- ADD `src/modules/audience/work/strategy/promptsWork.ts`
- ADD `src/modules/audience/work/strategy/parseStrategyWork.ts`
- ADD `src/modules/audience/work/strategy/parseStrategyWork.test.ts`
- ADD `src/modules/audience/work/promptFirewall.ts`
- ADD `src/modules/audience/work/promptFirewall.test.ts`
- ADD `src/modules/prompt/mockResponseGeneratorWork.ts`
- MODIFY `src/lib/modelConfig.ts`
- ADD `src/app/api/audience/work/strategy/route.ts`

### What was built

**workStrategy.schema.ts** — `WorkStrategyResponseSchema` = a zod object with ONLY `positioningAngle` (string), `storyAngle` (string), `voiceNotes` (string[]≥1). The tiny surface IS the AC-3 enforcement point: zod strips any structural key the model returns, so the AI can never contribute structure.

**promptFirewall.ts** — work clone of the product firewall, but TWO guards (the plan asked for "prompt string OR engine input object"):
- `assertNoTemplateLeak(input, where)` — object-key guard; forbidden keys `templateId`/`skeletonId`/`variantId` (added `skeletonId` vs product's two).
- `assertNoTemplateNamesInText(text, where)` — string scan over `TEMPLATE_NAME_TOKENS` (atelier/granth/lumen/meridian/techpremium/hearth/lex/vestria/surge + the 3 identity keys). Both dev-only throw, prod no-op.

**promptsWork.ts** — `buildWorkStrategyPrompt(input)`: lean strategy prompt from businessName + profession/workNoun + pricePosition + establishment branch + dreamClient + verbatim praise + group names + primaryLanguage + the pre-rendered voice block. Calls `assertNoTemplateLeak(input)` at entry and `assertNoTemplateNamesInText(prompt)` at exit. Asks the model for ONLY the 3 angle fields and states structure is already decided in code.

**parseStrategyWork.ts** — `assembleWorkStrategy({ llmResponse, facts, professionRow, structure? })`: calls phase-1 `assembleWorkStructure` for the deterministic half, reads the AI response ONLY for the 3 narrative fields. Applies the shared `clampSectionList` (imported from product `parseStrategyProduct.ts`, never edited) to the home body → chrome at edges, hero first, required sections present. Returns `WorkStrategyOutput`.

**mockResponseGeneratorWork.ts** — `generateMockWorkStrategy({facts, professionRow})` returns a canned `WorkStrategyResponse` run through the REAL `assembleWorkStrategy` (real structure, canned angles). Plus a phase-3 placeholder `generateMockWorkCopy` returning `{}` (kept minimal; fleshed in phase 3).

**modelConfig.ts** — added `'work-strategy'` and `'work-copy'` to the `Endpoint` union + MODELS rows in BOTH tiers: cheap = GPT-4o-mini/Haiku (mirrors `strategy`/`copy`), production = Sonnet/GPT-4o. Global `AI_MODEL_OVERRIDE` logic untouched.

**route.ts** (`/api/audience/work/strategy`) — mirrors the product strategy route: request schema `{ brief: BriefSchema }`, reads `getWorkFacts(brief.facts)` (400 if absent), `requireAuth`, `withAIRateLimit`, `professionRow` from `brief.businessType`. Mock path (NEXT_PUBLIC_USE_MOCK_GPT or DEMO_TOKEN bearer) → `generateMockWorkStrategy` with `meta.mock`, 0 credits. Real path: derive pricePosition + voice, build prompt, `generateWithSchema('work-strategy', …, WorkStrategyResponseSchema, 'workStrategy')`, `assembleWorkStrategy`, then `consumeCredits(userId, UsageEventType.STRATEGY_GENERATION, CREDIT_COSTS.STRATEGY_GENERATION, …)` — the SAME event/cost as product (no new credit event).

### WorkStrategyOutput shape (settled)
Parallel to `ProductStrategyOutput` — deterministic structure + narrative fields:
- AI narrative: `positioningAngle: string`, `storyAngle: string`, `voiceNotes: string[]`
- Deterministic: `sections: string[]` (home incl. chrome, via clampSectionList), `uiblocks: Record<string,string>` (section → template-AGNOSTIC contract sectionType — the concrete skin/block resolves later, never here; firewall), `sitemap: WorkSitemapPage[]` ([0]=home; `{archetypeKey,title,pathSlug,sections}` parallel to product `SitemapPage`), plus deterministic context the copy phase needs: `archetype`, `leadGroups`, `storyBranch`, `primaryLanguage`, `wording`.

### How the route mirrors product (auth/credits/mock)
- Auth: `requireAuth(req)` + `withAIRateLimit` wrapper — identical to product.
- Credits: reuses `UsageEventType.STRATEGY_GENERATION` + `CREDIT_COSTS.STRATEGY_GENERATION`; consumed AFTER assembly; failure warns but does not fail the response — identical pattern.
- Mock: same DEMO_TOKEN + NEXT_PUBLIC_USE_MOCK_GPT gate, `meta: { mock: true }`, 0 credits.

### Deviations from the plan
- **Firewall = two functions, not one.** The plan said "clone product's `assertNoTemplateLeak`". Product's is object-key-only, but the plan text also required guarding "any prompt string". I added a second guard `assertNoTemplateNamesInText` (string scan) rather than overloading one function, and wired both into the prompt builder. In-scope, conservative — strictly stronger than the product clone.
- **`uiblocks` = identity map to contract sectionType.** Product `uiblocks` are template block/layout names, but the work strategy is template-agnostic (firewall) and no work block registry is in this phase's scope. So `uiblocks[section]` = the contract sectionType (== the key). Keeps the ProductStrategyOutput-parallel shape without leaking template identity; the real skin/block resolves downstream. Documented in the file header.
- **`WorkStrategyRequestSchema.brief` is REQUIRED** (product's is `.optional()`). The work engine has no meaningful behavior without facts, so the route requires the Brief and 400s if `facts.work` is absent. In-scope judgment call.
- **`WorkStrategyOutput` type lives in `parseStrategyWork.ts`** (not a shared types file) — no types file was on the Files-touched list; mirrors how the assembler owns the type locally.
- **`professionRow` cast** — `brief.businessType` is an open string; cast to `WorkProfessionRow` (only `.key` is read + mapped by `resolveWorkProfession`, which defaults unknowns). Safe; commented at the cast site.

### Test results
- `npx tsc --noEmit`: clean except the pre-existing unrelated `src/app/page.tsx(6,26)` missing `@/assets/images/founder.jpg` (not in scope, ignored per instructions).
- New tests: `promptFirewall.test.ts` (object-key guard throws on each forbidden key; string guard throws on each template token; `buildWorkStrategyPrompt` produces no template names, throws when salted with templateId/skeletonId, still carries seller facts — AC-7 first half) + `parseStrategyWork.test.ts` (narrative copied from AI; structure IDENTICAL across two different AI responses on the same facts; home leads sitemap; clampSectionList law; schema STRIPS structural contraband and rejects missing narrative fields — AC-3 second half). Work module: 5 files, 45 tests, all pass.
- Full suite `npm run test:run`: 172 passed | 1 skipped (173 files); 2899 passed | 15 skipped (2914 tests). No regressions (up 2 files / 14 tests from phase 1).
- `npx eslint` on all 9 touched files: clean, no errors introduced.

### Open risks
- `TEMPLATE_NAME_TOKENS` is a manual roster — a NEW work template name not added here would slip the string guard. Low risk (dev-only guard; roster covers all current templates); noted for whoever adds a template.
- `uiblocks` identity map is a phase-2 placeholder shape; phase 3/5 copy generation must confirm it reads `sections`/`sitemap` (not `uiblocks` block names) or that the identity map suffices.
