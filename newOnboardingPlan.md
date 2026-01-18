# New Generation System - Implementation Plan

Reference: `newOnboarding.md` for detailed requirements.

---

## Locked Decisions

| Decision | Answer |
|----------|--------|
| Approach | Clean replace with archive |
| Old code | Move to `/archive/onboarding-v1/` |
| Structure | One project, 5 phases |
| Migration | None (no existing users) |
| Timeline | Quality over speed |

---

## What's Staying (Untouched)

```
/src/hooks/useEditStoreLegacy.ts     # Editor state
/src/modules/UIBlocks/               # All 88 blocks (audit for extras)
/src/modules/Design/                 # Theme system (Vibe maps here)
/src/app/edit/[token]/               # Editor
/src/app/preview/[token]/            # Preview
/src/app/p/[slug]/                   # Published pages
/src/components/forms/               # Form system
/src/utils/autoSaveDraft.ts          # Persistence
/src/services/pexels/                # Image sourcing
```

---

## What's Being Archived

```
/archive/onboarding-v1/
  ├── components/                    # from /src/app/create/[token]/components/
  ├── hooks/
  │   └── useOnboardingStore.ts
  ├── modules/
  │   └── inference/                 # inferFields, inferHiddenFields, validateOutput
  └── api/
      └── infer-fields/
```

---

## What's Being Built

```
/src/app/create/[token]/             # New 10-step flow
/src/hooks/useGenerationStore.ts     # New store (simpler)
/src/modules/generation/             # Strategy, IVOC, UIBlock selection logic
/src/types/generation.ts             # New types (Vibe, OneReader, etc.)
/api/v2/research/                    # Tavily IVOC
/api/v2/strategy/                    # One Reader + section selection
/api/v2/uiblock-select/              # AI UIBlock selection
/api/v2/generate-copy/               # Single-call copy generation
```

---

## Phase Overview

### Phase 1: Foundation

**Goal:** Clean slate + type system + store ready

**Deliverables:**
- Old onboarding archived
- New TypeScript types defined (Vibe, LandingGoal, OneReader, OneIdea, IVOC, etc.)
- `useGenerationStore` created with new state shape
- UIBlock audit complete (verify 88, archive extras)
- Schema sync check (layoutElementSchema ↔ component ↔ published)

**Exit Criteria:**
- Types compile
- Store initializes
- UIBlocks match spec

**Status: ✅ COMPLETE (2026-01-18)**

<details>
<summary>Phase 1 Completion Summary</summary>

### Archived (~4,300 LOC)

| Location | Contents |
|----------|----------|
| `archive/onboarding-v1/src/` | Old onboarding flow (page, layout, 14 components, store, inference modules, API route) |
| `archive/uiblocks-extra/` | 33 extra UIBlocks (Close, Comparison, Integration, Security, Miscellaneous) |

### New Files Created

| File | Purpose |
|------|---------|
| `src/types/generation.ts` | New types: Vibe, LandingGoal, PricingModel, AwarenessLevel, SophisticationLevel, SectionType (17), OneReader, OneIdea, IVOC, FeatureAnalysis, StrategyOutput, validators |
| `src/hooks/useGenerationStore.ts` | New 10-step generation flow store with proper state shape |
| `src/app/create/[token]/page.tsx` | Placeholder page (new flow coming Phase 4) |

### UIBlock Cleanup

| Change | Details |
|--------|---------|
| Folder renames | Objection→ObjectionHandle, PrimaryCTA→CTA, Testimonial→Testimonials, UseCase→UseCases |
| Hero file renames | PascalCase (two-step git mv for Windows) |
| Registry updates | componentRegistry.ts + componentRegistry.published.ts imports fixed |
| Archived sections | Commented out in registries (security, integrations, comparisonTable, closeSection, miscellaneous) |

### Compatibility Decisions

| Item | Decision |
|------|----------|
| `useOnboardingStore.ts` | Kept in place - editor has deep dependencies |
| Inference modules | Stubs created (validateOutput, inferHiddenFields, generateFeatures) |
| `tsconfig.json` | Added "archive" to exclude array |

### Verification

- TypeScript: ✅ No errors
- Production build: ✅ Successful
- UIBlock count: 88 active (matches spec)

</details>

---

### Phase 2: Backend - Research & Strategy

**Goal:** IVOC + strategy generation working

**Deliverables:**
- `/api/v2/research` - Tavily integration, IVOC extraction
- IVOC cache system (DB table or existing pattern)
- `/api/v2/strategy` - One Reader, One Idea, objection sequence, section selection
- Strategy prompt tested with real inputs


**Exit Criteria:**
- Can call research API → get IVOC
- Can call strategy API → get sections + One Reader + Vibe

**Dependencies:** Phase 1 types

**Status: ✅ COMPLETE (2026-01-18)**

<details>
<summary>Phase 2 Completion Summary</summary>

