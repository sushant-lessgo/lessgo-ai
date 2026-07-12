import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/admin';
import {
  PLAN_CONFIGS,
  PlanTier,
  getUserPlan,
  grantLifetimeDeal,
} from '@/lib/planManager';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Admin grant path (pricing-v2 phase 8). Repeatable comped-Pro / LTD grants used to
 * grandfather existing customers. Gated by requireAdmin() (ADMIN_CLERK_IDS or CRON_SECRET).
 *
 * Body: { userId?: string, email?: string, grant: 'comped_pro' | 'ltd', cohort?: number, pricePaid?: number }
 *  - Resolve the target via userId (Clerk ID == UserPlan.userId) OR email (User.email → clerkId).
 *  - grant='comped_pro' → tier=PRO, status='comped', NO Stripe IDs, creditsLimit=200, pool untouched.
 *      The 200/mo refills automatically WITHOUT a subscription: getUserUsage lazily seeds each new
 *      period's UserUsage row from userPlan.creditsLimit (creditSystem.ts) — no resetCredits/webhook.
 *  - grant='ltd' → grantLifetimeDeal(userId, cohort, pricePaid) (creditsLimit=0, one-time 600 pool).
 *      cohort=0 is a valid pre-cohort bespoke grant (hidden from the public 1–3 counter).
 */
export async function POST(req: NextRequest) {
  try {
    const denied = await requireAdmin(req);
    if (denied) {
      logger.warn('Unauthorized admin grant-plan attempt');
      return denied;
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { userId, email, grant, cohort, pricePaid } = body as {
      userId?: unknown;
      email?: unknown;
      grant?: unknown;
      cohort?: unknown;
      pricePaid?: unknown;
    };

    // Validate grant kind
    if (grant !== 'comped_pro' && grant !== 'ltd') {
      return NextResponse.json(
        { error: "Invalid 'grant' — must be 'comped_pro' or 'ltd'" },
        { status: 400 }
      );
    }

    // Resolve the target clerkId (== UserPlan.userId)
    let clerkId: string | null = null;
    if (typeof userId === 'string' && userId.trim()) {
      clerkId = userId.trim();
    } else if (typeof email === 'string' && email.trim()) {
      // email is not a unique column on User → findFirst.
      const user = await prisma.user.findFirst({
        where: { email: email.trim() },
      });
      if (!user) {
        return NextResponse.json(
          { error: `No user found for email ${email}` },
          { status: 404 }
        );
      }
      clerkId = user.clerkId;
    }

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Missing target — provide userId or a resolvable email' },
        { status: 404 }
      );
    }

    // Ensure a plan row exists (creates a default FREE plan if missing; existing
    // customers already have one). grantLifetimeDeal / the update below require the row.
    await getUserPlan(clerkId);

    if (grant === 'comped_pro') {
      const config = PLAN_CONFIGS[PlanTier.PRO];

      // Idempotent set. status='comped' (plain string column). Stripe IDs cleared so
      // no subscription is implied. creditPool is DELIBERATELY untouched (stays as-is /
      // 0) — the 200/mo comes from the lazy period seed off creditsLimit, not the pool.
      const plan = await prisma.userPlan.update({
        where: { userId: clerkId },
        data: {
          tier: PlanTier.PRO,
          status: 'comped',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          creditsLimit: 200,
          publishedPagesLimit: config.limits.publishedPages,
          draftProjectsLimit: config.limits.draftProjects,
          customDomainsLimit: config.limits.customDomains,
          formSubmissionsLimit: config.limits.formSubmissions,
          teamMembersLimit: config.limits.teamMembers,
          removeBranding: config.features.removeBranding,
          customDomains: config.features.customDomains,
          formIntegrations: config.features.formIntegrations,
          exportHTML: config.features.exportHTML,
          whiteLabel: config.features.whiteLabel,
          analytics: config.features.analytics,
          prioritySupport: config.features.prioritySupport,
        },
      });

      logger.info(`[grant-plan] comped_pro granted to ${clerkId}`);
      return NextResponse.json({ success: true, grant, plan: summarize(plan) });
    }

    // grant === 'ltd'
    // cohort and pricePaid are required and must be non-negative numbers. cohort=0 is
    // a VALID pre-cohort bespoke grant (do NOT reject 0).
    if (typeof cohort !== 'number' || !Number.isInteger(cohort) || cohort < 0) {
      return NextResponse.json(
        { error: "Invalid 'cohort' for ltd — must be a non-negative integer (0 allowed)" },
        { status: 400 }
      );
    }
    if (typeof pricePaid !== 'number' || !Number.isInteger(pricePaid) || pricePaid < 0) {
      return NextResponse.json(
        { error: "Invalid 'pricePaid' for ltd — must be a non-negative integer (cents)" },
        { status: 400 }
      );
    }

    // Double-grant guard (mirrors the phase-6 webhook): if already a lifetime deal,
    // do NOT re-seed another 600-credit pool — return the existing state.
    const existing = await prisma.userPlan.findUnique({ where: { userId: clerkId } });
    if (existing?.lifetimeDeal === true) {
      logger.info(`[grant-plan] ltd skipped — ${clerkId} already lifetimeDeal`);
      return NextResponse.json({
        success: true,
        grant,
        alreadyGranted: true,
        plan: summarize(existing),
      });
    }

    const plan = await grantLifetimeDeal(clerkId, cohort, pricePaid);
    logger.info(`[grant-plan] ltd granted to ${clerkId} (cohort ${cohort}, ${pricePaid}c)`);
    return NextResponse.json({ success: true, grant, plan: summarize(plan) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[grant-plan] failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Grant failed',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}

function summarize(plan: {
  tier: string;
  status: string;
  creditsLimit: number;
  lifetimeDeal: boolean;
  ltdCohort: number | null;
}) {
  return {
    tier: plan.tier,
    status: plan.status,
    creditsLimit: plan.creditsLimit,
    lifetimeDeal: plan.lifetimeDeal,
    ltdCohort: plan.ltdCohort,
  };
}
