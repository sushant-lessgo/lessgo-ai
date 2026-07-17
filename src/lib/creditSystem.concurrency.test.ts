// @vitest-environment node
//
// H1 concurrency proof — REAL DB, real `deductCredits`, no mocks.
//
// Why real: a mocked-Prisma "concurrency" test is theatre — a mock cannot
// reproduce row-lock re-evaluation of a conditional WHERE, which is the entire
// mechanism under test. This suite fires N real deductCredits calls with
// Promise.all against the dev Postgres and asserts the money invariants.
//
// This suite MUST be seen FAILING against the pre-fix read-modify-write
// deductCredits before it counts as proof (RED output pasted in the audit).
//
// Ordering constraints in this file are load-bearing:
//  1. `dotenv/config` first, so DATABASE_URL exists before skipIf evaluates
//     (vitest does not load .env itself).
//  2. DATABASE_URL is mutated to pin `connection_limit=10` (>= N=5) BEFORE
//     `@/lib/creditSystem` is imported — that module pulls the `@/lib/prisma`
//     SINGLETON, which constructs `new PrismaClient()` at import time and reads
//     the URL from env right then. Hence the dynamic import in beforeAll: a
//     datasource override on a test-owned client would be INERT for the code
//     under test. The pin matters because Promise.all only produces real
//     concurrency if the pool grants N connections at once; a serialized pool
//     runs the interactive txs one-at-a-time and lets the BROKEN implementation
//     pass. Pool-serialized fake greens are exactly what this prevents.
import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const hasDb = !!process.env.DATABASE_URL;

if (!hasDb) {
  // eslint-disable-next-line no-console
  console.warn(
    '\n*** BILLING CONCURRENCY SUITE SKIPPED — no DATABASE_URL — this run proves NOTHING about H1 ***\n'
  );
} else {
  const url = process.env.DATABASE_URL!;
  if (!/[?&]connection_limit=/.test(url)) {
    process.env.DATABASE_URL = `${url}${url.includes('?') ? '&' : '?'}connection_limit=10`;
  }
}
// The dev bypass would short-circuit deductCredits and fake a green.
delete process.env.DEV_BYPASS_CREDITS;

type CreditSystem = typeof import('./creditSystem');
let creditSystem: CreditSystem;
let db: PrismaClient;

