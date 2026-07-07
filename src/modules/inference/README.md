# `modules/inference` — taxonomy + onboarding-v1 inference stubs

## Files

- **`taxonomy.ts`** — the **live, load-bearing** file. Single source of truth for the
  controlled vocabularies + derived types used across generation: `marketCategories`,
  and the copywriting taxonomies `AwarenessLevel`, `CopyIntent`, `ToneProfile`,
  `MarketSophisticationLevel`, `ProblemType`, etc. Imported by the mock generators,
  the objection-flow engine, and field validation. Edit here to change allowed values.
- **`generateFeatures.ts`**, **`inferHiddenFields.ts`**, **`validateOutput.ts`** —
  **stubs** left from the removed onboarding-v1 inference flow. They log a warning and
  return empty/pass-through values; real inference now happens in the newer generation
  system and the `/api/validate-fields` + `/api/market-insights` routes.
  `validateOutput` is re-exported as `validateInferredFields` for the `validate-fields`
  route's import compatibility.

## Who calls this

`taxonomy.ts` is imported broadly (mock data, prompt/section logic, validation). The
three stub functions are legacy shims kept only so their importers still resolve —
treat them as inert.
