// Cap gate on POST /api/social/[token]/posts (phase 7). Verifies:
//  - over-limit → 403 `limit_reached` and NO persist ($transaction never runs),
//  - under-limit → generation proceeds and persists (env-mock path).
// Everything external is mocked; the gating count + checkLimit are the unit under test's
// collaborators, so we drive them directly.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: 'clerk_123' })),
}));

vi.mock('@/lib/security', () => ({
  createSecureResponse: (body: unknown, status = 200) => ({ body, status }),
  assertProjectOwner: vi.fn(async () => ({
    ok: true,
    isDemo: false,
    userRecord: { id: 'internal_1' },
    status: 200,
  })),
}));

vi.mock('@/lib/rateLimit', () => ({
  // Pass-through: withAIRateLimit(handler)(req) === handler(req).
  withAIRateLimit: (fn: (r: unknown) => unknown) => (req: unknown) => fn(req),
}));

vi.mock('@/lib/planManager', () => ({
  PlanTier: { FREE: 'FREE', PRO: 'PRO', AGENCY: 'AGENCY', ENTERPRISE: 'ENTERPRISE' },
  getUserPlan: vi.fn(async () => ({ tier: 'FREE' })),
  checkLimit: vi.fn(),
}));

vi.mock('@/modules/social/gating', () => ({
  getSocialPostWindow: (tier: string) => (tier === 'FREE' ? 'lifetime' : 'monthly'),
  countSocialPostGenerations: vi.fn(async () => 0),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findUnique: vi.fn() },
    socialPost: { create: vi.fn(() => ({ __socialPostCreate: true })) },
    usageEvent: { create: vi.fn(() => ({ __usageEventCreate: true })) },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/aiClient', () => ({ generateRawJson: vi.fn() }));

import { POST } from './route';
import { checkLimit, getUserPlan } from '@/lib/planManager';
import { countSocialPostGenerations } from '@/modules/social/gating';
import { prisma } from '@/lib/prisma';

const checkLimitMock = checkLimit as unknown as ReturnType<typeof vi.fn>;
const getUserPlanMock = getUserPlan as unknown as ReturnType<typeof vi.fn>;
const countMock = countSocialPostGenerations as unknown as ReturnType<typeof vi.fn>;
const db = prisma as any;

function makeReq(body: unknown) {
  return { json: async () => body } as any;
}
const ctx = { params: { token: 'tok_1' } };
const validBody = { platform: 'linkedin', mode: 'archetype', archetype: 'tip' };

const OLD_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...OLD_ENV };
  delete process.env.NEXT_PUBLIC_SOCIAL_POSTS_DISABLED;
  getUserPlanMock.mockResolvedValue({ tier: 'FREE' });
  countMock.mockResolvedValue(0);
});

describe('POST cap gate — over limit', () => {
  it('returns 403 limit_reached and persists NOTHING', async () => {
    countMock.mockResolvedValue(10);
    checkLimitMock.mockResolvedValue({ allowed: false, limit: 10, current: 10 });

    const res: any = await POST(makeReq(validBody), ctx);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('limit_reached');
    expect(res.body.tier).toBe('FREE');
    // Gate ran BEFORE any generation/persist.
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.project.findUnique).not.toHaveBeenCalled();
    // Gate keyed on the CLERK id (D6).
    expect(countMock).toHaveBeenCalledWith('clerk_123', 'lifetime');
    expect(checkLimitMock).toHaveBeenCalledWith('clerk_123', 'socialPosts', 10);
  });
});

describe('POST cap gate — under limit', () => {
  it('proceeds to generate + persist when allowed (env-mock path)', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_GPT = 'true';
    countMock.mockResolvedValue(2);
    checkLimitMock.mockResolvedValue({ allowed: true, limit: 10, current: 2 });
    db.project.findUnique.mockResolvedValue({
      id: 'p1',
      title: 'Acme Robotics',
      brief: null,
      content: null,
      inputText: null,
    });
    const persistedRow = {
      id: 'sp1',
      platform: 'linkedin',
      archetype: 'tip',
      mode: 'archetype',
      content: 'mock post',
      createdAt: new Date(),
    };
    db.$transaction.mockResolvedValue([persistedRow]);

    const res: any = await POST(makeReq(validBody), ctx);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.persisted).toBe(true);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    // Both the SocialPost create and the UsageEvent ledger create are in the tx array.
    const txArg = db.$transaction.mock.calls[0][0];
    expect(Array.isArray(txArg)).toBe(true);
    expect(txArg).toHaveLength(2);
  });
});
