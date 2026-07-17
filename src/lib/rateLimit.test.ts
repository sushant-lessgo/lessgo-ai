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

import { getUserPlan, PlanTier } from './planManager';
import {
  rateLimit,
  getRateLimitStatus,
  clearRateLimit,
  RATE_LIMIT_PRESETS,
  type RateLimitConfig,
} from './rateLimit';

const planMock = getUserPlan as unknown as ReturnType<typeof vi.fn>;

// The limiter only ever reads headers off the request (and only falls back to IP
// when unauthenticated), so a header stub is a faithful stand-in for NextRequest.
const req = { headers: new Headers() } as unknown as NextRequest;

// The bucket store is module-level and persists across tests. Rather than reach
// into it, give each test its own user so buckets can never bleed between tests.
let userSeq = 0;
const freshUser = () => {
  authMock.mockResolvedValue({ userId: `user_${++userSeq}` });
};

// Unauthenticated counterpart: keys fall back to `ip:{ip}`. Each call gets a
// UNIQUE ip for the same reason `freshUser` exists — IP buckets are just as
// module-level, and a shared ip would bleed across tests.
let ipSeq = 0;
const freshAnonReq = (): NextRequest => {
  authMock.mockResolvedValue({ userId: null });
  return { headers: new Headers(), ip: `203.0.113.${++ipSeq}` } as unknown as NextRequest;
};

const AI_FREE_LIMIT = 15; // TIER_RATE_LIMITS[FREE]

beforeEach(() => {
  freshUser();
  // Tier lookups leak across tests otherwise (the PRO case below overrides it).
  planMock.mockResolvedValue({ tier: PlanTier.FREE });
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

  it('namespaces unauthenticated callers by IP per preset too', async () => {
    const anon = freshAnonReq(); // no userId ⇒ `ip:` identity

    expect((await rateLimit(anon, RATE_LIMIT_PRESETS.DOMAIN_VERIFY)).allowed).toBe(true);
    expect((await rateLimit(anon, RATE_LIMIT_PRESETS.DOMAIN_VERIFY)).allowed).toBe(false);

    // A different preset for the same IP starts from a FULL budget. Asserting
    // `remaining` (not just `allowed`) is what makes this mutation-sensitive:
    // under a shared counter GENERAL would STILL report allowed (its ceiling is
    // 100, far above DOMAIN_VERIFY's increments), so `allowed` alone proves
    // nothing here — only the exact count does.
    const general = await rateLimit(anon, RATE_LIMIT_PRESETS.GENERAL);
    expect(general.allowed).toBe(true);
    expect(general.remaining).toBe(RATE_LIMIT_PRESETS.GENERAL.maxRequests - 1);
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

  it('PRO gets a strictly larger AI budget than FREE', async () => {
    planMock.mockResolvedValue({ tier: PlanTier.PRO });

    // PRO = 30/min vs FREE's 15 — i.e. well past where FREE already refuses.
    for (let i = 0; i < 30; i++) {
      expect((await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION)).allowed).toBe(true);
    }
    expect((await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION)).allowed).toBe(false);
  });

  it('survives a failed plan lookup by falling back to the preset default', async () => {
    // Exercises the INNER tier try/catch: a plan-lookup failure must not break
    // the limiter. NOTE: this cannot distinguish the fallback from FREE by count
    // — the preset default and TIER_RATE_LIMITS[FREE] are both 15 by design.
    planMock.mockRejectedValue(new Error('db down'));

    for (let i = 0; i < RATE_LIMIT_PRESETS.AI_GENERATION.maxRequests; i++) {
      expect((await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION)).allowed).toBe(true);
    }
    expect((await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION)).allowed).toBe(false);
  });
});

describe('rateLimit fails OPEN when the limiter itself throws', () => {
  it('allows the request (and says so) instead of 500ing the route', async () => {
    // Throw from `keyGenerator`, which `buildKey`'s argument awaits. This
    // provably hits the OUTER catch, not the inner tier-lookup one: `tierBased`
    // is absent, so the inner try/catch never executes at all. (Throwing via
    // `auth` would NOT work — `defaultKeyGenerator` swallows auth errors itself
    // and falls back to an IP key, so nothing would reach either catch.)
    const config = {
      name: 'exploding',
      maxRequests: 5,
      windowMs: 60 * 1000,
      keyGenerator: async () => {
        throw new Error('rate limit store unreachable');
      },
    } satisfies RateLimitConfig;

    const result = await rateLimit(req, config);

    expect(result.allowed).toBe(true);
    expect(result.error).toBe('Rate limiting service unavailable');
    // Fail-open reports the config's FULL budget — it recorded nothing.
    expect(result.remaining).toBe(5);
    expect(result.limit).toBe(5);
    expect(result.resetTime).toBeGreaterThan(Date.now());
  });
});

describe('getRateLimitStatus / clearRateLimit use the same namespaced key as rateLimit()', () => {
  // The consistency trap: were these to derive keys independently of rateLimit(),
  // status/clear would silently read and clear the WRONG counter.
  it('getRateLimitStatus reports the count rateLimit() actually recorded', async () => {
    await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);
    await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);

    // If status derived a NON-namespaced key it would read an empty entry ⇒ 0.
    const status = await getRateLimitStatus(req, RATE_LIMIT_PRESETS.PUBLISHING);
    expect(status.requests).toBe(2);
    expect(status.remaining).toBe(3);
  });

  it('getRateLimitStatus is per-preset: another preset reads 0 for the same user', async () => {
    await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);

    const other = await getRateLimitStatus(req, RATE_LIMIT_PRESETS.DRAFT_OPERATIONS);
    expect(other.requests).toBe(0);
    expect(other.remaining).toBe(RATE_LIMIT_PRESETS.DRAFT_OPERATIONS.maxRequests);
  });

  it('clearRateLimit actually resets the budget rateLimit() uses', async () => {
    for (let i = 0; i < RATE_LIMIT_PRESETS.PUBLISHING.maxRequests; i++) {
      await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);
    }
    expect((await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING)).allowed).toBe(false);

    await clearRateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);

    expect(await getRateLimitStatus(req, RATE_LIMIT_PRESETS.PUBLISHING)).toMatchObject({
      requests: 0,
    });
    const afterClear = await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);
    expect(afterClear.allowed).toBe(true);
    expect(afterClear.remaining).toBe(4);
  });

  it('clearRateLimit only clears its own preset', async () => {
    await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);
    await rateLimit(req, RATE_LIMIT_PRESETS.DRAFT_OPERATIONS);

    await clearRateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);

    expect((await getRateLimitStatus(req, RATE_LIMIT_PRESETS.PUBLISHING)).requests).toBe(0);
    expect((await getRateLimitStatus(req, RATE_LIMIT_PRESETS.DRAFT_OPERATIONS)).requests).toBe(1);
  });
});
