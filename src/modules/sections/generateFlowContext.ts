import type {
  FlowTone,
  FlowComplexity,
  SectionPurpose,
  PreviousSectionContext,
  NextSectionContext
} from './flowContextTypes';
import type {
  AwarenessLevel,
  ToneProfile,
  MarketSophisticationLevel,
  CopyIntent,
  TargetAudience
} from '@/types/core/index';

// Business context fields needed for flow context generation
export interface FlowContextBusinessContext {
  awarenessLevel?: AwarenessLevel;
  toneProfile?: ToneProfile;
  marketSophisticationLevel?: MarketSophisticationLevel;
  copyIntent?: CopyIntent;
  targetAudience?: TargetAudience;
}

export interface FlowContextInput {
  sections: string[];
  sectionIndex: number;
  businessContext: FlowContextBusinessContext;
}

export interface SectionFlowContext {
  sectionPurpose?: SectionPurpose;
  positionInFlow: number;
  totalSectionsInFlow: number;
  previousSection?: PreviousSectionContext;
  nextSection?: NextSectionContext;
  flowTone: FlowTone;
  flowComplexity: FlowComplexity;
}

// Audience IDs that indicate analytical/technical flow
const TECHNICAL_AUDIENCES = [
  'developers', 'no-code-builders', 'ai-engineers', 'devops-engineers', 'tech-leads',
  'data-engineers', 'security-engineers', 'enterprise-tech-teams', 'enterprise-marketing-teams',
  'it-decision-makers'
] as const;

// Audience IDs that indicate emotional/creator flow
const CREATOR_AUDIENCES = [
  'content-creators', 'youtubers', 'newsletter-writers', 'podcasters', 'online-educators',
  'course-creators', 'coaches-consultants', 'cohort-instructors'
] as const;

/**
 * Determines flow tone (analytical vs emotional) based on business context
 *
 * Analytical: Technical, data-driven, detailed explanations
 * Emotional: Empathetic, story-driven, relatable narratives
 */
export function determineFlowTone(context: FlowContextInput['businessContext']): FlowTone {
  // Analytical indicators (prioritize technical/enterprise)
  const isAnalyticalAudience = context.targetAudience &&
    TECHNICAL_AUDIENCES.includes(context.targetAudience as typeof TECHNICAL_AUDIENCES[number]);

  if (
    isAnalyticalAudience ||
    context.marketSophisticationLevel === 'level-5' ||
    context.toneProfile === 'minimal-technical' ||
    context.toneProfile === 'luxury-expert'
  ) {
    return 'analytical';
  }

  // Emotional indicators (prioritize pain/storytelling)
  const isCreatorAudience = context.targetAudience &&
    CREATOR_AUDIENCES.includes(context.targetAudience as typeof CREATOR_AUDIENCES[number]);

  if (
    context.copyIntent === 'pain-led' ||
    context.toneProfile === 'confident-playful' ||
    context.toneProfile === 'bold-persuasive' ||
    context.awarenessLevel === 'unaware' ||
    context.awarenessLevel === 'problem-aware' ||
    isCreatorAudience
  ) {
    return 'emotional';
  }

  // Default: balanced (mix of both)
  return 'balanced';
}

// Enterprise audience IDs that indicate detailed flow
const ENTERPRISE_AUDIENCES = [
  'enterprise-tech-teams', 'enterprise-marketing-teams', 'it-decision-makers',
  'mid-market-companies'
] as const;

/**
 * Determines flow complexity (simple vs detailed) based on business context and section count
 *
 * Simple: Short flows, high awareness, low sophistication
 * Detailed: Long flows, enterprise, high sophistication
 */