### New Files Created

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Added IVOCCache model with normalized keys |
| `src/lib/normalize.ts` | slugify() for cache key normalization |
| `src/lib/tavily.ts` | Tavily API client |
| `src/lib/ivocExtractor.ts` | LLM-based IVOC extraction + fallback |
| `src/app/api/v2/research/route.ts` | IVOC research endpoint (3 credits, 0 if cached) |
| `src/app/api/v2/strategy/route.ts` | Strategy generation endpoint (2 credits) |
| `src/modules/strategy/prompts.ts` | Strategy prompt builder |
| `src/modules/strategy/parseStrategy.ts` | LLM response parser + normalizer |
| `src/modules/strategy/validateSections.ts` | Section validation (assets, FAQ placement) |

### Updated Files

| File | Changes |
|------|---------|
| `src/lib/creditSystem.ts` | Added IVOC_RESEARCH (3), STRATEGY_GENERATION (2) |
| `src/middleware.ts` | Added `/api/v2/research`, `/api/v2/strategy` to public routes |

### Key Implementation Details

| Feature | Implementation |
|---------|----------------|
| Cache normalization | `slugify()` - "Freelancers" and "freelancer" → same key |
| Cache hits | 0 credits charged (auth checked after cache) |
| Tavily query | Includes reddit, forum, alternatives, complaints |
| Fallback chain | Tavily → GPT-4o fallback → recoverable error |
| FAQ placement | Low friction → after CTA, High friction → before CTA |
| Awareness normalization | "Solution-aware" → "solution-aware" |

### Verification

- TypeScript: ✅ No errors
- Production build: ✅ Successful

### Live Testing Results

| Test | Result |
|------|--------|
| Research API (fresh) | ✅ `source: "tavily"`, `cached: false`, `creditsUsed: 3` |
| Research API (cached) | ✅ `cached: true`, `creditsUsed: 0` |
| Strategy API | ✅ `vibe: "Light Trust"`, sections generated, `creditsUsed: 2` |
| Total credits flow | ✅ 3 + 0 + 2 = 5 credits for full research+strategy |

**Sample Strategy Output:**
- Vibe: Light Trust
- OneReader: Generated with awareness, sophistication, emotionalState
- OneIdea: bigBenefit, uniqueMechanism, reasonToBelieve
- Sections: Header → Hero → ... → CTA → FAQ → Footer (FAQ after CTA for free-trial = low friction)

</details>

---

### Phase 3: Backend - Selection & Copy

**Goal:** UIBlock selection + copy generation working

**Deliverables:**
- `/api/v2/uiblock-select` - AI selects UIBlocks, generates questions if needed
- `/api/v2/generate-copy` - Single-call copy for entire page
- Vibe → Design mapping (no API, pure function)
- Element type handling (ai_generated, manual_preferred, ai_generated_needs_review)

**Exit Criteria:**
- Can call UIBlock API → get selections + optional questions
- Can call copy API → get full page content
- Design derives correctly from Vibe

**Dependencies:** Phase 2 strategy output

**Status: ✅ COMPLETE (2026-01-19)**

<details>
<summary>Phase 3 Completion Summary</summary>

### New Files Created

| File | Purpose |
|------|---------|
| `src/app/api/v2/uiblock-select/route.ts` | UIBlock selection endpoint (1 credit) |
| `src/app/api/v2/generate-copy/route.ts` | Copy generation endpoint (3 credits) |
| `src/modules/uiblock/uiblockTags.ts` | Tags for 88 UIBlocks: text-heavy, accordion, image, persona-aware |
| `src/modules/uiblock/selectionPrompt.ts` | Selection prompt builder with question batching |
| `src/modules/uiblock/compositionRules.ts` | Composition validation + auto-fix |
| `src/modules/uiblock/layoutNames.ts` | Server-safe layout registry (no React imports) |
| `src/modules/copy/copyPrompt.ts` | Copy generation prompt builder |
| `src/modules/copy/parseCopy.ts` | Response parser with needsReview wrapping |
| `src/modules/Design/vibeMapping.ts` | Vibe → design tokens (uses existing BackgroundCategory) |

### Updated Files

| File | Changes |
|------|---------|
| `src/types/generation.ts` | Added UIBlockTag, UIBlockQuestion, UIBlockSelectRequest/Response, ElementValue, SectionCopy, GenerateCopyRequest/Response |
| `src/lib/creditSystem.ts` | Added UIBLOCK_SELECT (1), GENERATE_COPY (3) |
| `src/middleware.ts` | Added `/api/v2/uiblock-select`, `/api/v2/generate-copy` to public routes |

### Key Implementation Details

| Feature | Implementation |
|---------|----------------|
| UIBlock tags | 4 types: text-heavy, accordion, image, persona-aware |
| Composition rules | Max 2 text-heavy in sequence, max 1 accordion, 1+ image in middle third |
| Auto-fix | Automatically swaps layouts to fix composition violations |
| Question batching | All unresolved sections returned in single response |
| Card counts | Output not input - AI decides within min/max bounds from schema |
| needsReview | Stats, testimonials, pricing elements wrapped with `{ value, needsReview: true }` |
| Retry logic | Copy generation retries 2x on parse failure with repair prompt |
| Vibe mapping | Compatible with existing BackgroundCategory system from primaryBackgrounds.ts |

