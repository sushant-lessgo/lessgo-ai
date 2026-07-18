import { test, expect } from '@playwright/test';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';

// editor-route-consolidation phase 1 — the inline Edit/Preview mode flip.
//
// What it pins (the things phase 1 changed, and the things a later phase could
// silently break):
//   1. The editor first-loads in EDIT mode: the renderer main carries
//      data-mode="edit" and the canvas is contentEditable.
//   2. Clicking Preview flips the store mode: data-mode="preview", every
//      contenteditable goes read-only (zero [contenteditable="true"]), and the
//      LeftPanel (rail) is unmounted — a clean read view.
//   3. Clicking Edit flips back: data-mode="edit", editable again, rail returns.
//
// Shape mirrors toolbar-dispatch.spec: authed Clerk session (storageState from
// the `setup` project) → persona → /api/start → seed a mock-mode Meridian draft
// via the real routes → open /edit/<token>. Mock mode = no LLM, no credits.
//
// ⚠️ Registration: playwright.config.ts testMatch is an explicit ALLOWLIST. This
// spec must be listed in the `authed` project or it silently runs zero tests.
test.describe.configure({ mode: 'serial' });

const HAS_AUTH_ENV = Boolean(
  process.env.E2E_CLERK_USER_EMAIL &&
    process.env.E2E_CLERK_USER_PASSWORD &&
    process.env.CLERK_SECRET_KEY,
);

// Meridian: fixed product section list, stable `headline` key → a reliable
// contenteditable target for the read-only assertion.
const cfg = AUDIENCES.find((a) => a.templateId === 'meridian')!;

// The Edit/Preview segmented control (EditHeaderRightPanel) and the rail
// (LeftPanel's SegmentedControl) each carry a stable aria-label.
const SEGMENTED = '[role="group"][aria-label="Edit or preview"]';
const RAIL = '[aria-label="Left rail panel"]';

test.describe('editor preview-mode flip (Edit/Preview segmented control)', () => {
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
    await page.goto(`/edit/${token}`);
    await expect(
      page.locator('[data-element-key="headline"]').first(),
      'editor never rendered the hero headline',
    ).toBeVisible({ timeout: 60_000 });
  });

  test('edit → preview → edit: mode flips, canvas read-only, rail toggles', async ({ page }) => {
    const renderer = page.locator('[data-mode]').first();

    // 1. First-load is EDIT: renderer main is edit-mode, canvas is editable,
    //    rail is present.
    await expect(renderer).toHaveAttribute('data-mode', 'edit');
    await expect(
      page.locator('[contenteditable="true"]').first(),
      'edit mode should have at least one editable region',
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(RAIL), 'rail should be present in edit mode').toHaveCount(1);

    // 2. Flip to PREVIEW via the segmented control.
    await page.locator(`${SEGMENTED} button`, { hasText: 'Preview' }).click();

    await expect(renderer).toHaveAttribute('data-mode', 'preview');
    await expect(
      page.locator('[contenteditable="true"]'),
      'preview mode must have zero editable regions',
    ).toHaveCount(0);
    await expect(page.locator(RAIL), 'rail must be hidden in preview mode').toHaveCount(0);
    // Preview segment is now the current one.
    await expect(
      page.locator(`${SEGMENTED} button`, { hasText: 'Preview' }),
    ).toHaveAttribute('aria-current', 'true');

    // 3. Flip back to EDIT — editable again, rail returns.
    await page.locator(`${SEGMENTED} button`, { hasText: 'Edit' }).click();

    await expect(renderer).toHaveAttribute('data-mode', 'edit');
    await expect(
      page.locator('[contenteditable="true"]').first(),
      'edit mode should be editable again after flipping back',
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(RAIL), 'rail should return in edit mode').toHaveCount(1);
  });
});
