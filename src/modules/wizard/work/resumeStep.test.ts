// Work resume rules (work-onboarding-shell P2b).
// The firewall half of this module's contract (no static generation import) is
// asserted mechanically by `journeyAgnostic.test.ts` — not here.

import { describe, it, expect } from 'vitest';
import { resolveWorkResumeStep } from './resumeStep';
import { WORK_BRIEF_FIXTURE } from '../../../../e2e/helpers/workBriefFixture';
import type { Brief } from '@/types/brief';

describe('resolveWorkResumeStep (P2b)', () => {
  it('resumes a confirmed work draft at STEP 02', async () => {
    await expect(
      resolveWorkResumeStep({
        brief: WORK_BRIEF_FIXTURE as Brief,
        audienceType: 'service',
        templateId: 'atelier',
      })
    ).resolves.toBe(2);
  });

  it('never resumes STEP 01 (pre-confirm, entry-page-owned) and stays in 2–6', async () => {
    const step = await resolveWorkResumeStep({ brief: null });
    expect(step).toBeGreaterThanOrEqual(2);
    expect(step).toBeLessThanOrEqual(6);
  });

  it('tolerates an empty loaded draft without throwing', async () => {
    await expect(resolveWorkResumeStep({})).resolves.toBe(2);
  });
});
