import { test, expect } from '@playwright/test';
import { startProject, loadDraft } from './helpers/seedWorkBrief';

// ============================================================================
// Engine Decider — the WORK-lane entry, end to end (engineDecider Phase 3 +
// follow-up).
//
// FOUNDER-QA change: for a CLEAR/known engine (an explicit photographer → work)
// there is NO D2 screen and NO D6 ceremony — after D1 the flow runs a SILENT
// "setting up your site…" finalize transition (auto-confirm on mount, no
// Continue button) and hard-navs straight into the work journey at Show Your Work.
//
// The regression this spec exists to kill is O1: the retired JourneyEntryStep
// re-presented the one-liner in a SECOND editable textarea (and re-classified,
// burning a second UNDERSTAND credit). The whole flow must ask the one-liner
// EXACTLY ONCE — at D1 — and never again through the silent finalize → work
// journey.
//
// ── WHY /api/v2/understand IS INTERCEPTED (decision 9 / landmine 13) ─────────
// Mock mode CANNOT classify work: the real `/api/v2/understand` returns the
// agency-shaped ENTRY_DEMO_SIGNALS (now AMBIGUOUS → D4, not the work lane). So
// this spec deterministically fulfils that ONE call with a photographer→work
// brief, then drives the REAL client routing (D1→D2→D6) and the REAL authed
// `/api/brief/confirm` serve gate (atelier). Nothing about the decider routing,
// the O1 kill, or the serve is faked — only the classifier input is pinned.
//
// Authed + serial for the same reason as work-onboarding.spec.ts (shared Clerk
// user; the confirm + loadDraft calls need a session).
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
 * A photographer→work entry draft, exactly as D1 hands it to the decider: only
 * `facts.entry` (FinalizeHandoff's enrichment builds `facts.work`),
 * `engineStatus:'known'` so the decider routes STRAIGHT to the silent finalize
 * transition (no D2, no D3/D4), and a schema-valid + serve-valid shape
 * (mirrors WORK_BRIEF_FIXTURE, which the drift guard proves serves atelier).
 * Zero app imports — the Playwright runner has no `@/` alias.
 */
const WORK_ENTRY_DRAFT = {
  businessType: 'photographer',
  copyEngine: 'work',
  category: 'photography',
  facts: {
    entry: {
      rawInput: 'documentary wedding photographer in Amsterdam',
      resolvedEngine: 'work',
      engineStatus: 'known',
      classificationSource: 'lookup',
      tiebreaker: 'none',
      platformNeeds: 'none',
      summary: 'Documentary wedding photography',
      businessName: 'Kundius Studio',
      offerings: ['Wedding day coverage', 'Engagement session'],
      audiences: ['Couples getting married'],
      categories: ['photography', 'weddings'],
      outcomes: [],
      deliveryModel: 'in-person',
      offer: 'Check availability for your date',
      oneLiner: 'Documentary wedding photography in Amsterdam',
      testimonials: [],
    },
  },
  proofAvailable: [],
  socialProfiles: [],
  structure: { mode: 'multi', pages: [] },
  designStyleHint: 'editorial-craft',
  confidence: 0.9,
};

/** The single element that MUST appear exactly once (D1) and never again: the
 *  one-liner input. The retired O1 screen's textarea id is also checked — it
 *  must never render at all. */
async function assertNoOneLinerInput(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('d1-entry-input')).toHaveCount(0);
  await expect(page.getByTestId('journey-entry-oneliner')).toHaveCount(0);
  await expect(page.getByTestId('journey-entry-step')).toHaveCount(0);
}

/**
 * A CLEAR SaaS entry draft (committed `thing`, engineStatus `known`) — the
 * decider asks NOTHING and routes STRAIGHT to the confirm→wizard transition,
 * entering the generic wizard at the `understanding` slot (no identity re-ask).
 */
const SAAS_ENTRY_DRAFT = {
  businessType: 'saas',
  copyEngine: 'thing',
  category: 'software',
  facts: {
    entry: {
      rawInput: 'invoicing software for freelancers',
      resolvedEngine: 'thing',
      engineStatus: 'known',
      classificationSource: 'lookup',
      tiebreaker: 'none',
      platformNeeds: 'none',
      summary: 'Invoicing software for freelancers',
      businessName: 'Acme Invoicing',
      offerings: ['Auto-chase late invoices'],
      audiences: ['Freelance designers'],
      categories: ['software'],
      outcomes: [],
      deliveryModel: 'remote',
      offer: 'Start a free trial',
      oneLiner: 'Invoicing software for freelancers',
      testimonials: [],
    },
  },
  proofAvailable: [],
  socialProfiles: [],
  structure: { mode: 'single', pages: [] },
  designStyleHint: 'tech-minimal',
  confidence: 0.9,
};

