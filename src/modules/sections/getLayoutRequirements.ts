// getLayoutRequirements.ts - Extract card requirements for selected layouts
import type {
  PageLayoutRequirements,
  LayoutRequirement,
  SectionTypeMapping
} from '@/types/layoutTypes';
import { layoutElementSchema, getCardRequirements } from './layoutElementSchema';
import { logger } from '@/lib/logger';

/**
 * Section type mapping is no longer needed as we use layout names directly
 * with the unified schema. Layout names are the keys in layoutElementSchema.
 */

/**
 * Maps generic section types from strategy to actual UIBlock section types
 * Updated with correct UIBlock component names from comprehensive registry
 */
export const genericToUIBlockMapping: SectionTypeMapping = {
  features: {
    sectionId: 'features',
    layoutName: 'IconGrid'  // Updated: IconGrid is the primary features UIBlock
  },
  testimonials: {
    sectionId: 'testimonials',
    layoutName: 'BeforeAfterQuote'  // Confirmed: exists in Testimonials section
  },
  comparison: {
    sectionId: 'comparisonTable',
    layoutName: 'YouVsThemHighlight'  // Confirmed: exists in Comparison section
  },
  faq: {
    sectionId: 'faq',
    layoutName: 'InlineQnAList'  // Confirmed: exists in FAQ section
  },
  results: {
    sectionId: 'results',
    layoutName: 'StatBlocks'  // Confirmed: exists in Results section
  },
  social_proof: {
    sectionId: 'socialProof',
    layoutName: 'StackedStats'  // Updated: StackedStats instead of LogoWall for better metrics display
  },
  pricing: {
    sectionId: 'pricing',
    layoutName: 'TierCards'  // Confirmed: exists in Pricing section
  },
  problem: {
    sectionId: 'problem',
    layoutName: 'StackedPainBullets'  // Confirmed: exists in Problem section
  },
  uniqueMechanism: {
    sectionId: 'uniqueMechanism',
    layoutName: 'StackedHighlights'  // Added: Critical for debug log fixes
  }
};

/**
 * Normalization is no longer needed as we work directly with layout names
 * from the unified schema
 */

/**
 * Validates if a layout exists in the unified schema
 * @param layoutName Layout name to validate
 * @returns True if layout exists in schema
 */
function validateLayout(layoutName: string): boolean {
  return layoutName in layoutElementSchema;
}

/**
 * Extracts card requirements for all selected layouts on a page
 * @param sections Array of section IDs
 * @param sectionLayouts Map of section ID to selected layout name
 * @param userFeatureCount Number of user-provided features
 * @returns Page layout requirements with card constraints
 */
export function getLayoutRequirements(
  sections: string[],
  sectionLayouts: Record<string, string>,
  userFeatureCount?: number
): PageLayoutRequirements {
  const requirements: LayoutRequirement[] = [];

  logger.debug('🎯 Extracting layout requirements:', {
    sections,
    sectionLayouts,
    userFeatureCount
  });

  sections.forEach(originalSectionId => {
    const layoutName = sectionLayouts[originalSectionId];
    if (!layoutName) {
      logger.warn(`❌ No layout found for section: ${originalSectionId}`);
      return;
    }

    // Validate layout exists in unified schema
    if (!validateLayout(layoutName)) {
      logger.error(`❌ Layout '${layoutName}' not found in layoutElementSchema`);
      logger.debug('Available layouts:', Object.keys(layoutElementSchema));
      return;
    }

    // Get card requirements for this layout from unified schema
    const schema = layoutElementSchema[layoutName];
    const cardRequirements = getCardRequirements(schema);

    if (cardRequirements) {
      requirements.push({
        sectionId: originalSectionId, // Keep original section ID for consistency
        sectionType: originalSectionId, // Use section ID as type for simplicity
        layoutName,
        cardRequirements: cardRequirements as any
      });

      logger.debug(`📋 Section ${originalSectionId} (${layoutName}):`, {
        type: cardRequirements.type,
        min: cardRequirements.min,
        max: cardRequirements.max,
        optimal: cardRequirements.optimal
      });
    } else {
      // Some layouts don't have card requirements (e.g., Hero, CTA)
      logger.debug(`ℹ️ Section ${originalSectionId} (${layoutName}) has no card requirements`);

      // Still add to requirements for completeness
      requirements.push({
        sectionId: originalSectionId,
        sectionType: originalSectionId, // Use section ID as type for simplicity
        layoutName,
        cardRequirements: cardRequirements as any
      });
    }
  });

  const pageRequirements: PageLayoutRequirements = {
    sections: requirements,
    userProvidedFeatures: userFeatureCount
  };

  logger.debug('✅ Layout requirements extracted:', {
    totalSections: requirements.length,
    sectionsWithRequirements: requirements.filter(r => r.cardRequirements).length,
    userFeatureCount
  });

  return pageRequirements;
}

