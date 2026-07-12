// Social-post gating helpers — window selection, calendar-month boundary math, pure
// where-clause construction, and the D6 id-space guard (count keys on the CLERK id +
// the SOCIAL_POST_GENERATION enum value, never an internal User.id or a bare string).
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { usageEvent: { count: vi.fn() } },
}));

import { prisma } from '@/lib/prisma';
import { UsageEventType } from '@/lib/creditSystem';
import { PlanTier, PLAN_CONFIGS } from '@/lib/planManager';
import {
  getSocialPostWindow,
  monthStartFor,
  buildSocialPostCountWhere,
  countSocialPostGenerations,
} from './gating';

const countMock = (prisma as any).usageEvent.count as ReturnType<typeof vi.fn>;

describe('PLAN_CONFIGS.limits.socialPosts (MUST equal phase-2 backfill SQL)', () => {
  it('FREE 10 / PRO 300 / AGENCY -1 / ENTERPRISE -1', () => {
    expect(PLAN_CONFIGS[PlanTier.FREE].limits.socialPosts).toBe(10);
    expect(PLAN_CONFIGS[PlanTier.PRO].limits.socialPosts).toBe(300);
    expect(PLAN_CONFIGS[PlanTier.AGENCY].limits.socialPosts).toBe(-1);
    expect(PLAN_CONFIGS[PlanTier.ENTERPRISE].limits.socialPosts).toBe(-1);
  });
});

describe('getSocialPostWindow', () => {
  it('FREE → lifetime', () => {
    expect(getSocialPostWindow(PlanTier.FREE)).toBe('lifetime');
  });
  it('every paid tier → monthly', () => {
    expect(getSocialPostWindow(PlanTier.PRO)).toBe('monthly');
    expect(getSocialPostWindow(PlanTier.AGENCY)).toBe('monthly');
    expect(getSocialPostWindow(PlanTier.ENTERPRISE)).toBe('monthly');
  });
});

describe('monthStartFor', () => {
  it('returns local start-of-month for a YYYY-MM period', () => {
    const d = monthStartFor('2026-07');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6); // July = index 6
    expect(d.getDate()).toBe(1);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  });
  it('January maps to month index 0', () => {
    const d = monthStartFor('2026-01');
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
    expect(d.getFullYear()).toBe(2026);
  });
  it('handles year rollover (December)', () => {
    const d = monthStartFor('2025-12');
    expect(d.getMonth()).toBe(11);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getDate()).toBe(1);
  });
});

describe('buildSocialPostCountWhere', () => {
  it('lifetime window: clerkId + enum eventType, NO createdAt bound', () => {
    const where = buildSocialPostCountWhere('clerk_abc123', 'lifetime');
    expect(where.userId).toBe('clerk_abc123');
    expect(where.eventType).toBe(UsageEventType.SOCIAL_POST_GENERATION);
    expect(where.createdAt).toBeUndefined();
  });

  it('monthly window: adds a createdAt >= start-of-current-month bound', () => {
    const where = buildSocialPostCountWhere('clerk_abc123', 'monthly');
    expect(where.userId).toBe('clerk_abc123');
    expect(where.eventType).toBe(UsageEventType.SOCIAL_POST_GENERATION);
    const gte = (where.createdAt as { gte: Date }).gte;
    expect(gte).toBeInstanceOf(Date);
    // The bound must be a start-of-month (day 1, midnight local).
    expect(gte.getDate()).toBe(1);
    expect(gte.getHours()).toBe(0);
    // ...and the CURRENT month/year.
    const now = new Date();
    expect(gte.getMonth()).toBe(now.getMonth());
    expect(gte.getFullYear()).toBe(now.getFullYear());
  });
});

describe('countSocialPostGenerations (D6 id-space guard)', () => {
  beforeEach(() => {
    countMock.mockReset();
    countMock.mockResolvedValue(7);
  });

  it('passes the CLERK id + SOCIAL_POST_GENERATION enum straight into prisma.usageEvent.count', async () => {
    const clerkId = 'user_2abcDEF_clerk';
    const n = await countSocialPostGenerations(clerkId, 'lifetime');

    expect(n).toBe(7);
    expect(countMock).toHaveBeenCalledTimes(1);
    const arg = countMock.mock.calls[0][0];
    // FAILS if an internal User.id (or a bare string eventType) is threaded through instead.
    expect(arg.where.userId).toBe(clerkId);
    expect(arg.where.eventType).toBe(UsageEventType.SOCIAL_POST_GENERATION);
    expect(arg.where.eventType).toBe('social_post_generation');
  });

  it('monthly count carries the createdAt bound to the DB query', async () => {
    await countSocialPostGenerations('clerk_month', 'monthly');
    const arg = countMock.mock.calls[0][0];
    expect(arg.where.userId).toBe('clerk_month');
    expect(arg.where.createdAt?.gte).toBeInstanceOf(Date);
  });
});
