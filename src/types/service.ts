// src/types/service.ts
// Service-route types - Phase 0 foundation
// Reference: newServiceOnboarding.md, nsoPlan.md

/**
 * ===== AUDIENCE TYPE =====
 * Top tier of the 3-tier model: audienceType → templateId → variantId + paletteId.
 * `ecommerce` reserved for the Phase 13 wave (no persona maps to it yet).
 */
export const audienceTypes = ['product', 'service', 'ecommerce'] as const;
export type AudienceType = (typeof audienceTypes)[number];

/**
 * ===== TEMPLATE + VARIANT =====
 * templateId selects the visual template module (Phase 7.5 only ships Hearth).
 * variantId is a per-template token rescale (surfaced in Phase 11; default now).
 */
export const templateIds = ['hearth'] as const;
export type TemplateId = (typeof templateIds)[number];

export type VariantId = string;

/** First (default) variant per template. Persisted on save until Phase 11 UI. */
export const defaultVariantForTemplate: Record<TemplateId, VariantId> = {
  hearth: 'classic',
};

/**
 * ===== USER PERSONA =====
 * Captured once at user level. Drives AudienceType derivation.
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
 * Derive AudienceType from UserPersona.
 * SaaS founder + indie maker → product. All other personas → service.
 * (ecommerce has no persona yet — added in the Phase 13 ecom wave.)
 */
export function personaToAudienceType(persona: UserPersona): AudienceType {
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
