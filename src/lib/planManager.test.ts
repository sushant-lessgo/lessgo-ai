// hasTrackingPixels must be config-derived (not via hasFeature, which fails open
// for a missing DB column). These tests pin the tier→flag mapping and the
// fail-closed behavior on error. prisma + logger are mocked; getUserPlan reads
// prisma.userPlan.findUnique, so we drive the tier through that stub.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userPlan: { findUnique: vi.fn(), create: vi.fn() },
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { prisma } from '@/lib/prisma';
import { hasTrackingPixels, PLAN_CONFIGS, PlanTier } from './planManager';

const db = prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('hasTrackingPixels', () => {
  it('FREE → false', async () => {
    db.userPlan.findUnique.mockResolvedValue({ tier: PlanTier.FREE });
    expect(await hasTrackingPixels('u1')).toBe(false);
  });

  it('PRO → true', async () => {
    db.userPlan.findUnique.mockResolvedValue({ tier: PlanTier.PRO });
    expect(await hasTrackingPixels('u1')).toBe(true);
  });

  it('AGENCY → true', async () => {
    db.userPlan.findUnique.mockResolvedValue({ tier: PlanTier.AGENCY });
    expect(await hasTrackingPixels('u1')).toBe(true);
  });

  it('ENTERPRISE → true', async () => {
    db.userPlan.findUnique.mockResolvedValue({ tier: PlanTier.ENTERPRISE });
    expect(await hasTrackingPixels('u1')).toBe(true);
  });

  it('DB error → false (fail-closed)', async () => {
    db.userPlan.findUnique.mockRejectedValue(new Error('db down'));
    expect(await hasTrackingPixels('u1')).toBe(false);
  });

  it('unknown / garbage tier → false (fail-closed)', async () => {
    db.userPlan.findUnique.mockResolvedValue({ tier: 'GARBAGE' });
    expect(await hasTrackingPixels('u1')).toBe(false);
  });
});

describe('PLAN_CONFIGS trackingPixels mapping (config source of truth)', () => {
  it('only FREE is false', () => {
    expect(PLAN_CONFIGS[PlanTier.FREE].features.trackingPixels).toBe(false);
    expect(PLAN_CONFIGS[PlanTier.PRO].features.trackingPixels).toBe(true);
    expect(PLAN_CONFIGS[PlanTier.AGENCY].features.trackingPixels).toBe(true);
    expect(PLAN_CONFIGS[PlanTier.ENTERPRISE].features.trackingPixels).toBe(true);
  });
});
