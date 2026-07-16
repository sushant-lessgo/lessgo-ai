'use client';

// STEP 05 — we write and build it. AGNOSTIC FRAME.
//
// P2b: placeholder — it does NOT call the seam yet. P5 wires:
//   `seam.preflight(state)` → `engine-disabled` ⇒ an EXPLICIT error state (never
//   a silent skeleton — landmine 2), `missing-facts` ⇒ back to STEP 03; then
//   `seam.runGeneration(state, {onStage, onPageProgress})` → success ⇒ step 6.
// There is no generic generation driver in this codebase: the seam OWNS the
// drive and this step owns only UI + state routing. Do not pretend otherwise.

import JourneyStepPlaceholder from './JourneyStepPlaceholder';

export default function StepBuilding() {
  return (
    <JourneyStepPlaceholder
      testId="step-building"
      step={5}
      title="Building your site"
      note="Generation arrives in P5 (seam.preflight → seam.runGeneration)."
    />
  );
}
