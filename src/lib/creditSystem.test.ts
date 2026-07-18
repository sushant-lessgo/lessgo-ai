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
  consumeCredits,
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

/** Apply prisma-style { increment } / { decrement } atomic ops to a row. */
function applyOps(row: any, data: any) {
  for (const [k, v] of Object.entries<any>(data)) {
    if (v && typeof v === 'object' && ('increment' in v || 'decrement' in v)) {
      row[k] = (row[k] ?? 0) + (v.increment ?? 0) - (v.decrement ?? 0);
    } else {
      row[k] = v;
    }
  }
}

/**
 * Wire $transaction to run the callback against a controllable, STATEFUL tx
 * object emulating the guarded-updateMany shape: updateMany honours the
 * `gte` guards, mutates the row, and returns { count }.
 *
 * opts.monthlyCounts / opts.poolCounts force the affected-row count per call
 * (simulating a lost race). NOTE: this mock CANNOT roll anything back — see the
 * comment on the pool-conflict test.
 */
function withTx(usage: any, plan: any, opts: { monthlyCounts?: number[]; poolCounts?: number[] } = {}) {
  const state = { usage: { ...usage }, plan: plan ? { ...plan } : null };
  let monthlyCall = 0;
  let poolCall = 0;

  const tx = {
    userUsage: {
      findUnique: vi.fn().mockImplementation(async () => ({ ...state.usage })),
      updateMany: vi.fn().mockImplementation(async ({ where, data }: any) => {
        const forced = opts.monthlyCounts?.[monthlyCall++];
        if (forced !== undefined) return { count: forced };
        const gte = where.creditsRemaining?.gte ?? 0;
        if (state.usage.creditsRemaining < gte) return { count: 0 };
        applyOps(state.usage, data);
        return { count: 1 };
      }),
    },
    userPlan: {
      findUnique: vi.fn().mockImplementation(async () => (state.plan ? { ...state.plan } : null)),
      updateMany: vi.fn().mockImplementation(async ({ where, data }: any) => {
        const forced = opts.poolCounts?.[poolCall++];
        if (forced !== undefined) return { count: forced };
        const gte = where.creditPool?.gte ?? 0;
        if ((state.plan?.creditPool ?? 0) < gte) return { count: 0 };
        applyOps(state.plan, data);
        return { count: 1 };
      }),
    },
    usageEvent: { create: vi.fn().mockResolvedValue({}) },
  };
  db.$transaction.mockImplementation(async (cb: any) => cb(tx));
  return { tx, state };
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

const baseUsage = (over: any = {}) => ({
  creditsRemaining: 0,
  creditsLimit: 0,
  creditsUsed: 0,
  fullPageGens: 0,
  sectionRegens: 0,
  elementRegens: 0,
  fieldInference: 0,
  ...over,
});

describe('deductCredits (monthly first, then pool)', () => {
  it('FREE: monthly 0, pool 20, deduct 5 → drains pool (old L183 guard would have thrown)', async () => {
    const { tx, state } = withTx(baseUsage(), { creditPool: 20 });
    const r = await deductCredits('u1', 5, UsageEventType.SECTION_REGEN);
    expect(r.success).toBe(true);
    // monthly stays 0, pool 20-5=15 → total 15
    expect(r.remaining).toBe(15);
    expect(tx.userPlan.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { creditPool: { decrement: 5 } } }),
    );
    // monthly bucket keeps creditsRemaining at 0 (nothing drained from it)
    expect(state.usage.creditsRemaining).toBe(0);
    expect(state.usage.creditsUsed).toBe(5);
  });

  it('mixed: monthly 3, pool 10, deduct 5 → monthly→0, pool→8', async () => {
    const { tx, state } = withTx(baseUsage({ creditsRemaining: 3, creditsLimit: 200 }), { creditPool: 10 });
    const r = await deductCredits('u1', 5, UsageEventType.SECTION_REGEN);
    expect(r.success).toBe(true);
    expect(r.remaining).toBe(8); // 0 monthly + 8 pool
    expect(tx.userPlan.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { creditPool: { decrement: 2 } } }),
    );
    expect(state.usage.creditsRemaining).toBe(0);
  });

  it('monthly-only: monthly 10, pool 0, deduct 4 → no pool write', async () => {
    const { tx } = withTx(baseUsage({ creditsRemaining: 10, creditsLimit: 200 }), { creditPool: 0 });
    const r = await deductCredits('u1', 4, UsageEventType.SECTION_REGEN);
    expect(r.success).toBe(true);
    expect(r.remaining).toBe(6);
    expect(tx.userPlan.updateMany).not.toHaveBeenCalled();
  });

  it('insufficient combined balance → failure (no retry)', async () => {
    const { tx } = withTx(baseUsage({ creditsRemaining: 1 }), { creditPool: 1 });
    const r = await deductCredits('u1', 5, UsageEventType.SECTION_REGEN);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/Insufficient credits/);
    expect(r.error).not.toBe('charge_conflict');
    // genuine insufficiency must NOT burn retries
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.userUsage.updateMany).not.toHaveBeenCalled();
  });

  it('writes the guarded monthly update with a gte guard + atomic increments', async () => {
    const { tx } = withTx(baseUsage({ creditsRemaining: 10, creditsLimit: 200 }), { creditPool: 0 });
    await deductCredits('u1', 4, UsageEventType.PAGE_GENERATION);
    expect(tx.userUsage.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', period: expect.any(String), creditsRemaining: { gte: 4 } },
      data: {
        creditsUsed: { increment: 4 },
        creditsRemaining: { decrement: 4 },
        fullPageGens: { increment: 1 },
      },
    });
  });
});

