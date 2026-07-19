import { test, expect, type Page } from '@playwright/test';
import { seedWorkBrief, loadDraft } from './helpers/seedWorkBrief';

// ============================================================================
// STEP 04 — THE PLAN GATE, the reconceived shape+tiles invariant e2e
// (plan-proposal-gate phase 2).
//
// SEEDED-RESUME, mock-LLM (decision 9 / landmine 13): mock mode cannot classify
// work, so this seeds a confirmed Kundius work brief through the REAL serve gate
// and resumes the journey at STEP 02, then drives 02 → 03 → 04.
//
// The Kundius fixture derives the COMPACT archetype (2 groups, on-request prices
// only, not established): the proposal-driven seed lands home/work/contact — so
// the Prices + About tiles come up UNSELECTED, and (2 groups ≥ PROMOTE_GROUP_MIN)
// the Work-Group tile renders QUALIFIED.
//
// THREE invariants, one serial spec:
//  1. Multi shape + per-archetype tile preselection + closed-vocab add + the
//     removed-page-never-generated invariant (a removed page is absent from the
//     persisted Brief.structure AND never fed to generate-copy).
//  2. Single-page fold — every section stacked on ONE Home page (nothing dropped),
//     structure.mode stays 'multi', only '/' is generated.
//  3. Approve-failure-does-not-advance — a 500 on the plan-build structure commit
//     surfaces plan-error and never advances into an ungenerated build.
//
// Serial + authed for the same reason as work-onboarding.spec.ts (one shared
// Clerk test user; the seed uses the real /api/start + /api/brief/confirm).
// ============================================================================

test.describe.configure({ mode: 'serial' });

/** Clerk's session JWT is ~60s — refresh it, then use `page.request`. */
async function authedApi(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, {
    timeout: 30_000,
  });
  return page.request;
}

/**
 * The E3 required gate (D-D) blocks Continue on STEP 03 until price + languages
 * are answered. Call while STEP 03 (`step-questions`) is visible.
 */
async function answerRequiredQuestions(page: Page) {
  await page
    .getByTestId('question-price-mode-price')
    .getByRole('radio', { name: 'On request' })
    .click();
  await page.getByTestId('question-save-price').click();
  await page.getByTestId('question-chip-languages-English').click();
  await page.getByTestId('question-save-languages').click();
}

/** Drive the resumed journey 02 → 03 → 04, leaving STEP 04 (`step-plan`) visible. */
async function driveToPlan(page: Page, token: string) {
  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('show-work-skip').click();
  await expect(page.getByTestId('step-questions')).toBeVisible();
  await answerRequiredQuestions(page);
  await page.getByTestId('journey-next').click();
  await expect(page.getByTestId('step-plan')).toBeVisible();
}

/**
 * Ride STEP 05 to the reveal, retrying through the free-tier AI rate limit ONLY
 * (the real finding from work-onboarding.spec.ts). Any OTHER error fails loudly.
 * The retry RESUMES via completedPageKeys — it never re-issues generate-copy for a
 * page already done.
 */
async function driveToReveal(page: Page) {
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
}

interface Captured {
  generatedSlugs: string[];
  structureCommits: Array<{
    mode?: string;
    pages: string[];
    pageDetails: Array<{ archetypeKey?: string; slug?: string; title?: string; sections?: string[] }>;
  }>;
}

/** Intercept the per-page generate-copy fan-out + every Brief.structure commit. */
function captureTraffic(page: Page): Captured {
  const cap: Captured = { generatedSlugs: [], structureCommits: [] };
  page.on('request', (req) => {
    if (req.method() !== 'POST') return;
    const url = req.url();
    if (url.includes('/api/audience/work/generate-copy')) {
      try {
        const slug = req.postDataJSON()?.page?.pathSlug;
        if (typeof slug === 'string') cap.generatedSlugs.push(slug);
      } catch {
        /* non-JSON — the assertions are the gate */
      }
      return;
    }
    if (url.includes('/api/saveDraft')) {
      try {
        const structure = req.postDataJSON()?.brief?.structure;
        if (structure && Array.isArray(structure.pages)) {
          cap.structureCommits.push({
            mode: structure.mode,
            pages: structure.pages,
            pageDetails: structure.pageDetails ?? [],
          });
        }
      } catch {
        /* non-JSON / no structure — ignored */
      }
    }
  });
  return cap;
}