export function determineFlowComplexity(
  context: FlowContextInput['businessContext'],
  totalSections: number
): FlowComplexity {
  // Simple flow indicators
  if (
    totalSections <= 6 ||
    context.awarenessLevel === 'most-aware' ||
    context.marketSophisticationLevel === 'level-1' ||
    context.marketSophisticationLevel === 'level-2'
  ) {
    return 'simple';
  }

  // Detailed flow indicators
  const isEnterpriseAudience = context.targetAudience &&
    ENTERPRISE_AUDIENCES.includes(context.targetAudience as typeof ENTERPRISE_AUDIENCES[number]);

  if (
    totalSections >= 10 ||
    context.marketSophisticationLevel === 'level-5' ||
    isEnterpriseAudience ||
    context.marketSophisticationLevel === 'level-4'
  ) {
    return 'detailed';
  }

  // Default: moderate (balanced complexity)
  return 'moderate';
}

/**
 * Infers section purpose based on section type
 * Maps section IDs to their role in the objection flow
 */
export function inferSectionPurpose(sectionId: string): SectionPurpose | undefined {
  const purposeMap: Record<string, SectionPurpose> = {
    'hero': 'identify-problem',
    'problem': 'agitate-pain',
    'beforeAfter': 'show-solution',
    'features': 'show-solution',
    'howItWorks': 'educate',
    'uniqueMechanism': 'differentiate',
    'results': 'prove',
    'testimonials': 'prove',
    'socialProof': 'prove',
    'comparison': 'differentiate',
    'useCases': 'show-solution',
    'pricing': 'close',
    'objectionHandling': 'close',
    'faq': 'educate',
    'integrations': 'show-solution',
    'security': 'prove',
    'founderNote': 'prove',
    'cta': 'close',
    'closeSection': 'close',
  };

  return purposeMap[sectionId];
}

/**
 * Maps section ID to section type for previous/next context
 * Uses the canonical section types from flowContextTypes
 */
function mapSectionType(sectionId: string): PreviousSectionContext['type'] {
  const typeMap: Record<string, PreviousSectionContext['type']> = {
    'hero': 'hero',
    'problem': 'problem',
    'beforeAfter': 'beforeAfter',
    'features': 'features',
    'howItWorks': 'howItWorks',
    'uniqueMechanism': 'uniqueMechanism',
    'results': 'results',
    'testimonials': 'testimonial',
    'socialProof': 'socialProof',
    'comparison': 'comparison',
    'useCases': 'useCase',
    'pricing': 'pricing',
    'objectionHandling': 'objectionHandling',
    'faq': 'faq',
    'integrations': 'integration',
    'security': 'security',
    'founderNote': 'founderNote',
    'cta': 'cta',
    'closeSection': 'close',
  };

  return typeMap[sectionId] || 'features'; // Fallback to features
}

/**
 * Generates complete flow context for a section at a specific position
 *
 * This is the main function that orchestrates flow context generation.
 * It combines position, sequence, tone, and complexity into a single context object.
 *
 * @param input - Section list, current index, and business context
 * @returns Complete flow context for the section
 */
export function generateFlowContext(input: FlowContextInput): SectionFlowContext {
  const { sections, sectionIndex, businessContext } = input;
  const currentSection = sections[sectionIndex];

  // Determine flow characteristics
  const flowTone = determineFlowTone(businessContext);
  const flowComplexity = determineFlowComplexity(businessContext, sections.length);

  // Build previous section context
  const previousSection: PreviousSectionContext | undefined =
    sectionIndex > 0
      ? {
          type: mapSectionType(sections[sectionIndex - 1]),
          layout: undefined, // Layout not available at generation time
        }
      : undefined;

  // Build next section context
  const nextSection: NextSectionContext | undefined =
    sectionIndex < sections.length - 1
      ? {
          type: mapSectionType(sections[sectionIndex + 1]),
        }
      : undefined;

  return {
    sectionPurpose: inferSectionPurpose(currentSection),
    positionInFlow: sectionIndex + 1, // 1-indexed for readability
    totalSectionsInFlow: sections.length,
    previousSection,
    nextSection,
    flowTone,
    flowComplexity,
  };
}
