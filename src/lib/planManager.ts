// lib/planManager.ts - Plan tier management and feature checking
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Plan tier enum
export enum PlanTier {
  FREE = 'FREE',
  PRO = 'PRO',
  AGENCY = 'AGENCY',
  ENTERPRISE = 'ENTERPRISE'
}

// Plan status enum
export enum PlanStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  INCOMPLETE = 'incomplete'
}

// Plan configuration interface
export interface PlanConfig {
  tier: PlanTier;
  name: string;
  price: {
    monthly: number;
    annual: number;
  };
  credits: number;
  limits: {
    publishedPages: number;
    draftProjects: number;
    customDomains: number;
    formSubmissions: number;
    teamMembers: number;
    // social-posts feature cap. FREE = 10 lifetime, PRO = 300/mo soft cap,
    // AGENCY/ENTERPRISE = -1 (unlimited). MUST equal the phase-2 backfill SQL in
    // migration 20260710105655_social_posts (SQL cannot import TS — keep in sync).
    socialPosts: number;
  };
  features: {
    removeBranding: boolean;
    customDomains: boolean;
    formIntegrations: boolean;
    exportHTML: boolean;
    whiteLabel: boolean;
    analytics: 'none' | 'basic' | 'full';
    prioritySupport: boolean;
    // Tracking pixels (Meta Pixel / GA4) in the published <head>. CONFIG-ONLY:
    // deliberately NOT persisted to a UserPlan DB column (no migration). The
    // create/upgrade/downgrade writers below do not write this field; enforcement
    // is derived from the tier via hasTrackingPixels(). See design decision 4.
    trackingPixels: boolean;
  };
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
}

// Plan tier configurations
export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  [PlanTier.FREE]: {
    tier: PlanTier.FREE,
    name: 'Free',
    price: {
      monthly: 0,
      annual: 0,
    },
    // Display value 20 INTENTIONALLY diverges from DB creditsLimit=0. The 20
    // one-time credits live in UserPlan.creditPool (seeded once at plan creation,
    // never refills — added in a later phase), while the monthly limit is
    // deliberately 0 (new periods seed 0). Do NOT "fix" this to write creditsLimit=20.
    credits: 20,
    limits: {
      publishedPages: 1,
      draftProjects: 3,
      customDomains: 0,
      formSubmissions: 25,
      teamMembers: 1,
      socialPosts: 10, // lifetime cap (FREE)
    },
    features: {
      removeBranding: false,
      customDomains: false,
      formIntegrations: false,
      exportHTML: false,
      whiteLabel: false,
      analytics: 'basic',
      prioritySupport: false,
      trackingPixels: false,
    },
    rateLimit: {
      maxRequests: 5,
      windowMs: 60 * 1000, // 1 minute
    },
  },
  [PlanTier.PRO]: {
    tier: PlanTier.PRO,
    name: 'Pro',
    price: {
      monthly: 29,
      annual: 24, // $290/year ≈ $24/month (pricing page displays "$290/yr")
    },
    credits: 200,
    limits: {
      publishedPages: 3,
      draftProjects: -1, // unlimited
      customDomains: 3,
      formSubmissions: 1000,
      teamMembers: 1,
      socialPosts: 300, // monthly soft cap (PRO)
    },
    features: {
      removeBranding: true,
      customDomains: true,
      formIntegrations: true,
      exportHTML: false,
      whiteLabel: false,
      analytics: 'full',
      prioritySupport: true,
      trackingPixels: true,
    },
    rateLimit: {
      maxRequests: 10,
      windowMs: 60 * 1000,
    },
  },
  [PlanTier.AGENCY]: {
    tier: PlanTier.AGENCY,
    name: 'Scale',
    price: {
      monthly: 129,
      annual: 99, // $1188/year = $99/month
    },
    credits: 1000,
    limits: {
      publishedPages: -1, // unlimited
      draftProjects: -1, // unlimited
      customDomains: -1, // unlimited
      formSubmissions: -1, // unlimited
      teamMembers: 5,
      socialPosts: -1, // unlimited (AGENCY)
    },
    features: {
      removeBranding: true,
      customDomains: true,
      formIntegrations: true,
      exportHTML: true,
      whiteLabel: true,
      analytics: 'full',
      prioritySupport: true,
      trackingPixels: true,
    },
    rateLimit: {
      maxRequests: 20,
      windowMs: 60 * 1000,
    },
  },
  [PlanTier.ENTERPRISE]: {
    tier: PlanTier.ENTERPRISE,
    name: 'Custom',
    price: {
      monthly: 299,
      annual: 299,
    },
    credits: -1, // unlimited
    limits: {
      publishedPages: -1, // unlimited
      draftProjects: -1, // unlimited
      customDomains: -1, // unlimited
      formSubmissions: -1, // unlimited
      teamMembers: -1, // unlimited
      socialPosts: -1, // unlimited (ENTERPRISE)
    },
    features: {
      removeBranding: true,
      customDomains: true,
      formIntegrations: true,
      exportHTML: true,
      whiteLabel: true,
      analytics: 'full',
      prioritySupport: true,
      trackingPixels: true,
    },
    rateLimit: {
      maxRequests: 50,
      windowMs: 60 * 1000,
    },
  },
};

