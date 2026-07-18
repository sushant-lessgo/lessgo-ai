import { test, expect } from '@playwright/test';
import { seedWorkBrief, loadDraft } from './helpers/seedWorkBrief';

// ============================================================================
// STEP 04 — THE SITE PLAN, the E4 invariant e2e (work-onboarding-plan phase 4).
//
// SEEDED-RESUME, mock-LLM (decision 9 / landmine 13): mock mode cannot classify
// work, so this seeds a confirmed Kundius work brief through the REAL serve gate
// and resumes the journey at STEP 02, then drives 02 → 03 → 04.
//
// THE LOAD-BEARING INVARIANT (spec): the APPROVED plan IS the generation input.
// An edit at STEP 04 mutates `WizardState.sitemap` and persists to
// `Brief.structure` BEFORE generation fires — so a page REMOVED at the plan
// screen is (a) absent from the persisted `Brief.structure`, and (b) never
// generated (no `/api/audience/work/generate-copy` call for its slug). This is
// THE test that proves the removed-page ⇒ not-generated contract end to end.
//
// It is a genuine behavior assert, NOT an endpoint-presence check: we assert the
// removed slug is ABSENT from the intercepted generate-copy calls WHILE the KEPT
// pages ARE generated (so the invariant is meaningful, not vacuously green), and
// that the persisted structure lacks the removed slug but carries the rename.
//
// Serial + authed for the same reason as work-onboarding.spec.ts (one shared
// Clerk test user; the seed uses the real /api/start + /api/brief/confirm).
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

/**
 * The E3 required gate (D-D) blocks Continue on STEP 03 until price + languages
 * are answered. Call while STEP 03 (`step-questions`) is visible. Mirrors the
 * proven helper in work-onboarding.spec.ts.
 */
async function answerRequiredQuestions(page: import('@playwright/test').Page) {
  await page
    .getByTestId('question-price-mode-price')
    .getByRole('radio', { name: 'On request' })
    .click();
  await page.getByTestId('question-save-price').click();
  await page.getByTestId('question-chip-languages-English').click();
  await page.getByTestId('question-save-languages').click();
}

// The atelier default sitemap (getPageArchetypesForTemplate('atelier'), all
// defaultIncluded) seeds five pages in order: Home / Work / Experiences / About /
// Contact. "Experiences" (slug `/experiences`) is the removable page under test —
// the atelier menu has no "prices" page (the plan's "e.g. prices" example), so we
// remove the equivalent removable, defaultIncluded page. See the audit deviation.
const REMOVED_TITLE = 'Experiences';
const REMOVED_SLUG = '/experiences';
const REMOVED_ARCHETYPE = 'experiences';
const RENAMED_TITLE = 'Studio and story';
const RENAME_SLUG = '/about';

