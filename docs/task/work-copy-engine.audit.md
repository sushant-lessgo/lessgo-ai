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

## Phase 3 — work copy prompt + parser + generate-copy route

### Files changed
- ADD `src/modules/audience/work/workLibrary.ts`
- ADD `src/modules/audience/work/copyPrompt.ts`
- ADD `src/modules/audience/work/copyPrompt.factsLaw.test.ts`
- ADD `src/modules/audience/work/injectPraise.ts`
- ADD `src/modules/audience/work/injectPraise.test.ts`
- ADD `src/modules/audience/work/parseCopy.ts`
- ADD `src/modules/audience/work/parseCopy.test.ts`
- MODIFY `src/modules/prompt/mockResponseGeneratorWork.ts` (fleshed out the copy mock)
- ADD `src/app/api/audience/work/generate-copy/route.ts`
- MODIFY `src/modules/audience/work/promptFirewall.ts` (word-boundary fix)
- MODIFY `src/modules/audience/work/promptFirewall.test.ts` (word-boundary tests)

### What was built

**workLibrary.ts** — introduces the typed `WorkLibrary`/`WorkLibraryGroup` object (a pure projection of `WorkFacts`; nearest prior art `CollectionsFacts`) + `buildWorkLibraryPromptBlock(facts)` mirroring `buildSiteContextPromptBlock`. Renders identity, groups (name/kind VERBATIM), `formatWorkPrice` (verbatim amount+currency, mode-phrased: exact `€7777` / from `from €7777` / on-request `On request`), photo counts, sub-items, dream client, and verbatim praise. Framing states the never-invent / never-pad law. `formatWorkPrice` is exported (reused by the mock).

**copyPrompt.ts** — `buildWorkCopyPrompt(input)` = the facts-law core, inheriting the service binding-rules pattern:
- Static numbered RULES 1-10: (1) PRIMARY-LANGUAGE directive "Write EVERY string in <language>" from `strategy.primaryLanguage`; (2) anti-invention (facts are law, graceful omission); (3) no-placeholder; (4) array min/max + LEAN length caps; (5) frame-don't-describe; (6) proof quotes injected — model writes only framing; (7) story ship-grade (facts-only, NO fabricated biography — AC-4), plus an extra `new`-seller clause; (8) JSON-only; (9) output every section; (10) voice-forbidden words.
- Dynamically-appended BINDING lines (rules 11+): "One card per stated item — NO padding" enumerating EXACTLY the stated group names + count; "Prices are law — verbatim or mode-phrased"; and a CONDITIONAL bracketed-placeholder rule for the ONE placeholder zone (agency case-study metrics, gated on `voice.profession === 'agency'` AND page has `results`).
- FINAL SELF-CHECK echo (language, no-invention, exact card count, no proof quotes written).
- Section specs built from the FROZEN `workElementContract` (not `layoutElementSchema` — work contracts are separate and all `manual_preferred`, so ALL non-system elements are listed, not an `ai_generated` subset which would be empty). LEAN per-element char caps via `WORK_CHAR_CAPS`. Voice block via `formatWorkVoiceForPrompt`. Calls `assertNoTemplateLeak(input)` at entry and `assertNoTemplateNamesInText(prompt)` at exit (the word-boundary fix is what makes running the string guard on the larger copy prompt safe).

