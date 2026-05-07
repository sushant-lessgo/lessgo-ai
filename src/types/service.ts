// src/types/service.ts
// Service-route types - Phase 0 foundation
// Reference: newServiceOnboarding.md, nsoPlan.md

/**
 * ===== PROJECT TYPE =====
 * Single bifurcation between product and service routes.
 */
export const projectTypes = ['product', 'service'] as const;
export type ProjectType = (typeof projectTypes)[number];

/**
 * ===== USER PERSONA =====
 * Captured once at user level. Drives ProjectType derivation.
 */
export const userPersonas = [
  'saas-founder',
  'indie-maker',
  'agency',
  'consultant',
  'coach',
  'freelancer',
  'local-service',
  'productized-service',
] as const;

export type UserPersona = (typeof userPersonas)[number];

export const userPersonaLabels: Record<UserPersona, string> = {
  'saas-founder': 'SaaS / app founder',
  'indie-maker': 'Indie maker',
  'agency': 'Agency owner',
  'consultant': 'Consultant / advisor',
  'coach': 'Coach',
  'freelancer': 'Freelancer / solo expert',
  'local-service': 'Local service owner',
  'productized-service': 'Productized service operator',
};

export const userPersonaDescriptions: Record<UserPersona, string> = {
  'saas-founder': 'Building a SaaS, app, or web tool',
  'indie-maker': 'Shipping plugins, indie products, or side projects',
  'agency': 'Marketing, dev, or creative agency',
  'consultant': 'Strategic advisory or expert consulting',
  'coach': '1:1 or group coaching',
  'freelancer': 'Solo expertise sold by the project',
  'local-service': 'Clinic, salon, home services, or local trade',
  'productized-service': 'Fixed-scope service offerings',
};

/**
 * Derive ProjectType from UserPersona.
 * SaaS founder + indie maker → product. All other personas → service.
 */
export function personaToProjectType(persona: UserPersona): ProjectType {
  if (persona === 'saas-founder' || persona === 'indie-maker') {
    return 'product';
  }
  return 'service';
}

/**
 * ===== SERVICE TYPE =====
 * Sub-classification of service businesses (for strategy + section selection).
 */
export const serviceTypes = [
  'agency',
  'consultancy',
  'coaching',
  'freelance',
  'productized-service',
  'local-service',
] as const;

export type ServiceType = (typeof serviceTypes)[number];

/**
 * Map UserPersona to a default ServiceType for the service flow.
 * Used to pre-fill spec Step 2 (Understanding).
 */
export function personaToServiceType(persona: UserPersona): ServiceType | null {
  switch (persona) {
    case 'agency':
      return 'agency';
    case 'consultant':
      return 'consultancy';
    case 'coach':
      return 'coaching';
    case 'freelancer':
      return 'freelance';
    case 'local-service':
      return 'local-service';
    case 'productized-service':
      return 'productized-service';
    default:
      return null;
  }
}

/**
 * ===== SERVICE AWARENESS =====
 * Visitor's relationship to the service at landing time.
 */
export const serviceAwarenessStates = [
  'search-aware-cold',
  'search-aware-comparing',
  'referral-driven',
  'relationship-warming',
] as const;

export type ServiceAwareness = (typeof serviceAwarenessStates)[number];

/**
 * ===== SERVICE GOAL =====
 * Primary CTA action for the service landing page.
 */
export const serviceGoals = [
  'book-call',
  'request-quote',
  'apply',
  'download-portfolio',
  'subscribe-newsletter',
] as const;

export type ServiceGoal = (typeof serviceGoals)[number];

export const serviceGoalLabels: Record<ServiceGoal, string> = {
  'book-call': 'Book a discovery call',
  'request-quote': 'Request a quote',
  'apply': 'Apply to work with us',
  'download-portfolio': 'Download portfolio',
  'subscribe-newsletter': 'Get free resource',
};

/**
 * ===== HEARTH PALETTE =====
 * Service-route design system has a fixed family (Hearth) with 9 palettes.
 */
export const hearthPalettes = [
  'terracotta',
  'ochre',
  'rose',
  'moss',
  'sage',
  'plum',
  'indigo',
  'teal',
  'charcoal',
] as const;

export type HearthPalette = (typeof hearthPalettes)[number];

/**
 * ===== STRATEGY OUTPUT =====
 * Service-strategy LLM output shape (skeleton — Phase 2 implements parsing).
 */
export interface ServiceStrategyOutput {
  awareness: ServiceAwareness;

  oneClient: {
    who: string;
    coreDesire: string;
    corePain: string;
    pains: string[];
    desires: string[];
    objections: string[];
  };

  ourPosition: {
    promise: string;
    approach: string;
    credibility: string;
  };

  servicePresentation: {
    format: 'packages' | 'quote-only' | 'hybrid';
    showProcess: boolean;
    showCaseStudies: boolean;
  };

  sectionDecisions: {
    includeTransformation: boolean;
    includeProblem: boolean;
    includeApproach: boolean;
    isHighTouch: boolean;
  };

  uiblockDecisions: {
    // Nullable to match OpenAI structured outputs (optional fields must
    // be `.nullable()`); pilot ignores these — Phase 7+ activates them.
    heroBlock?: string | null;
    servicesBlock?: string | null;
    processBlock?: string | null;
    packagesBlock?: string | null;
    casestudiesBlock?: string | null;
    testimonialsBlock?: string | null;
    ctaBlock?: string | null;
  };
}

/**
 * ===== STRATEGY OUTPUT — ASSEMBLED =====
 * What /api/service/strategy returns to the caller: LLM strategy plus the
 * deterministic section list and uiblock map computed server-side.
 */
export interface ServiceStrategyOutputAssembled extends ServiceStrategyOutput {
  /** Section types in render order (camelCase, matches hearthSectionSurfaces). */
  sections: string[];
  /** Map of sectionType → layout name (e.g., "hero" → "PetalFramedHero"). */
  uiblocks: Record<string, string>;
}

/**
 * ===== STRATEGY INPUT =====
 * Shape /api/service/strategy expects in request body. Mirrors fields that
 * useServiceGenerationStore collects across onboarding pages.
 */
export interface ServiceUnderstandingInput {
  serviceType: ServiceType;
  serviceCategories: string[];
  industries: string[];
  targetClients: string;
  services: string[];
  deliveryModel: 'remote' | 'in-person' | 'hybrid';
}

export interface ServiceAssetInput {
  hasTestimonials: boolean;
  hasClientLogos: boolean;
  hasOutcomes: boolean;
  hasCaseStudies: boolean;
  hasTeamPhotos: boolean;
  hasFounderPhoto: boolean;
  testimonialType: 'text' | 'photos' | 'video' | 'transformation' | null;
}

export interface ServiceStrategyRequestInput {
  oneLiner: string;
  understanding: ServiceUnderstandingInput;
  goal: ServiceGoal;
  offer: string;
  assets: ServiceAssetInput;
  paletteId: HearthPalette;
}