/**
 * Maps the card counts from AI strategy to actual UIBlock sections
 * Enhanced to support all 21 sections in comprehensive registry
 * @param strategyCounts Card counts from AI strategy (generic types)
 * @param layoutRequirements Actual page layout requirements
 * @returns Mapped card counts for each UIBlock
 */
export function mapStrategyToUIBlocks(
  strategyCounts: Record<string, number>,
  layoutRequirements: PageLayoutRequirements
): Record<string, number> {
  const mappedCounts: Record<string, number> = {};

  logger.debug('🎯 Mapping strategy counts to UIBlocks:', {
    strategyCounts,
    sectionsCount: layoutRequirements.sections.length
  });

  // First, map based on actual layout requirements
  layoutRequirements.sections.forEach(req => {
    const { sectionId, sectionType, layoutName, cardRequirements } = req;

    // Try to find a matching count from strategy using comprehensive mapping
    let strategyCount: number | undefined;

    // Core direct mappings (from AI strategy)
    if (sectionId === 'features' && strategyCounts.features !== undefined) {
      strategyCount = strategyCounts.features;
    } else if (sectionId === 'testimonials' && strategyCounts.testimonials !== undefined) {
      strategyCount = strategyCounts.testimonials;
    } else if (sectionId === 'faq' && strategyCounts.faq !== undefined) {
      strategyCount = strategyCounts.faq;
    } else if (sectionId === 'results' && strategyCounts.results !== undefined) {
      strategyCount = strategyCounts.results;
    } else if (sectionId === 'pricing' && strategyCounts.pricing !== undefined) {
      strategyCount = strategyCounts.pricing;
    } else if (sectionId === 'problem' && strategyCounts.problem !== undefined) {
      strategyCount = strategyCounts.problem;

    // Mapped sections (different naming between strategy and sections)
    } else if ((sectionId === 'comparisonTable' || sectionId === 'comparison') && strategyCounts.comparison !== undefined) {
      strategyCount = strategyCounts.comparison;
    } else if (sectionId === 'socialProof' && strategyCounts.social_proof !== undefined) {
      strategyCount = strategyCounts.social_proof;
    } else if (sectionId === 'uniqueMechanism' && strategyCounts.uniqueMechanism !== undefined) {
      strategyCount = strategyCounts.uniqueMechanism;

    // Special handling for uniqueMechanism - use strategy count or default
    } else if (sectionId === 'uniqueMechanism') {
      // Try various strategy key formats for uniqueMechanism
      strategyCount = strategyCounts.uniqueMechanism || strategyCounts.unique_mechanism || 3;

    // Additional sections with intelligent defaults based on section type
    } else if (sectionId === 'objectionHandling') {
      // Map objection handling to problem-solving strategies
      strategyCount = strategyCounts.objection_handling || strategyCounts.problem || 4;
    } else if (sectionId === 'beforeAfter') {
      // Map before/after to results or testimonials
      strategyCount = strategyCounts.before_after || strategyCounts.results || strategyCounts.testimonials || 3;
    } else if (sectionId === 'howItWorks') {
      // Map how it works to process explanations - check both camelCase and snake_case
      strategyCount = strategyCounts.howItWorks || strategyCounts.how_it_works || strategyCounts.features || 3;
    } else if (sectionId === 'close') {
      // Map close sections to CTA-related strategy
      strategyCount = strategyCounts.close || strategyCounts.cta || 1;
    } else if (sectionId === 'security') {
      // Map security to features or trust-building
      strategyCount = strategyCounts.security || strategyCounts.features || strategyCounts.social_proof || 4;
    } else if (sectionId === 'integration') {
      // Map integration to features or partnerships
      strategyCount = strategyCounts.integration || strategyCounts.features || 6;
    } else if (sectionId === 'useCase') {
      // Map use cases to features or examples
      strategyCount = strategyCounts.use_case || strategyCounts.features || strategyCounts.testimonials || 4;
    } else if (sectionId === 'founderNote') {
      // Map founder note to testimonials or trust-building
      strategyCount = strategyCounts.founder_note || strategyCounts.testimonials || strategyCounts.social_proof || 1;

    // Layout sections typically don't need card counts (Hero, Header, Footer, CTA)
    } else if (['hero', 'header', 'footer', 'cta', 'primaryCTA'].includes(sectionId)) {
      // These sections typically have fixed layouts, skip card counting
      logger.debug(`ℹ️ Skipping card count for layout section: ${sectionId}`);
      return;

    // Fallback: use optimal range midpoint if no strategy count found
    } else if (cardRequirements) {
      const optimal = cardRequirements.optimal;
      strategyCount = Math.round((optimal[0] + optimal[1]) / 2);
      logger.debug(`🔄 Using optimal midpoint for unmapped section ${sectionId}: ${strategyCount}`);
    }

    if (strategyCount !== undefined && cardRequirements) {
      // Apply constraints from card requirements
      let constrainedCount = Math.max(
        cardRequirements.min,
        Math.min(cardRequirements.max, strategyCount)
      );

      // Enhanced feature priority system - respect user content when specified
      if (cardRequirements.respectUserContent && layoutRequirements.userProvidedFeatures) {
        const userFeatureCount = layoutRequirements.userProvidedFeatures;

        // Ensure we have at least as many cards as user-provided features
        constrainedCount = Math.max(constrainedCount, userFeatureCount);

        // But still respect the maximum limit of the UIBlock
        constrainedCount = Math.min(constrainedCount, cardRequirements.max);

        logger.debug(`Applied feature priority: user=${userFeatureCount}, strategy=${strategyCount}, final=${constrainedCount}`);
      }

      mappedCounts[`${sectionId}_${layoutName}`] = constrainedCount;

      logger.debug(`Mapped ${sectionId}: strategy=${strategyCount} → constrained=${constrainedCount}`);
    } else if (cardRequirements) {
      logger.warn(`❌ No strategy count found for section ${sectionId} (${sectionType}.${layoutName})`);
    }
  });

  logger.debug('✅ Strategy mapping completed:', {
    mappedSections: Object.keys(mappedCounts).length,
    mappedCounts
  });

  return mappedCounts;
}

/**
 * Creates a summary of layout requirements for the strategy prompt
 */
export function summarizeRequirementsForPrompt(
  requirements: PageLayoutRequirements
): string {
  const sections = requirements.sections
    .filter(req => req.cardRequirements)
    .map(req => {
      const { sectionId, layoutName, cardRequirements } = req;
      return `- ${layoutName} (${sectionId}): Needs ${cardRequirements.min}-${cardRequirements.max} ${cardRequirements.type} (optimal: ${cardRequirements.optimal.join('-')}). ${cardRequirements.description}`;
    });

  let summary = `ACTUAL SECTIONS WITH CARD REQUIREMENTS:\n${sections.join('\n')}`;

  if (requirements.userProvidedFeatures) {
    summary += `\n\nFEATURE PRIORITY SYSTEM:`;
    summary += `\n- User has provided ${requirements.userProvidedFeatures} features that are MANDATORY to include`;
    summary += `\n- Features section MUST generate at least ${requirements.userProvidedFeatures} cards to accommodate user content`;
    summary += `\n- User-provided features take precedence over AI-generated features`;
    summary += `\n- Respect the upper limits of the UIBlock but prioritize user content within those bounds`;
  }

  return summary;
}