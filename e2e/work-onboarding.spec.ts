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

// ============================================================================
// P3 — the "What we understood" rail, over a REAL persisted project.
//
// These are the assertions unit tests structurally cannot make: that a rail
// belief actually reaches Postgres through /api/saveDraft's brief merge, and
// that it does so WITHOUT dropping `facts.entry` (landmine 4) or breaking the
// group `kind` invariant that STEP-05 generation depends on (landmine 6).
// ============================================================================

test('the rail projects the seeded brief and its edits SURVIVE a reload', async ({ page }) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('understood-rail')).toBeVisible({ timeout: 30_000 });

  // Projected from the seeded facts.work — not typed in by this test.
  await expect(page.getByTestId('rail-value-name')).toHaveText('Kundius Studio');
  await expect(page.getByTestId('rail-value-descriptor')).toHaveText(
    'Documentary wedding photography'
  );
  await expect(page.getByTestId('rail-chip-g0')).toHaveText('Wedding day coverage');
  await expect(page.getByTestId('rail-chip-g1')).toHaveText('Engagement session');

  // ── Edit #1: NAME ────────────────────────────────────────────────────────
  await page.getByTestId('rail-edit-name').click();
  await page.getByTestId('rail-input-name').fill('Kundius Photography');
  await page.getByTestId('rail-save-name').click();
  await expect(page.getByTestId('rail-value-name')).toHaveText('Kundius Photography');

  // ── Edit #2, immediately after: DESCRIPTOR (lost-update guard) ────────────
  // Edit #2 re-emits the FULL bag from the snapshot edit #1 wrote. If commitRail
  // did not sync briefFacts in the same `set` as the save, this would re-emit
  // stale facts and silently revert edit #1.
  await page.getByTestId('rail-edit-descriptor').click();
  await page.getByTestId('rail-input-descriptor').fill('Wedding & portrait photographer');
  await page.getByTestId('rail-save-descriptor').click();
  await expect(page.getByTestId('rail-value-descriptor')).toHaveText(
    'Wedding & portrait photographer'
  );

  // ── Edit #3: RENAME a group chip (the id-join, end to end) ────────────────
  await page.getByTestId('rail-edit-groups').click();
  await page.getByTestId('rail-chip-input-0').fill('Wedding days');
  await page.getByTestId('rail-chips-save').click();
  await expect(page.getByTestId('rail-chip-g0')).toHaveText('Wedding days');

  // ── Note ─────────────────────────────────────────────────────────────────
  await page.getByTestId('rail-note-input').fill('The prices are wrong');
  await page.getByTestId('rail-note-submit').click();
  await expect(page.getByTestId('rail-note-input')).toHaveValue('', { timeout: 10_000 });

  // ── The real assertion: it is in the DB, and nothing else was dropped ─────
  const draft = await loadDraft(api, token);
  const work = draft.brief.facts.work;
  expect(work.identity.name).toBe('Kundius Photography');
  expect(work.identity.descriptor).toBe('Wedding & portrait photographer'); // BOTH edits
  expect(work.groups.map((g: { name: string }) => g.name)).toEqual([
    'Wedding days',
    'Engagement session',
  ]);
  // The renamed group is still kind-valid — a kind-less group nulls
  // getWorkFacts and dead-ends STEP 05 with an unrecoverable 400.
  for (const g of work.groups) expect(g.kind).toBe('category');
  expect(work.userNotes).toEqual(['The prices are wrong']);

  // Sibling facts survived every full-facts re-emit (landmine 4).
  expect(draft.brief.facts.entry.businessName).toBe('Kundius Studio');
  // And the serve-gate stamps are untouched by rail writes (landmine 3).
  expect(draft.audienceType).toBe('service');
  expect(draft.templateId).toBe('atelier');
  expect(draft.brief.copyEngine).toBe('work');

  // Reload: the rail re-projects from the DB, not from client memory.
  await page.reload();
  await expect(page.getByTestId('rail-value-name')).toHaveText('Kundius Photography', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('rail-chip-g0')).toHaveText('Wedding days');
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