/**
 * Get or create user plan
 */
export async function getUserPlan(userId: string) {
  try {
    let userPlan = await prisma.userPlan.findUnique({
      where: { userId },
    });

    // Create default plan if doesn't exist
    if (!userPlan) {
      userPlan = await createDefaultPlan(userId);
    }

    return userPlan;
  } catch (error) {
    logger.error('Error getting user plan:', error);
    throw error;
  }
}

/**
 * ⚠️ LIMIT-COLUMN WRITER-COMPLETENESS GUARD (durable): the *Limit DB columns are
 * written by SIX writers — FIVE in this file (createDefaultPlan, upgradePlan,
 * downgradePlan, grantLifetimeDeal, startTrial) plus ONE outside planManager: the
 * comped_pro branch of `src/app/api/admin/grant-plan/route.ts`. Adding ANY new
 * `*Limit` column requires writing it in ALL SIX (grep `socialPostsLimit` to see
 * the pattern). The Prisma `update`/`create` calls do NOT require every column, so
 * `tsc` CANNOT catch a missing writer — a stale row would silently carry the wrong cap.
 */

/**
 * Create default FREE plan for new user
 */
export async function createDefaultPlan(userId: string) {
  try {
    const config = PLAN_CONFIGS[PlanTier.FREE];

    // pricing-v2: FREE monthly allotment is DELIBERATELY 0 (new periods seed 0), and
    // the displayed 20 credits are ONE-TIME — seeded into the persistent creditPool
    // exactly ONCE, here at plan creation. They never refill (resetCredits / the
    // lazy period seed never touch the pool). Do NOT write config.credits into
    // creditsLimit for FREE. This creation path is the ONLY place the 20-pool is
    // seeded; existing FREE rows are intentionally left untouched (Q7).
    const userPlan = await prisma.userPlan.create({
      data: {
        userId,
        tier: config.tier,
        status: PlanStatus.ACTIVE,
        creditsLimit: 0,
        creditPool: config.credits, // one-time 20
        publishedPagesLimit: config.limits.publishedPages,
        draftProjectsLimit: config.limits.draftProjects,
        customDomainsLimit: config.limits.customDomains,
        formSubmissionsLimit: config.limits.formSubmissions,
        teamMembersLimit: config.limits.teamMembers,
        socialPostsLimit: config.limits.socialPosts,
        removeBranding: config.features.removeBranding,
        customDomains: config.features.customDomains,
        formIntegrations: config.features.formIntegrations,
        exportHTML: config.features.exportHTML,
        whiteLabel: config.features.whiteLabel,
        analytics: config.features.analytics,
        prioritySupport: config.features.prioritySupport,
      },
    });

    logger.info(`Created default FREE plan for user ${userId}`);
    return userPlan;
  } catch (error) {
    logger.error('Error creating default plan:', error);
    throw error;
  }
}

/**
 * Upgrade user plan
 */
