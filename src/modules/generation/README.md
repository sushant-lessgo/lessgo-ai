# `modules/generation` — multi-page assembly & post-generation analysis

Small helpers that sit **after** the two-phase copy pipeline
(`modules/audience/{product,service,work}` — the per-audience builders/parsers; note
`modules/prompt` is now mock-generators only) has produced section copy.

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

  **🔒 Adding an engine is a COMPILE ERROR until you handle it (regen-modernization
  phase 6).** More engines are coming (thing / trust / work / place / quick-yes —
  today only `work` is a real named engine; `product`/`service` are audience-derived).
  Every engine-keyed dispatch in `scopedRegen.ts` — `endpointForEngine`,
  `narrowElementsMap`, `buildEnginePrompt`, `buildRetryPrompt` — is now an
  **exhaustive `switch` ending in `assertNeverEngine(engine, …)`**. Add a member to
  `CopyEngine` without handling it in all four and `tsc` fails with
  *"not assignable to parameter of type 'never'"*. This replaced four unguarded
  `else`/ternary fall-throughs to the **service** builder / `copy` endpoint — i.e. a
  future engine would have silently spoken one vocabulary while the validator demanded
  another. That is not hypothetical: it is precisely the atelier bug above (100%
  validation failure, 3 paid calls per request). **Do not "fix" a new-engine compile
  error by adding it to an existing `case` — decide its vocabulary first** (see the
  pitfall above).

  **📌 Known future work (founder direction — NOT implemented):**
  - **Writers/authors will move to the WORK engine** (*"an author's main copy proof is
    their work"*). The seam already exists: `modules/engines/workSections.ts` builds the
    work contract's `about` via `fromDonor(writerElementSchema.GranthParichay)` — the work
    engine already borrows the writer schema. When ready, this is likely just **adding
    `granth` to `WORK_COPY_ENGINE_TEMPLATES` (`src/lib/workCopyEngine.ts:20`)** — the
    chokepoint `resolveCopyEngine` already keys off. No new engine member needed.
  - **Writer regen's 422 is HONEST today.** There is no `api/audience/writer/` route, no
    writer onboarding route, and `modules/audience/writer/` contains only
    `elementSchema.ts`. Writer sites are skeleton/manual-fill and were never
    LLM-generated, so refusing to LLM-regenerate them takes nothing away. Revisit when
    the point above lands.
  - **`audienceType` is being rethought.** `resolveCopyEngine` keys off `audienceType`
    (product/service) plus a template allow-list (work). **It is the ONE place that
    changes if `audienceType` retires** — engines become the primary key and the
    `audienceType` branches collapse into the allow-list mechanism.

  **⚠️ Drift risk (known, accepted).** This is a **parallel reimplementation** of
  `/api/audience/work/regenerate-story`'s loop — not a re-point. That route keeps its
  own `MAX_RETRIES`, its own story-interview prompt, and its own
  `parseWorkCopy → validateStoryAbout` call. The two can drift (shared pieces today:
  `parseWorkCopy`, `validateStoryAbout`, `buildWorkCopyRetryPrompt`). If you change the
  loop here, check the story route too — or re-point it at this primitive.
- **`workCollections.ts`** — the WORK photo binding (work-onboarding-ingestion E2).
  Pure module (firewall: slugify + types only — no store/template/react).
  `deriveWorksEntries(facts)` turns `facts.work.groups[].photos` into
  `CollectionEntry[]` (name, code-derived slug, photos clamped to the 24 per-group
  contract max); `stampWorkGalleryBinding(fc, entries)` joins each HOME
  `work`-section group card by NAME→slug and stamps `cover_image` + `href`
  (`/works/<slug>`, only when the item page exists in `fc.pages` — the guard that
  keeps the engine-wide STEP-02 upload UI safe on non-flipped templates). Both are
  driven from `wizard/generation/work.llm.ts` `runWorksFanOut`, which fans each
  group into a `/works/<slug>` `workdetail` page via `runCollectionFanOut` with an
  **LLM-FREE** `generateItemCopy: async () => ({status:'done', copy:{}})` — records
  the photos verbatim (`photos` ∈ `VERBATIM_ITEM_FIELDS`), **zero AI calls, zero
  new credit op**. The fan-out is LIVE on `atelier` (the `works` capability is
  declared there alone — the skeleton-backed work look); on any other template it
  no-ops (dormant). Empty entries (the no-photos prod reality) return
  byte-identical.
- **`postGenerationAnalysis.ts`** — Analyzes generated content and flags sections
  that need manual review (classifies fields by `fillMode`, estimates customization
  time, produces a `PostGenerationReport`). Reads the layout element schema from
  `modules/sections`.

## Callers

The multi-page assembler is driven by the per-page generation routes / the wizard's
generating step; post-generation analysis is a reporting helper over completed
content. Neither calls an AI provider itself — they operate on already-generated
copy.
