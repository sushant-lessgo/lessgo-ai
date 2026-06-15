import { test, expect } from '@playwright/test';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';

// Authenticated publish flow (hybrid): set persona -> create project (/api/start)
// -> seed a publish-ready draft via the real authed routes -> drive the REAL
// publish UI (preview -> Publish -> SlugModal -> confirm) -> assert /p/[slug]
// renders the right template. Generation is mock mode (deterministic, free).
//
// Serial: the two configs share one test user; persona is mutated per test and
// must not race (audienceType is captured on the Project at /api/start).
test.describe.configure({ mode: 'serial' });

for (const cfg of AUDIENCES) {
  test(`publish ${cfg.label} → /p/[slug] renders`, async ({ page }) => {
    // Deterministic slug → republishes the same page across runs (stays under the
    // plan's published-page limit instead of accumulating).
    const slug = `e2e-${cfg.templateId}-smoke`;

    // Load a Clerk page so the session cookie is freshly refreshed, and use
    // page.request for API calls — the standalone `request` context can't refresh
    // Clerk's short-lived (~60s) session JWT, so it 401s on later tests.
    await page.goto('/');
    await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
    const api = page.request;

    // 1. Persona → derive audienceType for this project.
    const personaRes = await api.post('/api/user/persona', { data: { persona: cfg.persona } });
    expect(personaRes.ok(), `persona ${cfg.persona}: ${personaRes.status()}`).toBeTruthy();

    // 2. Create project + token.
    const startRes = await api.get('/api/start');
    expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
    const { url } = await startRes.json();
    expect(url, 'no url from /api/start').toBeTruthy();
    const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;
    expect(token, `bad token from ${url}`).toBeTruthy();

    // 3. Seed a publish-ready draft.
    await seedDraft(api, token, cfg);

    // 4. Open preview; Publish enables only when isPublishReady (draft loaded + CTA).
    await page.goto(`/preview/${token}`);
    const publishBtn = page.getByRole('button', { name: 'Publish', exact: true });
    await expect(publishBtn, 'Publish button never enabled (isPublishReady false?)').toBeEnabled({
      timeout: 45_000,
    });
    await publishBtn.click();

    // 5. SlugModal — fill slug + title, confirm (handles first-publish + republish).
    // Scope to the modal card (shadow-lg + its heading) to avoid the page wrapper.
    const modal = page.locator('div.shadow-lg').filter({ hasText: /Choose your page URL|Republish Your Page/ });
    await expect(modal).toBeVisible();
    await modal.getByRole('textbox').first().fill(slug);
    await modal.getByPlaceholder('e.g., Design Tools for Social Media Marketers').fill(cfg.title);
    await modal.getByRole('button', { name: /Confirm & Publish|Update Published Page/ }).click();

    // 6. Success. Generous timeout — publish runs doomed Blob/KV calls to their
    // timeouts in local dev before the non-fatal fallback returns success.
    await expect(page.getByText(/Page Published/i)).toBeVisible({ timeout: 120_000 });

    // 7. Published page renders from DB with the right template.
    const pub = await page.goto(`/p/${slug}`);
    expect(pub?.status(), `/p/${slug} status`).toBeLessThan(400);
    await expect(page.locator('div.landing-page-published')).toHaveCount(1);
    expect(
      await page.locator('[data-surface], [data-variant], [data-palette]').count(),
      'no template token attrs on published page',
    ).toBeGreaterThan(0);
    // Hero rendered with real (seeded) copy — robust to mock-copy wording changes.
    const h1 = page.getByRole('heading', { level: 1 }).first();
    await expect(h1).toBeVisible();
    expect((await h1.innerText()).trim().length, 'empty hero headline').toBeGreaterThan(8);
  });
}
