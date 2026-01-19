# Phase 4: Frontend Onboarding UI - Implementation Plan

NOTE: This is part of newOnboardingPlan.md implementation. Go through it for larger context

## Overview

Build 10-step onboarding flow using `useGenerationStore` + v2 APIs.
Target: <2000 LOC (vs archived 4300 LOC)

---

## Sub-Phases

Phase 4 is large. Split into 3 sub-phases:

### Sub-Phase 4A: Core Structure + Simple Steps ✅ COMPLETE

**Files to create:**
1. `src/app/create/[token]/page.tsx` - Step router
2. `src/app/create/[token]/layout.tsx` - Auth wrapper
3. `src/app/create/[token]/components/StepContainer.tsx` - Progress bar + wrapper
4. `src/app/create/[token]/components/steps/OneLinerStep.tsx` - Step 0
5. `src/app/create/[token]/components/steps/LandingGoalStep.tsx` - Step 2
6. `src/app/create/[token]/components/steps/OfferStep.tsx` - Step 3
7. `src/app/create/[token]/components/steps/AssetAvailabilityStep.tsx` - Step 4
8. `src/app/create/[token]/components/shared/OptionCard.tsx` - Reusable card
9. `src/app/create/[token]/components/shared/ErrorRetry.tsx` - Error state

**Exit criteria:**
- Can navigate through steps 0 → 2 → 3 → 4 (skipping 1)
- Store updates correctly on each step
- Back button works
- Progress bar shows correctly

### Sub-Phase 4B: Understanding Step + New API
- `/api/v2/understand` endpoint (NEW)
- UnderstandingStep with playback + edit
- Feature editor (simplified)

### Sub-Phase 4C: Async Steps + Final Flow
- Steps 5, 6, 7, 8, 9
- Loading overlays
- UIBlock questions UI
- Generation animation
- Redirect to editor

---

## File Structure

```
src/app/create/[token]/
  page.tsx                      # Step router (~100 LOC)
  layout.tsx                    # Auth wrapper (~30 LOC)
  components/
    StepContainer.tsx           # Progress bar wrapper (~80 LOC)
    steps/
      OneLinerStep.tsx          # Step 0 (~100 LOC)
      UnderstandingStep.tsx     # Step 1 (~250 LOC)
      LandingGoalStep.tsx       # Step 2 (~100 LOC)
      OfferStep.tsx             # Step 3 (~80 LOC)
      AssetAvailabilityStep.tsx # Step 4 (~120 LOC)
      ResearchStep.tsx          # Step 5 (~80 LOC)
      StrategyStep.tsx          # Step 6 (~80 LOC)
      UIBlockStep.tsx           # Step 7 (~180 LOC)
      GeneratingStep.tsx        # Step 8 (~150 LOC)
      CompleteStep.tsx          # Step 9 (~60 LOC)
    shared/
      LoadingOverlay.tsx        # Rotating messages (~70 LOC)
      OptionCard.tsx            # Selection card (~40 LOC)
      ErrorRetry.tsx            # Error + retry (~50 LOC)
    hooks/
      useStepAPI.ts             # API orchestration (~200 LOC)

src/app/api/v2/understand/
  route.ts                      # NEW endpoint (~150 LOC)
```

**Total: ~1,670 LOC**

---

## Step Breakdown

| Step | Name | UI | API | Auto-advance |
|------|------|-----|-----|--------------|
| 0 | oneLiner | One-liner (req) + Product name (opt) | - | No |
| 1 | understanding | Playback cards + edit | /v2/understand | No |
| 2 | landingGoal | 6 option cards | - | Yes (on select) |
| 3 | offer | Textarea + Continue | - | No |
| 4 | assetAvailability | 3 checkboxes + Continue | - | No |
| 5 | research | Loading overlay | /v2/research | Yes |
| 6 | strategy | Loading overlay | /v2/strategy | Yes |
| 7 | uiblockSelection | Questions or loading | /v2/uiblock-select | Yes (if no questions) |
| 8 | generating | Progress animation | /v2/generate-copy | Yes |
| 9 | complete | Success + redirect | - | Auto-redirect |

---

## Key Design Decisions

