'use client';

// P2b scaffolding ONLY — the shared placeholder body every step renders until
// its real phase lands (03/04 → P4, 05 → P5, 06 → P6). It exists so the step
// machine is walkable and the e2e can assert WHICH step is mounted without any
// step pretending to have real content.
//
// AGNOSTIC: no engine, no seam, no template literal.

import type { JourneyStep } from '../engines/types';

export interface JourneyStepPlaceholderProps {
  testId: string;
  step: JourneyStep;
  title: string;
  /** What lands here, and in which phase. */
  note: string;
}

export default function JourneyStepPlaceholder({
  testId,
  step,
  title,
  note,
}: JourneyStepPlaceholderProps) {
  return (
    <div data-testid={testId} data-journey-step={step} className="space-y-3">
      <h1 className="font-app-sans text-2xl font-semibold text-app-ink">{title}</h1>
      <p className="font-app-sans text-sm text-app-muted">{note}</p>
    </div>
  );
}
