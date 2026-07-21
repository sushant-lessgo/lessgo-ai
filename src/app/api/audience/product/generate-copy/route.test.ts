// src/app/api/audience/product/generate-copy/route.test.ts
// billing-correctness phase 3 (M1) — GENERATE-COPY FAMILY representative.
//
// The service/generate-copy + work/generate-copy routes receive the IDENTICAL
// mechanical edit (credit pre-gate immediately after the mock/demo
// short-circuit, two-way post-consume split) and are covered by diff-reading
// against this twin — that substitution is the deliberate coverage level
// (plan phase 3 step 5).
//
// Auth / credits / rate-limit / security / AI client are mocked at the module
// boundary; the handler (validation → prompt → parse → charge) runs for real.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/middleware/planCheck', () => ({
  requireAuth: vi.fn(async () => ({ allowed: true, userId: 'user_test' })),
}));
vi.mock('@/lib/creditSystem', () => ({
  checkCredits: vi.fn(async () => ({ allowed: true, remaining: 42, required: 3 })),
  consumeCredits: vi.fn(async () => ({ success: true, remaining: 39 })),
  logUsageEvent: vi.fn(async () => undefined),
  CREDIT_COSTS: { GENERATE_COPY: 3 },
  UsageEventType: { GENERATE_COPY: 'GENERATE_COPY' },
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
vi.mock('@/lib/aiClient', () => ({ generateRawJson: vi.fn() }));

import { POST } from './route';
import { checkCredits, consumeCredits, logUsageEvent } from '@/lib/creditSystem';
import { generateRawJson } from '@/lib/aiClient';

const checkCreditsMock = checkCredits as unknown as ReturnType<typeof vi.fn>;
const consumeCreditsMock = consumeCredits as unknown as ReturnType<typeof vi.fn>;
const logUsageEventMock = logUsageEvent as unknown as ReturnType<typeof vi.fn>;
const aiMock = generateRawJson as unknown as ReturnType<typeof vi.fn>;

const STRATEGY = {
  awareness: 'solution-aware-skeptical',
  oneReader: { personaDescription: 'p', pain: ['a'], desire: ['b'], objections: ['c'] },
  oneIdea: { bigBenefit: 'x', uniqueMechanism: 'y', reasonToBelieve: 'z' },
  featureAnalysis: [{ feature: 'f', benefit: 'b', benefitOfBenefit: 'bb' }],
  sections: ['hero'],
  uiblocks: { hero: 'hero' },
};

const BASE_BODY = {
  strategy: STRATEGY,
  uiblocks: { hero: 'hero' },
  productName: 'Acme Deploy',
  oneLiner: 'Ship your app without babysitting the pipeline.',
  offer: 'Start free',
  landingGoal: 'enquiry',
  features: ['Auto deploys'],
};

const AI_COPY = {
  hero: { elements: { headline: 'Ship it', subheadline: 'Without the babysitting' } },
};

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/audience/product/generate-copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  // Real handler path — never the mock branch.
  vi.stubEnv('NEXT_PUBLIC_USE_MOCK_GPT', 'false');
  vi.clearAllMocks();
  checkCreditsMock.mockResolvedValue({ allowed: true, remaining: 42, required: 3 });
  consumeCreditsMock.mockResolvedValue({ success: true, remaining: 39 });
  logUsageEventMock.mockResolvedValue(undefined);
  aiMock.mockResolvedValue(AI_COPY);
});

describe('/api/audience/product/generate-copy — charging model', () => {
  it('(a) pre-gate: no credits ⇒ 402 BEFORE any AI call, and the attempt is ledgered', async () => {
    checkCreditsMock.mockResolvedValue({ allowed: false, remaining: 1, required: 3 });

    const res = await POST(makeRequest(BASE_BODY) as never);

    expect(res.status).toBe(402);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('insufficient_credits');
    expect(json.creditsRequired).toBe(3);
    expect(json.creditsRemaining).toBe(1);
    // No AI work was done, and nothing was charged.
    expect(aiMock).not.toHaveBeenCalled();
    expect(consumeCreditsMock).not.toHaveBeenCalled();
    // The 0-credit attempt still lands in the ledger.
    expect(logUsageEventMock).toHaveBeenCalledTimes(1);
    expect(logUsageEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, creditsUsed: 0, userId: 'user_test' })
    );
  });

  it('(b) post-AI genuine insufficiency ⇒ 402 and the copy is DISCARDED (no free output)', async () => {
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
    // The generated copy must NOT be handed over.
    expect(json.sections).toBeUndefined();
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
    expect(json.sections).toBeUndefined();
    // The client rails route ANY error matching /credit/i to the buy-credits
    // wall. A solvent user who merely lost a write race must never land there.
    expect(JSON.stringify(json)).not.toMatch(/credit/i);
  });

  it('(d) happy path is unchanged — success + creditsRemaining surfaced', async () => {
    const res = await POST(makeRequest(BASE_BODY) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.sections.hero).toBeTruthy();
    expect(json.creditsUsed).toBe(3);
    expect(json.creditsRemaining).toBe(39);
    expect(checkCreditsMock).toHaveBeenCalledWith('user_test', 3);
  });
});

