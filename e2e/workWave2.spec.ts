import { test, expect } from '@playwright/test';

// work-contract-wave2 — end-to-end DOM proof for the new work-contract fields, on
// the /dev/blocks/atelier parity stage (edit + published bands, same fixtures the
// pixel-diff parity.spec.ts uses). This spec asserts CONTENT, not pixels:
//   • the filled packages tiers render the Wave-2 quad (per-tier image, dash
//     bullets, "most booked" flag, per-tier category label) in BOTH renderers;
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

      // Per-tier category labels (Wave 2b): the two filled tiers carry one. Text
      // holds in BOTH renderers. (In the PUBLISHED band an empty category renders
      // NOTHING — asserted below; in EDIT an empty optional field still mounts an
      // empty editable node, so a strict count is a published-only check.)
      await expect(root.getByText('Commercial', { exact: true }), `${kind}: pk1 category`).toBeVisible();
      await expect(root.getByText('Editorial', { exact: true }), `${kind}: pk2 category`).toBeVisible();
      if (kind === 'published') {
        await expect(root.locator('.wk-packages__cat'), `${kind}: exactly 2 per-tier categories`).toHaveCount(2);
      }

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
      if (kind === 'published') {
        // Published graceful-empty: the uncategorised tier renders no category node.
        await expect(emptyCard.locator('.wk-packages__cat'), `${kind}: empty tier has no category`).toHaveCount(0);
      }
    }
  });
});

test.describe('work-wave2 hero slider', () => {
  test('multi-slide hero emits the exact work.v1.js hooks; single-image hero stays single-media', async ({ page }) => {
    await page.goto(STAGE, { waitUntil: 'load' });
    await page.waitForSelector('[data-parity-band="published"][data-parity-section="hero"]');

    // ── Multi-slide (≥2 slides) — the PUBLISHED band the slider JS would activate.
    // Hooks spelled EXACTLY as workBehaviors.js queries them: .wk-hero__slide,
    // [data-wk-prev]/[data-wk-next], [data-wk-dots], [data-wk-interval] on the root.
    const slider = page
      .locator('[data-parity-band="published"][data-parity-section="hero"]', {
        has: page.locator('.wk-hero__slide'),
      })
      .first();
    await expect(slider.locator('.wk-hero__slide'), '2 slide nodes').toHaveCount(2);
    await expect(slider.locator('.wk-hero__slide.is-active'), 'first slide active for no-JS').toHaveCount(1);
    await expect(slider.locator('[data-wk-prev]'), 'prev arrow hook').toHaveCount(1);
    await expect(slider.locator('[data-wk-next]'), 'next arrow hook').toHaveCount(1);
    await expect(slider.locator('[data-wk-dots]'), 'dots container hook').toHaveCount(1);
    // Dots container ships EMPTY — the JS injects .wk-hero__dot at runtime.
    await expect(slider.locator('[data-wk-dots] .wk-hero__dot'), 'dots empty in static HTML').toHaveCount(0);
    // The interval hook lives on the slider ROOT — autoplay dies without it.
    await expect(slider.locator('[data-wk-hero-slider][data-wk-interval]'), 'interval hook on root').toHaveCount(1);
    // Second CTA rides the same fixture (cta2_href present → button renders).
    await expect(slider.getByText('View portfolio'), 'second CTA').toBeVisible();

    // ── Single-image WorkHeroSlider — EXACTLY today's single-media DOM, no slide
    // wrapper → the JS bails (<2 slides) → static render unchanged (Kundius-shape).
    const single = page
      .locator('[data-parity-band="published"][data-parity-section="hero"]', {
        has: page.locator('.wk-hero__media'),
      })
      .first();
    await expect(single.locator('.wk-hero__media'), 'exactly one single-media node').toHaveCount(1);
    await expect(single.locator('.wk-hero__slide'), 'no slide wrapper on single-image hero').toHaveCount(0);
    await expect(single.locator('[data-wk-hero-slider][data-wk-interval]'), 'no interval hook when single-image (JS bails)').toHaveCount(0);
  });
});