**injectPraise.ts** (work-LOCAL, design decision #9) — `injectPraise(sections, praise)` maps EVERY praise string VERBATIM into `proof.elements.quotes` as `{ text }` items, facts order, `source` omitted (never fabricated). Deterministic clamp to the contract max via `proofQuotesMax()` (reads `workElementContract.proof.collections.quotes.constraints.max` = 3 — law-driven, not hard-coded). No-op when praise empty or no `proof` section. NOT the service `injectRealTestimonials` (wrong key `testimonials`, single-quote pick, object input — three shape mismatches documented in-file).

**parseCopy.ts** — `parseWorkCopy(raw, uiblocks, praise)` pipeline: `flattenReviewSentinel` -> `applyAllSchemaDefaults(raw, uiblocks, resolveWorkSchema)` (defaults resolved against the frozen work contract via the `resolveSchema` callback) -> `injectPraise` (work-LOCAL) -> `backfillWorkCollectionIds` (schema-driven off `workElementContract`, idempotent). `resolveWorkSchema(name)` maps a section/uiblock name to its contract schema (identity). `validateWorkCopyCompleteness` reports `complete`/`missingSections`. Story section `about` is DISTINCT from `proof`/`testimonials` — no service testimonials path can touch it.

**mockResponseGeneratorWork.ts** — replaced the empty `generateMockWorkCopy` stub with a real canned per-page generator: `generateMockWorkCopy({ facts, sections })` fills required scalar elements (canned, deterministic) + facts-backed collections (`work.groups`, `packages.packages` from `facts.groups`, prices via `formatWorkPrice`); leaves `proof.quotes` empty (the parser injects real praise). Output is `CopyResponseSchema`-shaped and runs through the SAME `parseWorkCopy` pipeline. `MockWorkCopyInput` changed `{strategy}` -> `{sections}` (no other callers — phase 3 is first).

**generate-copy/route.ts** — mirrors the product copy route. Consumes `{strategy, page?, uiblocks?, brief, sourceUrl?}`. Reads facts via `getWorkFacts(brief.facts)` (400 if absent). Resolves the target page (defaults to home = `strategy.sitemap[0]` + `strategy.sections`, chrome-inclusive). Auth via `requireAuth` + `withAIRateLimit`. Mock path (NEXT_PUBLIC_USE_MOCK_GPT / DEMO_TOKEN) -> `generateMockWorkCopy` -> `parseWorkCopy`, `meta.mock`, 0 credits. SiteContext fed server-side via `getFreshSiteContext(normalizeUrlKey(sourceUrl), 'work')` -> `buildSiteContextPromptBlock` (adapter passes only `sourceUrl`). Derives pricePosition + voice (pure code), builds prompt, `generateRawJson('work-copy', ..., CopyResponseSchema)` with server-side `MAX_RETRIES=2`, `parseWorkCopy`, degraded signals `meta.mock`/`meta.complete`/`missingSections`. Credits: reuses `UsageEventType.GENERATE_COPY` + `CREDIT_COSTS.GENERATE_COPY` — the SAME event/cost as the product copy route, NO new credit event.

### Binding-rules structure
Static RULES (language/anti-invention/no-placeholder/caps/frame/proof-injected/story/JSON/all-sections/voice) + dynamic binding lines appended after rule 10: one-card-per-stated-group (enumerates exact names + count, "emit FEWER, never pad"), prices-verbatim-or-mode-phrased, and the conditional agency-metrics placeholder (the ONE placeholder zone). Closed by a FINAL SELF-CHECK echo.

### How injectPraise maps to proof.quotes
Praise `string[]` -> `proof.elements.quotes = kept.map(text => ({ text }))` where `kept = praise.slice(0, proofQuotesMax())` — verbatim `text`, facts order, no `source`, clamp to contract max = 3. Item `id`s backfilled after injection by `backfillWorkCollectionIds` (system fillMode field). No-op when no `proof` section.

### How the route mirrors product
Credits (GENERATE_COPY, no new event), mock path (canned + `meta.mock`, 0 credits), degraded signals (`meta.complete`/`missingSections`), SiteContext (server-side by `sourceUrl`, audienceType `'work'`), server-side retry x2, `requireAuth`+rate-limit guards — all one-to-one with the product copy route.

### Firewall word-boundary fix (authorized carry-forward)
`assertNoTemplateNamesInText` changed from naive `haystack.includes(token)` to per-token word-boundary regex `new RegExp('\\b' + token + '\\b', 'i')`. Common-English substrings (flexible/complex/resurgence/unhearth) no longer false-positive on `lex`/`surge`/`hearth`; a real whole-word leak (` lex `, `hearth`) still throws. New tests assert both. This is what makes it safe for `buildWorkCopyPrompt` to run the string guard on the much larger, prose-heavy copy prompt.

### uiblocks confirmation (structure source)
CONFIRMED: the copy path reads STRUCTURE from `strategy.sitemap` / `page.sections` (and `strategy.sections` for home), NOT the inert `uiblocks` identity map. `uiblocks` is accepted by the route contract for parity + schema resolution only (the route derives `pageUiblocks` as an identity fallback per page section: `uiblocks[section] ?? section`), and `parseCopy` uses it purely to resolve each section's contract schema (identity -> `workElementContract[section]`). Section specs in the prompt iterate `page.sections`, looking up `workElementContract` directly.

### Deviations from the plan
- **copyPrompt lists ALL non-system elements, not an `ai_generated` subset.** The service pattern filters `generation === 'ai_generated'`; every work contract element is `manual_preferred` (granth lineage), so that filter would emit an empty spec. In the work engine the AI writes the copy, so the spec lists all non-system elements. In-scope, necessary for a working prompt; documented in-file.
- **Copy prompt runs `assertNoTemplateNamesInText` on the final string.** The phase-3 plan text didn't spell this out, but the authorized word-boundary fix exists precisely because the copy prompt trips the string guard — so the guard IS wired in (parity with the strategy prompt + firewall completeness). Conservative, stronger-not-weaker.
- **`generateMockWorkCopy` signature `{strategy}` -> `{facts, sections}`.** The phase-2 placeholder took `{strategy, facts}` and returned `{}`; the real per-page mock needs the page's section list. No other callers existed. In-scope.
- **`WorkStrategySchema` in the route is `.passthrough()` and permissive.** The strategy is produced by our own assembler (not user input); the route only asserts the fields the prompt/parser read. Mirrors the product route's pragmatic strategy validation.

### Test results
- `npx tsc --noEmit`: clean except the pre-existing unrelated `src/app/page.tsx(6,26)` missing `@/assets/images/founder.jpg` (out of scope, ignored per instructions).
- Work module + mock: 8 files, 68 tests, all pass — incl. the FACTS-LAW test (groups/prices verbatim in prompt; binding line enumerates EXACTLY the stated groups; ALL praise word-for-word in parsed `proof.quotes`, zero drops/extras; parser never pads card counts), injectPraise (verbatim/no-extras/no-drops/no-op/over-max clamp), parseCopy (defaults+injection+id backfill+idempotence+completeness), and the firewall word-boundary tests.
- Full suite `npm run test:run`: 175 passed | 1 skipped (176 files); 2922 passed | 15 skipped (2937 tests). No regressions (up 3 files / 23 tests from phase 2).
- `npx eslint` on all 11 touched files: clean, no errors introduced.

### Open risks
- The copy prompt's string firewall guard throws (dev/test only) if a seller's business name / group name / praise contains a template name AS A WHOLE WORD (e.g. a studio literally named "Lex"). Word-boundary matching removes the substring false positives; a genuine whole-word collision remains a (rare) dev-only throw — same behavior as the phase-2 strategy prompt.
- `parseWorkCopy` trusts the LLM's card counts (anti-padding is enforced prompt-side, not clamped at parse); a misbehaving model could still over-emit groups. The facts-law guarantee proved here is that the PARSER introduces no padding and injects praise deterministically; hard parse-time group clamping was not added (would need a facts cross-check out of this phase's scope).

### Hardening (impl-review carry-forward)
- `injectPraise` HARDENED: empty/absent praise + a `proof` section now forces `proof.quotes = []` (was a no-op) — strips any LLM-fabricated testimonial so zero-fabrication holds even when there is no real praise. Added a fabrication-strip test (+1 test, 6 total in injectPraise; existing "no praise" test now asserts `[]`). tsc clean (ignoring pre-existing page.tsx:6 founder.jpg), full suite green: 2923 passed | 15 skipped.
