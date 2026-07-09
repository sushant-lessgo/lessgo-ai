# `modules/audience` — per-audience generation logic (top tier of the 3-tier model)

`audienceType` is the top tier of `audienceType → templateId → variantId + paletteId`.
Values: **`product`**, **`service`**, `ecommerce` (reserved), **`writer`**
(bespoke). This directory holds the audience-specific copy contract, strategy/copy
prompts, voice, section/block selection, and post-parse for each line.

**Firewall invariant:** everything here is AUDIENCE-LEVEL and template-agnostic —
it must NOT import any template module, and the prompt layer must never see
`templateId`/`variantId` (enforced by each subdir's `promptFirewall.ts`, which
throws in dev if a template field leaks into prompt input). This keeps copy
generation and visual-template selection running in parallel.

## Subdirectories

- **`product/`** — Meridian/Vestria product line.
  - `elementSchema.ts` — V2 element schemas (product copy contract; pure data, spread into the global `layoutElementSchema`).
  - `sectionSelection.ts` — **fixed** section order (no awareness routing yet): `selectProductSections()` returns `MERIDIAN_PILOT_SECTIONS` or, for the Vestria template, the fuller multi-page `VESTRIA_PILOT_SECTIONS`.
  - `strategy/promptsProduct.ts` + `strategy/parseStrategyProduct.ts` — strategy prompt + assembly (`ProductStrategyOutput`; Vestria also proposes a sitemap clamped to `pageArchetypes.ts`).
  - `copyPrompt.ts` / `parseCopy.ts` — copy prompt + post-LLM defaults/backfill.
  - `voice.ts` — Meridian "Modern Tech" voice (type-level, accent-`<em>` emphasis rule).
  - `selectBlocks.ts` — section type → Meridian block layout name (fixed 1:1 map).
  - `promptFirewall.ts`, `pageArchetypes.ts`, `manufacturerFlow.ts`, `accentFallback.ts`.
- **`service/`** — Hearth/Lex/Surge/Lumen service line.
  - `sectionSelection.ts` — **awareness-driven** ordering (see below).
  - `strategy/promptsService.ts` + `strategy/parseStrategyService.ts`, `copyPrompt.ts`, `parseCopy.ts`, `voice.ts` (voice chosen by **business archetype**, never template), `selectUIBlocks.ts`, `elementSchema.ts`, `promptFirewall.ts`.
  - `promptScrape.ts` / `promptUnderstand.ts` — website-import understanding prompts. `formTemplates.ts`, `imageKeywords.ts`, `layoutNames.ts`, `italicAccentFallback.ts`.
- **`writer/`** — bespoke §13 Granth template (Hindi-literary profile sites). Only `elementSchema.ts` — 6 `Granth*` layouts, all `manual_preferred` (seeded, never AI-generated or section-selected).
- **`__tests__/`** — `sectionSelection.test.ts`, `voice.test.ts`, `normalizeServiceCopy.test.ts`, `injectRealTestimonials.test.ts`, etc.

## Section selection: product vs service vs writer

- **Product** (`product/sectionSelection.ts`): flat/fixed pilot order. Awareness engine is deferred (P7). Widens by `templateId` only to swap in Vestria's longer list.
- **Service** (`service/sectionSelection.ts`): `selectServiceSections()` routes the middle-section order by the LLM-inferred **`ServiceAwareness`** state (`search-aware-comparing` = pilot baseline, `search-aware-cold`, `referral-driven`, `relationship-warming`) over the 6 pilot blocks. Conditional sections (`testimonials`, `packages`) are filtered by available assets / `format` (`quote-only` drops packages). Casing contract: lowercase camelCase section types end-to-end.
- **Writer**: no dynamic selection — seeded sections only.

### Template-aware selection (Surge delta)

`selectServiceSections()` takes an optional `templateId`. It is used **only** to
widen the section SET for templates that declare extra section types — `surge` adds
`logos`/`about`/`casestudies`/`stats` (gated on the founder's proof assets) via a
separate `SURGE_MIDDLE_ORDER`. Hearth/Lex/undefined keep the shared 7-section
behavior. This is firewall-safe: selection runs in the strategy route, upstream of
and separate from the copy prompt, so `templateId` never reaches the copy prompt.
(Lumen is a bespoke exclusive template; it does not add delta sections here.)

## Type contracts

`src/types/service.ts` (`audienceTypes`, `templateIds`, `defaultTemplateForAudience`,
render-gate helper) and `src/types/product.ts` (product palettes/variants).
