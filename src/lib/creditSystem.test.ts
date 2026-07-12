// pricing-v2 credit-semantics tests: monthly allotment + persistent pool.
// prisma + logger + planManager are mocked. getUserPlan is stubbed to drive the
// plan's creditsLimit / creditPool; prisma.userUsage drives the monthly bucket.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userUsage: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    userPlan: { findUnique: vi.fn(), update: vi.fn() },
    usageEvent: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), dev: vi.fn() },
}));
vi.mock('./planManager', () => ({
  getUserPlan: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getUserPlan } from './planManager';
import {
  checkCredits,
  deductCredits,
  addPoolCredits,
  resetCredits,
  getCreditBalance,
  UsageEventType,
} from './creditSystem';

const db = prisma as any;
const planStub = getUserPlan as any;

beforeEach(() => {
  vi.clearAllMocks();
  // Ensure dev-bypass is off for deterministic assertions.
  delete process.env.DEV_BYPASS_CREDITS;
});

/** Wire $transaction to run the callback against a controllable tx object. */
function withTx(usage: any, plan: any) {
  const tx = {
    userUsage: {
      findUnique: vi.fn().mockResolvedValue(usage),
      update: vi.fn().mockImplementation(async ({ data }: any) => ({ ...usage, ...data })),
    },
    userPlan: {
      findUnique: vi.fn().mockResolvedValue(plan),
      update: vi.fn().mockImplementation(async ({ data }: any) => {
        // emulate { decrement } / { increment }
        const dec = data.creditPool?.decrement ?? 0;
        const inc = data.creditPool?.increment ?? 0;
        return { ...plan, creditPool: (plan?.creditPool ?? 0) - dec + inc };
      }),
    },
  };
  db.$transaction.mockImplementation(async (cb: any) => cb(tx));
  return tx;
}

describe('checkCredits (monthly + pool)', () => {
  it('combines monthly remaining and pool', async () => {
    db.userUsage.findUnique.mockResolvedValue({ creditsRemaining: 3, creditsLimit: 200 });
    planStub.mockResolvedValue({ creditPool: 10, creditsLimit: 200 });
    const r = await checkCredits('u1', 5);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(13);
  });

  it('FREE new-model: monthly 0 + pool 20 covers a 5-credit op', async () => {
    db.userUsage.findUnique.mockResolvedValue({ creditsRemaining: 0, creditsLimit: 0 });
    planStub.mockResolvedValue({ creditPool: 20, creditsLimit: 0 });
    const r = await checkCredits('u1', 5);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(20);
  });

  it('Q7 regression: existing FREE row (monthly 30, pool 0) still resolves to 30', async () => {
    db.userUsage.findUnique.mockResolvedValue({ creditsRemaining: 30, creditsLimit: 30 });
    planStub.mockResolvedValue({ creditPool: 0, creditsLimit: 30 });
    const r = await checkCredits('u1', 10);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(30);
  });

  it('rejects when combined balance is short', async () => {
    db.userUsage.findUnique.mockResolvedValue({ creditsRemaining: 1, creditsLimit: 0 });
    planStub.mockResolvedValue({ creditPool: 1, creditsLimit: 0 });
    const r = await checkCredits('u1', 5);
    expect(r.allowed).toBe(false);
  });
});

describe('deductCredits (monthly first, then pool)', () => {
  it('FREE: monthly 0, pool 20, deduct 5 → drains pool (old L183 guard would have thrown)', async () => {
    const tx = withTx(
      { creditsRemaining: 0, creditsLimit: 0, creditsUsed: 0, fullPageGens: 0, sectionRegens: 0, elementRegens: 0, fieldInference: 0 },
      { creditPool: 20 },
    );
    const r = await deductCredits('u1', 5, UsageEventType.SECTION_REGEN);
    expect(r.success).toBe(true);
    // monthly stays 0, pool 20-5=15 → total 15
    expect(r.remaining).toBe(15);
    expect(tx.userPlan.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { creditPool: { decrement: 5 } } }),
    );
    // monthly bucket update should keep creditsRemaining at 0 (nothing drained from it)
    expect(tx.userUsage.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ creditsRemaining: 0, creditsUsed: 5 }) }),
    );
  });

  it('mixed: monthly 3, pool 10, deduct 5 → monthly→0, pool→8', async () => {
    const tx = withTx(
      { creditsRemaining: 3, creditsLimit: 200, creditsUsed: 0, fullPageGens: 0, sectionRegens: 0, elementRegens: 0, fieldInference: 0 },
      { creditPool: 10 },
    );
    const r = await deductCredits('u1', 5, UsageEventType.SECTION_REGEN);
    expect(r.success).toBe(true);
    expect(r.remaining).toBe(8); // 0 monthly + 8 pool
    expect(tx.userPlan.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { creditPool: { decrement: 2 } } }),
    );
  });

  it('monthly-only: monthly 10, pool 0, deduct 4 → no pool write', async () => {
    const tx = withTx(
      { creditsRemaining: 10, creditsLimit: 200, creditsUsed: 0, fullPageGens: 0, sectionRegens: 0, elementRegens: 0, fieldInference: 0 },
      { creditPool: 0 },
    );
    const r = await deductCredits('u1', 4, UsageEventType.SECTION_REGEN);
    expect(r.success).toBe(true);
    expect(r.remaining).toBe(6);
    expect(tx.userPlan.update).not.toHaveBeenCalled();
  });

  it('insufficient combined balance → failure', async () => {
    withTx(
      { creditsRemaining: 1, creditsLimit: 0, creditsUsed: 0, fullPageGens: 0, sectionRegens: 0, elementRegens: 0, fieldInference: 0 },
      { creditPool: 1 },
    );
    const r = await deductCredits('u1', 5, UsageEventType.SECTION_REGEN);
    expect(r.success).toBe(false);
    expect(r.error).toBeTruthy();
  });
});

