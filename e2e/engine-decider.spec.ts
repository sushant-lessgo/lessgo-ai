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
