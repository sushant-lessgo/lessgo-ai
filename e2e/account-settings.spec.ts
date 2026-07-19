import { test, expect } from '@playwright/test';

// Authenticated regression guard for the account-settings QA bug: "Account
// setting takes to persona selection which is wrong". /dashboard/settings must
// render Clerk's managed <UserProfile/>, NOT the old PersonaPrompt selector.
//
// Reuses the Clerk session saved by the `setup` project (storageState:
// e2e/.clerk/user.json) — no per-spec sign-in. Small + robust by design: this
// is a route/content regression lock, not a Clerk-flow exercise (name/email/
// password/sign-out are founder-manual per the plan's human gate).
test('account settings renders Clerk profile, not the persona selector', async ({ page }) => {
  await page.goto('/dashboard/settings');

  // Page header.
  await expect(page.getByRole('heading', { name: 'Account settings' })).toBeVisible();

  // Clerk <UserProfile/> mounted. Clerk hydrates client-side, so use its stable
  // class prefix (`cl-userProfile*`) with a generous timeout rather than any
  // inner copy (which Clerk can shift between versions).
  await expect(page.locator('[class*="cl-userProfile"]').first()).toBeVisible({
    timeout: 15_000,
  });

  // Persona selector ABSENT: the old PersonaPrompt heading string (settings
  // page passed heading="What do you do?" before phase 1 removed the mount).
  await expect(page.getByText('What do you do?')).toHaveCount(0);
});
