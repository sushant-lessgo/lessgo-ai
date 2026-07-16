// src/modules/wizard/work/resumeStep.ts
// ============================================================================
// WORK RESUME RULES — where a returning user re-enters the journey.
//
// Exposed through the work seam (`engines/work.ts` → `resolveResumeStep`).
// STEP 01 is never resumed: it is pre-confirm and owned by the entry page, so
// the resolvable range is 2–6.
//
// ── FIREWALL (landmine 14 — READ BEFORE ADDING AN IMPORT) ───────────────────
// `engines/work.ts` STATICALLY imports this module, and the seam is loaded at
// STEP 01 — PRE-CONFIRM, on the onboarding entry page. So this module's static
// import graph is on the entry path.
//
// The resume rule P5 adds needs `isResumableGeneration`, which lives in
// `@/modules/generation/multiPageAssembly` — a module whose top pulls
// `selectProductBlocks`, `collections/registry` and `hooks/editStore/archetypes`
// (heavy). It MUST be reached with a LAZY `await import(...)` INSIDE the
// function, never a module-top static import. Same for anything under
// `@/modules/wizard/generation/**`.
//
// This rule is mechanically enforced: `journeyAgnostic.test.ts` asserts this
// file statically imports neither graph.
//
// STATUS (phase 2b): a confirmed brief resumes at STEP 02. P5 adds
// mid-fan-out resume (⇒ 5, via the lazy `isResumableGeneration`); P6 adds
// finished-content resume (⇒ 6).
// ============================================================================

import type {
  JourneyLoadedDraft,
  JourneyStep,
} from '@/components/onboarding/journey/engines/types';

/**
 * Resolve the journey step a loaded work draft resumes into.
 *
 * Async by contract (not by need yet): P5's `isResumableGeneration` check is a
 * lazy `await import` — see the firewall note above. Keeping the signature async
 * from the start means P5 fills the body without touching every caller.
 *
 * P2b: a confirmed brief ⇒ STEP 02. `loaded` is deliberately unread for now;
 * the parameter is the contract's, and P5/P6 branch on `loaded.finalContent`.
 */
export async function resolveWorkResumeStep(
  _loaded: JourneyLoadedDraft
): Promise<JourneyStep> {
  return 2;
}
