'use client';

// STEP 06 — the reveal. FULLY AGNOSTIC (token-based; engine #2 inherits it
// verbatim).
//
// P2b: placeholder. P6 renders `<iframe src="/preview/{token}?chrome=0">` — a
// SEPARATE document, which is what guarantees `.app-chrome` can never reach the
// revealed site (landmine 1) — plus the "Open the editor" CTA. NO publish
// surface. There must never be a non-iframe rendering of the site in the shell.

import JourneyStepPlaceholder from './JourneyStepPlaceholder';

export default function StepReveal() {
  return (
    <JourneyStepPlaceholder
      testId="step-reveal"
      step={6}
      title="Your site"
      note="The reveal iframe + editor CTA arrive in P6."
    />
  );
}
