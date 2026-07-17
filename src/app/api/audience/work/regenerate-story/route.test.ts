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
const consumeCredits = vi.fn(async () => ({ success: true, remaining: 40 }) as any);
const findUnique = vi.fn();
const voiceSpy = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware/planCheck', () => ({
  requireAICredits: (...args: unknown[]) => requireAICredits(...(args as [])),
}));
vi.mock('@/lib/creditSystem', () => ({
  consumeCredits: (...args: unknown[]) => consumeCredits(...(args as [])),
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
// The Brief now comes from the DB, not the body — mock the project read.
vi.mock('@/lib/prisma', () => ({
  prisma: { project: { findUnique: (...args: unknown[]) => findUnique(...(args as [])) } },
}));
// Spy on selectWorkVoice while keeping the module's REAL exports: storyInterview
// imports formatWorkVoiceForPrompt from this same module, so a partial factory
// would break every non-mock test. importOriginal + real impl keeps behaviour.
vi.mock('@/modules/audience/work/voice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/audience/work/voice')>();
  return {
    ...actual,
    selectWorkVoice: (...args: unknown[]) => {
      voiceSpy(...args);
      return (actual.selectWorkVoice as (...a: unknown[]) => unknown)(...args);
    },
  };
});

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
};

beforeEach(() => {
  vi.clearAllMocks();
  requireAICredits.mockResolvedValue({ allowed: true, userId: 'user_test' });
  assertProjectOwner.mockResolvedValue({ ok: true });
  // Default: the project row carries the Kundius Brief (server-resolved). This
  // default is what makes the happy path green — hence the demo test asserts
  // findUnique is NOT called, or it would mask a demo-path DB dependency.
  findUnique.mockResolvedValue({ brief: kundiusBrief });
  generateRawJson.mockResolvedValue(GOOD_ABOUT);
  consumeCredits.mockResolvedValue({ success: true, remaining: 40 });
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
    // The Brief was resolved server-side from the project row, not the body.
    expect(findUnique).toHaveBeenCalledWith({ where: { tokenId: 'tok_123' }, select: { brief: true } });
  });

  it('the body needs NO brief — it is resolved server-side (no 400)', async () => {
    expect(BASE_BODY).not.toHaveProperty('brief');
    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(200);
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

  it('sequencing: the Brief read sits BEHIND the owner gate (no read for a non-owner)', async () => {
    assertProjectOwner.mockResolvedValue({ ok: false, status: 403, error: 'Forbidden' });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(403);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('demo/mock path: no Project row and no resolvable facts required', async () => {
    const res = await POST(
      makeRequest({ ...BASE_BODY, tokenId: 'lessgodemomockdata' }) as never
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.meta.mock).toBe(true);
    expect(generateRawJson).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('voice sourcing: professionRow comes from the STORED brief businessType', async () => {
    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(200);
    expect(voiceSpy).toHaveBeenCalledTimes(1);
    const input = voiceSpy.mock.calls[0][0] as { professionRow: { key: string } | null };
    expect(input.professionRow).not.toBeNull();
    expect(input.professionRow!.key).toBe(kundiusBrief.businessType);
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

  it('a stored brief with no facts.work is a 400 validation error', async () => {
    findUnique.mockResolvedValue({ brief: { businessType: 'photographer', facts: {} } });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('validation_error');
    expect(json.message).toBe('brief.facts.work is required for work story regeneration');
    expect(generateRawJson).not.toHaveBeenCalled();
  });

  it('a project with NO brief at all is the same clean 400', async () => {
    findUnique.mockResolvedValue({ brief: null });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe(
      'brief.facts.work is required for work story regeneration'
    );
  });

  it('a missing project row is the same clean 400 (defensive branch)', async () => {
    findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(400);
  });

  it('a malformed body is a 400 validation error, not a silent drop', async () => {
    const res = await POST(makeRequest({ tokenId: 'tok_123' }) as never);
    expect(res.status).toBe(400);
  });

  // ── billing-correctness phase 3 (M1): post-consume alignment ─────────────
  // The requireAICredits pre-gate case is already covered above ('credits gate').
  // These pin the post-AI charge failure, which used to be swallowed into a 200.
  it('post-AI genuine insufficiency ⇒ non-success 402, story content DISCARDED', async () => {
    consumeCredits.mockResolvedValue({
      success: false,
      remaining: 0,
      error: 'Insufficient credits',
    });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(402);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('insufficient_credits');
    expect(json.content).toBeUndefined();
  });

  it('charge_conflict ⇒ 500 charge_failed with NO "credit" in the payload (client-rail guard)', async () => {
    consumeCredits.mockResolvedValue({ success: false, remaining: 8, error: 'charge_conflict' });

    const res = await POST(makeRequest(BASE_BODY) as never);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('charge_failed');
    expect(json.content).toBeUndefined();
    expect(JSON.stringify(json)).not.toMatch(/credit/i);
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
