// src/components/onboarding/journey/engines/registry.ts
// Dynamic-import seam registry — same dispatch-firewall pattern as
// `src/modules/templates/registry.ts`: each engine maps to a LOADER that
// import()s its seam, so seam code lands in its own chunk and NEVER on the
// onboarding entry bundle. Nothing here is a static import of a seam module;
// the only way in is the async loader.
//
// `loadJourneySeam` is called by `JourneyEntryStep` (STEP 01) and by
// `JourneyShell` (which resolves the seam ONCE and passes it down to the step
// bodies as a prop — P5 folded away the per-step `useJourneySeam` hook). Both
// are themselves `ssr:false` dynamic imports. Dispatch DECISIONS use the leaf
// `src/lib/journeyEngines.ts` instead — never this file.
//
// `Partial<Record<…>>`: `thing`/`trust` are declared by the contract but have no
// seam (no facts schema exists for them). Keys here ⟷ `JOURNEY_SEAM_ENGINES`
// are locked together by `registry.test.ts`.

import type { CopyEngine } from '@/types/brief';
import type { JourneyEngineSeam } from './types';

export type JourneySeamLoader = () => Promise<JourneyEngineSeam>;

export const journeySeamRegistry: Partial<Record<CopyEngine, JourneySeamLoader>> = {
  work: async () => {
    const m = await import('./work');
    return m.workJourneySeam;
  },
};

/** Load the seam for `engine`, or `null` when the engine has none. */
export async function loadJourneySeam(
  engine: CopyEngine | null | undefined
): Promise<JourneyEngineSeam | null> {
  const loader = engine ? journeySeamRegistry[engine] : undefined;
  if (!loader) return null;
  return loader();
}
