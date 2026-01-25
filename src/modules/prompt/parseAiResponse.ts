
// @ts-nocheck - Temporary disable type checking due to extensive string|string[] union type issues
import { logger } from '@/lib/logger';
import { getIconsFromCategories, getIconFromCategory } from '@/utils/iconMapping';

interface ParsedResponse {
  success: boolean
  content: Record<string, any>
  isPartial: boolean
  warnings: string[]
  errors: string[]
  strategy?: any // Optional strategy metadata from 2-phase generation
}

interface SectionContent {
  [key: string]: string | string[]
}

/**
 * Parses and validates AI response for landing page copy generation
 */
export function parseAiResponse(
  aiContent: string,
  expectedCounts?: Record<string, number>
): ParsedResponse {
  logger.debug('🔍 Starting AI response parsing:', {
    contentLength: aiContent.length,
    hasExpectedCounts: !!expectedCounts,
    expectedCountsKeys: expectedCounts ? Object.keys(expectedCounts) : [],
    contentPreview: aiContent.substring(0, 150) + '...'
  });

  const result: ParsedResponse = {
    success: false,
    content: {},
    isPartial: false,
    warnings: [],
    errors: []
  }

  try {
    // Extract JSON from AI response (handle potential markdown code blocks)
    logger.debug('🔍 Extracting JSON from AI response...');
    const jsonContent = extractJSON(aiContent)
    if (!jsonContent) {
      logger.error('❌ No valid JSON found in AI response', {
        hasCodeBlocks: aiContent.includes('```'),
        hasBraces: aiContent.includes('{'),
        contentStart: aiContent.substring(0, 200) + '...'
      });
      result.errors.push("No valid JSON found in AI response")
      return result
    }

    logger.debug('✅ JSON extracted successfully:', {
      extractedLength: jsonContent.length,
      startsWithBrace: jsonContent.trim().startsWith('{'),
      endsWithBrace: jsonContent.trim().endsWith('}')
    });

    // Parse extracted JSON
    logger.debug('🔍 Parsing extracted JSON...');
    let parsedContent: any;
    try {
      parsedContent = JSON.parse(jsonContent)
      logger.debug('✅ JSON parsed successfully:', {
        topLevelKeys: Object.keys(parsedContent),
        sectionCount: Object.keys(parsedContent).length
      });
    } catch (parseError) {
      logger.error('❌ JSON parsing failed:', {
        error: parseError,
        jsonPreview: jsonContent.substring(0, 300) + '...'
      });
      result.errors.push(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
      return result
    }

    // Validate structure
    logger.debug('🔍 Validating parsed content structure...');
    const validation = validateContent(parsedContent, expectedCounts)

    result.content = validation.content
    result.warnings = validation.warnings
    result.errors = validation.errors
    result.isPartial = validation.isPartial
    result.success = validation.errors.length === 0

    logger.debug('✅ Content validation completed:', {
      success: result.success,
      finalSectionCount: Object.keys(result.content).length,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      isPartial: result.isPartial
    });

    if (result.errors.length > 0) {
      logger.warn('⚠️ Validation errors found:', result.errors);
    }

    if (result.warnings.length > 0) {
      logger.debug('⚠️ Validation warnings:', result.warnings);
    }

    return result

  } catch (error) {
    logger.error('❌ Unexpected error during AI response parsing:', {
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    result.errors.push(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return result
  }
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
    firstLine: content.split('\n')[0],
    contentPreview: content.substring(0, 100) + '...'
  });

  // Clean content first - remove common AI response artifacts
  let cleanedContent = content
    .replace(/^Here(?:'s|\'s| is).*?:\s*/i, '') // Remove "Here's the content:" type prefixes
    .replace(/^Based on.*?:\s*/i, '') // Remove "Based on analysis:" type prefixes
    .replace(/\*\*JSON\*\*\s*/i, '') // Remove **JSON** markers
    .replace(/```json\s+/gi, '```json\n') // Normalize code block formatting
    .replace(/^\s*```\s*\n/gm, '```\n') // Clean up empty code block lines
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
        endsWithBrace: extracted.endsWith('}'),
        firstChars: extracted.substring(0, 50) + '...'
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
        extractedLength: extracted.length,
        firstChars: extracted.substring(0, 50) + '...'
      });
      return extracted;
    }
  }

  // Pattern 3: Direct JSON object with balanced braces
  const balancedJsonMatch = findBalancedJSON(cleanedContent);
  if (balancedJsonMatch) {
    logger.debug('✅ JSON extracted from balanced brace matching:', {
      extractedLength: balancedJsonMatch.length,
      startIndex: cleanedContent.indexOf(balancedJsonMatch),
      firstChars: balancedJsonMatch.substring(0, 50) + '...'
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
        matchIndex: cleanedContent.indexOf(extracted),
        firstChars: extracted.substring(0, 50) + '...'
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
 * Validates and cleans the parsed content with enhanced error recovery
 */
function validateContent(
  content: any,
  expectedCounts?: Record<string, number>
): {
  content: Record<string, any>;
  warnings: string[];
  errors: string[];
  isPartial: boolean;
} {
  const validation = {
    content: {} as Record<string, any>,
    warnings: [] as string[],
    errors: [] as string[],
    isPartial: false
  }

  logger.debug('🔍 Starting content validation:', {
    contentType: typeof content,
    isArray: Array.isArray(content),
    hasExpectedCounts: !!expectedCounts,
    expectedCountKeys: expectedCounts ? Object.keys(expectedCounts) : []
  });

  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    validation.errors.push("Content must be an object (not array or primitive)")
    logger.error('❌ Content validation failed: invalid root type', {
      actualType: typeof content,
      isArray: Array.isArray(content),
      isNull: content === null
    });
    return validation
  }

  // Try to salvage content from common AI response formats
  let processedContent = content;

  // Check if content is wrapped in a data/content/response property
  if (content.data && typeof content.data === 'object') {
    processedContent = content.data;
    validation.warnings.push('Content extracted from "data" wrapper');
    logger.debug('📦 Content extracted from data wrapper');
  } else if (content.content && typeof content.content === 'object') {
    processedContent = content.content;
    validation.warnings.push('Content extracted from "content" wrapper');
    logger.debug('📦 Content extracted from content wrapper');
  } else if (content.response && typeof content.response === 'object') {
    processedContent = content.response;
    validation.warnings.push('Content extracted from "response" wrapper');
    logger.debug('📦 Content extracted from response wrapper');
  }

  const availableSections = Object.keys(processedContent);

  logger.debug('📊 Available sections analysis:', {
    totalSections: availableSections.length,
    sectionList: availableSections,
    hasExpectedCounts: !!expectedCounts,
    expectedSections: expectedCounts ? Object.keys(expectedCounts) : []
  });

  // Only error if no sections at all
  if (availableSections.length === 0) {
    validation.errors.push('No sections found in content after extraction attempts')
    validation.isPartial = true
    logger.warn('❌ No sections found after all extraction attempts');
    return validation;
  }

  // Warn if very few sections
  if (availableSections.length < 3) {
    validation.warnings.push(`Only ${availableSections.length} sections found - this may be incomplete content`);
    validation.isPartial = true;
  }

  // Process each section with enhanced error handling
  let processedSectionCount = 0;
  const totalSections = availableSections.length;

  Object.entries(processedContent).forEach(([sectionId, sectionContent]) => {
    logger.debug(`🔍 Processing section: ${sectionId}`, {
      sectionType: typeof sectionContent,
      isObject: typeof sectionContent === 'object',
      isNull: sectionContent === null,
      keys: typeof sectionContent === 'object' && sectionContent !== null ? Object.keys(sectionContent) : []
    });

    if (!sectionContent || typeof sectionContent !== 'object') {
      validation.warnings.push(`Section ${sectionId} has invalid format (${typeof sectionContent})`)
      validation.isPartial = true
      logger.warn(`⚠️ Section ${sectionId} invalid:`, {
        type: typeof sectionContent,
        isNull: sectionContent === null,
        value: sectionContent
      });
      return
    }

    try {
      const processedSection = processSectionContent(
        sectionId,
        sectionContent as SectionContent,
        expectedCounts
      )

      if (processedSection.hasIssues) {
        validation.warnings.push(...processedSection.warnings)
        validation.isPartial = true
        logger.debug(`⚠️ Section ${sectionId} had processing issues:`, processedSection.warnings);
      } else {
        processedSectionCount++;
      }

      validation.content[sectionId] = processedSection.content
      logger.debug(`✅ Section ${sectionId} processed successfully`);

    } catch (error) {
      validation.warnings.push(`Section ${sectionId} processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      validation.isPartial = true
      logger.error(`❌ Section ${sectionId} processing error:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Still add the section with basic processing
      validation.content[sectionId] = sectionContent;
    }
  })

  logger.debug('✅ Content validation completed:', {
    totalSections,
    processedSuccessfully: processedSectionCount,
    successRate: `${Math.round((processedSectionCount / totalSections) * 100)}%`,
    finalSectionCount: Object.keys(validation.content).length,
    isPartial: validation.isPartial,
    warningCount: validation.warnings.length,
    errorCount: validation.errors.length
  });


  return validation
}

/**
 * Processes and validates individual section content
 */
function processSectionContent(
  sectionId: string,
  content: SectionContent,
  expectedCounts?: Record<string, number>
): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Special handling for Hero sections
  if (sectionId.includes('Hero') ||
      ['leftCopyRightImage', 'centerStacked', 'splitScreen', 'imageFirst'].some(layout => sectionId.includes(layout))) {
    const processedHero = processHeroContent(sectionId, content);
    result.content = processedHero.content;
    result.warnings = processedHero.warnings;
    result.hasIssues = processedHero.hasIssues;
    return result;
  }

  // Special handling for FAQ sections
  if (sectionId.includes('InlineQnAList')) {
    const processedInlineQnA = processInlineQnAListContent(sectionId, content);
    result.content = processedInlineQnA.content;
    result.warnings = processedInlineQnA.warnings;
    result.hasIssues = processedInlineQnA.hasIssues;
    return result;
  }

  if (sectionId.includes('AccordionFAQ')) {
    const processedAccordion = processAccordionFAQContent(sectionId, content);
    result.content = processedAccordion.content;
    result.warnings = processedAccordion.warnings;
    result.hasIssues = processedAccordion.hasIssues;
    return result;
  }

  if (sectionId.includes('TwoColumnFAQ')) {
    const processedTwoColumn = processTwoColumnFAQContent(sectionId, content);
    result.content = processedTwoColumn.content;
    result.warnings = processedTwoColumn.warnings;
    result.hasIssues = processedTwoColumn.hasIssues;
    return result;
  }

  if (sectionId.includes('SegmentedFAQTabs')) {
    const processedSegmented = processSegmentedFAQTabsContent(sectionId, content);
    result.content = processedSegmented.content;
    result.warnings = processedSegmented.warnings;
    result.hasIssues = processedSegmented.hasIssues;
    return result;
  }

  // Special handling for Testimonial sections
  if (sectionId.includes('VideoTestimonials')) {
    const processedVideoTestimonials = processVideoTestimonialsContent(sectionId, content);
    result.content = processedVideoTestimonials.content;
    result.warnings = processedVideoTestimonials.warnings;
    result.hasIssues = processedVideoTestimonials.hasIssues;
    return result;
  }

  // Special handling for SideBySideBlocks sections
  if (sectionId.includes('SideBySideBlocks')) {
    const processedSideBySide = processSideBySideBlocksContent(sectionId, content);
    result.content = processedSideBySide.content;
    result.warnings = processedSideBySide.warnings;
    result.hasIssues = processedSideBySide.hasIssues;
    return result;
  }

  // Special handling for remaining BeforeAfter sections
  if (sectionId.includes('StackedTextVisual') || sectionId.includes('SplitCard')) {
    const processedGeneric = processBeforeAfterGenericContent(sectionId, content);
    result.content = processedGeneric.content;
    result.warnings = processedGeneric.warnings;
    result.hasIssues = processedGeneric.hasIssues;
    return result;
  }

  // Generic CTA section processing
  if (sectionId.includes('CTA') || sectionId.includes('Close')) {
    const processedCTA = processGenericCTAContent(sectionId, content);
    result.content = processedCTA.content;
    result.warnings = processedCTA.warnings;
    result.hasIssues = processedCTA.hasIssues;
    return result;
  }

  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue)

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value
    } else {
      result.warnings.push(...processedElement.warnings)
      result.hasIssues = true
      // Use fallback or empty value
      result.content[elementKey] = processedElement.fallback
    }
  })

  return result
}

/**
 * Determines if a field should contain pipe-separated data based on naming patterns
 */
function isPipeSeparatedField(elementKey: string): boolean {
  const pipeSeparatedPatterns = [
    // Original patterns
    'titles', 'descriptions', 'quotes', 'names',
    'items', 'labels', 'steps', 'list', 'types',
    'points', 'features', 'benefits', 'metrics',
    // Additional patterns for UIBlocks
    'values', 'before', 'after', 'improvements',
    'authors', 'companies', 'roles', 'emojis',
    'outcomes', 'timeframes', 'wins', 'personas',
    'categories', 'badges', 'awards', 'standards',
    'reviews', 'ratings', 'stats', 'indicators',
    'guarantees', 'outlets', 'options', 'durations',
    'visuals', 'actions', 'keywords', 'tags',
    'technologies', 'connections', 'triggers',
    'pairs', 'headers', 'columns', 'tiers',
    'prices', 'ctas', 'highlights', 'details',
    'solutions', 'scenarios', 'journeys', 'stages',
    'icons', 'questions', 'responses', 'answers',
    'blocks', 'statements', 'problems', 'reframes'
  ];
  return pipeSeparatedPatterns.some(pattern => elementKey.includes(pattern));
}

/**
 * Processes individual elements with validation
 */
function processElement(sectionId: string, elementKey: string, value: any): {
  isValid: boolean;
  value: string | string[];
  fallback: string | string[];
  warnings: string[];
} {
  const result = {
    isValid: true,
    value: value,
    fallback: getElementFallback(elementKey),
    warnings: [] as string[]
  };

  // Type validation
  if (typeof value !== 'string' && !Array.isArray(value)) {
    result.isValid = false
    result.warnings.push(`${sectionId}.${elementKey}: Expected string or array, got ${typeof value}`)
    return result
  }

  // Special handling: prevent arrays from being assigned to ANY singular fields
  if (Array.isArray(value) && !isPipeSeparatedField(elementKey)) {
    // Any non-pipe-separated field that receives an array should use the first element
    result.warnings.push(`${sectionId}.${elementKey}: Singular field received array, using first element`)

    if (elementKey.includes('icon')) {
      // Icon fields get emoji fallback if empty
      result.value = value[0] || '❓'
    } else {
      // Other singular fields use first element or empty string
      result.value = value[0] || ''
    }
    return result
  }

  // Special handling: clean up placeholder text in icon fields
  if (typeof value === 'string' && elementKey.includes('icon')) {
    const stringValue = value.trim()
    // Expanded placeholder detection patterns
    const invalidPatterns = [
      'url_to_', '.jpg', '.png', '.svg', '.gif', '.webp',
      'image', 'placeholder', 'icon_', 'path_to',
      'assets/', 'src/', 'http', 'https', 'www.',
      'default', 'generic', 'template'
    ]

    const isInvalidIcon = invalidPatterns.some(pattern => stringValue.toLowerCase().includes(pattern)) ||
                         stringValue.length > 10 || // Icons should be short (1-4 characters typically)
                         (stringValue.length > 4 && !/^[\p{Emoji}]+$/u.test(stringValue)) // Non-emoji text longer than 4 chars

    if (isInvalidIcon) {
      result.warnings.push(`${sectionId}.${elementKey}: Invalid icon value "${stringValue}", using contextual emoji`)

      // Enhanced contextual default emojis based on field name and content
      const lowerValue = stringValue.toLowerCase()

      // First check field name patterns
      if (elementKey.includes('success')) result.value = '🎉'
      else if (elementKey.includes('metric')) result.value = '📊'
      else if (elementKey.includes('timeline')) result.value = '📅'
      else if (elementKey.includes('feature')) result.value = '⭐'
      else if (elementKey.includes('benefit')) result.value = '✅'
      else if (elementKey.includes('highlight')) result.value = '💡'
      else if (elementKey.includes('mechanism')) result.value = '⚙️'
      else if (elementKey.includes('process')) result.value = '🔄'
      else if (elementKey.includes('step')) result.value = '👣'
      else if (elementKey.includes('security')) result.value = '🔒'
      else if (elementKey.includes('performance')) result.value = '⚡'
      else if (elementKey.includes('analytics')) result.value = '📈'
      else if (elementKey.includes('integration')) result.value = '🔗'
      else if (elementKey.includes('user')) result.value = '👤'
      else if (elementKey.includes('goal')) result.value = '🎯'
      // Then check content patterns for common outcome text
      else if (lowerValue.includes('time') && (lowerValue.includes('save') || lowerValue.includes('faster') || lowerValue.includes('quick'))) result.value = '⚡'
      else if (lowerValue.includes('revenue') || lowerValue.includes('profit') || lowerValue.includes('money') || lowerValue.includes('income')) result.value = '💰'
      else if (lowerValue.includes('growth') || lowerValue.includes('increase') || lowerValue.includes('scale') || lowerValue.includes('expand')) result.value = '📈'
      else if (lowerValue.includes('efficiency') || lowerValue.includes('optimize') || lowerValue.includes('streamline') || lowerValue.includes('productivity')) result.value = '⚡'
      else if (lowerValue.includes('cost') && (lowerValue.includes('reduc') || lowerValue.includes('save') || lowerValue.includes('lower'))) result.value = '💰'
      else if (lowerValue.includes('customer') || lowerValue.includes('client') || lowerValue.includes('satisfaction')) result.value = '👥'
      else if (lowerValue.includes('security') || lowerValue.includes('protect') || lowerValue.includes('safe') || lowerValue.includes('secure')) result.value = '🔒'
      else if (lowerValue.includes('automat') || lowerValue.includes('smart') || lowerValue.includes('ai') || lowerValue.includes('intelligent')) result.value = '🤖'
      else if (lowerValue.includes('innovation') || lowerValue.includes('modern') || lowerValue.includes('cutting') || lowerValue.includes('advanced')) result.value = '💡'
      else if (lowerValue.includes('collaboration') || lowerValue.includes('teamwork') || lowerValue.includes('together') || lowerValue.includes('connect')) result.value = '👥'
      else if (lowerValue.includes('quality') || lowerValue.includes('excellence') || lowerValue.includes('superior') || lowerValue.includes('premium')) result.value = '⭐'
      else if (lowerValue.includes('insight') || lowerValue.includes('analytics') || lowerValue.includes('data') || lowerValue.includes('report')) result.value = '📊'
      else if (lowerValue.includes('engagement') || lowerValue.includes('interaction') || lowerValue.includes('active') || lowerValue.includes('participation')) result.value = '🎯'
      else if (lowerValue.includes('conversion') || lowerValue.includes('sales') || lowerValue.includes('lead') || lowerValue.includes('acquisition')) result.value = '🎯'
      else if (lowerValue.includes('retention') || lowerValue.includes('loyalty') || lowerValue.includes('repeat') || lowerValue.includes('return')) result.value = '❤️'
      else if (lowerValue.includes('compliance') || lowerValue.includes('regulation') || lowerValue.includes('standard') || lowerValue.includes('audit')) result.value = '✅'
      else result.value = '❓'

      return result
    } else {
      // Final safety check: ensure ALL icon fields contain actual emojis
      const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\u200D]/gu
      if (!emojiRegex.test(stringValue)) {
        // Text detected in icon field - force emoji conversion
        result.warnings.push(`${sectionId}.${elementKey}: Text detected in icon field "${stringValue}", converting to emoji`)

        const lowerValue = stringValue.toLowerCase()
        if (lowerValue.includes('time') && (lowerValue.includes('save') || lowerValue.includes('faster') || lowerValue.includes('quick'))) result.value = '⚡'
        else if (lowerValue.includes('revenue') || lowerValue.includes('profit') || lowerValue.includes('money') || lowerValue.includes('income')) result.value = '💰'
        else if (lowerValue.includes('growth') || lowerValue.includes('increase') || lowerValue.includes('scale') || lowerValue.includes('expand')) result.value = '📈'
        else if (lowerValue.includes('efficiency') || lowerValue.includes('optimize') || lowerValue.includes('streamline') || lowerValue.includes('productivity')) result.value = '⚡'
        else if (lowerValue.includes('cost') && (lowerValue.includes('reduc') || lowerValue.includes('save') || lowerValue.includes('lower'))) result.value = '💰'
        else if (lowerValue.includes('customer') || lowerValue.includes('client') || lowerValue.includes('satisfaction')) result.value = '👥'
        else if (lowerValue.includes('security') || lowerValue.includes('protect') || lowerValue.includes('safe') || lowerValue.includes('secure')) result.value = '🔒'
        else if (lowerValue.includes('automat') || lowerValue.includes('smart') || lowerValue.includes('ai') || lowerValue.includes('intelligent')) result.value = '🤖'
        else if (lowerValue.includes('innovation') || lowerValue.includes('modern') || lowerValue.includes('cutting') || lowerValue.includes('advanced')) result.value = '💡'
        else if (lowerValue.includes('collaboration') || lowerValue.includes('teamwork') || lowerValue.includes('together') || lowerValue.includes('connect')) result.value = '👥'
        else if (lowerValue.includes('quality') || lowerValue.includes('excellence') || lowerValue.includes('superior') || lowerValue.includes('premium')) result.value = '⭐'
        else if (lowerValue.includes('insight') || lowerValue.includes('analytics') || lowerValue.includes('data') || lowerValue.includes('report')) result.value = '📊'
        else if (lowerValue.includes('engagement') || lowerValue.includes('interaction') || lowerValue.includes('active') || lowerValue.includes('participation')) result.value = '🎯'
        else if (lowerValue.includes('conversion') || lowerValue.includes('sales') || lowerValue.includes('lead') || lowerValue.includes('acquisition')) result.value = '🎯'
        else if (lowerValue.includes('retention') || lowerValue.includes('loyalty') || lowerValue.includes('repeat') || lowerValue.includes('return')) result.value = '❤️'
        else if (lowerValue.includes('compliance') || lowerValue.includes('regulation') || lowerValue.includes('standard') || lowerValue.includes('audit')) result.value = '✅'
        else if (lowerValue.includes('success')) result.value = '🎉'
        else if (lowerValue.includes('feature')) result.value = '⭐'
        else if (lowerValue.includes('benefit')) result.value = '✅'
        else if (lowerValue.includes('goal')) result.value = '🎯'
        else result.value = '❓' // Ultimate fallback

        return result
      }
    }
  }

  // Convert JSON arrays to pipe-separated strings for appropriate fields
  if (Array.isArray(value) && isPipeSeparatedField(elementKey)) {
    // Validate array items before conversion
    const invalidItems = value.filter(item => typeof item !== 'string' || !item.trim())
    if (invalidItems.length > 0) {
      result.isValid = false
      result.warnings.push(`${sectionId}.${elementKey}: Contains ${invalidItems.length} invalid items in array`)
      return result
    }

    // Convert to pipe-separated string
    result.value = value.join('|')
    // Continue validation as string
    value = result.value
  }

  // Convert stringified JSON arrays to pipe-separated strings for appropriate fields
  if (typeof value === 'string' && isPipeSeparatedField(elementKey)) {
    const trimmedValue = value.trim()
    // Check if string looks like JSON array: starts with [ and ends with ]
    if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
      try {
        const parsedArray = JSON.parse(trimmedValue)
        if (Array.isArray(parsedArray)) {
          // Validate parsed array items
          const invalidItems = parsedArray.filter(item => typeof item !== 'string' || !item.trim())
          if (invalidItems.length > 0) {
            result.isValid = false
            result.warnings.push(`${sectionId}.${elementKey}: Stringified array contains ${invalidItems.length} invalid items`)
            return result
          }

          // Convert to pipe-separated string
          result.value = parsedArray.join('|')
          value = result.value
        }
      } catch (error) {
        // If JSON parsing fails, continue with string validation (fallback)
        result.warnings.push(`${sectionId}.${elementKey}: Failed to parse potential JSON array: ${trimmedValue}`)
      }
    }
  }

  // String validation
  if (typeof value === 'string') {
    if (!value.trim()) {
      result.isValid = false
      result.warnings.push(`${sectionId}.${elementKey}: Empty string`)
      return result
    }

    // Length validation
    const lengthValidation = validateStringLength(elementKey, value)
    if (!lengthValidation.isValid) {
      result.warnings.push(`${sectionId}.${elementKey}: ${lengthValidation.message}`)
      if (lengthValidation.severity === 'error') {
        result.isValid = false
        return result
      }
    }
  }

  // Array validation (for fields that should remain as arrays)
  if (Array.isArray(value)) {
    if (value.length === 0) {
      result.isValid = false
      result.warnings.push(`${sectionId}.${elementKey}: Empty array`)
      return result
    }

    const invalidItems = value.filter(item => typeof item !== 'string' || !item.trim())
    if (invalidItems.length > 0) {
      result.isValid = false
      result.warnings.push(`${sectionId}.${elementKey}: Contains ${invalidItems.length} invalid items`)
      return result
    }
  }

  return result
}

