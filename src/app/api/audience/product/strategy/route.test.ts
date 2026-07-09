// src/app/api/audience/product/strategy/route.test.ts
// scale-07 phase 5 — carryover (a): the strategy ROUTE forwards the resolved
// Brief + explicit required capabilities into assembleProductStrategy, so a
// RUNTIME meridian strategy call regains its Brief-gated capability sections
// (M1 goal ⇒ lead-form ⇒ cta; packages ⇒ pricing). Phase 4 plumbed + tested
// the selector/assembler side; this pins the route's last mile.
//
// Auth / credits / rate-limit / AI client are mocked at the module boundary —
// the route handler itself (validation → detection → assembly) runs for real.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/middleware/planCheck', () => ({
  requireAuth: vi.fn(async () => ({ allowed: true, userId: 'user_test' })),
}));
vi.mock('@/lib/creditSystem', () => ({
  consumeCredits: vi.fn(async () => ({ success: true, remaining: 42 })),
  CREDIT_COSTS: { STRATEGY_GENERATION: 2 },
  UsageEventType: { STRATEGY_GENERATION: 'STRATEGY_GENERATION' },
}));
vi.mock('@/lib/rateLimit', () => ({
  withAIRateLimit: (handler: (req: unknown) => Promise<Response>) => handler,
}));
vi.mock('@/lib/security', () => ({
  createSecureResponse: (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
}));
vi.mock('@/lib/aiClient', () => ({
  generateWithSchema: vi.fn(async () => ({
    awareness: 'solution-aware-skeptical',
    oneReader: { personaDescription: 'p', pain: ['a'], desire: ['b'], objections: ['c'] },
    oneIdea: { bigBenefit: 'x', uniqueMechanism: 'y', reasonToBelieve: 'z' },
    featureAnalysis: [{ feature: 'f', benefit: 'b', benefitOfBenefit: 'bb' }],
  })),
}));

import { POST } from './route';

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/audience/product/strategy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const BASE_BODY = {
  productName: 'Acme Deploy',
  oneLiner: 'Ship your app without babysitting the pipeline.',
  features: ['Auto deploys', 'Instant rollbacks'],
  landingGoal: 'enquiry',
  offer: 'Start free',
  primaryAudience: 'staff engineers',
  templateId: 'meridian',
};

beforeEach(() => {
  // Real handler path — never the mock branch.
  vi.stubEnv('NEXT_PUBLIC_USE_MOCK_GPT', 'false');
});

describe('/api/audience/product/strategy — carryover (a): brief + requiredCapabilities reach assembly', () => {
  it('runtime meridian with an M1 Brief + packages capability yields cta AND pricing', async () => {
    const res = await POST(
      makeRequest({
        ...BASE_BODY,
        brief: { goal: { intent: 'enquiry', mechanism: 'M1' } },
        requiredCapabilities: ['packages'],
      }) as never
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    // M1 ⇒ lead-form ⇒ meridian's cta; packages ⇒ meridian's pricing.
    expect(json.data.sections).toContain('cta');
    expect(json.data.sections).toContain('pricing');
    // Single-page list, engine core intact, real uiblock mappings.
    expect(json.data.sections[0]).toBe('header');
    expect(json.data.sections).toContain('hero');
    expect(json.data.sitemap).toBeUndefined();
    expect(json.data.uiblocks.cta).toBeTruthy();
    expect(json.data.uiblocks.pricing).toBeTruthy();
  });

  it('no brief (old sender) stays the bare engine core — byte-identical behavior', async () => {
    const res = await POST(makeRequest(BASE_BODY) as never);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.sections).toEqual(['header', 'hero', 'features', 'testimonials', 'footer']);
  });

  it('a malformed brief is a validation error, not a silent drop', async () => {
    const res = await POST(
      makeRequest({ ...BASE_BODY, brief: { goal: { intent: 'not-a-real-intent', mechanism: 'M1' } } }) as never
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('validation_error');
  });
});