| Item | Decision |
|------|----------|
| Layout | Single-column centered (not dual-panel) |
| Understanding playback | All fields on one screen, inline edit |
| UIBlock questions | Batch on single screen |
| Auto-advance | Yes for all loading steps |
| API trigger | Step 0 submit triggers understand call |
| Back navigation | Steps 1-4 only, clears downstream data |
| Product name | User enters (optional) in Step 0 |
| Strategy display | Pure loading, no preview |

---

## Back Navigation

**Allowed steps:** 1, 2, 3, 4 (before loading zone)

| From | To | Clears |
|------|-----|--------|
| 1 | 0 | understanding |
| 2 | 1 | landingGoal |
| 3 | 2 | offer |
| 4 | 3 | assetAvailability |

**Not allowed:** Steps 5+ (loading zone, credits spent)

**Store action needed:** `resetFrom(step)` - clears current step data + all downstream

---

## Step 0: OneLiner Screen

**Two fields:**
```
Primary (required):
  label: "Describe your product in one line"
  placeholder: "AI-powered invoice generator for freelancers"
  validation: min 10 chars

Secondary (optional):
  label: "Product name (optional)"
  placeholder: "Lessgo.ai"
  helper: "Helps us personalize the page. You can change it later."
```

**Store updates:**
- `setOneLiner(value)`
- `setProductName(value)` ← NEW action needed in store

---

## New API: `/api/v2/understand`

**Request:**
```json
{ "oneLiner": "AI invoice generator for freelancers" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": ["Invoicing", "Accounting"],
    "audiences": ["Freelancers", "Small businesses"],
    "whatItDoes": "Creates invoices via AI chat",
    "features": ["AI-powered creation", "Multi-currency", "Payment reminders"]
  },
  "creditsUsed": 1
}
```

Uses GPT-4o-mini for extraction. No web search needed.
Product name NOT extracted - user provides it in Step 0.

---

## Data Flow

```
Step 0: User enters oneLiner + productName (optional)
    ↓ [Continue] triggers /v2/understand
Step 1: Show extraction (categories, audiences, whatItDoes, features)
    ↓ User edits/confirms → [Looks Good]
Step 2: User picks landingGoal
    ↓ [auto-advance on select]
Step 3: User enters offer
    ↓ [Continue]
Step 4: User checks assets
    ↓ [Continue] triggers /v2/research
Step 5: Loading... IVOC fetched
    ↓ [auto-advance] triggers /v2/strategy
Step 6: Loading... strategy generated
    ↓ [auto-advance] triggers /v2/uiblock-select
Step 7: Questions? → show UI → re-call with answers
        No questions? → auto-advance
    ↓ triggers /v2/generate-copy
Step 8: Progress animation
    ↓ [auto-advance on 100%]
Step 9: Success → redirect to /edit/[token]
```

**Product name fallback:** If user skips, extract from oneLiner or use "Your Product".

---

## Error Handling

- Each async step has retry button on error
- Research fail: Allow skip with warning (fallback IVOC)
- Strategy fail: Retry 3x, then manual section selection
- Copy fail: Redirect to editor with empty sections

---

## Critical Files

| File | Purpose |
|------|---------|
| `src/hooks/useGenerationStore.ts` | Store integration (add `productName` state + action) |
| `src/types/generation.ts` | Type definitions |
| `src/app/api/v2/research/route.ts` | Pattern for new endpoint |
| `archive/.../LoadingState.tsx` | Loading overlay pattern |
| `archive/.../FeatureEditor.tsx` | DnD pattern to reuse |

---

## Verification

1. Complete full flow: oneLiner → editor redirect
2. Test back navigation on editable steps
3. Test error + retry on each async step
4. Test UIBlock questions flow (if AI generates questions)
5. Verify credits consumed correctly (1 + 3 + 2 + 1 + 3 = 10 total)

---

## Resolved Questions

| Question | Answer |
|----------|--------|
| Product name | User enters (optional) in Step 0, not AI-guessed |
| Strategy display | Pure loading, no preview (time-to-magic) |
| Brand assets | Dashboard prompt + editor, not in generation flow |
| Back navigation | Steps 1-4 only, clears downstream data |
| Starting sub-phase | 4A: Core structure |