/**
 * Validates string length based on element type
 */
function validateStringLength(elementKey: string, value: string): {
  isValid: boolean;
  message: string;
  severity: 'warning' | 'error';
} {
  const lengthRules: Record<string, { min: number; max: number; severity: 'warning' | 'error' }> = {
    headline: { min: 10, max: 100, severity: 'warning' },
    subheadline: { min: 15, max: 150, severity: 'warning' },
    cta_text: { min: 5, max: 30, severity: 'error' },
    description: { min: 20, max: 300, severity: 'warning' },
    quote: { min: 20, max: 200, severity: 'warning' },
    // CTA-specific field rules
    urgency_text: { min: 10, max: 80, severity: 'warning' },
    scarcity_text: { min: 10, max: 100, severity: 'warning' },
    trust_item: { min: 5, max: 50, severity: 'warning' },
    form_label: { min: 5, max: 40, severity: 'warning' },
    placeholder_text: { min: 5, max: 60, severity: 'warning' },
    privacy_text: { min: 10, max: 150, severity: 'warning' },
    value_proposition: { min: 15, max: 120, severity: 'warning' },
    testimonial_quote: { min: 30, max: 400, severity: 'warning' },
    testimonial_author: { min: 3, max: 50, severity: 'error' },
    testimonial_company: { min: 2, max: 50, severity: 'error' },
    testimonial_title: { min: 5, max: 80, severity: 'warning' },
    case_study_tag: { min: 5, max: 30, severity: 'warning' },
    customer_count: { min: 2, max: 20, severity: 'warning' },
    average_rating: { min: 2, max: 10, severity: 'warning' },
    guarantee_text: { min: 10, max: 200, severity: 'warning' },
    countdown_label: { min: 5, max: 40, severity: 'warning' }
  }

  // Find matching rule (check for partial matches)
  let rule = lengthRules[elementKey]
  if (!rule) {
    for (const [key, ruleValue] of Object.entries(lengthRules)) {
      if (elementKey.includes(key)) {
        rule = ruleValue
        break
      }
    }
  }

  // Default rule if no specific rule found
  if (!rule) {
    rule = { min: 1, max: 500, severity: 'warning' }
  }

  const length = value.trim().length

  if (length < rule.min) {
    return {
      isValid: false,
      message: `Too short (${length} chars, min ${rule.min})`,
      severity: rule.severity
    }
  }

  if (length > rule.max) {
    return {
      isValid: false,
      message: `Too long (${length} chars, max ${rule.max})`,
      severity: rule.severity
    }
  }

  return { isValid: true, message: '', severity: 'warning' }
}

