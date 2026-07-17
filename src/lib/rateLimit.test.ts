// publish-trust phase 2a: the per-user/IP store key is namespaced per preset.
//
// Before the fix, `defaultKeyGenerator` returned a bare `user:{id}` and every
// preset shared ONE counter in `rateLimitStore` while each compared it against
// its OWN `maxRequests` — so the LOWEST limit governed every route for a user
// (5 AI generations ⇒ /api/publish 429s). These tests pin: presets have
// independent budgets, each preset still enforces its own limit, and
// status/clear operate on the SAME namespaced key `rateLimit()` writes.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const authMock = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({ auth: () => authMock() }));
vi.mock('@/lib/planManager', () => ({
  PlanTier: { FREE: 'FREE', PRO: 'PRO', AGENCY: 'AGENCY', ENTERPRISE: 'ENTERPRISE' },
  getUserPlan: vi.fn(),
}));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), dev: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { getUserPlan } from '@/lib/planManager';
import {
  rateLimit,
  getRateLimitStatus,
  clearRateLimit,
  RATE_LIMIT_PRESETS,
  type RateLimitConfig,
} from './rateLimit';

const planMock = getUserPlan as unknown as ReturnType<typeof vi.fn>;

// The store is module-level and in-memory. Rather than reaching into it, each
// test uses a UNIQUE userId, so its namespaced keys cannot collide with any
// other test's — isolation without pretending to reset private state.
let seq = 0;
const freshUser = () => `user_${++seq}_${Math.random().toString(36).slice(2)}`;

const reqFor = (userId: string | null): NextRequest => {
  authMock.mockResolvedValue({ userId });
  return { headers: new Headers(), ip: '203.0.113.9' } as unknown as NextRequest;
};

beforeEach(() => {
  vi.clearAllMocks();
  planMock.mockResolvedValue({ tier: 'FREE' });
});

describe('rateLimit — per-preset namespacing', () => {
  it('does NOT share a counter across presets: exhausting AI_GENERATION leaves PUBLISHING allowed', async () => {
    const userId = freshUser();
    const req = reqFor(userId);

    // Burn the whole FREE-tier AI budget (5/min).
    for (let i = 0; i < 5; i++) {
      const r = await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION);
      expect(r.allowed).toBe(true);
    }
    expect((await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION)).allowed).toBe(false);

    // Same user, different preset — must still have its own untouched budget.
    // (Pre-fix this returned allowed:false — the exact live publish bug.)
    const publishResult = await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);
    expect(publishResult.allowed).toBe(true);
    expect(publishResult.remaining).toBe(4);
  });

  it('still enforces each preset OWN limit: PUBLISHING allows 5, 429s the 6th', async () => {
    const req = reqFor(freshUser());

    for (let i = 0; i < 5; i++) {
      const r = await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(4 - i);
    }

    const sixth = await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);
    expect(sixth.allowed).toBe(false);
    expect(sixth.remaining).toBe(0);
    expect(sixth.error).toBe('Rate limit exceeded');
  });

  it('namespaces unauthenticated callers by IP per preset too', async () => {
    const req = reqFor(null); // no userId ⇒ ip: key

    expect((await rateLimit(req, RATE_LIMIT_PRESETS.DOMAIN_VERIFY)).allowed).toBe(true);
    expect((await rateLimit(req, RATE_LIMIT_PRESETS.DOMAIN_VERIFY)).allowed).toBe(false);

    // A different preset for the same IP starts from a FULL budget. Asserting
    // `remaining` (not just `allowed`) is what makes this mutation-sensitive:
    // under a shared counter GENERAL would report 98 remaining, not 99 (the
    // DOMAIN_VERIFY call that was blocked above never incremented the counter).
    const general = await rateLimit(req, RATE_LIMIT_PRESETS.GENERAL);
    expect(general.allowed).toBe(true);
    expect(general.remaining).toBe(RATE_LIMIT_PRESETS.GENERAL.maxRequests - 1);
  });
});

describe('rateLimit — tier-based limits', () => {
  it('PRO gets 10 AI generations where FREE gets 5', async () => {
    planMock.mockResolvedValue({ tier: 'PRO' });
    const req = reqFor(freshUser());

    for (let i = 0; i < 10; i++) {
      expect((await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION)).allowed).toBe(true);
    }
    expect((await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION)).allowed).toBe(false);
  });

  it('falls back to the preset default when the plan lookup throws', async () => {
    planMock.mockRejectedValue(new Error('db down'));
    const req = reqFor(freshUser());

    for (let i = 0; i < 5; i++) {
      expect((await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION)).allowed).toBe(true);
    }
    expect((await rateLimit(req, RATE_LIMIT_PRESETS.AI_GENERATION)).allowed).toBe(false);
  });
});

describe('rateLimit — fails OPEN when the limiter itself throws', () => {
  it('allows the request (and says so) instead of 500ing the route', async () => {
    // Throw from `keyGenerator`, which `buildStoreKey` awaits. This provably
    // hits the OUTER catch, not the inner tier-lookup one: `tierBased` is
    // absent, so the inner try/catch block never executes at all. (Throwing via
    // `auth` would NOT work — `defaultKeyGenerator` swallows auth errors itself
    // and falls back to an IP key, so nothing would reach either catch.)
    const boom = new Error('rate limit store unreachable');
    const config = {
      name: 'exploding',
      maxRequests: 5,
      windowMs: 60 * 1000,
      keyGenerator: async () => {
        throw boom;
      },
    } satisfies RateLimitConfig;

    const result = await rateLimit(reqFor(freshUser()), config);

    expect(result.allowed).toBe(true);
    expect(result.error).toBe('Rate limiting service unavailable');
    // Fail-open reports the config's FULL budget — it recorded nothing.
    expect(result.remaining).toBe(5);
    expect(result.resetTime).toBeGreaterThan(Date.now());
  });
});

describe('getRateLimitStatus / clearRateLimit — same namespaced key as rateLimit()', () => {
  it('getRateLimitStatus reports the count rateLimit() actually recorded', async () => {
    const req = reqFor(freshUser());

    await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);
    await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);

    // If status derived a NON-namespaced key it would read an empty entry ⇒ 0.
    const status = await getRateLimitStatus(req, RATE_LIMIT_PRESETS.PUBLISHING);
    expect(status.requests).toBe(2);
    expect(status.remaining).toBe(3);
  });

  it('getRateLimitStatus is per-preset: another preset reads 0 for the same user', async () => {
    const req = reqFor(freshUser());
    await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);

    const other = await getRateLimitStatus(req, RATE_LIMIT_PRESETS.DRAFT_OPERATIONS);
    expect(other.requests).toBe(0);
    expect(other.remaining).toBe(RATE_LIMIT_PRESETS.DRAFT_OPERATIONS.maxRequests);
  });

  it('clearRateLimit actually resets the budget rateLimit() uses', async () => {
    const req = reqFor(freshUser());

    for (let i = 0; i < 5; i++) await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);
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
    const req = reqFor(freshUser());
    await rateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);
    await rateLimit(req, RATE_LIMIT_PRESETS.DRAFT_OPERATIONS);

    await clearRateLimit(req, RATE_LIMIT_PRESETS.PUBLISHING);

    expect((await getRateLimitStatus(req, RATE_LIMIT_PRESETS.PUBLISHING)).requests).toBe(0);
    expect((await getRateLimitStatus(req, RATE_LIMIT_PRESETS.DRAFT_OPERATIONS)).requests).toBe(1);
  });
});