export async function upgradePlan(
  userId: string,
  newTier: PlanTier,
  stripeData?: {
    customerId: string;
    subscriptionId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }
) {
  try {
    const config = PLAN_CONFIGS[newTier];

    // pricing-v2: PRO monthly allotment = config.credits (200). creditPool is
    // deliberately NOT written here, so any top-up balance survives an upgrade.
    const userPlan = await prisma.userPlan.update({
      where: { userId },
      data: {
        tier: newTier,
        status: stripeData ? PlanStatus.ACTIVE : PlanStatus.ACTIVE,
        stripeCustomerId: stripeData?.customerId,
        stripeSubscriptionId: stripeData?.subscriptionId,
        currentPeriodStart: stripeData?.currentPeriodStart,
        currentPeriodEnd: stripeData?.currentPeriodEnd,
        creditsLimit: config.credits,
        publishedPagesLimit: config.limits.publishedPages,
        draftProjectsLimit: config.limits.draftProjects,
        customDomainsLimit: config.limits.customDomains,
        formSubmissionsLimit: config.limits.formSubmissions,
        teamMembersLimit: config.limits.teamMembers,
        socialPostsLimit: config.limits.socialPosts,
        removeBranding: config.features.removeBranding,
        customDomains: config.features.customDomains,
        formIntegrations: config.features.formIntegrations,
        exportHTML: config.features.exportHTML,
        whiteLabel: config.features.whiteLabel,
        analytics: config.features.analytics,
        prioritySupport: config.features.prioritySupport,
      },
    });

    logger.info(`Upgraded user ${userId} to ${newTier}`);
    return userPlan;
  } catch (error) {
    logger.error('Error upgrading plan:', error);
    throw error;
  }
}

/**
 * Downgrade user plan (typically to FREE)
 */
export async function downgradePlan(userId: string, newTier: PlanTier = PlanTier.FREE) {
  try {
    const config = PLAN_CONFIGS[newTier];

    // pricing-v2: FREE monthly allotment is 0 (config.credits=20 is a DISPLAY value
    // living in the pool). Crucially, downgrade does NOT re-seed the 20-credit pool —
    // that seed happens once at plan creation only, so users can't farm free credits
    // by cycling upgrade→downgrade. creditPool is deliberately left untouched here.
    const monthlyLimit = newTier === PlanTier.FREE ? 0 : config.credits;

    const userPlan = await prisma.userPlan.update({
      where: { userId },
      data: {
        tier: newTier,
        status: PlanStatus.ACTIVE,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        creditsLimit: monthlyLimit,
        publishedPagesLimit: config.limits.publishedPages,
        draftProjectsLimit: config.limits.draftProjects,
        customDomainsLimit: config.limits.customDomains,
        formSubmissionsLimit: config.limits.formSubmissions,
        teamMembersLimit: config.limits.teamMembers,
        socialPostsLimit: config.limits.socialPosts,
        removeBranding: config.features.removeBranding,
        customDomains: config.features.customDomains,
        formIntegrations: config.features.formIntegrations,
        exportHTML: config.features.exportHTML,
        whiteLabel: config.features.whiteLabel,
        analytics: config.features.analytics,
        prioritySupport: config.features.prioritySupport,
      },
    });

    logger.info(`Downgraded user ${userId} to ${newTier}`);
    return userPlan;
  } catch (error) {
    logger.error('Error downgrading plan:', error);
    throw error;
  }
}

/**
 * Grant a lifetime deal (pricing-v2 LTD / bespoke).
 *
 * LTD is modeled as tier=PRO + lifetimeDeal=true (+ ltdCohort/ltdPricePaid). Monthly
 * allotment is 0 (no subscription ever fires resetCredits for them); the value comes
 * from a one-time 600-credit pool seed via addPoolCredits. Gets full PRO feature
 * limits. Used by the phase-6 webhook and the phase-8 admin grant route.
 *
 * `ltdCohort = 0` is reserved for pre-cohort bespoke grants (hidden from the public
 * 1–3 cohort counter).
 */