/**
 * Provides fallback content for elements
 */
function getElementFallback(elementKey: string): string | string[] {
  const fallbacks: Record<string, string | string[]> = {
    headline: "Transform Your Business Today",
    subheadline: "Join thousands of companies already seeing results",
    cta_text: "Get Started",
    description: "Discover how our solution can help you achieve your goals",
    quote: "This solution changed everything for our business",

    // CTA-specific fallbacks
    urgency_text: "Limited time offer - Act now!",
    scarcity_text: "Only 50 spots remaining",
    trust_item_1: "Secure & encrypted",
    trust_item_2: "GDPR compliant",
    trust_item_3: "24/7 support",
    form_label: "Work Email",
    placeholder_text: "Enter your email address",
    privacy_text: "We respect your privacy. Unsubscribe at any time.",
    value_proposition: "Get more done in less time with powerful automation",
    testimonial_quote: "This platform transformed our workflow and increased our productivity by 300%.",
    testimonial_author: "Sarah Johnson",
    testimonial_company: "TechCorp Inc.",
    testimonial_title: "Head of Operations",
    case_study_tag: "Success Story",
    customer_count: "10,000+",
    average_rating: "4.9/5",
    guarantee_text: "30-day money-back guarantee",
    countdown_label: "Sale ends in:",
    availability_text: "Only 3 spots left at this price",
    bonus_text: "Plus get free premium support",
    supporting_text: "Trusted by industry leaders worldwide",
    secondary_cta: "Learn More",

    // Array fallbacks
    feature_titles: ["Feature 1", "Feature 2", "Feature 3"],
    feature_descriptions: ["Benefit description 1", "Benefit description 2", "Benefit description 3"],
    testimonial_quotes: ["Great product!", "Highly recommended", "Best investment we made"],
    questions: ["How does it work?", "Is it secure?", "What's included?"],
    answers: ["It works seamlessly", "Yes, enterprise-grade security", "Everything you need"],
    benefits: ["Free 14-day trial", "No credit card required", "Cancel anytime"],
    trust_badges: ["SOC 2 Certified", "GDPR Compliant", "SSL Secured"],
    value_propositions: ["Save 10+ hours weekly", "Increase productivity by 200%", "Reduce errors by 95%"],
    value_descriptions: ["Automate repetitive tasks", "Streamline your workflow", "Focus on what matters most"]
  }

  // Check for exact match
  if (fallbacks[elementKey]) {
    return fallbacks[elementKey];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(fallbacks)) {
    if (elementKey.includes(key)) {
      return value;
    }
  }

  // Determine if should be array or string based on element name
  const arrayIndicators = ['titles', 'descriptions', 'quotes', 'questions', 'answers', 'items', 'list']
  const shouldBeArray = arrayIndicators.some(indicator => elementKey.includes(indicator))

  return shouldBeArray ? ["Default content"] : "Default content";
}

