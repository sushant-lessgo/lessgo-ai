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

## Phase 4 (scaffold) — golden-capture harness + Kundius fixture

> SCAFFOLD ONLY. The real-LLM `CAPTURE=1` run was NOT executed (founder-gated).
> The golden artifact is NOT captured yet — it awaits the founder's REAL Kundius
> facts (the fixture is REPRESENTATIVE placeholder) + capture authorization.

### Files added
- ADD `src/modules/audience/work/__tests__/fixtures/kundiusBrief.ts`
- ADD `src/modules/audience/work/__tests__/captureGoldenWork.test.ts`
- ADD `src/modules/audience/work/__tests__/goldens/README.md` (dir marker + capture instructions; no artifact committed)

`src/modules/audience/work/__tests__/goldens/kundius.home.json` (the captured
artifact on the plan's Files-touched list) is intentionally NOT created — it is
produced by the authorized `CAPTURE=1` run later, off real founder facts.

### Fixture shape (kundiusBrief.ts) — REPRESENTATIVE PLACEHOLDER
Header carries the mandated prominent comment. Real facts drop in by editing
VALUES only (shape is the frozen `WorkFacts` contract). Exports:
- `kundiusWorkFacts: WorkFacts` — established, premium, bilingual EN+NL photography
  studio. identity (name/location/reach); establishment `'established'`;
  dreamClient (discerning/editorial/timeless → premium signal); 3 verbatim
  `praise` strings (sits exactly at the contract max = 3, a useful clamp edge);
  contactMethod `'form'`; `languages: ['en','nl']` (EN primary); 3 groups —
  Weddings (`from €4500`, cover photos), Editorial & Campaigns (`on-request`,
  story kind, cover), Portraits (`exact €1200`). The premium signals
  (on-request + high stated amount + premium dreamClient + premium praise) make
  `derivePricePosition → 'premium'` (asserted by the always-on sanity test).
- `kundiusBrief: Brief` — wraps the facts (`facts.work`), `businessType:
  'photographer'`, `copyEngine: 'work'`, `locales: ['en','nl']`.
- `kundiusProfessionRow: WorkProfessionRow` — `{ key: 'photographer' }`.
- `kundiusAboutHarvest: string` — the old-site about-text paragraph. **There is
  NO WorkFacts slot for about text** (slots: identity/groups/establishment/
  dreamClient/praise/contactMethod/languages), so it is exported SEPARATELY and
  fed to the copy prompt as a tone-only `siteContextBlock` (mirrors how the
  production route feeds SiteContext by `sourceUrl`) — never a fact, never
  copied verbatim, never a claim source.

### How the harness works (captureGoldenWork.test.ts)
Mirrors `src/modules/audience/__tests__/captureGolden.test.ts`: `dotenv` loads
`.env.local`; `@/lib/aiClient` is dynamic-imported INSIDE the capture test so a
no-key run never loads it.

- **Always-on sanity (no network, part of `test:run`):** asserts the fixture
  derives `'premium'` and assembles a deterministic HOME structure (twice-equal;
  storyBranch established; primaryLanguage en; leadGroups curated). This is what
  keeps the fixture honest without a capture run.
- **CAPTURE-gated (`describe.skipIf(process.env.CAPTURE !== '1')`):** end-to-end
  HOME-only run — (1) `assembleWorkStructure` deterministic slim strategy,
  (2) `buildWorkStrategyPrompt` → `generateWithSchema('work-strategy', …)` →
  `assembleWorkStrategy`, (3) build HOME `WorkCopyPage` (chrome-inclusive
  `strategy.sections`, matching the route default) → `buildWorkCopyPrompt`
  (siteContextBlock = the about-harvest tone reference) →
  `generateRawJson('work-copy', …)` → `parseWorkCopy` (contract defaults +
  verbatim praise injection + id backfill). Writes two artifacts to `goldens/`.

### Run it (founder-authorized only)
```
CAPTURE=1 npx vitest run captureGoldenWork
```
Without `CAPTURE=1` the capture SKIPS cleanly (no network, no cost); only the
two sanity checks run.

### Rendered-strings dump (what the founder READS)
`goldens/kundius.home.read.txt` — a human-readable dump with a placeholder
warning banner, then, pulled from the parsed HOME copy + strategy:
- per-page one-liner / positioning (positioningAngle, storyAngle, voiceNotes,
  archetype, home section list)
- promise line (hero eyebrow/heading/lead/CTA)
- gallery intros/captions (work eyebrow/heading/lead + each group card name)
- story (about eyebrow/heading/bio)
- prices framing (packages eyebrow/heading + each package name/price_line/description)
- proof/praise (proof eyebrow/heading/awards_line + each injected quote text/source)
- contact nudge (contact eyebrow/heading/note/CTA)
- an ALL-SECTIONS raw string dump as a catch-all
`goldens/kundius.home.json` holds the full strategy JSON + parsed HOME copy JSON
+ capture meta (complete/missingSections) for the offline record.

### Wiring issues found
None. The phase 1-3 exports compose cleanly for a HOME-only end-to-end run — no
out-of-scope engine edits were needed. (The capture path itself is only
exercisable under `CAPTURE=1`, which was NOT run; a real wiring bug there would
surface at the authorized capture.)

### Deviations from the plan
- **`goldens/kundius.home.json` not created.** The plan lists the captured
  artifact in Files-touched, but this phase is scaffold-only (no `CAPTURE=1`).
  Committing a placeholder artifact would misrepresent it as a founder-read
  golden. Added `goldens/README.md` as the dir marker instead; the JSON lands on
  the authorized capture. Conservative, in-scope.
- **About-text harvest is a separate export, not a WorkFacts field.** WorkFacts
  has no about-text slot; adding one would be an out-of-scope schema change. It
  travels as a `siteContextBlock` tone reference (faithful to the production
  SiteContext path). Logged as the conservative choice.
- **An always-on sanity describe was added alongside the CAPTURE describe.** The
  plan named only the capture test; the sanity block validates the fixture
  (premium + deterministic structure) within `test:run` with zero network — this
  is the "ensure the pricePosition test would pass" requirement, kept in-file.

### Test / tsc / lint results
- `npx tsc --noEmit`: clean except the pre-existing, unrelated
  `src/app/page.tsx(6,26)` missing `@/assets/images/founder.jpg` (out of scope).
- `npx vitest run captureGoldenWork`: 2 passed | 1 skipped (the capture) — SKIP
  confirmed, no network.
- Full `npm run test:run`: 176 files passed | 1 skipped; 2925 passed | 16
  skipped (capture adds the one new skip). No regressions.
- `npx eslint` on both new source files: clean.

### Open risks
- The fixture is REPRESENTATIVE placeholder. The golden read is NOT authoritative
  until the founder replaces the values with Kundius's real Brief.
- The CAPTURE path is unexecuted; a latent wiring bug (e.g. a section key the
  contract does not carry, model output shape) would only surface at the
  authorized real-LLM run. The always-on sanity de-risks the deterministic half
  only.

## Phase 4 (capture)

### Files changed
- MOD `src/modules/audience/work/__tests__/fixtures/kundiusBrief.ts` — placeholder → real founder facts
- MOD `src/modules/audience/work/__tests__/captureGoldenWork.test.ts` — sanity assertion + node env + banners
- ADD `src/modules/audience/work/__tests__/goldens/kundius.home.json` — capture artifact (real gpt-4o-mini)
- ADD `src/modules/audience/work/__tests__/goldens/kundius.home.read.txt` — founder-facing rendered dump

### Real facts mapped (Kristina Kundius, photographer)
- identity: name "Kristina Kundius", location Netherlands, reach = "Portfolio headshots for your company brand" (the one-liner/identity).
- Weddings + family = identity breadth ONLY; NOT priced groups (none invented).
- groups (all kind:'category', EUR, exact): Full brand package 500 / Brand photoshoot 350 / Portrait & business shoot 250 / Event photography (per hour) 100.
- dreamClient: "Enterprise customers, big corporates" (verbatim).
- praise: [] (founder gave none) — exercises empty-praise strip.
- contactMethod: 'form' (founder offers form+WhatsApp+email; enum is single-value → form as richest capture; WA/email secondary).
- languages: ['en']. Dutch about-text harvested as tone-only siteContextBlock (not output language).

### Judgment mappings (both flagged inline + here)
1. establishment: founder said "in-between" (not new, not established). Schema enum is new|established → mapped `established` (practicing graduate professional targeting enterprise reads closer to established).
2. Event photography is €100 PER HOUR; WorkPrice has no hourly mode → represented `exact` 100 EUR with the "per hour" nuance carried in the group NAME ("Event photography (per hour)"). NOTE: the copy-phase LLM shortened the home gallery card display name back to "Event photography" (dropped the suffix) — the nuance survives in facts/strategy/leadGroups; the /prices page (not captured — home only) is where the price line would render.

### Harness adjustment
- Sanity block previously asserted `derivePricePosition → 'premium'`. With real €100–500 pricing + no premium/friendly keywords + empty praise the rubric nets 0 → **derived pricePosition = `'middle'`**. Assertion changed to expect the actual `'middle'` and re-derive equal (deterministic). Did NOT force premium.
- Added `// @vitest-environment node` docblock: the global vitest env is jsdom, and the OpenAI client refuses to instantiate in a browser-like env ("dangerouslyAllowBrowser"). This test does no DOM work; node env lets CAPTURE=1 reach the live provider. (In-scope: only the test file touched.)

### Capture run
- Provider/model: **real OpenAI `gpt-4o-mini`** for BOTH work-strategy and work-copy (env: USE_OPENAI=true, AI_MODEL_TIER=cheap, OPENAI_API_KEY present). This aiClient has NO mock path — not a mock read.
- Home sitemap sections: header, hero, work, proof, contact, footer (no about/packages on home — those are separate pages; that is why the dump's STORY/PRICES labels read empty).
- Ran twice (first jsdom failure, then node) — spent credits on the successful node run.

### Facts-law assessment (PASS)
- Groups: exactly the 4 real priced groups; NO invented groups; weddings/family correctly absent as groups.
- Prices: no invented amounts anywhere; no price fabrication on home.
- Praise: proof `quotes: []` — heading "What My Clients Say" present but ZERO fabricated testimonials. Empty-praise strip holds.
- Biography: no invented bio; `about` not on home so no fabricated life story; the Dutch harvest did NOT leak (grep for mijn/fotograaf/afgestudeerd/nederland = 0 hits).
- Language: all output EN; no NL leakage.
- Minor (not facts-law): footer copyright reads "© 2023" (stale year, chrome); event card dropped "(per hour)" suffix on home gallery card (noted above).

### Verify
- `npx tsc --noEmit`: clean except the pre-existing `src/app/page.tsx:6` founder.jpg error (ignored per scope).
- `npm run test:run`: 2925 passed | 16 skipped (golden capture skips without CAPTURE; sanity passes).
- Phase 1–3 engine code untouched.

### Open risks
- Event per-hour nuance is soft (name-only); the copy LLM may drop it in display. If the /prices page must show "€100/hr" verbatim, consider a WorkPrice `note`/hourly mode (out of scope here).
- pricePosition 'middle' (not premium) means the pilot voice is the middle band — confirm that matches founder intent for an enterprise-targeting photographer.
- Golden artifacts NOT committed — awaiting founder read.

## Phase 5 — adapter fan-out: full multi-page generation

### Files changed
- ADD `src/modules/wizard/generation/work.llm.ts` — `runWorkLLMGeneration` + the dispatch guard (`workCopyEngineEnabled` / `resolveWorkRoute` / `WORK_COPY_ENGINE_TEMPLATES`).
- ADD `src/modules/wizard/generation/work.llm.test.ts` — orchestration + routing tests (mocked network).
- MODIFY `src/modules/wizard/generation/work.ts` — re-export the phase-5 surface + 3 additive optional fields on `WorkGenerationInput` (`brief`/`sourceUrl`/`strategy`). ZERO edits to `runWorkGeneration`/`runWorkSkeleton` bodies.
- MODIFY `src/modules/wizard/generation/index.ts` — additive discoverability re-export of the phase-5 surface. `runGeneration` dispatch UNCHANGED.
- MODIFY `src/components/onboarding/wizard/GeneratingSlot.tsx` — work fork now flag/allow-list-guarded (LLM vs skeleton); local `buildWorkInput` removed (moved to the store); imports trimmed.
- MODIFY `src/hooks/useWizardStore.ts` — added exported `buildWorkInput(s)` (+ private `resolveWorkBrief`) projecting the resolved Brief + `sourceUrl` + confirmed pages; type-only `WorkGenerationInput` import.
- MODIFY `src/modules/audience/work/__tests__/captureGoldenWork.test.ts` — added the CAPTURE-gated FULL-SITE golden.
- ADD `src/modules/audience/work/__tests__/goldens/kundius.full.json` — captured full-site artifact (real gpt-4o-mini).
- ADD `src/modules/audience/work/__tests__/goldens/kundius.full.read.txt` — founder-facing per-page rendered dump (authorized "readable dump").

### Fan-out design + the ~180-line clone note
`runWorkLLMGeneration` MIRRORS the THING fan-out (`thing.ts` runThingGeneration L410 / runFanOut L456-635 / resume L638-649): resume-first (`loadDraft` -> `isResumableGeneration` -> runFanOut), else the ONE work strategy call (POST `/api/audience/work/strategy` with the Brief; the work wizard does NOT fetch strategy pre-gate, so this is the first + only strategy call), `buildMultiPageSkeleton` + `saveFC`, then iterate the sitemap: skip `completedPageKeys`, POST each page to `/api/audience/work/generate-copy`, `mergePageIntoFinalContent` + per-page `saveFC`, `onPageProgress`, meta threading, and `finalizeMultiPageGeneration(fc, briefGoal)` at the tail (MANDATORY — drops the in-progress marker + stamps goal-ref CTAs).

Work-specific divergences from thing.ts (why NOT extracted yet): the work copy route REQUIRES `page.sections` in the payload (WorkCopyPageSchema min 1), so the fan-out sends CHROME-INCLUSIVE sections for home (`['header', ...page.sections, 'footer']`) while handing `mergePageIntoFinalContent` the BODY-ONLY page (it re-injects chrome itself); the Brief travels in the body (decision #4) instead of the product field-remap payload; template-knob seeding mirrors `runWorkSkeleton` (`preloadTemplate(...).defaultKnobs` -> `themeValues.knobs`); no collections fan-out (granth/atelier declare no collection family). Extracting ONE audience-agnostic driver shared by thing+work was CONSIDERED and DEFERRED for this track — the file header records the duplication (breadcrumb) so a future refactor finds BOTH copies.

### Allow-list guard (plan step 4 / N4) + enumerated isWorkMultipage templates
Per the orchestrator ruling the guard is a **template ALLOW-LIST**, not "all `isWorkMultipage()` templates": `WORK_COPY_ENGINE_TEMPLATES = ['atelier']` (named const, easy to extend). `workCopyEngineEnabled(templateId)` returns true ONLY when `NEXT_PUBLIC_WORK_COPY_ENGINE === 'true'` AND `templateId` is in the allow-list. Every other work-multipage template keeps today's skeleton path even with the flag ON, until explicitly added.

Enumerated `copyEngines: ['work']` templates and their `multipage` capability (from `templateMeta.ts`):
- `granth` — capabilities `[]` -> NOT multipage -> single-page writer generator (`runWorkGeneration`); never enters the multipage fork.
- `lumen` — `['bilingual','gallery','lead-form']` -> NOT multipage (bespoke/retired-in-place) -> not affected.
- `atelier` — `['gallery','packages','multipage']` -> the ONLY work-multipage template today, and the ONLY allow-listed one.

So today `isWorkMultipage()` => {atelier} exactly; the allow-list is belt-and-suspenders (a future work-multipage template does NOT auto-enable the LLM engine). N4 blast-radius eliminated.

### Byte-identical routing proof (the 4 cases)
`resolveWorkRoute` extracts the fork PURE (tested in work.llm.test.ts without rendering React). Proven:
- (a) granth (not multipage) -> `'granth-generator'` (runWorkGeneration) regardless of flag.
- (b) flag OFF + work-multipage -> `'skeleton'` (runWorkSkeleton, UNCHANGED). Default (flag unset) => this branch => byte-identical to today.
- (c) flag ON + non-atelier (lumen) multipage -> `'skeleton'` (unchanged).
- (d) flag ON + atelier multipage -> `'llm-fanout'` (runWorkLLMGeneration).
`NEXT_PUBLIC_WORK_COPY_ENGINE` is build-time inlined (decision #8) — the flag defaults OFF (unset => false), so the existing skeleton + granth behavior is provably unchanged until a REDEPLOY with the flag on + atelier.

### Full-site capture (AC-1) — real gpt-4o-mini, `CAPTURE=1 npx vitest run captureGoldenWork`
Ran on real OpenAI `gpt-4o-mini` (USE_OPENAI=true, cheap tier, key present). Standard archetype -> 7 pages, ALL `complete=true`, missing=(none). Per-page summary:
- **home** (`/`): header + hero (role_line/name/quote/cta — atelier hero uses those keys, NOT eyebrow/heading, so the dump's "PROMISE LINE" labels read empty but the hero IS filled) + work (4 group cards) + proof (heading, no fabricated quotes) + contact + footer.
- **work** (`/work`): work gallery intro + 4 group cards (one card keeps "Event photography (per hour)") + proof heading + footer.
- **work-group** (`/work/[group]`): work intro + 4 cards + footer (singleton group-page template).
- **prices** (`/prices`): packages — 4 lines, prices VERBATIM (EUR 500 / 350 / 250 / 100), per-hour nuance preserved in the last package name.
- **about** (`/about`): about heading + bio (facts-only framing: Netherlands, storytelling; no fabricated credentials) + proof heading.
- **contact** (`/contact`): contact heading + contact_method + cta + footer.
- (every page filled >=1 section.)

**Facts-law: PASS.** No invented groups (exactly the 4 real priced groups; weddings/family breadth correctly absent). No invented prices (exact amounts only). Empty praise -> proof sections carry a heading but ZERO fabricated quotes (empty-praise strip holds site-wide). No fabricated biography; the Dutch about-harvest did NOT leak (no NL fragments, no invented Art-History degree). Language EN throughout. No non-lean bloat (headings short; the About bio is one lean paragraph). Only non-facts-law nits (same as phase 4): footer "(c) 2023" stale chrome year; the home work-card display name drops the "(per hour)" suffix (nuance survives on `/prices`).

### Invariant compliance (decision #10)
Plain sitemap pages NEVER get `collectionKey`/`kind:'collectionItem'` and `materializeIntoPages` is never called — the fan-out only calls `mergePageIntoFinalContent` (body-only, chrome-at-boundaries). The orchestration test asserts every persisted page has `collectionKey===undefined` and `kind!=='collectionItem'`, and that `finalizeMultiPageGeneration` fires EXACTLY ONCE (dropping `generationProgress`). `finalizeMultiPageGeneration` is mandatory (goal-CTA stamping) and threaded `briefGoal` from the resolved Brief.

### Deviations
- **`buildWorkInput` moved to the store** (was local in GeneratingSlot). Needed to reconstruct the resolved Brief (`resolveWorkBrief`) + derive `sourceUrl` from the scrape entry via the store-private `rawInputIsUrl`; mirrors buildThingInput/buildTrustInput. `useWizardStore.ts` is on the Files-touched list for exactly this. Removed now-unused `fieldStr`/`fieldArr`/`SitemapPage` imports from GeneratingSlot.
- **3 additive optional fields on `WorkGenerationInput`** (brief/sourceUrl/strategy). Type-only additions; runWorkGeneration/runWorkSkeleton bodies untouched, and they ignore the new fields.
- **`sourceUrl` is derived, not a new field.** Read from the scrape entry `rawInput` when URL-like (tone-only SiteContext lookup, server-side); absent on manual-entry runs.
- **`buildWorkInput` reconstructs a minimal Brief** from `briefFacts` (the hydrate snapshot carrying `facts.work`) + businessType + composed goal. All BriefSchema fields are optional, so it validates at the routes. It does NOT re-map per-field wizard edits into `facts.work` — that field->facts writeback is out of this phase's scope (the pilot's facts come from the hydrated Brief). Logged as an open risk.
- **`git checkout -- kundius.home.{json,read.txt}`** — the authorized `CAPTURE=1` run re-executes the always-on HOME capture too, which overwrote the phase-4 founder-APPROVED home artifact with a fresh (non-deterministic) capture. I restored the two files to their committed phase-4 versions so the approved golden is preserved. This is a file-restore of an unintended side-effect, not a branch/history git op; disclosed here for transparency.

### tsc / test / lint
- `npx tsc --noEmit`: clean except the pre-existing unrelated `src/app/page.tsx(6,26)` founder.jpg error (out of scope, ignored per instructions).
- `npm run test:run`: 177 files passed | 1 skipped; 2941 passed | 17 skipped. No regressions (up 1 file / 16 tests from phase 4: the new adapter test file). Full-site golden SKIPS without CAPTURE=1.
- `CAPTURE=1 npx vitest run captureGoldenWork`: 4 passed (2 sanity + HOME + FULL-SITE), real gpt-4o-mini.
- `npx eslint` on all touched files: 0 errors; 1 PRE-EXISTING warning in GeneratingSlot.tsx (`useCallback` missing `setGenerationError` dep — on the untouched `run` hook, not introduced here).

### Open risks
- **Flag-on prerequisite (unchanged):** phase-B newGeneration Gate-0 QA is still pending; the flag stays OFF until the founder rules. Enabling atelier LLM copy for real requires a redeploy (build-time inlined).
- **Field->facts writeback:** wizard edits to work fields are not re-projected into `facts.work` by `buildWorkInput` — the copy engine reads the hydrated `briefFacts` snapshot. Fine for the Kundius pilot (facts hydrated from the Brief); a general edit-then-generate flow would need a store->facts.work mapping (out of scope, flag for a follow-up).
- **`sourceUrl`/SiteContext:** only fires when the entry was a URL scrape; manual-entry work runs generate with no tone reference (acceptable — facts are the claim backbone).
- Full-site golden committed off the current fixture — re-capture if the founder revises Kundius facts.

## Phase 6 — story interview tier (Sugarman regen)

### Files changed
- ADD `src/modules/audience/work/storyInterview.ts` — single-section `about`/story prompt builder + contract validator.
- ADD `src/modules/audience/work/storyInterview.test.ts` — prompt-shape + validation tests.
- ADD `src/app/api/audience/work/regenerate-story/route.ts` — NEW dedicated work-copy story regen route.
- ADD `src/app/api/audience/work/regenerate-story/route.test.ts` — guards + contract-validation + generator-parity tests.
- MODIFY `src/hooks/editStore/aiActions.ts` — ADD `regenerateStoryFromInterview` (additive; existing actions untouched).
- ADD `src/app/edit/[token]/components/StoryInterviewPanel.tsx` — minimal 3-input entry point.
- MODIFY `src/app/edit/[token]/components/layout/MainContent.tsx` — single wiring point (about-section-gated panel render).

`/api/regenerate-section/route.ts` was **NOT touched** — confirmed byte-identical via `git diff --stat HEAD` (empty diff).

### storyInterview rule structure
`buildStoryInterviewPrompt({ answers, facts, voice, siteContextBlock? })` composes: voice identity + `formatWorkVoiceForPrompt` block + establishment note; THE INTERVIEW block (the 3 answers = the only raw material); verbatim CLIENT PRAISE block (or an explicit "do NOT invent" note when empty); an about-section-ONLY spec (eyebrow/heading/bio); then 8 numbered RULES:
1. primary-language directive (`facts.languages[0]`, "Write EVERY string in <lang>").
2. **HOOK on the moment** — open the bio on the specific client moment (concrete scene, not summary).
3. **BELIEF is the spine** — build the story to the craft belief.
4. **Praise is the LANDING** — close on what the work leaves people with, verbatim where quoted, never invented.
5. anti-invention (facts are law, no fabricated biography/year/award/roster/stat/history, graceful omission) + a `new`-seller anti-history clause (only emitted for `establishment === 'new'`).
6. ship-grade lean (one true paragraph).
7. voice-forbidden words.
8. JSON-only + OUTPUT FORMAT (single `about` key).
Firewall: `assertNoTemplateLeak(input)` on entry + `assertNoTemplateNamesInText(prompt)` on exit — no templateId/skeletonId/template names reach the prompt.

### The new route — guards + contract-validation + parity
`POST /api/audience/work/regenerate-story`:
- **Guards:** `requireAICredits(req, SECTION_REGEN, CREDIT_COSTS.SECTION_REGENERATION)` (SAME cost/event as regenerate-section — **NO new credit event**, creditSystem.ts untouched), THEN body zod (`{tokenId, sectionId, interviewAnswers:{origin,moment,belief}, brief}`), THEN `getWorkFacts(brief.facts)` (400 if absent), THEN `assertProjectOwner(userId, tokenId, { action:'regenerate-story' })` BEFORE any charge/cross-tenant read (skipped in mock/demo). Matches the regenerate-section guard shape.
- **Generation:** `derivePricePosition` + `selectWorkVoice` (pure code) then `buildStoryInterviewPrompt` then `generateRawJson('work-copy', ..., CopyResponseSchema)` on the SAME strong `work-copy` endpoint/model phase-3 copy uses, server-side retry `MAX_RETRIES=2`.
- **Contract validation:** each attempt runs the phase-3 work parser `parseWorkCopy(response, {about:'about'}, facts.praise)` then `validateStoryAbout(parsed)` — REJECTS (retry, then 500 `generation_failed` recoverable) on a malformed/short shape (missing about, empty required element, or a sub-`MIN_STORY_BIO_CHARS` bio). Validation happens BEFORE returning.
- **No persist:** returns `content` = `processed.about.elements` for the CLIENT to apply (mirrors regenerate-section's contract). `meta.mock`/`meta.attempts` carried; mock path (NEXT_PUBLIC_USE_MOCK_GPT / DEMO_TOKEN) uses `generateMockWorkCopy(['about'])` then same parse+validate, 0 credits.
- **Parity guarantee:** BOTH story paths validate against the IDENTICAL `workElementContract.about`. Phase-3 generate-copy validates via `parseWorkCopy -> resolveWorkSchema('about') -> workElementContract.about`; this route validates via `validateStoryAbout -> aboutRequiredKeys() -> workElementContract.about`. `aboutRequiredKeys()` is DERIVED from the contract (filters `requirement === 'required'`), not hand-rolled — a route.test parity block asserts `resolveWorkSchema('about') === workElementContract.about`, the full element set matches, and `aboutRequiredKeys()` equals the contract's required elements. Test fails if either path drifts.
- `about` is DISTINCT from `proof`/`testimonials`; only the story section is produced/returned.

### aiActions additive action
`regenerateStoryFromInterview(sectionId, interviewAnswers, brief)` — THIN parallel of `regenerateSection`: POSTs `{tokenId, sectionId, interviewAnswers, brief}` to `/api/audience/work/regenerate-story` and applies the returned `data.content` with the **byte-identical merge algorithm** regenerateSection uses (image-skip, string/object shape-preservation, history push, queuedChanges, aiMetadata reset, data-capture re-freeze via `queueAiBaselinePatch` + `trackRegen`, autosave). Existing actions are unchanged (verified — only an addition between `regenerateSection` and `regenerateElement`). The i18n regen-locale guard is applied.

### Editor wiring point used
`MainContent.tsx` — CONFIRMED as the section-regen host (it already dispatches `case 'regenerate-section': store.getState().regenerateSection(selectedSection)` at ~L287). The panel is surfaced there via ONE gated render: `mode === 'edit' && selectedSection?.split('-')[0] === 'about'` then an absolute-positioned `<StoryInterviewPanel sectionId={selectedSection} />`. Post-reveal only; not in the wizard flow. No other/unlisted host file needed.

### Deviations from the plan
- **`generateRawJson` (not `generateWithSchema`).** The plan text names `generateWithSchema`, but the phase-3 generate-copy route it says to mirror uses `generateRawJson('work-copy', ..., CopyResponseSchema)` precisely because `CopyResponseSchema` is `z.record` (no structured outputs). To stay TRUE to "the SAME strong path phase-3 uses" + "reuse the phase-3 work parser", I used `generateRawJson` on endpoint `'work-copy'` (identical model row/strength; `generateWithSchema` also routes by endpoint, so model selection is unchanged). Conservative, in-scope; logged here.
- **`brief` is a caller-supplied arg on the store action + panel prop.** The editStore does NOT carry `facts.work` (the phase-5 documented field->facts writeback gap). So `regenerateStoryFromInterview` takes `brief` as an argument and the panel accepts it as a prop, rather than reading it from the store. The route/parser/parity are fully unit-tested; the LIVE editor path needs `facts.work` projected into the editor (a follow-up, matching the deferred manual-QA note). No new store field invented, no unlisted file edited.
- **Store action accessed via `(store.getState() as any)` in the panel.** `regenerateStoryFromInterview` is additive and NOT declared on the shared `EditStore` actions type (`src/types/store/actions.ts` is out of this phase's Files-touched). To avoid editing an unlisted type file, the panel accesses the action through a cast. The store assembly spreads `createAIActions` (spread bypasses excess-property checks, so tsc stays green). Flagged for a future type declaration.
- **`validateStoryAbout` adds a `MIN_STORY_BIO_CHARS` (40) short-shape gate** beyond bare presence. The contract has no charLimit; a one-word bio is not ship-grade. Conservative additional rejection; unit-tested.

### Manual-QA (deferred, per task)
Running the interview in a live editor (watch ONLY the story section update; proof/other sections untouched) is a FOLLOW-UP manual-test item — NOT run here. It additionally depends on wiring `facts.work` into the editor (the deviation above). Logic is covered by the route/action/parity/prompt unit tests.

### tsc / test / lint
- `npx tsc --noEmit`: clean except the pre-existing unrelated `src/app/page.tsx(6,26)` founder.jpg error (out of scope, ignored per instructions).
- New tests: `storyInterview.test.ts` + `regenerate-story/route.test.ts` — 20 tests, all pass (prompt shape hook/belief/landing/anti-invention/language; validation accept+reject; owner guard; credits gate; contract-rejection with retry exhaustion -> 500; parity single-source-of-truth).
- Full `npm run test:run`: 179 files passed | 1 skipped; 2961 passed | 17 skipped. No regressions (up 2 files / 20 tests from phase 5).
- `npx eslint` on all touched files: 0 errors. 3 PRE-EXISTING warnings in MainContent.tsx (lines 157/159/562 — untouched `useCallback`/aria code, not introduced here).
- `/api/regenerate-section/route.ts`: byte-identical (git diff empty).

### Open risks
- **Brief->editor gap:** the live story-interview call needs `facts.work` available in the editor; it is not yet (phase-5 writeback gap). Until wired, a live submit will 400 (`brief.facts.work is required`). Follow-up.
- **Untyped store action:** `regenerateStoryFromInterview` is not on the `EditStore` actions type; the panel uses a cast. A future phase should declare it in `src/types/store/actions.ts`.
- Contract-validation trusts the phase-3 parser's defaults; a model that returns an about with only whitespace is caught (empty-after-trim), but a plausible-but-fabricated bio is a CONTENT concern (facts-law is prompt-enforced), not a shape concern — same posture as phase 3.

### Phase 6 — review-fix pass (impl-review follow-up)

**Files changed (this pass):**
- MODIFY `src/hooks/editStore/aiActions.ts` — defensive target guard on `regenerateStoryFromInterview` (FIX 2).
- ADD `src/hooks/editStore/storyInterviewGuard.test.ts` — unit test for that guard.
- (`MainContent.tsx` — NOT changed this pass; see the FIX 1 blocker below.)

**FIX 2 (applied, defensive — reviewer non-blocking note).** `regenerateStoryFromInterview` now early-returns (with a `logger.warn`) when `sectionId.split('-')[0] !== 'about'`, BEFORE flipping `isGenerating` or hitting the network. This guards the untyped-cast entry point so a stray/mis-targeted call can never rewrite hero/proof/etc via the work-story route. `regenerateSection`/`regenerateElement` untouched; the about-path behavior is unchanged. Covered by `storyInterviewGuard.test.ts` (2 tests): non-about → no fetch + `isGenerating` stays false; about → reaches the `/api/audience/work/regenerate-story` POST.

**FIX 1 (BLOCKED — could NOT apply as prescribed; needs orchestrator decision).** The task said to add `audienceType === 'work'` to the `MainContent.tsx` panel gate. This is unworkable, for two independent reasons:
1. **Does not type-check.** The editStore `audienceType` union (`src/types/store/state.ts:375`) is `'product' | 'service' | 'ecommerce' | 'writer'` — there is NO `'work'`. `audienceType === 'work'` raises `TS2367` (no overlap).
2. **Would never be true at runtime → silently breaks the feature.** Work is a *copyEngine*, not an audienceType. `serveGate.ts` bridges the work engine to an audience via the PICKED TEMPLATE: `TEMPLATE_AUDIENCE.granth = 'writer'`, `TEMPLATE_AUDIENCE.atelier = 'service'` (and `BRIDGEABLE_ENGINES.work = 'writer'` as fallback). So a work-copy-engine project's persisted `audienceType` is `'writer'` (granth) or `'service'` (atelier) — never `'work'` (confirmed by `serveGate.test.ts:263-275`). Gating on `'work'` would render the panel for NO project.

No single `audienceType` value isolates the work engine either: work spans BOTH `'writer'` (granth) and `'service'` (atelier — the actual Kundius pilot). The real discriminator is the copyEngine, which the editStore does **not** carry (no `copyEngine`/`engine` field in `state.ts`; consistent with the phase-5 field→facts writeback gap). Fixing this correctly requires an OUT-OF-SCOPE store-shape change (add + hydrate a `copyEngine`/`engine` field in `src/types/store/state.ts` + `loadFromDraft`), which is explicitly forbidden for this pass ("Do NOT change store shape/selectors"; edit ONLY the two listed files). Per the STOP-and-report rule, I reverted the non-compiling gate to leave `MainContent.tsx` byte-identical to its phase-6 state (tree compiles) and am escalating.

The underlying LEAK the reviewer flagged is REAL (the panel currently renders for ANY `about` section, including a plain-service project's) — it just cannot be closed with `audienceType` alone. Options for the orchestrator: (a) authorize the store-shape change to carry `copyEngine` into the editor and gate on `copyEngine === 'work'`; or (b) accept that this is blocked by the same Brief→editor gap already logged as the phase-6 top open risk (live submit already 400s without `facts.work`), and fold the gate into that follow-up.

**Deferred follow-ups CONFIRMED still open (unchanged, non-blocking):**
- `facts.work` editor writeback (Brief→editor projection) — the LIVE story-interview path still needs it; a live submit 400s until wired. Also the natural home for the correct work-engine panel gate.
- Untyped store-action declaration — `regenerateStoryFromInterview` still not on `src/types/store/actions.ts`; panel + new guard test both reach it via cast.

**review-fix verify:** `npx tsc --noEmit` clean except the pre-existing `src/app/page.tsx:6` founder.jpg error. `npm run test:run` green — 180 files passed | 1 skipped, 2963 passed | 17 skipped (up 1 file / 2 tests from phase 5's tally). `npx eslint` on `aiActions.ts` + `storyInterviewGuard.test.ts`: 0 errors. MainContent gate: verified-by-reading (unchanged; blocker above).

---

### Phase 6 — review-fix pass 2 (templateId-based panel gate)

**Files changed (this pass):**
- ADD `src/lib/workCopyEngine.ts` — leaf module (no React, no generation imports): relocated `WORK_COPY_ENGINE_TEMPLATES` + new `isWorkCopyTemplate(templateId)` membership predicate. Single source of truth.
- ADD `src/lib/workCopyEngine.test.ts` — unit test for `isWorkCopyTemplate` (atelier → true; hearth/lex → false; null/undefined → false; allow-list === ['atelier']).
- MODIFY `src/modules/wizard/generation/work.llm.ts` — re-point: import `WORK_COPY_ENGINE_TEMPLATES` + `isWorkCopyTemplate` from `@/lib/workCopyEngine`, re-export both (unchanged import surface for `index.ts`/`work.ts`/`work.llm.test.ts`). `workCopyEngineEnabled` now delegates its allow-list check to `isWorkCopyTemplate` — behavior identical (still env-flag AND membership).
- MODIFY `src/app/edit/[token]/components/layout/MainContent.tsx` — read `templateId` from store (`useStoreState`); gate `StoryInterviewPanel` on `isWorkTemplate = isWorkCopyTemplate(templateId)` AND the `about-` section prefix.

**The corrected fix.** The earlier `audienceType === 'work'` approach was wrong ('work' is a copyEngine, not an audienceType — see the prior FIX-1 blocked note). The correct discriminator is the PICKED TEMPLATE: the panel renders only when the project's `templateId` is on the work-copy-engine allow-list (`atelier`). This is the SAME set the generation fork uses (`workCopyEngineEnabled`), so editor panel and generator agree — no leak into generic service/writer `about-` sections (which caused the submit → 400 regression).

**Why template-membership, NOT the `NEXT_PUBLIC_WORK_COPY_ENGINE` flag.** The panel gate uses `isWorkCopyTemplate` (pure membership), not `workCopyEngineEnabled` (env-flag AND membership). The story-regen route is independent of the generation kill-switch, so the panel should be usable for work-template projects in the editor regardless of the wizard flag. The env flag only gates the wizard's LLM fan-out generation path.

**Allow-list relocation (single source of truth, generation behavior unchanged).** `WORK_COPY_ENGINE_TEMPLATES` moved out of `work.llm.ts` into the dependency-free leaf `@/lib/workCopyEngine`, so it can be imported into the editor bundle without dragging generation code along. `work.llm.ts` re-exports it, so `index.ts` / `work.ts` / `work.llm.test.ts` are untouched and still consume the same const. Purely additive/import-only for generation — zero behavior change.

**FIX-2 guard retained.** The `aiActions.ts` `regenerateStoryFromInterview` no-op-if-not-about guard and its `storyInterviewGuard.test.ts` are UNCHANGED (not reverted).

**Deviations:** none. All work stayed within the listed files.

**Verify:**
- `npx tsc --noEmit` — clean except the pre-existing `src/app/page.tsx:6` founder.jpg error (ignored per instruction).
- `npm run test:run` — green: 181 files passed | 1 skipped, 2967 passed | 17 skipped. The phase-5 byte-identical routing tests in `work.llm.test.ts` still pass after the const relocation (20 tests across the leaf test + work.llm.test.ts confirmed).
- `npx eslint` on all four touched files — 0 errors (3 pre-existing warnings in MainContent.tsx, none on changed lines).
- MainContent gate verified-by-reading (render test heavy): `mode === 'edit' && isWorkTemplate && selectedSection && selectedSection.split('-')[0] === 'about'`.

**Open risks:** `facts.work` editor writeback (Brief→editor projection) still open — a LIVE work-template story submit needs it wired; that is a separate deferred follow-up, not this gate. The panel now correctly appears ONLY for atelier (work) projects, closing the leak into generic service/writer editors.
