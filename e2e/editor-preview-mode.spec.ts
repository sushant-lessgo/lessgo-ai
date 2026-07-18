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
// Phase 4: the preview-only device toggle (Desktop/Mobile) + the mobile iframe.
const DEVICE = '[role="group"][aria-label="Preview device"]';
const MOBILE_FRAME = '[data-testid="mobile-preview-frame"]';
const MOBILE_IFRAME = '[data-testid="mobile-preview-iframe"]';

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

  // ── Phase 4: true-viewport mobile iframe toggle ─────────────────────────────
  //
  // What it pins (and what a later phase could silently break):
  //   (a) The device toggle appears ONLY in preview mode; Mobile swaps the inline
  //       canvas for an ~390px iframe of the chromeless /edit/{token}/preview
  //       sub-route. The forced save() BEFORE the iframe mounts means the iframe's
  //       own loadDraft sees the just-edited headline — the frameLocator asserts
  //       the EDITED text is visible (save-before-frame data-integrity; this also
  //       fails deterministically if the iframe silent-blanks on an XFO mistake).
  //   (b) Desktop returns the inline canvas.
  //   (c) Back to Edit re-enables editing.
  test('edit headline → preview → mobile iframe shows edited copy → desktop → edit', async ({ page }) => {
    const marker = `E2EMOBILE${Date.now()}`;
    const headline = page.locator('[data-element-key="headline"]').first();
    await expect(headline).toBeVisible({ timeout: 60_000 });

    // 1. Edit the headline (append a unique marker) and commit via blur.
    await headline.click();
    await page.keyboard.press('End');
    await page.keyboard.type(marker, { delay: 40 });
    await expect(headline).toContainText(marker, { timeout: 15_000 });
    await headline.evaluate((el: HTMLElement) => el.blur());

    // 2. The device toggle is absent in edit mode.
    await expect(page.locator(DEVICE), 'device toggle must not show in edit mode').toHaveCount(0);

    // 3. Flip to Preview — device toggle appears (defaulting to Desktop = inline).
    await page.locator(`${SEGMENTED} button`, { hasText: 'Preview' }).click();
    await expect(page.locator('[data-mode]').first()).toHaveAttribute('data-mode', 'preview');
    await expect(page.locator(DEVICE), 'device toggle should show in preview mode').toHaveCount(1);
    await expect(page.locator(MOBILE_FRAME), 'desktop preview stays inline (no iframe)').toHaveCount(0);

    // 4. Switch to Mobile — the inline canvas is replaced by the phone iframe.
    await page.locator(`${DEVICE} button`, { hasText: 'Mobile' }).click();
    const iframeEl = page.locator(MOBILE_IFRAME);
    await expect(iframeEl, 'mobile iframe must mount after the forced save').toBeVisible({ timeout: 30_000 });

    // 4a. `src` points at the chromeless editor-preview sub-route.
    await expect(iframeEl).toHaveAttribute('src', new RegExp(`/edit/${token}/preview`));

    // 4b. The iframe is a real ~390px mobile viewport.
    const box = await iframeEl.boundingBox();
    expect(box, 'iframe should have a layout box').not.toBeNull();
    expect(box!.width, 'mobile iframe should be ~390px wide').toBeGreaterThan(380);
    expect(box!.width, 'mobile iframe should be ~390px wide').toBeLessThan(400);

    // 4c. DATA-INTEGRITY: the iframe (a separate document that ran its own
    //     loadDraft) shows the EDITED headline — proves save-before-frame ran and
    //     the sub-route actually rendered (not a silent-blank XFO frame).
    await expect(
      page.frameLocator(MOBILE_IFRAME).locator('[data-element-key="headline"]').first(),
      'mobile iframe must render the just-edited headline (save-before-frame)',
    ).toContainText(marker, { timeout: 30_000 });

    // 5. Back to Desktop — inline canvas returns, iframe gone, still preview mode.
    await page.locator(`${DEVICE} button`, { hasText: 'Desktop' }).click();
    await expect(page.locator(MOBILE_FRAME), 'mobile iframe must unmount on desktop').toHaveCount(0);
    await expect(page.locator('[data-mode]').first()).toHaveAttribute('data-mode', 'preview');

    // 6. Back to Edit — device toggle gone, canvas editable again.
    await page.locator(`${SEGMENTED} button`, { hasText: 'Edit' }).click();
    await expect(page.locator('[data-mode]').first()).toHaveAttribute('data-mode', 'edit');
    await expect(page.locator(DEVICE), 'device toggle must vanish back in edit mode').toHaveCount(0);
    await expect(
      page.locator('[contenteditable="true"]').first(),
      'edit mode should be editable again',
    ).toBeVisible({ timeout: 30_000 });
  });
});