/** An AMBIGUOUS agency entry draft (registry `ambiguous`, prior = trust). No
 *  `copyEngine`, `resolvedEngine:null`, `engineStatus:'ambiguous'` — this is what
 *  D1 hands to D4 (the buyer-decision question). */
const AGENCY_AMBIGUOUS_DRAFT = {
  businessType: 'agency',
  category: 'agency',
  facts: {
    entry: {
      rawInput: 'branding & design studio',
      resolvedEngine: null,
      engineStatus: 'ambiguous',
      classificationSource: 'lookup',
      tiebreaker: 'none',
      platformNeeds: 'none',
      summary: 'Branding & design studio',
      businessName: 'Cirkel Studio',
      offerings: ['Brand identity', 'Web design'],
      audiences: ['Growing startups'],
      categories: ['agency', 'design'],
      outcomes: [],
      deliveryModel: 'hybrid',
      offer: 'Book a discovery call',
      oneLiner: 'Branding & design studio',
      testimonials: [],
    },
  },
  proofAvailable: [],
  socialProfiles: [],
  structure: { mode: 'multi', pages: [] },
  designStyleHint: 'bold-performance',
  confidence: 0.5,
};

/** An AMBIGUOUS designer entry draft (registry `ambiguous`, prior = WORK). A
 *  designer PICKED into work serves atelier (config `gallery` cap) — so the
 *  work-pick lands in the journey. */
const DESIGNER_AMBIGUOUS_DRAFT = {
  businessType: 'designer',
  category: 'design',
  facts: {
    entry: {
      rawInput: 'independent brand & product designer',
      resolvedEngine: null,
      engineStatus: 'ambiguous',
      classificationSource: 'lookup',
      tiebreaker: 'none',
      platformNeeds: 'none',
      summary: 'Independent brand & product designer',
      businessName: 'Mara Studio',
      offerings: ['Brand systems', 'Product design'],
      audiences: ['Funded startups'],
      categories: ['design'],
      outcomes: [],
      deliveryModel: 'remote',
      offer: 'See selected work',
      oneLiner: 'Independent brand & product designer',
      testimonials: [],
    },
  },
  proofAvailable: [],
  socialProfiles: [],
  structure: { mode: 'multi', pages: [] },
  designStyleHint: 'editorial-craft',
  confidence: 0.5,
};

/** Pin the ONE classifier call (mock mode can't classify) to a fixed brief. */
async function pinUnderstand(
  page: import('@playwright/test').Page,
  draft: Record<string, unknown>
) {
  await page.route('**/api/v2/understand', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: (draft as { facts: { entry: unknown } }).facts.entry,
        briefDraft: draft,
        creditsUsed: 0,
        creditsRemaining: 999,
      }),
    });
  });
}

/** D1 → type the one-liner → Continue. Asserts the one-liner exists exactly once. */
async function submitD1(page: import('@playwright/test').Page, text: string) {
  const oneLiner = page.getByTestId('d1-entry-input');
  await expect(oneLiner).toBeVisible({ timeout: 30_000 });
  await expect(oneLiner).toHaveCount(1);
  await oneLiner.fill(text);
  await page.getByTestId('d1-continue').click();
}

