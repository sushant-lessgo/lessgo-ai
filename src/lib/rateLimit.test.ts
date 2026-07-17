// src/lib/rateLimit.test.ts
// Regression guard for the production incident where a customer's multi-page
// generation died on "Generation hit a snag. Too many requests."
//
// The 429 came from OUR limiter, not the AI provider. Every preset shared one
// `user:{id}` counter but compared it against its OWN maxRequests, so autosaves
// (DRAFT_OPERATIONS, 30/min) ran the shared tally up past the AI budget and the
// next generate-copy refused itself. Generation autosaves after every page, so
// the fan-out reliably poisoned its own bucket.
//
// The first test below fails on the pre-fix code and is the reason this file
// exists — keep it honest.
//
// Clerk + planManager are mocked at the module boundary; the limiter's real
// bucket logic runs.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

const authMock = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({ auth: () => authMock() }));

vi.mock('./planManager', async (importOriginal) => {
  // PlanTier is a real enum used as a Record key by TIER_RATE_LIMITS — keep it.
  const actual = await importOriginal<typeof import('./planManager')>();
  return { ...actual, getUserPlan: vi.fn(async () => ({ tier: actual.PlanTier.FREE })) };
});

import { rateLimit, RATE_LIMIT_PRESETS } from './rateLimit';

// The limiter only ever reads headers off the request (and only falls back to IP
// when unauthenticated), so a header stub is a faithful stand-in for NextRequest.
const req = { headers: new Headers() } as unknown as NextRequest;

// The bucket store is module-level and persists across tests. Rather than reach
// into it, give each test its own user so buckets can never bleed between tests.
let userSeq = 0;
const freshUser = () => {
  authMock.mockResolvedValue({ userId: `user_${++userSeq}` });
};

const AI_FREE_LIMIT = 15; // TIER_RATE_LIMITS[FREE]

beforeEach(() => {
  freshUser();
});

describe('rateLimit bucket isolation', () => {
  it('autosaves do not consume the AI budget (the production incident)', async () => {
    // Enough autosaves to exceed the AI ceiling, but well under DRAFT's own 30.
    for (let i = 0; i < AI_FREE_LIMIT; i++) {
      const draft = await rateLimit(req, RATE_LIMIT_PRESETS.DRAFT_OPERATIONS);
      expect(draft.allowed).toBe(true);
    }

    // Pre-fix this returned allowed:false — the AI call read the autosave tally.
    const ai = await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION);
    expect(ai.allowed).toBe(true);
    expect(ai.remaining).toBe(AI_FREE_LIMIT - 1);
  });

  it('exhausting the AI budget leaves autosaves working', async () => {
    for (let i = 0; i < AI_FREE_LIMIT; i++) {
      expect((await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION)).allowed).toBe(true);
    }
    expect((await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION)).allowed).toBe(false);

    // A user out of AI budget must still be able to save their work.
    expect((await rateLimit(req, RATE_LIMIT_PRESETS.DRAFT_OPERATIONS)).allowed).toBe(true);
  });

  it('separates buckets per preset, not just AI vs draft', async () => {
    for (let i = 0; i < RATE_LIMIT_PRESETS.PUBLISHING.maxRequests; i++) {
      expect((await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING)).allowed).toBe(true);
    }
    expect((await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING)).allowed).toBe(false);

    // Publishing is spent; unrelated presets must be untouched.
    expect((await rateLimit(req, RATE_LIMIT_PRESETS.FORM_SUBMISSION)).allowed).toBe(true);
    expect((await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION)).allowed).toBe(true);
  });

  it('still refuses once a preset genuinely exceeds its own ceiling', async () => {
    for (let i = 0; i < AI_FREE_LIMIT; i++) {
      await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION);
    }

    const refused = await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION);
    expect(refused.allowed).toBe(false);
    expect(refused.remaining).toBe(0);
    expect(refused.error).toBe('Rate limit exceeded');
  });

  it('isolates buckets per user', async () => {
    for (let i = 0; i < AI_FREE_LIMIT; i++) {
      await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION);
    }
    expect((await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION)).allowed).toBe(false);

    freshUser();
    expect((await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION)).allowed).toBe(true);
  });
});

describe('rateLimit tier ceilings', () => {
  it('reports the tier-effective limit, not the preset default', async () => {
    // A multi-page generation is ~7 AI calls from one click; the ceiling has to
    // clear it, and the header must report what was actually applied.
    const result = await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION);
    expect(result.limit).toBe(AI_FREE_LIMIT);
    expect(result.limit).toBeGreaterThan(7);
  });
});
