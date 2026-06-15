import { test, expect, type APIRequestContext } from '@playwright/test';

// Generation HTTP smoke — exercises the real strategy + copy routes through the
// dev server (middleware, rate-limit, parse pipeline), which the vitest
// generation-contract test can't reach (it calls the modules directly).
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
