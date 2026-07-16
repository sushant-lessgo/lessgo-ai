import { test, expect } from '@playwright/test';
import { seedWorkBrief, startProject, loadDraft } from './helpers/seedWorkBrief';

// ============================================================================
// The work onboarding journey — SEEDED-RESUME e2e (decision 9 / landmine 13).
//
// Mock mode CANNOT classify work, so every spec here SEEDS a confirmed work
// brief through the REAL serve gate and resumes the shell. The real
// classify → STEP 01 entry is covered by Vitest (JourneyEntryStep.test.tsx) +
// P7 founder QA — nothing here fakes it.
//
// Authed: the flow needs a Clerk session (registered in the `authed` project).
// Serial for the same reason as publish.spec.ts — one shared test user.
//
// P2b scope: dispatch + resume-mount + legacy-unchanged. The rail (P3), steps
// (P4), generation (P5) and reveal (P6) add their assertions to this file.
// ============================================================================

test.describe.configure({ mode: 'serial' });

/** Clerk's session JWT is ~60s — refresh it, then use `page.request`. */
async function authedApi(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, {
    timeout: 30_000,
  });
  return page.request;
}

test('served work brief resumes the JOURNEY shell at STEP 02 (not WizardShell)', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  // The serve gate stamps the project (landmine 3: saveDraft never writes
  // audienceType — /api/brief/confirm is the only writer).
  const draft = await loadDraft(api, token);
  // work is an ENGINE, never an audience: a served work brief is a
  // SERVICE-audience atelier project whose BRIEF carries copyEngine 'work'.
  expect(draft.audienceType).toBe('service');
  expect(draft.templateId).toBe('atelier');
  expect(draft.brief.copyEngine).toBe('work');

  await page.goto(`/onboarding/${token}`);

  // Load-detection → isJourneyEligible(work, atelier) → JourneyShell, mounted at
  // the resume step (02).
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });

  // Dot progress is the journey's chrome signature.
  await expect(page.getByTestId('journey-dot-2')).toHaveAttribute('data-state', 'active');

  // NOT the legacy wizard.
  await expect(page.getByText('Basics', { exact: true })).toHaveCount(0);
});

test('the journey step machine walks 02 → 06 and back', async ({ page }) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });

  const next = page.getByTestId('journey-next');
  for (const testId of ['step-questions', 'step-plan', 'step-building', 'step-reveal']) {
    await next.click();
    await expect(page.getByTestId(testId)).toBeVisible();
  }

  // 06 is terminal (P6 owns the editor handoff); 02 is the floor.
  await expect(next).toBeDisabled();
  await page.getByTestId('journey-back').click();
  await expect(page.getByTestId('step-building')).toBeVisible();
});

test('legacy unchanged: a non-seam brief still reaches the entry card / WizardShell', async ({
  page,
}) => {
  const api = await authedApi(page);
  const token = await startProject(api);

  // A TRUST brief (agency) — no journey seam ⇒ the dispatch must not touch it.
  const res = await api.post('/api/brief/confirm', {
    data: {
      tokenId: token,
      brief: {
        businessType: 'agency',
        copyEngine: 'trust',
        facts: {
          entry: {
            rawInput: 'a six-week brand studio for DTC founders',
            resolvedEngine: 'trust',
            classificationSource: 'lookup',
            tiebreaker: 'none',
            platformNeeds: 'none',
            summary: 'Brand identity studio',
            businessName: 'Studio Six',
            offerings: ['Brand identity'],
            audiences: ['DTC founders'],
            categories: ['branding'],
            outcomes: [],
            deliveryModel: 'remote',
            offer: 'Book a call',
            oneLiner: 'A six-week brand studio for DTC founders.',
            testimonials: [],
          },
        },
        structure: { mode: 'single', pages: [] },
        confidence: 0.9,
      },
    },
  });
  expect(res.ok(), `/api/brief/confirm: ${res.status()}`).toBeTruthy();
  expect((await res.json()).outcome).toBe('serve');

  await page.goto(`/onboarding/${token}`);

  // The unified wizard, exactly as before — no journey chrome anywhere.
  await expect(page.getByText('Basics', { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId('journey-dot-2')).toHaveCount(0);
  await expect(page.getByTestId('step-show-work')).toHaveCount(0);
});
