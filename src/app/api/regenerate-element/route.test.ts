// src/app/api/regenerate-element/route.test.ts
// ============================================================================
// Route gate/contract guards for the regen-modernization PILOT (plan phase 3).
//
// What is mocked: the module boundaries only — auth/credits, rate limit,
// security, prisma, and `@/lib/aiClient`. The phase-2 primitive
// (`scopedRegen.ts`: engine dispatch, narrowing, prompt build, validate/retry)
// runs FOR REAL, so this suite also pins the route→primitive wiring.
//
// TEST-INTEGRITY RULE (two non-discriminating tests already produced on this
// feature): every mock below is hand-written from the CONTRACT, never derived
// from the implementation's own output. The element-scope AI mock returns
// `{ variations: [...] }` because that is the shape `ElementVariationsSchema`
// declares — not because the code happens to produce it.
//
// `@/lib/aiClient` is mocked ⇒ `@/lib/openaiClient` (SDK instantiated at module
// load, throws without OPENAI_API_KEY) is never imported ⇒ suite runs keyless.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const requireAICredits = vi.hoisted(() => vi.fn());
const assertProjectOwner = vi.hoisted(() => vi.fn());
const consumeCredits = vi.hoisted(() => vi.fn());
const findUnique = vi.hoisted(() => vi.fn());
const generateRawJson = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware/planCheck', () => ({
  requireAICredits: (...args: unknown[]) => requireAICredits(...args),
}));
vi.mock('@/lib/creditSystem', () => ({
  consumeCredits: (...args: unknown[]) => consumeCredits(...args),
  CREDIT_COSTS: { ELEMENT_REGENERATION: 1 },
  UsageEventType: { ELEMENT_REGEN: 'element_regen' },
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
  assertProjectOwner: (...args: unknown[]) => assertProjectOwner(...args),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: { project: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));
vi.mock('@/lib/aiClient', () => ({
  generateRawJson,
  AiParseError: class AiParseError extends Error {},
}));

import { POST } from './route';

// ── Fixtures (hand-written from the real contracts) ─────────────────────────

const DEMO_TOKEN = 'lessgodemomockdata';
const REAL_TOKEN = 'tok_real_123';

const ONBOARDING = {
  oneLiner: 'A deploy platform for teams that ship daily.',
  validatedFields: {
    marketCategory: 'Developer Tools',
    targetAudience: 'Staff engineers at fast-shipping startups',
    keyProblem: 'Deploys need babysitting',
    landingPageGoals: 'signup',
    offer: 'Free 14-day trial',
  },
  hiddenInferredFields: { awarenessLevel: 'problem-aware-cold' },
  featuresFromAI: [{ feature: 'Auto deploys', benefit: 'Ship without babysitting' }],
};

// Meridian layouts — real element contracts. `headline` is a REQUIRED element of
// TerminalHero (`product/elementSchema.ts:83`), read from the contract by hand.
const SECTION_ID = 'hero-abc12345';
const ELEMENT_KEY = 'headline';

/** Persisted `project.content` exactly as `saveDraft` stores an export(): the
 *  body-only home slice lives under `content.finalContent`. */
const productProject = () => ({
  id: 'proj_1',
  audienceType: 'product',
  templateId: 'meridian',
  title: 'Shipyard',
  inputText: ONBOARDING.oneLiner,
  content: {
    onboarding: ONBOARDING,
    finalContent: {
      sections: [SECTION_ID, 'features-def67890'],
      sectionLayouts: { [SECTION_ID]: 'TerminalHero', 'features-def67890': 'HairlineFeatureGrid' },
    },
  },
  brief: { businessType: 'saas' },
});

/** Writer/granth — no copy engine exists (R5 → 422 on the real path). */
const writerProject = () => ({
  ...productProject(),
  audienceType: 'writer',
  templateId: 'granth',
});

/** The shape `ElementVariationsSchema` declares (`{ variations: string[] }`). */
const AI_VARIATIONS = {
  variations: [
    'Ship on Friday. Sleep on Saturday.',
    'Deploys that never need babysitting',
    'Push. Done. Go home.',
    'The deploy that watches itself',
    'Friday deploys, guilt-free',
  ],
};

function makeRequest(
  body: Record<string, unknown>,
  tokenId: string | null = REAL_TOKEN
): Request {
  const url = tokenId
    ? `http://localhost/api/regenerate-element?tokenId=${encodeURIComponent(tokenId)}`
    : 'http://localhost/api/regenerate-element';
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const BASE_BODY = {
  sectionId: SECTION_ID,
  elementKey: ELEMENT_KEY,
  currentContent: 'Ship on Friday. Sleep on Saturday.',
  variationCount: 5,
};

beforeEach(() => {
  vi.clearAllMocks();
  requireAICredits.mockResolvedValue({ allowed: true, userId: 'user_clerk_1' });
  assertProjectOwner.mockResolvedValue({ ok: true, isDemo: false });
  consumeCredits.mockResolvedValue({ success: true, remaining: 41 });
  findUnique.mockResolvedValue(productProject());
  generateRawJson.mockResolvedValue(AI_VARIATIONS);
  vi.stubEnv('NEXT_PUBLIC_USE_MOCK_GPT', 'false');
});

// ── Gates ───────────────────────────────────────────────────────────────────

describe('/api/regenerate-element — gates', () => {
  it('unauthenticated: the credit gate short-circuits before any read or AI call', async () => {
    requireAICredits.mockResolvedValue({
      allowed: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('insufficient credits: 402 before any AI call, no charge', async () => {
    requireAICredits.mockResolvedValue({
      allowed: false,
      userId: 'user_clerk_1',
      response: new Response(JSON.stringify({ error: 'insufficient_credits' }), { status: 402 }),
    });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(402);
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('non-owner: rejected BEFORE the project read, the AI call and any charge', async () => {
    assertProjectOwner.mockResolvedValue({ ok: false, status: 403, error: 'Access denied' });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(403);
    expect(findUnique).not.toHaveBeenCalled();
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('ownership is asserted with the CLERK id and this route action (no id-space crossover)', async () => {
    await POST(makeRequest(BASE_BODY) as never);
    expect(assertProjectOwner).toHaveBeenCalledWith('user_clerk_1', REAL_TOKEN, {
      action: 'regenerate-element',
    });
  });

  it('a missing tokenId query param is a 400, not a silent mock', async () => {
    const res = await POST(makeRequest(BASE_BODY, null) as never);
    expect(res.status).toBe(400);
    expect(generateRawJson).not.toHaveBeenCalled();
  });

  it('a malformed body is a 400 validation error', async () => {
    const res = await POST(makeRequest({ sectionId: SECTION_ID }) as never);
    expect(res.status).toBe(400);
    expect(generateRawJson).not.toHaveBeenCalled();
  });
});

// ── Sequence order (the regression this phase exists to pin) ────────────────

describe('/api/regenerate-element — canonical sequence order', () => {
  it('DEMO TOKEN → mock variations: no ownership call, NO project fetch, no 422/404, no charge', async () => {
    const res = await POST(makeRequest(BASE_BODY, DEMO_TOKEN) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.variations)).toBe(true);
    expect(json.variations).toHaveLength(5);
    expect(json.creditsUsed).toBe(0);
    expect(json.meta.mock).toBe(true);
    // The demo token has NO project row: dispatch-before-mock would 422 here.
    expect(findUnique).not.toHaveBeenCalled();
    expect(assertProjectOwner).not.toHaveBeenCalled();
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('env mock flag + a WRITER project → mock output via resolveMockEngine, never a 422', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_GPT', 'true');
    findUnique.mockResolvedValue(writerProject());

    const res = await POST(makeRequest(BASE_BODY) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.variations).toHaveLength(5);
    expect(json.creditsUsed).toBe(0);
    // Lenient dispatch: writer is unsupported on the real path but never 422s here.
    expect(json.meta.engine).toBe('product');
    expect(assertProjectOwner).not.toHaveBeenCalled();
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('non-mock + unknown token → 404, no AI call, no charge', async () => {
    findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(404);
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(consumeCredits).not.toHaveBeenCalled();
  });
});

// ── Engine dispatch (R5 / D1b) ──────────────────────────────────────────────

describe('/api/regenerate-element — engine dispatch', () => {
  it('writer project on the real path → 422 unsupported_project, no AI call, no charge', async () => {
    findUnique.mockResolvedValue(writerProject());

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe('unsupported_project');
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('ecommerce project on the real path → 422 unsupported_project', async () => {
    findUnique.mockResolvedValue({ ...productProject(), audienceType: 'ecommerce', templateId: null });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe('unsupported_project');
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('an unknown section → 422 invalid_scope with an honest message, no AI call, no charge', async () => {
    const res = await POST(
      makeRequest({ ...BASE_BODY, sectionId: 'quote-zzz99999' }) as never
    );

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe('invalid_scope');
    // The editor must be able to tell the user WHY (atelier's `quote` band etc.).
    expect(json.message).toMatch(/isn't AI-written/i);
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('an unknown element on a real section → 422 invalid_scope, no charge', async () => {
    const res = await POST(
      makeRequest({ ...BASE_BODY, elementKey: 'not_a_real_element' }) as never
    );

    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe('invalid_scope');
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(consumeCredits).not.toHaveBeenCalled();
  });
});

// ── Generation + charge-on-success ──────────────────────────────────────────

describe('/api/regenerate-element — generation', () => {
  it('success: returns the variations contract and charges ELEMENT_REGEN exactly once', async () => {
    const res = await POST(makeRequest(BASE_BODY) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    // Caller contract: the store reads `result.variations: string[]`.
    expect(json.variations).toEqual(AI_VARIATIONS.variations);
    expect(json.creditsUsed).toBe(1);
    expect(json.creditsRemaining).toBe(41);
    expect(json.meta.engine).toBe('product');

    expect(consumeCredits).toHaveBeenCalledTimes(1);
    expect(consumeCredits).toHaveBeenCalledWith(
      'user_clerk_1',
      'element_regen',
      1,
      expect.objectContaining({ endpoint: '/api/regenerate-element', sectionId: SECTION_ID })
    );
  });

  it('a product project generates on the modern copy endpoint (no hardcoded model strings)', async () => {
    await POST(makeRequest(BASE_BODY) as never);

    expect(generateRawJson).toHaveBeenCalledTimes(1);
    const [endpoint, prompt] = generateRawJson.mock.calls[0];
    expect(endpoint).toBe('copy');
    // The prompt is built server-side from the narrowed map + the current copy.
    expect(prompt).toContain(ELEMENT_KEY);
    expect(prompt).toContain(BASE_BODY.currentContent);
  });

  it('honours variationCount', async () => {
    generateRawJson.mockResolvedValue({ variations: ['a', 'b'] });

    const res = await POST(makeRequest({ ...BASE_BODY, variationCount: 2 }) as never);
    expect((await res.json()).variations).toEqual(['a', 'b']);
  });

  it('generation failure after retries → 500 generation_failed, NO charge, NO filler copy', async () => {
    generateRawJson.mockRejectedValue(new Error('No JSON found in response'));

    const res = await POST(makeRequest(BASE_BODY) as never);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('generation_failed');
    expect(json.recoverable).toBe(true);
    // The legacy route returned 200 + fabricated "… - Enhanced version" here.
    expect(json.variations).toBeUndefined();
    // MAX_RETRIES = 2 ⇒ 3 attempts.
    expect(generateRawJson).toHaveBeenCalledTimes(3);
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('a credit-consumption failure is warn-only — the user still gets the variations', async () => {
    consumeCredits.mockResolvedValue({ success: false, error: 'ledger down', remaining: 0 });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(200);
    expect((await res.json()).variations).toEqual(AI_VARIATIONS.variations);
  });
});
