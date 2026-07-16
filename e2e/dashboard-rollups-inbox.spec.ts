import { test, expect } from '@playwright/test';

// dashboard-rollups-inbox PHASE 3 — account-level All Leads inbox nav + render.
//
// Authed: reuses the Clerk session saved by auth.setup.ts (same pattern as
// dashboard-shell.spec.ts). Serial — shares one test user with the other authed
// specs.
//
// Registered on the `authed` project in playwright.config.ts — a spec that isn't
// listed there matches no project and silently never runs. Run just this file:
//   npx playwright test e2e/dashboard-rollups-inbox.spec.ts --project=authed
//
// SCOPE NOTE — cross-user isolation is NOT tested here BY DESIGN: the e2e fixture
// has a single account, so a "user B can't see user A's leads" e2e would be
// vacuous. That guarantee is covered by the unit test over the scoping seam:
// src/lib/dashboard/accountScope.test.ts.
test.describe.configure({ mode: 'serial' });

const APP_CHROME = '.app-chrome';

test.describe('all leads inbox (phase 3)', () => {
  test('sidebar All Leads navigates to /dashboard/leads and the page renders in the shell', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    // The nav item is un-greyed (a real link) as of S4 phase 3.
    const allLeads = page.getByRole('link', { name: 'All Leads', exact: true });
    await expect(allLeads).toBeVisible();
    await allLeads.click();

    await page.waitForURL('**/dashboard/leads');
    expect(new URL(page.url()).pathname).toBe('/dashboard/leads');

    // One shell wrapper only — the layout is the ONLY .app-chrome attach point.
    await expect(page.locator(APP_CHROME)).toHaveCount(1);

    // Top bar title block for this route.
    await expect(page.getByRole('heading', { name: 'All Leads', exact: true })).toBeVisible();

    // The page renders SOMETHING real: either the inbox list or an empty state —
    // never a crash. The account's lead count isn't controllable from here, so
    // accept either branch rather than skipping vacuously.
    const emptyState = page.getByText('No leads yet', { exact: true });
    const inboxRow = page.getByRole('listitem').first();
    await expect(emptyState.or(inboxRow).first()).toBeVisible();
    // Next.js error overlays / error boundaries must not be present.
    await expect(page.getByText(/Application error|Unhandled Runtime Error/i)).toHaveCount(0);
  });
});

test.describe('all analytics rollup (phase 4)', () => {
  test('sidebar All Analytics navigates to /dashboard/analytics and the rollup renders', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    // The nav item is un-greyed (a real link) as of S4 phase 4.
    const allAnalytics = page.getByRole('link', { name: 'All Analytics', exact: true });
    await expect(allAnalytics).toBeVisible();
    await allAnalytics.click();

    await page.waitForURL('**/dashboard/analytics');
    expect(new URL(page.url()).pathname).toBe('/dashboard/analytics');

    // One shell wrapper only — the layout is the ONLY .app-chrome attach point.
    await expect(page.locator(APP_CHROME)).toHaveCount(1);

    // Top bar title block for this route.
    await expect(page.getByRole('heading', { name: 'All Analytics', exact: true })).toBeVisible();

    // Either the stat tiles (account has published pages) or the empty state —
    // the account's page count isn't controllable from here, so accept either
    // branch rather than skipping vacuously.
    const emptyState = page.getByText('No analytics yet', { exact: true });
    const viewsTile = page.getByText('Unique visitors', { exact: true });
    await expect(emptyState.or(viewsTile).first()).toBeVisible();
    await expect(page.getByText(/Application error|Unhandled Runtime Error/i)).toHaveCount(0);
  });

  test('the 7d range link navigates and the page still renders', async ({ page }) => {
    await page.goto('/dashboard/analytics');

    // Range pills are plain <Link>s (server-rendered) — the switcher renders in
    // BOTH the populated and empty branches.
    await page.getByRole('link', { name: '7d', exact: true }).click();

    await page.waitForURL('**/dashboard/analytics?days=7');
    expect(new URL(page.url()).search).toBe('?days=7');

    await expect(page.locator(APP_CHROME)).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'All Analytics', exact: true })).toBeVisible();
    const emptyState = page.getByText('No analytics yet', { exact: true });
    const viewsTile = page.getByText('Unique visitors', { exact: true });
    await expect(emptyState.or(viewsTile).first()).toBeVisible();
    await expect(page.getByText(/Application error|Unhandled Runtime Error/i)).toHaveCount(0);
  });
});