---

# Phase 4A Completion Summary

## Status: ✅ Complete

## Files Created

### Store
- `src/hooks/useGenerationStore.ts` - Zustand store with 10-step flow, productName + resetFrom added

### Layout
- `src/app/create/[token]/page.tsx` - Main page with step router
- `src/app/create/[token]/layout.tsx` - Clerk auth protection
- `src/app/create/[token]/components/StepContainer.tsx` - Header + progress bar + card wrapper

### Steps (4 of 10)
- `src/app/create/[token]/components/steps/OneLinerStep.tsx` - Product description input
- `src/app/create/[token]/components/steps/LandingGoalStep.tsx` - Goal selection (6 options)
- `src/app/create/[token]/components/steps/OfferStep.tsx` - Offer description
- `src/app/create/[token]/components/steps/AssetAvailabilityStep.tsx` - Asset checkboxes

### Shared
- `src/app/create/[token]/components/shared/OptionCard.tsx` - Reusable selection card
- `src/app/create/[token]/components/shared/ErrorRetry.tsx` - Error state component

### Types
- `src/types/generation.ts` - All generation types (LandingGoal, Vibe, SectionType, etc.)

## UI Polish Applied

- Logo: 80px centered with balanced spacers
- Progress bar: h-1.5 with brand-accentPrimary
- Card: White bg, rounded-xl, shadow-sm, border
- Labels: text-gray-700 to avoid hyperlink look
- Buttons: hover:scale-105 + hover:shadow-lg
- Example chips: rounded-full, orange hover
- Step indicator: Inside max-w-3xl container (not floating)
- Responsive: grid-cols-1 sm:grid-cols-2 for options

---

# Phase 4B Completion Summary

## Status: ✅ Complete

## Files Created

### API
- `src/app/api/v2/understand/route.ts` - Product understanding endpoint (1 credit, gpt-4o-mini)

### Steps
- `src/app/create/[token]/components/steps/UnderstandingStep.tsx` - Step 1: playback cards + inline edit

### Shared
- `src/app/create/[token]/components/shared/FeatureListEditor.tsx` - Simple add/remove/edit feature list (no DnD)

## Files Modified

### Credit System
- `src/lib/creditSystem.ts` - Added UNDERSTAND cost (1) + UsageEventType.UNDERSTAND

### Steps
- `src/app/create/[token]/components/steps/OneLinerStep.tsx` - Sets loading state on submit + gibberish validation

### Router
- `src/app/create/[token]/page.tsx` - Wired UnderstandingStep to router

## Features Implemented

### UnderstandingStep UI
- Loading state with rotating messages (800ms)
- Playback view with 4 editable sections:
  - Categories (chip editor: click to remove, input to add)
  - Audiences (chip editor)
  - What It Does (textarea)
  - Features (simple list with add/remove)
- Error state with "Edit your one-liner" (primary) + "Try again" (secondary)
- "Looks Good" button to proceed

### Input Validation (OneLinerStep)
- Min 10 characters
- Min 2 words
- Repeated character detection ("qqqqqqq")
- Repeated word detection ("test test test")
- Vowel ratio + word check for gibberish (>= 20 letters)

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| No DnD for features | Feature order doesn't impact strategy generation |
| Vowel ratio threshold 0.12 | Catches consonant-heavy gibberish, allows "CRM tool" |
| Fail only if BOTH low ratio AND no word has vowel | Reduces false positives on SaaS-y text |
| "Edit your one-liner" as primary error action | Better UX than just "retry" |
| Chip editor: click to remove | Simple, no separate edit mode needed |

---

# Phase 4C Completion Summary

## Status: ✅ Complete

## Files Created

### Steps
- `src/app/create/[token]/components/steps/ResearchStep.tsx` - IVOC research with loading overlay
- `src/app/create/[token]/components/steps/StrategyStep.tsx` - Strategy generation with auto-advance
- `src/app/create/[token]/components/steps/UIBlockStep.tsx` - UIBlock selection + questions UI
- `src/app/create/[token]/components/steps/GeneratingStep.tsx` - Copy generation with progress
- `src/app/create/[token]/components/steps/CompleteStep.tsx` - Redirect to editor