describe('addPoolCredits', () => {
  it('increments pool and writes a ledger event', async () => {
    db.userPlan.update.mockResolvedValue({ creditPool: 620 });
    const r = await addPoolCredits('u1', 600, UsageEventType.LTD_GRANT, { cohort: 1 });
    expect(r.success).toBe(true);
    expect(r.poolRemaining).toBe(620);
    expect(db.userPlan.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { creditPool: { increment: 600 } } }),
    );
    expect(db.usageEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventType: UsageEventType.LTD_GRANT, creditsUsed: -600 }),
      }),
    );
  });
});

describe('resetCredits does not touch the pool', () => {
  it('only upserts UserUsage, never updates UserPlan.creditPool', async () => {
    planStub.mockResolvedValue({ creditsLimit: 0, creditPool: 20 });
    db.userUsage.upsert.mockResolvedValue({});
    await resetCredits('u1');
    expect(db.userUsage.upsert).toHaveBeenCalled();
    expect(db.userPlan.update).not.toHaveBeenCalled();
  });
});

describe('getCreditBalance (FREE, zero monthly limit)', () => {
  it('totalAvailable=20, percentUsed=0, no NaN/Infinity', async () => {
    db.userUsage.findUnique.mockResolvedValue({ creditsRemaining: 0, creditsUsed: 0, creditsLimit: 0 });
    planStub.mockResolvedValue({ tier: 'FREE', creditPool: 20, creditsLimit: 0 });
    const b: any = await getCreditBalance('u1');
    expect(b.totalAvailable).toBe(20);
    expect(b.poolRemaining).toBe(20);
    expect(b.monthlyRemaining).toBe(0);
    expect(b.percentUsed).toBe(0);
    expect(Number.isFinite(b.percentUsed)).toBe(true);
    expect(Number.isNaN(b.percentUsed)).toBe(false);
  });
});
