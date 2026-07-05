// src/types/service.ts
// Service-route types - Phase 0 foundation
// Reference: docs/architecture/newServiceOnboarding.md, docs/tracks/nsoPlan.md

import { meridianPalettes, techPremiumPalettes, vestriaPalettes } from '@/types/product';

/**
 * ===== AUDIENCE TYPE =====
 * Top tier of the 3-tier model: audienceType → templateId → variantId + paletteId.
 * `ecommerce` reserved for the Phase 13 wave (no persona maps to it yet).
 */
// `writer` = the Writer vertical (Hindi literary profile sites; Granth template).
// First-class audience per docs/tracks/writerFlownTemplate.md §1, but v1 has NO generation
// store / strategy / onboarding route — writer projects are seeded white-glove and
// render through the template module (usesTemplateModule returns true below).
export const audienceTypes = ['product', 'service', 'ecommerce', 'writer'] as const;
export type AudienceType = (typeof audienceTypes)[number];

/**
 * ===== TEMPLATE + VARIANT =====
 * templateId selects the visual template module. Hearth = service line;
 * Meridian = first product template (Meridian migration P0).
 * variantId is a per-template token rescale (Hearth: 'classic' default;
 * Meridian: developer/marketing/light — see types/product.ts).
 */
// `lumen` = bespoke §13 photography template (Kundius). Registered + renderable
// but intentionally NOT listed in the onboarding picker (templateCatalog) — same
// pattern as meridian/techpremium. Service audience.
// `granth` = bespoke §13 Hindi-literary template (Writer vertical). Registered +
// renderable but intentionally NOT in the onboarding picker (templateCatalog) —
// same pattern as lumen/meridian/techpremium. Writer audience.
// `vestria` = GA product template (B2B manufacturing / trade lead-gen; pilot:
// Golden Shadow Trading). Registered + renderable; product has no picker yet —
// selected via the onboarding `?template=vestria` param OR by default for the
// `manufacturer` persona. Open to all users (no admin gate).
export const templateIds = ['hearth', 'lex', 'surge', 'meridian', 'techpremium', 'lumen', 'granth', 'vestria'] as const;
export type TemplateId = (typeof templateIds)[number];

export type VariantId = string;

/** First (default) variant per template. Persisted on save until Phase 11 UI. */
export const defaultVariantForTemplate: Record<TemplateId, VariantId> = {
  hearth: 'classic',
  lex: 'statesman',
  surge: 'performance',
  meridian: 'developer',
  techpremium: 'default',
  lumen: 'default',
  granth: 'granth', // serif-led (Tiro) default; 'adhunik' = sans-led (Mukta) alt
  vestria: 'tailored',
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
  writer: 'granth',
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
    audienceType === 'writer' ||
    (audienceType === 'product' &&
      (templateId === 'meridian' || templateId === 'techpremium' || templateId === 'vestria'))
  );
}

/**
 * ===== USER PERSONA =====
 * Captured once at user level. Drives AudienceType derivation.
 */
export const userPersonas = [
  'saas-founder',
  'indie-maker',
  'hardware-founder',
  'manufacturer',
  'agency',
  'consultant',
  'coach',
  'freelancer',
  'local-service',
  'productized-service',
  'writer',
] as const;

export type UserPersona = (typeof userPersonas)[number];

export const userPersonaLabels: Record<UserPersona, string> = {
  'saas-founder': 'SaaS / app founder',
  'indie-maker': 'Indie maker',
  'hardware-founder': 'Hardware / connected-product founder',
  'manufacturer': 'Manufacturer / trade supplier',
  'agency': 'Agency owner',
  'consultant': 'Consultant / advisor',
  'coach': 'Coach',
  'freelancer': 'Freelancer / solo expert',
  'local-service': 'Local service owner',
  'productized-service': 'Productized service operator',
  'writer': 'Writer / author',
};

