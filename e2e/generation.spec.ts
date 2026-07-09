import { test, expect, type APIRequestContext } from '@playwright/test';

// Generation HTTP smoke — exercises the real strategy + copy routes through the
// dev server (middleware, rate-limit, parse pipeline), which the vitest
// generation-contract test can't reach (it calls the modules directly).
//
// scale-06 reality: the product + service generation now flow through the ONE
// unified engine (`runGeneration` → the audience strategy/copy routes). These
// HTTP smokes hit exactly those routes, so they ARE the "product + service
// through the one engine" coverage at the layer the auth-less `public` Playwright
// project can reach. The unified WIZARD UI (/onboarding/[token]) is Clerk-gated
// (`/onboarding/(.*)` is NOT in isPublicRoute) so it can't be driven from this
// project — the browser-level wizard + mid-wizard RELOAD/RESUME step below is
// written-only (auth-gated, founder-run). The resume MECHANISM itself is locked
// green in vitest: src/app/onboarding/[token]/loadDetection.test.ts (predicate +
// useWizardStore.hydrate rehydration) + src/modules/wizard/acceptance.test.ts.
//
// Routing reality (src/middleware.ts): only the PRODUCT generation routes are in
// isPublicRoute, so they're reachable headless with the DEMO_TOKEN (auth bypass +
// canned copy). The SERVICE routes are Clerk-protected (404 without a session) —
// correct for prod, but it means the service smoke needs a real session and is
// skipped unless E2E_AUTH is provided.

const DEMO_TOKEN = 'lessgodemomockdata';
const REAL = process.env.E2E_LLM === 'real';
const productAuth = REAL ? process.env.E2E_AUTH : DEMO_TOKEN;
const serviceAuth = process.env.E2E_AUTH; // service is always auth-gated
// The unified-wizard UI drive needs a real Clerk session (browser cookies, not a
// bearer) + a seeded confirmed brief; unavailable in the public project.
const WIZARD_UI = process.env.E2E_WIZARD_UI === '1';