// ── language-settings phase 4: the BOUND path (ruling 11) ───────────────────
// NOT "a mocked object yields Dutch": the request BODY goes in one end and the
// assertion reads the prompt string that actually reached the (mocked) AI
// client. That is the only shape of test that can fail if the route stops
// threading the field, or starts trusting it raw.
//
// `generateRawJson(endpoint, prompt, schema)` — arg 1 is the assembled prompt.
const promptSentToAI = () => String(aiMock.mock.calls[0][1]);

describe('/api/audience/product/generate-copy — output language', () => {
  it('body language:"nl" ⇒ the prompt handed to the AI carries the DUTCH directive', async () => {
    const res = await POST(makeRequest({ ...BASE_BODY, language: 'nl' }) as never);

    expect(res.status).toBe(200);
    const prompt = promptSentToAI();
    expect(prompt).toContain('## OUTPUT LANGUAGE — Dutch (READ FIRST)');
    expect(prompt).toContain('**Write EVERY string in Dutch.**');
    // The exonym, never the native endonym, and never the bare code as a name.
    expect(prompt).not.toContain('Nederlands');
    expect(prompt).not.toContain('OUTPUT LANGUAGE — nl');
  });

  it('NO language field ⇒ the English directive is still emitted (ruling 2)', async () => {
    await POST(makeRequest(BASE_BODY) as never);
    expect(promptSentToAI()).toContain('## OUTPUT LANGUAGE — English (READ FIRST)');
  });

  it('garbage language ⇒ English fallback, and the raw string reaches NO prompt', async () => {
    for (const bad of ['xx', '; DROP TABLE projects; --', 'nl-NL', 'Nederlands']) {
      aiMock.mockClear();
      const res = await POST(makeRequest({ ...BASE_BODY, language: bad }) as never);
      // Never a 400 — language is a prompt input, not an authz input.
      expect(res.status, `${bad} must not 400`).toBe(200);
      const prompt = promptSentToAI();
      expect(prompt).toContain('## OUTPUT LANGUAGE — English (READ FIRST)');
      expect(prompt, `raw "${bad}" leaked into the prompt`).not.toContain(bad);
    }
  });

  it('a non-string language is tolerated (never a 400) and falls back to English', async () => {
    for (const bad of [42, null, { defaultLocale: 'nl' }, ['nl']]) {
      aiMock.mockClear();
      const res = await POST(makeRequest({ ...BASE_BODY, language: bad as never }) as never);
      // The schema types this field `z.unknown()` on purpose: language is a
      // prompt input, so no shape of value may fail a paid generation run.
      expect(res.status, `${JSON.stringify(bad)} must not 400`).toBe(200);
      expect(promptSentToAI()).toContain('## OUTPUT LANGUAGE — English (READ FIRST)');
    }
  });
});
