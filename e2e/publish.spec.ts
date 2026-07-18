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
    const finalContent = await seedDraft(api, token, cfg);

    // 3b. publish-sanitize: inject a stored-XSS payload into a rendered prose field
    // + a javascript: URL, via the SAME draft-save path, then re-save. The publish
    // gate (sanitizeContentHtml) must neutralize both before the page is frozen —
    // asserted against the served HTML at step 7.
    const heroId = (finalContent.layout.sections as string[]).find((id) => id.startsWith('hero-'));
    if (heroId) {
      const heroEls = finalContent.content[heroId].elements as Record<string, any>;
      heroEls.headline = '<img src=x onerror="alert(1)">Payload Headline Copy Here';
      heroEls.cta_href = 'javascript:alert(1)';
      await api.post('/api/saveDraft', {
        data: {
          tokenId: token,
          title: cfg.title,
          paletteId: cfg.paletteId,
          templateId: cfg.templateId,
          variantId: cfg.variantId,
          finalContent,
        },
      });
    }

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

    // The Review nudge is a soft nudge, never a gate (handoff t17 interaction rule:
    // "Publish now always works — never block someone from shipping"). Assert the
    // nudge is actually SHOWING first: without this the next assertion only ever
    // proved "enabled with no nudge", which is the trivial branch. The seeded draft
    // always leaves guide tasks open (no logo, no contact info), so the nudge renders.
    await expect(modal.getByTestId('publish-review-nudge')).toBeVisible();
    const confirmBtn = modal.getByRole('button', { name: 'Publish now' });
    await expect(confirmBtn).toBeEnabled();

    // publish-trust M3: `/api/publish` no longer lies. When the static export throws
    // (LOCAL DEV: Vercel Blob/KV are absent, so it always does — see the export catch
    // in `src/app/api/publish/route.ts`) the route returns 500 instead of the old
    // non-fatal 200 fall-through. So branch on the REAL status rather than assuming:
    //  - 200 (Blob/KV-provisioned env) → the live card + /p assertions, unchanged.
    //  - 500 (local dev)              → the M3 client-behavior acceptance test: the
    //    modal surfaces `publish-error`, NO live card, and /p/{slug} still renders
    //    because the catch's `publishState:'failed'` row is a SERVING state.
    // Generous timeout either way: the 500 arrives after the SAME doomed Blob/KV retries
    // the old 200 waited out.
    const publishResPromise = page.waitForResponse(
      (r) => r.url().includes('/api/publish') && r.request().method() === 'POST',
      { timeout: 120_000 },
    );
    await confirmBtn.click();

    // 5b. t17 · B publishing card replaces the confirm body while `publishing`.
    await expect(page.getByTestId('publish-publishing-card')).toBeVisible({ timeout: 20_000 });

    const publishRes = await publishResPromise;
    const publishStatus = publishRes.status();
    expect([200, 500], `/api/publish -> ${publishStatus} (unexpected status)`).toContain(
      publishStatus,
    );

    if (publishStatus === 200) {
      // 6. t17 · C live card.
      const liveCard = page.getByTestId('publish-live-card');
      await expect(liveCard).toBeVisible({ timeout: 120_000 });
      await expect(liveCard.getByText(/You're live!/)).toBeVisible();
      // The live card must show the real published URL, not an empty row.
      await expect(page.getByTestId('publish-live-url')).toHaveText(new RegExp(slug));
    } else {
      // 6'. Honest failure surfaced (M3 acceptance): error in the modal, never "published".
      await expect(modal.getByTestId('publish-error')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('publish-live-card')).toHaveCount(0);
    }

    // 7. Published page renders from DB with the right template — true in BOTH branches
    // ('published' and 'failed' are both serving states).
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

    // 8. publish-sanitize gate: the served HTML must carry NO live payload and NO
    // javascript: scheme, while a benign https CTA href survives.
    const servedHtml = await page.content();
    expect(servedHtml, 'onerror= payload survived the publish gate').not.toContain('onerror=');
    expect(servedHtml, '<script>alert survived the publish gate').not.toContain('<script>alert');
    expect(servedHtml, 'javascript: scheme survived the publish gate').not.toContain(
      'href="javascript:',
    );
    expect(servedHtml, 'benign https CTA href missing').toContain('https://example.com/cta');
  });
}

