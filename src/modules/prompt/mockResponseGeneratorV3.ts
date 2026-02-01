/**
 * V3 Mock Response Generators
 * Generates realistic mock data for V3 strategy and copy endpoints
 */

import { logger } from '@/lib/logger';
import { generateMockFromSchema } from '@/app/dev/uiblock/_lib/mockDataGenerator';
import type { SimplifiedStrategyOutput, LandingGoal, SectionType, Vibe } from '@/types/generation';

// Type for strategy request input
interface StrategyV3Input {
  productName: string;
  oneLiner: string;
  features: string[];
  landingGoal: LandingGoal;
  offer: string;
  primaryAudience: string;
  otherAudiences?: string[];
  categories?: string[];
  hasTestimonials: boolean;
  hasSocialProof: boolean;
  hasConcreteResults: boolean;
  hasDemoVideo?: boolean;
  hasMultipleAudiences?: boolean;
}

// Vibe options for random selection based on context
const vibeOptions: Vibe[] = ['Dark Tech', 'Light Trust', 'Warm Friendly', 'Bold Energy', 'Calm Minimal'];

/**
 * Generate mock V3 strategy response
 */
export function generateMockStrategyV3(input: StrategyV3Input): SimplifiedStrategyOutput {
  logger.debug('[MockV3] Generating mock strategy for:', input.productName);

  // Determine vibe based on categories/context
  let vibe: Vibe = 'Light Trust';
  const categories = input.categories?.join(' ').toLowerCase() || '';
  if (categories.includes('tech') || categories.includes('ai') || categories.includes('dev')) {
    vibe = 'Dark Tech';
  } else if (categories.includes('health') || categories.includes('wellness')) {
    vibe = 'Warm Friendly';
  } else if (categories.includes('startup') || categories.includes('growth')) {
    vibe = 'Bold Energy';
  } else if (categories.includes('enterprise') || categories.includes('finance')) {
    vibe = 'Calm Minimal';
  }

  // Build sections based on assets and goal
  const sections: SectionType[] = ['Header', 'Hero'];

  // Add Problem for cold awareness
  sections.push('Problem');

  // Add Features always
  sections.push('Features');

  // Add HowItWorks
  sections.push('HowItWorks');

  // Add trust sections based on availability
  if (input.hasConcreteResults) sections.push('Results');
  if (input.hasTestimonials) sections.push('Testimonials');
  if (input.hasSocialProof) sections.push('SocialProof');

  // Add Pricing if not waitlist
  if (input.landingGoal !== 'waitlist') {
    sections.push('Pricing');
  }

  // Add FAQ and CTA
  sections.push('FAQ');
  sections.push('CTA');
  sections.push('Footer');

  // Build UIBlocks map (Hero uses camelCase per componentRegistry)
  const uiblocks: Record<string, string> = {
    Header: 'MinimalNavHeader',
    Hero: 'leftCopyRightImage',
    Problem: 'StackedPainBullets',
    Features: 'IconGrid',
    HowItWorks: input.hasDemoVideo ? 'VideoWalkthrough' : 'ThreeStepHorizontal',
    Testimonials: 'QuoteGrid',
    SocialProof: 'LogoWall',
    Results: 'StatBlocks',
    Pricing: 'TierCards',
    FAQ: 'InlineQnAList',
    CTA: 'CenteredHeadlineCTA',
    Footer: 'ContactFooter',
  };

  // Generate feature analysis from input features
  const featureAnalysis = input.features.slice(0, 6).map((feature, i) => ({
    feature,
    benefit: `${feature} helps you work smarter and faster`,
    benefitOfBenefit: 'Spend more time on what matters most',
  }));

  const strategy: SimplifiedStrategyOutput = {
    awareness: 'solution-aware-skeptical',

    oneReader: {
      personaDescription: `${input.primaryAudience} looking for ${input.oneLiner.toLowerCase()}`,
      pain: [
        'Wasting time on manual processes',
        'Struggling to scale operations',
        'Missing growth opportunities',
      ],
      desire: [
        'Automate repetitive tasks',
        'Scale without adding headcount',
        'Focus on strategic work',
      ],
      objections: [
        'Is it secure enough?',
        'Will my team actually use it?',
        'What if it doesn\'t work for my use case?',
      ],
    },

    oneIdea: {
      bigBenefit: `Transform how you handle ${input.oneLiner.split(' ').slice(0, 3).join(' ')}`,
      uniqueMechanism: 'AI-powered automation that learns your patterns',
      reasonToBelieve: '10,000+ professionals trust our platform daily',
    },

    vibe,

    featureAnalysis,

    sectionDecisions: {
      includeBeforeAfter: false,
      includeUniqueMechanism: true,
      includeObjectionHandle: false,
      isB2B: input.hasMultipleAudiences || false,
    },

    uiblockDecisions: {
      productType: 'visual-ui-supports',
      featuresUIBlock: 'IconGrid',
      uniqueMechanismUIBlock: 'SecretSauceReveal',
      pricingUIBlock: 'TierCards',
      objectionHandleUIBlock: 'VisualObjectionTiles',
      faqQuestionCount: 6,
      useCasesAudienceType: 'role',
    },

    sections,
    uiblocks,
  };

  logger.debug('[MockV3] Generated strategy with sections:', sections);
  return strategy;
}

/**
 * Generate mock V3 copy response
 * Uses the existing mockDataGenerator for realistic UIBlock data
 */
export function generateMockCopyV3(
  strategy: SimplifiedStrategyOutput,
  uiblocks: Record<string, string>,
  productContext?: {
    productName?: string;
    oneLiner?: string;
    offer?: string;
  }
): Record<string, Record<string, any>> {
  logger.debug('[MockV3] Generating mock copy for sections:', Object.keys(uiblocks));

  const sections: Record<string, Record<string, any>> = {};

  // Generate mock data for each section using the UIBlock's schema
  for (const [sectionType, uiblockName] of Object.entries(uiblocks)) {
    try {
      // Use the existing comprehensive mock data generator
      const mockData = generateMockFromSchema(uiblockName);

      // Customize some fields with product context if available
      if (productContext?.productName && mockData.headline) {
        // Keep the mock headline but could customize if needed
      }

      sections[sectionType] = { elements: mockData };
      logger.debug(`[MockV3] Generated mock for ${sectionType} (${uiblockName})`);
    } catch (error) {
      logger.warn(`[MockV3] Failed to generate mock for ${sectionType}:`, error);
      // Provide minimal fallback
      sections[sectionType] = {
        elements: {
          headline: `${sectionType} Section`,
          subheadline: 'Sample content for this section',
        },
      };
    }
  }

  return sections;
}