test('photographer one-liner → silent finalize → work journey; one-liner asked exactly once', async ({
  page,
}) => {
  const api = await authedApi(page);
  const token = await startProject(api);

  // Pin the ONE classifier call to the work lane (mock mode cannot classify work).
  await page.route('**/api/v2/understand', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: WORK_ENTRY_DRAFT.facts.entry,
        briefDraft: WORK_ENTRY_DRAFT,
        creditsUsed: 0,
        creditsRemaining: 999,
      }),
    });
  });

  await page.goto(`/onboarding/${token}`);

  // ── D1: the one-liner is typed HERE, and this is the ONLY place it exists. ──
  const oneLiner = page.getByTestId('d1-entry-input');
  await expect(oneLiner).toBeVisible({ timeout: 30_000 });
  await expect(oneLiner).toHaveCount(1);
  await oneLiner.fill('Documentary wedding photography in Amsterdam');
  await page.getByTestId('d1-continue').click();

  // ── The clear/known path is CUT straight through: NO D2 screen, NO D6
  //    ceremony. A silent finalize transition auto-confirms on mount and
  //    hard-navs into the journey. We only ever click Continue ONCE (at D1). ──
  await expect(page.getByTestId('decider-d2')).toHaveCount(0);
  await expect(page.getByTestId('decider-d6')).toHaveCount(0);
  // No second Continue exists on the finalize transition.
  await expect(page.getByTestId('decider-d6-continue')).toHaveCount(0);

  // ── Serve → hard-nav → load-detection mounts the JOURNEY at showWork. ──────
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('journey-dot-2')).toHaveAttribute('data-state', 'active');
  // The journey never re-asks the one-liner either — O1 is dead end to end.
  await assertNoOneLinerInput(page);

  // ── The serve actually persisted an atelier work project (not demand). ─────
  const draft = await loadDraft(api, token);
  expect(draft.audienceType).toBe('service'); // work = engine, atelier = service audience
  expect(draft.templateId).toBe('atelier');
  expect(draft.brief.copyEngine).toBe('work');
  // D6's enrichment built facts.work from facts.entry (the rail's data source).
  expect(draft.brief.facts.work?.identity?.name).toBe('Kundius Studio');
  expect(draft.brief.facts.work?.groups?.length).toBe(2);
});

