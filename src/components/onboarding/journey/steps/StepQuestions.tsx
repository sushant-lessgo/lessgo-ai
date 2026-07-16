'use client';

// STEP 03 — questions. AGNOSTIC FRAME.
//
// P2b: placeholder. P4 renders `seam.steps.questions(vm)` through a renderer for
// the 3 CLOSED question kinds (text/group/price); every answer's `commit` routes
// through the engine's rail adapter, so an answer can never persist a malformed
// record. The frame never authors a question.

import JourneyStepPlaceholder from './JourneyStepPlaceholder';

export default function StepQuestions() {
  return (
    <JourneyStepPlaceholder
      testId="step-questions"
      step={3}
      title="A few quick questions"
      note="Questions arrive in P4 (seam.steps.questions → commitRail)."
    />
  );
}
