# `modules/prompt` — AI copy-generation mocks

**This module is now mocks-only.** The legacy prompt builders and parsers that
used to live here were **deleted in regen-modernization (phase 6)**:

| Deleted file | What replaced it |
|---|---|
| `buildPrompt.ts` (`buildFullPrompt`/`buildSectionPrompt`/`buildElementPrompt`) | Per-audience copy builders under `modules/audience/{product,service,work}/copyPrompt.ts`, driven for regen by `modules/generation/scopedRegen.ts` |
| `parseAiResponse.ts` (`parseAiResponse()`, `applyManualPreferredDefaults()`) | Per-audience parsers (`modules/audience/service/parseCopy.ts`, `product/parseCopy.ts`, `work/parseCopy.ts`) + `scopedRegen`'s `validateScopedSubset` |
| `parseStrategyResponse.ts` (`parseStrategyResponse()`, `applyCardCountConstraints()`) | Per-audience strategy assembly under `modules/audience/*/strategy*` (it was already orphaned — its only edge was a type-only import from `buildPrompt.ts`) |
| `mockResponseGenerator.ts` (`generateMockResponse(prompt)`) | The per-engine siblings below; the regen routes generate their mock strings locally |

(Earlier, in scale-08, the `POST /api/generate-landing` route, its
`buildStrategyPrompt.ts`, and the `PromptForm.tsx`/`PromptPage.tsx` dev UI were
deleted.)

## Key files

| File | Role |
|------|------|
| `mockResponseGeneratorProduct.ts` | `generateMockMeridianStrategy/Copy()` — product/thing routes |
| `mockResponseGeneratorService.ts` | `generateMockServiceStrategy/Copy()` — service/trust routes |
| `mockResponseGeneratorWork.ts` | `generateMockWorkStrategy/Copy()` — work routes (atelier) |
| `types.ts` | shared prompt types — **orphaned** by the phase-6 deletion (zero importers); left in place, safe to delete |

These are consumed by `/api/audience/{product,service,work}/{strategy,generate-copy}`,
`/api/audience/work/regenerate-story`, the golden/contract tests
(`modules/audience/__tests__/`), and `scripts/{testServicePipeline,dogfoodServicePipeline}.ts`.

## Where copy generation actually lives now

- **First generation:** `/api/audience/{product,service,work}/{strategy,generate-copy}` — prompt builders + parsers under `modules/audience/*`.
- **Regeneration** (`/api/regenerate-{element,section,content}`): `modules/generation/scopedRegen.ts` — server-side prompt construction, engine dispatch (`resolveCopyEngine`), Zod-validated output, route-owned validate→retry loop.
- **Model selection:** `src/lib/modelConfig.ts` (endpoints incl. `copy` / `work-copy`); the shared client is `src/lib/aiClient.ts`.

The **layout element schema** (`modules/sections/layoutElementSchema.ts`) remains the
single source of truth for what elements each section/layout may contain (product/service);
the **work** engine's vocabulary is `workElementContract` instead — see
`modules/generation/README.md` for that pitfall.

## Mock mode

Toggled via `src/lib/mockMode.ts` — `NEXT_PUBLIC_USE_MOCK_GPT=true` or the
`lessgodemomockdata` demo token.

## Debug env vars (verbose — off in prod)

Set in `.env.local`:

- `DEBUG_AI_PROMPTS=true` — full strategy + copy prompts.
- `DEBUG_AI_RESPONSES=true` — full AI responses + token usage / parsing steps.
- `DEBUG_ELEMENT_SELECTION=true` — element inclusion decisions (see `modules/sections`).

When unset, prompts/responses are smart-truncated but metadata is still logged.
