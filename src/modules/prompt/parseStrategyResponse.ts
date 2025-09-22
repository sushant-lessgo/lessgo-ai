// modules/prompt/parseStrategyResponse.ts - Parse and validate strategic analysis from AI
import { logger } from '@/lib/logger';

export interface CopyStrategy {
  bigIdea: string;
  corePromise: string;
  uniqueMechanism: string;
  primaryEmotion: string;
  objectionPriority: string[];
}

export interface CardCounts {
  features: number;
  testimonials: number;
  faq: number;
  results: number;
  social_proof: number;
  pricing: number;
  problem: number;
  comparison: number;
  [key: string]: number; // Allow for additional sections
}

export interface StrategyReasoning {
  features: string;
  testimonials: string;
  faq: string;
  results: string;
  social_proof: string;
  overall: string;
  [key: string]: string; // Allow for additional reasoning
}

export interface ParsedStrategy {
  success: boolean;
  copyStrategy: CopyStrategy;
  cardCounts: CardCounts;
  reasoning: StrategyReasoning;
  errors: string[];
  warnings: string[];
}

/**
 * Extracts JSON from AI response, handling markdown code blocks
 */
function extractJSON(content: string): string | null {
  // Remove potential markdown code blocks
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const codeBlockMatch = content.match(codeBlockRegex);

  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object directly
  const jsonRegex = /\{[\s\S]*\}/;
  const jsonMatch = content.match(jsonRegex);

  if (jsonMatch) {
    return jsonMatch[0];
  }

  return null;
}

/**
 * Validates copy strategy object
 */
