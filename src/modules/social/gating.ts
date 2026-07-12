// src/modules/social/gating.ts — social-post cap gating helpers (pure + one thin DB fn).
//
// Counts the APPEND-ONLY UsageEvent ledger (NOT SocialPost rows), so deleting library
// posts can never restore allowance (D4-revised). FREE = lifetime cap; PRO/AGENCY/ENT =
// per-calendar-month soft cap.
//
// ⚠️ ID SPACE (D6): every parameter here is NAMED `clerkId` on purpose. UsageEvent.userId
// stores the CLERK id (from auth()), NOT the internal Project.userId / User.id. Threading
// an internal id here would make the count return 0 forever → the Free cap never fires.
//
// The monthly window is a CALENDAR month (mirrors creditSystem.getCurrentPeriod's local
// YYYY-MM), INTENTIONALLY different from the page-gen credits' Stripe-anniversary reset —
// acceptable because the Pro cap is an invisible soft abuse cap, not a billed entitlement.

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { UsageEventType } from '@/lib/creditSystem';
import { PlanTier } from '@/lib/planManager';

export type SocialPostWindow = 'lifetime' | 'monthly';

/**
 * FREE → 'lifetime' (10 posts ever); every paid tier → 'monthly' (soft calendar-month cap).
 */
export function getSocialPostWindow(tier: PlanTier): SocialPostWindow {
  return tier === PlanTier.FREE ? 'lifetime' : 'monthly';
}

/**
 * Current period string "YYYY-MM" in LOCAL time — mirrors the (unexported)
 * creditSystem.getCurrentPeriod so the monthly boundary is consistent with it.
 */
export function currentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Start-of-month Date for a "YYYY-MM" period, LOCAL time. E.g. "2026-01" → Jan 1 00:00 local.
 */
export function monthStartFor(period: string): Date {
  const [yearStr, monthStr] = period.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-based
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

/**
 * Pure prisma where-clause builder for the ledger count. Lifetime = all rows for this
 * clerkId + SOCIAL_POST_GENERATION; monthly additionally bounds `createdAt >= month start`.
 */
export function buildSocialPostCountWhere(
  clerkId: string,
  window: SocialPostWindow,
): Prisma.UsageEventWhereInput {
  const where: Prisma.UsageEventWhereInput = {
    userId: clerkId,
    eventType: UsageEventType.SOCIAL_POST_GENERATION,
  };
  if (window === 'monthly') {
    where.createdAt = { gte: monthStartFor(currentPeriod()) };
  }
  return where;
}

/**
 * Count social-post generations for gating. Keys on the CLERK id (D6).
 */
export async function countSocialPostGenerations(
  clerkId: string,
  window: SocialPostWindow,
): Promise<number> {
  return prisma.usageEvent.count({ where: buildSocialPostCountWhere(clerkId, window) });
}
