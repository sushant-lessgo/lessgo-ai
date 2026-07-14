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
