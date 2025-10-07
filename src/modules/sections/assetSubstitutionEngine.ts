// assetSubstitutionEngine.ts - Intelligent section substitution when assets unavailable
// RULE 6: Maintain objection coverage even when required assets are missing

import { logger } from '@/lib/logger';
import type { AssetAvailability, StartupStage } from '@/types/core/index';

// Section IDs (matching objectionFlowEngine.ts)
const SECTION_IDS = {
  testimonials: "testimonials",
  socialProof: "socialProof",
  integrations: "integrations",
  founderNote: "founderNote",
  results: "results",
  beforeAfter: "beforeAfter",
  useCases: "useCases",
  howItWorks: "howItWorks",
  features: "features",
  uniqueMechanism: "uniqueMechanism",
  problem: "problem"
} as const;

/**
 * Substitution strategy for a specific section type when assets are unavailable.
 *
 * RULE: Always maintain objection coverage - don't just remove sections.
 */
interface SubstitutionStrategy {
  requiredAssets: (keyof AssetAvailability)[];  // Assets needed for this section
  objectionType: string;                        // What objection this section handles
  substitutions: {
    condition: (stage: StartupStage) => boolean;  // When to use this substitution
    section: string;                               // What section to use instead
    reasoning: string;                            // Why this substitution works
  }[];
  fallback: string | null;                       // Ultimate fallback if no conditions match
}

/**
 * RULE 6.1: Testimonial Trust Objection
 *
 * Objection: "Can I trust this works for people like me?"
 * Asset-dependent: Real customer testimonials
 */
const TESTIMONIAL_SUBSTITUTION: SubstitutionStrategy = {
  requiredAssets: ['testimonials'],
  objectionType: 'trust_and_social_proof',
  substitutions: [
    {
      condition: (stage) => ['pre-mvp', 'problem-exploration', 'mvp-development', 'mvp-launched'].includes(stage),
      section: SECTION_IDS.founderNote,
      reasoning: "MVP stages: Use founder credibility as personal trust anchor"
    },
    {
      condition: (stage) => ['early-feedback', 'problem-solution-fit', 'validated-early', 'early-monetization'].includes(stage),
      section: SECTION_IDS.results,
      reasoning: "Early traction: Show metrics instead of testimonials"
    },
    {
      condition: (stage) => ['building-v2', 'targeting-pmf', 'users-250-500', 'users-500-1k'].includes(stage),
      section: SECTION_IDS.socialProof,
      reasoning: "Growth stages: Use company logos/user counts as social validation"
    },
    {
      condition: () => true, // Always matches
      section: SECTION_IDS.beforeAfter,
      reasoning: "Vision-based trust: Show transformation potential"
    }
  ],
  fallback: SECTION_IDS.founderNote
};

/**
 * RULE 6.2: Social Validation Objection
 *
 * Objection: "Are credible companies/people using this?"
 * Asset-dependent: Customer logos, media mentions
 */
const SOCIAL_PROOF_SUBSTITUTION: SubstitutionStrategy = {
  requiredAssets: ['customerLogos', 'testimonials'],
  objectionType: 'credibility_and_market_validation',
  substitutions: [
    {
      condition: (stage) => ['waitlist', 'early-access'].includes(stage as any),
      section: SECTION_IDS.problem,
      reasoning: "Pre-launch: Build community around shared problem instead"
    },
    {
      condition: (stage) => ['pre-mvp', 'problem-exploration', 'mvp-development', 'mvp-launched'].includes(stage),
      section: SECTION_IDS.founderNote,
      reasoning: "MVP stages: Founder credibility substitutes for social proof"
    },
    {
      condition: (stage) => ['early-feedback', 'problem-solution-fit', 'validated-early'].includes(stage),
      section: SECTION_IDS.useCases,
      reasoning: "Early traction: Show concrete use cases to demonstrate market validation"
    }
  ],
  fallback: SECTION_IDS.uniqueMechanism
};

/**
 * RULE 6.3: Integration/Compatibility Objection
 *
 * Objection: "Will this work with my existing tools?"
 * Asset-dependent: Integration partner logos
 */
const INTEGRATION_SUBSTITUTION: SubstitutionStrategy = {
  requiredAssets: ['integrationLogos'],
  objectionType: 'technical_fit_and_workflow',
  substitutions: [
    {
      condition: (stage) => ['pre-mvp', 'problem-exploration', 'mvp-development'].includes(stage),
      section: SECTION_IDS.howItWorks,
      reasoning: "Pre-launch: Explain technical approach to show compatibility mindset"
    },
    {
      condition: () => true,
      section: SECTION_IDS.features,
      reasoning: "Mention integration capabilities in features section instead"
    }
  ],
  fallback: null // Can be removed - not critical for most categories
};

/**
 * RULE 6.4: Product Visualization Objection
 *
 * Objection: "What does this actually look like?"
 * Asset-dependent: Product screenshots
 */
const PRODUCT_IMAGE_SUBSTITUTION: SubstitutionStrategy = {
  requiredAssets: ['productImages'],
  objectionType: 'product_understanding',
  substitutions: [
    {
      condition: (stage) => ['pre-mvp', 'problem-exploration', 'mvp-development'].includes(stage),
      section: SECTION_IDS.howItWorks,
      reasoning: "MVP stages: Describe product flow in detail to compensate for lack of visuals"
    },
    {
      condition: () => true,
      section: SECTION_IDS.features,
      reasoning: "Use detailed feature descriptions to paint mental picture"
    }
  ],
  fallback: SECTION_IDS.howItWorks
};

