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
  checkCredits: vi.fn(async () => ({ allowed: true, remaining: 42, required: 2 })),
  consumeCredits: vi.fn(async () => ({ success: true, remaining: 42 })),
  logUsageEvent: vi.fn(async () => undefined),
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
import { checkCredits, consumeCredits, logUsageEvent } from '@/lib/creditSystem';
import { generateWithSchema } from '@/lib/aiClient';

const checkCreditsMock = checkCredits as unknown as ReturnType<typeof vi.fn>;
const consumeCreditsMock = consumeCredits as unknown as ReturnType<typeof vi.fn>;
const logUsageEventMock = logUsageEvent as unknown as ReturnType<typeof vi.fn>;
const aiMock = generateWithSchema as unknown as ReturnType<typeof vi.fn>;

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
  vi.clearAllMocks();
  checkCreditsMock.mockResolvedValue({ allowed: true, remaining: 42, required: 2 });
  consumeCreditsMock.mockResolvedValue({ success: true, remaining: 42 });
  logUsageEventMock.mockResolvedValue(undefined);
  aiMock.mockResolvedValue({
    awareness: 'solution-aware-skeptical',
    oneReader: { personaDescription: 'p', pain: ['a'], desire: ['b'], objections: ['c'] },
    oneIdea: { bigBenefit: 'x', uniqueMechanism: 'y', reasonToBelieve: 'z' },
    featureAnalysis: [{ feature: 'f', benefit: 'b', benefitOfBenefit: 'bb' }],
  });
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

// ── billing-correctness phase 3 (M1): one charging model ────────────────────
// STRATEGY FAMILY representative. The service/strategy + work/strategy routes
// receive the IDENTICAL mechanical edit (pre-gate after the mock short-circuit,
// two-way post-consume split) and are covered by diff-reading against this twin
// — that substitution is the deliberate coverage level (plan phase 3 step 5).
describe('/api/audience/product/strategy — charging model', () => {
  it('(a) pre-gate: no credits ⇒ 402 BEFORE any AI call, and the attempt is ledgered', async () => {
    checkCreditsMock.mockResolvedValue({ allowed: false, remaining: 0, required: 2 });

    const res = await POST(makeRequest(BASE_BODY) as never);

    expect(res.status).toBe(402);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('insufficient_credits');
    expect(json.creditsRequired).toBe(2);
    expect(json.creditsRemaining).toBe(0);
    // No AI work was done, and nothing was charged.
    expect(aiMock).not.toHaveBeenCalled();
    expect(consumeCreditsMock).not.toHaveBeenCalled();
    // The 0-credit attempt still lands in the ledger (preserves the row
    // consumeCredits used to write before the pre-gate existed).
    expect(logUsageEventMock).toHaveBeenCalledTimes(1);
    expect(logUsageEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, creditsUsed: 0, userId: 'user_test' })
    );
  });

  it('(b) post-AI genuine insufficiency ⇒ 402 and the strategy is DISCARDED (no free output)', async () => {
    consumeCreditsMock.mockResolvedValue({
      success: false,
      remaining: 0,
      error: 'Insufficient credits',
    });

    const res = await POST(makeRequest(BASE_BODY) as never);

    expect(res.status).toBe(402);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('insufficient_credits');
    // The generated strategy must NOT be handed over.
    expect(json.data).toBeUndefined();
  });

  it('(c) charge_conflict ⇒ recoverable 500 charge_failed with NO "credit" anywhere (client-rail guard)', async () => {
    consumeCreditsMock.mockResolvedValue({
      success: false,
      remaining: 7,
      error: 'charge_conflict',
    });

    const res = await POST(makeRequest(BASE_BODY) as never);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('charge_failed');
    expect(json.data).toBeUndefined();
    // The client rails (work.llm.ts / trust.ts / thing.ts) route ANY error
    // matching /credit/i to the buy-credits wall. A solvent user who merely lost
    // a write race must never land there.
    expect(JSON.stringify(json)).not.toMatch(/credit/i);
  });

  it('(d) happy path is unchanged — success + creditsRemaining surfaced', async () => {
    const res = await POST(makeRequest(BASE_BODY) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.sections).toBeTruthy();
    expect(json.creditsUsed).toBe(2);
    expect(json.creditsRemaining).toBe(42);
    expect(checkCreditsMock).toHaveBeenCalledWith('user_test', 2);
  });
});

// ── language-settings phase 4: the BOUND path (ruling 11) ───────────────────
// The request BODY goes in; the assertion reads the prompt string that actually
// reached the (mocked) AI client. `generateWithSchema(endpoint, messages, …)` —
// arg 1 is `[{ role: 'user', content: prompt }]`.
const promptSentToAI = () => String((aiMock.mock.calls[0][1] as any[])[0].content);

describe('/api/audience/product/strategy — output language', () => {
  it('body language:"nl" ⇒ the strategy prompt carries the Dutch hedge', async () => {
    const res = await POST(makeRequest({ ...BASE_BODY, language: 'nl' }) as never);

    expect(res.status).toBe(200);
    const prompt = promptSentToAI();
    expect(prompt).toContain('Write every string in Dutch.');
    expect(prompt).toContain('render its MEANING in Dutch');
    expect(prompt).not.toContain('Nederlands');
  });

  it('NO language field ⇒ the English hedge is still emitted (ruling 2)', async () => {
    await POST(makeRequest(BASE_BODY) as never);
    expect(promptSentToAI()).toContain('Write every string in English.');
  });

  it('garbage ⇒ English fallback, and the raw string reaches NO prompt', async () => {
    for (const bad of ['xx', '; DROP TABLE projects; --', 'nl-NL', 42 as never]) {
      aiMock.mockClear();
      const res = await POST(makeRequest({ ...BASE_BODY, language: bad }) as never);
      // Never a 400 — language is a prompt input, not an authz input.
      expect(res.status, `${String(bad)} must not 400`).toBe(200);
      const prompt = promptSentToAI();
      expect(prompt).toContain('Write every string in English.');
      if (typeof bad === 'string') {
        expect(prompt, `raw "${bad}" leaked into the prompt`).not.toContain(bad);
      }
    }
  });
});
