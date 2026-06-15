import { test as setup, expect } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';

// Signs in the E2E test user via Clerk and persists the session to storageState,
// which the `authed` project reuses. Password strategy on a Backend-API-created
// (already-verified) user is the most deterministic headless path.
const AUTH_FILE = 'e2e/.clerk/user.json';

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_CLERK_USER_EMAIL!;
  const password = process.env.E2E_CLERK_USER_PASSWORD!;

  await setupClerkTestingToken({ page });
  await page.goto('/');
  await clerk.signIn({
    page,
    signInParams: { strategy: 'password', identifier: email, password },
  });

  // Confirm the client session is live before saving state.
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });

  // Ensure the app-DB User row exists (saveDraft 404s without it). Also primes
  // a default persona; each publish test overrides persona before /api/start.
  const res = await page.request.post('/api/user/persona', { data: { persona: 'agency' } });
  expect(res.ok(), `persona upsert failed: ${res.status()}`).toBeTruthy();

  await page.context().storageState({ path: AUTH_FILE });
});
