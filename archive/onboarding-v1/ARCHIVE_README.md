# Archived: Onboarding System v1

**Archived:** 2026-01-18

**Reason:** Replaced by new AI-driven generation flow (see `newOnboarding.md`)

## What's Here

Old 7-field onboarding system with confidence-based field inference:

- `src/app/create/[token]/` - Onboarding pages and components
- `src/hooks/useOnboardingStore.ts` - Zustand store for onboarding state
- `src/modules/inference/` - AI field inference (inferFields, inferHiddenFields, validateOutput, generateFeatures)
- `src/app/api/infer-fields/` - API route for field inference

## What's Still Active

- `src/modules/inference/taxonomy.ts` - Kept in place, used by other systems

## New System

See:
- `newOnboarding.md` - Requirements spec
- `newOnboardingPlan.md` - Implementation plan
- `src/types/generation.ts` - New types
- `src/hooks/useGenerationStore.ts` - New store