/**
 * RULE 6.5: Founder Credibility Objection
 *
 * Objection: "Who's behind this?"
 * Asset-dependent: Founder photo and bio
 */
const FOUNDER_NOTE_SUBSTITUTION: SubstitutionStrategy = {
  requiredAssets: ['founderPhoto'],
  objectionType: 'founder_trust',
  substitutions: [
    {
      condition: () => true,
      section: SECTION_IDS.problem,
      reasoning: "Include founder perspective in footer 'About' instead of dedicated section"
    }
  ],
  fallback: null // Can be removed or moved to footer
};

// Map sections to their substitution strategies
const SUBSTITUTION_STRATEGIES: Record<string, SubstitutionStrategy> = {
  [SECTION_IDS.testimonials]: TESTIMONIAL_SUBSTITUTION,
  [SECTION_IDS.socialProof]: SOCIAL_PROOF_SUBSTITUTION,
  [SECTION_IDS.integrations]: INTEGRATION_SUBSTITUTION,
  [SECTION_IDS.founderNote]: FOUNDER_NOTE_SUBSTITUTION
};

/**
 * Check if section requires specific assets that are unavailable
 */
function sectionNeedsAssets(sectionId: string, assetAvailability: AssetAvailability): boolean {
  const strategy = SUBSTITUTION_STRATEGIES[sectionId];
  if (!strategy) return false;

  // Check if any required assets are missing
  return strategy.requiredAssets.some(assetKey => !assetAvailability[assetKey]);
}

/**
 * Find appropriate substitution for a section based on stage and context
 */
function findSubstitution(
  sectionId: string,
  stage: StartupStage,
  currentSections: string[]
): { section: string | null, reasoning: string } {
  const strategy = SUBSTITUTION_STRATEGIES[sectionId];
  if (!strategy) {
    return { section: null, reasoning: 'No substitution strategy defined' };
  }

  // Try each substitution condition in order
  for (const substitution of strategy.substitutions) {
    if (substitution.condition(stage)) {
      // Check if substitute is not already present
      if (!currentSections.includes(substitution.section)) {
        return {
          section: substitution.section,
          reasoning: substitution.reasoning
        };
      }
    }
  }

  // Use fallback if no conditions matched
  if (strategy.fallback && !currentSections.includes(strategy.fallback)) {
    return {
      section: strategy.fallback,
      reasoning: 'Fallback substitution - maintains basic objection coverage'
    };
  }

  return { section: null, reasoning: 'All substitutions already present or no fallback available' };
}

/**
 * MAIN FUNCTION: Apply asset-aware substitutions to maintain objection coverage
 *
 * RULE: Never leave objection gaps - always substitute unavailable sections
 * with credible alternatives based on startup stage.
 */
export function applyAssetAwareSubstitutions(
  sections: string[],
  assetAvailability: AssetAvailability | null,
  startupStage: StartupStage
): string[] {
  if (!assetAvailability) {
    logger.dev('⚠️ No asset availability data - skipping asset-aware substitutions');
    return sections;
  }

  logger.dev('🎨 Applying asset-aware substitutions...');
  logger.dev(`   Stage: ${startupStage}`);
  logger.dev(`   Available assets:`, assetAvailability);

  let modifiedSections = [...sections];
  const substitutionLog: string[] = [];

  // Process each section that might need substitution
  for (let i = 0; i < modifiedSections.length; i++) {
    const sectionId = modifiedSections[i];

    if (sectionNeedsAssets(sectionId, assetAvailability)) {
      const strategy = SUBSTITUTION_STRATEGIES[sectionId];
      logger.dev(`   🔍 Section ${sectionId} needs assets:`, strategy?.requiredAssets);

      const { section: substituteSection, reasoning } = findSubstitution(
        sectionId,
        startupStage,
        modifiedSections
      );

      if (substituteSection) {
        // Replace unavailable section with substitute
        modifiedSections[i] = substituteSection;
        substitutionLog.push(`${sectionId} → ${substituteSection} (${reasoning})`);
        logger.dev(`   ↔️ Substituted ${sectionId} → ${substituteSection}`);
        logger.dev(`      Reason: ${reasoning}`);
      } else {
        // No substitute available - remove section
        modifiedSections.splice(i, 1);
        i--; // Adjust index after removal
        substitutionLog.push(`${sectionId} → REMOVED (${reasoning})`);
        logger.dev(`   ❌ Removed ${sectionId} (${reasoning})`);
      }
    }
  }

  // Remove duplicates that might have been created by substitutions
  const uniqueSections = [...new Set(modifiedSections)];

  if (substitutionLog.length > 0) {
    logger.dev(`✅ Asset-aware substitutions complete:`, substitutionLog);
  } else {
    logger.dev('✅ No asset-aware substitutions needed');
  }

  return uniqueSections;
}

/**
 * Get human-readable substitution explanation for debugging
 */
export function getSubstitutionExplanation(
  sectionId: string,
  assetAvailability: AssetAvailability,
  startupStage: StartupStage
): string | null {
  if (!sectionNeedsAssets(sectionId, assetAvailability)) {
    return null;
  }

  const strategy = SUBSTITUTION_STRATEGIES[sectionId];
  if (!strategy) return null;

  const { section, reasoning } = findSubstitution(sectionId, startupStage, []);

  if (!section) {
    return `${sectionId} requires ${strategy.requiredAssets.join(', ')} but can be removed without breaking objection coverage`;
  }

  return `${sectionId} → ${section}: ${reasoning} (Maintains ${strategy.objectionType} coverage)`;
}
