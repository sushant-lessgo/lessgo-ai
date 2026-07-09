# `modules/inference` — taxonomy source of truth

## Files

- **`taxonomy.ts`** — the **live, load-bearing** file. Single source of truth for the
  controlled vocabularies + derived types used across generation: `marketCategories`,
  and the copywriting taxonomies `AwarenessLevel`, `CopyIntent`, `ToneProfile`,
  `MarketSophisticationLevel`, `ProblemType`, etc. Imported by the mock generators,
  the objection-flow engine, and field validation. Edit here to change allowed values.
The onboarding-v1 inference stubs (`generateFeatures.ts`, `inferHiddenFields.ts`,
`validateOutput.ts`) were **deleted in scale-08** along with their only callers, the
`/api/market-insights` + `/api/validate-fields` routes. Real inference now happens in
the newer generation system.

## Who calls this

`taxonomy.ts` is imported broadly (mock data, prompt/section logic, validation).
