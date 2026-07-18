// Work resume rules (work-onboarding-shell P2b + P5).
// The firewall half of this module's contract (no static generation import) is
// asserted mechanically by `journeyAgnostic.test.ts` — not here.
//
// ⚠️ READ BEFORE TRUSTING THIS FILE. Every `loaded` below is FABRICATED, so
// these tests prove the RULES and nothing about whether the shell actually
// passes `finalContent` (until P5 it did not — the rules would have been dead
// code with this suite green). The plumbing is proven by
// `e2e/work-onboarding.spec.ts` ("a completed project reloads onto STEP 06").
// Keep both.

import { describe, it, expect } from 'vitest';
import { resolveWorkResumeStep } from './resumeStep';
import { WORK_BRIEF_FIXTURE } from '../../../../e2e/helpers/workBriefFixture';
import type { Brief } from '@/types/brief';

/** A resumable in-progress multi-page generation (buildMultiPageSkeleton's
 *  shape): `generationProgress` + a sitemap + a strategy. */
function inProgressFinalContent() {
  return {
    generationProgress: { completedPageKeys: ['home'] },
    onboardingData: {
      sitemap: [{ archetypeKey: 'home' }, { archetypeKey: 'work' }],
      strategy: { sitemap: [] },
    },
    pages: {},
  };
}

/** The SAME draft after `finalizeMultiPageGeneration` — which DELETES
 *  `generationProgress`. That deletion is the only thing distinguishing a
 *  finished site from a mid-fan-out one (landmine 7). */
function finishedFinalContent() {
  const fc = inProgressFinalContent() as Record<string, unknown>;
  delete fc.generationProgress;
  return fc;
}

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

describe('resolveWorkResumeStep — generation resume (P5)', () => {
  // Generous timeout, and it is EVIDENCE, not flake-padding: this is the first
  // call that triggers the LAZY `await import('@/modules/generation/
  // multiPageAssembly')`, and transforming that module's graph (selectProductBlocks
  // + collections/registry + editStore archetypes) blows past vitest's 5s default
  // under full-suite load. That weight is exactly why the import is lazy and why
  // `journeyAgnostic.test.ts` forbids a static one — it would otherwise sit on the
  // PRE-CONFIRM entry bundle.
  it('an IN-PROGRESS multi-page generation resumes at STEP 05 (the driver skips done pages)', async () => {
    await expect(
      resolveWorkResumeStep({
        brief: WORK_BRIEF_FIXTURE as Brief,
        audienceType: 'service',
        templateId: 'atelier',
        finalContent: inProgressFinalContent(),
      })
    ).resolves.toBe(5);
  }, 30_000);

  it('FINISHED content resumes at STEP 06 — the finalize marker-drop is what tells them apart', async () => {
    await expect(
      resolveWorkResumeStep({
        brief: WORK_BRIEF_FIXTURE as Brief,
        audienceType: 'service',
        templateId: 'atelier',
        finalContent: finishedFinalContent(),
      })
    ).resolves.toBe(6);
  });

  it('content with no generation shape at all (legacy / skeleton fill) ⇒ STEP 06, never a re-generate', async () => {
    await expect(
      resolveWorkResumeStep({ finalContent: { layout: { sections: [] }, content: {} } })
    ).resolves.toBe(6);
  });

  it('a null/absent finalContent still ⇒ STEP 02 (nothing generated)', async () => {
    await expect(resolveWorkResumeStep({ finalContent: null })).resolves.toBe(2);
    await expect(resolveWorkResumeStep({ finalContent: undefined })).resolves.toBe(2);
  });
});
