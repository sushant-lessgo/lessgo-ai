import { test, expect } from '@playwright/test';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';

// CMS collections — success criterion #1, driven entirely through the AUTHORING UI.
//
// create collection (t12 modal) → add a group → add items (t19 editor) → place the
// block → the placed section renders those items IN THE EDITOR.
//
// Why this spec exists next to `cms-publish.spec.ts`: that one seeds collections
// through the API and proves the PUBLISH leg; this one proves the UI leg — that a
// user with no API access can get from "no collection" to "items on the page".
// The publish leg here is opportunistic only (locally Vercel Blob/KV are absent, so
// `/api/publish` 500s — see e2e/publish.spec.ts, which documents that tolerance).
// Every BINDING assertion for the data/publish contract stays in vitest:
//   • src/modules/cms/materializePublish.test.ts       (materialization + parity)
//   • src/app/edit/[token]/components/cms/ItemEditor.test.tsx  (payload contracts)
//
// ⚠️ REGISTRATION: `playwright.config.ts`'s `authed.testMatch` is an ALLOWLIST — an
// unlisted spec silently matches no project and the suite goes green never having
// run it (the config says so in a comment). This file and `cms-publish.spec.ts` ARE
// listed there. If you rename either file, rename its entry in that allowlist too,
// or it stops running without ever failing.

test.describe.configure({ mode: 'serial' });

test('author a collection end to end through the CMS UI', async ({ page }) => {
  const cfg = AUDIENCES.find((c) => c.templateId === 'meridian')!;
  const NAME = `Books ${Date.now()}`;
  const ITEM_A = 'Deep Work';
  const ITEM_B = 'Shallow Work';
  const GROUP = 'Essays';

  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, {
    timeout: 30_000,
  });
  const api = page.request;

  const personaRes = await api.post('/api/user/persona', { data: { persona: cfg.persona } });
  expect(personaRes.ok(), `persona: ${personaRes.status()}`).toBeTruthy();

  const startRes = await api.get('/api/start');
  expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
  const { url } = await startRes.json();
  const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;

  // Seed a normal page so the editor has something to mount (mock copy).
  await seedDraft(api, token, cfg);

  await page.goto(`/edit/${token}`);
  await expect(page.getByText(cfg.heroText).first()).toBeVisible({ timeout: 45_000 });

  /* 1. CREATE THE COLLECTION — t12, through the real modal. */
  await page.getByRole('button', { name: 'Collections' }).click();
  await page.locator('[data-collection-new]').click();

  const modal = page.locator('[data-cms-collection-modal]');
  await expect(modal).toBeVisible();
  await modal.locator('[data-slug-name]').fill(NAME);

  // Two fields from the closed 9: a title (text_short) and a body (text_long).
  for (const type of ['text_short', 'text_long'] as const) {
    await modal.locator('[data-add-field-trigger]').click();
    await page.locator(`[data-add-field-type="${type}"]`).click();
  }
  await expect(modal.locator('[data-type-chip]')).toHaveCount(2);

  // Detail pages ON — this is also the phase-4 gate's authoring entry point.
  await modal.locator('[data-detail-pages]').click();

  await modal.getByRole('button', { name: /create collection/i }).click();
  await expect(modal).toBeHidden({ timeout: 15_000 });

  /* 2. OPEN THE ITEM BROWSER — t22. */
  await page.getByRole('button', { name: 'Collections' }).click();
  const row = page.locator('[data-collection-row]').first();
  await expect(row).toBeVisible();
  await row.hover();
  await page.locator('[data-collection-items]').first().click();

  const browser = page.locator('[data-cms-browser]');
  await expect(browser).toBeVisible();

  /* 3. ADD A GROUP — up/down reorder only, no drag (founder ruling). */
  await browser.locator('[data-groups-toggle]').click();
  await browser.locator('[data-group-new-name]').fill(GROUP);
  await browser.locator('[data-group-add]').click();
  await expect(browser.locator('[data-group-row]')).toHaveCount(1, { timeout: 15_000 });

  /* 4. ADD TWO ITEMS — t19, one control per field TYPE. */
  for (const title of [ITEM_A, ITEM_B]) {
    await browser.locator('[data-item-new]').click();
    const editor = browser.locator('[data-cms-item-editor]');
    await editor.locator('[data-control="text_short"]').fill(title);
    await editor.locator('[data-control="text_long"]').fill(`About ${title}.`);
    await editor.locator('[data-item-save]').click();
    await expect(browser.getByText(title, { exact: false }).first()).toBeVisible({
      timeout: 15_000,
    });
  }
  await expect(browser.locator('[data-item-card]')).toHaveCount(2);

  // The permalink line only exists because detailPages is ON.
  await expect(browser.locator('[data-slug-segment]')).toBeVisible();

  // Close the browser (Escape — it is a Radix dialog).
  await page.keyboard.press('Escape');
  await expect(browser).toBeHidden();

  /* 5. PLACE THE BLOCK — and see the ITEMS render in the editor canvas. */
  await page.getByRole('button', { name: 'Collections' }).click();
  await page.locator('[data-collection-row]').first().hover();
  await page.locator('[data-collection-place]').first().click();

  const section = page.locator('[data-cms-collection]').first();
  await expect(section).toBeVisible({ timeout: 30_000 });
  await expect(section.getByText(ITEM_A, { exact: false }).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(section.getByText(ITEM_B, { exact: false }).first()).toBeVisible();
});
