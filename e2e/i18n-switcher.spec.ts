import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// language-settings phase 6 — the FIRST e2e over the published locale switcher.
//
// Deterministic by construction (deterministic-QA rule): nothing here touches the
// DB, Blob, KV or the publish route. Every request is served by `page.route`:
//   • the document = a minimal fixture that stamps `window.__lessgoLocales`
//     exactly the way htmlGenerator (blob) and the /p SSR pages do;
//   • `**/assets/switcher.v2.js` = the LIVE source file
//     (src/lib/staticExport/switcherBehaviors.js), so this tests real semantics
//     without requiring a prior `npm run build:assets`.
//
// What it pins (the bug this feature exists to kill):
//   • a doc served at the HOST ROOT builds `/nl`;
//   • a doc served at `/p/{slug}` builds `/p/{slug}/nl` — NOT `/nl/p/{slug}` (404);
//   • the geo/preference auto-redirect obeys the same base path;
//   • `switcherStyle: 'none'` ⇒ NO pill AND NO redirect;
//   • the chosen locale is remembered in localStorage.
//
// ⚠️ Playwright projects use an ALLOWLIST `testMatch` — this spec must be listed in
// playwright.config.ts (`public` project) or it silently never runs.

const SWITCHER_SRC = readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'staticExport', 'switcherBehaviors.js'),
  'utf8',
);

const SLUG = 'gate';

type Cfg = {
  locales: string[];
  defaultLocale: string;
  current: string;
  slug: string;
  style: 'dropdown' | 'none';
  basePath?: string;
};

function doc(cfg: Cfg): string {
  // `basePath` is omitted when undefined — that is the BLOB shape (runtime
  // detection); when present it is the SSR shape (server-stamped).
  const json = JSON.stringify(cfg).replace(/</g, '\\u003c');
  return `<!DOCTYPE html><html lang="${cfg.current}"><head><meta charset="utf-8">
<title>fixture ${cfg.current}</title>
<script>window.__lessgoLocales=${json}</script>
<script src="/assets/switcher.v2.js" defer></script>
</head><body><h1 id="marker">${cfg.current.toUpperCase()} document</h1></body></html>`;
}

/**
 * Serve the fixture for EVERY navigation (so following a switcher link lands on a
 * real document and `page.url()` is meaningful) and the live switcher source for
 * the asset request. `current` is derived from the requested path so a locale doc
 * reports the locale it is serving.
 */
async function serveFixture(
  target: Page | BrowserContext,
  opts: { style?: 'dropdown' | 'none'; stampBasePath?: string | null },
) {
  await target.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/assets/switcher.v2.js')) {
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: SWITCHER_SRC });
    }
    const base = opts.stampBasePath ?? '';
    const rel = url.pathname.startsWith(base) ? url.pathname.slice(base.length) || '/' : url.pathname;
    const seg = rel.split('/')[1] || '';
    const current = seg === 'nl' ? 'nl' : 'en';
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: doc({
        locales: ['en', 'nl'],
        defaultLocale: 'en',
        current,
        slug: SLUG,
        style: opts.style ?? 'dropdown',
        ...(opts.stampBasePath === null || opts.stampBasePath === undefined
          ? {}
          : { basePath: opts.stampBasePath }),
      }),
    });
  });
}

const pill = (page: Page) => page.locator('#lessgo-lang-switcher');
const pillButton = (page: Page, loc: string) =>
  pill(page).getByRole('button', { name: loc.toUpperCase(), exact: true });

test.describe('published locale switcher (switcher.v2)', () => {
  test('host-root document: the pill renders both locales and NL goes to /nl', async ({ page }) => {
    await serveFixture(page, { stampBasePath: null });
    await page.goto('/');

    await expect(pill(page)).toBeVisible();
    await expect(pill(page).getByRole('button')).toHaveCount(2);
    await expect(pillButton(page, 'en')).toHaveAttribute('aria-pressed', 'true');

    await pillButton(page, 'nl').click();
    await page.waitForURL('**/nl');
    expect(new URL(page.url()).pathname).toBe('/nl');
    await expect(page.locator('#marker')).toHaveText('NL document');
  });

  test('/p/{slug} document: NL goes to /p/{slug}/nl — never /nl/p/{slug}', async ({ page }) => {
    // THE regression. The SSR renderer stamps the base path it is mounted at.
    await serveFixture(page, { stampBasePath: `/p/${SLUG}` });
    await page.goto(`/p/${SLUG}`);

    await expect(pill(page)).toBeVisible();
    await pillButton(page, 'nl').click();
    await page.waitForURL(`**/p/${SLUG}/nl`);
    const pathname = new URL(page.url()).pathname;
    expect(pathname).toBe(`/p/${SLUG}/nl`);
    expect(pathname).not.toBe(`/nl/p/${SLUG}`);
  });

  test('the chosen locale is remembered (localStorage)', async ({ page }) => {
    await serveFixture(page, { stampBasePath: `/p/${SLUG}` });
    await page.goto(`/p/${SLUG}`);
    await pillButton(page, 'nl').click();
    await page.waitForURL(`**/p/${SLUG}/nl`);

    expect(await page.evaluate(() => localStorage.getItem('lessgo.lang'))).toBe('nl');
  });

  test('geo/preference auto-redirect respects the base path', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'nl-NL' });
    await serveFixture(ctx, { stampBasePath: `/p/${SLUG}` });
    const page = await ctx.newPage();

    await page.goto(`/p/${SLUG}`);
    await page.waitForURL(`**/p/${SLUG}/nl`);
    expect(new URL(page.url()).pathname).toBe(`/p/${SLUG}/nl`);

    await ctx.close();
  });

  test("switcherStyle 'none': no pill AND no geo redirect", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'nl-NL' });
    await serveFixture(ctx, { style: 'none', stampBasePath: `/p/${SLUG}` });
    const page = await ctx.newPage();

    await page.goto(`/p/${SLUG}`);
    // Give the (defer) script every chance to boot and misbehave.
    await page.waitForTimeout(500);

    await expect(pill(page)).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe(`/p/${SLUG}`);
    await expect(page.locator('#marker')).toHaveText('EN document');

    await ctx.close();
  });
});
