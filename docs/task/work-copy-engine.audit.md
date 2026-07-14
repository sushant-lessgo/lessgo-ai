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
