'use client';

// STEP 02 — show-work. AGNOSTIC FRAME.
//
// P2b: a placeholder body proving the step machine walks. P4 renders
// `seam.steps.showWork` (title/body/icon) as a dropzone-styled stub +
// "Skip for now". The frame NEVER knows what an engine's work looks like.

import JourneyStepPlaceholder from './JourneyStepPlaceholder';

export default function StepShowWork() {
  return (
    <JourneyStepPlaceholder
      testId="step-show-work"
      step={2}
      title="Show your work"
      note="Content arrives in P4 (seam.steps.showWork + Skip)."
    />
  );
}