export async function grantLifetimeDeal(
  userId: string,
  cohort: number,
  pricePaidCents: number
) {
  try {
    const config = PLAN_CONFIGS[PlanTier.PRO];

    const userPlan = await prisma.userPlan.update({
      where: { userId },
      data: {
        tier: PlanTier.PRO,
        status: PlanStatus.ACTIVE,
        lifetimeDeal: true,
        ltdCohort: cohort,
        ltdPricePaid: pricePaidCents,
        // Monthly allotment 0 — the 600 credits live in the persistent pool below.
        creditsLimit: 0,
        publishedPagesLimit: config.limits.publishedPages,
        draftProjectsLimit: config.limits.draftProjects,
        customDomainsLimit: config.limits.customDomains,
        formSubmissionsLimit: config.limits.formSubmissions,
        teamMembersLimit: config.limits.teamMembers,
        socialPostsLimit: config.limits.socialPosts,
        removeBranding: config.features.removeBranding,
        customDomains: config.features.customDomains,
        formIntegrations: config.features.formIntegrations,
        exportHTML: config.features.exportHTML,
        whiteLabel: config.features.whiteLabel,
        analytics: config.features.analytics,
        prioritySupport: config.features.prioritySupport,
      },
    });

    // Seed the 600-credit lifetime pool. Dynamic import avoids a top-level circular
    // dependency (creditSystem imports getUserPlan from this module).
    const { addPoolCredits, UsageEventType } = await import('./creditSystem');
    await addPoolCredits(userId, 600, UsageEventType.LTD_GRANT, { cohort, pricePaidCents });

    logger.info(`Granted lifetime deal to user ${userId} (cohort ${cohort}, ${pricePaidCents}c)`);
    return userPlan;
  } catch (error) {
    logger.error('Error granting lifetime deal:', error);
    throw error;
  }
}

/**
 * Start trial period
 *
 * UNUSED (spec decision 3): pricing v2 has no trials — the free tier is the trial,
 * with a 14-day money-back guarantee instead. Kept in place (not deleted) to avoid
 * touching callers/exports; do not wire into new flows.
 */
export async function startTrial(userId: string, tier: PlanTier, trialDays: number = 14) {
  try {
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + trialDays);

    const config = PLAN_CONFIGS[tier];

    const userPlan = await prisma.userPlan.update({
      where: { userId },
      data: {
        tier,
        status: PlanStatus.TRIALING,
        isTrialing: true,
        trialStart,
        trialEnd,
        creditsLimit: config.credits,
        publishedPagesLimit: config.limits.publishedPages,
        draftProjectsLimit: config.limits.draftProjects,
        customDomainsLimit: config.limits.customDomains,
        formSubmissionsLimit: config.limits.formSubmissions,
        teamMembersLimit: config.limits.teamMembers,
        socialPostsLimit: config.limits.socialPosts,
        removeBranding: config.features.removeBranding,
        customDomains: config.features.customDomains,
        formIntegrations: config.features.formIntegrations,
        exportHTML: config.features.exportHTML,
        whiteLabel: config.features.whiteLabel,
        analytics: config.features.analytics,
        prioritySupport: config.features.prioritySupport,
      },
    });

    logger.info(`Started ${trialDays}-day trial for user ${userId} on ${tier}`);
    return userPlan;
  } catch (error) {
    logger.error('Error starting trial:', error);
    throw error;
  }
}

/**
 * End trial period (convert or revert)
 *
 * UNUSED (spec decision 3): see startTrial — pricing v2 has no trials. Retained,
 * not deleted.
 */
export async function endTrial(userId: string, convert: boolean = false) {
  try {
    if (convert) {
      // Trial converts to paid - keep tier, update status
      await prisma.userPlan.update({
        where: { userId },
        data: {
          status: PlanStatus.ACTIVE,
          isTrialing: false,
        },
      });
      logger.info(`Trial converted to paid for user ${userId}`);
    } else {
      // Trial ends without conversion - downgrade to free
      await downgradePlan(userId, PlanTier.FREE);
      logger.info(`Trial ended, downgraded user ${userId} to FREE`);
    }
  } catch (error) {
    logger.error('Error ending trial:', error);
    throw error;
  }
}

