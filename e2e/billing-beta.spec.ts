import { test, expect } from '@playwright/test';
// ⚠️ RELATIVE import, not `@/lib/creditCosts` — the Playwright runner does not resolve
// tsconfig path aliases. src/lib/creditCosts.ts is prisma-free (billing-beta phase 1)
// precisely so it is node-importable from here. Same pattern/reason as the note in
// e2e/media-picker.spec.ts.
import { CREDIT_COSTS } from '../src/lib/creditCosts';

// billing-beta PHASE 3 — dashboard header credit counter.
//
// Registered on the `authed` project in playwright.config.ts — a spec that isn't listed
// there matches no project and silently never runs (the config's own warning). Run just
// this file:  npx playwright test e2e/billing-beta.spec.ts --project=authed
//
// No seeding: the counter only needs a signed-in user (auth.setup.ts session) and
// /api/credits/balance, which exists for every user.
test.describe.configure({ mode: 'serial' });

const HAS_AUTH_ENV = Boolean(
  process.env.E2E_CLERK_USER_EMAIL &&
    process.env.E2E_CLERK_USER_PASSWORD &&
    process.env.CLERK_SECRET_KEY,
);

test.describe('billing-beta — dashboard credit counter', () => {
  test.skip(!HAS_AUTH_ENV, 'Clerk E2E creds not configured');

  test('header shows a numeric credit balance', async ({ page }) => {
    await page.goto('/dashboard');

    const badge = page.getByTestId('credit-badge');
    await expect(badge).toBeVisible();

    // Numeric: either "N" (pool-only tiers) or "N/M" (monthly allotment).
    await expect(page.getByTestId('credit-badge-value')).toHaveText(/^\d+(\/\d+)?$/);
  });

  test('cost rows render from CREDIT_COSTS config (not hardcoded)', async ({ page }) => {
    await page.goto('/dashboard');

    await page.getByTestId('credit-badge').hover();
    await expect(page.getByTestId('credit-badge-panel')).toBeVisible();

    // The config-driven acceptance criterion: each row's number IS the config value.
    // If someone re-inlines 10/2/1 and the config later changes, this fails.
    for (const op of ['FULL_PAGE_GENERATION', 'SECTION_REGENERATION', 'ELEMENT_REGENERATION'] as const) {
      const cost = CREDIT_COSTS[op];
      const row = page.locator(`[data-testid="credit-cost-row"][data-cost-op="${op}"]`);
      await expect(row).toBeVisible();
      await expect(row.getByTestId('credit-cost-value')).toHaveText(
        `${cost} credit${cost === 1 ? '' : 's'}`,
      );
    }

    // IVOC_RESEARCH is a dead constant (backend removed in scale-08) — never surfaced.
    await expect(
      page.locator('[data-testid="credit-cost-row"][data-cost-op="IVOC_RESEARCH"]'),
    ).toHaveCount(0);
  });
});
