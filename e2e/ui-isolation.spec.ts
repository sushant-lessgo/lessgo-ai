import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// ui-foundation PHASE 1 — EDITOR / main-app surface isolation guard.
//
// The published-css sha256 guard (vitest) pins the PUBLISHED surface but is
// invariant to root tailwind.config.js. Template blocks ALSO render on the
// main-app CSS bundle (compiled from root tailwind.config.js) at /edit,
// /preview and the /dev/* galleries. An accidental override of an existing root
// key (borderRadius.lg/md/sm, fontSize scale, fontFamily.heading/body) shifts
// template rendering HERE silently — an editor↔published divergence the hash
// guard can't see. This spec records computed-style baselines for representative
// meridian block elements on /dev/meridian/blocks and asserts them unchanged
// through phase 6, plus app-chrome negative checks on the same surface.
//
// Mirrors e2e/render.spec.ts conventions: /dev/meridian/blocks mounts its block
// subtree via an ssr:false dynamic import, so we wait for the template token
// attributes to appear before reading computed styles.
//
// DEVIATION (documented in the phase-1 audit): the plan's step-3b "generated
// landing page" negative checks run on /dev/meridian/blocks too — it IS meridian
// blocks rendered through the main-app CSS bundle, and it's the route render.spec
// proves is available in mock mode without auth/generation. No live /p or /edit
// page is reachable here without a seeded draft + Clerk session.

const BLOCKS_ROUTE = '/dev/meridian/blocks';
const TOKEN_ATTRS = '[data-surface], [data-palette], [data-variant]';

// Pin the viewport so px-based font-size/border-radius baselines don't drift
// across machines/CI (template heading font-sizes are clamp()/vw-derived).
test.use({ viewport: { width: 1280, height: 800 } });

const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'ui-isolation-computed-styles.json');

// Representative template elements → the computed props to pin. Stable
// classname selectors (not nth-child): a card (radius), a primary CTA (radius +
// font-size), the hero headline (font-family + font-size), the hero lede
// (font-family + font-size).
const PROBES: Array<{ key: string; selector: string; props: string[] }> = [
  { key: 'card', selector: '.mrd-price-card', props: ['borderRadius'] },
  { key: 'button', selector: '.mrd-btn--primary', props: ['borderRadius', 'fontSize'] },
  { key: 'heading', selector: '.mrd-hero__headline', props: ['fontFamily', 'fontSize'] },
  { key: 'body', selector: '.mrd-hero__lede', props: ['fontFamily', 'fontSize'] },
];

type Baseline = Record<string, Record<string, string>>;

function readBaseline(): Baseline | null {
  if (!fs.existsSync(FIXTURE_PATH)) return null;
  return JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8')) as Baseline;
}

test.describe('ui-foundation isolation — main-app surface', () => {
  test('computed-style baselines on /dev/meridian/blocks are unchanged', async ({ page }) => {
    const response = await page.goto(BLOCKS_ROUTE, { waitUntil: 'load' });
    expect(response, 'no response for blocks route').toBeTruthy();
    expect(response!.status()).toBeLessThan(400);
    await page.waitForSelector(TOKEN_ATTRS, { timeout: 45_000 });

    // Collect computed styles for every probe.
    const captured: Baseline = {};
    for (const probe of PROBES) {
      const el = page.locator(probe.selector).first();
      await expect(el, `probe "${probe.key}" (${probe.selector}) missing`).toHaveCount(1, { timeout: 45_000 });
      const values = await el.evaluate((node, props: string[]) => {
        const cs = getComputedStyle(node as Element);
        const out: Record<string, string> = {};
        for (const p of props) out[p] = cs.getPropertyValue(p) || (cs as any)[p];
        return out;
      }, probe.props);
      captured[probe.key] = values;
    }

    const baseline = readBaseline();
    if (!baseline) {
      // First run THIS phase → record the baseline, then pass. Later phases assert.
      fs.mkdirSync(path.dirname(FIXTURE_PATH), { recursive: true });
      fs.writeFileSync(FIXTURE_PATH, JSON.stringify(captured, null, 2) + '\n');
      console.log(`[ui-isolation] recorded computed-style baseline → ${FIXTURE_PATH}`);
      return;
    }
    expect(captured).toEqual(baseline);
  });

  test('no app-chrome fonts/classes on the block surface', async ({ page }) => {
    await page.goto(BLOCKS_ROUTE, { waitUntil: 'load' });
    await page.waitForSelector(TOKEN_ATTRS, { timeout: 45_000 });

    // Hero headline font-family must NOT contain the app-chrome display font —
    // proves templates on the app surface still compute to their own font (Inter
    // Tight) even though Onest is preloaded/available in the root layout.
    const headingFont = await page
      .locator('.mrd-hero__headline')
      .first()
      .evaluate((n) => getComputedStyle(n as Element).fontFamily);
    expect(headingFont.toLowerCase()).not.toContain('onest');

    // No app-* class anywhere in the rendered surface.
    const appClassCount = await page.locator('[class*="app-"]').count();
    expect(appClassCount, 'app-* classes leaked into the template surface').toBe(0);

    // NOTE: a "no onest/material-symbols woff2 network request" assertion used to
    // live here. Removed under Phase 2: /dev/meridian/blocks is an APP-SHELL route
    // served by the ROOT layout, which (correctly) preloads app-chrome fonts on
    // every app route — so those requests are EXPECTED here, not an isolation break.
    // Published-surface isolation (a /p page loads/references no app font) is proven
    // by the vitest HTML-snapshot negative-trace + published.css sha256 + 0-leak grep.
  });
});
