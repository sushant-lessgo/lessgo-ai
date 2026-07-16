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
    // Selector note (editor-shell-redesign phase 7): the t17 reskin moved these
    // controls onto stable data-testids. Testids over copy/class coupling — the
    // old hooks (`div.shadow-lg`, `/Choose your page URL/`, `/Confirm & Publish/`,
    // `/Page Published/`, `{name:'Publish', exact:true}`) all tracked strings the
    // handoff replaced. Every assertion below is the same strength or stronger.
    await page.goto(`/preview/${token}`);
    const publishBtn = page.getByTestId('publish-trigger');
    await expect(publishBtn, 'Publish button never enabled (isPublishReady false?)').toBeEnabled({
      timeout: 45_000,
    });
    await expect(publishBtn).toHaveText(/Publish/);
    await publishBtn.click();

    // 5. t17 · A confirm card — fill slug + title, confirm.
    const modal = page.getByTestId('publish-confirm-card');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Publish changes' })).toBeVisible();
    await modal.getByTestId('publish-slug-input').fill(slug);
    await modal.getByTestId('publish-title-input').fill(cfg.title);

    // The Review nudge is a soft nudge, never a gate (handoff t17 interaction rule):
    // Publish now must be enabled whether or not the nudge is showing.
    const confirmBtn = modal.getByRole('button', { name: 'Publish now' });
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // 5b. t17 · B publishing card replaces the confirm body while `publishing`.
    await expect(page.getByTestId('publish-publishing-card')).toBeVisible({ timeout: 20_000 });

    // 6. t17 · C live card. Generous timeout — publish runs doomed Blob/KV calls to
    // their timeouts in local dev before the non-fatal fallback returns success.
    const liveCard = page.getByTestId('publish-live-card');
    await expect(liveCard).toBeVisible({ timeout: 120_000 });
    await expect(liveCard.getByText(/You're live!/)).toBeVisible();
    // The live card must show the real published URL, not an empty row.
    await expect(page.getByTestId('publish-live-url')).toHaveText(new RegExp(slug));

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
