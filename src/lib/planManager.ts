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
  };
  features: {
    removeBranding: boolean;
    customDomains: boolean;
    formIntegrations: boolean;
    exportHTML: boolean;
    whiteLabel: boolean;
    analytics: 'none' | 'basic' | 'full';
    prioritySupport: boolean;
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
    name: 'Launch',
    price: {
      monthly: 0,
      annual: 0,
    },
    credits: 30,
    limits: {
      publishedPages: 20,
      draftProjects: 3,
      customDomains: 0,
      formSubmissions: 100,
      teamMembers: 1,
    },
    features: {
      removeBranding: false,
      customDomains: false,
      formIntegrations: false,
      exportHTML: false,
      whiteLabel: false,
      analytics: 'basic',
      prioritySupport: false,
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
      monthly: 39,
      annual: 29, // $348/year = $29/month
    },
    credits: 200,
    limits: {
      publishedPages: 10,
      draftProjects: -1, // unlimited
      customDomains: 3,
      formSubmissions: 1000,
      teamMembers: 1,
    },
    features: {
      removeBranding: true,
      customDomains: true,
      formIntegrations: true,
      exportHTML: false,
      whiteLabel: false,
      analytics: 'full',
      prioritySupport: true,
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
    },
    features: {
      removeBranding: true,
      customDomains: true,
      formIntegrations: true,
      exportHTML: true,
      whiteLabel: true,
      analytics: 'full',
      prioritySupport: true,
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
    },
    features: {
      removeBranding: true,
      customDomains: true,
      formIntegrations: true,
      exportHTML: true,
      whiteLabel: true,
      analytics: 'full',
      prioritySupport: true,
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
 * Create default FREE plan for new user
 */
export async function createDefaultPlan(userId: string) {
  try {
    const config = PLAN_CONFIGS[PlanTier.FREE];

    const userPlan = await prisma.userPlan.create({
      data: {
        userId,
        tier: config.tier,
        status: PlanStatus.ACTIVE,
        creditsLimit: config.credits,
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

    const userPlan = await prisma.userPlan.update({
      where: { userId },
      data: {
        tier: newTier,
        status: PlanStatus.ACTIVE,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        creditsLimit: config.credits,
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

    logger.info(`Downgraded user ${userId} to ${newTier}`);
    return userPlan;
  } catch (error) {
    logger.error('Error downgrading plan:', error);
    throw error;
  }
}

/**
 * Start trial period
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
 * Check if user has access to a feature
 */
export async function hasFeature(userId: string, feature: keyof PlanConfig['features']): Promise<boolean> {
  try {
    const userPlan = await getUserPlan(userId);
    return (userPlan as any)[feature] === true || (userPlan as any)[feature] !== 'none';
  } catch (error) {
    logger.error('Error checking feature access:', error);
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
