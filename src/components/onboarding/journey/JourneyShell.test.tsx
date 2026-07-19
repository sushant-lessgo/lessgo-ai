import { describe, it, expect } from 'vitest';
import { footerNextVisible } from './JourneyShell';
import type { JourneyStep } from './engines/types';

// B16 (qa-0718): steps that render their own primary advance CTA (2 = ShowWork,
// 4 = Plan) must NOT also show the generic footer "Continue" (journey-next).
// Step 4's footer Continue was also a hazard — it advances via bare
// setJourneyStep, skipping StepPlan's awaited commitRail persistence.
//
// footerNextVisible is the exact predicate the JSX is wired to (full-shell
// render blocks on the async seam loader), so this guards real behavior.
describe('footerNextVisible (B16 duplicate-advance guard)', () => {
  it('hides footer Continue on step 4 (Plan owns "Build my site")', () => {
    expect(footerNextVisible(4 as JourneyStep)).toBe(false);
  });

  it('hides footer Continue on step 2 (ShowWork owns "Looks right")', () => {
    expect(footerNextVisible(2 as JourneyStep)).toBe(false);
  });

  it('keeps footer Continue on step 3 (Questions advances via the footer)', () => {
    expect(footerNextVisible(3 as JourneyStep)).toBe(true);
  });

  it('keeps footer Continue on steps 5 and 6 (no own advance CTA)', () => {
    expect(footerNextVisible(5 as JourneyStep)).toBe(true);
    expect(footerNextVisible(6 as JourneyStep)).toBe(true);
  });
});
