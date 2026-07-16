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

// ============================================================================
// P4 — the THIN steps 02 → 04, over a REAL persisted project.
//
// What only e2e can prove: a STEP 03 answer reaches Postgres through the rail
// adapter STILL `kind`-valid (landmine 6 — a `kind`-less group nulls
// `getWorkFacts`, 400s the work strategy, and PERSISTS, so a retry never
// recovers), and that STEP 04's plan seeding is idempotent across back-nav
// (landmine 8).
// ============================================================================

test('the journey walks 02 → 04: answers land in the rail and in the DB, kind-valid', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });

  // ── 02: the stub + Skip (E1: no upload pipeline — ingestion is E2) ────────
  await expect(page.getByTestId('show-work-dropzone')).toBeVisible();
  await page.getByTestId('show-work-skip').click();
  await expect(page.getByTestId('step-questions')).toBeVisible();

  // ── 03 ask-if: the seeded brief has a name AND groups, so neither is asked —
  // only the optional price.
  await expect(page.getByTestId('question-name')).toHaveCount(0);
  await expect(page.getByTestId('question-groups')).toHaveCount(0);
  await expect(page.getByTestId('question-price')).toBeVisible();

  // Empty the seeded groups from the RAIL, so the group question becomes real
  // (the fixture is deliberately well-seeded; this is how a sparse classify
  // lands). The question must then appear — ask-if is driven by the projection.
  await page.getByTestId('rail-edit-groups').click();
  await page.getByTestId('rail-chip-remove-1').click();
  await page.getByTestId('rail-chip-remove-0').click();
  await page.getByTestId('rail-chips-save').click();
  await expect(page.getByTestId('rail-field-groups')).toHaveAttribute('data-skeleton', 'true');

  await expect(page.getByTestId('question-groups')).toBeVisible();
  await expect(page.getByTestId('question-price')).toHaveCount(0); // nothing to price yet

  // ── The answer: it appears IN THE RAIL (the journey's core promise) ───────
  await page.getByTestId('question-input-groups').fill('Newborn sessions');
  await page.getByTestId('question-save-groups').click();
  await expect(page.getByTestId('rail-chip-g0')).toHaveText('Newborn sessions');
  // …and the price question now has something to price.
  await expect(page.getByTestId('question-price')).toBeVisible();

  // Default is "On request" (always valid); "From" needs an amount — the Save
  // stays disabled without one, and the seam refuses it anyway.
  await page.getByTestId('question-price-mode-price').getByRole('radio', { name: 'From' }).click();
  await page.getByTestId('question-price-amount-price').fill('900');
  await page.getByTestId('question-save-price').click();

  // ── The real assertion: it is in the DB, and it is generation-valid ───────
  // Polled, not slept: the price answer has no rail field of its own to watch
  // (PRICE POSITION is a derived BAND, and it is already non-null from the
  // group answer's on-request default — asserting on it would pass before the
  // save landed).
  await expect
    .poll(async () => (await loadDraft(api, token)).brief.facts.work.groups[0].price.mode, {
      timeout: 15_000,
    })
    .toBe('from');

  const draft = await loadDraft(api, token);
  const groups = draft.brief.facts.work.groups;
  expect(groups.map((g: { name: string }) => g.name)).toEqual(['Newborn sessions']);
  // A question answer routed through the rail adapter is NEVER kind-less.
  expect(groups[0].kind).toBe('category');
  expect(groups[0].price).toEqual({ mode: 'from', amount: 900 });
  expect(draft.brief.facts.entry.businessName).toBe('Kundius Studio'); // landmine 4
  expect(draft.audienceType).toBe('service');
  expect(draft.templateId).toBe('atelier');

  // ── 04: the plan, seeded chargelessly ────────────────────────────────────
  await page.getByTestId('journey-next').click();
  await expect(page.getByTestId('step-plan')).toBeVisible();
  const cards = page.getByTestId('plan-items').getByRole('listitem');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  // Back-nav must not re-seed (landmine 8 — the guard lives in fetchStrategy).
  await page.getByTestId('journey-back').click();
  await expect(page.getByTestId('step-questions')).toBeVisible();
  await page.getByTestId('journey-next').click();
  await expect(page.getByTestId('step-plan')).toBeVisible();
  await expect(page.getByTestId('plan-items').getByRole('listitem')).toHaveCount(count);
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