/**
 * Special processing for InlineQnAList sections to handle dual format support
 */
function processInlineQnAListContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check if content uses legacy pipe-separated format (check both singular and plural)
  const hasLegacyFormat = (content.questions && content.answers) || (content.question && content.answer);
  const hasIndividualFields = Object.keys(content).some(key =>
    key.startsWith('question_') || key.startsWith('answer_')
  );

  // Process legacy format and convert to individual fields if needed
  if (hasLegacyFormat && !hasIndividualFields) {
    const convertedContent = convertLegacyToIndividualFields(content);
    result.warnings.push(`${sectionId}: Converted legacy pipe-separated format to individual Q&A fields`);
    Object.assign(result.content, convertedContent);
  }

  // Process all fields normally
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Validate Q&A pairs consistency
  const pairValidation = validateQnAPairs(result.content);
  if (pairValidation.warnings.length > 0) {
    result.warnings.push(...pairValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Converts legacy pipe-separated format to individual Q&A fields
 */
function convertLegacyToIndividualFields(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  // Check both singular and plural forms (AI might generate either)
  const questionsData = content.questions || content.question;
  const answersData = content.answers || content.answer;

  // Handle both string (pipe-separated) and array formats
  let questions: string[] = [];
  let answers: string[] = [];

  if (typeof questionsData === 'string') {
    questions = questionsData.split('|').map(q => q.trim()).filter(Boolean);
  } else if (Array.isArray(questionsData)) {
    questions = questionsData.map(q => String(q).trim()).filter(Boolean);
  }

  if (typeof answersData === 'string') {
    answers = answersData.split('|').map(a => a.trim()).filter(Boolean);
  } else if (Array.isArray(answersData)) {
    answers = answersData.map(a => String(a).trim()).filter(Boolean);
  }

  // Convert up to 6 Q&A pairs
  const maxPairs = Math.min(questions.length, answers.length, 6);

  for (let i = 0; i < maxPairs; i++) {
    converted[`question_${i + 1}`] = questions[i];
    converted[`answer_${i + 1}`] = answers[i] || '';
  }

  return converted;
}

/**
 * Validates Q&A pairs for consistency
 */
function validateQnAPairs(content: SectionContent): {
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for orphaned questions or answers
  for (let i = 1; i <= 6; i++) {
    const question = content[`question_${i}`];
    const answer = content[`answer_${i}`];

    if (question && !answer) {
      warnings.push(`Question ${i} has no corresponding answer`);
    }
    if (answer && !question) {
      warnings.push(`Answer ${i} has no corresponding question`);
    }
  }

  return { warnings };
}

/**
 * Special processing for Hero sections
 */
function processHeroContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Handle trust items - support both individual fields and legacy pipe-separated format
  const hasTrustItems = content.trust_items;
  const hasIndividualTrustItems = Object.keys(content).some(key => key.startsWith('trust_item_'));

  if (hasTrustItems && !hasIndividualTrustItems) {
    // Convert pipe-separated trust_items to individual fields
    if (typeof content.trust_items === 'string') {
      const trustItems = content.trust_items.split('|').map(item => item.trim()).filter(Boolean);
      trustItems.forEach((item, index) => {
        if (index < 5) {
          result.content[`trust_item_${index + 1}`] = item;
        }
      });
      // Keep the legacy format as well for backward compatibility
      result.content.trust_items = content.trust_items;
      result.warnings.push(`${sectionId}: Converted trust_items to individual fields`);
    }
  }

  // Validate social proof fields
  if (content.rating_value && typeof content.rating_value === 'string') {
    // Ensure rating format is valid (e.g., "4.9/5" or "4.9")
    if (!content.rating_value.match(/^\d+(\.\d+)?(\/\d+)?$/)) {
      result.warnings.push(`${sectionId}: rating_value should be in format "4.9/5" or "4.9"`);
      result.hasIssues = true;
    }
  }

  if (content.customer_names && typeof content.customer_names === 'string') {
    // Validate pipe-separated customer names
    const names = content.customer_names.split('|');
    if (names.length > 6) {
      result.warnings.push(`${sectionId}: customer_names should have max 6 names`);
      content.customer_names = names.slice(0, 6).join('|');
    }
  }

  // Process badge text - ensure it's not too long
  if (content.badge_text && typeof content.badge_text === 'string' && content.badge_text.length > 30) {
    result.warnings.push(`${sectionId}: badge_text should be concise (max 30 chars)`);
    result.hasIssues = true;
  }

  // Process all fields normally
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(processedElement.warnings?.[0] || `${sectionId}: Invalid value for ${elementKey}`);
      result.hasIssues = true;
    }
  });

  // Ensure required fields are present
  if (!result.content.headline) {
    result.warnings.push(`${sectionId}: Missing required field 'headline'`);
    result.hasIssues = true;
  }
  if (!result.content.cta_text) {
    result.warnings.push(`${sectionId}: Missing required field 'cta_text'`);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for AccordionFAQ sections
 */
function processAccordionFAQContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for legacy format and convert (check both singular and plural)
  const hasLegacyFormat = (content.questions && content.answers) || (content.question && content.answer);
  const hasIndividualFields = Object.keys(content).some(key =>
    key.startsWith('question_') || key.startsWith('answer_')
  );

  if (hasLegacyFormat && !hasIndividualFields) {
    const convertedContent = convertLegacyToIndividualFields(content);
    result.warnings.push(`${sectionId}: Converted legacy format to individual Q&A fields`);
    Object.assign(result.content, convertedContent);
  }

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Validate Q&A pairs
  const pairValidation = validateQnAPairs(result.content);
  if (pairValidation.warnings.length > 0) {
    result.warnings.push(...pairValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for TwoColumnFAQ sections
 */
function processTwoColumnFAQContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for legacy format conversion (check both singular and plural)
  const hasLegacyFormat = (content.questions && content.answers) || (content.question && content.answer);
  if (hasLegacyFormat) {
    const convertedContent = convertTwoColumnLegacyFormat(content);
    result.warnings.push(`${sectionId}: Converted legacy format to two-column Q&A fields`);
    Object.assign(result.content, convertedContent);
  }

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Validate left/right column Q&A pairs
  const columnValidation = validateTwoColumnQnAPairs(result.content);
  if (columnValidation.warnings.length > 0) {
    result.warnings.push(...columnValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for SegmentedFAQTabs sections
 */
function processSegmentedFAQTabsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for legacy format conversion (check both singular and plural)
  const hasLegacyFormat = content.tab_labels || content.tab_label || content.questions || content.question;
  if (hasLegacyFormat) {
    const convertedContent = convertSegmentedTabsLegacyFormat(content);
    result.warnings.push(`${sectionId}: Converted legacy format to tab-specific Q&A fields`);
    Object.assign(result.content, convertedContent);
  }

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Validate tab structure
  const tabValidation = validateTabQnAPairs(result.content);
  if (tabValidation.warnings.length > 0) {
    result.warnings.push(...tabValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

// Conversion and validation helper functions for FAQ layouts

/**
 * Converts two-column legacy format to individual fields
 */
function convertTwoColumnLegacyFormat(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  // Check both singular and plural forms (AI might generate either)
  const questionsData = content.questions || content.question;
  const answersData = content.answers || content.answer;

  // Handle both string (pipe-separated) and array formats
  let questions: string[] = [];
  let answers: string[] = [];

  if (typeof questionsData === 'string') {
    questions = questionsData.split('|').map(q => q.trim()).filter(Boolean);
  } else if (Array.isArray(questionsData)) {
    questions = questionsData.map(q => String(q).trim()).filter(Boolean);
  }

  if (typeof answersData === 'string') {
    answers = answersData.split('|').map(a => a.trim()).filter(Boolean);
  } else if (Array.isArray(answersData)) {
    answers = answersData.map(a => String(a).trim()).filter(Boolean);
  }

  // Split into left and right columns (3 items each)
  const leftQuestions = questions.slice(0, 3);
  const leftAnswers = answers.slice(0, 3);
  const rightQuestions = questions.slice(3, 6);
  const rightAnswers = answers.slice(3, 6);

  // Convert left column
  for (let i = 0; i < Math.min(leftQuestions.length, 3); i++) {
    converted[`left_question_${i + 1}`] = leftQuestions[i];
    converted[`left_answer_${i + 1}`] = leftAnswers[i] || '';
  }

  // Convert right column
  for (let i = 0; i < Math.min(rightQuestions.length, 3); i++) {
    converted[`right_question_${i + 1}`] = rightQuestions[i];
    converted[`right_answer_${i + 1}`] = rightAnswers[i] || '';
  }

  return converted;
}

/**
 * Converts segmented tabs legacy format to individual fields
 */
function convertSegmentedTabsLegacyFormat(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  // Handle tab labels (both string and array)
  const tabLabelsData = content.tab_labels || content.tab_label;
  if (typeof tabLabelsData === 'string') {
    const labels = tabLabelsData.split('|').map(l => l.trim()).filter(Boolean);
    for (let i = 0; i < Math.min(labels.length, 3); i++) {
      converted[`tab_${i + 1}_label`] = labels[i];
    }
  } else if (Array.isArray(tabLabelsData)) {
    const labels = tabLabelsData.map(l => String(l).trim()).filter(Boolean);
    for (let i = 0; i < Math.min(labels.length, 3); i++) {
      converted[`tab_${i + 1}_label`] = labels[i];
    }
  }

  // Check both singular and plural forms (AI might generate either)
  const questionsData = content.questions || content.question;
  const answersData = content.answers || content.answer;

  // Handle both string (pipe-separated) and array formats
  let questions: string[] = [];
  let answers: string[] = [];

  if (typeof questionsData === 'string') {
    questions = questionsData.split('|').map(q => q.trim()).filter(Boolean);
  } else if (Array.isArray(questionsData)) {
    questions = questionsData.map(q => String(q).trim()).filter(Boolean);
  }

  if (typeof answersData === 'string') {
    answers = answersData.split('|').map(a => a.trim()).filter(Boolean);
  } else if (Array.isArray(answersData)) {
    answers = answersData.map(a => String(a).trim()).filter(Boolean);
  }

  // Distribute Q&A across tabs (assume 3 questions per tab)
  const questionsPerTab = 3;
  for (let tab = 1; tab <= 3; tab++) {
    const startIdx = (tab - 1) * questionsPerTab;
    const tabQuestions = questions.slice(startIdx, startIdx + questionsPerTab);
    const tabAnswers = answers.slice(startIdx, startIdx + questionsPerTab);

    for (let i = 0; i < Math.min(tabQuestions.length, questionsPerTab); i++) {
      converted[`tab_${tab}_question_${i + 1}`] = tabQuestions[i];
      converted[`tab_${tab}_answer_${i + 1}`] = tabAnswers[i] || '';
    }
  }

  return converted;
}

// Validation helper functions for FAQ layouts

/**
 * Validates two-column Q&A pairs
 */
function validateTwoColumnQnAPairs(content: SectionContent): { warnings: string[] } {
  const warnings: string[] = [];

  // Check left column pairs
  for (let i = 1; i <= 3; i++) {
    const question = content[`left_question_${i}`];
    const answer = content[`left_answer_${i}`];
    if (question && !answer) {
      warnings.push(`Left column question ${i} has no corresponding answer`);
    }
    if (answer && !question) {
      warnings.push(`Left column answer ${i} has no corresponding question`);
    }
  }

  // Check right column pairs
  for (let i = 1; i <= 3; i++) {
    const question = content[`right_question_${i}`];
    const answer = content[`right_answer_${i}`];
    if (question && !answer) {
      warnings.push(`Right column question ${i} has no corresponding answer`);
    }
    if (answer && !question) {
      warnings.push(`Right column answer ${i} has no corresponding question`);
    }
  }

  return { warnings };
}

/**
 * Validates tab Q&A structure
 */
function validateTabQnAPairs(content: SectionContent): { warnings: string[] } {
  const warnings: string[] = [];

  for (let tab = 1; tab <= 3; tab++) {
    for (let i = 1; i <= 3; i++) {
      const question = content[`tab_${tab}_question_${i}`];
      const answer = content[`tab_${tab}_answer_${i}`];
      if (question && !answer) {
        warnings.push(`Tab ${tab} question ${i} has no corresponding answer`);
      }
      if (answer && !question) {
        warnings.push(`Tab ${tab} answer ${i} has no corresponding question`);
      }
    }
  }

  return { warnings };
}

/**
 * Special processing for SideBySideBlocks sections
 */
function processSideBySideBlocksContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    // Special handling for trust_items field (pipe-separated)
    if (elementKey === 'trust_items') {
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        // Already pipe-separated, validate format
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length > 0) {
          result.content[elementKey] = items.join(' | ');
        } else {
          result.warnings.push(`${sectionId}: trust_items has invalid pipe-separated format`);
          result.hasIssues = true;
          result.content[elementKey] = '';
        }
      } else {
        // Process normally
        const processedElement = processElement(sectionId, elementKey, elementValue);
        result.content[elementKey] = processedElement.value;
        if (!processedElement.isValid) {
          result.warnings.push(...processedElement.warnings);
          result.hasIssues = true;
        }
      }
    }
    // Special handling for icon fields (ensure single emoji)
    else if (elementKey.includes('icon')) {
      const iconValue = String(elementValue || '').trim();
      if (iconValue) {
        // Extract first emoji if multiple characters
        const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\u200D]/gu;
        const emojis = iconValue.match(emojiRegex);
        if (emojis && emojis.length > 0) {
          result.content[elementKey] = emojis[0];
        } else {
          // Use default based on field name
          if (elementKey === 'before_icon') {
            result.content[elementKey] = '⚠️';
          } else if (elementKey === 'after_icon') {
            result.content[elementKey] = '✅';
          } else {
            result.content[elementKey] = '📌';
          }
          result.warnings.push(`${sectionId}: ${elementKey} had invalid icon format, using default`);
        }
      } else {
        // Set defaults for empty icons
        if (elementKey === 'before_icon') {
          result.content[elementKey] = '⚠️';
        } else if (elementKey === 'after_icon') {
          result.content[elementKey] = '✅';
        } else {
          result.content[elementKey] = '';
        }
      }
    }
    // Regular processing for other fields
    else {
      const processedElement = processElement(sectionId, elementKey, elementValue);

      if (processedElement.isValid) {
        result.content[elementKey] = processedElement.value;
      } else {
        result.warnings.push(...processedElement.warnings);
        result.hasIssues = true;
        result.content[elementKey] = processedElement.fallback;
      }
    }
  });

  // Validate paired fields
  const pairValidation = validateBeforeAfterPairs(result.content);
  if (pairValidation.warnings.length > 0) {
    result.warnings.push(...pairValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Validates Before/After paired fields for consistency
 */
function validateBeforeAfterPairs(content: SectionContent): {
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for mismatched before/after content
  if (content.before_label && !content.after_label) {
    warnings.push('Before label exists without corresponding after label');
  }
  if (content.after_label && !content.before_label) {
    warnings.push('After label exists without corresponding before label');
  }
  if (content.before_description && !content.after_description) {
    warnings.push('Before description exists without corresponding after description');
  }
  if (content.after_description && !content.before_description) {
    warnings.push('After description exists without corresponding before description');
  }

  return { warnings };
}

/**
 * Generic processing for BeforeAfter sections
 */
function processBeforeAfterGenericContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    // Special handling for pipe-separated fields
    if (elementKey.includes('stats') || elementKey.includes('steps') || elementKey.includes('journey') ||
        elementKey === 'trust_items') {
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        // Already pipe-separated, validate format
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length > 0) {
          result.content[elementKey] = items.join(' | ');
        } else {
          result.warnings.push(`${sectionId}: ${elementKey} has invalid pipe-separated format`);
          result.hasIssues = true;
          result.content[elementKey] = '';
        }
      } else {
        // Process normally
        const processedElement = processElement(sectionId, elementKey, elementValue);
        result.content[elementKey] = processedElement.value;
        if (!processedElement.isValid) {
          result.warnings.push(...processedElement.warnings);
          result.hasIssues = true;
        }
      }
    }
    // Special handling for icon fields (ensure single emoji)
    else if (elementKey.includes('icon')) {
      const iconValue = String(elementValue || '').trim();
      if (iconValue) {
        // Extract first emoji if multiple characters
        const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\u200D]/gu;
        const emojis = iconValue.match(emojiRegex);
        if (emojis && emojis.length > 0) {
          result.content[elementKey] = emojis[0];
        } else {
          // Use default emoji
          result.content[elementKey] = '📊';
          result.warnings.push(`${sectionId}: ${elementKey} had invalid icon format, using default`);
        }
      } else {
        result.content[elementKey] = '📊';
      }
    }
    // Special handling for boolean flags
    else if (elementKey.includes('show_')) {
      const value = String(elementValue || 'true').toLowerCase();
      result.content[elementKey] = (value === 'true' || value === 'yes' || value === '1') ? 'true' : 'false';
    }
    // Regular processing for other fields
    else {
      const processedElement = processElement(sectionId, elementKey, elementValue);

      if (processedElement.isValid) {
        result.content[elementKey] = processedElement.value;
      } else {
        result.warnings.push(...processedElement.warnings);
        result.hasIssues = true;
        result.content[elementKey] = processedElement.fallback;
      }
    }
  });

  return result;
}


