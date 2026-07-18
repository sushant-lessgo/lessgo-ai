# `modules/audience/work` — the WORK copy engine

Generates a complete, lean, voice-true multi-page work site from a work Brief
(`brief.facts.work`, the phase-A `WorkFacts` contract) plus the work library
(groups / photos / praise). Modeled on the PRODUCT pipeline
(`modules/audience/product/*`). (It was never modeled on the legacy shared
`parseStrategyResponse()` / `parseAiResponse()` shapes — those were **deleted** in
regen-modernization; `modules/prompt/` is now mock-generators only.)

`work` is a **copyEngine**, NOT an `audienceType`. A work project's persisted
`audienceType` is bridged to an audience by its picked template
(`serveGate.ts`: `atelier → 'service'`, `granth → 'writer'`); there is no
`'work'` audienceType. Engine membership is decided by the template allow-list
(see the flag section), never by `audienceType`.

## The slim-strategy split — deterministic CODE vs the ONE AI call

Everything decidable from facts is decided in pure code; the LLM contributes
only narrative angle.

- **CODE (deterministic, zero AI):** `slimStrategy.ts` `assembleWorkStructure()`
  computes pages / sections / `cardCounts` / `leadGroups` / `storyBranch` /
  `primaryLanguage` / profession wording from `WorkFacts` + phase-A contracts
  (`engines/workPages.ts`, `engines/workSections.ts`, `engines/workVocabulary.ts`).
  `pricePosition.ts` derives the voice band. `voice.ts` selects the voice.
- **The ONE AI call** (`strategy/` + `/api/audience/work/strategy`): returns ONLY
  `{ positioningAngle, storyAngle, voiceNotes }` — enforced by
  `workStrategy.schema.ts` (zod strips any structural key the model returns, so
  the AI can NEVER contribute structure). `strategy/parseStrategyWork.ts`
  merges the deterministic structure + the 3 narrative fields into
  `WorkStrategyOutput`; it CALLS the shared `clampSectionList` (from product) and
  NEVER edits shared code.
- **The copy call** (`copyPrompt.ts` + `parseCopy.ts` + `/api/audience/work/generate-copy`):
  writes the actual words per page, facts-bound.

## Facts-law rules (`copyPrompt.ts`, `injectPraise.ts`, `parseCopy.ts`)

Facts are law. The copy prompt is static numbered RULES + dynamically-appended
BINDING lines pinned to the seller's ACTUAL stated facts:

- **Verbatim groups/prices** — one card per stated group, NO padding; prices
  verbatim or mode-phrased (exact / `from …` / on-request). The binding line
  enumerates EXACTLY the stated group names + count.
- **Verbatim praise → `proof.quotes`** — every stated praise string is INJECTED
  verbatim at parse time by the work-LOCAL `injectPraise.ts` into
  `proof.elements.quotes[].text` (facts order, clamped to contract max = 3). The
  model writes only the proof FRAMING; it never writes/attributes a quote.
- **Empty-praise strip** — no praise + a `proof` section forces
  `proof.quotes = []` (strips any LLM-fabricated testimonial → zero-fabrication
  holds even with no real praise).
- **Anti-invention** — never invent a service/package/price/client/award/stat/
  date/location/track-record not in facts; graceful omission over fabrication.
- **Anti-padding** — card counts are `min(actual, max)`, never forced up to the
  contract `min`.
- **Contact binding** — the contact section reflects ONLY the stated
  `contactMethod` enum (`whatsapp | booking | form`, default `form`) and MUST NOT
  invent a specific email / phone / URL / social @handle from the business name
  (regression fix: the engine once fabricated `info@<name>.nl`). For `form`, the
  CTA nudges toward the form ("Get in touch" / "Stuur een bericht"), NOT an
  address. A concrete address/number is used ONLY if the WORK LIBRARY states one
  verbatim. (`WorkFacts` has no address slot today, so in practice: never
  invented.)
- **Story ship-grade** — the `about` bio uses ONLY stated facts; no fabricated
  biography / founding year / roster / credentials.

## Firewall invariants (`promptFirewall.ts`)

- `assertNoTemplateLeak(input)` — object-key guard (forbids `templateId` /
  `skeletonId` / `variantId`), run at every prompt-builder entry.
- `assertNoTemplateNamesInText(text)` — **word-boundary** scan for template names
  (atelier/granth/lumen/meridian/…), run at every prompt-builder exit. Word-
  boundary (not `includes`) so seller words like "flexible"/"complex" don't trip
  on `lex`/`surge`/`hearth`.
- No `templateId`/`skeletonId` ever reaches any prompt or parser; the engine is
  fully template-agnostic (the concrete skin/block resolves downstream).

## Price-position derivation (`pricePosition.ts`)

`derivePricePosition(facts) → 'premium' | 'middle' | 'friendly'`, pure/
deterministic. Phase-A ships price *mode/amount* but not the voice *band*, so it
is DERIVED here (no new wizard question, no contract change): opposing PREMIUM vs
FRIENDLY scores from group amounts/modes + dreamClient keywords + praise
keywords, netted; `'middle'` is the safe default. Amount hints are currency-naive
and weak (keywords/mode dominate) — track-E tuning knobs. Feeds the voice
selector.

## Story two-tier (`copyPrompt.ts` + `storyInterview.ts`)

