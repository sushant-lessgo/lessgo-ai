# `modules/mock` — mock field data for demo/testing

## What it is

`mockDataGenerators.ts` produces fake onboarding field values — inferred
`InputVariables` (market category/subcategory, target audience, key problem, stage,
goals, pricing) and `HiddenInferredFields` (awareness, copy intent, tone, etc.) —
drawn at random from the controlled vocabularies in `modules/inference/taxonomy.ts`.
This lets the onboarding/generation flow run end-to-end without spending AI credits.

> Note: the mock **AI copy** responses (strategy/copy JSON) live separately in
> `modules/prompt/mockResponseGenerator*.ts`. This directory only mocks the
> upstream field-inference data.

## How mock mode is toggled

Via `src/lib/mockMode.ts` — `isDemoMode()` returns true when
`NEXT_PUBLIC_USE_MOCK_GPT === 'true'` or the request carries the demo bearer token
`lessgodemomockdata` (`DEMO_TOKEN`).

## Who consumes it

The field-inference API layer when running in demo/mock mode — notably
`/api/validate-fields` (imports `generateMockValidationResults`) — plus tests that
need deterministic-shaped field data without a live AI call.
