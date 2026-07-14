// src/app/api/audience/work/regenerate-story/route.test.ts
// Route unit tests for the work story-interview (Sugarman) regen (plan phase 6).
//
// Auth/credits/rate-limit/security/AI-client are mocked at the module boundary;
// the handler (validation → prompt → parse → contract validation → return) and
// the phase-3 work parser + contract run for REAL. Also pins the generator-
// parity guarantee: BOTH story paths validate against the IDENTICAL
// workElementContract.about element keys (single source of truth).

import { describe, it, expect, vi, beforeEach } from 'vitest';

const requireAICredits = vi.fn(async () => ({ allowed: true, userId: 'user_test' }));
const assertProjectOwner = vi.fn(async () => ({ ok: true }));
const generateRawJson = vi.fn();

vi.mock('@/lib/middleware/planCheck', () => ({
  requireAICredits: (...args: unknown[]) => requireAICredits(...(args as [])),
}));
vi.mock('@/lib/creditSystem', () => ({
  consumeCredits: vi.fn(async () => ({ success: true, remaining: 40 })),
  CREDIT_COSTS: { SECTION_REGENERATION: 2 },
  UsageEventType: { SECTION_REGEN: 'SECTION_REGEN' },
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
  assertProjectOwner: (...args: unknown[]) => assertProjectOwner(...(args as [])),
}));
vi.mock('@/lib/aiClient', () => ({
  generateRawJson: (...args: unknown[]) => generateRawJson(...(args as [])),
}));

import { POST } from './route';
import { kundiusBrief } from '@/modules/audience/work/__tests__/fixtures/kundiusBrief';
import { resolveWorkSchema } from '@/modules/audience/work/parseCopy';
import { aboutRequiredKeys } from '@/modules/audience/work/storyInterview';
import { workElementContract } from '@/modules/engines/workSections';

const GOOD_ABOUT = {
  about: {
    elements: {
      heading: 'The one nobody posed for',
      bio: 'It began with weddings for friends who could not afford a studio, and it has never stopped being about the frame no one asked me to take.',
    },
  },
};

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/audience/work/regenerate-story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const BASE_BODY = {
  tokenId: 'tok_123',
  sectionId: 'about-abc12345',
  interviewAnswers: {
    origin: 'I started shooting weddings for friends.',
    moment: 'A groom cried at the one candid frame of his late father.',
    belief: 'The photo you keep is the one nobody posed for.',
  },
  brief: kundiusBrief,
};

beforeEach(() => {
  vi.clearAllMocks();
  requireAICredits.mockResolvedValue({ allowed: true, userId: 'user_test' });
  assertProjectOwner.mockResolvedValue({ ok: true });
  generateRawJson.mockResolvedValue(GOOD_ABOUT);
  vi.stubEnv('NEXT_PUBLIC_USE_MOCK_GPT', 'false');
});

describe('/api/audience/work/regenerate-story', () => {
  it('happy path returns validated about content (client applies; route does not persist)', async () => {
    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.regenerationType).toBe('story');
    expect(typeof json.content.heading).toBe('string');
    expect(json.content.heading.length).toBeGreaterThan(0);
    expect(typeof json.content.bio).toBe('string');
    // Only the about section came back — no proof/testimonials touched.
    expect(json.content).not.toHaveProperty('quotes');
    expect(generateRawJson).toHaveBeenCalledWith('work-copy', expect.any(String), expect.anything());
  });

  it('credits gate: a blocked credit check short-circuits before generation', async () => {
    const blocked = new Response(JSON.stringify({ error: 'insufficient_credits' }), { status: 402 });
    requireAICredits.mockResolvedValue({ allowed: false, response: blocked });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(402);
    expect(generateRawJson).not.toHaveBeenCalled();
  });

  it('owner guard: a non-owner is rejected before generation', async () => {
    assertProjectOwner.mockResolvedValue({ ok: false, status: 403, error: 'Forbidden' });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(403);
    expect(generateRawJson).not.toHaveBeenCalled();
  });

  it('contract validation REJECTS a malformed/short shape (no bio → retries exhausted → 500)', async () => {
    generateRawJson.mockResolvedValue({ about: { elements: { heading: 'x' } } });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('generation_failed');
    // Server-side retry attempted (MAX_RETRIES=2 → 3 tries).
    expect(generateRawJson).toHaveBeenCalledTimes(3);
  });

  it('a missing brief.facts.work is a 400 validation error', async () => {
    const res = await POST(
      makeRequest({ ...BASE_BODY, brief: { businessType: 'photographer', facts: {} } }) as never
    );
    expect(res.status).toBe(400);
  });

  it('a malformed body is a 400 validation error, not a silent drop', async () => {
    const res = await POST(makeRequest({ tokenId: 'tok_123' }) as never);
    expect(res.status).toBe(400);
  });
});

// ── GENERATOR PARITY (plan step 3) ──────────────────────────────────────────
// The phase-3 generate-copy path (parseWorkCopy → resolveWorkSchema) and THIS
// regen route (validateStoryAbout → aboutRequiredKeys) must validate the story
// against the IDENTICAL contract. Both read workElementContract.about — the
// single source of truth. This test fails if EITHER path drifts to its own keys.
describe('generator parity — single source of truth = workElementContract.about', () => {
  it('the phase-3 copy path resolves the SAME contract object this route validates against', () => {
    expect(resolveWorkSchema('about')).toBe(workElementContract.about);
  });

  it('the regen route required-keys are drawn from the SAME contract element set', () => {
    const contractKeys = Object.keys(workElementContract.about.elements);
    // Phase-3 path sees the full element set of the SAME contract.
    expect(Object.keys(resolveWorkSchema('about')!.elements)).toEqual(contractKeys);
    // Regen path required keys are a subset of that identical set (no drift).
    expect(aboutRequiredKeys().length).toBeGreaterThan(0);
    expect(aboutRequiredKeys().every((k) => contractKeys.includes(k))).toBe(true);
    // And they are exactly the contract's REQUIRED elements — not a hand-rolled list.
    const contractRequired = Object.entries(workElementContract.about.elements)
      .filter(([, def]) => def.requirement === 'required')
      .map(([k]) => k);
    expect(aboutRequiredKeys()).toEqual(contractRequired);
  });
});
