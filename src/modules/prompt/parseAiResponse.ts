

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

  // Special handling for InlineQnAList sections
  if (sectionId.includes('InlineQnAList')) {
    const processedInlineQnA = processInlineQnAListContent(sectionId, content);
    result.content = processedInlineQnA.content;
    result.warnings = processedInlineQnA.warnings;
    result.hasIssues = processedInlineQnA.hasIssues;
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

  // Special handling for EmojiOutcomeGrid sections
  if (sectionId.includes('EmojiOutcomeGrid')) {
    const processedEmojiGrid = processEmojiOutcomeGridContent(sectionId, content);
    result.content = processedEmojiGrid.content;
    result.warnings = processedEmojiGrid.warnings;
    result.hasIssues = processedEmojiGrid.hasIssues;
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