export const userPersonaDescriptions: Record<UserPersona, string> = {
  'saas-founder': 'Building a SaaS, app, or web tool',
  'indie-maker': 'Shipping plugins, indie products, or side projects',
  'hardware-founder': 'Building a physical, IoT, or connected hardware product',
  'manufacturer': 'B2B manufacturing, industrial, or trade supply — quote / lead-gen',
  'agency': 'Marketing, dev, or creative agency',
  'consultant': 'Strategic advisory or expert consulting',
  'coach': '1:1 or group coaching',
  'freelancer': 'Solo expertise sold by the project',
  'local-service': 'Clinic, salon, home services, or local trade',
  'productized-service': 'Fixed-scope service offerings',
  'writer': 'Author, poet, or essayist — a literary profile site',
};

/**
 * Derive AudienceType from UserPersona.
 * SaaS founder + indie maker + hardware founder → product. All others → service.
 * (ecommerce has no persona yet — added in the Phase 13 ecom wave.)
 */
export function personaToAudienceType(persona: UserPersona): AudienceType {
  if (
    persona === 'saas-founder' ||
    persona === 'indie-maker' ||
    persona === 'hardware-founder' ||
    persona === 'manufacturer'
  ) {
    return 'product';
  }
  if (persona === 'writer') {
    return 'writer';
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
 * ===== SURGE PALETTE =====
 * Surge (template #3, growth & performance marketing) ships 9 accent-hue
 * palettes. The palette knob swaps ONLY the accent hue (--h / --accent); the
 * cool-slate base + held green/red chart semantics never move.
 * Source: Surge - Growth & Performance Marketing.html.
 */
export const surgePalettes = [
  'volt',
  'azure',
  'cyan',
  'teal',
  'violet',
  'magenta',
  'coral',
  'amber',
  'lime',
] as const;

export type SurgePalette = (typeof surgePalettes)[number];

/**
 * ===== LUMEN PALETTE =====
 * Lumen (bespoke §13 photography template) ships a SINGLE brass accent — the one
 * user-facing hue knob per the Lumen HTML §09. Source: Lumen - Photography & Creative.html.
 */
export const lumenPalettes = ['brass'] as const;

export type LumenPalette = (typeof lumenPalettes)[number];

/**
 * ===== GRANTH PALETTE =====
 * Granth (bespoke §13 Hindi-literary template, Writer vertical) ships a small
 * palette family designed for growth: `sinduri` (ivory paper + maroon accent,
 * default) and `neel` (cool grey + deep blue). More may be added later (e.g.
 * `van` forest-green) like the hearth/lex families. Source: template-design/WRDirection1Granth.html.
 */
export const granthPalettes = ['sinduri', 'neel'] as const;

export type GranthPalette = (typeof granthPalettes)[number];

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
  surge: 'Surge',
  meridian: 'Meridian',
  techpremium: 'TechPremium',
  lumen: 'Lumen',
  granth: 'Granth',
  vestria: 'Vestria',
};

export const templateBlurbs: Record<TemplateId, string> = {
  hearth: 'Warm, editorial — cream surfaces, serif accents.',
  lex: 'Trust & professional — serif authority, cool document surfaces.',
  surge: 'Growth & performance — dashboard hero, metric-led case studies.',
  meridian: 'Modern tech — dark surfaces, hairline rules, mono accents.',
  techpremium: 'Industrial IoT — warm paper, forest + signal-lime, control-room readouts.',
  lumen: 'Photography & creative — warm gallery, one brass accent, editorial captions + lightbox.',
  granth: 'Hindi literary — ivory paper, maroon accent, Devanagari-first.',
  vestria: 'Manufacturing & trade — editorial paper, dark bands, cobalt accent, quote-led.',
};

/** Palette id list for a template (Hearth → 9 warm, Lex → 9 trust, Surge → 9 accent-hue, Meridian → 9 accent, TechPremium → forest). */
export function palettesForTemplate(templateId: TemplateId): readonly string[] {
  if (templateId === 'lex') return lexPalettes;
  if (templateId === 'surge') return surgePalettes;
  if (templateId === 'meridian') return meridianPalettes;
  if (templateId === 'techpremium') return techPremiumPalettes;
  if (templateId === 'lumen') return lumenPalettes;
  if (templateId === 'granth') return granthPalettes;
  if (templateId === 'vestria') return vestriaPalettes;
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
  whatYouDo: string;
  services: string[];
  targetClients: string[];
  outcomes: string[];
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