/**
 * Processes VideoTestimonials content with enterprise focus and video URL validation
 */
function processVideoTestimonialsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = { content: { ...content }, warnings: [] as string[], hasIssues: false };

  // Validate core video testimonial field alignment
  const coreFields = ['video_titles', 'video_descriptions', 'customer_names', 'customer_titles', 'customer_companies'];
  const fieldCounts: Record<string, number> = {};

  coreFields.forEach(field => {
    if (content[field]) {
      const items = content[field].toString().split('|').map(item => item.trim()).filter(Boolean);
      fieldCounts[field] = items.length;
    } else {
      fieldCounts[field] = 0;
    }
  });

  // Check for field count mismatches
  const counts = Object.values(fieldCounts);
  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts.filter(c => c > 0));

  if (maxCount !== minCount && minCount > 0) {
    result.warnings.push(`${sectionId}: Video testimonial field counts don't match (${Object.entries(fieldCounts).map(([k,v]) => `${k}:${v}`).join(', ')})`);
    result.hasIssues = true;
  }

  // Validate video URLs if provided
  if (content.video_urls) {
    const urls = content.video_urls.toString().split('|').map(url => url.trim()).filter(Boolean);
    urls.forEach((url, index) => {
      // Check for valid URL format and common video platforms
      const isValidUrl = /^https?:\/\/.+/.test(url);
      const isSupportedPlatform = /youtube|vimeo|wistia|loom/.test(url.toLowerCase());

      if (!isValidUrl) {
        result.warnings.push(`${sectionId}: Invalid video URL format at position ${index + 1}: "${url}"`);
        result.hasIssues = true;
      } else if (!isSupportedPlatform) {
        result.warnings.push(`${sectionId}: Video URL at position ${index + 1} may not be from a supported platform: "${url}"`);
      }
    });

    // Video URLs should match video count
    const videoCount = fieldCounts['video_titles'] || 0;
    if (urls.length !== videoCount && videoCount > 0) {
      result.warnings.push(`${sectionId}: Video URLs count (${urls.length}) doesn't match video titles count (${videoCount})`);
      result.hasIssues = true;
    }
  }

  // Validate video thumbnails if provided
  if (content.video_thumbnails) {
    const thumbnails = content.video_thumbnails.toString().split('|').map(thumb => thumb.trim()).filter(Boolean);
    const videoCount = fieldCounts['video_titles'] || 0;

    if (thumbnails.length !== videoCount && videoCount > 0) {
      result.warnings.push(`${sectionId}: Video thumbnails count (${thumbnails.length}) doesn't match video titles count (${videoCount})`);
      result.hasIssues = true;
    }
  }

  // Validate enterprise statistics alignment
  const enterpriseFields = ['enterprise_customers_stat', 'enterprise_customers_label', 'uptime_stat', 'uptime_label', 'support_stat', 'support_label'];
  const statPairs = [
    ['enterprise_customers_stat', 'enterprise_customers_label'],
    ['uptime_stat', 'uptime_label'],
    ['support_stat', 'support_label']
  ];

  statPairs.forEach(([statField, labelField]) => {
    const hasStat = content[statField] && content[statField] !== '';
    const hasLabel = content[labelField] && content[labelField] !== '';

    if (hasStat !== hasLabel) {
      result.warnings.push(`${sectionId}: ${statField} and ${labelField} should both be provided or both be empty`);
      result.hasIssues = true;
    }
  });

  return result;
}

