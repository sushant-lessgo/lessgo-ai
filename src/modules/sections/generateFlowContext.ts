import type {
  FlowTone,
  FlowComplexity,
  SectionPurpose,
  PreviousSectionContext,
  NextSectionContext
} from './flowContextTypes';
import type { LayoutPickerInput } from './layoutPickerInput';

export interface FlowContextInput {
  sections: string[];
  sectionIndex: number;
  businessContext: Pick<LayoutPickerInput,
    'awarenessLevel' |
    'toneProfile' |
    'marketSophisticationLevel' |
    'copyIntent' |
    'targetAudience'
  >;
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

/**
 * Determines flow tone (analytical vs emotional) based on business context
 *
 * Analytical: Technical, data-driven, detailed explanations
 * Emotional: Empathetic, story-driven, relatable narratives
 */
export function determineFlowTone(context: FlowContextInput['businessContext']): FlowTone {
  // Analytical indicators (prioritize technical/enterprise)
  if (
    context.targetAudience === 'builders' ||
    context.targetAudience === 'enterprise' ||
    context.marketSophisticationLevel === 'level-5' ||
    context.toneProfile === 'minimal-technical' ||
    context.toneProfile === 'luxury-expert'
  ) {
    return 'analytical';
  }

  // Emotional indicators (prioritize pain/storytelling)
  if (
    context.copyIntent === 'pain-led' ||
    context.toneProfile === 'confident-playful' ||
    context.toneProfile === 'bold-persuasive' ||
    context.awarenessLevel === 'unaware' ||
    context.awarenessLevel === 'problem-aware' ||
    context.targetAudience === 'creators'
  ) {
    return 'emotional';
  }

  // Default: balanced (mix of both)
  return 'balanced';
}

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
  if (
    totalSections >= 10 ||
    context.marketSophisticationLevel === 'level-5' ||
    context.targetAudience === 'enterprise' ||
    context.marketSophisticationLevel === 'level-4'
  ) {
    return 'detailed';
  }

  // Default: balanced
  return 'balanced';
}

/**
 * Infers section purpose based on section type
 * Maps section IDs to their role in the objection flow
 */
export function inferSectionPurpose(sectionId: string): SectionPurpose | undefined {
  const purposeMap: Record<string, SectionPurpose> = {
    'hero': 'hook',
    'problem': 'agitate',
    'beforeAfter': 'contrast',
    'features': 'demonstrate',
    'howItWorks': 'educate',
    'uniqueMechanism': 'differentiate',
    'results': 'prove',
    'testimonials': 'validate',
    'socialProof': 'validate',
    'comparison': 'differentiate',
    'useCases': 'demonstrate',
    'pricing': 'offer',
    'objectionHandling': 'reassure',
    'faq': 'reassure',
    'integrations': 'demonstrate',
    'security': 'reassure',
    'founderNote': 'validate',
    'cta': 'convert',
    'closeSection': 'convert',
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
