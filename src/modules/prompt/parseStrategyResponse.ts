// modules/prompt/parseStrategyResponse.ts - Parse and validate strategic analysis from AI
import { logger } from '@/lib/logger';
import type { PageLayoutRequirements } from '@/types/layoutTypes';

export interface CopyStrategy {
  bigIdea: string;
  corePromise: string;
  uniqueMechanism: string;
  idealCustomerProfile: string; // One specific persona to write all copy to
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
  copyStrategy: CopyStrategy | null; // Allow null when strategy parsing fails
  cardCounts: CardCounts;
  reasoning: StrategyReasoning;
  errors: string[];
  warnings: string[];
}

/**
 * Extracts JSON from AI response with enhanced patterns and content cleaning
 */
function extractJSON(content: string): string | null {
  logger.debug('🔍 Starting enhanced JSON extraction from AI response:', {
    contentLength: content.length,
    hasCodeBlocks: content.includes('```'),
    hasJsonKeyword: content.includes('json'),
    startsWithBrace: content.trim().startsWith('{'),
    contentPreview: content.substring(0, 100) + '...'
  });

  // Clean content first - remove common AI response artifacts
  let cleanedContent = content
    .replace(/^Here's.*?:\s*/i, '') // Remove "Here's the strategy:" type prefixes
    .replace(/^Based on.*?:\s*/i, '') // Remove "Based on analysis:" type prefixes
    .replace(/\*\*JSON\*\*\s*/i, '') // Remove **JSON** markers
    .replace(/```json\s+/gi, '```json\n') // Normalize code block formatting
    .trim();

  logger.debug('📝 Content cleaned for extraction:', {
    originalLength: content.length,
    cleanedLength: cleanedContent.length,
    significantChange: Math.abs(content.length - cleanedContent.length) > 50
  });

  // Pattern 1: Standard markdown code blocks with json label
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const codeBlockMatch = cleanedContent.match(codeBlockRegex);

  if (codeBlockMatch) {
    const extracted = codeBlockMatch[1].trim();
    if (isValidJSONStructure(extracted)) {
      logger.debug('✅ JSON extracted from standard code block:', {
        extractedLength: extracted.length,
        startsWithBrace: extracted.startsWith('{'),
        endsWithBrace: extracted.endsWith('}')
      });
      return extracted;
    }
  }

  // Pattern 2: Backtick blocks without json label
  const simpleCodeBlockRegex = /```\s*([\s\S]*?)\s*```/;
  const simpleCodeMatch = cleanedContent.match(simpleCodeBlockRegex);

  if (simpleCodeMatch) {
    const extracted = simpleCodeMatch[1].trim();
    if (isValidJSONStructure(extracted)) {
      logger.debug('✅ JSON extracted from simple code block:', {
        extractedLength: extracted.length
      });
      return extracted;
    }
  }

  // Pattern 3: Direct JSON object with balanced braces
  const balancedJsonMatch = findBalancedJSON(cleanedContent);
  if (balancedJsonMatch) {
    logger.debug('✅ JSON extracted from balanced brace matching:', {
      extractedLength: balancedJsonMatch.length,
      startIndex: cleanedContent.indexOf(balancedJsonMatch)
    });
    return balancedJsonMatch;
  }

  // Pattern 4: Greedy JSON match as fallback
  const jsonRegex = /\{[\s\S]*\}/;
  const jsonMatch = cleanedContent.match(jsonRegex);

  if (jsonMatch) {
    const extracted = jsonMatch[0];
    if (isValidJSONStructure(extracted)) {
      logger.debug('✅ JSON extracted from greedy match:', {
        extractedLength: extracted.length,
        matchIndex: cleanedContent.indexOf(extracted)
      });
      return extracted;
    }
  }

  logger.warn('❌ No valid JSON patterns found. Analysis:', {
    hasBraces: cleanedContent.includes('{') && cleanedContent.includes('}'),
    bracePositions: {
      firstBrace: cleanedContent.indexOf('{'),
      lastBrace: cleanedContent.lastIndexOf('}')
    },
    contentSample: cleanedContent.substring(0, 300) + '...'
  });

  return null;
}

/**
 * Validates basic JSON structure before parsing
 */
function isValidJSONStructure(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  const trimmed = text.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return false;

  // Basic brace balance check
  let braceCount = 0;
  for (const char of trimmed) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (braceCount < 0) return false; // More closing than opening
  }

  return braceCount === 0; // Balanced braces
}

/**
 * Finds JSON with balanced braces starting from first '{'
 */
function findBalancedJSON(content: string): string | null {
  const firstBrace = content.indexOf('{');
  if (firstBrace === -1) return null;

  let braceCount = 0;
  let inString = false;
  let escaped = false;

  for (let i = firstBrace; i < content.length; i++) {
    const char = content[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;

      if (braceCount === 0) {
        const extracted = content.substring(firstBrace, i + 1);
        return extracted.trim();
      }
    }
  }

  return null; // Unbalanced braces
}

/**
 * Validates copy strategy object with enhanced flexibility and partial recovery
 */
function validateCopyStrategy(strategy: any): {
  isValid: boolean;
  errors: string[];
  correctedStrategy?: CopyStrategy;
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  let correctedStrategy: CopyStrategy | undefined;

  if (!strategy || typeof strategy !== 'object') {
    errors.push('Copy strategy must be an object');
    return { isValid: false, errors, warnings };
  }

  logger.debug('🔍 Validating copy strategy fields:', {
    availableFields: Object.keys(strategy),
    fieldCount: Object.keys(strategy).length
  });

  // Create corrected strategy with smart defaults
  correctedStrategy = {
    bigIdea: '',
    corePromise: '',
    uniqueMechanism: '',
    idealCustomerProfile: '',
    primaryEmotion: '',
    objectionPriority: []
  };

  // Required fields with validation and smart correction
  const fieldValidators = [
    {
      field: 'bigIdea',
      validate: (value: any) => validateAndCorrectStringField(value, 10, 'The compelling central concept that drives everything'),
      description: 'Central compelling concept'
    },
    {
      field: 'corePromise',
      validate: (value: any) => validateAndCorrectStringField(value, 10, 'Transform your current state to desired outcome'),
      description: 'Core transformation promise'
    },
    {
      field: 'uniqueMechanism',
      validate: (value: any) => validateAndCorrectStringField(value, 10, 'The unique approach that makes this work when others fail'),
      description: 'Unique differentiation mechanism'
    },
    {
      field: 'idealCustomerProfile',
      validate: (value: any) => validateAndCorrectStringField(value, 20, 'One specific customer persona with name, role, specific pain, and desired outcome'),
      description: 'Ideal customer profile (one true fan)'
    },
    {
      field: 'primaryEmotion',
      validate: (value: any) => validateAndCorrectStringField(value, 3, 'motivation'),
      description: 'Primary emotional trigger'
    },
    {
      field: 'objectionPriority',
      validate: (value: any) => validateAndCorrectArrayField(value, 1, ['price_concern', 'trust_concern', 'complexity_concern']),
      description: 'Objection priority array'
    }
  ];

  let validFieldCount = 0;
  let totalRequiredFields = fieldValidators.length;

  for (const { field, validate, description } of fieldValidators) {
    const fieldValue = strategy[field];
    const result = validate(fieldValue);

    if (result.isValid) {
      correctedStrategy[field as keyof CopyStrategy] = result.value as any;
      validFieldCount++;

      if (result.wasCorrected) {
        warnings.push(`Copy strategy field '${field}' was corrected: ${description}`);
      }
    } else {
      // Use smart default
      correctedStrategy[field as keyof CopyStrategy] = result.defaultValue as any;
      errors.push(`Copy strategy field '${field}' invalid: ${result.error}`);

      logger.debug(`❌ Field validation failed for '${field}':`, {
        receivedValue: fieldValue,
        receivedType: typeof fieldValue,
        error: result.error
      });
    }
  }

  const isValid = validFieldCount >= Math.ceil(totalRequiredFields * 0.6); // 60% success rate

  logger.debug('✅ Copy strategy validation completed:', {
    validFields: validFieldCount,
    totalFields: totalRequiredFields,
    successRate: `${Math.round((validFieldCount / totalRequiredFields) * 100)}%`,
    isValid,
    warningCount: warnings.length,
    errorCount: errors.length
  });

  return {
    isValid,
    errors,
    correctedStrategy: isValid ? correctedStrategy : undefined,
    warnings
  };
}

/**
 * Validates and corrects string fields with smart defaults
 */
function validateAndCorrectStringField(
  value: any,
  minLength: number,
  defaultValue: string
): { isValid: boolean; value: string; defaultValue: string; error?: string; wasCorrected: boolean } {

  if (typeof value === 'string' && value.trim().length >= minLength) {
    return { isValid: true, value: value.trim(), defaultValue, wasCorrected: false };
  }

  // Try to correct common issues
  if (typeof value === 'string' && value.trim().length > 0) {
    const trimmed = value.trim();
    if (trimmed.length < minLength) {
      // If too short, try to expand with generic guidance
      const expanded = `${trimmed} - ${defaultValue}`;
      if (expanded.length >= minLength) {
        return { isValid: true, value: expanded, defaultValue, wasCorrected: true };
      }
    }
  }

  // Handle arrays (convert to string)
  if (Array.isArray(value) && value.length > 0) {
    const joined = value.join(' - ');
    if (joined.length >= minLength) {
      return { isValid: true, value: joined, defaultValue, wasCorrected: true };
    }
  }

  return {
    isValid: false,
    value: defaultValue,
    defaultValue,
    error: `Must be a string with at least ${minLength} characters`,
    wasCorrected: false
  };
}

/**
 * Validates and corrects array fields with smart defaults
 */
function validateAndCorrectArrayField(
  value: any,
  minLength: number,
  defaultValue: string[]
): { isValid: boolean; value: string[]; defaultValue: string[]; error?: string; wasCorrected: boolean } {

  if (Array.isArray(value) && value.length >= minLength) {
    // Validate array items
    const validItems = value.filter(item => typeof item === 'string' && item.trim().length > 0);
    if (validItems.length >= minLength) {
      return { isValid: true, value: validItems, defaultValue, wasCorrected: false };
    }
  }

  // Try to correct string to array
  if (typeof value === 'string' && value.trim().length > 0) {
    const items = value.split(/[,|;]/).map(item => item.trim()).filter(Boolean);
    if (items.length >= minLength) {
      return { isValid: true, value: items, defaultValue, wasCorrected: true };
    }
  }

  return {
    isValid: false,
    value: defaultValue,
    defaultValue,
    error: `Must be an array with at least ${minLength} items`,
    wasCorrected: false
  };
}

/**
 * Normalizes section keys from AI output to system expected format
 */
function normalizeSectionKeys(cardCounts: Record<string, any>): Record<string, any> {
  const keyMapping: Record<string, string> = {
    // AI output format → System expected format
    'objection_handling': 'objectionHandling',
    'social_proof': 'socialProof',
    'unique_mechanism': 'uniqueMechanism',
    'before_after': 'beforeAfter',
    'how_it_works': 'howItWorks',
    'founder_note': 'founderNote',
    'use_case': 'useCase',
    'comparison_table': 'comparisonTable',
    // Add reverse mappings for robustness
    'objectionHandling': 'objectionHandling',
    'socialProof': 'socialProof',
    'uniqueMechanism': 'uniqueMechanism',
    'beforeAfter': 'beforeAfter',
    'howItWorks': 'howItWorks',
    'founderNote': 'founderNote',
    'useCase': 'useCase',
    'comparisonTable': 'comparisonTable'
  };

  const normalizedCounts: Record<string, any> = {};

  Object.entries(cardCounts).forEach(([key, value]) => {
    const normalizedKey = keyMapping[key] || key;
    normalizedCounts[normalizedKey] = value;
  });

  logger.debug('🔄 Section key normalization:', {
    originalKeys: Object.keys(cardCounts),
    normalizedKeys: Object.keys(normalizedCounts),
    mappingsApplied: Object.keys(cardCounts).filter(key => keyMapping[key] && keyMapping[key] !== key)
  });

  return normalizedCounts;
}

/**
 * Validates card counts object
 */
function validateCardCounts(
  cardCounts: any,
  layoutRequirements?: PageLayoutRequirements
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!cardCounts || typeof cardCounts !== 'object') {
    errors.push('Card counts must be an object');
    return { isValid: false, errors, warnings };
  }

  // Normalize section keys before validation
  const normalizedCounts = normalizeSectionKeys(cardCounts);

  // Use actual layout requirements if available, otherwise fall back to generic ranges
  const expectedSections = layoutRequirements
    ? buildSectionRulesFromLayout(layoutRequirements)
    : getDefaultSectionRules();

  // Validate each section using normalized counts
  for (const [section, rules] of Object.entries(expectedSections)) {
    const count = normalizedCounts[section];

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
 * Builds section validation rules from actual layout requirements
 */
function buildSectionRulesFromLayout(layoutRequirements: PageLayoutRequirements) {
  const rules: Record<string, { min: number; max: number; optimal: [number, number] }> = {};

  // Extract rules from each section's layout requirements
  layoutRequirements.sections.forEach(section => {
    if (section.cardRequirements) {
      const req = section.cardRequirements;

      // Map section types to generic strategy types
      let strategyKey = section.sectionId;
      if (section.sectionId === 'socialProof') strategyKey = 'social_proof';
      if (section.sectionId === 'comparisonTable') strategyKey = 'comparison';

      rules[strategyKey] = {
        min: req.min,
        max: req.max,
        optimal: req.optimal
      };
    }
  });

  return rules;
}

/**
 * Default section rules for fallback when no layout requirements provided
 */
function getDefaultSectionRules() {
  return {
    features: { min: 1, max: 8, optimal: [3, 5] as [number, number] },
    testimonials: { min: 1, max: 6, optimal: [2, 4] as [number, number] },
    faq: { min: 2, max: 10, optimal: [4, 6] as [number, number] },
    results: { min: 1, max: 6, optimal: [2, 4] as [number, number] },
    social_proof: { min: 1, max: 8, optimal: [3, 6] as [number, number] },
    pricing: { min: 1, max: 5, optimal: [2, 3] as [number, number] },
    problem: { min: 1, max: 5, optimal: [2, 3] as [number, number] },
    comparison: { min: 2, max: 6, optimal: [3, 4] as [number, number] }
  };
}

/**
 * Creates failure state when strategy parsing fails completely
 */
function createStrategyFailure(reason: string): ParsedStrategy {
  logger.warn('⚠️ Strategy parsing failed:', reason);

  return {
    success: false,
    copyStrategy: null, // Signal failure - let route.ts handle fallback
    cardCounts: {},
    reasoning: {},
    errors: [reason],
    warnings: []
  };
}

/**
 * Generate default card counts from layout requirements
 */
function generateDefaultsFromLayout(layoutRequirements: PageLayoutRequirements): CardCounts {
  const counts: CardCounts = {
    features: 4,
    testimonials: 3,
    faq: 5,
    results: 3,
    social_proof: 4,
    pricing: 3,
    problem: 2,
    comparison: 3
  };

  // Use optimal range midpoint for each section
  layoutRequirements.sections.forEach(section => {
    if (section.cardRequirements) {
      const req = section.cardRequirements;
      const optimalMid = Math.round((req.optimal[0] + req.optimal[1]) / 2);

      // Map section IDs to strategy keys
      let strategyKey = section.sectionId;
      if (section.sectionId === 'socialProof') strategyKey = 'social_proof';
      if (section.sectionId === 'comparisonTable') strategyKey = 'comparison';

      counts[strategyKey] = optimalMid;
    }
  });

  return counts;
}

/**
 * Generic default counts when no layout requirements available
 */
function getGenericDefaultCounts(): CardCounts {
  return {
    features: 4,
    testimonials: 3,
    faq: 5,
    results: 3,
    social_proof: 4,
    pricing: 3,
    problem: 2,
    comparison: 3
  };
}

/**
 * Main function to parse and validate strategy response from AI
 */
export function parseStrategyResponse(
  aiContent: string,
  layoutRequirements?: PageLayoutRequirements
): ParsedStrategy {
  logger.debug('🧠 Parsing strategy response from AI...', {
    contentLength: aiContent.length,
    hasLayoutRequirements: !!layoutRequirements,
    sectionsCount: layoutRequirements?.sections?.length || 0
  });

  try {
    // Extract JSON from AI response
    const jsonContent = extractJSON(aiContent);
    if (!jsonContent) {
      logger.error('❌ No valid JSON found in strategy response');
      return createStrategyFailure('No valid JSON found in AI response');
    }

    logger.debug('🔍 Attempting to parse extracted JSON...', {
      jsonLength: jsonContent.length,
      firstChars: jsonContent.substring(0, 100) + '...'
    });

    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
      logger.debug('✅ JSON parsing successful:', {
        topLevelKeys: Object.keys(parsed),
        hasCopyStrategy: !!parsed.copyStrategy,
        hasCardCounts: !!parsed.cardCounts,
        hasReasoning: !!parsed.reasoning
      });
    } catch (parseError) {
      logger.error('❌ JSON parsing failed:', {
        error: parseError,
        jsonPreview: jsonContent.substring(0, 300) + '...'
      });
      return createStrategyFailure('JSON parsing failed: ' + String(parseError));
    }

    // Validate structure
    if (!parsed.copyStrategy || !parsed.cardCounts) {
      logger.error('❌ Strategy response missing required sections:', {
        hasCopyStrategy: !!parsed.copyStrategy,
        hasCardCounts: !!parsed.cardCounts,
        availableKeys: Object.keys(parsed),
        copyStrategyType: typeof parsed.copyStrategy,
        cardCountsType: typeof parsed.cardCounts
      });
      return createStrategyFailure('Strategy response missing required sections (copyStrategy or cardCounts)');
    }

    // Validate copy strategy with enhanced flexibility
    logger.debug('🔍 Validating copy strategy...');
    const strategyValidation = validateCopyStrategy(parsed.copyStrategy);

    if (!strategyValidation.isValid && !strategyValidation.correctedStrategy) {
      logger.error('❌ Copy strategy validation failed completely:', {
        errors: strategyValidation.errors,
        receivedFields: Object.keys(parsed.copyStrategy || {}),
        bigIdeaPreview: parsed.copyStrategy?.bigIdea?.substring(0, 50) || 'undefined'
      });
      return createStrategyFailure('Copy strategy validation failed: ' + strategyValidation.errors.join(', '));
    }

    // Use corrected strategy if available, otherwise original
    const finalCopyStrategy = strategyValidation.correctedStrategy || parsed.copyStrategy;

    if (strategyValidation.warnings.length > 0) {
      logger.warn('⚠️ Copy strategy required corrections:', strategyValidation.warnings);
    }

    logger.debug('✅ Copy strategy validation completed:', {
      isValid: strategyValidation.isValid,
      wasCorrected: !!strategyValidation.correctedStrategy,
      warningCount: strategyValidation.warnings.length
    });

    // Validate card counts with layout requirements
    logger.debug('🔍 Validating card counts...');
    const cardCountValidation = validateCardCounts(parsed.cardCounts, layoutRequirements);
    if (!cardCountValidation.isValid) {
      logger.warn('⚠️ Card count validation failed, preserving strategy and using default counts:', {
        errors: cardCountValidation.errors,
        receivedCounts: parsed.cardCounts,
        expectedSections: layoutRequirements?.sections?.map(s => s.sectionId) || 'none'
      });

      // Use default card counts but KEEP the validated strategy
      const defaultCardCounts = layoutRequirements
        ? generateDefaultsFromLayout(layoutRequirements)
        : getGenericDefaultCounts();

      return {
        success: true,
        copyStrategy: finalCopyStrategy, // ✅ Keep validated strategy
        cardCounts: defaultCardCounts,   // ✅ Only counts fall back to defaults
        reasoning: parsed.reasoning || {},
        errors: [],
        warnings: [
          ...strategyValidation.warnings,
          'Card count validation failed - using intelligent defaults for counts only',
          ...cardCountValidation.errors
        ]
      };
    }

    // Get normalized card counts for final result
    const normalizedCardCounts = normalizeSectionKeys(parsed.cardCounts);

    logger.debug('✅ Card counts validation passed:', {
      warnings: cardCountValidation.warnings,
      originalCounts: parsed.cardCounts,
      normalizedCounts: normalizedCardCounts
    });

    // Create successful result with corrected strategy and combined warnings
    const allWarnings = [
      ...strategyValidation.warnings,
      ...cardCountValidation.warnings
    ];

    const result: ParsedStrategy = {
      success: true,
      copyStrategy: finalCopyStrategy,
      cardCounts: normalizedCardCounts as any,
      reasoning: parsed.reasoning || {},
      errors: [],
      warnings: allWarnings
    };

    // Log successful parsing
    logger.info('✅ Strategy parsed successfully:', {
      bigIdea: result.copyStrategy.bigIdea?.substring(0, 60) + '...' || 'undefined',
      cardCountKeys: Object.keys(result.cardCounts),
      totalCards: Object.values(result.cardCounts).reduce((sum, count) => sum + count, 0),
      warningCount: result.warnings.length,
      hasReasoning: Object.keys(result.reasoning).length > 0
    });

    return result;

  } catch (error) {
    logger.error('❌ Strategy parsing failed with unexpected error:', {
      error: error,
      errorMessage: String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      contentPreview: aiContent.substring(0, 200) + '...'
    });
    return createStrategyFailure('Unexpected error during strategy parsing: ' + String(error));
  }
}

/**
 * Helper function to apply card count constraints for specific sections
 */
export function applyCardCountConstraints(
  cardCounts: CardCounts | Record<string, number>,
  availableFeatures?: number
): Record<string, number> {
  const constrained = { ...cardCounts };

  // If we know how many features are available, don't exceed that for feature-related keys
  if (availableFeatures) {
    for (const [key, value] of Object.entries(constrained)) {
      if (key.includes('features') && value > availableFeatures) {
        constrained[key] = availableFeatures;
        logger.info(`🔧 Constrained ${key} count to available features: ${availableFeatures}`);
      }
    }
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

  for (const [key, value] of Object.entries(constrained)) {
    // Check both generic keys and UIBlock-specific keys
    for (const [section, maxLimit] of Object.entries(maxLimits)) {
      if (key === section || key.includes(section)) {
        if (value > maxLimit) {
          logger.warn(`⚠️ Capping ${key} cards from ${value} to ${maxLimit}`);
          constrained[key] = maxLimit;
        }
        break;
      }
    }
  }

  return constrained;
}