function validateCopyStrategy(strategy: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!strategy || typeof strategy !== 'object') {
    errors.push('Copy strategy must be an object');
    return { isValid: false, errors };
  }

  // Required fields with validation
  const requiredFields = [
    { field: 'bigIdea', type: 'string', minLength: 10 },
    { field: 'corePromise', type: 'string', minLength: 10 },
    { field: 'uniqueMechanism', type: 'string', minLength: 10 },
    { field: 'primaryEmotion', type: 'string', minLength: 3 },
    { field: 'objectionPriority', type: 'array', minLength: 1 }
  ];

  for (const { field, type, minLength } of requiredFields) {
    if (!(field in strategy)) {
      errors.push(`Copy strategy missing required field: ${field}`);
      continue;
    }

    const value = strategy[field];

    if (type === 'string' && (typeof value !== 'string' || value.length < minLength)) {
      errors.push(`Copy strategy field '${field}' must be a string with at least ${minLength} characters`);
    }

    if (type === 'array' && (!Array.isArray(value) || value.length < minLength)) {
      errors.push(`Copy strategy field '${field}' must be an array with at least ${minLength} items`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates card counts object
 */
function validateCardCounts(cardCounts: any): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!cardCounts || typeof cardCounts !== 'object') {
    errors.push('Card counts must be an object');
    return { isValid: false, errors, warnings };
  }

  // Expected sections with reasonable ranges
  const expectedSections = {
    features: { min: 1, max: 8, optimal: [3, 5] },
    testimonials: { min: 1, max: 6, optimal: [2, 4] },
    faq: { min: 2, max: 10, optimal: [4, 6] },
    results: { min: 1, max: 6, optimal: [2, 4] },
    social_proof: { min: 1, max: 8, optimal: [3, 6] },
    pricing: { min: 1, max: 5, optimal: [2, 3] },
    problem: { min: 1, max: 5, optimal: [2, 3] },
    comparison: { min: 2, max: 6, optimal: [3, 4] }
  };

  // Validate each section
  for (const [section, rules] of Object.entries(expectedSections)) {
    const count = cardCounts[section];

    if (typeof count !== 'number' || !Number.isInteger(count)) {
      errors.push(`Card count for '${section}' must be a positive integer`);
      continue;
    }

    if (count < rules.min) {
      errors.push(`Card count for '${section}' (${count}) is below minimum of ${rules.min}`);
    }

    if (count > rules.max) {
      warnings.push(`Card count for '${section}' (${count}) is quite high (max recommended: ${rules.max})`);
    }

    if (count < rules.optimal[0] || count > rules.optimal[1]) {
      warnings.push(`Card count for '${section}' (${count}) is outside optimal range of ${rules.optimal[0]}-${rules.optimal[1]}`);
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Creates intelligent defaults based on market sophistication and awareness
 */
function createIntelligentDefaults(): ParsedStrategy {
  const defaults: ParsedStrategy = {
    success: true,
    copyStrategy: {
      bigIdea: "Streamline your workflow and boost productivity",
      corePromise: "Transform from chaotic work management to organized, efficient productivity",
      uniqueMechanism: "Intelligent automation that adapts to your working style",
      primaryEmotion: "relief from overwhelm",
      objectionPriority: ["too_complex", "too_expensive", "integration_concerns"]
    },
    cardCounts: {
      features: 4,
      testimonials: 3,
      faq: 5,
      results: 3,
      social_proof: 4,
      pricing: 3,
      problem: 2,
      comparison: 3
    },
    reasoning: {
      features: "Moderate complexity product needs comprehensive capability demonstration",
      testimonials: "Standard trust-building requires multiple success stories",
      faq: "Address common concerns without overwhelming prospect",
      results: "Key metrics provide sufficient proof of value",
      social_proof: "Establish market credibility with moderate volume",
      overall: "Balanced approach for mainstream B2B audience with moderate sophistication"
    },
    errors: [],
    warnings: ["Using intelligent defaults due to strategy parsing failure"]
  };

  logger.warn('⚠️ Using intelligent strategy defaults due to AI parsing failure');
  return defaults;
}

/**
 * Main function to parse and validate strategy response from AI
 */
export function parseStrategyResponse(aiContent: string): ParsedStrategy {
  logger.debug('🧠 Parsing strategy response from AI...');

  try {
    // Extract JSON from AI response
    const jsonContent = extractJSON(aiContent);
    if (!jsonContent) {
      logger.error('❌ No valid JSON found in strategy response');
      return createIntelligentDefaults();
    }

    const parsed = JSON.parse(jsonContent);
    logger.debug('📊 Raw strategy JSON parsed successfully');

    // Validate structure
    if (!parsed.copyStrategy || !parsed.cardCounts) {
      logger.error('❌ Strategy response missing required sections (copyStrategy, cardCounts)');
      return createIntelligentDefaults();
    }

    // Validate copy strategy
    const strategyValidation = validateCopyStrategy(parsed.copyStrategy);
    if (!strategyValidation.isValid) {
      logger.error('❌ Copy strategy validation failed:', strategyValidation.errors);
      return createIntelligentDefaults();
    }

    // Validate card counts
    const cardCountValidation = validateCardCounts(parsed.cardCounts);
    if (!cardCountValidation.isValid) {
      logger.error('❌ Card counts validation failed:', cardCountValidation.errors);
      return createIntelligentDefaults();
    }

    // Create successful result
    const result: ParsedStrategy = {
      success: true,
      copyStrategy: parsed.copyStrategy,
      cardCounts: parsed.cardCounts,
      reasoning: parsed.reasoning || {},
      errors: [],
      warnings: cardCountValidation.warnings
    };

    // Log successful parsing
    logger.info('✅ Strategy parsed successfully:', {
      bigIdea: result.copyStrategy.bigIdea,
      cardCounts: result.cardCounts,
      warnings: result.warnings
    });

    return result;

  } catch (error) {
    logger.error('❌ Strategy parsing failed:', error);
    return createIntelligentDefaults();
  }
}

/**
 * Helper function to apply card count constraints for specific sections
 */
export function applyCardCountConstraints(
  cardCounts: CardCounts,
  availableFeatures?: number
): CardCounts {
  const constrained = { ...cardCounts };

  // If we know how many features are available, don't exceed that
  if (availableFeatures && constrained.features > availableFeatures) {
    constrained.features = availableFeatures;
    logger.info(`🔧 Constrained features count to available features: ${availableFeatures}`);
  }

  // Apply absolute maximums to prevent overwhelming users
  const maxLimits = {
    features: 8,
    testimonials: 6,
    faq: 10,
    results: 6,
    social_proof: 8,
    pricing: 5,
    problem: 5,
    comparison: 6
  };

  for (const [section, maxLimit] of Object.entries(maxLimits)) {
    if (constrained[section] > maxLimit) {
      logger.warn(`⚠️ Capping ${section} cards from ${constrained[section]} to ${maxLimit}`);
      constrained[section] = maxLimit;
    }
  }

  return constrained;
}