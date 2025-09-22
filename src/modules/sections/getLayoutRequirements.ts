// getLayoutRequirements.ts - Extract card requirements for selected layouts
import type {
  PageLayoutRequirements,
  LayoutRequirement,
  SectionTypeMapping
} from '@/types/layoutTypes';
import { layoutRegistryWithRequirements, getCardRequirements } from './layoutRegistryWithRequirements';
import { logger } from '@/lib/logger';

/**
 * Maps section IDs to their section types for requirement lookup
 * Complete mapping for all 21 sections in the comprehensive registry
 */
const sectionTypeMap: Record<string, string> = {
  // Core sections
  hero: 'Hero',
  features: 'Features',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  results: 'Results',

  // Comparison sections
  comparisonTable: 'Comparison',
  comparison: 'Comparison',

  // Mechanism and problem
  uniqueMechanism: 'UniqueMechanism',
  problem: 'Problem',

  // Social proof and pricing
  socialProof: 'SocialProof',
  pricing: 'Pricing',

  // Process and interaction
  howItWorks: 'HowItWorks',
  objectionHandling: 'ObjectionHandling',

  // CTA sections
  cta: 'CTA',
  primaryCTA: 'PrimaryCTA', // Added missing PrimaryCTA

  // Additional sections
  beforeAfter: 'BeforeAfter',
  close: 'Close', // Fixed: was 'closeSection'

  // Integration and utility sections
  integration: 'Integration', // Fixed: was 'integrations'
  security: 'Security',
  useCase: 'UseCase', // Fixed: was 'useCases'
  founderNote: 'FounderNote',

  // Layout sections
  header: 'Header', // Added missing Header
  footer: 'Footer', // Added missing Footer

  // Alternative naming conventions (case variations)
  'social-proof': 'SocialProof',
  'social_proof': 'SocialProof',
  'unique-mechanism': 'UniqueMechanism',
  'unique_mechanism': 'UniqueMechanism',
  'objection-handling': 'ObjectionHandling',
  'objection_handling': 'ObjectionHandling',
  'how-it-works': 'HowItWorks',
  'how_it_works': 'HowItWorks',
  'founder-note': 'FounderNote',
  'founder_note': 'FounderNote',
  'use-case': 'UseCase',
  'use_case': 'UseCase',
  'before-after': 'BeforeAfter',
  'before_after': 'BeforeAfter',
  'primary-cta': 'PrimaryCTA',
  'primary_cta': 'PrimaryCTA'
};

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
 * Normalizes section ID to handle various naming conventions
 * @param sectionId Raw section ID from page layout
 * @returns Normalized section ID that matches sectionTypeMap keys
 */
function normalizeSectionId(sectionId: string): string {
  // Convert to lowercase and handle common variations
  const normalized = sectionId.toLowerCase()
    .replace(/[-_]/g, '') // Remove hyphens and underscores
    .replace(/section$/, ''); // Remove 'section' suffix

  // Handle special cases
  const specialCases: Record<string, string> = {
    'socialpoof': 'socialProof',
    'socialproof': 'socialProof',
    'uniquemechanism': 'uniqueMechanism',
    'objectionhandling': 'objectionHandling',
    'howitworks': 'howItWorks',
    'beforeafter': 'beforeAfter',
    'foundernote': 'founderNote',
    'usecase': 'useCase',
    'primarycta': 'primaryCTA',
    'comparisonTable': 'comparisonTable'
  };

  return specialCases[normalized] || sectionId;
}

/**
 * Validates if a section type exists in the registry
 * @param sectionType Section type to validate
 * @returns True if section exists in registry
 */
function validateSectionType(sectionType: string): boolean {
  return sectionType in layoutRegistryWithRequirements;
}

/**
 * Validates if a layout exists for a given section type
 * @param sectionType Section type
 * @param layoutName Layout name to validate
 * @returns True if layout exists in the section
 */
function validateLayout(sectionType: string, layoutName: string): boolean {
  const section = layoutRegistryWithRequirements[sectionType];
  return section && layoutName in section;
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

    // Normalize section ID for consistent lookup
    const normalizedSectionId = normalizeSectionId(originalSectionId);

    // Get section type from mapping (try both original and normalized)
    let sectionType = sectionTypeMap[originalSectionId] || sectionTypeMap[normalizedSectionId];

    if (!sectionType) {
      logger.warn(`❌ Unknown section type for: ${originalSectionId} (normalized: ${normalizedSectionId})`);
      logger.debug('Available section types:', Object.keys(sectionTypeMap));
      return;
    }

    // Validate section type exists in registry
    if (!validateSectionType(sectionType)) {
      logger.error(`❌ Section type '${sectionType}' not found in layoutRegistryWithRequirements`);
      return;
    }

    // Validate layout exists in section
    if (!validateLayout(sectionType, layoutName)) {
      logger.error(`❌ Layout '${layoutName}' not found in section '${sectionType}'`);
      const section = layoutRegistryWithRequirements[sectionType];
      const availableLayouts = section ? Object.keys(section) : [];
      logger.debug(`Available layouts for ${sectionType}:`, availableLayouts);
      return;
    }

    // Get card requirements for this layout
    const cardRequirements = getCardRequirements(sectionType, layoutName);

    if (cardRequirements) {
      requirements.push({
        sectionId: originalSectionId, // Keep original section ID for consistency
        sectionType,
        layoutName,
        cardRequirements
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
        sectionType,
        layoutName,
        cardRequirements: undefined
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
      // Map how it works to process explanations
      strategyCount = strategyCounts.how_it_works || strategyCounts.features || 3;
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