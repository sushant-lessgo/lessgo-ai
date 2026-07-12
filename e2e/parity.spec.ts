import { test, expect } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

// VISUAL / CSS dual-renderer parity (template-factory phase 7). Content parity
// (visible text) is already owned by renderParity.meridian.test.tsx in jsdom; this
// spec catches what jsdom can't — CSS/layout divergence between a block's EDIT
// render (in mode:'preview') and its `.published.tsx` pair.
//
// Method: the generic /dev/blocks/<template> stage stacks each section's edit band
// and published band behind stable selectors. We screenshot the two bands and diff
// them TO EACH OTHER (not to a stored baseline — sidesteps OS-pinned snapshots).
// Anti-aliasing / sub-pixel noise is tolerated by PASS_THRESHOLD; a real
// divergence blows past it — proven by the permanent `?parityBreak=1` negative
// control, which injects a small style break into the edit band only.

// Templates enrolled in the parity harness (their mocks exist in blockMocks/).
const TEMPLATES = ['meridian', 'hearth'] as const;

// Fraction of compared pixels allowed to differ. Edit-preview and published render
// the same HTML/CSS, so real parity sits far below this; the seeded break lands
// far above it (whole-band tint + 6px shift). Calibrated in the phase-7 audit.
const PASS_THRESHOLD = 0.03;

// Kill motion + hide the caret and the fixed switcher so only block content is
// captured (the switcher is position:fixed and would bleed into element shots).
const NEUTRALIZE_CSS = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
  [data-parity-switcher] { display: none !important; }
`;

/** Copy the top-left w×h region of a PNG into a fresh, equally sized PNG. */
function cropTo(png: PNG, w: number, h: number): PNG {
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    const src = y * png.width * 4;
    const dst = y * w * 4;
    png.data.copy(out.data, dst, src, src + w * 4);
  }
  return out;
}

/** Fraction of differing pixels between two PNG buffers (cropped to overlap). */
function diffRatio(bufA: Buffer, bufB: Buffer): number {
  const a = PNG.sync.read(bufA);
  const b = PNG.sync.read(bufB);
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const ca = w === a.width && h === a.height ? a : cropTo(a, w, h);
  const cb = w === b.width && h === b.height ? b : cropTo(b, w, h);
  const diff = new PNG({ width: w, height: h });
  const mismatched = pixelmatch(ca.data, cb.data, diff.data, w, h, { threshold: 0.1 });
  return mismatched / (w * h);
}

async function settle(page: import('@playwright/test').Page) {
  // Both bands present + edit band actually seeded from the store (markers = its
  // content rendered), then fonts loaded and motion neutralized.
  await page.waitForSelector('[data-parity-band="published"]');
  await page.waitForSelector('[data-parity-band="edit"] [data-element-key]');
  await page.evaluate(() => (document as any).fonts?.ready);
  await page.addStyleTag({ content: NEUTRALIZE_CSS });
}

async function bandDiff(page: import('@playwright/test').Page, section: string): Promise<number> {
  const editBuf = await page
    .locator(`[data-parity-band="edit"][data-parity-section="${section}"]`)
    .screenshot();
  const pubBuf = await page
    .locator(`[data-parity-band="published"][data-parity-section="${section}"]`)
    .screenshot();
  return diffRatio(editBuf, pubBuf);
}

for (const template of TEMPLATES) {
  test(`${template}: edit↔published visual parity per section`, async ({ page }) => {
    await page.goto(`/dev/blocks/${template}`, { waitUntil: 'load' });
    await settle(page);

    const editBands = page.locator('[data-parity-band="edit"]');
    const count = await editBands.count();
    expect(count, `${template} rendered no edit bands`).toBeGreaterThan(0);

    const sections: string[] = [];
    for (let i = 0; i < count; i++) {
      const s = await editBands.nth(i).getAttribute('data-parity-section');
      if (s) sections.push(s);
    }

    for (const section of sections) {
      const ratio = await bandDiff(page, section);
      console.log(`PARITY ${template}/${section}: ${(ratio * 100).toFixed(3)}%`);
      expect(
        ratio,
        `${template}/${section}: edit↔published diff ${(ratio * 100).toFixed(2)}% exceeds ${(PASS_THRESHOLD * 100).toFixed(0)}%`,
      ).toBeLessThanOrEqual(PASS_THRESHOLD);
    }
  });
}

test('parityBreak negative control: seeded divergence exceeds threshold', async ({ page }) => {
  await page.goto('/dev/blocks/meridian?parityBreak=1', { waitUntil: 'load' });
  await settle(page);

  // hero is a large, content-rich band — the injected tint + 6px shift covers it.
  const ratio = await bandDiff(page, 'hero');
  console.log(`PARITY BREAK meridian/hero: ${(ratio * 100).toFixed(3)}%`);
  expect(
    ratio,
    `seeded break not caught: diff ${(ratio * 100).toFixed(2)}% did not exceed ${(PASS_THRESHOLD * 100).toFixed(0)}%`,
  ).toBeGreaterThan(PASS_THRESHOLD);
});
