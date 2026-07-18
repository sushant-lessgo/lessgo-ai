// src/lib/journeyEngines.ts
// journey-engine eligibility — LEAF module (no React, no seam, no shell, no
// generation imports; its ONLY dependency is the `workCopyEngine` leaf).
//
// This is the ONLY module the onboarding entry page imports to decide whether a
// project takes the journey shell instead of the legacy `WizardShell`. Keeping
// the decision in a leaf is what stops the seam/shell/generation graph from
// landing on the entry bundle (landmine 14) — the seam itself is reached ONLY
// through the async loaders in
// `src/components/onboarding/journey/engines/registry.ts`.
//
// Registry ⟷ this list are kept in lock-step by a drift guard
// (`engines/registry.test.ts`): a listed engine with no seam would dispatch into
// a crash; a registered engine missing here would be unreachable.

import type { CopyEngine } from '@/types/brief';
import { isWorkCopyTemplate } from '@/lib/workCopyEngine';

/**
 * Engines with a journey seam IMPLEMENTED. `work` is the E1 pilot and the only
 * one — thing/trust are declared by the contract but not filled (no facts
 * schema exists for them yet). `place`/`quick-yes` are reserved and not even in
 * `copyEngines`; they wait for the type to widen.
 */
export const JOURNEY_SEAM_ENGINES = ['work'] as const;

export type JourneySeamEngine = (typeof JOURNEY_SEAM_ENGINES)[number];

/** Does a journey seam exist for this engine? (Template-independent.) */
export function hasJourneySeam(engine: CopyEngine | null | undefined): engine is JourneySeamEngine {
  return !!engine && (JOURNEY_SEAM_ENGINES as readonly string[]).includes(engine);
}

/**
 * Post-confirm dispatch gate: seam EXISTS **and** the engine's template gate
 * passes.
 *
 * The template half is not a work hardcode — it is structural. `granth`
 * (writer) is a work-engine template that is NOT on the work copy-engine
 * allow-list; an engine-only dispatch would strand writers in a journey their
 * generation path does not drive. Each engine expresses its own template
 * predicate here (work → `isWorkCopyTemplate`, i.e. atelier only).
 */
export function isJourneyEligible(
  engine: CopyEngine | null | undefined,
  templateId: string | null | undefined
): boolean {
  if (!hasJourneySeam(engine)) return false;
  switch (engine) {
    case 'work':
      return isWorkCopyTemplate(templateId);
    default:
      return false;
  }
}
