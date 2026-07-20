import { test, expect } from '@playwright/test';

// work-contract-wave2 — end-to-end DOM proof for the new work-contract fields, on
// the /dev/blocks/atelier parity stage (edit + published bands, same fixtures the
// pixel-diff parity.spec.ts uses). This spec asserts CONTENT, not pixels:
//   • the filled packages tiers render the Wave-2 quad (per-tier image, dash
//     bullets, "most booked" flag, section category label) in BOTH renderers;
//   • an unfilled tier renders EXACTLY today's legacy card (no image / bullets /
//     flag) — the graceful-empty guarantee that keeps existing drafts byte-stable.
// (Phase 4/6 grow this file: hero multi-slide hooks + the full graceful-empty sweep.)

const STAGE = '/dev/blocks/atelier';

function band(kind: 'edit' | 'published') {
  return `[data-parity-band="${kind}"][data-parity-section="packages"]`;
}

test.describe('work-wave2 packages quad', () => {
  test('filled packages render the quad in BOTH renderers; empty tier stays legacy', async ({ page }) => {
    await page.goto(STAGE, { waitUntil: 'load' });
    await page.waitForSelector(band('published'));
    await page.waitForSelector(`${band('edit')} [data-element-key]`);

    for (const kind of ['published', 'edit'] as const) {
      const root = page.locator(band(kind)).first();

      // Section category label (Wave 2 section scalar).
      await expect(root.locator('.wk-packages__cat'), `${kind}: category label`).toHaveText('Commissions');

      // Three tiers total; two carry an image, one is empty (legacy card).
      await expect(root.locator('.wk-packages__card'), `${kind}: 3 tiers`).toHaveCount(3);
      await expect(root.locator('.wk-packages__img-el'), `${kind}: 2 tier images`).toHaveCount(2);

      // Exactly one "most booked" flag (pk2).
      await expect(root.locator('.wk-packages__flag'), `${kind}: one featured flag`).toHaveCount(1);
      await expect(root.locator('.wk-packages__flag')).toHaveText('Most booked');

      // Dash bullets present, verbatim from the fixture (2 filled tiers × 4 lines).
      const bullets = root.locator('.wk-packages__bullet');
      await expect(bullets, `${kind}: 8 bullet lines`).toHaveCount(8);
      await expect(root.getByText('A full production day, art-directed')).toBeVisible();
      await expect(root.getByText('Usage license included')).toBeVisible();

      // Graceful-empty: the third tier (pk3) has no image/bullets → legacy card.
      const emptyCard = root.locator('.wk-packages__card', { hasText: 'Portrait & business shoot' });
      await expect(emptyCard, `${kind}: empty tier renders`).toHaveCount(1);
      await expect(emptyCard.locator('.wk-packages__img-el'), `${kind}: empty tier has no image`).toHaveCount(0);
      await expect(emptyCard.locator('.wk-packages__bullet'), `${kind}: empty tier has no bullets`).toHaveCount(0);
      await expect(emptyCard.locator('.wk-packages__flag'), `${kind}: empty tier has no flag`).toHaveCount(0);
    }
  });
});