### Vibe → Design Mapping

| Vibe | Background | Heading Font | Accent Energy |
|------|------------|--------------|---------------|
| Dark Tech | technical | Sora | high |
| Light Trust | professional | Inter | medium |
| Warm Friendly | friendly | DM Sans | medium |
| Bold Energy | professional | Sora | high |
| Calm Minimal | professional | Playfair Display | low |

### API Response Shapes

**UIBlock Select (resolved):**
```typescript
{ success: true, uiblocks: Record<SectionType, string>, creditsUsed: 1 }
```

**UIBlock Select (needs input):**
```typescript
{ success: true, needsInput: true, uiblocks: Partial<...>, questions: UIBlockQuestion[] }
```

**Generate Copy:**
```typescript
{ success: true, sections: Record<string, { elements: Record<string, ElementValue> }>, creditsUsed: 3 }
```

### Verification

- TypeScript: ✅ No errors
- Production build: ✅ Successful

### Decisions Made

| Question | Decision |
|----------|----------|
| Questions UX | Batch all questions, return once |
| Card counts | Output not input (spec: "output not input") |
| Image layouts | Keep available, use Pexels placeholders |
| No compatible layout | Skip section (fallback), not error |
| Composition rules | Auto-fix violations, not just warn |
| Element classification | Explicit in schema (not pattern matching) |
| hasVideo question | Removed - user can change layout in editor |

</details>

---

### Phase 4: Frontend - Onboarding UI

**Goal:** 10-step flow complete

**Steps (from newOnboarding.md):**
1. OneLiner input
2. Understanding playback (categories, audiences, features) - user confirms/edits
3. Landing goal selection (waitlist/signup/free-trial/buy/demo/download)
4. Offer input ("14-day free trial, no credit card")
5. Asset availability checkboxes (testimonials, social proof, results)
6. Research loading (IVOC fetch)
7. Strategy display (optional review?)
8. UIBlock questions (if AI needs input)
9. Generation loading
10. Redirect to editor

**Deliverables:**
- All step components
- Step navigation logic
- Loading states
- Error handling
- Auto-save integration

**Exit Criteria:**
- Can complete full flow
- Data flows correctly to APIs
- Redirects to editor with generated page

**Dependencies:** Phases 2 & 3 APIs

---

### Phase 5: Integration & Polish

**Goal:** Production-ready

**Deliverables:**
- Connect generation output → EditStore
- Page assembly (sections + layouts + content + design + images)
- End-to-end testing
- Edge cases (API failures, empty states, long inputs)
- "Verify this" flags for ai_generated_needs_review elements
- Pexels image selection by Vibe

**Exit Criteria:**
- Full flow works: oneLiner → published page
- All element types handled correctly
- Error states graceful
- Performance acceptable

**Dependencies:** Phase 4 complete

---

## Phase Dependencies

```
Phase 1 (Foundation)
    ↓
Phase 2 (Research & Strategy)
    ↓
Phase 3 (Selection & Copy)
    ↓
Phase 4 (Frontend)
    ↓
Phase 5 (Integration)
```

Linear dependency. Each phase builds on previous.

---

## Open Questions (To Address Per-Phase)

### Phase 1 ✅ RESOLVED
- ~~Exact file list to archive?~~ → See completion summary above
- ~~UIBlock extras - archive or delete?~~ → Archived to `archive/uiblocks-extra/`
- ~~Schema sync - automated check or manual audit?~~ → Manual audit done via registry updates

### Phase 2
- IVOC cache - new table or reuse TaxonomyEmbedding pattern?
- Tavily rate limits / cost?
- Strategy prompt refinement iterations?

### Phase 3 ✅ RESOLVED
- ~~UIBlock questions UX - batch or inline?~~ → Batch all questions in single response
- ~~Copy generation - retry strategy on failure?~~ → 2 retries with repair prompt, no placeholder fallback
- ~~Element character limits - enforce in prompt or validate after?~~ → Enforce in prompt + trim arrays to max after

### Phase 4
- Step 7 (strategy display) - show to user or skip?
- Auto-save frequency?
- Back navigation - allowed or linear only?

### Phase 5
- Pexels query construction from Vibe?
- ai_generated_needs_review UI treatment in editor?
- Performance benchmarks?

---

## Success Metrics

| Metric | Target |
|--------|--------|
| OneLiner → Editor | < 60 seconds (excluding research) |
| Copy quality | No placeholder text |
| UIBlock selection | Matches page composition rules |
| Error rate | < 5% generation failures |
| Code complexity | Simpler than v1 (~12,500 LOC → target < 5,000) |

---

## Notes

- Quality over speed
- Each phase planned in detail before starting
- Plans reference this file + newOnboarding.md
- Detailed questions resolved per-phase