// editor-route-consolidation phase 6: the REAL publish flow now runs IN the editor
// header (shared usePublishFlow hook), no `/preview` hop. This drives that path
// end-to-end: /edit/{token} → Publish → SlugModal → confirm → success card → the
// published page actually serves the seeded content (PublishedPage + version +
// blob + KV chain), not just a 200 from /api/publish. The preview-route coverage
// above stays green — both surfaces are exercised until `/preview` retires.
test('publish from the EDITOR header → /p/[slug] serves seeded content', async ({ page }) => {
  // Meridian/product config — deterministic mock copy + injected CTA.
  const cfg = AUDIENCES.find((c) => c.templateId === 'meridian')!;
  const slug = 'e2e-editor-meridian-smoke';

  // Fresh Clerk session, page.request for authed API calls (same pattern as above).
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
  const api = page.request;

  const personaRes = await api.post('/api/user/persona', { data: { persona: cfg.persona } });
  expect(personaRes.ok(), `persona ${cfg.persona}: ${personaRes.status()}`).toBeTruthy();

  const startRes = await api.get('/api/start');
  expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
  const { url } = await startRes.json();
  const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;
  expect(token, `bad token from ${url}`).toBeTruthy();

  // Seed a publish-ready draft (strategy → copy → saveDraft).
  await seedDraft(api, token, cfg);

  // 1. Open the EDITOR and wait for the draft to render (hero copy visible = the
  //    store is loaded, so the publish payload won't be empty).
  await page.goto(`/edit/${token}`);
  await expect(page.getByText(cfg.heroText).first()).toBeVisible({ timeout: 45_000 });

  // 2. Click the editor-header Publish button → SlugModal opens in-place.
  const publishBtn = page.getByTestId('editor-publish-trigger');
  await expect(publishBtn).toBeEnabled({ timeout: 15_000 });
  await publishBtn.click();

  const modal = page.getByTestId('publish-confirm-card');
  await expect(modal).toBeVisible();
  await modal.getByTestId('publish-slug-input').fill(slug);
  await modal.getByTestId('publish-title-input').fill(cfg.title);

  const confirmBtn = modal.getByRole('button', { name: 'Publish now' });
  await expect(confirmBtn).toBeEnabled();

  // publish-trust M3 (same as above): 200 in a Blob/KV-provisioned env, 500 in
  // local dev — both leave a SERVING row, so the /p assertion holds either way.
  const publishResPromise = page.waitForResponse(
    (r) => r.url().includes('/api/publish') && r.request().method() === 'POST',
    { timeout: 120_000 },
  );
  await confirmBtn.click();

  const publishRes = await publishResPromise;
  const publishStatus = publishRes.status();
  expect([200, 500], `/api/publish -> ${publishStatus}`).toContain(publishStatus);

  if (publishStatus === 200) {
    // Success card (shared component) shows the real URL.
    const liveCard = page.getByTestId('publish-live-card');
    await expect(liveCard).toBeVisible({ timeout: 120_000 });
    await expect(liveCard.getByText(/You're live!/)).toBeVisible();
    await expect(page.getByTestId('publish-live-url')).toHaveText(new RegExp(slug));
  } else {
    await expect(modal.getByTestId('publish-error')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('publish-live-card')).toHaveCount(0);
  }

  // 3. DATA-INTEGRITY: the published page actually serves the seeded content — this
  //    is the whole chain (DB snapshot + version + blob + KV), not an endpoint 200.
  const pub = await page.goto(`/p/${slug}`);
  expect(pub?.status(), `/p/${slug} status`).toBeLessThan(400);
  await expect(page.locator('div.landing-page-published')).toHaveCount(1);
  const h1 = page.getByRole('heading', { level: 1 }).first();
  await expect(h1).toBeVisible();
  // The deterministically-injected CTA href proves the SEEDED draft flowed through
  // the editor publish path to the frozen page (a broken payload would drop it).
  const servedHtml = await page.content();
  expect(servedHtml, 'seeded CTA href missing from editor-published page').toContain(
    'https://example.com/cta',
  );
});
