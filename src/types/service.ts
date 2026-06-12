// src/types/service.ts
// Service-route types - Phase 0 foundation
// Reference: newServiceOnboarding.md, nsoPlan.md

import { meridianPalettes } from '@/types/product';

/**
 * ===== AUDIENCE TYPE =====
 * Top tier of the 3-tier model: audienceType → templateId → variantId + paletteId.
 * `ecommerce` reserved for the Phase 13 wave (no persona maps to it yet).
 */
export const audienceTypes = ['product', 'service', 'ecommerce'] as const;
export type AudienceType = (typeof audienceTypes)[number];

/**
 * ===== TEMPLATE + VARIANT =====
 * templateId selects the visual template module. Hearth = service line;
 * Meridian = first product template (Meridian migration P0).
 * variantId is a per-template token rescale (Hearth: 'classic' default;
 * Meridian: developer/marketing/light — see types/product.ts).
 */
export const templateIds = ['hearth', 'lex', 'meridian'] as const;
export type TemplateId = (typeof templateIds)[number];

export type VariantId = string;

/** First (default) variant per template. Persisted on save until Phase 11 UI. */
export const defaultVariantForTemplate: Record<TemplateId, VariantId> = {
  hearth: 'classic',
  lex: 'statesman',
  meridian: 'developer',
};

/**
 * Default template per audienceType — the cutover target for each line.
 * DEFINED ONLY: the render gate still keys on `audienceType === 'service'`, so
 * product keeps rendering the legacy 47 UIBlocks until the Meridian cutover
 * (P4) flips dispatch. Not yet imported by any getComponent path.
 */
export const defaultTemplateForAudience: Record<AudienceType, TemplateId | null> = {
  product: 'meridian',
  service: 'hearth',
  ecommerce: null,
};

/**
 * Single source of truth for the render gate: does this (audienceType, templateId)
 * pair render through a template module (templates/<id>/*) rather than the legacy
 * 47-UIBlock path? Service always does (Hearth). Product does ONLY when its
 * templateId is explicitly 'meridian' (the Meridian cutover, P4).
 *
 * STRICT on purpose: legacy `/create` product drafts carry templateId=null + 47-block
 * content and must keep rendering via legacy until /create is archived (P5). Never
 * synthesize a default templateId at a gate site — gate on the stored value only.
 */
export function usesTemplateModule(
  audienceType: AudienceType | string | null | undefined,
  templateId: string | null | undefined
): boolean {
  return (
    audienceType === 'service' ||
    (audienceType === 'product' && templateId === 'meridian')
  );
}

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
  'lead-magnet',
  'apply',
  'download-portfolio',
  'subscribe-newsletter',
] as const;

export type ServiceGoal = (typeof serviceGoals)[number];

export const serviceGoalLabels: Record<ServiceGoal, string> = {
  'book-call': 'Book a discovery call',
  'request-quote': 'Request a quote',
  'lead-magnet': 'Get the free resource',
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
 * ===== LEX PALETTE =====
 * Lex (template #2, trust/professional) ships its own 9-palette family.
 * Each palette is a (trust hue + accent) pair; default is `counsel` (navy + gold).
 */
export const lexPalettes = [
  'counsel',
  'heritage',
  'forest',
  'slate',
  'vellum',
  'burgundy',
  'pacific',
  'court',
  'trust',
] as const;

export type LexPalette = (typeof lexPalettes)[number];

/**
 * ===== TEMPLATE PICKER METADATA =====
 * Leaf-level display data + palette scoping for the Phase 11b picker. Kept here
 * (NOT importing the template modules) so onboarding/editor pickers can scope by
 * template without pulling a template's block chunk. Swatch colors + variant
 * labels come from the loaded TemplateModule (firewall: editor reads via
 * getLoadedTemplate, never a static template import).
 */
export const templateLabels: Record<TemplateId, string> = {
  hearth: 'Hearth',
  lex: 'Lex',
  meridian: 'Meridian',
};

export const templateBlurbs: Record<TemplateId, string> = {
  hearth: 'Warm, editorial — cream surfaces, serif accents.',
  lex: 'Trust & professional — serif authority, cool document surfaces.',
  meridian: 'Modern tech — dark surfaces, hairline rules, mono accents.',
};

/** Palette id list for a template (Hearth → 9 warm, Lex → 9 trust, Meridian → 9 accent). */
export function palettesForTemplate(templateId: TemplateId): readonly string[] {
  if (templateId === 'lex') return lexPalettes;
  if (templateId === 'meridian') return meridianPalettes;
  return hearthPalettes;
}

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
 * What /api/audience/service/strategy returns to the caller: LLM strategy plus the
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
 * Shape /api/audience/service/strategy expects in request body. Mirrors fields that
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
