import { test, expect } from '@playwright/test';

// dashboard-workspace-ia PHASE 3 — the token workspace spine (`/dashboard/[token]`).
//
// Registered on the `authed` project in playwright.config.ts (a spec that isn't listed
// there matches no project and silently never runs). Run just this file:
//   npx playwright test e2e/dashboard-workspace.spec.ts --project=authed
//
// ⚠️ GOTCHA that bit phase 2 three times: `AppIcon` renders the Material Symbols
// LIGATURE NAME as element text (`src/components/ui/icon.tsx:33` → `{name}`,
// aria-hidden). A control's textContent is therefore "edit_noteOpen editor", so a
// whole-string `toHaveText('Open editor')` can NEVER pass. Use an end-anchored regex or
// `getByRole(..., { name })` (accessible names exclude the aria-hidden span — immune).
//
// What e2e canNOT cover (single Clerk session / no orphan seeding):
//   - non-owner 404 → founder gate item 1
//   - orphan + admin-orphan rejection → src/lib/workspace.test.ts (unit)
test.describe.configure({ mode: 'serial' });

const DEMO_TOKEN = 'lessgodemomockdata';

/** Create a real, owned project and return its token. */
async function createProject(page: import('@playwright/test').Page): Promise<string | null> {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
  const startRes = await page.request.get('/api/start');
  if (!startRes.ok()) return null;
  const { url } = await startRes.json();
  return new URL(url).pathname.split('/').filter(Boolean).pop() ?? null;
}

test.describe('workspace authz (phase 3)', () => {
  test('bogus token → 404', async ({ page }) => {
    const res = await page.goto('/dashboard/definitely-not-a-real-token-xyz');
    expect(res?.status(), 'unknown token must 404, not render a workspace').toBe(404);
  });

  // B3/D2 — security.ts:63-65 hands ANY caller {ok:true, project:null} for the demo
  // token. getWorkspaceProject must reject it rather than trust `ok`.
  test('demo token → 404 from a normal signed-in account (B3/D2)', async ({ page }) => {
    const res = await page.goto(`/dashboard/${DEMO_TOKEN}`);
    expect(res?.status(), 'demo token must not open a workspace').toBe(404);
  });
});

test.describe('workspace unauthenticated', () => {
  // Drop the saved Clerk session for this block only.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('unauthenticated /dashboard/<token> → sign-in', async ({ page }) => {
    await page.goto('/dashboard/some-token');
    // Clerk middleware owns authn for the whole /dashboard tree (no route-list edit).
    await expect(page).toHaveURL(/sign-in|accounts\./);
  });
});

test.describe('workspace chrome + Overview (phase 3)', () => {
  test('owner + real token → header, 6 tabs (Grow disabled), quick actions only', async ({
    page,
  }) => {
    const token = await createProject(page);
    test.skip(!token, '/api/start failed — cannot build a project fixture');

    const res = await page.goto(`/dashboard/${token}`);
    expect(res?.status(), 'owner must reach their own workspace').toBeLessThan(400);

    // Exactly one shell (the dashboard layout is the only .app-chrome attach point).
    await expect(page.locator('.app-chrome')).toHaveCount(1);

    // 3a header: back-link, Open editor, Visit. A fresh project is a DRAFT →
    // Draft chip + disabled Visit (nothing to visit yet).
    await expect(page.getByRole('link', { name: /All Projects$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Open editor$/ })).toBeEnabled();
    await expect(page.getByRole('button', { name: /Visit$/ })).toBeDisabled();
    await expect(page.getByText('Draft', { exact: true })).toBeVisible();

    // R2 — six tabs in the DESIGN'S ORDER. `toHaveText` on the tab bar's children
    // asserts DOM order, not just presence (visibility-only checks would pass on any
    // permutation). Safe from the AppIcon ligature trap: tab labels carry no icon —
    // the only child is the active tab's empty underline span.
    const tabBar = page
      .locator('div')
      .filter({ has: page.getByRole('link', { name: 'Overview', exact: true }) })
      .filter({ has: page.getByRole('button', { name: 'Grow', exact: true }) })
      .last();
    await expect(tabBar.locator('a, button')).toHaveText([
      'Overview',
      'Blog',
      'Leads',
      'Testimonials',
      'Analytics',
      'Grow',
    ]);

    // Grow is greyed in place — a disabled stub, NOT the hub.
    const grow = page.getByRole('button', { name: 'Grow', exact: true });
    await expect(grow).toBeVisible();
    await expect(grow).toBeDisabled();
    await expect(grow).toHaveAttribute('aria-disabled', 'true');

    // Overview is the active tab (underline is styling; aria-current is the contract).
    await expect(page.getByRole('link', { name: 'Overview', exact: true })).toHaveAttribute(
      'aria-current',
      'page'
    );

    // R3 — quick actions ONLY. KPI cards / Recent leads / Pages panels are OUT.
    await expect(page.getByText('QUICK ACTIONS', { exact: true })).toBeVisible();
    await expect(page.getByText('Recent leads')).toHaveCount(0);
    await expect(page.getByText('Pages on this site')).toHaveCount(0);
    await expect(page.getByText('Request testimonials')).toBeVisible();
  });

  // Phase 3 step 7 — the workspace header's root top bar must not double-stack
  // (DashboardTopBar self-suppresses on token paths, phase 1).
  test('root top bar does not double-stack on a token path', async ({ page }) => {
    const token = await createProject(page);
    test.skip(!token, '/api/start failed — cannot build a project fixture');

    await page.goto(`/dashboard/${token}`);
    // The root bar's only distinctive control is the greyed bell — absent on 3a.
    await expect(page.getByRole('button', { name: 'Notifications' })).toHaveCount(0);
    // And exactly one sidebar → one CTA.
    await expect(page.getByRole('button', { name: /Create my new website/i })).toHaveCount(1);
  });
});
