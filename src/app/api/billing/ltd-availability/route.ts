// api/billing/ltd-availability/route.ts — public Founding LTD seat counter.
//
// Source of truth = our own UserPlan rows (spec decision 2), NOT Stripe. Returns
// aggregate per-cohort remaining seats + the current (lowest-open) cohort's price.
// No auth, no PII — only counts + prices. Cohort math mirrors
// create-ltd-session/route.ts exactly (lowest cohort with sold < 20; all full → sold out).
//
// Kill-switch: when PRICING_V2_COMMERCE !== 'true' we return { enabled: false } so the
// client renders the static phase-3 placeholder without needing the env var itself.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Cache aggregate counts for ~60s (public, non-personalized).
export const revalidate = 60;

const COHORT_SEATS = 20;

// Cohort → sticker price in whole USD. Matches phase-6 Stripe price tiers
// ($69 → $99 → $129 as seats fill). Display only; the real charge is the Stripe price.
const COHORT_PRICE_USD: Record<number, number> = {
  1: 69,
  2: 99,
  3: 129,
};

export async function GET() {
  // Kill-switch OFF → client keeps the static "Coming at launch" placeholder.
  if (process.env.PRICING_V2_COMMERCE !== 'true') {
    return NextResponse.json({ enabled: false });
  }

  try {
    // Per-cohort remaining seats (source of truth = UserPlan lifetimeDeal rows).
    const cohorts: { cohort: number; seatsTotal: number; remaining: number; priceUsd: number }[] = [];
    let currentCohort: number | null = null;

    for (const c of [1, 2, 3]) {
      const sold = await prisma.userPlan.count({
        where: { lifetimeDeal: true, ltdCohort: c },
      });
      const remaining = Math.max(0, COHORT_SEATS - sold);
      cohorts.push({
        cohort: c,
        seatsTotal: COHORT_SEATS,
        remaining,
        priceUsd: COHORT_PRICE_USD[c],
      });
      // Lowest cohort with open seats is the one on sale.
      if (currentCohort === null && sold < COHORT_SEATS) {
        currentCohort = c;
      }
    }

    const soldOut = currentCohort === null;
    const current = soldOut
      ? null
      : cohorts.find((c) => c.cohort === currentCohort) ?? null;

    return NextResponse.json({
      enabled: true,
      soldOut,
      currentCohort,
      currentPriceUsd: current?.priceUsd ?? null,
      currentRemaining: current?.remaining ?? 0,
      seatsPerCohort: COHORT_SEATS,
      cohorts,
    });
  } catch (error: any) {
    logger.error('Error fetching LTD availability:', error);
    // Fail safe: hide the live counter, fall back to placeholder.
    return NextResponse.json({ enabled: false });
  }
}
