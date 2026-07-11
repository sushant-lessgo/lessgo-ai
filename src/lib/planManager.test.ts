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

describe('PLAN_CONFIGS pricing v2 numbers', () => {
  it('FREE tier matches spec', () => {
    const free = PLAN_CONFIGS[PlanTier.FREE];
    // Display value diverges from DB creditsLimit=0 by design (creditPool, later phase).
    expect(free.credits).toBe(20);
    expect(free.limits.publishedPages).toBe(1);
    expect(free.limits.draftProjects).toBe(3);
    expect(free.limits.customDomains).toBe(0);
    expect(free.limits.formSubmissions).toBe(25);
    expect(free.limits.teamMembers).toBe(1);
    expect(free.features.customDomains).toBe(false);
    expect(free.features.removeBranding).toBe(false);
    expect(free.features.analytics).toBe('basic');
  });

  it('PRO tier matches spec', () => {
    const pro = PLAN_CONFIGS[PlanTier.PRO];
    expect(pro.price.monthly).toBe(29);
    expect(pro.price.annual).toBe(24);
    expect(pro.credits).toBe(200);
    expect(pro.limits.publishedPages).toBe(3);
    expect(pro.limits.customDomains).toBe(3);
    expect(pro.limits.draftProjects).toBe(-1);
    expect(pro.limits.formSubmissions).toBe(1000);
    expect(pro.features.removeBranding).toBe(true);
    expect(pro.features.customDomains).toBe(true);
    expect(pro.features.formIntegrations).toBe(true);
    expect(pro.features.prioritySupport).toBe(true);
    expect(pro.features.trackingPixels).toBe(true);
    expect(pro.features.analytics).toBe('full');
  });

  it('FREE published-pages limit is below PRO (no inversion)', () => {
    expect(PLAN_CONFIGS[PlanTier.FREE].limits.publishedPages).toBeLessThan(
      PLAN_CONFIGS[PlanTier.PRO].limits.publishedPages,
    );
  });
});