/**
 * Generic processing for CTA and Close sections
 */
function processGenericCTAContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process each element normally
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue);

    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value;
    } else {
      result.warnings.push(...processedElement.warnings);
      result.hasIssues = true;
      result.content[elementKey] = processedElement.fallback;
    }
  });

  // Basic validation for CTA sections
  const commonCTAFields = ['headline', 'cta_text', 'subheadline', 'description'];
  let foundFields = 0;

  commonCTAFields.forEach(field => {
    if (result.content[field]) {
      foundFields++;
    }
  });

  if (foundFields === 0) {
    result.warnings.push(`${sectionId}: No common CTA fields found`);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Applies default placeholder values to manual_preferred fields that weren't generated by AI
 * This ensures all manual_preferred fields have appropriate placeholder values
 *
 * @param content - Parsed content from AI response
 * @param pageStore - Page store containing layout and section information
 * @returns Content with default placeholders applied to manual_preferred fields
 */
export function applyManualPreferredDefaults(
  content: Record<string, any>,
  pageStore: any
): Record<string, any> {
  const { getDefaultPlaceholder, needsDefaultValue } = require('../sections/defaultPlaceholders');
  const { layoutElementSchema, isUnifiedSchema } = require('../sections/layoutElementSchema');

  logger.debug('🔧 Applying default placeholders to manual_preferred fields');

  const enhancedContent = { ...content };
  let defaultsApplied = 0;

  // Get section layouts from pageStore
  const sections = pageStore.layout?.sections || [];
  const sectionLayouts = pageStore.layout?.sectionLayouts || {};

  sections.forEach((sectionId: string) => {
    const layoutName = sectionLayouts[sectionId];
    if (!layoutName) {
      logger.debug(`No layout found for section ${sectionId}, skipping defaults`);
      return;
    }

    const schema = layoutElementSchema[layoutName];
    if (!schema) {
      logger.debug(`No schema found for layout ${layoutName}, skipping defaults`);
      return;
    }

    // Get manual_preferred elements from schema
    let manualPreferredElements: string[] = [];

    if (isUnifiedSchema(schema)) {
      // New unified schema format
      const manualSection = schema.sectionElements
        .filter((el: any) => el.generation === 'manual_preferred')
        .map((el: any) => el.element);

      const manualCards = schema.cardStructure && schema.cardStructure.generation === 'manual_preferred'
        ? schema.cardStructure.elements
        : [];

      manualPreferredElements = [...manualSection, ...manualCards];
    } else if (Array.isArray(schema)) {
      // Legacy array format - extract manual_preferred elements
      manualPreferredElements = schema
        .filter((el: any) => el.generation === 'manual_preferred')
        .map((el: any) => el.element || el);
    }

    if (manualPreferredElements.length === 0) {
      return;
    }

    // Ensure section exists in content
    if (!enhancedContent[sectionId]) {
      enhancedContent[sectionId] = { elements: {} };
    }

    if (!enhancedContent[sectionId].elements) {
      enhancedContent[sectionId].elements = {};
    }

    // Apply defaults to manual_preferred elements
    manualPreferredElements.forEach((elementName: string) => {
      const currentValue = enhancedContent[sectionId].elements[elementName];

      // Only apply default if value is missing, empty, or undefined
      if (needsDefaultValue(currentValue)) {
        const defaultValue = getDefaultPlaceholder(elementName);
        enhancedContent[sectionId].elements[elementName] = defaultValue;
        defaultsApplied++;

        logger.debug(`Applied default to ${sectionId}.${elementName}:`, {
          defaultValue: typeof defaultValue === 'object'
            ? JSON.stringify(defaultValue).substring(0, 50) + '...'
            : defaultValue
        });
      }
    });
  });

  logger.debug(`✅ Applied ${defaultsApplied} default placeholders to manual_preferred fields`);

  return enhancedContent;
}
