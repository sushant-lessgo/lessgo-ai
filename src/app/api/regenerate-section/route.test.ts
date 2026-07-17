// src/app/api/regenerate-section/route.test.ts
// ============================================================================
// Route gate/contract guards for the section-regen ENGINE SWAP (plan phase 4).
//
// Mocked: module boundaries ONLY — auth/credits, rate limit, security, prisma,
// the testimonials repo, and `@/lib/aiClient`. The phase-2 primitive
// (`scopedRegen.ts`: engine dispatch, engine-aware narrowing, prompt build,
// contract validation, retry loop) runs FOR REAL, so this suite pins the
// route→primitive wiring rather than a fake of it.
//
// TEST-INTEGRITY RULE (this feature already produced two non-discriminating
// tests): every AI mock below is hand-written from the CONTRACT the REAL prompt
// asks for — for atelier that is `workElementContract`'s vocabulary
// (`about` = heading/bio), NOT the layout schema's (headline/body), and NOT
// whatever the implementation happens to emit.
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
const listTestimonialsByOwner = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware/planCheck', () => ({
  requireAICredits: (...args: unknown[]) => requireAICredits(...args),
}));
vi.mock('@/lib/creditSystem', () => ({
  consumeCredits: (...args: unknown[]) => consumeCredits(...args),
  CREDIT_COSTS: { SECTION_REGENERATION: 2 },
  UsageEventType: { SECTION_REGEN: 'section_regen' },
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
vi.mock('@/lib/testimonials/repo', () => ({
  listTestimonialsByOwner: (...args: unknown[]) => listTestimonialsByOwner(...args),
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

// Meridian TerminalHero — `headline` is a REQUIRED element
// (`product/elementSchema.ts`), read from the contract by hand.
const SECTION_ID = 'hero-abc12345';
const LAYOUT = 'TerminalHero';

const productProject = () => ({
  id: 'proj_1',
  audienceType: 'product',
  templateId: 'meridian',
  title: 'Shipyard',
  inputText: ONBOARDING.oneLiner,
  content: { onboarding: ONBOARDING },
  brief: { businessType: 'saas' },
});

/** Writer/granth — no copy engine exists (R5 → 422 on the real path). */
const writerProject = () => ({
  ...productProject(),
  audienceType: 'writer',
  templateId: 'granth',
});

/** The trap: work ENGINE, service AUDIENCE (D1b). */
const atelierProject = () => ({
  id: 'proj_atelier',
  audienceType: 'service',
  templateId: 'atelier',
  title: 'Kundius',
  inputText: 'Portrait photography.',
  content: { onboarding: { ...ONBOARDING } },
  brief: {
    businessType: 'photographer',
    facts: {
      work: {
        identity: { name: 'Kundius' },
        establishment: 'established',
        languages: ['en'],
        contactMethod: 'form',
        groups: [{ name: 'Portraits', kind: 'category', price: { mode: 'from', amount: 400 } }],
      },
    },
  },
});

/**
 * The vocabulary the REAL work prompt asks for: `workElementContract.about` =
 * heading [required] + bio [required]. Hand-written from the contract — the
 * layout vocabulary (headline/body) would be REJECTED, which is the point.
 */
const WORK_ABOUT_RESPONSE = {
  heading: 'Portraits made with patience',
  bio: 'Fifteen years behind the camera, most of them spent waiting for the one honest second in a sitting.',
};

/**
 * Product hero response in the vocabulary the REAL product prompt asks for —
 * TerminalHero's REQUIRED elements are `headline` / `lede` / `cta_text`
 * (`product/elementSchema.ts:82-84`), read from the contract by hand.
 */
const PRODUCT_HERO_RESPONSE = {
  hero: {
    elements: {
      headline: 'Ship on Friday. Sleep on Saturday.',
      lede: 'Deploys that never need babysitting.',
      cta_text: 'Start free',
    },
  },
};

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/regenerate-section', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const BASE_BODY = {
  sectionId: SECTION_ID,
  tokenId: REAL_TOKEN,
  currentContent: { headline: 'Old headline', subheadline: 'Old sub' },
  sectionType: 'hero',
  layout: LAYOUT,
};

beforeEach(() => {
  vi.clearAllMocks();
  requireAICredits.mockResolvedValue({ allowed: true, userId: 'user_clerk_1' });
  assertProjectOwner.mockResolvedValue({ ok: true, isDemo: false });
  consumeCredits.mockResolvedValue({ success: true, remaining: 40 });
  findUnique.mockResolvedValue(productProject());
  generateRawJson.mockResolvedValue(PRODUCT_HERO_RESPONSE);
  listTestimonialsByOwner.mockResolvedValue([]);
  vi.stubEnv('NEXT_PUBLIC_USE_MOCK_GPT', 'false');
});

// ── Gates ───────────────────────────────────────────────────────────────────

describe('/api/regenerate-section — gates', () => {
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
      action: 'regenerate-section',
    });
  });

  it('a missing tokenId is a 400, not a silent mock', async () => {
    const res = await POST(makeRequest({ ...BASE_BODY, tokenId: undefined }) as never);
    expect(res.status).toBe(400);
    expect(generateRawJson).not.toHaveBeenCalled();
  });
});

// ── Sequence order (the D2 regression this phase must not break) ────────────

describe('/api/regenerate-section — canonical sequence order', () => {
  it('DEMO TOKEN → mock content: no ownership call, NO project fetch, no 422/404, no charge', async () => {
    const res = await POST(makeRequest({ ...BASE_BODY, tokenId: DEMO_TOKEN }) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.content.headline).toBeTruthy();
    expect(json.creditsUsed).toBe(0);
    expect(json.isMock).toBe(true);
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
    expect(json.creditsUsed).toBe(0);
    expect(json.meta.engine).toBe('product'); // lenient dispatch, never throws
    expect(assertProjectOwner).not.toHaveBeenCalled();
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('non-mock + unknown token → 404, no AI call, no charge (legacy proceeded context-free)', async () => {
    findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(404);
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(consumeCredits).not.toHaveBeenCalled();
  });
});

// ── Engine dispatch (R5 / D1b) ──────────────────────────────────────────────

describe('/api/regenerate-section — engine dispatch', () => {
  it('writer project on the real path → 422 unsupported_project, no AI call, no charge', async () => {
    findUnique.mockResolvedValue(writerProject());

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe('unsupported_project');
    expect(json.message).toMatch(/isn't available/i);
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('ecommerce project on the real path → 422 unsupported_project, no charge', async () => {
    findUnique.mockResolvedValue({
      ...productProject(),
      audienceType: 'ecommerce',
      templateId: null,
    });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe('unsupported_project');
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('an ATELIER project dispatches the WORK engine (not service) on the work-copy endpoint', async () => {
    findUnique.mockResolvedValue(atelierProject());
    generateRawJson.mockResolvedValue({ about: { elements: WORK_ABOUT_RESPONSE } });

    const res = await POST(
      makeRequest({
        ...BASE_BODY,
        sectionId: 'about',
        sectionType: 'about',
        layout: 'AtelierAbout',
        currentContent: { heading: 'Old heading', bio: 'Old bio' },
      }) as never
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.meta.engine).toBe('work');
    // The work engine's contract-shaped response passes in ONE call (phase-2 probe).
    expect(generateRawJson).toHaveBeenCalledTimes(1);
    expect(generateRawJson.mock.calls[0][0]).toBe('work-copy');
    expect(json.content.bio).toBe(WORK_ABOUT_RESPONSE.bio);
    expect(consumeCredits).toHaveBeenCalledTimes(1);
  });
});

// ── The atelier `quote` band — honest disabled reason, never a silent drop ──

describe('/api/regenerate-section — atelier `quote` band (R6.3)', () => {
  it('a section with no work copy contract → 422 invalid_scope with a USER-RENDERABLE reason, no AI call, no charge', async () => {
    findUnique.mockResolvedValue(atelierProject());

    const res = await POST(
      makeRequest({
        ...BASE_BODY,
        sectionId: 'quote',
        sectionType: 'quote',
        layout: 'AtelierQuote',
        currentContent: { quote: 'A line the seller wrote by hand.' },
      }) as never
    );

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe('invalid_scope');
    // Honest + renderable: the user must learn WHY, not see `API error: 422`.
    expect(json.message).toMatch(/isn't AI-written/i);
    expect(json.message).toMatch(/quote/i);
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('an unknown product section (no layout) → 422 invalid_scope, no charge', async () => {
    const res = await POST(
      makeRequest({ ...BASE_BODY, sectionId: 'nonsense-zzz99999', layout: undefined }) as never
    );

    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe('invalid_scope');
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(consumeCredits).not.toHaveBeenCalled();
  });
});

// ── Generation + charge-on-success + caller contract ────────────────────────

describe('/api/regenerate-section — generation', () => {
  it('success: returns the `content` record contract and charges SECTION_REGEN exactly once', async () => {
    const res = await POST(makeRequest(BASE_BODY) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    // Caller D contract (`aiActions.ts:98`): `data.content` is a record the
    // store's shape-preserving merge loop walks.
    expect(json.content.headline).toBe(PRODUCT_HERO_RESPONSE.hero.elements.headline);
    expect(json.sectionId).toBe(SECTION_ID);
    expect(json.regenerationType).toBe('section');
    expect(json.creditsUsed).toBe(2);
    expect(json.creditsRemaining).toBe(40);
    expect(json.meta.engine).toBe('product');

    expect(consumeCredits).toHaveBeenCalledTimes(1);
    expect(consumeCredits).toHaveBeenCalledWith(
      'user_clerk_1',
      'section_regen',
      2,
      expect.objectContaining({ endpoint: '/api/regenerate-section', sectionId: SECTION_ID })
    );
  });

  it('the caller merge loop accepts a mixed string / { content, type } record', async () => {
    generateRawJson.mockResolvedValue({
      hero: {
        elements: {
          headline: 'A plain string slot',
          lede: 'Another string',
          cta_text: 'Go',
          stats: [{ value: '99.9%', label: 'uptime' }],
        },
      },
    });

    const res = await POST(makeRequest(BASE_BODY) as never);
    const json = await res.json();
    for (const value of Object.values(json.content)) {
      const ok =
        typeof value === 'string' ||
        Array.isArray(value) ||
        (value !== null && typeof value === 'object' && 'content' in (value as object));
      expect(ok).toBe(true);
    }
  });

  it('generates on the modern copy endpoint; the prompt is built server-side from guidance + current copy', async () => {
    await POST(makeRequest({ ...BASE_BODY, userGuidance: 'make it punchier' }) as never);

    expect(generateRawJson).toHaveBeenCalledTimes(1);
    const [endpoint, prompt] = generateRawJson.mock.calls[0];
    expect(endpoint).toBe('copy');
    expect(prompt).toContain('make it punchier');
    expect(prompt).toContain('Old headline');
    // No hardcoded legacy model strings survive the swap.
    expect(prompt).not.toContain('gpt-3.5-turbo');
  });

  it('a response missing a REQUIRED element is rejected and retried — no filler copy', async () => {
    // `headline` is required on TerminalHero; an empty one must never ship.
    generateRawJson.mockResolvedValue({
      hero: { elements: { headline: '', lede: 'x', cta_text: 'Go' } },
    });

    const res = await POST(makeRequest(BASE_BODY) as never);

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('generation_failed');
    expect(generateRawJson).toHaveBeenCalledTimes(3); // MAX_RETRIES = 2
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('generation failure after retries → 500 generation_failed, NO charge, NO mock filler', async () => {
    generateRawJson.mockRejectedValue(new Error('No JSON found in response'));

    const res = await POST(makeRequest(BASE_BODY) as never);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('generation_failed');
    expect(json.recoverable).toBe(true);
    // The legacy route answered this with 200 + "Transform Your Business…" mock.
    expect(json.content).toBeUndefined();
    expect(consumeCredits).not.toHaveBeenCalled();
  });

  it('a credit-consumption failure is warn-only — the user still gets the copy', async () => {
    consumeCredits.mockResolvedValue({ success: false, error: 'ledger down', remaining: 0 });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(200);
    expect((await res.json()).content.headline).toBe(PRODUCT_HERO_RESPONSE.hero.elements.headline);
  });
});
