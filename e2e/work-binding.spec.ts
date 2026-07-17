import { test, expect } from '@playwright/test';
import { seedBoundAtelier2Preview } from './helpers/seedWorkBrief';

// ============================================================================
// work-onboarding-ingestion (E2) phase 1 — REVEAL SURFACE proof.
//
// The data PATH (facts.work.groups[].photos → covers stamped + /works item pages
// carrying VERBATIM photos) is proved by vitest (workCollections /
// multiPageAssembly / work.llm). THIS spec proves the other half: that a
// pre-bound finalContent, when rendered on the work skeleton (atelier2), actually
// PAINTS the seeded photo URLs as gallery covers on the reveal surface.
//
// Mechanism (plan step 6): HAND-SEED a bound fc via /api/saveDraft (templateId
// atelier2), open /preview/{token}, assert the seeded cover URLs render. The two
// halves join end-to-end in phase 2 (post-flip, real fan-out).
//
// Authed + serial for the same reason as work-onboarding.spec.ts (one shared
// Clerk user, ~60s JWT).
// ============================================================================

test.describe.configure({ mode: 'serial' });

/** Clerk's session JWT is ~60s — refresh it, then use `page.request`. */
async function authedApi(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
  return page.request;
}

test('atelier2 reveal renders the seeded group photos as gallery covers', async ({ page }) => {
  const api = await authedApi(page);
  const { token, coverUrls, workSlugs } = await seedBoundAtelier2Preview(api);

  // The chromeless preview is the exact surface the STEP 06 reveal iframe embeds.
  await page.goto(`/preview/${token}?chrome=0`);
  await expect(page.getByTestId('preview-chromeless')).toBeVisible({ timeout: 60_000 });

  // The work gallery paints — a real template block emits token attributes.
  await expect(
    page.locator('[data-surface], [data-palette], [data-variant]').first()
  ).toBeVisible({ timeout: 60_000 });

  // The seeded covers render as <img src=…> in the gallery (NOT the "Cover"
  // placeholder). This is the reveal promise: the user's real photos, grouped.
  for (const url of coverUrls) {
    await expect(page.locator(`img[src="${url}"]`).first()).toBeVisible({ timeout: 30_000 });
  }

  // BINDING HREFS (E2 / phase 2): each stamped cover LINKS to its group's
  // `/works/<slug>` detail page — the D5 href half of stampWorkGalleryBinding. The
  // covers-only proof above + these links together are the reveal's whole promise.
  for (const slug of workSlugs) {
    await expect(page.locator(`a[href="/works/${slug}"]`).first()).toBeVisible({ timeout: 30_000 });
  }
});