/**
 * Check if user has access to a feature.
 *
 * CONFIG-DERIVED + DENY-BY-DEFAULT. We resolve the tier from the DB UserPlan row
 * and read the flag from PLAN_CONFIGS — the per-row feature columns are NEVER
 * trusted (legacy FREE rows drift, and some feature keys have no DB column at
 * all). This is behavior-preserving: the create/upgrade/downgrade writers above
 * populate those columns FROM this same config.
 *
 * Previously this read the DB row and tested `=== true || !== 'none'`, which
 * returned true for `false` and for `undefined` — i.e. every boolean paywall flag
 * passed on FREE. Semantics now: booleans are strict `=== true`; `analytics` is
 * the one string enum ('none' | 'basic' | 'full') where any non-'none' value is
 * access; unknown tier / unknown key / error → false (fail-closed).
 * See design decision 4.
 */
export async function hasFeature(userId: string, feature: keyof PlanConfig['features']): Promise<boolean> {
  try {
    const userPlan = await getUserPlan(userId);
    const value = PLAN_CONFIGS[userPlan.tier as PlanTier]?.features[feature];
    return typeof value === 'boolean' ? value : value !== undefined && value !== 'none';
  } catch (error) {
    logger.error('Error checking feature access:', error);
    return false;
  }
}

/**
 * Check if user's plan allows tracking pixels (Meta Pixel / GA4) in the
 * published <head>.
 *
 * CONFIG-DERIVED, like hasFeature() above (which is now config-derived too — the
 * old fail-open DB-row read is gone). Kept as a SEPARATE helper on purpose:
 * trackingPixels is intentionally not a DB UserPlan column (no migration), so it
 * gets its own tier→config accessor rather than being folded into hasFeature.
 * Collapsing the two is a deliberate deferred DRY-up, not an oversight.
 * Any error / unknown tier → false (fail-closed). See design decision 4.
 */
export async function hasTrackingPixels(userId: string): Promise<boolean> {
  try {
    const userPlan = await getUserPlan(userId);
    return PLAN_CONFIGS[userPlan.tier as PlanTier]?.features.trackingPixels === true;
  } catch (error) {
    logger.error('Error checking tracking pixels access:', error);
    return false;
  }
}

/**
 * Check if user is within resource limit
 */
export async function checkLimit(
  userId: string,
  limitType: keyof PlanConfig['limits'],
  currentCount: number
): Promise<{ allowed: boolean; limit: number; current: number }> {
  // Dev mode bypass
  if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_LIMITS === 'true') {
    return { allowed: true, limit: -1, current: 0 };
  }

  try {
    const userPlan = await getUserPlan(userId);
    const limit = (userPlan as any)[`${limitType}Limit`];

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, limit: -1, current: currentCount };
    }

    const allowed = currentCount < limit;
    return { allowed, limit, current: currentCount };
  } catch (error) {
    logger.error('Error checking limit:', error);
    return { allowed: false, limit: 0, current: currentCount };
  }
}

/**
 * Get plan config for tier
 */
export function getPlanConfig(tier: PlanTier): PlanConfig {
  return PLAN_CONFIGS[tier];
}

/**
 * Update plan status (for Stripe webhooks)
 */
export async function updatePlanStatus(userId: string, status: PlanStatus) {
  try {
    const userPlan = await prisma.userPlan.update({
      where: { userId },
      data: { status },
    });

    logger.info(`Updated plan status for user ${userId} to ${status}`);
    return userPlan;
  } catch (error) {
    logger.error('Error updating plan status:', error);
    throw error;
  }
}

/**
 * Update billing period (for Stripe webhooks)
 */
export async function updateBillingPeriod(
  userId: string,
  periodStart: Date,
  periodEnd: Date
) {
  try {
    const userPlan = await prisma.userPlan.update({
      where: { userId },
      data: {
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    });

    logger.info(`Updated billing period for user ${userId}`);
    return userPlan;
  } catch (error) {
    logger.error('Error updating billing period:', error);
    throw error;
  }
}