// ── Compact-seed vocabulary under test ───────────────────────────────────────
const REMOVED_ARCHETYPE = 'contact';
const REMOVED_SLUG = '/contact';
const ADDED_ARCHETYPE = 'about';
const ADDED_SLUG = '/about';
const WORK_SLUG = '/work';

test('STEP 04: compact preselection + closed-vocab add + removed-page-never-generated', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);
  const cap = captureTraffic(page);

  await driveToPlan(page, token);

  // ── Shape: multi is the compact seed's derived default. ────────────────────
  await expect(page.getByTestId('plan-shape-multi')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('plan-shape-single')).toHaveAttribute('aria-checked', 'false');

  // ── Per-archetype tile preselection (compact: home/work/contact ON). ───────
  await expect(page.getByTestId('plan-tile-home')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('plan-tile-work')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('plan-tile-contact')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('plan-tile-prices')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('plan-tile-about')).toHaveAttribute('aria-pressed', 'false');

  // The Work-Group tile renders because the fixture PROMOTES (2 groups ≥ min).
  await expect(page.getByTestId('plan-tile-work-group')).toBeVisible();

  // ── Closed vocab: the tiles ARE the list — no free-form add mechanism. ─────
  await expect(page.getByTestId('plan-add-select')).toHaveCount(0);

  // ── Zero internal vocabulary leaks into the step body. ─────────────────────
  // Descriptions are plain, so these engine-internal names must never appear.
  // (`collection` dropped — it legitimately occurs in the Work-Group tile copy.)
  const body = (await page.getByTestId('step-plan').innerText()).toLowerCase();
  for (const forbidden of [
    'hero',
    'quote',
    'testimonial',
    'cta',
    'proof',
    'workdetail',
    'experiences',
  ]) {
    expect(body, `internal vocabulary "${forbidden}" leaked into STEP 04`).not.toContain(
      forbidden
    );
  }

  // ── Edit #1: closed-vocab ONE-TAP ADD of an unproposed page (About). ───────
  await page.getByTestId('plan-tile-about').click();
  await expect(page.getByTestId('plan-tile-about')).toHaveAttribute('aria-pressed', 'true');

  // ── Edit #2: REMOVE a genuinely PRESELECTED page (Contact). ────────────────
  await page.getByTestId('plan-tile-contact').click();
  await expect(page.getByTestId('plan-tile-contact')).toHaveAttribute('aria-pressed', 'false');

  // ── Approve → structure persisted → generation fires (STEP 05). ────────────
  await page.getByTestId('plan-build').click();
  await driveToReveal(page);

  // ── INVARIANT (a): the persisted Brief.structure reflects the plan. ────────
  expect(cap.structureCommits.length, 'no Brief.structure was ever persisted').toBeGreaterThan(0);
  const approved = cap.structureCommits[cap.structureCommits.length - 1];
  expect(approved.pages, 'removed Contact still in structure.pages').not.toContain(
    REMOVED_ARCHETYPE
  );
  expect(approved.pages, 'added About missing from structure.pages').toContain(ADDED_ARCHETYPE);
  expect(
    approved.pageDetails.some((pd) => pd.slug === REMOVED_SLUG),
    'removed Contact slug still in structure.pageDetails'
  ).toBe(false);
  expect(
    approved.pageDetails.some((pd) => pd.slug === ADDED_SLUG),
    'added About slug missing from structure.pageDetails'
  ).toBe(true);

  // …and the same is true in the DB (round-trips through /api/loadDraft).
  const draft = await loadDraft(api, token);
  const dbStructure = draft.brief.structure;
  expect(dbStructure.pages).not.toContain(REMOVED_ARCHETYPE);
  expect(dbStructure.pages).toContain(ADDED_ARCHETYPE);
  expect(
    dbStructure.pageDetails.some((pd: { slug?: string }) => pd.slug === REMOVED_SLUG)
  ).toBe(false);
  expect(
    dbStructure.pageDetails.some((pd: { slug?: string }) => pd.slug === ADDED_SLUG)
  ).toBe(true);

  // ── INVARIANT (b): the removed page was NEVER generated — and the kept pages
  //    WERE (so the absence is meaningful, not a vacuous green). ──────────────
  expect(
    cap.generatedSlugs.length,
    'generation never ran — invariant would be vacuous'
  ).toBeGreaterThan(0);
  expect(cap.generatedSlugs, 'copy was generated for the REMOVED Contact page').not.toContain(
    REMOVED_SLUG
  );
  expect(cap.generatedSlugs, 'the added About page was not generated').toContain(ADDED_SLUG);
  expect(cap.generatedSlugs, 'the kept Work page was not generated').toContain(WORK_SLUG);
});