describe('deductCredits conflict handling (guard count assertions + retry)', () => {
  it('(a) monthly guard count=0 but balance still sufficient → retries and succeeds', async () => {
    // First monthly updateMany loses the race (count 0); the retry re-reads and succeeds.
    const { tx } = withTx(baseUsage({ creditsRemaining: 5, creditsLimit: 200 }), { creditPool: 0 }, {
      monthlyCounts: [0],
    });
    const r = await deductCredits('u1', 1, UsageEventType.SECTION_REGEN);
    expect(r.success).toBe(true);
    expect(db.$transaction).toHaveBeenCalledTimes(2);
    expect(tx.userUsage.updateMany).toHaveBeenCalledTimes(2);
  });

  it('(b) pool guard count=0 → sentinel propagates out of the tx executor and deductCredits retries', async () => {
    // NOTE: this proves ONLY sentinel propagation + tx-promise rejection. A mocked
    // $transaction executor rolls NOTHING back, so this test cannot and does not
    // assert the no-partial-charge property. The real rollback proof is
    // concurrency case 2 in creditSystem.concurrency.test.ts (real DB).
    const { tx } = withTx(baseUsage(), { creditPool: 3 }, { poolCounts: [0, 0, 0] });
    const r = await deductCredits('u1', 1, UsageEventType.SECTION_REGEN);
    expect(r.success).toBe(false);
    expect(r.error).toBe('charge_conflict');
    expect(tx.userPlan.updateMany).toHaveBeenCalledTimes(3);
  });

  it('(c) success path creates exactly ONE in-tx usageEvent, and consumeCredits adds none', async () => {
    db.userUsage.findUnique.mockResolvedValue({ creditsRemaining: 5, creditsLimit: 200 });
    planStub.mockResolvedValue({ creditPool: 0, creditsLimit: 200 });
    const { tx } = withTx(baseUsage({ creditsRemaining: 5, creditsLimit: 200 }), { creditPool: 0 });

    const r = await consumeCredits('u1', UsageEventType.SECTION_REGEN, 1, { projectId: 'p1' });
    expect(r.success).toBe(true);
    expect(tx.usageEvent.create).toHaveBeenCalledTimes(1);
    expect(tx.usageEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        eventType: UsageEventType.SECTION_REGEN,
        creditsUsed: 1,
        projectId: 'p1',
        success: true,
      }),
    });
    // no post-hoc success ledger row (would be a double-ledger)
    expect(db.usageEvent.create).not.toHaveBeenCalled();
  });

  it('(d) 3 consecutive conflicts → success:false with error charge_conflict (never the insufficient string)', async () => {
    withTx(baseUsage({ creditsRemaining: 5, creditsLimit: 200 }), { creditPool: 0 }, {
      monthlyCounts: [0, 0, 0],
    });
    const r = await deductCredits('u1', 1, UsageEventType.SECTION_REGEN);
    expect(r.success).toBe(false);
    expect(r.error).toBe('charge_conflict');
    expect(r.error).not.toMatch(/insufficient/i);
    expect(db.$transaction).toHaveBeenCalledTimes(3);
    // solvent user: report their real balance, not 0
    expect(r.remaining).toBe(5);
  });

  it('consumeCredits propagates charge_conflict UNMANGLED', async () => {
    db.userUsage.findUnique.mockResolvedValue({ creditsRemaining: 5, creditsLimit: 200 });
    planStub.mockResolvedValue({ creditPool: 0, creditsLimit: 200 });
    withTx(baseUsage({ creditsRemaining: 5, creditsLimit: 200 }), { creditPool: 0 }, {
      monthlyCounts: [0, 0, 0],
    });
    const r = await consumeCredits('u1', UsageEventType.SECTION_REGEN, 1);
    expect(r.success).toBe(false);
    expect(r.error).toBe('charge_conflict');
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
