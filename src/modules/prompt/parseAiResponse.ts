

interface ParsedResponse {
  success: boolean
  content: Record<string, any>
  isPartial: boolean
  warnings: string[]
  errors: string[]
}

interface SectionContent {
  [key: string]: string | string[]
}

/**
 * Parses and validates AI response for landing page copy generation
 */
export function parseAiResponse(aiContent: string): ParsedResponse {
  const result: ParsedResponse = {
    success: false,
    content: {},
    isPartial: false,
    warnings: [],
    errors: []
  }

  try {
    // Extract JSON from AI response (handle potential markdown code blocks)
    const jsonContent = extractJSON(aiContent)
    if (!jsonContent) {
      result.errors.push("No valid JSON found in AI response")
      return result
    }

    const parsedContent = JSON.parse(jsonContent)
    
    // Validate structure
    const validation = validateContent(parsedContent)
    result.content = validation.content
    result.warnings = validation.warnings
    result.errors = validation.errors
    result.isPartial = validation.isPartial
    result.success = validation.errors.length === 0

    return result

  } catch (error) {
    result.errors.push(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return result
  }
}

/**
 * Extracts JSON from AI response, handling markdown code blocks
 */
function extractJSON(content: string): string | null {
  // Remove potential markdown code blocks
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i
  const codeBlockMatch = content.match(codeBlockRegex)
  
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  // Try to find JSON object directly
  const jsonRegex = /\{[\s\S]*\}/
  const jsonMatch = content.match(jsonRegex)
  
  if (jsonMatch) {
    return jsonMatch[0]
  }

  return null
}

/**
 * Validates and cleans the parsed content
 */
function validateContent(content: any): {
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

  if (!content || typeof content !== 'object') {
    validation.errors.push("Content must be an object")
    return validation
  }

  // Required sections - removed hardcoded requirement
  // Different pages might have different sections based on business rules
  const availableSections = Object.keys(content)
  
  // Only warn if no sections at all
  if (availableSections.length === 0) {
    validation.errors.push('No sections found in content')
    validation.isPartial = true
  }

  // Process each section
  Object.entries(content).forEach(([sectionId, sectionContent]) => {
    if (!sectionContent || typeof sectionContent !== 'object') {
      validation.warnings.push(`Section ${sectionId} has invalid format`)
      validation.isPartial = true
      return
    }

    const processedSection = processSectionContent(sectionId, sectionContent as SectionContent)
    
    if (processedSection.hasIssues) {
      validation.warnings.push(...processedSection.warnings)
      validation.isPartial = true
    }

    validation.content[sectionId] = processedSection.content
  })

  return validation
}

/**
 * Processes and validates individual section content
 */
function processSectionContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

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

  if (sectionId.includes('QuoteStyleAnswers')) {
    const processedQuote = processQuoteStyleAnswersContent(sectionId, content);
    result.content = processedQuote.content;
    result.warnings = processedQuote.warnings;
    result.hasIssues = processedQuote.hasIssues;
    return result;
  }

  if (sectionId.includes('IconWithAnswers')) {
    const processedIcon = processIconWithAnswersContent(sectionId, content);
    result.content = processedIcon.content;
    result.warnings = processedIcon.warnings;
    result.hasIssues = processedIcon.hasIssues;
    return result;
  }

  if (sectionId.includes('TestimonialFAQs')) {
    const processedTestimonial = processTestimonialFAQsContent(sectionId, content);
    result.content = processedTestimonial.content;
    result.warnings = processedTestimonial.warnings;
    result.hasIssues = processedTestimonial.hasIssues;
    return result;
  }

  if (sectionId.includes('ChatBubbleFAQ')) {
    const processedChat = processChatBubbleFAQContent(sectionId, content);
    result.content = processedChat.content;
    result.warnings = processedChat.warnings;
    result.hasIssues = processedChat.hasIssues;
    return result;
  }

  // Special handling for BeforeAfterSlider sections
  if (sectionId.includes('BeforeAfterSlider')) {
    const processedBeforeAfter = processBeforeAfterSliderContent(sectionId, content);
    result.content = processedBeforeAfter.content;
    result.warnings = processedBeforeAfter.warnings;
    result.hasIssues = processedBeforeAfter.hasIssues;
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

  // Special handling for TextListTransformation sections
  if (sectionId.includes('TextListTransformation')) {
    const processedTextList = processTextListTransformationContent(sectionId, content);
    result.content = processedTextList.content;
    result.warnings = processedTextList.warnings;
    result.hasIssues = processedTextList.hasIssues;
    return result;
  }

  // Special handling for remaining BeforeAfter sections
  if (sectionId.includes('StatComparison') || sectionId.includes('StackedTextVisual') ||
      sectionId.includes('VisualStoryline') || sectionId.includes('PersonaJourney') ||
      sectionId.includes('SplitCard')) {
    const processedGeneric = processBeforeAfterGenericContent(sectionId, content);
    result.content = processedGeneric.content;
    result.warnings = processedGeneric.warnings;
    result.hasIssues = processedGeneric.hasIssues;
    return result;
  }

  // Special handling for EmojiOutcomeGrid sections
  if (sectionId.includes('EmojiOutcomeGrid')) {
    const processedEmojiGrid = processEmojiOutcomeGridContent(sectionId, content);
    result.content = processedEmojiGrid.content;
    result.warnings = processedEmojiGrid.warnings;
    result.hasIssues = processedEmojiGrid.hasIssues;
    return result;
  }

  // Special handling for UniqueMechanism sections
  if (sectionId.includes('AlgorithmExplainer')) {
    const processedAlgorithm = processAlgorithmExplainerContent(sectionId, content);
    result.content = processedAlgorithm.content;
    result.warnings = processedAlgorithm.warnings;
    result.hasIssues = processedAlgorithm.hasIssues;
    return result;
  }

  if (sectionId.includes('InnovationTimeline')) {
    const processedTimeline = processInnovationTimelineContent(sectionId, content);
    result.content = processedTimeline.content;
    result.warnings = processedTimeline.warnings;
    result.hasIssues = processedTimeline.hasIssues;
    return result;
  }

  if (sectionId.includes('MethodologyBreakdown')) {
    const processedMethodology = processMethodologyBreakdownContent(sectionId, content);
    result.content = processedMethodology.content;
    result.warnings = processedMethodology.warnings;
    result.hasIssues = processedMethodology.hasIssues;
    return result;
  }

  if (sectionId.includes('ProcessFlowDiagram')) {
    const processedFlow = processProcessFlowDiagramContent(sectionId, content);
    result.content = processedFlow.content;
    result.warnings = processedFlow.warnings;
    result.hasIssues = processedFlow.hasIssues;
    return result;
  }

  if (sectionId.includes('PropertyComparisonMatrix')) {
    const processedMatrix = processPropertyComparisonMatrixContent(sectionId, content);
    result.content = processedMatrix.content;
    result.warnings = processedMatrix.warnings;
    result.hasIssues = processedMatrix.hasIssues;
    return result;
  }

  if (sectionId.includes('SecretSauceReveal')) {
    const processedSecret = processSecretSauceRevealContent(sectionId, content);
    result.content = processedSecret.content;
    result.warnings = processedSecret.warnings;
    result.hasIssues = processedSecret.hasIssues;
    return result;
  }

  if (sectionId.includes('StackedHighlights')) {
    const processedHighlights = processStackedHighlightsContent(sectionId, content);
    result.content = processedHighlights.content;
    result.warnings = processedHighlights.warnings;
    result.hasIssues = processedHighlights.hasIssues;
    return result;
  }

  if (sectionId.includes('SystemArchitecture')) {
    const processedArchitecture = processSystemArchitectureContent(sectionId, content);
    result.content = processedArchitecture.content;
    result.warnings = processedArchitecture.warnings;
    result.hasIssues = processedArchitecture.hasIssues;
    return result;
  }

  if (sectionId.includes('TechnicalAdvantage')) {
    const processedAdvantage = processTechnicalAdvantageContent(sectionId, content);
    result.content = processedAdvantage.content;
    result.warnings = processedAdvantage.warnings;
    result.hasIssues = processedAdvantage.hasIssues;
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
    'titles', 'descriptions', 'quotes', 'names',
    'items', 'labels', 'steps', 'list'
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
    quote: { min: 20, max: 200, severity: 'warning' }
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
    
    // Array fallbacks
    feature_titles: ["Feature 1", "Feature 2", "Feature 3"],
    feature_descriptions: ["Benefit description 1", "Benefit description 2", "Benefit description 3"],
    testimonial_quotes: ["Great product!", "Highly recommended", "Best investment we made"],
    questions: ["How does it work?", "Is it secure?", "What's included?"],
    answers: ["It works seamlessly", "Yes, enterprise-grade security", "Everything you need"]
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

  // Check if content uses legacy pipe-separated format
  const hasLegacyFormat = content.questions && content.answers;
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

  if (typeof content.questions === 'string' && typeof content.answers === 'string') {
    const questions = content.questions.split('|').map(q => q.trim()).filter(Boolean);
    const answers = content.answers.split('|').map(a => a.trim()).filter(Boolean);

    // Convert up to 6 Q&A pairs
    const maxPairs = Math.min(questions.length, answers.length, 6);

    for (let i = 0; i < maxPairs; i++) {
      converted[`question_${i + 1}`] = questions[i];
      converted[`answer_${i + 1}`] = answers[i] || '';
    }
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

  // Check for legacy format and convert
  const hasLegacyFormat = content.questions && content.answers;
  const hasIndividualFields = Object.keys(content).some(key =>
    key.startsWith('question_') || key.startsWith('answer_')
  );

  if (hasLegacyFormat && !hasIndividualFields) {
    const convertedContent = convertLegacyToIndividualFields(content);
    result.warnings.push(`${sectionId}: Converted legacy pipe-separated format to individual Q&A fields`);
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

  // Check for legacy format conversion
  const hasLegacyFormat = content.questions && content.answers;
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

  // Check for legacy format conversion
  const hasLegacyFormat = content.tab_labels || content.questions;
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

/**
 * Special processing for QuoteStyleAnswers sections
 */
function processQuoteStyleAnswersContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for legacy format conversion
  const hasLegacyFormat = content.questions && content.quote_answers;
  if (hasLegacyFormat) {
    const convertedContent = convertQuoteStyleLegacyFormat(content);
    result.warnings.push(`${sectionId}: Converted legacy format to individual quote Q&A fields`);
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

  // Validate quote Q&A triads (question, quote_answer, attribution)
  const quoteValidation = validateQuoteQnATriads(result.content);
  if (quoteValidation.warnings.length > 0) {
    result.warnings.push(...quoteValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for IconWithAnswers sections
 */
function processIconWithAnswersContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for legacy format conversion
  const hasLegacyFormat = content.questions && content.answers;
  if (hasLegacyFormat) {
    const convertedContent = convertIconFAQLegacyFormat(content);
    result.warnings.push(`${sectionId}: Converted legacy format to individual icon Q&A fields`);
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

  // Validate icon Q&A triads (question, answer, icon)
  const iconValidation = validateIconQnATriads(result.content);
  if (iconValidation.warnings.length > 0) {
    result.warnings.push(...iconValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for TestimonialFAQs sections
 */
function processTestimonialFAQsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for legacy format conversion
  const hasLegacyFormat = content.questions && content.testimonial_answers;
  if (hasLegacyFormat) {
    const convertedContent = convertTestimonialFAQLegacyFormat(content);
    result.warnings.push(`${sectionId}: Converted legacy format to individual testimonial Q&A fields`);
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

  // Validate testimonial structure
  const testimonialValidation = validateTestimonialQnAStructure(result.content);
  if (testimonialValidation.warnings.length > 0) {
    result.warnings.push(...testimonialValidation.warnings);
    result.hasIssues = true;
  }

  return result;
}

/**
 * Special processing for ChatBubbleFAQ sections
 */
function processChatBubbleFAQContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Check for legacy format conversion
  const hasLegacyFormat = content.questions && content.answers;
  if (hasLegacyFormat) {
    const convertedContent = convertChatBubbleLegacyFormat(content);
    result.warnings.push(`${sectionId}: Converted legacy format to individual chat Q&A fields`);
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

  // Validate chat conversation structure
  const chatValidation = validateChatQnAStructure(result.content);
  if (chatValidation.warnings.length > 0) {
    result.warnings.push(...chatValidation.warnings);
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

  if (typeof content.questions === 'string' && typeof content.answers === 'string') {
    const questions = content.questions.split('|').map(q => q.trim()).filter(Boolean);
    const answers = content.answers.split('|').map(a => a.trim()).filter(Boolean);

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
  }

  return converted;
}

/**
 * Converts segmented tabs legacy format to individual fields
 */
function convertSegmentedTabsLegacyFormat(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  if (typeof content.tab_labels === 'string') {
    const labels = content.tab_labels.split('|').map(l => l.trim()).filter(Boolean);
    for (let i = 0; i < Math.min(labels.length, 3); i++) {
      converted[`tab_${i + 1}_label`] = labels[i];
    }
  }

  if (typeof content.questions === 'string' && typeof content.answers === 'string') {
    const questions = content.questions.split('|').map(q => q.trim()).filter(Boolean);
    const answers = content.answers.split('|').map(a => a.trim()).filter(Boolean);

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
  }

  return converted;
}

/**
 * Converts quote style legacy format to individual fields
 */
function convertQuoteStyleLegacyFormat(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  if (typeof content.questions === 'string' && typeof content.quote_answers === 'string') {
    const questions = content.questions.split('|').map(q => q.trim()).filter(Boolean);
    const quotes = content.quote_answers.split('|').map(q => q.trim()).filter(Boolean);
    const attributions = typeof content.quote_attributions === 'string'
      ? content.quote_attributions.split('|').map(a => a.trim()).filter(Boolean)
      : [];

    const maxItems = Math.min(questions.length, quotes.length, 5);
    for (let i = 0; i < maxItems; i++) {
      converted[`question_${i + 1}`] = questions[i];
      converted[`quote_answer_${i + 1}`] = quotes[i];
      converted[`attribution_${i + 1}`] = attributions[i] || 'Anonymous';
    }
  }

  return converted;
}

/**
 * Converts icon FAQ legacy format to individual fields
 */
function convertIconFAQLegacyFormat(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  if (typeof content.questions === 'string' && typeof content.answers === 'string') {
    const questions = content.questions.split('|').map(q => q.trim()).filter(Boolean);
    const answers = content.answers.split('|').map(a => a.trim()).filter(Boolean);
    const icons = typeof content.icon_labels === 'string'
      ? content.icon_labels.split('|').map(i => i.trim()).filter(Boolean)
      : [];

    const maxItems = Math.min(questions.length, answers.length, 6);
    for (let i = 0; i < maxItems; i++) {
      converted[`question_${i + 1}`] = questions[i];
      converted[`answer_${i + 1}`] = answers[i];
      converted[`icon_${i + 1}`] = icons[i] || '❓';
    }
  }

  return converted;
}

/**
 * Converts testimonial FAQ legacy format to individual fields
 */
function convertTestimonialFAQLegacyFormat(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  if (typeof content.questions === 'string' && typeof content.testimonial_answers === 'string') {
    const questions = content.questions.split('|').map(q => q.trim()).filter(Boolean);
    const testimonials = content.testimonial_answers.split('|').map(t => t.trim()).filter(Boolean);
    const names = typeof content.customer_names === 'string'
      ? content.customer_names.split('|').map(n => n.trim()).filter(Boolean)
      : [];
    const titles = typeof content.customer_titles === 'string'
      ? content.customer_titles.split('|').map(t => t.trim()).filter(Boolean)
      : [];

    const maxItems = Math.min(questions.length, testimonials.length, 5);
    for (let i = 0; i < maxItems; i++) {
      converted[`question_${i + 1}`] = questions[i];
      converted[`testimonial_answer_${i + 1}`] = testimonials[i];
      converted[`customer_name_${i + 1}`] = names[i] || 'Anonymous Customer';
      if (titles[i]) {
        converted[`customer_title_${i + 1}`] = titles[i];
      }
    }
  }

  return converted;
}

/**
 * Converts chat bubble legacy format to individual fields
 */
function convertChatBubbleLegacyFormat(content: SectionContent): SectionContent {
  const converted: SectionContent = {};

  if (typeof content.questions === 'string' && typeof content.answers === 'string') {
    const questions = content.questions.split('|').map(q => q.trim()).filter(Boolean);
    const answers = content.answers.split('|').map(a => a.trim()).filter(Boolean);
    const personas = typeof content.chat_personas === 'string'
      ? content.chat_personas.split('|').map(p => p.trim()).filter(Boolean)
      : [];

    const maxItems = Math.min(questions.length, answers.length, 5);
    for (let i = 0; i < maxItems; i++) {
      converted[`question_${i + 1}`] = questions[i];
      converted[`answer_${i + 1}`] = answers[i];
      if (personas[i]) {
        converted[`persona_${i + 1}`] = personas[i];
      }
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
 * Validates quote Q&A triads
 */
function validateQuoteQnATriads(content: SectionContent): { warnings: string[] } {
  const warnings: string[] = [];

  for (let i = 1; i <= 5; i++) {
    const question = content[`question_${i}`];
    const quote = content[`quote_answer_${i}`];
    const attribution = content[`attribution_${i}`];

    if (question && !quote) {
      warnings.push(`Question ${i} has no corresponding quote answer`);
    }
    if (quote && !question) {
      warnings.push(`Quote answer ${i} has no corresponding question`);
    }
    if (quote && !attribution) {
      warnings.push(`Quote answer ${i} has no attribution`);
    }
  }

  return { warnings };
}

/**
 * Validates icon Q&A triads
 */
function validateIconQnATriads(content: SectionContent): { warnings: string[] } {
  const warnings: string[] = [];

  for (let i = 1; i <= 6; i++) {
    const question = content[`question_${i}`];
    const answer = content[`answer_${i}`];
    const icon = content[`icon_${i}`];

    if (question && !answer) {
      warnings.push(`Question ${i} has no corresponding answer`);
    }
    if (answer && !question) {
      warnings.push(`Answer ${i} has no corresponding question`);
    }
    if (question && !icon) {
      warnings.push(`Question ${i} has no corresponding icon`);
    }
  }

  return { warnings };
}

/**
 * Validates testimonial Q&A structure
 */
function validateTestimonialQnAStructure(content: SectionContent): { warnings: string[] } {
  const warnings: string[] = [];

  for (let i = 1; i <= 5; i++) {
    const question = content[`question_${i}`];
    const testimonial = content[`testimonial_answer_${i}`];
    const name = content[`customer_name_${i}`];

    if (question && !testimonial) {
      warnings.push(`Question ${i} has no corresponding testimonial answer`);
    }
    if (testimonial && !question) {
      warnings.push(`Testimonial answer ${i} has no corresponding question`);
    }
    if (testimonial && !name) {
      warnings.push(`Testimonial answer ${i} has no customer name`);
    }
  }

  return { warnings };
}

/**
 * Validates chat Q&A structure
 */
function validateChatQnAStructure(content: SectionContent): { warnings: string[] } {
  const warnings: string[] = [];

  for (let i = 1; i <= 5; i++) {
    const question = content[`question_${i}`];
    const answer = content[`answer_${i}`];

    if (question && !answer) {
      warnings.push(`Chat question ${i} has no corresponding answer`);
    }
    if (answer && !question) {
      warnings.push(`Chat answer ${i} has no corresponding question`);
    }
  }

  return { warnings };
}

/**
 * Special processing for BeforeAfterSlider sections
 */
function processBeforeAfterSliderContent(sectionId: string, content: SectionContent): {
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
          } else if (elementKey === 'hint_icon') {
            result.content[elementKey] = '👆';
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
        } else if (elementKey === 'hint_icon') {
          result.content[elementKey] = '👆';
        } else {
          result.content[elementKey] = '';
        }
      }
    }
    // Special handling for boolean flags
    else if (elementKey === 'show_interaction_hint') {
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
 * Special processing for TextListTransformation sections
 */
function processTextListTransformationContent(sectionId: string, content: SectionContent): {
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
    // Special handling for list fields (pipe-separated)
    if (elementKey === 'before_list' || elementKey === 'after_list') {
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        // Already pipe-separated, validate format
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length > 0) {
          result.content[elementKey] = items.join('|');
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
    // Special handling for trust_items field (pipe-separated)
    else if (elementKey === 'trust_items') {
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
            result.content[elementKey] = '❌';
          } else if (elementKey === 'after_icon') {
            result.content[elementKey] = '✅';
          } else if (elementKey === 'transformation_icon') {
            result.content[elementKey] = '➡️';
          } else {
            result.content[elementKey] = '📌';
          }
          result.warnings.push(`${sectionId}: ${elementKey} had invalid icon format, using default`);
        }
      } else {
        // Set defaults for empty icons
        if (elementKey === 'before_icon') {
          result.content[elementKey] = '❌';
        } else if (elementKey === 'after_icon') {
          result.content[elementKey] = '✅';
        } else if (elementKey === 'transformation_icon') {
          result.content[elementKey] = '➡️';
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
 * Special processing for EmojiOutcomeGrid sections to handle pipe-separated format
 */
function processEmojiOutcomeGridContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields normally
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    // Handle pipe-separated fields
    if (elementKey === 'emojis' || elementKey === 'outcomes' || elementKey === 'descriptions') {
      // Ensure it's a string and convert to pipe-separated format if needed
      let processedValue: string = '';

      if (Array.isArray(elementValue)) {
        // Convert array to pipe-separated string
        processedValue = elementValue.join('|');
        result.warnings.push(`${sectionId}: Converted array to pipe-separated format for ${elementKey}`);
      } else if (typeof elementValue === 'string') {
        // Already a string, use as-is
        processedValue = elementValue;
      } else {
        // Invalid format
        result.warnings.push(`${sectionId}: Invalid format for ${elementKey}, expected string or array`);
        result.hasIssues = true;
        processedValue = '';
      }

      result.content[elementKey] = processedValue;
    } else {
      // Process other fields normally
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

  // Validate matching counts for emojis, outcomes, and descriptions
  const emojiValidation = validateEmojiOutcomeGridData(result.content);
  if (emojiValidation.warnings.length > 0) {
    result.warnings.push(...emojiValidation.warnings);
    // Apply corrections if needed
    if (emojiValidation.corrected) {
      Object.assign(result.content, emojiValidation.corrected);
      result.warnings.push(`${sectionId}: Applied automatic correction to match emoji/outcome/description counts`);
    }
  }

  return result;
}

/**
 * Validates EmojiOutcomeGrid data consistency
 */
function validateEmojiOutcomeGridData(content: SectionContent): {
  warnings: string[];
  corrected?: SectionContent;
} {
  const warnings: string[] = [];
  let corrected: SectionContent | undefined;

  // Get the pipe-separated values
  const emojis = typeof content.emojis === 'string' ? content.emojis.split('|').filter(Boolean) : [];
  const outcomes = typeof content.outcomes === 'string' ? content.outcomes.split('|').filter(Boolean) : [];
  const descriptions = typeof content.descriptions === 'string' ? content.descriptions.split('|').filter(Boolean) : [];

  // Check if counts match
  const maxCount = Math.max(emojis.length, outcomes.length, descriptions.length);
  const minCount = Math.min(emojis.length, outcomes.length, descriptions.length);

  if (maxCount !== minCount && maxCount > 0) {
    warnings.push(`Mismatched counts: ${emojis.length} emojis, ${outcomes.length} outcomes, ${descriptions.length} descriptions`);

    // Auto-correct by trimming to minimum count or filling with defaults
    if (minCount > 0) {
      corrected = {
        emojis: emojis.slice(0, minCount).join('|'),
        outcomes: outcomes.slice(0, minCount).join('|'),
        descriptions: descriptions.slice(0, minCount).join('|')
      };
    } else {
      // If any is empty, provide defaults
      const defaultCount = maxCount || 3;
      const defaultEmojis = ['🚀', '💡', '⭐', '🎯', '📈', '✨'];
      const defaultOutcomes = ['Amazing Result', 'Great Outcome', 'Success Achieved', 'Goal Reached', 'Milestone Hit', 'Victory Won'];
      const defaultDescriptions = ['Experience incredible improvements', 'See remarkable transformations', 'Achieve outstanding results', 'Reach new heights', 'Unlock new potential', 'Discover new possibilities'];

      corrected = {
        emojis: emojis.length === 0 ? defaultEmojis.slice(0, defaultCount).join('|') : content.emojis,
        outcomes: outcomes.length === 0 ? defaultOutcomes.slice(0, defaultCount).join('|') : content.outcomes,
        descriptions: descriptions.length === 0 ? defaultDescriptions.slice(0, defaultCount).join('|') : content.descriptions
      };
    }
  }

  return { warnings, corrected };
}

/**
 * UniqueMechanism section processing functions
 */

function processAlgorithmExplainerContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Convert legacy algorithm_steps format if exists
  if (content.algorithm_steps && typeof content.algorithm_steps === 'string' && content.algorithm_steps.includes('|')) {
    const steps = content.algorithm_steps.split('|').map(step => step.trim()).filter(Boolean);

    steps.forEach((step, index) => {
      result.content[`algorithm_step_${index + 1}`] = step;
    });

    result.warnings.push(`${sectionId}: Converted legacy algorithm_steps to individual step fields`);
    delete content.algorithm_steps; // Remove to avoid double processing
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

  return result;
}

function processInnovationTimelineContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Convert legacy timeline_items format if exists
  if (content.timeline_items && typeof content.timeline_items === 'string' && content.timeline_items.includes('|')) {
    const items = content.timeline_items.split('|').map(item => item.trim()).filter(Boolean);

    items.forEach((item, index) => {
      result.content[`timeline_item_${index + 1}`] = item;
    });

    result.warnings.push(`${sectionId}: Converted legacy timeline_items to individual item fields`);
    delete content.timeline_items; // Remove to avoid double processing
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

  return result;
}

function processMethodologyBreakdownContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Convert legacy formats if they exist
  if (content.key_principles && typeof content.key_principles === 'string' && content.key_principles.includes('|')) {
    const principles = content.key_principles.split('|').map(p => p.trim()).filter(Boolean);
    principles.forEach((principle, index) => {
      result.content[`principle_${index + 1}`] = principle;
    });
    result.warnings.push(`${sectionId}: Converted legacy key_principles to individual principle fields`);
    delete content.key_principles;
  }

  if (content.principle_details && typeof content.principle_details === 'string' && content.principle_details.includes('|')) {
    const details = content.principle_details.split('|').map(d => d.trim()).filter(Boolean);
    details.forEach((detail, index) => {
      result.content[`detail_${index + 1}`] = detail;
    });
    result.warnings.push(`${sectionId}: Converted legacy principle_details to individual detail fields`);
    delete content.principle_details;
  }

  if (content.result_metrics && typeof content.result_metrics === 'string' && content.result_metrics.includes('|')) {
    const metrics = content.result_metrics.split('|').map(m => m.trim()).filter(Boolean);
    metrics.forEach((metric, index) => {
      result.content[`result_metric_${index + 1}`] = metric;
    });
    result.warnings.push(`${sectionId}: Converted legacy result_metrics to individual metric fields`);
    delete content.result_metrics;
  }

  if (content.result_labels && typeof content.result_labels === 'string' && content.result_labels.includes('|')) {
    const labels = content.result_labels.split('|').map(l => l.trim()).filter(Boolean);
    labels.forEach((label, index) => {
      result.content[`result_label_${index + 1}`] = label;
    });
    result.warnings.push(`${sectionId}: Converted legacy result_labels to individual label fields`);
    delete content.result_labels;
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

  return result;
}

function processProcessFlowDiagramContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields with special handling for pipe-separated fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    if (elementKey === 'process_steps' || elementKey === 'step_descriptions' ||
        elementKey === 'benefit_titles' || elementKey === 'benefit_descriptions') {
      // Ensure pipe-separated format
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length >= 2) {
          result.content[elementKey] = items.join(' | ');
        } else {
          result.warnings.push(`${sectionId}: ${elementKey} should have at least 2 items`);
          result.hasIssues = true;
          result.content[elementKey] = elementValue;
        }
      } else if (Array.isArray(elementValue)) {
        result.content[elementKey] = elementValue.filter(item => item && item.trim()).join(' | ');
      } else {
        result.content[elementKey] = String(elementValue || '');
      }
    } else {
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

function processPropertyComparisonMatrixContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields with special handling for pipe-separated comparison fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    if (elementKey === 'properties' || elementKey === 'us_values' || elementKey === 'competitors_values') {
      // Ensure pipe-separated format
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length >= 3) {
          result.content[elementKey] = items.join(' | ');
        } else {
          result.warnings.push(`${sectionId}: ${elementKey} should have at least 3 comparison points`);
          result.hasIssues = true;
          result.content[elementKey] = elementValue;
        }
      } else if (Array.isArray(elementValue)) {
        result.content[elementKey] = elementValue.filter(item => item && item.trim()).join(' | ');
      } else {
        result.content[elementKey] = String(elementValue || '');
      }
    } else {
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

function processSecretSauceRevealContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

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

  return result;
}

function processStackedHighlightsContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields with special handling for pipe-separated highlight fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    if (elementKey === 'highlight_titles' || elementKey === 'highlight_descriptions') {
      // Ensure pipe-separated format
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length >= 3) {
          result.content[elementKey] = items.join(' | ');
        } else {
          result.warnings.push(`${sectionId}: ${elementKey} should have at least 3 highlights`);
          result.hasIssues = true;
          result.content[elementKey] = elementValue;
        }
      } else if (Array.isArray(elementValue)) {
        result.content[elementKey] = elementValue.filter(item => item && item.trim()).join(' | ');
      } else {
        result.content[elementKey] = String(elementValue || '');
      }
    } else {
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

function processSystemArchitectureContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Convert legacy architecture_components format if exists
  if (content.architecture_components && typeof content.architecture_components === 'string' && content.architecture_components.includes('|')) {
    const components = content.architecture_components.split('|').map(comp => comp.trim()).filter(Boolean);

    components.forEach((component, index) => {
      result.content[`component_${index + 1}`] = component;
    });

    result.warnings.push(`${sectionId}: Converted legacy architecture_components to individual component fields`);
    delete content.architecture_components; // Remove to avoid double processing
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

  return result;
}

function processTechnicalAdvantageContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  // Process all fields with special handling for pipe-separated advantage fields
  Object.entries(content).forEach(([elementKey, elementValue]) => {
    if (elementKey === 'advantages' || elementKey === 'advantage_descriptions') {
      // Ensure pipe-separated format
      if (typeof elementValue === 'string' && elementValue.includes('|')) {
        const items = elementValue.split('|').map(item => item.trim()).filter(Boolean);
        if (items.length >= 3) {
          result.content[elementKey] = items.join(' | ');
        } else {
          result.warnings.push(`${sectionId}: ${elementKey} should have at least 3 advantages`);
          result.hasIssues = true;
          result.content[elementKey] = elementValue;
        }
      } else if (Array.isArray(elementValue)) {
        result.content[elementKey] = elementValue.filter(item => item && item.trim()).join(' | ');
      } else {
        result.content[elementKey] = String(elementValue || '');
      }
    } else {
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