test('STEP 04: single-page folds every section onto one Home page', async ({ page }) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);
  const cap = captureTraffic(page);

  await driveToPlan(page, token);

  // ── Switch to Single — the page tiles vanish (they belong to Multi). ───────
  await page.getByTestId('plan-shape-single').click();
  await expect(page.getByTestId('plan-shape-single')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('plan-tile-home')).toHaveCount(0);
  await expect(page.getByTestId('plan-tile-work')).toHaveCount(0);

  await page.getByTestId('plan-build').click();
  await driveToReveal(page);

  // ── The persisted structure is a Home-only, FULL-stack single page. ────────
  expect(cap.structureCommits.length, 'no Brief.structure was ever persisted').toBeGreaterThan(0);
  const approved = cap.structureCommits[cap.structureCommits.length - 1];
  // shape contract: single = a multi-shaped structure with ONE Home page.
  expect(approved.mode).toBe('multi');
  expect(approved.pages).toEqual(['home']);

  const homeSections = approved.pageDetails[0]?.sections ?? [];
  // The FULL menu folded onto Home (deliberately more than the compact subset).
  for (const s of ['hero', 'work', 'packages', 'about', 'contact']) {
    expect(homeSections, `single-page Home is missing "${s}"`).toContain(s);
  }
  // Atelier's home carries a `proof` band (≠ the `testimonials` key F22 gates), so the full-menu fold keeps it.
  expect(homeSections, 'atelier proof band should be folded onto Home').toContain('proof');

  // Same in the DB.
  const draft = await loadDraft(api, token);
  const dbStructure = draft.brief.structure;
  expect(dbStructure.mode).toBe('multi');
  expect(dbStructure.pages).toEqual(['home']);

  // ── Only the single Home page ('/') was generated — nothing else. ──────────
  expect(cap.generatedSlugs.length, 'generation never ran').toBeGreaterThan(0);
  expect([...new Set(cap.generatedSlugs)]).toEqual(['/']);
});

test('STEP 04: a failed approve commit shows plan-error and does NOT advance', async ({ page }) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  await driveToPlan(page, token);

  // Fail the FIRST structure-bearing saveDraft (the plan-build approve commit)
  // exactly once, then let traffic pass through. Non-structure autosaves are
  // untouched, so this targets only the approve commit fired by the click.
  let failedOnce = false;
  await page.route('**/api/saveDraft', async (route) => {
    let isStructure = false;
    try {
      isStructure = Boolean(route.request().postDataJSON()?.brief?.structure);
    } catch {
      /* non-JSON — treat as non-structure */
    }
    if (isStructure && !failedOnce) {
      failedOnce = true;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'forced failure' }),
      });
      return;
    }
    await route.continue();
  });

  await page.getByTestId('plan-build').click();

  // The commit failed → inline error, and we stay ON the gate (no reveal).
  await expect(page.getByTestId('plan-error')).toBeVisible();
  await expect(page.getByTestId('step-plan')).toBeVisible();
  await expect(page.getByTestId('step-building')).toHaveCount(0);
  await expect(page.getByTestId('step-reveal')).toHaveCount(0);

  await page.unroute('**/api/saveDraft');
});