test('STEP 04: a removed page is absent from Brief.structure AND never generated', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  // ── Intercept BEFORE any navigation drives generation. ────────────────────
  // (a) every generate-copy call's target page slug (the fan-out per-page door).
  const generatedSlugs: string[] = [];
  // (b) every saveDraft body that carries a Brief.structure (the plan commits) —
  //     the LAST one is the approve commit = what actually persisted.
  const structureCommits: Array<{
    pages: string[];
    pageDetails: Array<{ archetypeKey?: string; slug?: string; title?: string }>;
  }> = [];

  page.on('request', (req) => {
    const url = req.url();
    if (req.method() !== 'POST') return;
    if (url.includes('/api/audience/work/generate-copy')) {
      try {
        const body = req.postDataJSON();
        const slug = body?.page?.pathSlug;
        if (typeof slug === 'string') generatedSlugs.push(slug);
      } catch {
        /* non-JSON body — ignored; the assertions below are the gate */
      }
      return;
    }
    if (url.includes('/api/saveDraft')) {
      try {
        const structure = req.postDataJSON()?.brief?.structure;
        if (structure && Array.isArray(structure.pages)) {
          structureCommits.push({
            pages: structure.pages,
            pageDetails: structure.pageDetails ?? [],
          });
        }
      } catch {
        /* non-JSON / no structure — ignored */
      }
    }
  });

  // ── Drive 02 → 03 → 04. ───────────────────────────────────────────────────
  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('show-work-skip').click();
  await expect(page.getByTestId('step-questions')).toBeVisible();
  await answerRequiredQuestions(page);
  await page.getByTestId('journey-next').click();
  await expect(page.getByTestId('step-plan')).toBeVisible();

  // ── The rich work plan renders. ───────────────────────────────────────────
  const stepPlan = page.getByTestId('step-plan');
  await expect(page.getByTestId('plan-columns')).toBeVisible();

  // Plain-word section rows: the internal `hero` key is translated to its buyer
  // word ("Your promise") on the home column — proof the vocabulary ran.
  await expect(stepPlan).toContainText('Your promise');
  // Plain-language goal badge per page.
  await expect(page.getByTestId('plan-goal-0')).toContainText('asks visitors to:');

  // ── ZERO internal vocabulary leaks into the step body. ────────────────────
  // The atelier pages carry the internal section keys hero / work / quote /
  // packages / about / contact; only `hero` and `quote` never appear inside any
  // buyer-facing label (work/packages/about/contact legitimately occur as PAGE
  // titles or inside userLabels), so those two are the pure-internal leak probes,
  // plus the engine-internal names the vocabulary rules forbid outright.
  const body = (await stepPlan.innerText()).toLowerCase();
  for (const forbidden of [
    'hero',
    'quote',
    'testimonial',
    'cta',
    'collection',
    'proof',
    'workdetail',
  ]) {
    expect(body, `internal vocabulary "${forbidden}" leaked into STEP 04`).not.toContain(
      forbidden
    );
  }

  // ── Confirm the column layout before index-addressed edits (self-verifying). ─
  // Atelier order: 0 Home · 1 Work · 2 Experiences · 3 About · 4 Contact.
  await expect(page.getByTestId('plan-column-3')).toContainText('About');
  await expect(page.getByTestId('plan-column-2')).toContainText(REMOVED_TITLE);

  // ── Edit #1: RENAME About (index 3). Rename does not reorder. ──────────────
  await page.getByTestId('plan-rename-3').click();
  const renameInput = page.getByTestId('plan-rename-input-3');
  await renameInput.fill(RENAMED_TITLE);
  await renameInput.press('Enter');
  await expect(page.getByTestId('plan-column-3')).toContainText(RENAMED_TITLE);

  // ── Edit #2: REMOVE Experiences (index 2). ────────────────────────────────
  await page.getByTestId('plan-remove-2').click();
  // The column vanishes — assert the removed title is gone from the whole board.
  await expect(page.getByTestId('plan-columns')).not.toContainText(REMOVED_TITLE);
  // …and About (renamed) survives the removal.
  await expect(page.getByTestId('plan-columns')).toContainText(RENAMED_TITLE);

  // ── Approve → structure persisted → generation fires (STEP 05). ───────────
  await page.getByTestId('plan-build').click();
  await expect(page.getByTestId('step-building')).toBeVisible();
  await expect(page.getByTestId('building-error-engine-disabled')).toHaveCount(0);

  // Drive to the reveal. Retry through the free-tier AI rate limit ONLY (the same
  // real finding as work-onboarding.spec.ts); any OTHER error must fail loudly.
  // The retry RESUMES via completedPageKeys — it never re-issues generate-copy
  // for a page already done, and NEVER for the removed page.
  //
  // editor-route-consolidation phase 5: the reveal folded onto the editor —
  // STEP 05 success now `router.push`es `/edit/{token}?reveal=1` (no in-journey
  // step-reveal body), so the "done" signal is the URL flip, mirroring
  // work-onboarding.spec.ts.
  const editUrl = new RegExp(`/edit/${token}`);
  for (let i = 0; i < 3; i++) {
    const settled = await Promise.race([
      page.waitForURL(editUrl, { timeout: 90_000 }).then(() => 'done' as const),
      page
        .getByTestId('building-error-error')
        .waitFor({ state: 'visible', timeout: 90_000 })
        .then(() => 'error' as const),
    ]);
    if (settled === 'done') break;
    const message = await page.getByTestId('step-building').innerText();
    expect(message, 'STEP 05 failed for a reason other than the AI rate limit').toMatch(
      /too many requests/i
    );
    await page.waitForTimeout(61_000);
    await page.getByTestId('building-retry').click();
  }
  // Landed on the editor reveal — the real "generation completed" signal.
  await page.waitForURL(editUrl, { timeout: 120_000 });
  await expect(page.getByTestId('page-reveal')).toBeVisible({ timeout: 60_000 });

  // ── INVARIANT (a): the persisted Brief.structure reflects the plan. ────────
  // The approve commit is the LAST structure-bearing saveDraft (per-tap commits
  // preceded it); it is what generation read.
  expect(structureCommits.length, 'no Brief.structure was ever persisted').toBeGreaterThan(0);
  const approved = structureCommits[structureCommits.length - 1];
  expect(approved.pages, 'removed page still in structure.pages').not.toContain(
    REMOVED_ARCHETYPE
  );
  expect(
    approved.pageDetails.some((pd) => pd.slug === REMOVED_SLUG),
    'removed page slug still in structure.pageDetails'
  ).toBe(false);
  const renamed = approved.pageDetails.find((pd) => pd.slug === RENAME_SLUG);
  expect(renamed?.title, 'rename did not reach the persisted structure').toBe(RENAMED_TITLE);

  // …and the same is true in the DB (round-trips through /api/loadDraft).
  const draft = await loadDraft(api, token);
  const dbStructure = draft.brief.structure;
  expect(dbStructure.pages).not.toContain(REMOVED_ARCHETYPE);
  expect(
    dbStructure.pageDetails.some((pd: { slug?: string }) => pd.slug === REMOVED_SLUG)
  ).toBe(false);
  expect(
    dbStructure.pageDetails.find((pd: { slug?: string }) => pd.slug === RENAME_SLUG)?.title
  ).toBe(RENAMED_TITLE);

  // ── INVARIANT (b): no copy was generated for the removed page — AND the kept
  //    pages WERE generated (so absence is meaningful, not a vacuous green). ──
  expect(generatedSlugs.length, 'generation never ran — invariant would be vacuous').toBeGreaterThan(
    0
  );
  expect(generatedSlugs, 'copy was generated for the REMOVED page').not.toContain(REMOVED_SLUG);
  expect(generatedSlugs, 'the kept About page was not generated').toContain(RENAME_SLUG);
});
