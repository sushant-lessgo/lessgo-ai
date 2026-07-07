# `modules/sections` — section & layout schemas, element determination

The **content contract** layer: which sections a page has, which layout each uses,
and which elements (fields) each section/layout may contain. This is what the
prompt builders (`modules/prompt`) and the strategy/copy phases are driven from.

## Section IDs

Section types are the camelCase ids in `sectionList.ts` (`hero`, `features`, `faq`,
`beforeAfter`, `founderNote`, …). At runtime, live section instances follow the
`${type}-${uuid}` convention (e.g. `hero-abc12345`). `getSectionType()` in
`elementDetermination.ts` maps an id back to its PascalCase type (`hero` → `Hero`).

## Key files

| File | Role |
|------|------|
| `sectionList.ts` | `sectionList` — the master catalog of section types (id, label, order, `required`, spacing/density hints). Product's fixed section order is derived from this. |
| `layoutElementSchema.ts` | The **unified/V2 element schema registry** — single source of truth for what each layout contains. Composes the per-audience schemas (`meridianElementSchema`, `vestriaElementSchema`, `serviceElementSchema`, `writerElementSchema`). Exposes `getAllElements`, `getLayoutElements`, `getCardRequirements`, `isUnifiedSchema`/`isV2Schema`, `applyAllSchemaDefaults`. Elements carry a `fillMode` (`ai_generated`, `manual_preferred`, `ai_generated_needs_review`, `system`, `hybrid`). |
| `elementDetermination.ts` | `getCompleteElementsMap()` — walks the page's sections+layouts and produces the `ElementsMap` (per section: mandatory / optional / all / excluded elements). **No pre-scoring of optionals** — all elements are surfaced and the AI decides which to fill at generation time. Also `validateSectionContent()`. |
| `layoutRegistry.ts` | `layoutRegistry` — section type → list of available layout names. |
| `getLayoutRequirements.ts` | Extracts per-section card requirements for the strategy prompt (`summarizeRequirementsForPrompt`). |
| `getSectionsFromRules.ts` | Rule-driven section selection using the objection-flow engine + asset-aware substitution (legacy/product objection path). |
| `objectionFlowEngine.ts` | Awareness/objection-driven section sequencing (`getSectionsFromObjectionFlows`), keyed on taxonomy fields (awareness, sophistication, problem type). |
| `assetSubstitutionEngine.ts` | Substitutes/removes sections when required assets (testimonials, logos…) are unavailable, preserving objection coverage. |
| `defaultPlaceholders.ts` | Default placeholder values for `manual_preferred` fields (not sent to the AI). |
| `flowContextTypes.ts` / `generateFlowContext.ts` | Flow-aware context so layout pickers keep tonal coherence across sections. |

## Element determination flow

`getCompleteElementsMap(onboardingStore, pageStore)` →
for each section id, look up its layout → `getLayoutElements(layout)` from the
schema → split into mandatory vs optional → return `{ sectionId, sectionType,
layout, mandatoryElements, optionalElements, allElements, excludedElements }`.
The AI sees all elements and chooses exclusions itself (legacy business-context
scoring was removed). `DEBUG_ELEMENT_SELECTION=true` logs the resulting map.

## Section selection: product vs service

Section **ordering** is audience-specific and lives under `modules/audience`
(product = fixed list; service = awareness-driven). This directory owns the
**schema/rules** those selectors read. See `modules/audience/README.md`.