function headers(token?: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function postJson(request: APIRequestContext, url: string, body: unknown, token?: string) {
  const res = await request.post(url, { headers: headers(token), data: body });
  const json = await res.json().catch(() => ({}));
  return { status: res.status(), json };
}

/** Shared assertion: every routed section has non-empty elements + a hero headline. */
function assertWellFormed(uiblocks: Record<string, string>, sections: Record<string, any>) {
  for (const sectionType of Object.keys(uiblocks)) {
    const sec = sections[sectionType];
    expect(sec, `missing section ${sectionType}`).toBeTruthy();
    expect(Object.keys(sec.elements).length, `empty section ${sectionType}`).toBeGreaterThan(0);
  }
  if (sections.hero) {
    const headline = sections.hero.elements.headline;
    expect(typeof headline === 'string' && headline.trim().length, 'empty hero headline').toBeTruthy();
  }
}

test.describe('product generation pipeline (HTTP, public routes)', () => {
  test.skip(REAL && !productAuth, 'E2E_LLM=real needs a Clerk session bearer in E2E_AUTH');

  test('strategy → copy produces well-formed sections', async ({ request }) => {
    const strategyRes = await postJson(request, '/api/audience/product/strategy', {
      productName: 'Meridian',
      oneLiner: 'A deploy platform for teams that ship daily.',
      features: ['Auto deploys', 'Instant rollbacks', 'Build caching'],
      landingGoal: 'signup',
      offer: 'Free to start',
      primaryAudience: 'Staff engineers at fast-shipping startups',
      otherAudiences: [],
      categories: [],
    }, productAuth);
    expect(strategyRes.status, JSON.stringify(strategyRes.json)).toBe(200);
    expect(strategyRes.json.success).toBe(true);
    const strategy = strategyRes.json.data;
    expect(Array.isArray(strategy.sections)).toBe(true);
    expect(strategy.sections.length).toBeGreaterThanOrEqual(5);
    expect(strategy.uiblocks).toBeTruthy();

    const copyRes = await postJson(request, '/api/audience/product/generate-copy', {
      strategy, uiblocks: strategy.uiblocks, productName: 'Meridian',
      oneLiner: 'A deploy platform for teams that ship daily.', offer: 'Free to start',
      landingGoal: 'signup', features: ['Auto deploys', 'Instant rollbacks', 'Build caching'],
    }, productAuth);
    expect(copyRes.status, JSON.stringify(copyRes.json)).toBe(200);
    expect(copyRes.json.success).toBe(true);

    assertWellFormed(strategy.uiblocks, copyRes.json.sections);
  });
});

// NOTE (scale-06): kept as-is — this is the "product through the one engine"
// coverage the auth-less public project can run; the unified wizard's product
// adapter (runGeneration('thing')) calls exactly these two routes.

test.describe('service generation pipeline (HTTP, auth-gated)', () => {
  test.skip(!serviceAuth, 'service routes are Clerk-protected — set E2E_AUTH to a session bearer to run');

  test('strategy → copy produces well-formed sections', async ({ request }) => {
    const understanding = {
      serviceType: 'agency', serviceCategories: ['branding'], industries: ['dtc'],
      targetClients: 'DTC founders at $300k-$2M ARR',
      services: ['Brand identity', 'Packaging', 'Website refresh'], deliveryModel: 'remote',
    };
    const assets = {
      hasTestimonials: true, hasClientLogos: true, hasOutcomes: false,
      hasCaseStudies: true, hasTeamPhotos: false, hasFounderPhoto: true, testimonialType: 'text',
    };
    const base = {
      oneLiner: 'A six-week brand studio for DTC founders.', goal: 'book-call',
      offer: 'Fixed-price brand identity in six weeks',
    };

    const strategyRes = await postJson(request, '/api/audience/service/strategy', {
      ...base, understanding, assets, paletteId: 'terracotta',
    }, serviceAuth);
    expect(strategyRes.status, JSON.stringify(strategyRes.json)).toBe(200);
    const strategy = strategyRes.json.data;

    const copyRes = await postJson(request, '/api/audience/service/generate-copy', {
      strategy, uiblocks: strategy.uiblocks, oneLiner: base.oneLiner, offer: base.offer,
      goal: base.goal, understanding,
    }, serviceAuth);
    expect(copyRes.status, JSON.stringify(copyRes.json)).toBe(200);

    assertWellFormed(strategy.uiblocks, copyRes.json.sections);
  });
});

// ─── Unified wizard route + mid-wizard RELOAD/RESUME (net-new phase-3 capability)
//
// WRITTEN-ONLY / founder-run: `/onboarding/[token]` is Clerk-gated and this spec
// runs in the auth-less `public` Playwright project, so these steps self-skip
// unless E2E_WIZARD_UI=1 is set under an authenticated context (a session
// storageState + a seeded confirmed brief). They document the plan's Phase-11
// steps as executable specs; the resume LOGIC is already locked green in vitest
// (src/app/onboarding/[token]/loadDetection.test.ts — predicate + hydrate). When
// an authed wizard project exists, drop the guard and wire the seed helper.
test.describe('unified wizard route — product + service + mid-wizard reload', () => {
  test.skip(!WIZARD_UI, 'Clerk-gated /onboarding UI: needs an authed session + seeded brief (E2E_WIZARD_UI=1)');

  // Both engines land in the SAME wizard renderer; only the resolved
  // engine/template differ. `token` must already carry a DB-confirmed brief
  // (Project.brief + audienceType), i.e. post-/api/brief/confirm.
  for (const { engine, token } of [
    { engine: 'product', token: process.env.E2E_THING_TOKEN ?? 'e2e-thing' },
    { engine: 'service', token: process.env.E2E_TRUST_TOKEN ?? 'e2e-trust' },
  ]) {
    test(`${engine} brief renders the ONE wizard on /onboarding/[token]`, async ({ page }) => {
      await page.goto(`/onboarding/${token}`, { waitUntil: 'load' });
      // Load-detection resolves the confirmed brief ⇒ the unified WizardShell,
      // not the entry input. Slot chrome ("x / N" progress) proves the wizard.
      await expect(page.getByText(/\/\s*\d+/)).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('nextjs-portal')).toHaveCount(0);
    });
  }

  test('mid-wizard reload RESUMES (does not restart to the entry input)', async ({ page }) => {
    const token = process.env.E2E_THING_TOKEN ?? 'e2e-thing';
    await page.goto(`/onboarding/${token}`, { waitUntil: 'load' });
    // Advance at least one slot so a restart would be visibly wrong.
    const next = page.getByRole('button', { name: /next|continue/i });
    if (await next.isVisible().catch(() => false)) await next.click();

    // Reload — the net-new capability: the old in-memory entry flow restarted
    // here; load-detection must re-enter the wizard from the persisted brief.
    await page.reload({ waitUntil: 'load' });
    await expect(page.getByText(/\/\s*\d+/)).toBeVisible({ timeout: 15_000 });
    // The entry one-liner/URL input must NOT be shown (that would be a restart).
    await expect(page.getByPlaceholder(/one.?liner|website|url/i)).toHaveCount(0);
  });
});
