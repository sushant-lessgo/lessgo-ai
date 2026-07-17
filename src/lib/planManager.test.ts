// hasTrackingPixels must be config-derived (not via hasFeature, which fails open
// for a missing DB column). These tests pin the tier→flag mapping and the
// fail-closed behavior on error. prisma + logger are mocked; getUserPlan reads
// prisma.userPlan.findUnique, so we drive the tier through that stub.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userPlan: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    usageEvent: { create: vi.fn() },
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), dev: vi.fn() },
}));

import { prisma } from '@/lib/prisma';
import {
  hasFeature,
  hasTrackingPixels,
  createDefaultPlan,
  downgradePlan,
  grantLifetimeDeal,
  PLAN_CONFIGS,
  PlanTier,
} from './planManager';

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

// hasFeature must be config-derived + deny-by-default. Every row below carries
// DELIBERATELY WRONG per-row feature columns (all true) — if any assertion flips,
// the DB row is being trusted again and the paywall is open.
describe('hasFeature (deny-by-default, config-derived)', () => {
  const wrongRow = (tier: string) => ({
    tier,
    // legacy/drifted columns claiming everything is unlocked — must be IGNORED
    removeBranding: true,
    customDomains: true,
    exportHTML: true,
    whiteLabel: true,
    analytics: 'full',
    // note: no trackingPixels column exists on UserPlan at all
  });

  it('FREE + removeBranding → false even though the DB row says true (the !== \'none\' regression)', async () => {
    db.userPlan.findUnique.mockResolvedValue(wrongRow(PlanTier.FREE));
    expect(await hasFeature('u1', 'removeBranding')).toBe(false);
  });

  it('FREE + whiteLabel / exportHTML / customDomains → false', async () => {
    db.userPlan.findUnique.mockResolvedValue(wrongRow(PlanTier.FREE));
    expect(await hasFeature('u1', 'whiteLabel')).toBe(false);
    expect(await hasFeature('u1', 'exportHTML')).toBe(false);
    expect(await hasFeature('u1', 'customDomains')).toBe(false);
  });

  it('FREE + trackingPixels (no DB column → undefined on row) → false', async () => {
    db.userPlan.findUnique.mockResolvedValue(wrongRow(PlanTier.FREE));
    expect(await hasFeature('u1', 'trackingPixels')).toBe(false);
  });

  it('FREE + analytics → true (config says \'basic\')', async () => {
    db.userPlan.findUnique.mockResolvedValue(wrongRow(PlanTier.FREE));
    expect(await hasFeature('u1', 'analytics')).toBe(true);
  });

  it('PRO + removeBranding → true', async () => {
    db.userPlan.findUnique.mockResolvedValue({ tier: PlanTier.PRO });
    expect(await hasFeature('u1', 'removeBranding')).toBe(true);
  });

  it('PRO + exportHTML → false (PRO genuinely lacks it, row column notwithstanding)', async () => {
    db.userPlan.findUnique.mockResolvedValue(wrongRow(PlanTier.PRO));
    expect(await hasFeature('u1', 'exportHTML')).toBe(false);
  });

  it('AGENCY + exportHTML / whiteLabel → true', async () => {
    db.userPlan.findUnique.mockResolvedValue({ tier: PlanTier.AGENCY });
    expect(await hasFeature('u1', 'exportHTML')).toBe(true);
    expect(await hasFeature('u1', 'whiteLabel')).toBe(true);
  });

  // No shipped tier sets analytics:'none' today, so the 'none' branch is pinned via
  // an unknown tier (→ undefined) plus a direct config-shape assertion below.
  it('unknown / garbage tier → false for every key, incl. analytics', async () => {
    db.userPlan.findUnique.mockResolvedValue(wrongRow('GARBAGE'));
    expect(await hasFeature('u1', 'removeBranding')).toBe(false);
    expect(await hasFeature('u1', 'analytics')).toBe(false);
  });

  it("no shipped tier uses analytics:'none' (so the 'none' branch is currently unreachable)", () => {
    for (const tier of Object.values(PlanTier)) {
      expect(PLAN_CONFIGS[tier as PlanTier].features.analytics).not.toBe('none');
    }
  });

  it('getUserPlan throws → false (fail-closed)', async () => {
    db.userPlan.findUnique.mockRejectedValue(new Error('db down'));
    expect(await hasFeature('u1', 'removeBranding')).toBe(false);
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

describe('pricing-v2 credit-pool plan writers', () => {
  const db = prisma as any;

  it('createDefaultPlan seeds monthly=0 + one-time pool=20 (never writes creditsLimit=20)', async () => {
    db.userPlan.create.mockResolvedValue({});
    await createDefaultPlan('u1');
    expect(db.userPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ creditsLimit: 0, creditPool: 20 }),
      }),
    );
  });

  it('downgradePlan(FREE) sets monthly=0 and does NOT re-seed / touch the pool', async () => {
    db.userPlan.update.mockResolvedValue({});
    await downgradePlan('u1', PlanTier.FREE);
    const arg = db.userPlan.update.mock.calls[0][0];
    expect(arg.data.creditsLimit).toBe(0);
    // no creditPool write on downgrade (no free-credit farming via up/down cycles)
    expect(arg.data).not.toHaveProperty('creditPool');
  });

  it('grantLifetimeDeal → PRO + lifetimeDeal + monthly 0, then seeds 600 pool', async () => {
    db.userPlan.update.mockResolvedValue({ tier: 'PRO' });
    db.usageEvent.create.mockResolvedValue({});
    await grantLifetimeDeal('u1', 1, 6900);
    const arg = db.userPlan.update.mock.calls[0][0];
    expect(arg.data.tier).toBe(PlanTier.PRO);
    expect(arg.data.lifetimeDeal).toBe(true);
    expect(arg.data.ltdCohort).toBe(1);
    expect(arg.data.ltdPricePaid).toBe(6900);
    expect(arg.data.creditsLimit).toBe(0);
    // 600-credit pool seed via addPoolCredits (increment) + ledger row
    expect(db.userPlan.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { creditPool: { increment: 600 } } }),
    );
    expect(db.usageEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventType: 'ltd_grant', creditsUsed: -600 }),
      }),
    );
  });
});