test('CLEAR SaaS → no decider question → wizard at understanding, one-liner NOT re-asked', async ({
  page,
}) => {
  const api = await authedApi(page);
  const token = await startProject(api);
  await pinUnderstand(page, SAAS_ENTRY_DRAFT);

  await page.goto(`/onboarding/${token}`);
  await submitD1(page, 'Invoicing software for freelancers');

  // A CLEAR thing engine asks NOTHING — no D4, no D3. It confirms silently and
  // hard-navs into the wizard at the UNDERSTANDING slot (identity skipped).
  await expect(page.getByTestId('decider-d4')).toHaveCount(0);
  await expect(page.getByTestId('decider-d3')).toHaveCount(0);

  // The wizard mounts at `understanding` (SLOT label in the progress header).
  // EXACT match is load-bearing: D1's Continue button reads "Understanding…"
  // while classifying, and a SUBSTRING `getByText('Understanding')` matches THAT
  // button during D1's post-classify dwell — an inert assertion that greenlights
  // before the (dynamically-imported) ConfirmToWizard has even mounted + POSTed
  // /api/brief/confirm, so the loadDraft below then reads a not-yet-persisted
  // brief. Exact text matches ONLY the wizard progress-header label ("Understanding",
  // no ellipsis) — which appears only AFTER the confirm serves + hard-nav + wizard
  // hydrate — so this both de-inerts the assertion and correctly waits for the serve.
  await expect(page.getByText('Understanding', { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  // O1: the one-liner is never re-asked — typed exactly once, at D1.
  await assertNoOneLinerInput(page);

  // The serve persisted a product (thing) project.
  const draft = await loadDraft(api, token);
  expect(draft.brief.copyEngine).toBe('thing');
});

test('AMBIGUOUS agency → D4 (prior pre-selected, 5 options incl. 2 SOON); pick trust → wizard; pick work → journey', async ({
  page,
}) => {
  const api = await authedApi(page);

  // ── PROJECT 1: agency → D4 → pick TRUST → wizard at understanding ──────────
  const token1 = await startProject(api);
  await pinUnderstand(page, AGENCY_AMBIGUOUS_DRAFT);
  await page.goto(`/onboarding/${token1}`);
  await submitD1(page, 'Branding & design studio');

  // D4 fires (the buyer-decision question), NOT a silent finalize / wizard.
  await expect(page.getByTestId('decider-d4')).toBeVisible({ timeout: 30_000 });
  // 5 options, exactly 2 of them dashed "SOON" (place + quick-yes).
  await expect(page.getByTestId('decider-d4-option-work')).toHaveCount(1);
  await expect(page.getByTestId('decider-d4-option-trust')).toHaveCount(1);
  await expect(page.getByTestId('decider-d4-option-thing')).toHaveCount(1);
  await expect(page.locator('[data-testid^="decider-d4-option-"]')).toHaveCount(5);
  await expect(page.locator('[data-testid^="decider-d4-option-"][data-soon="true"]')).toHaveCount(2);
  // Prior = trust is pre-selected (best guess).
  await expect(page.getByTestId('decider-d4-option-trust')).toHaveAttribute('aria-pressed', 'true');
  // O1 holds on D4 too: no editable one-liner.
  await assertNoOneLinerInput(page);

  // Pick trust → confirm → wizard at understanding.
  await page.getByTestId('decider-d4-option-trust').click();
  await page.getByTestId('decider-d4-continue').click();
  // Exact — the wizard progress-header label, never a substring of some other
  // "Understanding…" affordance (see the SaaS test's note on this inert-match trap).
  await expect(page.getByText('Understanding', { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await assertNoOneLinerInput(page);
  const draft1 = await loadDraft(api, token1);
  expect(draft1.brief.copyEngine).toBe('trust');

  // ── PROJECT 2: designer → D4 → pick WORK → journey (atelier serves) ────────
  const token2 = await startProject(api);
  await pinUnderstand(page, DESIGNER_AMBIGUOUS_DRAFT);
  await page.goto(`/onboarding/${token2}`);
  await submitD1(page, 'Independent brand & product designer');

  await expect(page.getByTestId('decider-d4')).toBeVisible({ timeout: 30_000 });
  // Designer's prior is WORK.
  await expect(page.getByTestId('decider-d4-option-work')).toHaveAttribute('aria-pressed', 'true');

  // Pick work → applyEnginePick → silent finalize → work journey at Show Your Work.
  await page.getByTestId('decider-d4-option-work').click();
  await page.getByTestId('decider-d4-continue').click();
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });
  await assertNoOneLinerInput(page);
  const draft2 = await loadDraft(api, token2);
  expect(draft2.brief.copyEngine).toBe('work');
  expect(draft2.templateId).toBe('atelier');
});

test('D4 place-pick → D5 demand board → demand-lead POST; copyEngine NEVER place; go-back reopens D4', async ({
  page,
}) => {
  const api = await authedApi(page);
  const token = await startProject(api);
  // Mock mode can't classify — pin the ONE classifier call to an AMBIGUOUS draft
  // so D1 hands off to D4 (the buyer-decision question), where we PICK "place"
  // (the SOON/dashed storefront option) to reach the demand board.
  await pinUnderstand(page, AGENCY_AMBIGUOUS_DRAFT);

  // Intercept the demand-lead write (no DB row in the e2e) and capture the body.
  let demandBody: Record<string, unknown> | null = null;
  await page.route('**/api/demand-lead', async (route) => {
    if (route.request().method() === 'POST') {
      demandBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'lead_e2e' }),
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto(`/onboarding/${token}`);
  await submitD1(page, 'Branding & design studio');

  // D4 fires; pick the dashed "SOON" place option → continue → D5 demand board.
  await expect(page.getByTestId('decider-d4')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('decider-d4-option-place')).toHaveAttribute('data-soon', 'true');
  await page.getByTestId('decider-d4-option-place').click();
  await page.getByTestId('decider-d4-continue').click();

  // ── D5: the honest storefront + the amber "DEMAND LOGGED" rail chip. ─────────
  await expect(page.getByTestId('decider-d5')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('rail-engine-demand')).toBeVisible();
  await expect(page.getByTestId('rail-engine-demand')).toContainText('PLACE');
  // O1 holds on D5 too: no editable one-liner anywhere on the demand board.
  await assertNoOneLinerInput(page);

  // ── "Go back" reopens D4 (the engine is a revisable belief). ────────────────
  await page.getByTestId('decider-d5-back').click();
  await expect(page.getByTestId('decider-d4')).toBeVisible({ timeout: 30_000 });

  // ── Re-pick place → D5 → submit the email → POST /api/demand-lead. ──────────
  await page.getByTestId('decider-d4-option-place').click();
  await page.getByTestId('decider-d4-continue').click();
  await expect(page.getByTestId('decider-d5')).toBeVisible({ timeout: 30_000 });

  await page.getByTestId('demand-email').fill('founder@example.com');
  await page.getByTestId('demand-submit').click();

  // The demand lead is logged with the rungE:place tag; copyEngine is NEVER set
  // (place stays off the schema enum).
  await expect.poll(() => demandBody, { timeout: 10_000 }).not.toBeNull();
  expect((demandBody as Record<string, unknown>).email).toBe('founder@example.com');
  expect((demandBody as Record<string, unknown>).missing).toBe('rungE:place');
  expect(
    ((demandBody as Record<string, unknown>).briefDraft as { copyEngine?: string }).copyEngine
  ).toBeUndefined();

  // Confirmed state: the fast-track affordance appears, the go-back is gone.
  await expect(page.getByTestId('demand-confirmed')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('decider-d5-back')).toHaveCount(0);
});
