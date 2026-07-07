# `modules/generation` — multi-page assembly & post-generation analysis

Small helpers that sit **after** the two-phase copy pipeline (`modules/prompt` /
`modules/audience`) has produced section copy.

## Files

- **`multiPageAssembly.ts`** — AI multi-page `finalContent` assembly (newGeneration
  Phase 3). Builds the exact `finalContent` shape a single-page build produces (flat
  home + chrome + `pages` + `homeId`/`currentPageId`) but from **per-page AI copy**,
  incrementally, with per-page persistence (a paid page is saved before the next
  generates). **Hard invariant:** it never materializes collections or sets
  `collectionKey`/`kind: 'collectionItem'` — a template's catalog is a grid of plain
  `ai_generated` items. Consumed by the multi-page generation flow (Vestria); guarded
  by `multiPageAssembly.test.ts`.
- **`postGenerationAnalysis.ts`** — Analyzes generated content and flags sections
  that need manual review (classifies fields by `fillMode`, estimates customization
  time, produces a `PostGenerationReport`). Reads the layout element schema from
  `modules/sections`.

## Callers

The multi-page assembler is driven by the per-page generation routes / the wizard's
generating step; post-generation analysis is a reporting helper over completed
content. Neither calls an AI provider itself — they operate on already-generated
copy.
