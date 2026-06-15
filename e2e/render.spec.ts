import { test, expect } from '@playwright/test';

// Render smoke — loads the public /dev/* template surfaces in a real browser and
// asserts they mount without a crash. jsdom unit tests can't catch client-only
// render/hydration failures; this can. Coverage is uneven (no /dev/lex route, and
// hearth-demo is a token demo not a full block page) — the full published-page
// render is the phase-2 browser-publish spec.
//
// Note: /dev/meridian/blocks renders its block subtree via an ssr:false dynamic
// import, so we wait for the template token attributes to appear rather than
// counting server-rendered text.

const TOKEN_ATTRS = '[data-surface], [data-palette], [data-variant]';

const ROUTES: Array<{ path: string; expectSurfaceAttrs: boolean }> = [
  { path: '/dev/hearth-demo', expectSurfaceAttrs: false },    // palette/token demo
  { path: '/dev/meridian', expectSurfaceAttrs: false },       // template demo
  { path: '/dev/meridian/blocks', expectSurfaceAttrs: true }, // full block gallery (client-rendered)
];

for (const { path, expectSurfaceAttrs } of ROUTES) {
  test(`${path} renders without crashing`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: 'load' });
    expect(response, `no response for ${path}`).toBeTruthy();
    expect(response!.status(), `bad status for ${path}`).toBeLessThan(400);

    // Next.js dev error overlay must not be present.
    await expect(page.locator('nextjs-portal')).toHaveCount(0);
    await expect(page.getByText(/Unhandled Runtime Error|Application error/i)).toHaveCount(0);

    if (expectSurfaceAttrs) {
      // Wait for the (client-mounted) blocks to emit template token attributes.
      await page.waitForSelector(TOKEN_ATTRS, { timeout: 15_000 });
      expect(await page.locator(TOKEN_ATTRS).count()).toBeGreaterThan(0);
    } else {
      const text = (await page.locator('body').innerText()).trim();
      expect(text.length, `empty body for ${path}`).toBeGreaterThan(100);
    }
  });
}
