import { test, expect } from '@playwright/test';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';

// editor-route-consolidation phase 2 — the chromeless `/edit/[token]/preview`
// sub-route: a standalone, read-only, app-chrome-FREE render of the draft.
//
// What it pins (things phase 2 built, and things a later phase could silently
// break):
//   1. The sub-route renders the draft: the renderer main mounts and the seeded
//      hero copy is visible (proves the loadDraft path + preview-optimized
//      EditProvider config work standalone).
//   2. It is READ-ONLY: zero [contenteditable="true"] anywhere.
//   3. It is app-chrome-FREE: the canvas root has NO .app-chrome ancestor
//      (page.evaluate closest() check — would fail if the sub-route rendered
//      under the editor shell or the preview action-bar wrapper).
//
// Shape mirrors editor-preview-mode.spec / toolbar-dispatch.spec: authed Clerk
// session (storageState from the `setup` project) → persona → /api/start → seed
// a mock-mode Meridian draft via the real routes → open /edit/<token>/preview.
//
// ⚠️ Registration: playwright.config.ts testMatch is an explicit ALLOWLIST. This
// spec must be listed in the `authed` project or it silently runs zero tests.
test.describe.configure({ mode: 'serial' });

const HAS_AUTH_ENV = Boolean(
  process.env.E2E_CLERK_USER_EMAIL &&
    process.env.E2E_CLERK_USER_PASSWORD &&
    process.env.CLERK_SECRET_KEY,
);

// Meridian: fixed product section list; the hero copy `/Ship on Friday/i` is a
// stable, seeded string → a reliable data-integrity assertion.
const cfg = AUDIENCES.find((a) => a.templateId === 'meridian')!;

test.describe('editor chromeless preview sub-route (/edit/[token]/preview)', () => {
  let token: string;

  test.beforeAll(async ({ browser }) => {
    test.skip(!HAS_AUTH_ENV, 'authed env (E2E_CLERK_* / CLERK_SECRET_KEY) not configured');

    const page = await browser.newPage();
    await page.goto('/');
    await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
    const api = page.request;

    const personaRes = await api.post('/api/user/persona', { data: { persona: cfg.persona } });
    expect(personaRes.ok(), `persona ${cfg.persona}: ${personaRes.status()}`).toBeTruthy();

    const startRes = await api.get('/api/start');
    expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
    const { url } = await startRes.json();
    token = new URL(url).pathname.split('/').filter(Boolean).pop()!;
    expect(token, `bad token from ${url}`).toBeTruthy();

    await seedDraft(api, token, cfg);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    test.skip(!HAS_AUTH_ENV, 'authed env not configured');
    await page.goto(`/edit/${token}/preview`);
  });

  test('renders read-only, chrome-free, with seeded copy', async ({ page }) => {
    // 1. Data integrity: the chromeless container mounts AND the seeded hero copy
    //    is visible — proves loadDraft + the preview-optimized EditProvider work
    //    standalone (would fail on a blank/broken sub-route).
    await expect(
      page.locator('[data-testid="editor-preview-chromeless"]'),
      'chromeless sub-route container never rendered',
    ).toBeVisible({ timeout: 60_000 });

    const renderer = page.locator('[data-mode]').first();
    await expect(renderer, 'sub-route must render in preview mode').toHaveAttribute(
      'data-mode',
      'preview',
      { timeout: 60_000 },
    );

    await expect(
      page.getByText(cfg.heroText).first(),
      'seeded hero copy must be visible (loadDraft path works)',
    ).toBeVisible({ timeout: 60_000 });

    // 2. Read-only: no editable regions in the tree.
    await expect(
      page.locator('[contenteditable="true"]'),
      'chromeless preview must have zero editable regions',
    ).toHaveCount(0);

    // 3. app-chrome-FREE: the canvas root has NO .app-chrome ancestor. A real
    //    closest() check — would fail if the sub-route rendered under the editor
    //    shell or a preview action-bar `.app-chrome` wrapper.
    const hasAppChromeAncestor = await page.evaluate(() => {
      const canvas = document.getElementById('landing-preview');
      if (!canvas) return null; // canvas missing → let the assertion below flag it
      return Boolean(canvas.closest('.app-chrome'));
    });
    expect(
      hasAppChromeAncestor,
      'canvas must exist AND have NO .app-chrome ancestor (chrome bleed / missing canvas)',
    ).toBe(false);
  });
});
