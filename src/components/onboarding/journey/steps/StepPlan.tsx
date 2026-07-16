'use client';

// STEP 04 — the plan. AGNOSTIC FRAME.
//
// P2b: placeholder. P4 calls `seam.steps.plan.prepare(wizardApi)` ONCE on entry
// and renders `items(state)` as cards + the build CTA. The engine's `prepare` is
// what stays behind its own idempotency guard (work: the CHARGELESS sitemap
// seed — never the charged path; landmine 8).

import JourneyStepPlaceholder from './JourneyStepPlaceholder';

export default function StepPlan() {
  return (
    <JourneyStepPlaceholder
      testId="step-plan"
      step={4}
      title="Here's the plan"
      note="Page cards arrive in P4 (seam.steps.plan.prepare/items)."
    />
  );
}