- **Tier 1 — ship-grade auto:** the `about` section is written facts-only by the
  normal copy call (graceful omission, no fabricated bio).
- **Tier 2 — Sugarman interview:** the dedicated
  `/api/audience/work/regenerate-story` route (NOT the legacy
  `/api/regenerate-section`, which runs unvalidated gpt-3.5-turbo) takes 3
  answers (origin / unforgettable moment / craft belief), runs the work
  `storyInterview.ts` prompt (hook on the moment · belief as spine · praise as
  landing) on the SAME strong `work-copy` model, and validates the result against
  `workElementContract.about` before returning. **Two-generator parity:** both
  story paths validate against the IDENTICAL `workElementContract.about` (single
  source of truth) — a parity test fails if either drifts. Guards:
  `assertProjectOwner` + `requireAICredits(SECTION_REGEN)` — no new credit event;
  route returns `content` for the CLIENT to apply (does not persist), like
  regenerate-section.

## Flag + allow-list (`@/lib/workCopyEngine.ts`)

- `WORK_COPY_ENGINE_TEMPLATES = ['atelier']` — the founder-approved allow-list
  (single source of truth; the ONLY tested work-multipage template).
- Generation fork (`wizard/generation/work.llm.ts` → `workCopyEngineEnabled`) =
  `NEXT_PUBLIC_WORK_COPY_ENGINE === 'true'` AND `templateId` in the allow-list.
  Env flag is **build-time inlined** — flipping it needs a REDEPLOY, not a
  runtime toggle (the "kill-switch" is redeploy-speed).
- Editor story panel gate (`MainContent.tsx` → `isWorkCopyTemplate(templateId)`)
  = allow-list membership ONLY (independent of the generation kill-switch).
- Every OTHER work-multipage template keeps today's SKELETON (manual-fill) path
  even with the flag ON, until explicitly added to the allow-list.

## Photo binding — groups → covers + `/works/<slug>` item pages (E2)

The work journey's STEP 02 lets the seller upload photos, which land in
`facts.work.groups[].photos` (`WorkPhotoRef {id,url?,alt?,cover?}` — ONE truth,
the Brief facts bag; NO MediaGroup table, no schema touch). Generation binds them
into the site with **zero AI calls** (the granth LLM-free `generateItemCopy`
precedent), so binding adds no credit op and no prompt input:

- **Covers + href stamping** (`generation/workCollections.ts` →
  `stampWorkGalleryBinding`): each HOME `work`-section group card is joined
  by NAME→slug against the derived entries and stamped with `cover_image`
  (the `cover:true` photo, else the first, else left as-is) and `href`
  (`/works/<slug>`) — the href ONLY when that item page exists in `fc.pages`
  (the guard that keeps the engine-wide STEP-02 UI safe on non-flipped
  templates). Join by name/slug, NEVER index (parseCopy preserves group names
  verbatim — facts law).
- **Item pages** (`deriveWorksEntries` → `runCollectionFanOut`): each group
  fans out into a `/works/<slug>` `workdetail` page carrying the group's
  photos VERBATIM (`photos` is in `VERBATIM_ITEM_FIELDS`, so AI connective copy
  can never clobber the uploaded list). Photos are clamped to the contract max
  (24 per group) at derivation.

**Binding is `atelier`-only**: the `works` capability is declared only on the
(skeleton-backed) `atelier` template; on any other work template the fan-out stays
dormant (no `/works` pages, href never stamped) so the STEP-02 UI is engine-wide
but the reveal is capability-scoped. See `generation/README.md` and
`skeletons/work/resolveWorkBlock.ts` for the render half.

## Key pitfalls

- **Praise → `proof.quotes` is work-LOCAL.** Do NOT "reuse" the service
  `injectRealTestimonials` (`service/parseCopy.ts`) — it targets `sections['testimonials']`
  (work's key is `proof` → silent no-op), picks a SINGLE quote (drops the rest),
  and expects `ScrapedTestimonial` objects (work praise is `string[]`). Three
  shape mismatches; `injectPraise.ts` is the correct seam.
- **Story section is `about`**, a type name DISTINCT from `testimonials`/`proof`,
  so no service testimonials code path can ever touch it.
- **Multipage invariants** (`generation/multiPageAssembly.ts`): plain sitemap
  pages NEVER set `collectionKey`/`kind:'collectionItem'` or call
  `materializeIntoPages`; `finalizeMultiPageGeneration` MUST fire once (goal-CTA
  stamping); retry ×2 stays server-side in the copy route.
- **`work.llm.ts` clones ~180 lines of the `thing.ts` fan-out** (deliberately not
  extracted this track). A future audience-agnostic fan-out refactor must update
  BOTH copies — the breadcrumb is in the `work.llm.ts` header.
- **`copyPrompt.ts` lists ALL non-system contract elements**, not an
  `ai_generated` subset — every work element is `manual_preferred` (granth
  lineage), so the service `generation === 'ai_generated'` filter would emit an
  empty spec.
- **Deferred: `facts.work` editor writeback.** `buildWorkInput` reads the
  hydrated Brief snapshot; it does NOT re-project per-field wizard edits into
  `facts.work`. Fine for the Kundius pilot; a general edit-then-generate flow (and
  the LIVE story-interview submit, which 400s without `facts.work`) needs a
  store→facts writeback. Follow-up before work goes user-facing.
