// lib/planConfigs.ts - Prisma-free plan configuration constants.
//
// ⚠️ INVARIANT: this module MUST stay free of prisma, logger, and any server-only
// import — it is imported by CLIENT components and by the Playwright runner via a
// RELATIVE path. For the same reason it MUST NOT use `@/` path aliases (the
// Playwright/node import of this file does not resolve tsconfig aliases).
//
// `planManager.ts` re-exports everything here, so all existing importers of
// `@/lib/planManager` keep working unchanged.

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
    // create/upgrade/downgrade writers in planManager.ts do not write this field;
    // enforcement is derived from the tier via hasTrackingPixels(). See design decision 4.
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
 * Get plan config for tier
 */
export function getPlanConfig(tier: PlanTier): PlanConfig {
  return PLAN_CONFIGS[tier];
}