const userId = `billing_it_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const period = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
})();

/** Reset the test user's two buckets to a known state. */
async function seed(monthly: number, pool: number) {
  await db.usageEvent.deleteMany({ where: { userId } });
  await db.userUsage.upsert({
    where: { userId_period: { userId, period } },
    create: {
      userId,
      period,
      creditsLimit: monthly,
      creditsRemaining: monthly,
      creditsUsed: 0,
    },
    update: {
      creditsLimit: monthly,
      creditsRemaining: monthly,
      creditsUsed: 0,
      fullPageGens: 0,
      sectionRegens: 0,
      elementRegens: 0,
      fieldInference: 0,
    },
  });
  await db.userPlan.upsert({
    where: { userId },
    create: { userId, tier: 'FREE', creditsLimit: monthly, creditPool: pool },
    update: { creditsLimit: monthly, creditPool: pool },
  });
}

async function readState() {
  const [usage, plan] = await Promise.all([
    db.userUsage.findUnique({ where: { userId_period: { userId, period } } }),
    db.userPlan.findUnique({ where: { userId } }),
  ]);
  return { usage: usage!, plan: plan! };
}

/** Fire N concurrent cost-1 spends; returns the settled results. */
async function spendConcurrently(n: number, eventType: any) {
  return Promise.all(
    Array.from({ length: n }, () =>
      creditSystem.deductCredits(userId, 1, eventType, { endpoint: 'concurrency-test' })
    )
  );
}

describe.skipIf(!hasDb)('deductCredits concurrency (real DB)', () => {
  beforeAll(async () => {
    db = new PrismaClient();
    // Dynamic import AFTER the env pin above — see file header.
    creditSystem = await import('./creditSystem');
  });

  afterAll(async () => {
    if (!db) return;
    await db.usageEvent.deleteMany({ where: { userId } });
    await db.userUsage.deleteMany({ where: { userId } });
    await db.userPlan.deleteMany({ where: { userId } });
    await db.$disconnect();
  });

  beforeEach(() => {
    delete process.env.DEV_BYPASS_CREDITS;
  });

  it('monthly=1, pool=0, N=5 → exactly 1 success, 4 insufficient, nothing negative', async () => {
    await seed(1, 0);
    const results = await spendConcurrently(5, creditSystem.UsageEventType.PAGE_GENERATION);

    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(4);
    // Losers are genuinely broke — they must NOT be reported as a billing conflict.
    for (const f of failures) expect(f.error).toMatch(/Insufficient credits/);

    const { usage, plan } = await readState();
    expect(usage.creditsRemaining).toBe(0);
    expect(plan.creditPool).toBe(0);
    expect(usage.creditsUsed).toBe(1);
    expect(usage.creditsRemaining).toBeGreaterThanOrEqual(0);
    expect(plan.creditPool).toBeGreaterThanOrEqual(0);
  });

  it('monthly=0, pool=1, N=5 → 1 success; creditsUsed===1 and counter===1 (NO-PARTIAL-CHARGE ROLLBACK PROOF)', async () => {
    await seed(0, 1);
    const results = await spendConcurrently(5, creditSystem.UsageEventType.PAGE_GENERATION);

    const successes = results.filter((r) => r.success);
    expect(successes).toHaveLength(1);

    const { usage, plan } = await readState();
    expect(plan.creditPool).toBe(0);
    expect(plan.creditPool).toBeGreaterThanOrEqual(0);
    // THE point of this case: with fromMonthly=0 every loser's monthly guard
    // (`creditsRemaining >= 0`) is TRIVIALLY TRUE, so each loser DOES increment
    // creditsUsed + fullPageGens before its pool guard fails. Only the whole-tx
    // rollback keeps those phantom charges off the record. If rollback were
    // broken, balances would still look right but creditsUsed would read 5.
    expect(usage.creditsUsed).toBe(1 * successes.length);
    expect(usage.creditsUsed).toBe(1);
    expect(usage.fullPageGens).toBe(1);
  });

  it('monthly=1, pool=1, N=3 → exactly 2 succeed (retry/recompute path), both buckets drained', async () => {
    await seed(1, 1);
    const results = await spendConcurrently(3, creditSystem.UsageEventType.PAGE_GENERATION);

    expect(results.filter((r) => r.success)).toHaveLength(2);

    const { usage, plan } = await readState();
    expect(usage.creditsRemaining).toBe(0);
    expect(plan.creditPool).toBe(0);
    expect(usage.creditsUsed).toBe(2);
    expect(usage.fullPageGens).toBe(2);
  });

  it('sequential sanity: monthly=2, pool=1 → drains monthly first, then pool (split-order regression)', async () => {
    await seed(2, 1);
    const et = creditSystem.UsageEventType.PAGE_GENERATION;

    const r1 = await creditSystem.deductCredits(userId, 1, et, { endpoint: 'concurrency-test' });
    expect(r1.success).toBe(true);
    let s = await readState();
    expect(s.usage.creditsRemaining).toBe(1);
    expect(s.plan.creditPool).toBe(1);

    const r2 = await creditSystem.deductCredits(userId, 1, et, { endpoint: 'concurrency-test' });
    expect(r2.success).toBe(true);
    s = await readState();
    expect(s.usage.creditsRemaining).toBe(0);
    expect(s.plan.creditPool).toBe(1);

    const r3 = await creditSystem.deductCredits(userId, 1, et, { endpoint: 'concurrency-test' });
    expect(r3.success).toBe(true);
    s = await readState();
    expect(s.usage.creditsRemaining).toBe(0);
    expect(s.plan.creditPool).toBe(0);
    expect(s.usage.creditsUsed).toBe(3);
  });

  it('ledger atomicity: exactly one success:true UsageEvent per successful spend', async () => {
    await seed(1, 1);
    const results = await spendConcurrently(4, creditSystem.UsageEventType.PAGE_GENERATION);
    const successes = results.filter((r) => r.success).length;

    const rows = await db.usageEvent.count({ where: { userId, success: true } });
    expect(successes).toBe(2);
    expect(rows).toBe(successes);
  });
});
