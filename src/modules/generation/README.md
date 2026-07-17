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
- **`scopedRegen.ts`** — the **scoped-regeneration primitive** (regen-modernization
  phase 2): the ONE engine all three regen scopes (`'all'` / `'section'` / `'element'`)
  run on. Generalizes `/api/audience/work/regenerate-story`'s size-1 identity-uiblocks
  trick — it narrows the elements map to the scope's target, builds the prompt with the
  **engine's own first-gen copy builder**, calls the hardened `generateRawJson`, and owns
  its validate→retry loop (`MAX_RETRIES = 2`; inherits no fallback). **Invariants:**
  dispatch keys off the **engine** (`resolveCopyEngine` — `isWorkCopyTemplate(templateId)`
  first, because atelier is a work-engine project with `audienceType: 'service'`), never
  `audienceType`; the engine also yields the EXISTING modelConfig endpoint (`'work'` →
  `'work-copy'`, else `'copy'`) so regen rides its first-gen model tier; writer/ecommerce
  throw `UnsupportedProjectError` on the real path (route → 422, before any AI call or
  charge) while `resolveMockEngine` is lenient so mock mode never 422s. Guarded by
  `scopedRegen.test.ts` (full dispatch matrix). Routes are wired in phases 3–5.

  **⚠️ Vocabulary pitfall (engine-aware narrowing).** Narrowing/validation must use
  the vocabulary the engine's PROMPT actually asks for. Product/service prompts are
  built from the layout schema (`getCompleteElementsMap` → `layoutElementSchema`), so
  they narrow that way. The **work** engine's prompt is built from the frozen
  `workElementContract` (`modules/engines/workSections.ts`), which does NOT match the
  layout vocabulary (atelier `about`: contract asks `heading`/`bio`, the layout map
  says `headline`/`body`; atelier `work`/`services` layouts resolve to *no* elements at
  all). Validating a work response against layout keys fails 100% of the time and burns
  `MAX_RETRIES + 1` paid `work-copy` calls — or passes vacuously with empty copy. Hence
  `narrowElementsMap(input, scope, engine)` and the work path's `parseWorkCopy(...)
  → validateScopedSubset → validateStoryAbout` order (the same order `regenerate-story`
  runs). Adding an engine ⇒ decide its vocabulary here first.

  **⚠️ Drift risk (known, accepted).** This is a **parallel reimplementation** of
  `/api/audience/work/regenerate-story`'s loop — not a re-point. That route keeps its
  own `MAX_RETRIES`, its own story-interview prompt, and its own
  `parseWorkCopy → validateStoryAbout` call. The two can drift (shared pieces today:
  `parseWorkCopy`, `validateStoryAbout`, `buildWorkCopyRetryPrompt`). If you change the
  loop here, check the story route too — or re-point it at this primitive.
- **`postGenerationAnalysis.ts`** — Analyzes generated content and flags sections
  that need manual review (classifies fields by `fillMode`, estimates customization
  time, produces a `PostGenerationReport`). Reads the layout element schema from
  `modules/sections`.

## Callers

The multi-page assembler is driven by the per-page generation routes / the wizard's
generating step; post-generation analysis is a reporting helper over completed
content. Neither calls an AI provider itself — they operate on already-generated
copy.
