# `modules/prompt` — AI copy-generation prompts, parsers & mocks

Builders and parsers for the **legacy two-phase generation pipeline** that powers
`POST /api/generate-landing` (the original product/onboarding-v1 path). The newer
per-audience routes (`/api/audience/{product,service}/{strategy,generate-copy}`)
have their own prompt/parse code under `modules/audience/*` but reuse the same
two-phase shape and the mock generators here.

## Two-phase pipeline

Generation is split into a **strategy** pass then a **copy** pass:

1. **Strategy phase** — `buildStrategyPrompt()` (`buildStrategyPrompt.ts`) assembles
   business context + brand positioning + per-section layout requirements (card
   ranges pulled from the unified layout element schema). The AI returns a
   `copyStrategy` (big idea / core promise / unique mechanism / ideal customer /
   primary emotion / objection priority) plus per-section `cardCounts`.
   `parseStrategyResponse()` (`parseStrategyResponse.ts`) extracts + validates it
   into `ParsedStrategy`; `applyCardCountConstraints()` clamps counts to schema
   min/max.
2. **Copy phase** — `buildStrategicCopyPrompt()` (`buildPrompt.ts`) turns the parsed
   strategy + the **elements map** (from `modules/sections/elementDetermination.ts`)
   into an instruction telling the AI to fill each section's elements to the agreed
   card counts. `parseAiResponse()` (`parseAiResponse.ts`) extracts JSON (tolerant
   of markdown fences / partial output), validates section content, and
   `applyManualPreferredDefaults()` fills `manual_preferred` fields (logos, images)
   with schema defaults.

## Key files

| File | Role |
|------|------|
| `buildStrategyPrompt.ts` | `buildStrategyPrompt()` — phase-1 prompt |
| `parseStrategyResponse.ts` | `parseStrategyResponse()`, `applyCardCountConstraints()` — parse phase-1 |
| `buildPrompt.ts` | `buildStrategicCopyPrompt()` (phase-2 prompt) + `buildFullPrompt` / `buildSectionPrompt` / `buildElementPrompt` (regeneration) + `validateGeneratedJSON` |
| `parseAiResponse.ts` | `parseAiResponse()`, `applyManualPreferredDefaults()` — parse phase-2 |
| `types.ts`, `PromptForm.tsx`, `PromptPage.tsx` | shared prompt types + a small dev UI |

The **layout element schema** (`modules/sections/layoutElementSchema.ts`) is the
single source of truth for what elements each section/layout may contain; prompt
builders read card requirements and element lists from it.

## Provider chain (NOT Anthropic in this path)

`/api/generate-landing` (and the `regenerate-*` routes) call AI directly:

- Primary: **OpenAI `gpt-4o-mini`** when `USE_OPENAI=true`.
- Fallback: **Nebius** (`mistralai/Mixtral-8x7B-Instruct-v0.1`, `api.studio.nebius.ai`).
- Last resort: **mock** response (see below).

> The `@anthropic-ai/sdk` dependency is **not** used in this legacy generation path.
> (The newer audience routes select models via `src/lib/modelConfig.ts`, whose
> `production` tier *can* use Claude — that is a separate code path.)

## Mock generators

Used for demo/testing without spending AI credits (toggled via `src/lib/mockMode.ts`
— `NEXT_PUBLIC_USE_MOCK_GPT=true` or the `lessgodemomockdata` bearer token):

- `mockResponseGenerator.ts` — `generateMockResponse(prompt)` for the legacy pipeline.
- `mockResponseGeneratorProduct.ts` — `generateMockMeridianStrategy/Copy()` for the product route.
- `mockResponseGeneratorService.ts` — `generateMockServiceStrategy/Copy()` for the service route.

## Debug env vars (verbose — off in prod)

Set in `.env.local`:

- `DEBUG_AI_PROMPTS=true` — full strategy + copy prompts.
- `DEBUG_AI_RESPONSES=true` — full AI responses + token usage / parsing steps.
- `DEBUG_ELEMENT_SELECTION=true` — element inclusion decisions (see `modules/sections`).

When unset, prompts/responses are smart-truncated but metadata is still logged.