### Shared
- `src/app/create/[token]/components/shared/LoadingOverlay.tsx` - Rotating messages overlay

## Files Modified

### Router
- `src/app/create/[token]/page.tsx` - Wired all async steps to router

### Steps
- `src/app/create/[token]/components/steps/AssetAvailabilityStep.tsx` - Triggers research loading on submit

## Key Bug Fix: UIBlockStep Timing Issue

### Problem
StrategyStep called `setStrategy()` + `nextStep()` synchronously. UIBlockStep mounted before Zustand propagated strategy, causing:
- `strategy` was `null` on first render
- useEffect skipped due to guard
- `nextStep()` advanced past UIBlockStep before it could fetch

### Solution
1. **StrategyStep**: Removed `nextStep()` from success handler
2. **StrategyStep**: Added separate useEffect to auto-advance when strategy ready
3. **UIBlockStep**: Added `hasFetched` guard to prevent double-fetch
4. **UIBlockStep**: Proper useEffect dependencies for strategy reactivity

### Debug Logs Added (to remove later)
- `[CreatePage]` - step rendering
- `[StrategyStep]` - strategy success + auto-advance
- `[UIBlockStep]` - component render, state, guards, API calls

## Flow Now Working

```
Strategy API completes
    ↓
setStrategy(data) + setStrategyLoading(false)
    ↓
Auto-advance useEffect triggers nextStep()
    ↓
UIBlockStep mounts with strategy available
    ↓
useEffect passes guards, calls /api/v2/uiblock-select
    ↓
Selections stored, advances to GeneratingStep
    ↓
Copy generation with section specs
    ↓
CompleteStep redirects to editor
```

## Known Issues (Phase 3, not Phase 4)

| Issue | Cause | Fix Location |
|-------|-------|--------------|
| Missing sections in copy (Header, Footer) | AI not generating all requested sections | Phase 3: copyPrompt.ts |
| Wrong section names (SimpleFooter vs Footer) | AI using different names | Phase 3: copyPrompt.ts |

These are copy generation prompt issues, not frontend flow issues.

---

# Phase 4 Overall Summary

## Status: ✅ Complete

## Sub-Phases
- **4A**: Core structure + simple steps ✅
- **4B**: Understanding step + /api/v2/understand ✅
- **4C**: Async steps + final flow ✅

## Full Step Flow (10 steps)

| Step | Component | API | Credits |
|------|-----------|-----|---------|
| 0 | OneLinerStep | - | 0 |
| 1 | UnderstandingStep | /api/v2/understand | 1 |
| 2 | LandingGoalStep | - | 0 |
| 3 | OfferStep | - | 0 |
| 4 | AssetAvailabilityStep | - | 0 |
| 5 | ResearchStep | /api/v2/research | 3 (0 if cached) |
| 6 | StrategyStep | /api/v2/strategy | 2 |
| 7 | UIBlockStep | /api/v2/uiblock-select | 0 |
| 8 | GeneratingStep | /api/v2/generate-copy | 3 |
| 9 | CompleteStep | /api/saveDraft | 0 |

**Total Credits**: 9 (6 if IVOC cached)

## Files Created (Phase 4 Total)

| Category | Count | Files |
|----------|-------|-------|
| Store | 1 | useGenerationStore.ts |
| Layout | 2 | page.tsx, layout.tsx |
| Container | 1 | StepContainer.tsx |
| Steps | 10 | OneLiner, Understanding, LandingGoal, Offer, AssetAvailability, Research, Strategy, UIBlock, Generating, Complete |
| Shared | 4 | OptionCard, ErrorRetry, FeatureListEditor, LoadingOverlay |
| API | 1 | /api/v2/understand |
| Types | 1 | generation.ts (extended) |

## Open Questions Resolved

| Question | Decision |
|----------|----------|
| Step 7 (strategy display) | Skip display, auto-advance to UIBlock |
| Auto-save frequency | Save once at CompleteStep |
| Back navigation | Allowed on steps 1-4 only (before API calls) |
