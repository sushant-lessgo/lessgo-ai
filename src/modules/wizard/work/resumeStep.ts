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
// The resume rule below needs `isResumableGeneration`, which lives in
// `@/modules/generation/multiPageAssembly` — a module whose top pulls
// `selectProductBlocks`, `collections/registry` and `hooks/editStore/archetypes`
// (heavy). It IS reached with a LAZY `await import(...)` INSIDE the function,
// never a module-top static import. Same for anything under
// `@/modules/wizard/generation/**`.
//
// This rule is mechanically enforced: `journeyAgnostic.test.ts` asserts this
// file statically imports neither graph.
//
// STATUS (P5): all three rules are live — no content ⇒ STEP 02; an in-progress
// multi-page generation ⇒ STEP 05 (the driver resumes the fan-out); finished
// content ⇒ STEP 06 (the reveal).
//
// ── THE `finalContent` PLUMBING (P2b's trap — CLOSED in P5; keep it closed) ──
// `finalContent` is declared on the contract (`engines/types.ts`), but until P5
// NOTHING PASSED IT: `JourneyShell` called `resolveResumeStep({brief,
// audienceType, templateId})`, so `loaded.finalContent` was ALWAYS `undefined`
// in production and any rule branching on it was DEAD CODE that silently
// resumed at step 2 forever.
//
// P5 widened the chain end to end: `/api/loadDraft` already returns
// `finalContent` → `src/app/onboarding/[token]/page.tsx` load-detection now
// keeps it → `JourneyShell` forwards it into `resolveResumeStep`. If you change
// any link, the rules below silently stop firing.
//
// AND: `resumeStep.test.ts` FABRICATES `loaded` objects, so unit tests go GREEN
// on these rules whether or not the shell passes anything. Green units are NOT
// evidence — the e2e that reloads a COMPLETED project and lands on STEP 06 is.
// ============================================================================

import type {
  JourneyLoadedDraft,
  JourneyStep,
} from '@/components/onboarding/journey/engines/types';

/**
 * Resolve the journey step a loaded work draft resumes into.
 *
 *   • no `finalContent`            ⇒ 2  (confirmed brief, nothing generated yet)
 *   • an in-progress generation    ⇒ 5  (`isResumableGeneration`: the skeleton
 *                                       carries `generationProgress` + sitemap +
 *                                       strategy. `runWorkLLMGeneration` resumes
 *                                       the fan-out itself, skipping
 *                                       `completedPageKeys` — STEP 05 just
 *                                       re-drives it.)
 *   • finished content             ⇒ 6  (`finalizeMultiPageGeneration` DELETES
 *                                       `generationProgress`, which is exactly
 *                                       what makes the two distinguishable —
 *                                       and why omitting finalize would strand a
 *                                       finished site at STEP 05 forever.)
 *
 * `isResumableGeneration` is reached with a LAZY import: it lives in
 * `@/modules/generation/multiPageAssembly`, whose module top is heavy, and this
 * module is statically imported by the seam — i.e. it is on the PRE-CONFIRM
 * entry path (see the firewall note above; `journeyAgnostic.test.ts` enforces
 * it). The async signature exists for exactly this.
 *
 * A non-multipage / legacy draft with content falls to 6: it has SOMETHING to
 * reveal, and 5 would try to re-generate over it.
 */
export async function resolveWorkResumeStep(
  loaded: JourneyLoadedDraft
): Promise<JourneyStep> {
  const fc = loaded?.finalContent;
  if (!fc) return 2;
  try {
    const { isResumableGeneration } = await import('@/modules/generation/multiPageAssembly');
    if (isResumableGeneration(fc)) return 5;
  } catch {
    // Never strand the user on a chunk-load failure: content exists, so the
    // reveal is the honest destination.
  }
  return 6;
}
