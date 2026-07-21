import { test, expect } from '@playwright/test';

// work-contract-wave2 — end-to-end DOM proof for the new work-contract fields, on
// the /dev/blocks/atelier parity stage (edit + published bands, same fixtures the
// pixel-diff parity.spec.ts uses). This spec asserts CONTENT, not pixels:
//   • the filled packages tiers render the Wave-2 quad (per-tier image, dash
//     bullets, "most booked" flag, per-tier category label) in BOTH renderers;
//   • an unfilled tier renders EXACTLY today's legacy card (no image / bullets /
//     flag) — the graceful-empty guarantee that keeps existing drafts byte-stable.
// It also proves the hero multi-slide hooks + single-image bail, the derived vs
// legacy footer, and a GRACEFUL-EMPTY SWEEP over all five Wave-2 sections (packages,
// about, hero, header, footer) — a legacy/empty band renders today's markup with
// NONE of the new Wave-2 nodes leaking. (The byte-identical guarantee itself is
// owned authoritatively by the jsdom tripwires kundiusPages/oldContentFallback; this
// sweep is the deterministic DOM cross-check on the shared parity stage.)

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

test.describe('work-wave2 footer derived columns', () => {
  test('a marked footer renders derived columns tracking the page list; an un-marked footer stays legacy', async ({ page }) => {
    await page.goto(STAGE, { waitUntil: 'load' });
    await page.waitForSelector('[data-parity-band="published"][data-parity-section="footer"]');

    // Both bands assert the same DOM (both renderers read the SAME stored derived
    // data — no render-time page-list divergence). The derived footer carries the
    // marker → the .wk-footer__cols block; the legacy footer never does.
    for (const kind of ['published', 'edit'] as const) {
      // ── Derived footer (marker present) — located by the derived-only cols node.
      const derived = page
        .locator(`[data-parity-band="${kind}"][data-parity-section="footer"]`, {
          has: page.locator('.wk-footer__cols'),
        })
        .first();
      await expect(derived.locator('.wk-footer__col'), `${kind}: 3 footer columns (2 nav + contact)`).toHaveCount(3);
      // Nav links track the page list (home + index + detail pages).
      await expect(derived.locator('.wk-footer__col-link', { hasText: 'Brand Portraits' }), `${kind}: detail link`).toHaveCount(1);
      await expect(derived.getByText('Amsterdam, Netherlands'), `${kind}: contact location`).toBeVisible();

      // ── Legacy footer (no marker) — has a footer but NO derived cols block.
      const legacy = page
        .locator(`[data-parity-band="${kind}"][data-parity-section="footer"]`)
        .filter({ hasNot: page.locator('.wk-footer__cols') })
        .first();
      await expect(legacy.locator('.wk-footer'), `${kind}: legacy footer renders`).toHaveCount(1);
      await expect(legacy.locator('.wk-footer__cols'), `${kind}: legacy footer has no derived cols`).toHaveCount(0);
    }
  });
});

test.describe('work-wave2 graceful-empty sweep', () => {
  // A legacy / empty band for each of the five Wave-2 sections renders TODAY's markup
  // with NONE of the new Wave-2 nodes present. All checks run on the PUBLISHED band
  // (deterministic — no editor affordance nodes; empty optional fields render null /
  // collapse, exactly as they ship on a real published page).
  test('legacy/empty bands render legacy markup with no Wave-2 node leakage', async ({ page }) => {
    await page.goto(STAGE, { waitUntil: 'load' });
    await page.waitForSelector('[data-parity-band="published"][data-parity-section="footer"]');

    const pub = (section: string) =>
      page.locator(`[data-parity-band="published"][data-parity-section="${section}"]`);

    // ── HEADER: no fixture sets logo_image → EVERY header logo is the text wordmark
    // (legacy). The picker-wired logo emits an <img> ONLY when logo_image is set, so
    // zero <img> under any [data-wk-logo] proves the graceful default.
    await expect(pub('header').first().locator('[data-wk-logo]'), 'header logo renders').not.toHaveCount(0);
    await expect(pub('header').locator('[data-wk-logo] img'), 'no logo image node when logo_image empty').toHaveCount(0);
    await expect(pub('header').getByText('Kristina Kundius').first(), 'text wordmark renders').toBeVisible();

    // ── HERO: the single-image band (no `slides`) is EXACTLY today's single-media DOM
    // — no slide wrapper, no autoplay interval hook (the slider JS bails < 2 slides).
    const heroLegacy = pub('hero').filter({ has: page.locator('.wk-hero__media') }).first();
    await expect(heroLegacy.locator('.wk-hero__media'), 'single-media node').toHaveCount(1);
    await expect(heroLegacy.locator('.wk-hero__slide'), 'no slide wrapper').toHaveCount(0);
    await expect(heroLegacy.locator('[data-wk-interval]'), 'no autoplay hook').toHaveCount(0);
    await expect(heroLegacy.locator('.wk-hero__cta--ghost'), 'no 2nd CTA when cta2_href empty').toHaveCount(0);

    // ── PACKAGES: the unfilled tier (pk3) renders the legacy card — no image, no
    // bullets, no "most booked" flag, no category kicker.
    const pkgEmpty = pub('packages').locator('.wk-packages__card', { hasText: 'Portrait & business shoot' }).first();
    await expect(pkgEmpty, 'empty tier renders').toHaveCount(1);
    await expect(pkgEmpty.locator('.wk-packages__img-el'), 'no tier image').toHaveCount(0);
    await expect(pkgEmpty.locator('.wk-packages__bullet'), 'no bullets').toHaveCount(0);
    await expect(pkgEmpty.locator('.wk-packages__flag'), 'no featured flag').toHaveCount(0);
    await expect(pkgEmpty.locator('.wk-packages__cat'), 'no category kicker').toHaveCount(0);

    // ── ABOUT: the stage ships only a FILLED about fixture (atelier.ts is outside the
    // Phase-6 file scope, so no empty-about band was added), so the fully-empty
    // graceful-empty state is owned by the jsdom oldContentFallback/kundiusPages
    // tripwires. Here we cross-check the complementary guarantee: the Wave-2 fields are
    // ADDITIVE — the legacy about skeleton (eyebrow · heading · bio) still renders,
    // and the empty-portrait CSS collapse (.wk-about__portrait:empty) means the head
    // column never reflows when a portrait is absent.
    const about = pub('about').first();
    await expect(about.locator('.wk-about'), 'about renders').toHaveCount(1);
    await expect(about.locator('.wk-about__heading'), 'legacy about heading').toHaveCount(1);
    await expect(about.locator('.wk-about__bio'), 'legacy about bio').toHaveCount(1);

    // ── FOOTER: the un-marked footer (no footer_nav_mode) is the legacy footer — no
    // derived-columns block.
    const footerLegacy = pub('footer').filter({ hasNot: page.locator('.wk-footer__cols') }).first();
    await expect(footerLegacy.locator('.wk-footer'), 'legacy footer renders').toHaveCount(1);
    await expect(footerLegacy.locator('.wk-footer__cols'), 'legacy footer has no derived cols').toHaveCount(0);
  });
});
